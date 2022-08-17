const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const multer = require('multer');
const sharp = require('sharp');
const randexp = require('randexp').randexp;
const fs = require('fs');

const Image = require('../models/images');
const Post = require('../models/posts');
const Cluster = require('../models/clusters');
const imagesDestination = './images/';
const { internalServerError, invalidDataError } = require('./response');

// storage for multer files
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, imagesDestination);
  },
  filename: function(req, file, cb) {
    const filename = file.originalname;
    if (fs.existsSync(imagesDestination + filename)) {
      const name = filename.slice(0, filename.lastIndexOf('.'));
      const extension = filename.slice(filename.lastIndexOf('.'), );
      cb(null, (name + randexp(/[a-zA-Z0-9]/) + extension));
    } else {
      cb(null, filename);
    }
  }
});

// multer file filter
const fileFilter = (req, file, cb) => {
  if(file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
    // accept a file
    cb(null, true);
  } else {
    // reject a file
    cb(new Error('Wrong filetype, only jpg/png are accepted'), false);
  }
};

// multer instance
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 100
  },
  fileFilter: fileFilter
});

// returns promised image, takes image name and expected height
const resizeImage = (inputImage, height) => {
  const image = sharp(imagesDestination + inputImage, { failOnError: false });
  return image
    .metadata()
    .then(metadata => {
      const x = metadata.height / height;
      const imageWidth = Math.round(metadata.width / x);
      return image
        .resize(imageWidth, height)
        .withMetadata({orientation: metadata.orientation})
        .jpeg()
        .toBuffer();
    })
}

// middleware: If cluster name is provided and DOESNT EXIST in DB call next()
const validateClusterName = (req, res, next) => {
  if (!req.body.clusterName) {
    return invalidDataError(res, 'function validateClusterName', 'Cluster name was not provided');
  }
  Cluster
    .findOne({clusterName: req.body.clusterName})
    .then(cluster => {
      if (cluster) {
        invalidDataError(res, 'function validateClusterName', 'Cluster name already exists!');
      } else {
        next();
      }
    })
    .catch(err => {
      internalServerError(res, err, 'function validateClusterName');
    })
}

// middleware: If cluster URI is provided and DOESNT EXIST in DB call next()
const validateClusterURI = (req, res, next) => {
  if (!req.body.clusterURI) {
    return invalidDataError(res, 'function validateClusterURI', 'Cluster URI was not provided');
  }
  Cluster
    .findOne({clusterURI: req.body.clusterURI})
    .then(cluster => {
      if (cluster) {
        invalidDataError(res, 'function validateClusterURI', 'Cluster URI already exists!');
      } else {
        next();
      }
    })
    .catch(err => {
      internalServerError(res, err, 'function validateClusterURI');
    })
}

// middleware: If ID is valid mongoose ObjctId and EXISTS in DB call next()
const validateClusterId = (req, res, next) => {
  if (mongoose.Types.ObjectId.isValid(req.params.clusterid)) {
    Cluster
      .findOne({_id: req.params.clusterid})
      .then(result => {
        console.log(result);
        if (result) {
          next();
        } else {
          invalidDataError(res, 'function validateClusterId', 'Invalid cluster id');
        }
      })
      .catch(err => {
        internalServerError(res, err, 'function validateClusterId');
      });
  } else {
    invalidDataError(res, 'function validateClusterId', 'Invalid cluster id');
  }
}

// middleware: Saves images data (array of objects) in database
const saveImagesInDB = (req, res, next) => {
  const imageObjects = req.files.map((image, index) => {
    const fullImageName = image.filename;
    const indexOfLastDot = fullImageName.lastIndexOf('.');
    const imageName = fullImageName.slice(0, indexOfLastDot);
    const extension = fullImageName.slice(indexOfLastDot + 1, );
    return {
      _id: new mongoose.Types.ObjectId(),
      image: fullImageName,
      imageName: imageName,
      extension: extension,
      clusterId: req.params.clusterid
    }
  });
  Image
    .create(imageObjects)
    .then(result => {
      next();
    })
    .catch(err => {
      internalServerError(res, err, 'function saveImagesInDB');
    });
}

// sends array of image full names (filename.extension) associated with closterID provided
router.get('/', (req, res) => {
  Image
    .find({ clusterId: req.body.clusterId })
    .select('image')
    .then(docs => {
      const arrayOfImageNames = docs.map((obj, index) => {
        return obj.image
      })
      res.status(200).json(arrayOfImageNames);
    })
    .catch(err => {
      internalServerError(res, err, 'route get("/")');
    });
});

// sends single image, provide name and resulting height
router.get('/one/:size/:image', (req, res) => {
  let size = req.params.size;
  try {
    size = parseInt(size);
  } catch {
    return invalidDataError(res, 'route get("/one/:size/:image")', 'Invalid size parameter');
  }
  const image = req.params.image;
  resizeImage(image, size)
    .then(data => {
      res.type('jpeg').send(data);
    })
    .catch(err => {
      internalServerError(res, err, 'route get("/one/:size/:image")');
    });
});

// sends all clusters available
router.get('/clusters', (req, res) => {
  Cluster
    .find()
    .select('_id clusterName clusterURI timestampStart timestampEnd')
    .then(result => {
      res.status(200).send(result);
    })
    .catch(err => {
      internalServerError(res, err, 'route get("/clusters")');
    });
});

// sends all clusters available
router.get('/clusters/:clusteruri', (req, res) => {
  if (!req.params.clusteruri) {
    return invalidDataError(res, 'route get("/clusters/:clusteruri")', 'cluster URI was not provided');
  }
  Cluster
    .findOne({ clusterURI: req.params.clusteruri})
    .select('_id clusterName clusterURI timestampStart timestampEnd')
    .then(result => {
      if (result) {
        res.status(200).send(result);
      } else {
        invalidDataError(res, 'route get("/clusters/:clusteruri")', 'Invalid cluster URI');
      }
    })
    .catch(err => {
      internalServerError(res, err, 'route get("/clusters")');
    });
});

// saves image object in mongo and images on server
// validateClusterId, saveImagesInDB, upload.any('images'),
router.post('/images/:clusterid', validateClusterId, upload.any(), saveImagesInDB, (req, res) => {
  res.status(201).json({
    message: 'Images posted successfully'
  })
});

// saves a new cluster
router.post('/clusters', validateClusterName, validateClusterURI, (req, res) => {
  const cluster = new Cluster({
    _id: new mongoose.Types.ObjectId(),
    clusterName: req.body.clusterName,
    clusterURI: req.body.clusterURI,
    timestampStart: req.body.timestampStart || 0,
    timestampEnd: req.body.timestampEnd || 0
  });
  cluster
    .save()
    .then(result => {
      res.status(201).json({
        message: 'New cluster created successfully',
        cluster: {
          _id: result._id,
          clusterName: result.clusterName,
          clusterURI: result.clusterURI,
          timestampStart: result.timestampStart,
          timestampEnd: result.timestampEnd
        }
      });
    })
    .catch(err => {
      if (err.message === 'Cluster already exists!') {
        invalidDataError(res, 'route post("/clusters")', 'Cluster already exists!');
      } else {
        internalServerError(res, err, 'route post("/clusters")');
      }
    });
});

// creates post
router.post('/post', upload.any('images'), (req, res) => {
  let timestamp = req.body.timestamp;
  // if (timestamp === 'undefined') {
  //   timestamp = 0;
  // }

  const description = new Description({
    _id: new mongoose.Types.ObjectId(),
    title: req.body.title,
    category: req.body.category,
    description: req.body.description,
    timestamp: timestamp,
    location: {
      country: req.body.country,
      city: req.body.city,
      place: req.body.place,
    }
  });

  description.save()
    .then((result) => {
      const filenames = req.files.map((item, index) => {
        return {
          _id: new mongoose.Types.ObjectId(),
          fileName: item.filename,
          descriptionID: result._id
        }
      });

      File.create(filenames).then((result2) => {
        res.status(201).json({
          message: "Description created successfully",
          createdDescription: {
            title: result.title,
            description: result.description,
            timestamp: result.timestamp,
            location: {
              country: result.location.country,
              city: result.location.city,
              place: result.location.place,
            }
          },
          createdImage: {
            fileName: result2.fileName,
            descriptionID: result2.descriptionID
          }
        });
      })
      .catch((err) => {
        return err;
      });
    })
    .catch(err => {
      console.log(err);
      res.status(500).json({
        err: err
      });
    });
});


module.exports = router;

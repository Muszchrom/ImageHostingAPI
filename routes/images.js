const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const multer = require('multer');

const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, './images/');
  },
  filename: function(req, file, cb) {
    cb(null, file.originalname);
  }
});

const fileFilter = (req, file, cb) => {
  if(file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
    // accept a file
    cb(null, true);
  } else {
    // reject a file
    cb(new Error('Wrong filetype, only jpg/png are accepted'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 100
  },
  fileFilter: fileFilter
});

const Post = require('../models/posts');
const File = require('../models/files');

router.get('/', (req, res, next) => {
  // select tells mongoose that we want to fetch these fields
  File.find().select('fileName')
    .then(docs => {
      const arrayOfImageNames = docs.map((obj, index) => {
        return obj.fileName
      })
      res.status(200).json(arrayOfImageNames);
    })
    .catch(err => {
      console.log(err);
      res.status(500).json({
        err: err
      });
    });
})
router.post('/', upload.any('images'), (req, res, next) => {
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

// localhost:5000/images/group/five/greece
router.get('/group/five/:thing', (req, res, next) => {
  File.find()
    .then((docs) => {
      res.status(200).json({
        message: "git",
        images: docs
      });
    })
    .catch((err) => {
      res.status(500).json({
        err: err
      })
    })
})

router.put('/:id', (req, res, next) => {
  res.send('Put request!');
})
router.delete('/:id', (req, res, next) => {
  res.send('Del request!');
})

module.exports = router;

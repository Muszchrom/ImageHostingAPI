const express = require('express');
const morgan = require('morgan');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');

const images = require('./routes/images.js');
const {authRouter, verifyToken } = require('./routes/auth');

const app = express();
const port = process.env.PORT || 5000;

// connect to mongo
mongoose.connect(
  "mongodb+srv://" +
  process.env.MONGO_UNAME +
  ":" + process.env.MONGO_PSSWD +
  "@cluster0.jxglz.mongodb.net/?retryWrites=true&w=majority"
).then(result => {
  console.log("Connected to mongo successfully");
}).catch(err => {
  console.log(err);
});

app.use(morgan('dev'));
app.use(cookieParser());

// enable CORS
// allow PUT, POST, PATCH, DELETE, GET
app.use((req, res, next) => {
  // You can replace * with your domain name to allow api usage only there
  res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.header('Access-Control-Allow-Credentials', true);
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization'
  );
  res.header('Access-Control-Allow-Methods', 'PUT, POST, PATCH, DELETE, GET');
  if (req.method === 'OPTIONS') {
    return res.status(200).json({});
  }
  next();
});


// enable urlencoded things eg html forms data (FOR POST/PUT)
// if this thing wasnt there then printing req.body will return undefined (when postman is set to x-www-form-urlencoded)
app.use(express.urlencoded({ extended: false }));

// enable middleware that lets you preview JSON data that was sent to you (FOR POST/PUT)
// in postman set datatype to raw and JSON
app.use(express.json());

// Hosting static files like images
// localhost:5000/images/image.jpg
// 'images' param is directory where files are stored
app.use('/static/images', [verifyToken, express.static('images')]);

// Simple Routes from routes file
app.use('/images', [verifyToken, images]);

// Routes from auth file
app.use('/auth', authRouter);

// Start listening
app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});

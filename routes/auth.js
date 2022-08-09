const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const saltRounds = 10;

const User = require('../models/users');

const internalServerError = (res, err, at) => {
  return res.status(500).json({
    error: err,
    message: "Internal server error at " + at
  })
}

const verifyToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1] || req.cookies.token;
    if (token) {
      jwt.verify(token, process.env.JWT_KEY, (err, data) => {
        if (err) {
          console.log(err);
          res.status(403).json({
            message: "Access Forbidden"
          });
        } else {
          next();
        }
      });
    } else {
      res.status(403).json({
        message: "Access Forbidden"
      });
    }
}

router.get('/verify-token', (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1] || req.cookies.token;
  if (token) {
    jwt.verify(token, process.env.JWT_KEY, (err, data) => {
      if (err) {
        res.status(403).json({
          message: "Access Forbidden"
        });
      } else {
        res.status(200).json({
          message: "Access granted"
        })
      }
    });
  } else {
    res.status(403).json({
      message: "Access Forbidden"
    });
  }
})

/*
Log in route
gets username and password first looking for user in database, if one exists it false to the next then()
if user is found, passwords are compared with bcrypt, in case they dont match, bcrypt returns false same as if statement above
so that we can send response in one then() cell
*/
router.post('/login', (req, res, next) => {
  console.log('Creds', req.body.username, req.body.password);
  User.findOne({username: req.body.username})
    .then(user => {
      console.log(user, req.body.username);
      if (!user) {
        return false;
      } else {
        const password = req.body.password;
        const hash = user.password;
        return bcrypt.compare(password, hash);
      }
    })
    .then(result => {
      if (result) {
        const token = jwt.sign({userId: result._id}, process.env.JWT_KEY, { expiresIn: process.env.JWT_EXPIRES_IN});
        // !!!WARNING: IN PRODUCTION CHANGE SECURE TO TRUE
        /*
        httpOnly: true,
        secure: false,
        signed: true
        7200000 is 2h
        */
        res.cookie('token', token, {
          httpOnly: true,
          secure: false,
          expires: new Date(Date.now() + 7200000)
        });
        res.status(200).json({
          jwt: token,
          message: "Logged in successfully"
        });
      } else {
        res.status(401).json({
          message: "Invalid username and/or password"
        });
      }
    })
    .catch(err => {
      internalServerError(res, err, "router.post /login");
    })
});

router.get('/logout', (req, res, next) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: false
  });
  res.status(200).json({
    message: "Logged out successfully"
  });
})
const checkIfUserExists = (req, res, next) => {
  User.find({username: req.body.username})
    .then(user => {
      if (user.length) {
        res.status(400).json({
          message: "User Exists",
        });
      } else {
        next();
      }
    })
    .catch(err => {
      internalServerError(res, err, 'function: checkIfUserExists');
    })
}

const validationChain = [
  body('username')
    .exists().withMessage('Please provide username')
    .isLength({min: 4, max: 12}).withMessage('Username should be in length range (4, 12)'),
  body('password')
    .exists().withMessage('Please provide password')
    .isLength({min: 8, max: 32}).withMessage('Password should be in length range (8, 16)')
    .custom((value, {req}) => {
      return /[a-z]/.test(value) && /[A-Z]/.test(value);
    }).withMessage('Password should contain small and capital letters')
]
/*
Registration route mainly aimed to be filled up in postman
checkIfUserExists middleware checks for user existance inside mongoBD database,
if user exists code 400 is sent
validationChain middleware validates the data and in case returns an array of errors
Then salt and hash are generated to be later stored inside database
*/
router.post('/register', checkIfUserExists, validationChain, (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => error.msg);
    return res.status(400).json({
      errors: errorMessages
    })
  }

  const password = req.body.password;

  bcrypt.genSalt(saltRounds)
  .then(salt => {
    return bcrypt.hash(password, salt);
  })
  .then(hash => {
    const user = new User({
      _id: new mongoose.Types.ObjectId(),
      username: req.body.username,
      password: hash
    });
    return user.save()
  })
  .then(result => {
    res.status(201).json({
      message: "User created successfully",
      user: result.username,
      password: result.password
    })
    console.log("RESULT: ", result);
  })
  .catch(err => {
    console.warn(err);
    internalServerError(res, err, "router.post('/register')")
  })
});

module.exports = {
  authRouter: router,
  verifyToken: verifyToken,
};

// 400
const accessForbiddenError = (res, at) => {
  console.log('Access forbidden: ' + at);
  return res.status(403).json({
    message: "Access Forbidden"
  });
}

const invalidDataError = (res, at, message) => {
  console.log('Invalid data provided at:', at);
  return res.status(400).json({
    message: message
  });
}

// 500
const internalServerError = (res, err, at) => {
  console.log('Internal server error at:', at);
  console.log(err);
  return res.status(500).json({
    error: err,
    message: "Internal server error"
  });
}

module.exports = { internalServerError, invalidDataError, accessForbiddenError }

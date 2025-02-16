const express = require('express');
const path = require('path');

const router = express.Router();

// Serve face-api.min.js from the public directory
router.get('/', (req, res) => {
  const faceApiPath = path.join(__dirname, '../../face-api.min.js');
  res.sendFile(faceApiPath);
});

module.exports = router;

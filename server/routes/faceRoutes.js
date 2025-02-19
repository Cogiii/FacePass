const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();
const labeledImagesPath = path.join(__dirname, '../../face_images');

// GET: Fetch all face labels
router.get('/faces', (req, res) => {
  fs.readdir(labeledImagesPath, (err, folders) => {
    if (err) return res.status(500).json({ error: 'Error reading face_images folder' });
    res.json(folders);
  });
});

module.exports = router;

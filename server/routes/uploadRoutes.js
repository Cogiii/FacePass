const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();
const labeledImagesPath = path.join(__dirname, '../face_images');

// Multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const userFolder = path.join(labeledImagesPath, req.body.name);
    fs.mkdirSync(userFolder, { recursive: true });
    cb(null, userFolder);
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});

const upload = multer({ storage });

// POST: Register new face
router.post('/', upload.single('image'), (req, res) => {
  res.json({ message: 'Face registered successfully!' });
});

module.exports = router;

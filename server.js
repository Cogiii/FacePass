const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const multer = require('multer');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.static(path.join(__dirname)));

const labeledImagesPath = path.join(__dirname, 'face_images');
app.use('/face_images', express.static(labeledImagesPath));

// API to get existing labels
app.get('/get-faces', (req, res) => {
    fs.readdir(labeledImagesPath, (err, folders) => {
        if (err) return res.status(500).json({ error: 'Error reading labeled_images folder' });
        res.json(folders);
    });
});

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const userFolder = path.join(labeledImagesPath, req.body.name);
    fs.mkdirSync(userFolder, { recursive: true });
    cb(null, userFolder);
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  }
});
const upload = multer({ storage });

// Endpoint to handle face registration
app.post('/register-face', upload.single('image'), (req, res) => {
    res.json({ message: 'Face registered successfully!' });
});

app.listen(port, () => console.log(`Server running at http://localhost:${port}`));

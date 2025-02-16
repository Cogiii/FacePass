const express = require('express');
const cors = require('cors');
const path = require('path');
const faceRoutes = require('./routes/faceRoutes');
const uploadRoutes = require('./routes/uploadRoutes');

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(express.static(path.join(__dirname, '../public')));


// Static folder for face images
const faceImagesPath = path.join(__dirname, 'face_images');
app.use('/face_images', express.static(faceImagesPath));

// Routes
app.use('/api/faces', faceRoutes);
app.use('/api/upload', uploadRoutes);

// Start the server
app.listen(port, () => console.log(`Server running at http://localhost:${port}`));

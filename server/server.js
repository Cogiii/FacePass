const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const apiRoutes = require('./routes/api');
const faceApiRoute = require('./routes/faceApiRoutes');

const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());



// Middleware
app.use(cors());
app.use(express.static(path.join(__dirname, '../public')));

// Static folder for face images
const faceImagesPath = path.join(__dirname, '../face_images');
app.use('/face_images', express.static(faceImagesPath));

// Serve the models folder
const modelsPath = path.join(__dirname, './models');
app.use('/models', express.static(modelsPath));

// Routes
app.use('/api', apiRoutes);
app.use('/lib', faceApiRoute);

// Start the server
app.listen(port, () => console.log(`Server running at http://localhost:${port}`));

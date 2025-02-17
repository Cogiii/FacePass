const express = require('express');
const multer = require('multer');
const mysql = require('mysql');

const router = express.Router();
const upload = multer();

// MySQL Connection
const connection = mysql.createConnection({
    host: process.env.SQL_HOST || 'localhost',
    user: process.env.SQL_USER || 'root',
    password: process.env.SQL_PASSWORD || '',
    database: process.env.SQL_DB || 'db_facepass',
});

connection.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        process.exit(1);
    }
    console.log('Connected to MySQL');
});

// Helper function: Execute MySQL query (Promise-based)
const query = (sql, values) =>
    new Promise((resolve, reject) => {
        connection.query(sql, values, (err, results) => {
            if (err) reject(err);
            else resolve(results);
        });
    });

// Helper function: Insert image into user_face
const saveFaceImage = async (userID, imageBuffer) => {
    await query('INSERT INTO user_face (user_id, image) VALUES (?, ?)', [
        userID,
        imageBuffer,
    ]);
};

// Check if user exists
router.post('/checkUser', async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) return res.status(400).json({ error: 'Name is required' });

        const results = await query(
            'SELECT user_id FROM tbl_user WHERE name = ?',
            [name]
        );
        res.json({ exists: results.length > 0 });
    } catch (err) {
        console.error('Error checking user:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Upload face image (for existing user)
router.post('/uploadFace', upload.single('image'), async (req, res) => {
    try {
        const { name } = req.body;
        const imageBuffer = req.file?.buffer;

        if (!name || !imageBuffer) {
            return res.status(400).json({ error: 'Name and image are required' });
        }

        // Check if user exists
        const results = await query(
            'SELECT user_id FROM tbl_user WHERE name = ?',
            [name]
        );

        if (results.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        await saveFaceImage(results[0].user_id, imageBuffer);
        res.status(200).json({ message: 'Face image uploaded successfully' });
    } catch (err) {
        console.error('Error uploading face image:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Register user and upload face image
router.post('/register', upload.single('image'), async (req, res) => {
    const { name } = req.body;
    const imageBuffer = req.file?.buffer;

    if (!name || !imageBuffer) {
        return res.status(400).json({ error: 'Name and image are required' });
    }

    try {
        // Check if user already exists
        const existingUser = await query(
            'SELECT user_id FROM tbl_user WHERE name = ?',
            [name]
        );

        if (existingUser.length > 0) {
            return res.status(409).json({
                error: 'User already exists. Please choose another name.',
            });
        }

        // Start transaction
        connection.beginTransaction(async (err) => {
            if (err) throw err;

            try {
                // Insert new user and get user_id
                const userResult = await query(
                    'INSERT INTO tbl_user (name) VALUES (?)',
                    [name]
                );
                const userID = userResult.insertId;

                // Save image to user_face
                await saveFaceImage(userID, imageBuffer);

                // Commit transaction
                connection.commit((err) => {
                    if (err) throw err;
                    res.status(200).json({
                        message: 'User and face image saved successfully',
                        userID,
                    });
                });
            } catch (error) {
                connection.rollback(() => {
                    console.error('Transaction failed:', error);
                    res.status(500).json({ error: 'Internal server error' });
                });
            }
        });
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET: Fetch user details
router.get('/getUsers', async (req, res) => {
    try {
        const userDetails = await query(
            'SELECT user_id, name FROM tbl_user'
        );

        if (userDetails.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(userDetails);
    } catch (err) {
        console.error('Error fetching user:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/** 
 * GET: Fetch specific face and corresponding user name
 * Status 200: return an array of json file 
 *   [
 *      {
 *         user_name: 'name',
 *      },
 *      ...
 *  ]
 * Status 404 & 500: return error message
 */
router.get('/getUserFaceId/:userId', async (req, res) => {
    const { userId } = req.params;
    
    try {
        const userFaceIDs = await query(
            'SELECT user_face_id FROM user_face WHERE user_id = ?',
            [userId]
        );

        if (userFaceIDs.length === 0) {
            return res.status(404).json({ error: 'Face ID not found' });
        }

        res.status(200).send(userFaceIDs);
    } catch (err) {
        console.error('Error fetching face:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/getUserFace/:faceId', async (req, res) => {
    const { faceId } = req.params;
    
    try {
        const userFace = await query(
            'SELECT image FROM user_face WHERE user_face_id = ?',
            [faceId]
        );

        if (userFace.length === 0) {
            return res.status(404).json({ error: 'Face not found' });
        }
        const image = Buffer.from(userFace[0].image);
        res.writeHead(200, {
            'Content-Type': 'image/jpeg',
            'Content-Length': image.length
        });
        res.end(image);

    } catch (err) {
        console.error('Error fetching face:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});


module.exports = router;

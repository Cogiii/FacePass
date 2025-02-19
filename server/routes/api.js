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
        console.error('Error connecting to MySQL');
        process.exit(1);
    }
    console.log('Connected to MySQL');
});

/**
 * Helper function: Execute MySQL query (Promise-based)
 * @param {*} sql 
 * @param {*} values 
 * @returns 
 */
const query = (sql, values) =>
    new Promise((resolve, reject) => {
        connection.query(sql, values, (err, results) => {
            if (err) reject(err);
            else resolve(results);
        });
    });

/**
 * Helper function: Save face image to user_face table
 * @param {*} userID 
 * @param {*} imageBuffer 
 */
const saveFaceImage = async (userID, imageBuffer) => {
    await query('INSERT INTO user_face (user_id, image) VALUES (?, ?)', [
        userID,
        imageBuffer,
    ]);
};

/**
 * POST: Check if user exists
 * Status 200: return exists: true/false
 * Status 500: return error message
 */
router.post('/checkUserExist', async (req, res) => {
    try {
        const { name } = req.body;

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

/**
 * POST: Register new user
 * Status 200: return success message
 * Status 500: return error message
 */
router.post('/register', upload.array('images', 3), async (req, res) => {
    const { name } = req.body; // 'imagesBlob' is unnecessary here

    try {
        // Insert new user and get user_id
        const userResult = await query(
            'INSERT INTO tbl_user (name) VALUES (?)',
            [name]
        );
        const userID = userResult.insertId;

        // Save image to user_face table
        for (let i = 0; i < req.files.length; i++) {
            await saveFaceImage(userID, req.files[i].buffer);
        }

        res.status(200).json({ message: 'User registered successfully' });
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


/**
 * GET: Fetch all users
 * Status 200: return an array of json file
 *  [
 *     {
 *       user_id: 'id',
 *      name: 'name',
 *    },
 *   ...
 * ]
 * Status 404 & 500: return error message
 */
router.get('/getUsers', async (req, res) => {
    try {
        const userDetails = await query(
            'SELECT user_id, name FROM tbl_user'
        );

        // if (userDetails.length === 0) {
        //     return res.status(404).json({ error: 'User not found' });
        // }

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

/**
 * GET: Fetch specific face image
 * Status 200: return image
 * Status 404 & 500: return error message
 */
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

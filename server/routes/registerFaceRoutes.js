const express = require('express');
const multer = require('multer');

const upload = multer(); // Store image in memory

module.exports = (connection) => {
    const router = express.Router();

    // POST Endpoint to Add User and Save Face Image (BLOB)
    router.post('/register', upload.single('image'), (req, res) => {
        const { name } = req.body;
        const imageFile = req.file ? req.file.buffer : null;

        if (!name || !imageFile) {
            return res.status(400).send('Name and image are required');
        }

        // Check if user already exists
        connection.query(
            'SELECT user_id FROM tbl_user WHERE name = ?',
            [name],
            (err, results) => {
                if (err) {
                    console.error('Database error:', err);
                    return res.status(500).send('Internal server error');
                }

                if (results.length > 0) {
                    return res.status(409).json({
                        message: 'User already exists. Please choose another name.'
                    });
                }

                // Insert user into tbl_user
                connection.beginTransaction((err) => {
                    if (err) {
                        console.error('Transaction error:', err);
                        return res.status(500).send('Transaction error');
                    }

                    connection.query(
                        'INSERT INTO tbl_user (name) VALUES (?)',
                        [name],
                        (err, userResult) => {
                            if (err) {
                                return connection.rollback(() => {
                                    console.error('User insert error:', err);
                                    res.status(500).send('Error adding user');
                                });
                            }

                            const userID = userResult.insertId;

                            // Insert image (BLOB) into user_face
                            connection.query(
                                'INSERT INTO user_face (user_id, image) VALUES (?, ?)',
                                [userID, imageFile],
                                (err) => {
                                    if (err) {
                                        return connection.rollback(() => {
                                            console.error('BLOB insert error:', err);
                                            res.status(500).send('Error saving face image');
                                        });
                                    }

                                    connection.commit((err) => {
                                        if (err) {
                                            return connection.rollback(() => {
                                                console.error('Commit error:', err);
                                                res.status(500).send('Transaction commit error');
                                            });
                                        }

                                        res.status(200).json({
                                            message: 'User and face image saved successfully',
                                            userID
                                        });
                                    });
                                }
                            );
                        }
                    );
                });
            }
        );
    });

    return router;
};

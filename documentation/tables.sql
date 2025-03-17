DROP DATABASE IF EXISTS db_facepass;
CREATE DATABASE db_facepass;
USE db_facepass;

CREATE TABLE tbl_user (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL
);

CREATE TABLE user_face (
    user_face_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    image LONGBLOB NOT NULL,
    FOREIGN KEY (user_id) REFERENCES tbl_user(user_id) ON DELETE CASCADE
);

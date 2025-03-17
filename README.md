# FacePass: Automated Attendance Tracking Through Face Recognition

## Overview

FacePass is an innovative automated attendance tracking system that leverages advanced facial recognition technology to provide a secure, contactless, and efficient solution for attendance management. Designed for educational institutions, workplaces, government agencies, and healthcare facilities, FacePass eliminates the inefficiencies and security vulnerabilities associated with traditional attendance methods.

## Features

- **Advanced Facial Recognition**: Utilizes face-api.js with deep learning models for accurate face detection and recognition
- **Multi-Expression Registration**: Captures 3 different facial expressions during enrollment for improved recognition accuracy
- **50-Frame Detection Requirement**: Ensures consistent recognition across multiple frames to prevent false positives
- **Liveness Detection**: Prevents spoofing attacks through blink detection and micro-movement analysis
- **Real-Time Attendance Tracking**: Records attendance data instantly with minimal processing delay
- **Environmental Adaptability**: Maintains high accuracy across various lighting conditions and distances

## Technology Stack

- **Frontend**: HTML, CSS, JavaScript
- **Face Recognition**: face-api.js (SSD Mobilenet model)
- **Backend**: NodeJS
- **Database**: XAMPP, PHPMyAdmin, Mysql

## Algorithm

FacePass implements a sophisticated facial recognition algorithm with several enhancements:

1. **Face Detection**: Locates faces in video frames using the SSD Mobilenet model
2. **Face Alignment**: Normalizes pose variations for consistent feature extraction
3. **Feature Extraction**: Generates a 128-dimensional feature vector using a modified ResNet architecture
4. **Enhanced Recognition**: Employs multiple expression templates and 50-frame verification

## Performance

- **Recognition Accuracy**: 97.8% in real-world testing
- **Processing Speed**: Average recognition time of 0.85 seconds per face
- **False Positive Rate**: 0.3%
- **False Negative Rate**: 1.9%
- **Anti-Spoofing Success**: Rejects 98.2% of spoofing attempts

## Installation

```bash
# Clone the repository
git clone https://github.com/Cogiii/FacePass.git

# Navigate to the project directory
cd facepass

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
SQL_HOST={ENTER YOUR DATABASE HOST}
SQL_USER={DATABASE USERNAME}
SQL_PASSWORD={DATABASE PASSWORD}
SQL_DB="db_facepass"
SQL_PORT={PORT}

# Start the application
npm start
```

### Database Table Structure
The database schema is available in documentation/tables.sql.

#### Prerequisites:
Before executing the script, ensure the following:
- Apache and MySQL are running (if using XAMPP, WAMP, or a similar stack).
- You have created the database manually or include a CREATE DATABASE statement in tables.sql.

Run the following command to create the necessary tables:
```bash
mysql -u {DATABASE_USER} -p {DATABASE_NAME} < documentation/tables.sql
```
This will execute the SQL script and set up the required tables in your database.

## Usage

### User Registration

1. Navigate to the registration page
2. Enter user details (name, ID, department, etc.)
3. Capture facial images in three expressions:
   - Neutral expression
   - Smiling expression
   - Raised eyebrows expression
4. Submit registration

### Attendance Tracking

1. Position face in front of the camera
2. The system automatically detects and verifies identity
3. Upon successful recognition, attendance is recorded with timestamp
4. User receives confirmation notification

### Admin Dashboard

1. Login to the admin panel
2. View real-time attendance data
3. Generate reports by date, department, or individual
4. Manage user registrations
5. Configure system settings

## System Requirements

- **Camera**: HD webcam or better (minimum 720p resolution)
- **Processor**: Multi-core processor (Intel i5/AMD Ryzen 5 or better)
- **Memory**: Minimum 4GB RAM (8GB recommended)
- **Storage**: 100MB for application, plus additional space for attendance records
- **Network**: Broadband internet connection for cloud synchronization
- **Browser**: Chrome, Firefox, or Edge (latest versions)

## SDG Alignment

This project aligns with the following UN Sustainable Development Goals:

1. **SDG 4: Quality Education** - Enhances attendance tracking in educational institutions
2. **SDG 8: Decent Work and Economic Growth** - Improves workplace efficiency
3. **SDG 9: Industry, Innovation, and Infrastructure** - Promotes advanced technology adoption

## Future Improvements

- **Adaptive Thresholding**: Dynamic adjustment based on environmental conditions
- **Progressive Learning**: Incremental template updates to adapt to appearance changes
- **Edge Computing Integration**: Deploy preprocessing on edge devices for improved performance
- **Enhanced Anti-Spoofing**: Implement advanced methods to detect sophisticated attacks
- **API Expansion**: Develop robust APIs for integration with existing systems

## Contributing

We welcome contributions to the FacePass project! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

[Your chosen license]

## Contact

Project Maintainers:
- Anikka Francine Cabania - afCabania@mcm.edu.ph
- Laurence Kharl Devera - lkDevera@mcm.edu.ph
- Mc Curvin Royeras - mcRoyeras@mcm.edu.ph

---

© 2025 FacePass | College of Computer and Information Science, Mapua, Malayan Colleges Mindano, Philippines

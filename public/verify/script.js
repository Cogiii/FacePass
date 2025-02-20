let currentLink = window.location.origin;

const video = document.getElementById('video');
const recognizeBtn = document.getElementById('recognizeBtn');
const detectingTxt = document.getElementById('detectingTxt');
const userDetectedTxt = document.getElementById('userDetectedTxt');

recognizeBtn.addEventListener('click', async () => {
    // Show loading animation & detecting text
    videoWrapper.classList.add('loading');
    detectingTxt.style.display = 'inline';
    userDetectedTxt.style.display = 'none';

    const labeledFaceDescriptors = await loadFaces();
    // console.log(labeledFaceDescriptors);
    if(labeledFaceDescriptors) {
      const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors, 0.5);
      detectFace(faceMatcher);
    } else {
      alert('No users found! Please register a face.');
    }
});

/* 
Load models from the face-api.js library
then call the startCamera function to start the webcam when the models are loaded successfully
*/
Promise.all([
  faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
  faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
  faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
  faceapi.nets.ssdMobilenetv1.loadFromUri('/models'),
  faceapi.nets.faceExpressionNet.loadFromUri('/models')
]).then(startCamera);

/*

*/
async function startCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: {} });
    video.srcObject = stream;

    video.addEventListener('loadedmetadata', async () => {
      video.width = video.videoWidth;
      video.height = video.videoHeight;
      
      document.getElementById('LoadingTxt').style.display = 'none';

    });
  } catch (err) {
    console.error('Error accessing webcam:', err);
  }
}

/* Detect only one face and match it against known faces */
async function detectFace(faceMatcher) {
  const canvas = faceapi.createCanvasFromMedia(video);
  document.body.appendChild(canvas);

  const displaySize = { width: video.width, height: video.height };
  faceapi.matchDimensions(canvas, displaySize);

  let userDetected = new Map();

  const detectionInterval = setInterval(async () => {
    // Detect a single face
    const detection = await faceapi
      .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptor()
      .withFaceExpressions();

    // Clear previous drawings
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (detection) {
      // Resize detection to match video dimensions
      const resizedDetections = faceapi.resizeResults([detection], displaySize);

      // Draw bounding box and landmarks
      // faceapi.draw.drawDetections(canvas, resizedDetections);
      // faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);

      // Match and draw label
      resizedDetections.forEach( async (detection) => {
        const bestMatch = faceMatcher.findBestMatch(detection.descriptor);
        const box = detection.detection.box;
        const drawBox = new faceapi.draw.DrawBox(box, { label: bestMatch.toString() });
        // drawBox.draw(canvas);

        // Improve detection accuracy by counting the number (50) of times a user is detected to avoid false positives
        userDetected.set(bestMatch.label, userDetected.get(bestMatch.label) + 1 || 1);
        if(userDetected.get(bestMatch.label) === 30) {
            videoWrapper.classList.remove('loading');
            detectingTxt.style.display = 'none';

            userDetectedTxt.textContent = `User detected: ${bestMatch.label}`;
            userDetectedTxt.style.display = 'block';

            console.log(`User detected: ${bestMatch.label}`);

            clearInterval(detectionInterval);
        } else if (userDetected.get('unknown') === 50) {
            videoWrapper.classList.remove('loading');
            detectingTxt.style.display = 'none';
            
            userDetectedTxt.textContent = `Unknown user detected! Please register`;
            userDetectedTxt.style.display = 'block';

            console.log('Unknown user detected!');

            clearInterval(detectionInterval);
        }

        // Display detected expressions
        // const expression = detectExpression(detection);
        // console.log(expression);
      });
    }
  }, 100); // Run every 100ms
}

/**
 * Detect user expression based on the detected face
 * @param {*} detection 
 * @returns The dominant expression detected in the face detection result.
 */
function detectExpression(detection) {
  const expressions = detection.expressions;
  const dominantExpression = Object.keys(expressions).reduce((a, b) => expressions[a] > expressions[b] ? a : b);
  return dominantExpression;
}

/**
 * Starts the face detection process using the provided face matcher.
 * This function creates a canvas element to overlay on the video feed,
 * matches the dimensions of the canvas to the video, and sets up an interval
 * to continuously detect faces in the video feed. Detected faces are then
 * matched against known faces using the face matcher, and the results are
 * drawn on the canvas.
 * @param {faceapi.FaceMatcher} faceMatcher - The face matcher used to match detected faces against known faces.
 */
function startFaceDetection(faceMatcher) {
  const canvas = faceapi.createCanvasFromMedia(video);
  document.body.append(canvas);
  const displaySize = { width: video.videoWidth, height: video.videoHeight };
  faceapi.matchDimensions(canvas, displaySize);

  setInterval(async () => {
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      return; // Skip detection if video is not fully loaded
    }

    const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptors();
    const resizedDetections = faceapi.resizeResults(detections, displaySize);

    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
    faceapi.draw.drawDetections(canvas, resizedDetections);
    faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);

    resizedDetections.forEach((detection, i) => {
      const bestMatch = faceMatcher.findBestMatch(detection.descriptor);
      const box = detection.detection.box;
      const drawBox = new faceapi.draw.DrawBox(box, { label: bestMatch.toString() });
      drawBox.draw(canvas);
    });
  }, 100);
}

/**
 * LOAD ALL FACES
 * - get user details return user_id
 * - get user_face_id of user_face base on the user_id using map function
 * - then, fetch the image of the return user_face_id 
 * - then, detect the face and return the face points
 * 
 * @returns users face and descriptions (returning users face points)
 */
async function loadFaces() { 
  const response = await fetch(`${currentLink}/api/getUsers`);
  const users = await response.json();

  if(users.length === 0) return null;
  
  return Promise.all(
    users.map(async user => {
      const descriptions = [];
      const userId = user.user_id;
      const userName = user.name;

      try {
        // Wait for user face IDs to be fetched
        const faceResponse = await fetch(`${currentLink}/api/getUserFaceId/${userId}`);
        const faceData = await faceResponse.json();

        // Ensure faceData is not empty
        if (faceData.length === 0) {
          console.warn(`No faces found for user: ${userName}`);
          return null; // Skip users with no faces
        }

        // Fetch face images and descriptors
        for (const face of faceData) {
          const userFaceId = face.user_face_id;
          const img = await faceapi.fetchImage(`${currentLink}/api/getUserFace/${userFaceId}`);
          const detections = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor();

          if (detections) {
            descriptions.push(detections.descriptor);
          }
        }

        // Ensure valid face descriptors
        if (descriptions.length === 0) {
          console.warn(`No valid descriptors for user: ${userName}`);
          return null;
        }

        return new faceapi.LabeledFaceDescriptors(userName, descriptions);
      } catch (error) {
        console.error(`Error loading face data for user ${userName}:`, error);
        return null;
      }
    })
  );
}

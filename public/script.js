let currentLink = window.location.origin;

const video = document.getElementById('video');
const registerButton = document.getElementById('registerFace');

/* 
Load models from the face-api.js library
then call the startCamera function to start the webcam when the models are loaded successfully
*/
Promise.all([
  faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
  faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
  faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
  faceapi.nets.ssdMobilenetv1.loadFromUri('/models')
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

      const labeledFaceDescriptors = await loadFaces();
      // console.log(labeledFaceDescriptors);
      const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors, 0.6);
      
      detectFace(faceMatcher);

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

  const detectionInterval = setInterval(async () => {
    // Detect a single face
    const detection = await faceapi
      .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptor();

    // Clear previous drawings
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (detection) {
      // Resize detection to match video dimensions
      const resizedDetections = faceapi.resizeResults([detection], displaySize);

      // Draw bounding box and landmarks
      faceapi.draw.drawDetections(canvas, resizedDetections);
      // faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);

      // Match and draw label
      resizedDetections.forEach((detection) => {
        const bestMatch = faceMatcher.findBestMatch(detection.descriptor);
        const box = detection.detection.box;
        const drawBox = new faceapi.draw.DrawBox(box, { label: bestMatch.toString() });
        drawBox.draw(canvas);
      });
    }
  }, 100); // Run every 100ms
}


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

/**
 * 
 * @returns 
 */
async function registerFace() {
  const name = prompt('Enter your name for registration:');
  if (!name) return;

  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext('2d');

  const expressions = [
    'Maintain a neutral expression.',
    'Smile for the camera!',
    'Show a surprised expression!'
  ];

  for (let i = 0; i < expressions.length; i++) {
    alert(`Expression ${i + 1}: ${expressions[i]}`);
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Capture image from video and convert to Blob
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageBlob = await new Promise((resolve) => {
        canvas.toBlob(resolve, 'image/jpeg');
    });

    // Check if user already exists
    const checkResponse = await fetch(`${currentLink}/api/checkUser`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
    });

    const checkData = await checkResponse.json();

    const formData = new FormData();
    formData.append('name', name);
    formData.append('image', imageBlob);

    if (checkData.exists) {
        // User already exists – Upload only the face image
        fetch(`${currentLink}/api/uploadFace`, {
            method: 'POST',
            body: formData
        })
            .then((response) => response.json())
            .then((data) => console.log('Image uploaded:', data))
            .catch((error) => console.error('Error uploading face:', error));
    } else {
        // User does NOT exist – Register and upload face
        fetch(`${currentLink}/api/register`, {
            method: 'POST',
            body: formData
        })
            .then((response) => response.json())
            .then((data) => console.log('User registered:', data))
            .catch((error) => console.error('Error registering user:', error));
    }
  }


  alert(`Face registered successfully for ${name}!`);
}


registerButton.addEventListener('click', registerFace);

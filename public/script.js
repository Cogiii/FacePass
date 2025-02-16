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

      const labeledFaceDescriptors = await loadLabeledImages();
      const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors, 0.6);
      
      startFaceDetection(faceMatcher);
    });
  } catch (err) {
    console.error('Error accessing webcam:', err);
  }
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

async function loadLabeledImages() {
  const response = await fetch('http://localhost:3000/api/faces');
  const labels = await response.json();

  return Promise.all(
    labels.map(async label => {
      const descriptions = [];
      for (let i = 1; i <= 3; i++) {
        const img = await faceapi.fetchImage(`http://localhost:3000/face_images/${label}/${i}.jpg`);
        const detections = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor();
        descriptions.push(detections.descriptor);
      }
      return new faceapi.LabeledFaceDescriptors(label, descriptions);
    })
  );
}

// Function to capture and send images for face registration
registerButton.addEventListener('click', async () => {
  const name = prompt("Enter your name for registration:");
  if (!name) return;

  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext('2d');

  const expressions = [
    "Maintain a neutral expression.",
    "Smile for the camera!",
    "Show a surprised expression!"
  ];

  // Another goal is to make the user aware of the expressions they need to make 
  // but using face-api detection expressions

  for (let i = 0; i < expressions.length; i++) {
    alert(`Expression ${i + 1}: ${expressions[i]}`);
    
    await new Promise(resolve => setTimeout(resolve, 2000)); // Give user time to change expression

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageBlob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg'));

    const formData = new FormData();
    formData.append('name', name);
    formData.append('image', imageBlob, `${i + 1}.jpg`);

    await fetch('http://localhost:3000/register-face', {
      method: 'POST',
      body: formData
    });
  }

  alert(`Face registered successfully for ${name}!`);
});

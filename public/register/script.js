let currentLink = window.location.origin;

const video = document.getElementById('video');
const registerButton = document.getElementById('register');

registerButton.addEventListener('click', registerFace);


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

async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: {} });
      video.srcObject = stream;
  
      video.addEventListener('loadedmetadata', async () => {
        video.width = video.videoWidth;
        video.height = video.videoHeight;
        
        
  
      });
    } catch (err) {
      console.error('Error accessing webcam:', err);
    }
}

/**
 * REGISTER FACE
 * - get user name
 * - check if user already exists
 * - capture image from video and convert to Blob
 * - append images and name to FormData
 * - send FormData to server for registration
 * - log response and alert user
 */
async function registerFace() {
    const name = document.getElementById('name').value;
  
    if (!name) return alert('Name cannot be empty!');

    alert('Please follow the instructions to register your face.');
    alert('Please remove any obstructions (e.g, glasses, hat) on your face and ensure good lighting.');
  
    // Check if user already exists
    const checkResponse = await fetch(`${currentLink}/api/checkUserExist`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    });
    const userData = await checkResponse.json();
  
    if (!name) return alert('Name cannot be empty!');
    else if (userData.exists) return alert('User already exists!');
  
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
  
    const expressions = [
      ['Maintain a neutral expression.', 'neutral'],
      ['Smile for the camera!', 'happy'],
      ['Show a surprised expression!', 'surprised']
    ];
  
    const formData = new FormData();
  
    for (let i = 0; i < expressions.length; i++) {
      alert(`Expression ${i + 1}: ${expressions[i][0]}`);
      await new Promise((resolve) => setTimeout(resolve, 1000));
  
      let detectedExpression = null;
  
      while (detectedExpression !== expressions[i][1]) {
        const detection = await faceapi
          .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
          .withFaceExpressions();
          
        if (detection) {
          detectedExpression = Object.keys(detection.expressions).reduce((a, b) => 
            detection.expressions[a] > detection.expressions[b] ? a : b
          );
  
          console.log(`Detected: ${detectedExpression}, Expected: ${expressions[i]}`);
        }
  
        console.log('Waiting for correct expression...');
      }
  
      // Capture image from video and convert to Blob
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageBlob = await new Promise((resolve) => {
          canvas.toBlob(resolve, 'image/jpeg');
      });
  
      formData.append('images', imageBlob, `image${i + 1}.jpg`);
      await new Promise((resolve) => setTimeout(resolve, 1500)); // delay for 1.5 seconds after capturing each image
    }
  
    formData.append('name', name);
  
    fetch(`${currentLink}/api/register`, {
      method: 'POST',
      body: formData
    })
    .then((response) => response.json())
    .then((data) => {
      alert(`Face registered successfully for ${name}!`);
      console.log('User Registered:', data)
    })
    .catch((error) => console.error('Error uploading face:', error));
  }
  
  
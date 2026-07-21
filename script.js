// --- 1. Global State & Setup ---
let stream = null;
let currentQuoteIndex = 0;
const quotes = [
  "I am pro.\nI am Alaska Pro." // Matches your screenshot text layout
];

// --- 2. Navigation Functions ---
function navigateTo(screenId) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(screenId).classList.add('active');
}

function startExperience() {
  navigateTo('screen-camera');
  initCamera();
}

function resetApp() {
  document.getElementById('registration-form').reset();
  document.getElementById('form-error').innerText = "";
  navigateTo('screen-landing');
  stopCamera();
}

function retakePhoto() {
  navigateTo('screen-camera');
  if (!stream) initCamera();
}

// --- 3. Camera Management ---
async function initCamera() {
  try {
    const screenRatio = window.innerHeight / window.innerWidth;
    stream = await navigator.mediaDevices.getUserMedia({
      video: { 
        facingMode: "user", 
        aspectRatio: { ideal: screenRatio }, 
        width: { ideal: 1080 } 
      },
      audio: false
    });
    document.getElementById('camera-video').srcObject = stream;
  } catch (err) {
    console.error("Camera access error:", err);
    alert("Unable to access camera. Please check browser permissions.");
  }
}

function stopCamera() {
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
    stream = null;
  }
}

// --- 4. Canvas Image Processing (With Mirror, Zoom, & Squish Fixes) ---
function capturePhoto() {
  const video = document.getElementById('camera-video');
  const container = document.querySelector('.camera-stage'); 
  const canvas = document.getElementById('preview-canvas');
  if (!canvas || !video || !container) return;

  const ctx = canvas.getContext('2d');

  // Exact visible dimensions
  const viewWidth = container.clientWidth;
  const viewHeight = container.clientHeight;
  const viewRatio = viewWidth / viewHeight;

  // Raw hardware dimensions
  const vidWidth = video.videoWidth;
  const vidHeight = video.videoHeight;
  const vidRatio = vidWidth / vidHeight;

  // Bulletproof crop math
  let sx = 0, sy = 0, sWidth = vidWidth, sHeight = vidHeight;

  if (vidRatio > viewRatio) {
    sWidth = vidHeight * viewRatio;
    sx = (vidWidth - sWidth) / 2;
  } else {
    sHeight = vidWidth / viewRatio;
    sy = (vidHeight - sHeight) / 2;
  }

  // Lock Canvas mathematically to the screen shape
  const exportWidth = 540; 
  canvas.width = exportWidth;
  canvas.height = exportWidth / viewRatio; 

  // Flip canvas horizontally so photo matches the mirrored preview
  ctx.translate(canvas.width, 0);
  ctx.scale(-1, 1);

  // Draw the image
  ctx.drawImage(video, sx, sy, sWidth, sHeight, 0, 0, canvas.width, canvas.height);

  // Reset transform so text writes forward
  ctx.setTransform(1, 0, 0, 1, 0, 0);

  // Apply Typography
  ctx.fillStyle = "white";
  const fontSize = Math.floor(canvas.width * 0.075);
  ctx.font = `800 ${fontSize}px 'Rubik', sans-serif`;
  ctx.textAlign = "left";
  
  ctx.shadowColor = "rgba(0,0,0,0.6)";
  ctx.shadowBlur = 10;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 4;

  const lines = quotes[currentQuoteIndex].split('\n');
  let yOffset = canvas.height * 0.80; 
  lines.forEach(line => {
    ctx.fillText(line, 30, yOffset);
    yOffset += (fontSize + 6);
  });

  ctx.shadowBlur = 0;

  // Export base64 image
  const dataUrl = canvas.toDataURL('image/jpeg', 0.6); 
  
  const finalImg = document.getElementById('final-image');
  if(finalImg) finalImg.src = dataUrl;
  
  const dlLink = document.getElementById('dl-link');
  if(dlLink) {
    dlLink.href = dataUrl;
    dlLink.download = 'Alaska_Pro_Badge.jpg';
  }

  navigateTo('screen-preview');
}

// --- 5. Download Helper ---
function downloadPhoto() {
  const dlLink = document.getElementById('dl-link');
  if(dlLink && dlLink.href) dlLink.click();
}

// --- 6. Form Submission (Google Apps Script API) ---
document.getElementById('registration-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  // Collect data
  const fullName = document.getElementById('full-name').value.trim();
  const position = document.getElementById('position').value;
  const businessName = document.getElementById('business-name').value.trim();
  const foodServiceChannel = document.getElementById('food-service-channel').value;
  const topDish = document.getElementById('top-dish').value.trim();
  const alaskaUser = document.getElementById('alaska-user').value;
  const businessAddress = document.getElementById('business-address').value.trim();
  const contactNumber = document.getElementById('contact-number').value.trim();
  
  const errorText = document.getElementById('form-error');
  const submitBtn = document.getElementById('submit-form');

  // Validate
  if (!fullName || !position || !businessName || !foodServiceChannel || !topDish || !alaskaUser || !businessAddress || !contactNumber) {
    errorText.innerText = "Please fill out all fields.";
    return;
  }
  
  errorText.innerText = "";
  
  // Loading State
  const originalBtnText = submitBtn.innerText;
  submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Submitting...';
  submitBtn.disabled = true;

  // Grab the compressed image
  const photoDataUrl = document.getElementById('preview-canvas').toDataURL('image/jpeg', 0.5);

  const scriptPayload = {
    fullName: fullName,
    position: position,
    businessName: businessName,
    foodServiceChannel: foodServiceChannel,
    topDish: topDish,
    alaskaUser: alaskaUser,
    businessAddress: businessAddress,
    contactNumber: contactNumber,
    selectedQuote: quotes[currentQuoteIndex].replace('\n', ' '),
    photoData: photoDataUrl
  };

  try {
    const googleScriptUrl = 'https://script.google.com/macros/s/AKfycby95Bw1OyonINjElB40R0yblyX8A_vqiAD_h3fhOrYyNwhznz0P6gEgOQ9t9_-fEWw/exec'; 

    const response = await fetch(googleScriptUrl, {
      method: 'POST',
      headers: { 
        'Content-Type': 'text/plain;charset=utf-8', 
      },
      body: JSON.stringify(scriptPayload)
    });

    const result = await response.json();
    
    if (result.result === "success") {
      document.getElementById('success-name').innerText = fullName;
      document.getElementById('success-industry').innerText = businessName;
      
      navigateTo('screen-success');
      stopCamera(); // Turn off camera light safely
    } else {
      throw new Error(result.message || "Server Error");
    }

  } catch (err) {
    console.error("Submission failed:", err);
    errorText.innerText = "Submission failed. Please check your internet and try again.";
  } finally {
    submitBtn.innerText = originalBtnText;
    submitBtn.disabled = false;
  }
});
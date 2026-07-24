// --- 1. Global State & Quotes Array ---
let stream = null;
let currentQuoteIndex = 0;

// The requested quotes formatted with \n to split them into two lines on the canvas
const quotes = [
  "I am pro.\nI am Alaska Pro.",
  "I am pro versatility.\nI am Alaska Pro.",
  "I am pro craft.\nI am Alaska Pro.",
  "I am pro quality.\nI am Alaska Pro.",
  "I am pro sarap.\nI am Alaska Pro.",
  "I am pro success.\nI am Alaska Pro."
];

// --- 2. Navigation & App Setup ---
function navigateTo(screenId) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(screenId).classList.add('active');
}

function startExperience() {
  navigateTo('screen-camera');
  initCamera();
  updateQuoteOverlay(); // Ensure the text overlay is visible as soon as the camera turns on
}

function resetApp() {
  const formElement = document.getElementById('registration-form');
  if(formElement) formElement.reset();
  
  const errorElement = document.getElementById('form-error');
  if(errorElement) errorElement.innerText = "";
  
  navigateTo('screen-landing');
  stopCamera();
}

function retakePhoto() {
  navigateTo('screen-camera');
  if (!stream) initCamera();
}

// --- 3. Event Listeners (Connects your HTML IDs to the logic) ---
document.addEventListener('DOMContentLoaded', () => {
  
  // Screen 1: Landing
  const startBtn = document.getElementById('start-registration');
  if (startBtn) startBtn.addEventListener('click', () => navigateTo('screen-privacy'));

  // Screen 2: Privacy Modal Logic
  const acceptBtn = document.getElementById('accept-privacy');
  if (acceptBtn) {
    acceptBtn.addEventListener('click', () => {
      const ackBox = document.getElementById('privacy-ack');
      const errorMsg = document.getElementById('privacy-error');
      
      // Strict validation constraint
      if (!ackBox.checked) {
        errorMsg.style.display = 'block';
        return;
      }
      
      errorMsg.style.display = 'none';
      startExperience();
    });
  }
  
  const cancelBtn = document.getElementById('cancel-privacy');
  if (cancelBtn) cancelBtn.addEventListener('click', () => navigateTo('screen-landing'));

  // Screen 3: Camera
  const captureBtn = document.getElementById('real-capture-btn');
  if (captureBtn) captureBtn.addEventListener('click', capturePhoto);

  const nextQuoteBtn = document.getElementById('next-quote');
  if (nextQuoteBtn) {
    nextQuoteBtn.addEventListener('click', () => {
      // Move to the next quote, loop back to the start if at the end
      currentQuoteIndex = (currentQuoteIndex + 1) % quotes.length;
      updateQuoteOverlay();
    });
  }

  const prevQuoteBtn = document.getElementById('prev-quote');
  if (prevQuoteBtn) {
    prevQuoteBtn.addEventListener('click', () => {
      // Move to the previous quote, loop to the end if at the start
      currentQuoteIndex = (currentQuoteIndex - 1 + quotes.length) % quotes.length;
      updateQuoteOverlay();
    });
  }

  // Screen 4: Preview
  const usePhotoBtn = document.getElementById('use-photo');
  if (usePhotoBtn) usePhotoBtn.addEventListener('click', () => navigateTo('screen-form'));

  const retakeBtn = document.getElementById('retake-photo');
  if (retakeBtn) retakeBtn.addEventListener('click', retakePhoto);
});

// --- 4. Quote Overlay UI Update ---
function updateQuoteOverlay() {
  const overlay = document.getElementById('quote-overlay');
  if (overlay) {
    // Replaces \n with an HTML <br> tag for the screen display
    overlay.innerHTML = quotes[currentQuoteIndex].replace('\n', '<br>');
  }
}

// --- 5. Camera Management ---
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
    const videoObj = document.getElementById('camera-video');
    if (videoObj) videoObj.srcObject = stream;
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

// --- 6. Canvas Image Capture & Processing ---
function capturePhoto() {
  const video = document.getElementById('camera-video');
  const canvas = document.getElementById('preview-canvas');
  const container = document.querySelector('.camera-stage'); 
  
  if (!canvas || !video || !container) return;

  const ctx = canvas.getContext('2d');

  // If a mobile browser incorrectly reports a height/width of 0, it falls back to the exact window size.
  const viewWidth = (container.clientWidth > 0) ? container.clientWidth : window.innerWidth;
  const viewHeight = (container.clientHeight > 0) ? container.clientHeight : window.innerHeight;
  const viewRatio = viewWidth / viewHeight;

  const vidWidth = video.videoWidth;
  const vidHeight = video.videoHeight;
  
  if (vidWidth === 0 || vidHeight === 0) {
    alert("Camera is loading, please try again in a second.");
    return;
  }

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

  // Mirror the image horizontally
  ctx.translate(canvas.width, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(video, sx, sy, sWidth, sHeight, 0, 0, canvas.width, canvas.height);

  // Reset transform so text writes forward
  ctx.setTransform(1, 0, 0, 1, 0, 0);

  // Apply Typography
  ctx.fillStyle = "white";
  const fontSize = Math.floor(canvas.width * 0.075);
  ctx.font = `800 ${fontSize}px 'Rubik', sans-serif`;
  ctx.textAlign = "left";
  
  ctx.shadowColor = "rgba(0,0,0,0.8)";
  ctx.shadowBlur = 8;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 3;

  const lines = quotes[currentQuoteIndex].split('\n');
  let yOffset = canvas.height * 0.80; 
  lines.forEach(line => {
    ctx.fillText(line, 30, yOffset);
    yOffset += (fontSize + 6);
  });

  ctx.shadowBlur = 0;

  // Export base64 image and inject it into preview and download link
  const dataUrl = canvas.toDataURL('image/jpeg', 0.8); 
  
  const finalImg = document.getElementById('final-image');
  if (finalImg) finalImg.src = dataUrl;
  
  const dlLink = document.getElementById('dl-link');
  if (dlLink) {
    dlLink.href = dataUrl;
    dlLink.download = 'Alaska_Pro_Badge.jpg';
  }

  navigateTo('screen-preview');
}

// --- 7. Download Helper (If needed for inline onclick) ---
function downloadPhoto() {
  const dlLink = document.getElementById('dl-link');
  if(dlLink && dlLink.href) dlLink.click();
}

// --- 8. Form Submission (Google Apps Script API) ---
const form = document.getElementById('registration-form');
if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Collect Data
    const fullName = document.getElementById('full-name').value.trim();
    const position = document.getElementById('position').value;
    const businessName = document.getElementById('business-name').value.trim();
    const foodServiceChannel = document.getElementById('food-service-channel').value;
    const topDish = document.getElementById('top-dish').value.trim();
    const alaskaUser = document.getElementById('alaska-user').value;
    const businessAddress = document.getElementById('business-address').value.trim();
    const contactNumber = document.getElementById('contact-number').value.trim();
    const dairyProduct = document.getElementById('dairy-product').value.trim();
    const monthlyVolume = document.getElementById('monthly-volume').value.trim();

    const errorText = document.getElementById('form-error');
    const submitBtn = document.getElementById('submit-form');

    // Basic Validation
    if (!fullName || !position || !businessName || !foodServiceChannel || !topDish || !alaskaUser || !businessAddress || !contactNumber) {
      errorText.innerText = "Please fill out all fields.";
      return;
    }
    
    errorText.innerText = "";
    
    // Update Button State
    const originalBtnText = submitBtn.innerHTML;
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
      dairyProduct: dairyProduct,
      monthlyVolume: monthlyVolume,
      selectedQuote: quotes[currentQuoteIndex].replace('\n', ' '), 
      photoData: photoDataUrl
    };

    try {
      const hiddenEndpoint = "aHR0cHM6Ly9zY3JpcHQuZ29vZ2xlLmNvbS9tYWNyb3Mvcy9BS2Z5Y2J4dDludGt5aEdwRHRacENkWmM3YVV4dVkxR1pkeWY3eUxjWmpJdlhBUkFKV1kxN0thQ0I2Vk5PYnJ2ek01NkJ2QS9leGVj";
      const googleScriptUrl = atob(hiddenEndpoint);
      
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
        stopCamera(); 
      } else {
        throw new Error(result.message || "Server Error");
      }

    } catch (err) {
      console.error("Submission failed:", err);
      errorText.innerText = "Submission failed. Please check your internet and try again.";
    } finally {
      submitBtn.innerHTML = originalBtnText;
      submitBtn.disabled = false;
    }
  });
}
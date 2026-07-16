document.addEventListener("DOMContentLoaded", () => {
  // Application State
  const quotes = [
    "I am pro.\nI am Alaska Pro.",
    "I am pro versatility.\nI am Alaska Pro.",
    "I am pro craft.\nI am Alaska Pro.",
    "I am pro quality.\nI am Alaska Pro.",
    "I am pro sarap.\nI am Alaska Pro.",
    "I am pro success.\nI am Alaska Pro."
  ];
  let currentQuoteIndex = 0;
  let stream = null;

  // Navigation Logic
  function navigateTo(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
    
    // Stop camera if not on camera or privacy screen
    if (screenId !== 'screen-camera' && screenId !== 'screen-privacy') {
      stopCamera();
    }
  }

  // Camera Management
  async function initCamera() {
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1080 }, height: { ideal: 1920 } },
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

  function updateQuoteOverlay() {
    document.getElementById('quote-overlay').innerHTML = quotes[currentQuoteIndex].replace('\n', '<br>');
  }

// Canvas Image Processing & Compression (WYSIWYG Fix)
  function capturePhoto() {
    const video = document.getElementById('camera-video');
    const canvas = document.getElementById('preview-canvas');
    if (!canvas || !video) return;

    const ctx = canvas.getContext('2d');
    
    // 1. Get the actual raw dimensions of the camera feed
    const rawVideoWidth = video.videoWidth;
    const rawVideoHeight = video.videoHeight;

    // 2. Get the dimensions of the screen the user is looking at
    const screenWidth = video.clientWidth;
    const screenHeight = video.clientHeight;

    // 3. Calculate aspect ratios
    const videoRatio = rawVideoWidth / rawVideoHeight;
    const screenRatio = screenWidth / screenHeight;

    let sourceX = 0, sourceY = 0, sourceWidth = rawVideoWidth, sourceHeight = rawVideoHeight;

    // 4. Calculate the EXACT crop to mimic CSS `object-fit: cover`
    if (videoRatio > screenRatio) {
      // The video is wider than the screen (crop the sides)
      sourceWidth = rawVideoHeight * screenRatio;
      sourceX = (rawVideoWidth - sourceWidth) / 2;
    } else {
      // The video is taller than the screen (crop the top and bottom)
      sourceHeight = rawVideoWidth / screenRatio;
      sourceY = (rawVideoHeight - sourceHeight) / 2;
    }

    // 5. Set output resolution. 
    // We scale it down slightly for Zapier/GSheets, but keep the EXACT aspect ratio of the screen.
    const exportWidth = 600; 
    canvas.width = exportWidth;
    canvas.height = exportWidth / screenRatio;

    // 6. Draw only the cropped, visible area onto the canvas
    ctx.drawImage(
      video, 
      sourceX, sourceY, sourceWidth, sourceHeight, // What to crop from the raw video
      0, 0, canvas.width, canvas.height            // Where to draw it on the canvas
    );

    // Apply Typography
    ctx.fillStyle = "white";
    ctx.font = "800 38px 'Rubik', sans-serif";
    ctx.textAlign = "left";
    
    // Text Shadow for readability
    ctx.shadowColor = "rgba(0,0,0,0.6)";
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 4;

    const lines = quotes[currentQuoteIndex].split('\n');
    
    // Dynamically position text based on the new canvas height
    let yOffset = canvas.height - (canvas.height * 0.15); 
    
    lines.forEach(line => {
      ctx.fillText(line, 30, yOffset);
      yOffset += 45;
    });

    ctx.shadowBlur = 0;

    // Export compressed JPEG
    const dataUrl = canvas.toDataURL('image/jpeg', 0.6); 
    
    document.getElementById('photo-thumb').src = dataUrl;
    document.getElementById('final-image').src = dataUrl;
    
    const dlLink = document.getElementById('dl-link');
    dlLink.href = dataUrl;
    dlLink.download = 'Alaska_Pro_Badge.jpg';

    navigateTo('screen-preview');
  }

  // Event Listeners
  document.getElementById('start-registration').addEventListener('click', () => navigateTo('screen-privacy'));
  document.getElementById('cancel-privacy').addEventListener('click', () => navigateTo('screen-landing'));
  
  document.getElementById('accept-privacy').addEventListener('click', async () => {
    navigateTo('screen-camera');
    updateQuoteOverlay();
    await initCamera();
  });

  document.getElementById('prev-quote').addEventListener('click', () => {
    currentQuoteIndex = (currentQuoteIndex - 1 + quotes.length) % quotes.length;
    updateQuoteOverlay();
  });

  document.getElementById('next-quote').addEventListener('click', () => {
    currentQuoteIndex = (currentQuoteIndex + 1) % quotes.length;
    updateQuoteOverlay();
  });

  document.getElementById('real-capture-btn').addEventListener('click', capturePhoto);
  
  document.getElementById('retake-photo').addEventListener('click', async () => {
    navigateTo('screen-camera');
    await initCamera();
  });

  document.getElementById('use-photo').addEventListener('click', () => navigateTo('screen-form'));
  
  document.getElementById('form-retake-btn').addEventListener('click', async () => {
    navigateTo('screen-camera');
    await initCamera();
  });

  // Form Submission via Webhook
  document.getElementById('registration-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const fullName = document.getElementById('full-name').value.trim();
    const email = document.getElementById('email').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const industry = document.getElementById('industry').value.trim();
    const errorText = document.getElementById('form-error');
    const submitBtn = document.getElementById('submit-form');

    if (!fullName || !email || !phone || !industry) {
      errorText.innerText = "Please fill out all fields.";
      return;
    }
    
    errorText.innerText = "";
    
    // UI Loading State
    const originalBtnText = submitBtn.innerText;
    submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Submitting...';
    submitBtn.disabled = true;

    // Grab compressed image
    const photoDataUrl = document.getElementById('preview-canvas').toDataURL('image/jpeg', 0.5);

    // Use URLSearchParams to emulate a native HTML form, bypassing CORS issues entirely
    const zapierPayload = new URLSearchParams();
    zapierPayload.append('fullName', fullName);
    zapierPayload.append('email', email);
    zapierPayload.append('phone', phone);
    zapierPayload.append('industry', industry);
    zapierPayload.append('selectedQuote', quotes[currentQuoteIndex].replace('\n', ' '));
    zapierPayload.append('photoData', photoDataUrl);

    try {
      await fetch('https://hooks.zapier.com/hooks/catch/28241915/4u09yyd/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: zapierPayload.toString()
      });

      // Populate Success Screen Details
      document.getElementById('success-name').innerText = fullName;
      document.getElementById('success-industry').innerText = industry;
      
      navigateTo('screen-success');
    } catch (err) {
      console.error("Submission failed:", err);
      errorText.innerText = "Submission failed. Please check your internet and try again.";
    } finally {
      submitBtn.innerText = originalBtnText;
      submitBtn.disabled = false;
    }
  });
});
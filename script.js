document.addEventListener("DOMContentLoaded", () => {
  // --- State Configuration ---
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
  let capturedImageBlob = null;

  // --- HTML Injections for Matching Visual Design Layouts ---
  ['screen-landing', 'screen-camera', 'screen-success'].forEach(id => {
    const target = document.getElementById(id)?.querySelector('.screen-inner');
    if (target && !target.querySelector('.logo')) {
      const logo = document.createElement('img');
      logo.src = 'assets/logo.png';
      logo.alt = 'Alaska Pro logo';
      logo.className = 'logo';
      target.insertBefore(logo, target.firstChild);
    }
  });

  const privacyP = document.querySelector('.privacy-card p');
  if (privacyP) {
    privacyP.innerHTML = 'By continuing, you agree to our <span class="policy-link">Privacy Policy</span> and consent to the use of your photo for this event.';
  }

  const cameraStage = document.querySelector('.camera-stage');
  if (cameraStage && !document.getElementById('camera-controls-hub')) {
    const hub = document.createElement('div');
    hub.id = 'camera-controls-hub';
    hub.className = 'capture-container';
    hub.innerHTML = `
      <button type="button" class="side-control-btn">🔄</button>
      <button type="button" id="real-capture-btn" class="capture-btn"></button>
      <button type="button" class="side-control-btn">📤</button>
    `;
    cameraStage.parentNode.appendChild(hub);
    
    const oldBtn = document.getElementById('capture-button');
    if (oldBtn) oldBtn.style.display = 'none';
  }

  const form = document.getElementById('registration-form');
  if (form) {
    form.innerHTML = `
      <input type="text" id="full-name" name="fullName" class="form-input" placeholder="Full Name" required />
      <input type="email" id="email" name="email" class="form-input" placeholder="Email Address" required />
      <input type="tel" id="phone" name="phone" class="form-input" placeholder="Phone Number" required />
      <input type="text" id="industry" name="industry" class="form-input" placeholder="Industry" required />
      <p id="form-error" class="error-text" aria-live="polite"></p>
      <button id="submit-form" class="primary-btn" type="submit">SUBMIT</button>
      <button type="button" id="form-retake-btn" class="secondary-btn">RETAKE</button>
    `;
  }

  const previewInner = document.querySelector('.preview-screen');
  if (previewInner && !document.getElementById('dl-link')) {
    const dl = document.createElement('a');
    dl.id = 'dl-link';
    dl.href = '#';
    dl.className = 'download-link';
    dl.innerHTML = '📥 Download Photo';
    previewInner.appendChild(dl);
  }

  const successInner = document.querySelector('.success-screen');
  if (successInner && !successInner.querySelector('.footer-notice')) {
    const notice = document.createElement('p');
    notice.className = 'footer-notice';
    notice.innerText = 'Show this screen to the organizer to get your free taste';
    successInner.appendChild(notice);
  }

  // --- Navigation Router ---
  function navigateTo(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const target = document.getElementById(screenId);
    if (target) target.classList.add('active');
    
    if (screenId !== 'screen-camera' && screenId !== 'screen-privacy') {
      stopCamera();
    }
  }

  // --- Hardware Camera Utilities ---
  async function initCamera() {
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1080 }, height: { ideal: 1920 } },
        audio: false
      });
      const videoElement = document.getElementById('camera-video');
      if (videoElement) videoElement.srcObject = stream;
    } catch (err) {
      console.error("Camera access error: ", err);
      alert("Unable to access camera. Simulating layout view.");
    }
  }

  function stopCamera() {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      stream = null;
    }
  }

  function updateQuoteOverlay() {
    const overlay = document.getElementById('quote-overlay');
    if (overlay) overlay.innerText = quotes[currentQuoteIndex];
  }

  // --- Dynamic Canvas Core Text Processing Engine ---
  function capturePhoto() {
    const video = document.getElementById('camera-video');
    const canvas = document.getElementById('preview-canvas');
    if (!canvas || !video) return;

    const ctx = canvas.getContext('2d');
    
    canvas.width = 720;
    canvas.height = 1080;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Apply exact visual typography details using Rubik inside the HTML5 Canvas
    ctx.fillStyle = "white";
    ctx.font = "bold 44px Rubik, sans-serif";
    ctx.textAlign = "left";
    ctx.shadowColor = "rgba(0,0,0,0.8)";
    ctx.shadowBlur = 8;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;

    const lines = quotes[currentQuoteIndex].split('\n');
    let yOffset = canvas.height - 180;
    lines.forEach(line => {
      ctx.fillText(line, 40, yOffset);
      yOffset += 55;
    });

    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    const dataUrl = canvas.toDataURL('image/jpeg');
    document.getElementById('photo-thumb').src = dataUrl;
    document.getElementById('final-image').src = dataUrl;
    document.getElementById('dl-link').href = dataUrl;
    document.getElementById('dl-link').download = 'alaska_pro_badge.jpg';

    navigateTo('screen-preview');
  }

  // --- Interaction Event Actions listeners ---
  document.getElementById('start-registration')?.addEventListener('click', () => navigateTo('screen-privacy'));
  document.getElementById('cancel-privacy')?.addEventListener('click', () => navigateTo('screen-landing'));
  
  document.getElementById('accept-privacy')?.addEventListener('click', async () => {
    navigateTo('screen-camera');
    updateQuoteOverlay();
    await initCamera();
  });

  document.getElementById('prev-quote')?.addEventListener('click', () => {
    currentQuoteIndex = (currentQuoteIndex - 1 + quotes.length) % quotes.length;
    updateQuoteOverlay();
  });

  document.getElementById('next-quote')?.addEventListener('click', () => {
    currentQuoteIndex = (currentQuoteIndex + 1) % quotes.length;
    updateQuoteOverlay();
  });

  document.getElementById('real-capture-btn')?.addEventListener('click', capturePhoto);
  
  document.getElementById('retake-photo')?.addEventListener('click', async () => {
    navigateTo('screen-camera');
    await initCamera();
  });

  document.getElementById('use-photo')?.addEventListener('click', () => navigateTo('screen-form'));
  document.getElementById('form-retake-btn')?.addEventListener('click', async () => {
    navigateTo('screen-camera');
    await initCamera();
  });

  // --- Form & Zapier Payload Request System Handler ---
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const fullName = document.getElementById('full-name').value.trim();
    const email = document.getElementById('email').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const industry = document.getElementById('industry').value.trim();
    const errorText = document.getElementById('form-error');

    // Basic Validation Check
    if (!fullName || !email || !phone || !industry) {
      if (errorText) errorText.innerText = "Please fill out all fields.";
      return;
    }

    if (errorText) errorText.innerText = "";
    navigateTo('screen-loading');

    const canvas = document.getElementById('preview-canvas');
    const photoDataUrl = canvas ? canvas.toDataURL('image/jpeg') : '';

    // URLSearchParams sends data exactly like a traditional HTML form submission.
    // This allows Zapier to read every single field reliably without CORS issues.
    const formData = new URLSearchParams();
    formData.append('fullName', fullName);
    formData.append('email', email);
    formData.append('phone', phone);
    formData.append('industry', industry);
    formData.append('selectedQuote', quotes[currentQuoteIndex].replace('\n', ' '));
    formData.append('photoData', photoDataUrl); 

    try {
      // Send data to Zapier using standard form submission styling
      await fetch('https://hooks.zapier.com/hooks/catch/28241915/4u09yyd/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: formData.toString()
      });

      // Inject values to the digital badge screen
      document.getElementById('success-name').innerText = fullName;
      document.getElementById('success-industry').innerText = industry;
      
      navigateTo('screen-success');
    } catch (err) {
      console.error("Submission failed:", err);
      alert("Submission encountered an error. Please try again.");
      navigateTo('screen-form');
    }
  });
});
/* ============================================
   SPEAKUP — CAPTCHA MODULE (captcha.js)
   Math-based CAPTCHA — no external API needed
   Works on: login.html, signup.html
   ============================================ */

(function() {

  // ── Generate a random math question ──
  function generateCaptcha() {
    const ops = ['+', '-', '*'];
    const op = ops[Math.floor(Math.random() * ops.length)];
    let a, b, answer;

    if (op === '+') {
      a = Math.floor(Math.random() * 12) + 1;
      b = Math.floor(Math.random() * 12) + 1;
      answer = a + b;
    } else if (op === '-') {
      a = Math.floor(Math.random() * 12) + 5;
      b = Math.floor(Math.random() * a) + 1;
      answer = a - b;
    } else {
      a = Math.floor(Math.random() * 8) + 2;
      b = Math.floor(Math.random() * 5) + 2;
      answer = a * b;
    }

    const opSymbols = { '+': '+', '-': '−', '*': '×' };
    return {
      question: `${a} ${opSymbols[op]} ${b}`,
      answer: answer
    };
  }

  // ── Draw the CAPTCHA on a canvas ──
  function drawCaptcha(canvas, question) {
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;

    // Background
    ctx.fillStyle = '#1a2b3c';
    ctx.fillRect(0, 0, W, H);

    // Noise lines
    for (let i = 0; i < 6; i++) {
      ctx.beginPath();
      ctx.moveTo(Math.random() * W, Math.random() * H);
      ctx.lineTo(Math.random() * W, Math.random() * H);
      ctx.strokeStyle = `rgba(122,175,197,${Math.random() * 0.3 + 0.1})`;
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Noise dots
    for (let i = 0; i < 40; i++) {
      ctx.fillStyle = `rgba(74,120,153,${Math.random() * 0.4})`;
      ctx.beginPath();
      ctx.arc(Math.random() * W, Math.random() * H, Math.random() * 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Question text with slight distortion
    ctx.font = 'bold 22px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const chars = (question + ' = ?').split('');
    const totalWidth = chars.length * 16;
    let x = (W - totalWidth) / 2 + 8;
    const midY = H / 2;

    chars.forEach((char, i) => {
      const rotate = (Math.random() - 0.5) * 0.4;
      const yOffset = (Math.random() - 0.5) * 8;
      ctx.save();
      ctx.translate(x, midY + yOffset);
      ctx.rotate(rotate);

      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillText(char, 1, 1);

      // Main text — alternate colors
      const colors = ['#7aafc5', '#EDE8DC', '#9ac5d8', '#b8d4e3'];
      ctx.fillStyle = colors[i % colors.length];
      ctx.fillText(char, 0, 0);

      ctx.restore();
      x += 16;
    });

    // Border
    ctx.strokeStyle = 'rgba(74,120,153,0.4)';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, W, H);
  }

  // ── Inject a CAPTCHA widget into a container ──
  function injectCaptcha(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    let captchaData = generateCaptcha();
    let attempts = 0;

    container.innerHTML = `
      <div class="captcha-wrapper">
        <label class="form-label" id="captcha-label">
          Security Check — Solve the equation
        </label>
        <div class="captcha-inner" role="group" aria-labelledby="captcha-label">
          <div class="captcha-canvas-wrap">
            <canvas
              id="captcha-canvas"
              width="220"
              height="56"
              role="img"
              aria-label="CAPTCHA equation: ${captchaData.question} = ?"
              style="border-radius:8px;display:block;"
            ></canvas>
            <button
              type="button"
              id="captcha-refresh"
              class="captcha-refresh-btn"
              aria-label="Refresh CAPTCHA — get a new equation"
              title="New equation"
            >&#8635;</button>
          </div>
          <div class="captcha-input-wrap">
            <input
              type="number"
              id="captcha-answer"
              class="form-input captcha-input"
              placeholder="Your answer"
              autocomplete="off"
              aria-label="Enter the answer to the CAPTCHA equation"
              aria-required="true"
              aria-describedby="captcha-hint captcha-status"
            >
            <div id="captcha-hint" class="form-hint">Enter the numeric answer shown above.</div>
            <div id="captcha-status" class="captcha-status" aria-live="polite" aria-atomic="true"></div>
          </div>
        </div>
        <div id="captcha-feedback" class="captcha-feedback hidden"></div>
      </div>
    `;

    // Draw initial captcha
    const canvas = document.getElementById('captcha-canvas');
    drawCaptcha(canvas, captchaData.question);

    // Refresh button
    document.getElementById('captcha-refresh').addEventListener('click', () => {
      captchaData = generateCaptcha();
      drawCaptcha(canvas, captchaData.question);
      canvas.setAttribute('aria-label', `CAPTCHA equation: ${captchaData.question} = ?`);
      document.getElementById('captcha-answer').value = '';
      document.getElementById('captcha-status').textContent = '';
      document.getElementById('captcha-feedback').classList.add('hidden');
      if (window.a11yAnnounce) window.a11yAnnounce('CAPTCHA refreshed. New equation loaded.');
    });

    // Real-time validation feel
    document.getElementById('captcha-answer').addEventListener('input', function() {
      const val = parseInt(this.value);
      const status = document.getElementById('captcha-status');
      if (!this.value) { status.textContent = ''; return; }
      if (val === captchaData.answer) {
        status.textContent = 'Correct';
        status.style.color = '#7fbe9e';
      } else {
        status.textContent = '';
      }
    });

    // Expose verify function on the container
    container._verifyCaptcha = function() {
      const input = document.getElementById('captcha-answer');
      const feedback = document.getElementById('captcha-feedback');
      const val = parseInt(input?.value);

      if (isNaN(val)) {
        feedback.textContent = 'Please solve the equation before submitting.';
        feedback.className = 'captcha-feedback error';
        input?.focus();
        if (window.a11yAnnounce) window.a11yAnnounce('CAPTCHA not completed. Please solve the equation.');
        attempts++;
        if (attempts >= 3) { captchaData = generateCaptcha(); drawCaptcha(canvas, captchaData.question); attempts = 0; }
        return false;
      }

      if (val !== captchaData.answer) {
        feedback.textContent = 'Incorrect answer. A new equation has been generated.';
        feedback.className = 'captcha-feedback error';
        captchaData = generateCaptcha();
        drawCaptcha(canvas, captchaData.question);
        input.value = '';
        input?.focus();
        if (window.a11yAnnounce) window.a11yAnnounce('CAPTCHA answer incorrect. A new equation has been generated.');
        return false;
      }

      feedback.textContent = 'Verified.';
      feedback.className = 'captcha-feedback success';
      if (window.a11yAnnounce) window.a11yAnnounce('CAPTCHA verified successfully.');
      return true;
    };
  }

  // Expose globally
  window.initCaptcha = injectCaptcha;

})();
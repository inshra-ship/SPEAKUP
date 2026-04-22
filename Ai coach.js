/* ============================================
   SPEAKUP — AI COACH WIDGET (ai-coach.js)
   Floating chat assistant on every page.
   Uses Anthropic API via fetch.
   ============================================ */

(function () {

  // ── CSS for the chat widget ──
  const styles = `
    #ai-coach-btn {
      position: fixed;
      bottom: 32px;
      left: 24px;
      z-index: 8500;
      width: 54px;
      height: 54px;
      border-radius: 50%;
      background: linear-gradient(135deg, #213448, #4A7899);
      border: 1px solid rgba(122,175,197,0.4);
      color: white;
      font-size: 22px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 24px rgba(0,0,0,0.5);
      transition: all 0.25s;
      font-family: Helvetica, Arial, sans-serif;
    }
    #ai-coach-btn:hover {
      transform: scale(1.08);
      box-shadow: 0 6px 32px rgba(74,120,153,0.5);
      border-color: rgba(122,175,197,0.7);
    }
    #ai-coach-btn .ai-btn-label {
      position: absolute;
      left: 62px;
      background: var(--bg-card, #1a2b3c);
      border: 1px solid rgba(74,120,153,0.3);
      border-radius: 6px;
      padding: 5px 10px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.07em;
      text-transform: uppercase;
      color: #EDE8DC;
      white-space: nowrap;
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.2s;
    }
    #ai-coach-btn:hover .ai-btn-label { opacity: 1; }

    #ai-coach-panel {
      position: fixed;
      bottom: 96px;
      left: 24px;
      width: 360px;
      max-height: 540px;
      background: #1a2b3c;
      border: 1px solid rgba(74,120,153,0.35);
      border-radius: 16px;
      box-shadow: 0 16px 64px rgba(0,0,0,0.6);
      z-index: 8499;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      transform: scale(0.95) translateY(10px);
      opacity: 0;
      pointer-events: none;
      transition: transform 0.25s ease, opacity 0.25s ease;
    }
    #ai-coach-panel.open {
      transform: scale(1) translateY(0);
      opacity: 1;
      pointer-events: all;
    }

    .ai-panel-header {
      padding: 16px 18px;
      background: linear-gradient(135deg, rgba(33,52,72,0.9), rgba(74,120,153,0.2));
      border-bottom: 1px solid rgba(74,120,153,0.25);
      display: flex;
      align-items: center;
      gap: 12px;
      flex-shrink: 0;
    }
    .ai-avatar {
      width: 36px; height: 36px; border-radius: 50%;
      background: linear-gradient(135deg, #4A7899, #7aafc5);
      display: flex; align-items: center; justify-content: center;
      font-size: 16px; flex-shrink: 0;
    }
    .ai-header-info { flex: 1; }
    .ai-header-name { font-size: 14px; font-weight: 700; color: #EDE8DC; margin-bottom: 2px; }
    .ai-header-status {
      font-size: 11px; color: rgba(237,232,220,0.5);
      display: flex; align-items: center; gap: 5px;
    }
    .ai-status-dot {
      width: 6px; height: 6px; border-radius: 50%; background: #7fbe9e;
      animation: ai-pulse 2s infinite;
    }
    @keyframes ai-pulse { 0%,100%{opacity:1;} 50%{opacity:0.3;} }
    .ai-close-btn {
      background: none; border: none; cursor: pointer;
      color: rgba(237,232,220,0.4); font-size: 18px;
      padding: 4px; border-radius: 4px; transition: color 0.2s;
      font-family: Helvetica, Arial, sans-serif;
    }
    .ai-close-btn:hover { color: #EDE8DC; }

    .ai-messages {
      flex: 1; overflow-y: auto; padding: 16px;
      display: flex; flex-direction: column; gap: 12px;
      scroll-behavior: smooth;
    }
    .ai-messages::-webkit-scrollbar { width: 4px; }
    .ai-messages::-webkit-scrollbar-thumb { background: rgba(74,120,153,0.3); border-radius: 2px; }

    .ai-msg {
      display: flex; gap: 8px; align-items: flex-end; max-width: 88%;
    }
    .ai-msg.user { align-self: flex-end; flex-direction: row-reverse; }
    .ai-msg.bot { align-self: flex-start; }

    .ai-msg-bubble {
      padding: 10px 14px; border-radius: 12px;
      font-family: Helvetica, Arial, sans-serif; font-size: 13px; line-height: 1.6;
    }
    .ai-msg.bot .ai-msg-bubble {
      background: rgba(74,120,153,0.15);
      border: 1px solid rgba(122,175,197,0.2);
      color: #EDE8DC;
      border-radius: 4px 12px 12px 12px;
    }
    .ai-msg.user .ai-msg-bubble {
      background: #4A7899;
      color: #fff;
      border-radius: 12px 4px 12px 12px;
    }
    .ai-msg-time {
      font-size: 10px; color: rgba(237,232,220,0.3);
      margin-top: 4px; text-align: right;
    }
    .ai-msg.bot .ai-msg-time { text-align: left; }

    .ai-typing {
      display: flex; gap: 4px; align-items: center;
      padding: 12px 14px;
      background: rgba(74,120,153,0.1);
      border: 1px solid rgba(122,175,197,0.15);
      border-radius: 4px 12px 12px 12px;
      width: fit-content;
    }
    .ai-typing span {
      width: 6px; height: 6px; border-radius: 50%;
      background: rgba(122,175,197,0.6);
      animation: ai-bounce 1.2s infinite;
    }
    .ai-typing span:nth-child(2) { animation-delay: 0.2s; }
    .ai-typing span:nth-child(3) { animation-delay: 0.4s; }
    @keyframes ai-bounce { 0%,80%,100%{transform:translateY(0);} 40%{transform:translateY(-6px);} }

    .ai-quick-prompts {
      display: flex; gap: 6px; flex-wrap: wrap;
      padding: 0 16px 10px;
    }
    .ai-quick {
      padding: 5px 12px; border-radius: 999px;
      border: 1px solid rgba(74,120,153,0.3);
      background: transparent; color: rgba(237,232,220,0.65);
      font-family: Helvetica, Arial, sans-serif;
      font-size: 11px; font-weight: 600; cursor: pointer;
      transition: all 0.15s; letter-spacing: 0.03em; white-space: nowrap;
    }
    .ai-quick:hover {
      background: rgba(74,120,153,0.2);
      border-color: rgba(122,175,197,0.5);
      color: #EDE8DC;
    }

    .ai-input-area {
      padding: 12px 16px;
      border-top: 1px solid rgba(74,120,153,0.2);
      display: flex; gap: 8px; align-items: flex-end;
      flex-shrink: 0;
    }
    .ai-input {
      flex: 1; background: rgba(74,120,153,0.1);
      border: 1px solid rgba(74,120,153,0.25);
      border-radius: 10px; padding: 9px 12px;
      color: #EDE8DC; font-family: Helvetica, Arial, sans-serif;
      font-size: 13px; outline: none; resize: none;
      max-height: 100px; min-height: 38px;
      line-height: 1.5; transition: border-color 0.2s;
    }
    .ai-input:focus { border-color: rgba(122,175,197,0.5); }
    .ai-input::placeholder { color: rgba(237,232,220,0.3); }
    .ai-send-btn {
      width: 38px; height: 38px; border-radius: 10px;
      background: #4A7899; border: none; cursor: pointer;
      color: white; font-size: 16px;
      display: flex; align-items: center; justify-content: center;
      transition: background 0.2s; flex-shrink: 0;
    }
    .ai-send-btn:hover { background: #3d6b8a; }
    .ai-send-btn:disabled { opacity: 0.4; pointer-events: none; }

    .ai-disclaimer {
      padding: 8px 16px 12px;
      font-size: 10px; color: rgba(237,232,220,0.3);
      text-align: center; line-height: 1.5; flex-shrink: 0;
    }

    @media (max-width: 480px) {
      #ai-coach-panel { width: calc(100vw - 32px); left: 16px; bottom: 80px; }
    }
  `;

  // Inject styles
  const styleEl = document.createElement('style');
  styleEl.textContent = styles;
  document.head.appendChild(styleEl);

  // ── Conversation history ──
  const history = [];
  let isLoading = false;

  // ── Build widget HTML ──
  function buildWidget() {
    if (document.getElementById('ai-coach-btn')) return;

    const btn = document.createElement('button');
    btn.id = 'ai-coach-btn';
    btn.setAttribute('aria-label', 'Open AI Coach chat');
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-controls', 'ai-coach-panel');
    btn.innerHTML = `
      <span aria-hidden="true">&#9711;</span>
      <span class="ai-btn-label">AI Coach</span>
    `;
    document.body.appendChild(btn);

    const panel = document.createElement('div');
    panel.id = 'ai-coach-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'AI Speaking Coach');
    panel.setAttribute('aria-hidden', 'true');
    panel.innerHTML = `
      <div class="ai-panel-header">
        <div class="ai-avatar" aria-hidden="true">&#9711;</div>
        <div class="ai-header-info">
          <div class="ai-header-name">Aria — AI Speaking Coach</div>
          <div class="ai-header-status"><span class="ai-status-dot"></span>Ready to help you practice</div>
        </div>
        <button class="ai-close-btn" id="ai-close-btn" aria-label="Close AI Coach">&#215;</button>
      </div>
      <div class="ai-messages" id="ai-messages" role="log" aria-live="polite" aria-label="Chat messages"></div>
      <div class="ai-quick-prompts" id="ai-quick-prompts">
        <button class="ai-quick" data-msg="How do I stop being nervous before speaking?">Nervousness tips</button>
        <button class="ai-quick" data-msg="What is the best structure for a short speech?">Speech structure</button>
        <button class="ai-quick" data-msg="Give me a quick warm-up exercise for public speaking.">Warm-up exercise</button>
        <button class="ai-quick" data-msg="How do I make eye contact with a large audience?">Eye contact</button>
      </div>
      <div class="ai-input-area">
        <textarea class="ai-input" id="ai-input" placeholder="Ask your speaking coach anything..." rows="1" aria-label="Message to AI coach" aria-multiline="true"></textarea>
        <button class="ai-send-btn" id="ai-send-btn" aria-label="Send message">&#8594;</button>
      </div>
      <div class="ai-disclaimer">Aria is an AI. For professional coaching, see <a href="map.html" style="color:rgba(122,175,197,0.7);">Find a Coach</a>.</div>
    `;
    document.body.appendChild(panel);

    // Show welcome message
    addBotMessage("Hi, I'm Aria, your AI speaking coach. I'm here to help you with techniques, tips, and encouragement. What would you like to work on today?");

    // Events
    btn.addEventListener('click', togglePanel);
    document.getElementById('ai-close-btn').addEventListener('click', closePanel);

    document.getElementById('ai-send-btn').addEventListener('click', sendMessage);

    const input = document.getElementById('ai-input');
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });
    // Auto-resize textarea
    input.addEventListener('input', function() {
      this.style.height = 'auto';
      this.style.height = Math.min(this.scrollHeight, 100) + 'px';
    });

    // Quick prompts
    document.getElementById('ai-quick-prompts').addEventListener('click', e => {
      const btn = e.target.closest('.ai-quick');
      if (!btn) return;
      document.getElementById('ai-input').value = btn.dataset.msg;
      sendMessage();
    });

    // Close on Escape
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && panel.classList.contains('open')) closePanel();
    });
  }

  function togglePanel() {
    const panel = document.getElementById('ai-coach-panel');
    const btn = document.getElementById('ai-coach-btn');
    const isOpen = panel.classList.contains('open');
    panel.classList.toggle('open', !isOpen);
    btn.setAttribute('aria-expanded', String(!isOpen));
    panel.setAttribute('aria-hidden', String(isOpen));
    if (!isOpen) {
      setTimeout(() => document.getElementById('ai-input')?.focus(), 200);
      if (window.a11yAnnounce) window.a11yAnnounce('AI Coach opened. Ask any public speaking question.');
    }
  }

  function closePanel() {
    const panel = document.getElementById('ai-coach-panel');
    panel.classList.remove('open');
    document.getElementById('ai-coach-btn').setAttribute('aria-expanded', 'false');
    panel.setAttribute('aria-hidden', 'true');
    document.getElementById('ai-coach-btn').focus();
  }

  // ── Add messages to the chat ──
  function getTime() {
    const now = new Date();
    return now.getHours().toString().padStart(2,'0') + ':' + now.getMinutes().toString().padStart(2,'0');
  }

  function addBotMessage(text) {
    const msgs = document.getElementById('ai-messages');
    if (!msgs) return;
    const div = document.createElement('div');
    div.className = 'ai-msg bot';
    div.innerHTML = `
      <div>
        <div class="ai-msg-bubble">${text}</div>
        <div class="ai-msg-time">${getTime()}</div>
      </div>
    `;
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
  }

  function addUserMessage(text) {
    const msgs = document.getElementById('ai-messages');
    if (!msgs) return;
    const div = document.createElement('div');
    div.className = 'ai-msg user';
    div.innerHTML = `
      <div>
        <div class="ai-msg-bubble">${escapeHtml(text)}</div>
        <div class="ai-msg-time">${getTime()}</div>
      </div>
    `;
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
  }

  function showTyping() {
    const msgs = document.getElementById('ai-messages');
    if (!msgs) return;
    const div = document.createElement('div');
    div.className = 'ai-msg bot';
    div.id = 'ai-typing-indicator';
    div.innerHTML = `<div class="ai-typing"><span></span><span></span><span></span></div>`;
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
  }

  function removeTyping() {
    document.getElementById('ai-typing-indicator')?.remove();
  }

  function escapeHtml(s) {
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  // ── Send message to Anthropic API ──
  async function sendMessage() {
    const input = document.getElementById('ai-input');
    const sendBtn = document.getElementById('ai-send-btn');
    const text = input.value.trim();
    if (!text || isLoading) return;

    // Clear input
    input.value = '';
    input.style.height = 'auto';

    // Hide quick prompts after first message
    const quickPrompts = document.getElementById('ai-quick-prompts');
    if (quickPrompts) quickPrompts.style.display = 'none';

    addUserMessage(text);
    history.push({ role: 'user', content: text });

    isLoading = true;
    sendBtn.disabled = true;
    showTyping();

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system: `You are Aria, a warm, encouraging AI public speaking coach embedded in SpeakUp — a website that helps people build confidence in public speaking.

Your role:
- Give practical, actionable advice on public speaking, presentations, confidence, vocal delivery, structure, eye contact, nervousness, stage fright, and related topics.
- Keep responses concise and conversational — under 120 words unless asked for a detailed explanation.
- Use plain language. No jargon unless explaining it.
- Be encouraging but honest. This is a safe, judgment-free space.
- If asked about topics unrelated to speaking or communication, politely redirect.
- Mention practice scenarios on SpeakUp (like elevator pitches, class presentations) when relevant.
- Never claim to replace a human coach. Suggest the coach finder page for professional help.

Current page: ${window.location.pathname.split('/').pop() || 'index.html'}`,
          messages: history
        })
      });

      const data = await response.json();
      removeTyping();

      if (data.content && data.content[0]) {
        const reply = data.content.map(b => b.text || '').join('');
        history.push({ role: 'assistant', content: reply });
        addBotMessage(reply);
        if (window.a11yAnnounce) window.a11yAnnounce('Aria replied: ' + reply.substring(0, 80));
      } else if (data.error) {
        addBotMessage('I am having trouble connecting right now. Please try again in a moment. In the meantime, try practicing with one of the scenarios on the Scenarios page.');
      }
    } catch (err) {
      removeTyping();
      addBotMessage('Connection issue. Please check your internet and try again. You can still practice using the structured guides on the Practice page.');
      console.error('AI Coach error:', err);
    } finally {
      isLoading = false;
      sendBtn.disabled = false;
      input.focus();
    }
  }

  // Init after DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', buildWidget);
  } else {
    buildWidget();
  }

})();
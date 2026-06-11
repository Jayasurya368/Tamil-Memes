(function () {
  if (document.getElementById('tmw-fab')) return; // prevent double load

  /* ── LOGO (base64 embedded) ── */
  const LOGO ='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'
  /* ── MEME DATA ── */
  const MEMES = [
    { title: "Kambi katti kondu irukiraargal template", tags: ["comedy","talking","argument","discussion"], download: "https://www.mediafire.com/file/a9p8fzxl0oshjeg/Kambi+katti+kondu+irukirargal.mp4/file" },
    { title: "Nippon paint comedy template", tags: ["comedy","funny","paint","ad","viral"], download: "https://www.mediafire.com/file/895znytqzbsxx2s/nippon+comedy+comedy+template.mp4/file" },
    { title: "Kiraga bundaiya tamil meme template", tags: ["angry","irritated","reaction","frustrated"], download: "https://www.mediafire.com/file/8a5qje1pwc66v06/kiraga+bundhaiaya+pesitu+irukaan.mp4/file" },
    { title: "Cuteness aga unargirar RJ balaji template", tags: ["cute","RJ balaji","feeling","emotional","sweet"], download: "https://www.mediafire.com/file/n9khghbb3pitpsy/cuteness+aga+thannai+unargirar.mp4/file" },
    { title: "Pengalukaga yenna ivlo template", tags: ["girls","women","sacrifice","frustrated","reaction"], download: "https://www.mediafire.com/file/93gqjyx276s8sx1/pengalukaga+yean+na+ivlo+kasta+padringa.mp4/file" },
    { title: "Romba emotional pesita vijay sethupathi template", tags: ["emotional","vijay sethupathi","sad","feeling","heart"], download: "https://www.mediafire.com/file/1z51xiztoqbeay4/Romba+emotional+ah+pesita+nenju+adekithupa.mp4/file" },
  ];

  /* ── STYLES (scoped with #tmw- prefix) ── */
  const CSS = `
    #tmw-fab {
      position: fixed !important;
      bottom: 24px !important;
      right: 24px !important;
      width: 64px !important;
      height: 64px !important;
      border-radius: 50% !important;
      background: #111 !important;
      border: none !important;
      cursor: pointer !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      box-shadow: 0 4px 20px rgba(255,77,77,0.45) !important;
      transition: transform 0.2s, box-shadow 0.2s !important;
      z-index: 2147483646 !important;
      padding: 0 !important;
      overflow: hidden !important;
    }
    #tmw-fab:hover {
      transform: scale(1.1) !important;
      box-shadow: 0 6px 28px rgba(255,77,77,0.65) !important;
    }
    #tmw-fab img.tmw-logo { width:60px;height:60px;border-radius:50%;object-fit:cover;display:block; }
    #tmw-fab svg.tmw-close { display:none;width:22px;height:22px;fill:#fff; }
    #tmw-fab.tmw-open img.tmw-logo { display:none; }
    #tmw-fab.tmw-open svg.tmw-close { display:block; }

    #tmw-panel {
      position: fixed !important;
      bottom: 100px !important;
      right: 24px !important;
      width: 360px !important;
      max-height: 540px !important;
      background: #111 !important;
      border: 1px solid #2a2a2a !important;
      border-radius: 16px !important;
      box-shadow: 0 20px 60px rgba(0,0,0,0.65) !important;
      display: flex !important;
      flex-direction: column !important;
      overflow: hidden !important;
      z-index: 2147483645 !important;
      transform: scale(0.9) translateY(20px) !important;
      opacity: 0 !important;
      pointer-events: none !important;
      transition: transform 0.25s cubic-bezier(0.34,1.56,0.64,1), opacity 0.25s !important;
      font-family: 'Segoe UI', sans-serif !important;
      box-sizing: border-box !important;
    }
    #tmw-panel.tmw-open {
      transform: scale(1) translateY(0) !important;
      opacity: 1 !important;
      pointer-events: all !important;
    }
    #tmw-panel * { box-sizing: border-box; }

    .tmw-header {
      background: linear-gradient(135deg,#1a1a1a,#222);
      padding: 14px 16px;
      display: flex;
      align-items: center;
      gap: 10px;
      border-bottom: 1px solid #2a2a2a;
      flex-shrink: 0;
    }
    .tmw-avatar {
      width:36px;height:36px;border-radius:50%;
      background:linear-gradient(135deg,#ff4d4d,#ff8c00);
      display:flex;align-items:center;justify-content:center;font-size:16px;
    }
    .tmw-hname { font-size:14px;font-weight:600;color:#fff;margin:0; }
    .tmw-hstatus { font-size:11px;color:#4caf50;display:flex;align-items:center;gap:4px; }
    .tmw-dot { width:7px;height:7px;border-radius:50%;background:#4caf50;display:inline-block; }

    .tmw-modes {
      display:flex;gap:6px;padding:8px 14px 0;flex-shrink:0;
    }
    .tmw-mbtn {
      flex:1;padding:6px;border-radius:8px;border:1px solid #2a2a2a;
      background:transparent;color:#666;font-size:11px;cursor:pointer;
      transition:all 0.2s;font-weight:600;
    }
    .tmw-mbtn.tmw-active { background:#1e1e1e;border-color:#ff8c00;color:#ff8c00; }

    .tmw-messages {
      flex:1;overflow-y:auto;padding:14px;
      display:flex;flex-direction:column;gap:10px;
      scrollbar-width:thin;scrollbar-color:#333 transparent;
    }
    @keyframes tmwFadeUp {
      from{opacity:0;transform:translateY(8px);}
      to{opacity:1;transform:translateY(0);}
    }
    .tmw-msg {
      max-width:85%;padding:10px 13px;border-radius:12px;
      font-size:13px;line-height:1.5;animation:tmwFadeUp 0.3s ease;color:#e0e0e0;
    }
    .tmw-bot {
      background:#1e1e1e;border:1px solid #2a2a2a;
      align-self:flex-start;border-bottom-left-radius:4px;
    }
    .tmw-user {
      background:linear-gradient(135deg,#ff4d4d,#ff8c00);
      color:#fff;align-self:flex-end;border-bottom-right-radius:4px;
    }

    .tmw-result {
      background:#1a1a1a;border:1px solid #333;border-radius:10px;
      overflow:hidden;animation:tmwFadeUp 0.3s ease;align-self:stretch;
    }
    .tmw-result-title { padding:8px 12px;font-size:12px;font-weight:600;color:#ff8c00;border-bottom:1px solid #2a2a2a; }
    .tmw-result-item {
      padding:8px 12px;font-size:12px;color:#ccc;border-bottom:1px solid #1e1e1e;
      display:flex;align-items:center;justify-content:space-between;gap:8px;
    }
    .tmw-result-item:last-child{border-bottom:none;}
    .tmw-result-item .tmw-rname{flex:1;}
    .tmw-result-item a {
      background:linear-gradient(135deg,#ff4d4d,#ff8c00);color:#fff;
      text-decoration:none;padding:4px 10px;border-radius:6px;
      font-size:11px;font-weight:600;white-space:nowrap;
    }

    .tmw-caption {
      background:#1a1a1a;border:1px solid #ff4d4d44;border-radius:10px;
      padding:10px 12px;font-size:13px;color:#fff;
      animation:tmwFadeUp 0.3s ease;position:relative;align-self:stretch;
    }
    .tmw-clabel { font-size:10px;color:#ff8c00;font-weight:700;letter-spacing:.5px;margin-bottom:6px;text-transform:uppercase; }
    .tmw-copy {
      position:absolute;top:8px;right:8px;background:#333;border:none;
      color:#aaa;padding:3px 8px;border-radius:5px;font-size:10px;cursor:pointer;
    }
    .tmw-copy:hover{background:#444;color:#fff;}

    .tmw-typing {
      display:flex;gap:4px;align-items:center;padding:10px 13px;
      background:#1e1e1e;border:1px solid #2a2a2a;border-radius:12px;
      border-bottom-left-radius:4px;align-self:flex-start;width:fit-content;
    }
    .tmw-typing span {
      width:6px;height:6px;border-radius:50%;background:#555;
      animation:tmwBounce 1.2s infinite;display:inline-block;
    }
    .tmw-typing span:nth-child(2){animation-delay:.2s;}
    .tmw-typing span:nth-child(3){animation-delay:.4s;}
    @keyframes tmwBounce {
      0%,60%,100%{transform:translateY(0);background:#555;}
      30%{transform:translateY(-5px);background:#ff8c00;}
    }

    .tmw-quick {
      display:flex;flex-wrap:wrap;gap:6px;padding:6px 14px 10px;flex-shrink:0;
    }
    .tmw-qbtn {
      background:#1e1e1e;border:1px solid #333;color:#ccc;
      padding:5px 10px;border-radius:20px;font-size:11px;cursor:pointer;
      transition:all 0.2s;
    }
    .tmw-qbtn:hover{border-color:#ff8c00;color:#ff8c00;}

    .tmw-inputrow {
      padding:10px 12px;border-top:1px solid #2a2a2a;
      display:flex;gap:8px;align-items:center;background:#111;flex-shrink:0;
    }
    .tmw-input {
      flex:1;background:#1a1a1a;border:1px solid #2a2a2a;border-radius:20px;
      padding:8px 14px;color:#fff;font-size:13px;outline:none;
      transition:border-color 0.2s;
    }
    .tmw-input:focus{border-color:#ff8c00;}
    .tmw-input::placeholder{color:#555;}
    .tmw-send {
      width:36px;height:36px;border-radius:50%;flex-shrink:0;
      background:linear-gradient(135deg,#ff4d4d,#ff8c00);border:none;
      cursor:pointer;display:flex;align-items:center;justify-content:center;
      transition:transform 0.2s;
    }
    .tmw-send:hover{transform:scale(1.1);}
    .tmw-send svg{width:16px;height:16px;fill:#fff;}

    @media(max-width:420px){
      #tmw-panel{ width:calc(100vw - 24px) !important; right:12px !important; }
      #tmw-fab{ bottom:16px !important; right:16px !important; }
    }
  `;

  /* ── INJECT STYLES ── */
  const style = document.createElement('style');
  style.id = 'tmw-style';
  style.textContent = CSS;
  document.head.appendChild(style);

  /* ── BUILD HTML ── */
  const fab = document.createElement('button');
  fab.id = 'tmw-fab';
  fab.setAttribute('aria-label', 'Tamil Meme AI');
  fab.innerHTML = `
    <img class="tmw-logo" src="data:image/png;base64,${LOGO}" alt="Tamil Memes" />
    <svg class="tmw-close" viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
  `;

  const panel = document.createElement('div');
  panel.id = 'tmw-panel';
  panel.setAttribute('role', 'dialog');
  panel.innerHTML = `
    <div class="tmw-header">
      <div class="tmw-avatar">🎭</div>
      <div>
        <p class="tmw-hname">Tamil Meme AI</p>
        <span class="tmw-hstatus"><span class="tmw-dot"></span>Online</span>
      </div>
    </div>
    <div class="tmw-modes">
      <button class="tmw-mbtn tmw-active" id="tmw-btn-find">🔍 Find Template</button>
      <button class="tmw-mbtn" id="tmw-btn-caption">✍️ Get Caption</button>
    </div>
    <div class="tmw-messages" id="tmw-messages"></div>
    <div class="tmw-quick" id="tmw-quick"></div>
    <div class="tmw-inputrow">
      <input class="tmw-input" id="tmw-input" placeholder="Search memes or describe scene..." />
      <button class="tmw-send" id="tmw-send">
        <svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
      </button>
    </div>
  `;

  document.body.appendChild(fab);
  document.body.appendChild(panel);

  /* ── STATE ── */
  let mode = 'find';
  let open = false;

  /* ── HELPERS ── */
  const $ = id => document.getElementById(id);
  const msgs = () => $('tmw-messages');

  function scrollBottom() { msgs().scrollTop = msgs().scrollHeight; }

  function addBot(html) {
    const el = document.createElement('div');
    el.className = 'tmw-msg tmw-bot';
    el.innerHTML = html;
    msgs().appendChild(el);
    scrollBottom();
  }
  function addUser(text) {
    const el = document.createElement('div');
    el.className = 'tmw-msg tmw-user';
    el.textContent = text;
    msgs().appendChild(el);
    scrollBottom();
  }
  function addTyping() {
    const el = document.createElement('div');
    el.className = 'tmw-typing'; el.id = 'tmw-typing';
    el.innerHTML = '<span></span><span></span><span></span>';
    msgs().appendChild(el); scrollBottom();
  }
  function removeTyping() { const t = $('tmw-typing'); if (t) t.remove(); }

  function setQuick() {
    const q = $('tmw-quick');
    if (mode === 'find') {
      q.innerHTML = ['angry reaction','comedy','emotional','Vadivelu']
        .map(t => `<button class="tmw-qbtn">${t}</button>`).join('');
    } else {
      q.innerHTML = MEMES.slice(0, 4)
        .map(m => `<button class="tmw-qbtn">${m.title.split(' ').slice(0,3).join(' ')}</button>`).join('');
    }
    q.querySelectorAll('.tmw-qbtn').forEach(b => {
      b.addEventListener('click', () => { $('tmw-input').value = b.textContent; send(); });
    });
  }

  function setMode(m) {
    mode = m;
    $('tmw-btn-find').classList.toggle('tmw-active', m === 'find');
    $('tmw-btn-caption').classList.toggle('tmw-active', m === 'caption');
    $('tmw-input').placeholder = m === 'find' ? 'Search memes or describe scene...' : 'Enter meme title to get a caption...';
    $('tmw-quick').style.display = 'flex';
    setQuick();
  }

  function welcome() {
    addBot(mode === 'find'
      ? '👋 Vanakkam! Describe your situation or search by mood to find the perfect Tamil meme template!'
      : '✍️ Send me a meme title and I\'ll generate funny Tanglish captions!');
  }

  /* ── TOGGLE ── */
  fab.addEventListener('click', () => {
    open = !open;
    fab.classList.toggle('tmw-open', open);
    panel.classList.toggle('tmw-open', open);
    if (open && msgs().children.length === 0) { setQuick(); welcome(); }
  });

  /* ── MODE BUTTONS ── */
  $('tmw-btn-find').addEventListener('click', () => setMode('find'));
  $('tmw-btn-caption').addEventListener('click', () => setMode('caption'));

  /* ── SEND ── */
  async function send() {
    const input = $('tmw-input');
    const text = input.value.trim();
    if (!text) return;
    input.value = '';
    addUser(text);
    $('tmw-quick').style.display = 'none';
    addTyping();
    mode === 'find' ? await findMemes(text) : await genCaption(text);
  }

  $('tmw-send').addEventListener('click', send);
  $('tmw-input').addEventListener('keydown', e => { if (e.key === 'Enter') send(); });

  /* ── FIND MEMES ── */
  /* ── FIND MEMES ── */
  async function findMemes(query) {
    const list = MEMES.map((m,i) => `${i}: "${m.title}" [tags: ${m.tags.join(', ')}]`).join('\n');
    try {
      // Prompt telling Gemini how to look through your MEMES array and match the text
      const customPrompt = `You are a Tamil meme template finder. Given a user query, find the best matching memes from this list:\n${list}\n\nRespond ONLY with a valid JSON object: {"matches":[0,2],"message":"short friendly reply"}. Up to 3 best matches by index. If there are no matches, respond with: {"matches":[],"message":"Sorry message"}. Do not output markdown, do not write backticks (\`\`\`json), just provide pure raw JSON text.`;

      // Routing directly to your hidden Vercel serverless function
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: `${customPrompt}\n\nUser Query: ${query}` 
        })
      });
      
      if (!res.ok) throw new Error('API error: ' + res.status);
      const data = await res.json();
      removeTyping();

      // Support multiple response shapes from the /api/chat proxy:
      // 1. Raw Gemini passthrough: data.candidates[0].content.parts[0].text
      // 2. Simple wrapper:        data.reply | data.text | data.message
      let rawText = '';
      if (data.candidates && data.candidates[0]) {
        rawText = data.candidates[0].content.parts[0].text.trim();
      } else if (typeof data.reply === 'string') {
        rawText = data.reply.trim();
      } else if (typeof data.text === 'string') {
        rawText = data.text.trim();
      } else if (typeof data.message === 'string') {
        rawText = data.message.trim();
      } else {
        throw new Error('Unknown API response: ' + JSON.stringify(data).slice(0, 120));
      }

      // Strip markdown code fences if model accidentally adds them
      if (rawText.startsWith('`')) {
        rawText = rawText.replace(/^```json\s*/i, '').replace(/```$/, '').trim();
      }

      const parsed = JSON.parse(rawText);
      addBot(parsed.message);
      
      if (parsed.matches && parsed.matches.length) {
        const el = document.createElement('div');
        el.className = 'tmw-result';
        el.innerHTML = `<div class="tmw-result-title">🎬 ${parsed.matches.length} Template${parsed.matches.length>1?'s':''} Found</div>`
          + parsed.matches.map(i => {
            const m = MEMES[i];
            return `<div class="tmw-result-item"><span class="tmw-rname">${m.title}</span><a href="${m.download}" target="_blank" rel="noopener">⬇ Download</a></div>`;
          }).join('');
        msgs().appendChild(el); 
        scrollBottom();
      }
    } catch(e) { 
      console.error(e);
      removeTyping(); 
      addBot('Oops! Something went wrong. Try again 😅'); 
    }
  }

  /* ── GENERATE CAPTION ── */
  async function genCaption(title) {
    try {
      const customPrompt = `You are a Tamil meme caption generator. Generate 2 funny, relatable Tanglish captions (Tamil + English mix like real meme pages) for the meme title provided. Respond ONLY with a valid JSON object matching this schema exactly: {"captions":["caption1","caption2"]}. Do not use markdown blocks, do not wrap your response in backticks, just output raw text JSON.`;

      // Routing directly to your hidden Vercel serverless function
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: `${customPrompt}\n\nMeme: ${title}` 
        })
      });

      if (!res.ok) throw new Error('API error: ' + res.status);
      const data = await res.json();
      removeTyping();

      let rawText = '';
      if (data.candidates && data.candidates[0]) {
        rawText = data.candidates[0].content.parts[0].text.trim();
      } else if (typeof data.reply === 'string') {
        rawText = data.reply.trim();
      } else if (typeof data.text === 'string') {
        rawText = data.text.trim();
      } else if (typeof data.message === 'string') {
        rawText = data.message.trim();
      } else {
        throw new Error('Unknown API response: ' + JSON.stringify(data).slice(0, 120));
      }
      if (rawText.startsWith('`')) {
        rawText = rawText.replace(/^```json\s*/i, '').replace(/```$/, '').trim();
      }

      const parsed = JSON.parse(rawText);
      addBot('✨ Here are your captions:');
      
      parsed.captions.forEach(cap => {
        const el = document.createElement('div');
        el.className = 'tmw-caption';
        el.innerHTML = `<div class="tmw-clabel">💬 Caption</div><button class="tmw-copy">Copy</button>${cap}`;
        el.querySelector('.tmw-copy').addEventListener('click', function() {
          navigator.clipboard.writeText(cap).then(() => {
            this.textContent = 'Copied!';
            setTimeout(() => this.textContent = 'Copy', 2000);
          });
        });
        msgs().appendChild(el);
      });
      scrollBottom();
    } catch(e) { 
      console.error(e);
      removeTyping(); 
      addBot('Oops! Something went wrong. Try again 😅'); 
    }
  }

})();
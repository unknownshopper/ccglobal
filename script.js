// Año dinámico en footer
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

// Navegación activa por URL
const navLinks = document.querySelectorAll('.site-nav a[href]');
function setActiveLink(link){
  navLinks.forEach(l => {
    l.classList.remove('active');
    l.removeAttribute('aria-current');
  });
  if (link){
    link.classList.add('active');
    link.setAttribute('aria-current','page');
  }
}
function setActiveByPath() {
  const path = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  if (path === 'prodserv.html') {
    setActiveLink(document.querySelector('.site-nav a[href$="prodserv.html"]'));
  } else if (path === 'otserv.html') {
    // Otros servicios pertenece a la sección de Productos y Servicios
    setActiveLink(document.querySelector('.site-nav a[href$="prodserv.html"]'));
  } else if (path === 'contacto.html') {
    setActiveLink(document.querySelector('.site-nav a[href$="contacto.html"]'));
  } else {
    setActiveLink(document.querySelector('.site-nav a[href*="#inicio"]'));
  }
}
setActiveByPath();

// Realce de navegación por sección visible (solo aplica en index)
(function enableSectionObserverIfHome(){
  const isHome = /(index\.html)?$/i.test((location.pathname.split('/').pop() || 'index.html'));
  if (!isHome) return;
  const sections = document.querySelectorAll('main section[id]');
  if (!sections.length) return;
  const map = new Map();
  const sectionLinks = document.querySelectorAll('.site-nav a[href^="#"]');
  sectionLinks.forEach(a => {
    const id = a.getAttribute('href').slice(1);
    map.set(id, a);
  });
  const io = new IntersectionObserver((entries)=>{
    entries.forEach(entry => {
      const id = entry.target.id;
      const link = map.get(id);
      if (!link) return;
      if (entry.isIntersecting) {
        setActiveLink(link);
      }
    });
  }, { rootMargin: '-40% 0px -50% 0px', threshold: [0, .2, .6] });
  sections.forEach(sec => io.observe(sec));
})();

// Menú móvil: abrir/cerrar
(function enableMobileMenu(){
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.getElementById('primary-nav');
  if (!toggle || !nav) return;

  const open = () => {
    nav.classList.add('open');
    toggle.setAttribute('aria-expanded', 'true');
    toggle.classList.add('active'); // animación a "X"
  };
  const close = () => {
    nav.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.classList.remove('active'); // volver a hamburguesa
  };
  const toggleMenu = () => {
    if (nav.classList.contains('open')) close(); else open();
  };

  toggle.addEventListener('click', toggleMenu);
  // Cerrar al hacer clic en un enlace
  nav.addEventListener('click', (e) => {
    const a = e.target.closest('a');
    if (a) close();
  });
  // Cerrar con Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') close();
  });
  // Cerrar al pasar a escritorio (sincronizado con CSS 960px)
  window.addEventListener('resize', () => {
    if (window.innerWidth > 960) close();
  });
})();

// Validación accesible del formulario de contacto
(function enableContactFormValidation(){
  const form = document.querySelector('.contact-form');
  if (!form) return;
  const status = document.getElementById('form-status');
  const nameInput = form.querySelector('input[name="nombre"]');
  const emailInput = form.querySelector('input[name="email"]');
  const msgInput = form.querySelector('textarea[name="mensaje"]');

  function setInvalid(el, invalid, message){
    el.setAttribute('aria-invalid', invalid ? 'true' : 'false');
    if (invalid) el.setCustomValidity(message || 'Campo inválido'); else el.setCustomValidity('');
  }

  function validate(){
    let ok = true;
    // Nombre
    const nameVal = (nameInput.value || '').trim();
    if (nameVal.length < 2){ ok = false; setInvalid(nameInput, true, 'Ingresa tu nombre'); } else { setInvalid(nameInput,false); }
    // Email
    const emailVal = (emailInput.value || '').trim();
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(emailVal);
    if (!emailOk){ ok = false; setInvalid(emailInput, true, 'Ingresa un correo válido'); } else { setInvalid(emailInput,false); }
    // Mensaje
    const msgVal = (msgInput.value || '').trim();
    if (msgVal.length < 10){ ok = false; setInvalid(msgInput, true, 'Escribe al menos 10 caracteres'); } else { setInvalid(msgInput,false); }
    return ok;
  }

  form.addEventListener('input', (e)=>{
    // Feedback progresivo
    validate();
    if (status) status.textContent = '';
  });

  form.addEventListener('submit', (e)=>{
    e.preventDefault();
    const ok = validate();
    if (!ok){
      if (status) status.textContent = 'Por favor corrige los campos marcados.';
      const firstInvalid = form.querySelector('[aria-invalid="true"]');
      if (firstInvalid) firstInvalid.focus();
      return false;
    }
    // Simulación de envío (sin backend por ahora)
    if (status) status.textContent = '¡Gracias! Tu mensaje ha sido validado. Pronto nos pondremos en contacto.';
    form.reset();
    [nameInput,emailInput,msgInput].forEach(el=>el.setAttribute('aria-invalid','false'));
    return false;
  });
})();

// ================= Accessibility Widget =================
(function initAccessibilityWidget(){
  const DOC = document;
  const HTML = DOC.documentElement;
  const LS = window.localStorage;

  // Avoid duplicate init
  if (DOC.getElementById('a11y-btn')) return;

  // Helpers
  const getPref = (k, d=null) => (LS.getItem(k) ?? d);
  const setPref = (k, v) => LS.setItem(k, v);
  const bool = (v) => String(v) === 'true';

  // Preferences (backward compat for old text toggle)
  const PREF_TEXT_TOGGLE = bool(getPref('a11y_text_lg', 'false'));
  const PREF_CONTRAST = bool(getPref('a11y_contrast', 'false'));
  const PREF_FONT_SCALE = parseFloat(getPref('a11y_font_scale', 'NaN'));
  if (!Number.isNaN(PREF_FONT_SCALE)) {
    HTML.style.fontSize = `${PREF_FONT_SCALE}%`;
  } else if (PREF_TEXT_TOGGLE) {
    // Migrate old toggle to a 112.5% scale
    HTML.style.fontSize = '112.5%';
    setPref('a11y_font_scale', '112.5');
    LS.removeItem('a11y_text_lg');
  }
  if (PREF_CONTRAST) HTML.classList.add('a11y-contrast');

  // Build UI
  const btn = DOC.createElement('button');
  btn.id = 'a11y-btn';
  btn.className = 'accessibility-btn';
  btn.type = 'button';
  btn.setAttribute('aria-label', 'Opciones de accesibilidad');
  btn.setAttribute('aria-haspopup', 'dialog');
  btn.setAttribute('aria-expanded', 'false');
  btn.setAttribute('aria-controls', 'a11y-panel');
  btn.innerHTML = '<span class="visually-hidden">Accesibilidad</span>\n    <img src="accsscc.png" alt="" aria-hidden="true" loading="lazy" decoding="async" />';

  const panel = DOC.createElement('div');
  panel.id = 'a11y-panel';
  panel.className = 'accessibility-panel';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-modal', 'false');
  panel.setAttribute('aria-labelledby', 'a11y-title');
  const currentScale = (!Number.isNaN(PREF_FONT_SCALE) ? PREF_FONT_SCALE : 100).toFixed(0);
  panel.innerHTML = `
    <h3 id="a11y-title">Accesibilidad</h3>
    <div class="a11y-actions">
      <div class="row">
        <button type="button" id="a11y-contrast" aria-pressed="${PREF_CONTRAST}">Alto contraste</button>
      </div>
      <div class="row" id="a11y-font-row" aria-label="Tamaño de texto">
        <span class="label">Tamaño de texto:</span>
        <button type="button" id="a11y-font-dec" title="Reducir texto"><span class="visually-hidden">Reducir texto</span> A−</button>
        <button type="button" id="a11y-font-reset" title="Restablecer tamaño"><span class="visually-hidden">Restablecer tamaño</span> A</button>
        <button type="button" id="a11y-font-inc" title="Aumentar texto"><span class="visually-hidden">Aumentar texto</span> A+</button>
        <span id="a11y-font-label" class="note" aria-live="polite">${currentScale}%</span>
      </div>
      <div class="row" id="a11y-tts-row" aria-label="Lectura de texto">
        <button type="button" id="a11y-tts-play" title="Leer en voz alta">Leer</button>
        <span id="a11y-tts-note" class="note" aria-live="polite"></span>
      </div>
      <div class="row" id="a11y-tts-rate-row" aria-label="Velocidad de lectura">
        <label for="a11y-tts-rate" style="min-width:120px">Velocidad</label>
        <input type="range" id="a11y-tts-rate" min="1" max="1.4" step="0.1" value="1" aria-valuemin="1" aria-valuemax="1.4" aria-valuenow="1" aria-label="Velocidad de lectura">
        <span id="a11y-tts-rate-label" class="note" aria-live="polite">1.0×</span>
      </div>
    </div>
  `;

  DOC.body.appendChild(btn);
  DOC.body.appendChild(panel);

  const bContrast = panel.querySelector('#a11y-contrast');
  const bFontDec = panel.querySelector('#a11y-font-dec');
  const bFontReset = panel.querySelector('#a11y-font-reset');
  const bFontInc = panel.querySelector('#a11y-font-inc');
  const fontLabel = panel.querySelector('#a11y-font-label');
  const bPlay = panel.querySelector('#a11y-tts-play');
  const rateInput = panel.querySelector('#a11y-tts-rate');
  const rateLabel = panel.querySelector('#a11y-tts-rate-label');

  // Predeclare selection badge and safe helpers (used by updateTTSAvailability)
  let selBadge;
  function showSelBadge(){ if (selBadge) selBadge.hidden = false; }
  function hideSelBadge(){ if (selBadge) selBadge.hidden = true; }

  // Toggle panel open/close
  let lastFocus = null;
  function openPanel(){
    lastFocus = DOC.activeElement;
    panel.classList.add('open');
    btn.setAttribute('aria-expanded','true');
    (bContrast || panel).focus();
    ensureTTSReady();
  }
  function closePanel(){
    panel.classList.remove('open');
    btn.setAttribute('aria-expanded','false');
    if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus();
  }
  function togglePanel(){
    if (panel.classList.contains('open')) closePanel(); else openPanel();
  }

  // Speaking-state helper for the floating accessibility button
  function setButtonSpeaking(on){
    if (!btn) return;
    if (on){
      btn.classList.add('speaking');
      btn.setAttribute('aria-pressed','true');
      btn.setAttribute('aria-label','Detener lectura');
    } else {
      btn.classList.remove('speaking');
      btn.removeAttribute('aria-pressed');
      btn.setAttribute('aria-label','Opciones de accesibilidad');
    }
  }

  function setSelBadgeSpeaking(on){
    if (!selBadge) return;
    if (on){
      selBadge.classList.add('speaking');
      // hide visible text so the full badge shows animated bars
      selBadge.textContent = '';
      selBadge.setAttribute('aria-pressed','true');
      selBadge.setAttribute('aria-label','Detener lectura');
    } else {
      selBadge.classList.remove('speaking');
      selBadge.textContent = 'Leer selección';
      selBadge.removeAttribute('aria-pressed');
      selBadge.setAttribute('aria-label','Leer selección');
    }
  }

  // When speaking, clicking the button stops playback; otherwise toggles panel
  btn.addEventListener('click', (e)=>{
    if (synth && synth.speaking){
      e.preventDefault();
      synth.cancel();
      if (bPlay){ bPlay.textContent = 'Leer'; bPlay.setAttribute('aria-pressed','false'); }
      setButtonSpeaking(false);
      return;
    }
    ensureTTSReady();
    togglePanel();
  });

  // Click outside to close
  DOC.addEventListener('click', (e)=>{
    if (!panel.classList.contains('open')) return;
    const t = e.target;
    // If click is on the button or within it, ignore; only close when clicking truly outside
    if (btn.contains(t) || panel.contains(t)) return;
    closePanel();
  });
  // ESC to close
  DOC.addEventListener('keydown', (e)=>{
    if (e.key === 'Escape' && panel.classList.contains('open')){
      e.preventDefault(); closePanel();
    }
  });

  // Contrast action
  bContrast.addEventListener('click', ()=>{
    const next = !HTML.classList.contains('a11y-contrast');
    HTML.classList.toggle('a11y-contrast', next);
    // Also set data attribute for CSS fallbacks or debugging
    HTML.setAttribute('data-theme', next ? 'contrast' : 'default');
    bContrast.setAttribute('aria-pressed', String(next));
    setPref('a11y_contrast', String(next));
  });

  // Font size actions
  function getScale(){
    const fs = HTML.style.fontSize;
    const pct = fs.endsWith('%') ? parseFloat(fs) : 100;
    return Number.isFinite(pct) ? pct : 100;
  }
  function setScale(val){
    const clamped = Math.max(75, Math.min(200, Math.round(val)));
    HTML.style.fontSize = `${clamped}%`;
    setPref('a11y_font_scale', String(clamped));
    if (fontLabel) fontLabel.textContent = `${clamped}%`;
  }
  bFontDec.addEventListener('click', ()=> setScale(getScale() - 10));
  bFontInc.addEventListener('click', ()=> setScale(getScale() + 10));
  bFontReset.addEventListener('click', ()=> setScale(100));

  // Text-to-Speech (Spanish: prefer es-MX, fallback other es-*)
  const synth = window.speechSynthesis;
  const ttsRow = panel.querySelector('#a11y-tts-row');
  const ttsNote = panel.querySelector('#a11y-tts-note');
  let voices = [];
  function refreshVoices(){ voices = synth ? synth.getVoices() : []; updateTTSAvailability(); }
  function updateTTSAvailability(){
    const supported = !!synth;
    const haveVoices = supported && voices && voices.length > 0;
    const disable = !supported; // si está soportado, permitimos click para "despertar" voces
    if (bPlay){ bPlay.disabled = disable; bPlay.setAttribute('aria-disabled', String(disable)); }
    if (rateInput){ rateInput.disabled = !supported; rateInput.setAttribute('aria-disabled', String(!supported)); }
    if (ttsNote){
      if (!supported) ttsNote.textContent = 'Lectura no disponible en este navegador.';
      else if (!haveVoices) ttsNote.textContent = 'Cargando voces…';
      else ttsNote.textContent = 'Voz: Español (México) si está disponible';
    }
    // No ocultar el badge si solo faltan voces; sí ocultar cuando no hay soporte
    if (!supported){ hideSelBadge(); setSelBadgeSpeaking(false); setButtonSpeaking(false); }
  }
  refreshVoices();
  if (synth && typeof synth.onvoiceschanged !== 'undefined') synth.onvoiceschanged = refreshVoices;
  // Some engines need a kick to populate voices
  if (synth && (!voices || voices.length === 0)) setTimeout(refreshVoices, 400);

  // Preparar/activar voces y motor TTS tras un gesto del usuario (mejora móviles)
  let ttsPrimed = false;
  function ensureTTSReady(){
    if (!synth) return;
    try {
      refreshVoices();
      if (voices && voices.length) return;
      if (ttsPrimed) return;
      ttsPrimed = true;
      const u = new SpeechSynthesisUtterance(' ');
      u.volume = 0; u.rate = 1; u.onend = refreshVoices; u.onerror = refreshVoices;
      synth.speak(u);
    } catch {}
  }

  // Speaking-state helper for the floating accessibility button
  function speak(text){
    if (!text) return;
    // Stop any ongoing
    synth.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    const v = pickSpanishVoice();
    if (v) utter.voice = v;
    utter.lang = (v && v.lang) || 'es-MX';
    // Apply chosen rate
    const r = rateInput ? (parseFloat(rateInput.value) || 1.0) : 1.0;
    utter.rate = Math.max(1.0, Math.min(1.4, r));
    utter.pitch = 1;
    setButtonSpeaking(true);
    setSelBadgeSpeaking(true);
    synth.speak(utter);
  }

  // Single toggle: start reading on first click, stop on next click
  bPlay.addEventListener('click', ()=>{
    if (!synth) return;
    ensureTTSReady();
    if (synth.speaking) {
      synth.cancel();
      bPlay.textContent = 'Leer';
      bPlay.setAttribute('aria-pressed','false');
      return;
    }
    // Respetar selección reciente: si al pulsar se perdió, usa el caché (hasta 7s)
    let selected = getSelectedText();
    if (!selected && lastSelText && (Date.now() - lastSelAt) < 7000){ selected = lastSelText; }
    const text = selected || getPageText();
    if (!text) return;
    bPlay.textContent = 'Detener';
    bPlay.setAttribute('aria-pressed','true');
    speak(text);
  });

  // Evitar que el mousedown colapse la selección en algunos navegadores móviles
  bPlay.addEventListener('mousedown', (e)=>{ e.preventDefault(); });

  // Cachear última selección de texto (útil en móvil cuando el click colapsa la selección)
  let lastSelText = '';
  let lastSelAt = 0;
  function captureSelection(){
    const t = getSelectedText();
    if (t){ lastSelText = t; lastSelAt = Date.now(); }
  }

  // Floating badge to read current selection
  selBadge = DOC.createElement('button');
  selBadge.id = 'a11y-tts-select-badge';
  selBadge.type = 'button';
  selBadge.setAttribute('aria-label', 'Leer selección');
  selBadge.textContent = 'Leer selección';
  selBadge.hidden = true;
  DOC.body.appendChild(selBadge);

  // --- Selection badge logic ---
  function getSelectionRect(){
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return null;
    const range = sel.getRangeAt(0).cloneRange();
    if (String(sel).trim().length === 0) return null;
    // En móvil, getBoundingClientRect puede dar 0 si cruza nodos: probar getClientRects primero
    const rects = range.getClientRects ? Array.from(range.getClientRects()) : [];
    const first = rects.find(r => r && (r.width > 0 || r.height > 0));
    if (first) return first;
    const rect = range.getBoundingClientRect();
    if (!rect || (rect.width === 0 && rect.height === 0)) return null;
    return rect;
  }
  function positionSelBadge(){
    const rect = getSelectionRect();
    if (!rect){ hideSelBadge(); return; }
    // Place the badge slightly above the selection end, clamp to viewport
    const margin = 6;
    const vw = window.innerWidth, vh = window.innerHeight;
    let left = Math.min(Math.max(rect.right + 0, 8), vw - 8);
    let top = rect.top - margin;
    if (top < 8) top = rect.bottom + margin;
    // Use fixed positioning relative to viewport
    selBadge.style.left = `${Math.min(Math.max(left, 8), vw - selBadge.offsetWidth - 8)}px`;
    selBadge.style.top = `${Math.min(Math.max(top, 8), vh - selBadge.offsetHeight - 8)}px`;
    showSelBadge();
  }
  function maybeShowBadge(){
    const txt = getSelectedText();
    if (txt && txt.length >= 2){
      positionSelBadge();
      if (synth && synth.speaking) setSelBadgeSpeaking(true); else setSelBadgeSpeaking(false);
    } else {
      hideSelBadge();
    }
  }
  selBadge.addEventListener('click', ()=>{
    if (synth && synth.speaking){
      synth.cancel();
      if (bPlay){ bPlay.textContent = 'Leer'; bPlay.setAttribute('aria-pressed','false'); }
      setButtonSpeaking(false);
      setSelBadgeSpeaking(false);
      hideSelBadge();
      return;
    }
    ensureTTSReady();
    const txt = getSelectedText();
    if (txt) {
      if (bPlay){ bPlay.textContent = 'Detener'; bPlay.setAttribute('aria-pressed','true'); }
      setButtonSpeaking(true);
      setSelBadgeSpeaking(true);
      speak(txt);
    }
  });
  selBadge.addEventListener('keydown', (e)=>{
    if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); selBadge.click(); }
    if (e.key === 'Escape'){ hideSelBadge(); }
  });
  DOC.addEventListener('selectionchange', ()=>{ captureSelection(); setTimeout(maybeShowBadge, 0); });
  DOC.addEventListener('mouseup', ()=>{ setTimeout(maybeShowBadge, 0); });
  DOC.addEventListener('pointerup', ()=>{ setTimeout(maybeShowBadge, 0); });
  DOC.addEventListener('touchend', ()=>{ setTimeout(maybeShowBadge, 0); }, { passive: true });
  DOC.addEventListener('keyup', (e)=>{ if (e.key && (e.key.length === 1 || e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'ArrowUp' || e.key === 'ArrowDown')) setTimeout(maybeShowBadge, 0); });
  window.addEventListener('scroll', hideSelBadge, true);
  window.addEventListener('resize', hideSelBadge);

  // Load saved TTS rate
  const PREF_TTS_RATE = parseFloat(getPref('a11y_tts_rate', '1'));
  if (rateInput){
    const validRate = Number.isFinite(PREF_TTS_RATE) ? Math.max(1.0, Math.min(1.4, PREF_TTS_RATE)) : 1.0;
    rateInput.value = String(validRate);
    rateInput.setAttribute('aria-valuenow', String(validRate));
    if (rateLabel) rateLabel.textContent = `${validRate.toFixed(1)}×`;
    rateInput.addEventListener('input', ()=>{
      const r = parseFloat(rateInput.value) || 1.0;
      if (rateLabel) rateLabel.textContent = `${r.toFixed(1)}×`;
      rateInput.setAttribute('aria-valuenow', String(r));
      setPref('a11y_tts_rate', String(r));
    });
  }

  // Helpers para obtener texto seleccionado y texto de la página
  function getSelectedText(){
    const sel = window.getSelection();
    return sel && String(sel).trim().length > 0 ? String(sel).trim() : '';
  }
  function getPageText(){
    const main = DOC.querySelector('main') || DOC.body;
    return (main.textContent || '').replace(/\s+/g,' ').trim();
  }

  function pickSpanishVoice(){
    if (!voices || !voices.length) voices = synth.getVoices();
    // Rank: es-MX > es-419 > es-ES > any es-*
    const byLang = (lang) => voices.filter(v => (v.lang || '').toLowerCase() === lang);
    const startsEs = voices.filter(v => /^es[-_]/i.test(v.lang || ''));
    return (
      byLang('es-mx')[0] || byLang('es_419')[0] || byLang('es-419')[0] || byLang('es-es')[0] || startsEs[0] || null
    );
  }
})();

// ================= Botón flotante: Volver arriba =================
(function initScrollTopButton(){
  const DOC = document;
  // Evitar duplicados
  if (DOC.getElementById('scroll-top-btn')) return;

  const btn = DOC.createElement('button');
  btn.id = 'scroll-top-btn';
  btn.className = 'scroll-top-btn';
  btn.type = 'button';
  btn.setAttribute('aria-label', 'Volver arriba');
  btn.innerHTML = '<span aria-hidden="true">\u25B2</span>';
  btn.addEventListener('click', ()=>{
    try { window.scrollTo({ top: 0, behavior: 'smooth' }); }
    catch { window.scrollTo(0,0); }
  });
  DOC.body.appendChild(btn);

  const SHOW_AFTER = 600; // px
  function update(){
    const y = window.scrollY || DOC.documentElement.scrollTop || 0;
    btn.classList.toggle('visible', y > SHOW_AFTER);
  }
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  // Inicial
  update();
})();

// ================= Index: Integrar contenido de cv.html debajo de "Nosotros" =================
(function integrateCVIntoIndex(){
  const path = (location.pathname.split('/').pop() || '').toLowerCase();
  if (path !== '' && path !== 'index.html') return; // solo en index

  const anchorSection = document.querySelector('#nosotros');
  if (!anchorSection) return;

  fetch('cv.html', { credentials: 'same-origin' })
    .then(r => r.ok ? r.text() : Promise.reject(new Error('No se pudo cargar cv.html')))
    .then(html => {
      const tpl = document.createElement('template');
      tpl.innerHTML = html;
      const importedMain = tpl.content.querySelector('main#main');
      if (!importedMain) return;

      // Insertar controles (index-actions) si existen
      const actions = importedMain.querySelector('.index-actions');
      if (actions) {
        anchorSection.insertAdjacentElement('afterend', actions);
      }

      // Recopilar secciones (omitir #sobre-nosotros y #experiencia para no duplicar)
      const sections = Array.from(importedMain.querySelectorAll(':scope > section'))
        .filter(sec => sec.id !== 'sobre-nosotros' && sec.id !== 'experiencia');

      // Funciones para colapsables
      function wrapContentForSection(section){
        const head = section.querySelector('h2.display');
        if (!head) return null;
        // Crear contenedor para el resto del contenido
        const contentId = `${section.id || 'cv'}-content`;
        const content = document.createElement('div');
        content.className = 'cv-content';
        content.id = contentId;
        // Mover todos los nodos después del h2 al contenedor
        let node = head.nextSibling;
        const toMove = [];
        while (node) { toMove.push(node); node = node.nextSibling; }
        toMove.forEach(n => content.appendChild(n));
        head.after(content);

        // Preparar encabezado accesible/clicable
        head.classList.add('cv-head');
        head.setAttribute('role', 'button');
        head.setAttribute('tabindex', '0');
        head.setAttribute('aria-controls', contentId);
        const isIndex = section.id === 'indice';
        head.setAttribute('aria-expanded', isIndex ? 'true' : 'false');

        // Listeners
        function isOpen(){ return !content.hasAttribute('hidden'); }
        function setOpen(open){
          if (open) content.removeAttribute('hidden'); else content.setAttribute('hidden','');
          head.setAttribute('aria-expanded', String(open));
        }
        if (!isIndex){
          head.addEventListener('click', ()=> setOpen(!isOpen()));
          head.addEventListener('keydown', (e)=>{
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen(!isOpen()); }
          });
        }

        // Colapsado por defecto al cargar
        setOpen(isIndex);

        return { section, head, content, setOpen, isOpen };
      }

      // Insertar secciones y preparar colapsables
      const prepared = [];
      let lastInserted = actions || anchorSection;
      sections.forEach(sec => {
        lastInserted.insertAdjacentElement('afterend', sec);
        lastInserted = sec;
        const p = wrapContentForSection(sec);
        // Excluir #indice de los controles expandir/colapsar todo
        if (p && sec.id !== 'indice') prepared.push(p);
      });

      // Mapear por id de sección para apertura rápida desde el índice
      const preparedById = new Map(prepared.map(p => [p.section.id, p]));

      // Toggle único para Expandir/Colapsar todo (excluye #indice)
      const btnExpandAll = document.getElementById('expand-all');
      const btnCollapseAll = document.getElementById('collapse-all');
      let toggleBtn = btnExpandAll || btnCollapseAll || null;
      if (toggleBtn){
        // Si existen ambos, ocultar el que no usaremos y renombrar etiqueta
        if (btnExpandAll && btnCollapseAll){ btnCollapseAll.style.display = 'none'; }
        toggleBtn.id = 'toggle-all-cv';
        function areAllOpen(){ return prepared.length > 0 && prepared.every(p => p.isOpen()); }
        function setAll(open){ prepared.forEach(p => p.setOpen(open)); }
        function updateToggleLabel(){ toggleBtn.textContent = areAllOpen() ? 'Colapsar todo' : 'Expandir todo'; }
        toggleBtn.addEventListener('click', ()=>{
          const nextOpen = !areAllOpen();
          setAll(nextOpen);
          updateToggleLabel();
        });
        // Inicializar etiqueta
        updateToggleLabel();
      }

      // Enlaces del índice: abrir sección destino y hacer scroll con offset
      const indexSection = document.getElementById('indice');
      function scrollToEl(el){
        const top = el.getBoundingClientRect().top + window.scrollY - 80;
        window.scrollTo({ top, behavior: 'smooth' });
      }
      if (indexSection){
        const idxLinks = indexSection.querySelectorAll('.index-list a[href^="#"]');
        idxLinks.forEach(a => {
          a.addEventListener('click', (e)=>{
            e.preventDefault();
            const href = a.getAttribute('href') || '';
            const id = href.replace('#','');
            const target = document.getElementById(id);
            const prep = preparedById.get(id);
            if (prep) prep.setOpen(true);
            // Sincronizar etiqueta del toggle si existe
            const toggle = document.getElementById('toggle-all-cv');
            if (toggle){
              const allOpenNow = prepared.length > 0 && prepared.every(p => p.isOpen());
              toggle.textContent = allOpenNow ? 'Colapsar todo' : 'Expandir todo';
            }
            if (target) {
              history.replaceState(null, '', `#${id}`);
              scrollToEl(target);
            }
          });
        });
      }

      // Si se entra con un hash ya presente, abrir la sección correspondiente
      if (location.hash){
        const id = location.hash.slice(1);
        const target = document.getElementById(id);
        const prep = preparedById.get(id);
        if (prep) prep.setOpen(true);
        // Actualizar etiqueta del toggle si existe
        const toggle = document.getElementById('toggle-all-cv');
        if (toggle){
          const allOpenNow = prepared.length > 0 && prepared.every(p => p.isOpen());
          toggle.textContent = allOpenNow ? 'Colapsar todo' : 'Expandir todo';
        }
        if (target) scrollToEl(target);
      }
    })
    .catch(()=>{/* opcional: silenciar si no existe cv.html */});
})();

// ================= Productos y Servicios: colapsables por bloque =================
(function enableProdservCollapsibles(){
  const path = (location.pathname.split('/').pop() || '').toLowerCase();
  if (path !== 'prodserv.html') return;

  const TOGGLE_ALL = document.getElementById('toggle-all');
  const heads = Array.from(document.querySelectorAll('.product-head'));

  function getContentForHead(h){
    const id = h.getAttribute('aria-controls');
    if (id) return document.getElementById(id);
    // fallback: next .collapsible-content
    const next = h.parentElement && h.parentElement.querySelector('.collapsible-content');
    return next || null;
  }

  function setOpen(h, open){
    const c = getContentForHead(h);
    if (!c) return;
    if (open) c.removeAttribute('hidden'); else c.setAttribute('hidden','');
    h.setAttribute('aria-expanded', String(open));
  }

  function isOpen(h){
    const c = getContentForHead(h);
    return c ? !c.hasAttribute('hidden') : false;
  }

  // Inicializa estados (cerrados por defecto, ya que los div tienen hidden)
  heads.forEach(h => setOpen(h, isOpen(h)));

  // Toggle individual por click
  heads.forEach(h => {
    h.addEventListener('click', ()=> setOpen(h, !isOpen(h)));
    h.addEventListener('keydown', (e)=>{
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen(h, !isOpen(h)); }
    });
  });

  // Botón global Expandir/Colapsar todo
  function updateToggleAllLabel(){
    if (!TOGGLE_ALL) return;
    const anyClosed = heads.some(h => !isOpen(h));
    TOGGLE_ALL.textContent = anyClosed ? 'Expandir todo' : 'Colapsar todo';
  }

  if (TOGGLE_ALL){
    updateToggleAllLabel();
    TOGGLE_ALL.addEventListener('click', ()=>{
      const anyClosed = heads.some(h => !isOpen(h));
      heads.forEach(h => setOpen(h, anyClosed));
      updateToggleAllLabel();
    });
  }
})();

// ================= Otros Servicios: category filtering =================
(function enableOtrosServiciosFiltering(){
  // Only run on otserv.html
  const path = (location.pathname.split('/').pop() || '').toLowerCase();
  if (path !== 'otserv.html') return;

  const cards = document.querySelectorAll('.grid.cols-3 a.card[href^="#"]');
  const list = document.querySelector('.services');
  const status = document.getElementById('results-status');
  if (!cards.length || !list) return;

  // Ajustar la grilla de filtros a 6 columnas (desktop)
  const filtersGrid = cards[0] && cards[0].closest('.grid');
  if (filtersGrid) filtersGrid.classList.add('filters-6');

  const items = Array.from(list.querySelectorAll('li'));
  // Transform each li into a card (idempotent)
  items.forEach(li => {
    const raw = (li.innerText || li.textContent || '').trim();
    let title = raw;
    let desc = '';
    const parts = raw.split(/\n+/).map(s=>s.trim()).filter(Boolean);
    if (parts.length > 1){
      title = parts[0];
      desc = parts.slice(1).join(' ');
    } else {
      // Fallback: split by two or more spaces after a closing parenthesis or word
      const m = raw.match(/^(.+?\))\s{2,}(.+)$/) || raw.match(/^([^\.]+\.)\s+(.+)$/);
      if (m){ title = m[1].trim(); desc = (m[2]||'').trim(); }
    }
    // Preferir <h4> existente como título
    const h4el = li.querySelector('h4');
    if (h4el){ title = (h4el.textContent || '').trim(); }

    // Pick a thumbnail based on title keywords
    function getThumbForTitle(t){
      const L = (t||'').toLowerCase();
      const rules = [
        // RPA
        { rx: /gestor para \u00E1reas de ventas|\bventas\b.*\(rpa\)/i, src: 'img/rpa_gestor-para-areas-de-ventas.jpg' },
        { rx: /servicio al cliente|cliente \(rpa\)/i, src: 'img/rpa-gestor-para-servicio-al-cliente.jpg' },
        { rx: /descarga.*sitios web|informaci\u00F3n de sitios/i, src: 'img/rpa-descarga-automatica-de-informacion-de-sitios-web.jpg' },
        { rx: /reclutamiento/i, src: 'img/rpa-reclutamiento-de-recursos-humanos.jpg' },
        { rx: /pago.*n[o\u00F3]minas/i, src: 'img/rpa-pago-automatico-de-nominas.jpg' },
        { rx: /asignaci[o\u00F3]n de turnos/i, src: 'img/rpa-asignacion-de-turnos-laborales.jpg' },
        { rx: /certificados laborales/i, src: 'img/rpa-emision-de-certificados-laborales.jpg' },
        { rx: /asegurado/i, src: 'img/rpa-atencion-automatica-al-asegurado.jpg' },
        { rx: /gestor de propiedades/i, src: 'img/rpa-gestor-de-propiedades.jpg' },
        { rx: /paquetes tur[i\u00ED]sticos/i, src: 'img/rpa-gestor-de-paquetes-turisticos.jpg' },
        { rx: /riesgo financiero/i, src: 'img/rpa-analisis-de-riesgo-financiero.jpg' },
        { rx: /prevenci[o\u00F3]n de fraudes|monitoreo de sistemas/i, src: 'img/rpa-monitoreo-de-sistemas-para-prevencion-de-fraudes.jpg' },
        { rx: /registro contable/i, src: 'img/rpa-automatizacion-de-registro-contable.jpg' },
        { rx: /carga masiva de facturas/i, src: 'img/rpa-carga-masiva-de-facturas.jpg' },
        { rx: /contabilizaci[o\u00F3]n.*facturas/i, src: 'img/rpa-contabilizacion-automatica-de-facturas.jpg' },
        { rx: /saldos de sucursales/i, src: 'img/rpa-descarga-de-saldos-de-sucursales.jpg' },
        { rx: /indicadores financieros/i, src: 'img/rpa-descarga-de-indicadores-financieros.jpg' },
        { rx: /conciliaciones bancarias/i, src: 'img/rpa-conciliaciones-bancarias.jpg' },
        { rx: /n[o\u00F3]mina de proveedores/i, src: 'img/rpa-pago-de-nomina-de-proveedores.jpg' },
        { rx: /normalizaci[o\u00F3]n.*proveedores/i, src: 'img/rpa-normalizacion-informacion-de-proveedores.jpg' },
        // Documentos y firma
        { rx: /venta sin papel/i, src: 'img/solucin-venta-sin-papel.jpg' },
        { rx: /contratos electr[o\u00F3]nicos/i, src: 'img/solucin-gestin-de-contratos-electrnicos.jpg' },
        { rx: /documento electr[o\u00F3]nico.*firma/i, src: 'img/documento-electrnico-con-firma-digital.jpg' },
        // Digitalizaci\u00F3n & gesti\u00F3n
        { rx: /biblioteca digital/i, src: 'img/libro-digital.jpg' },
        { rx: /carpeta electr[o\u00F3]nica del colaborador|rrhh/i, src: 'img/carpeta-rrhh.jpg' },
        { rx: /plataforma de atenci[o\u00F3]n ciudadana|ciudadan/i, src: 'img/plataforma-de-atencin-ciudadana.jpg' },
        { rx: /despacho y cobranza|mesa de cobranza/i, src: 'img/mesa-de-cobranza.jpg' },
        { rx: /cupones/i, src: 'img/procesamiento-de-cupones.jpg' },
        { rx: /afiliaci[o\u00F3]n electr[o\u00F3]nica/i, src: 'img/procesos-afiliaciones.jpg' },
        { rx: /oficina de partes/i, src: 'img/oficina-de-partes.jpg' },
        { rx: /archivos hist[o\u00F3]ricos|patrimoniales/i, src: 'img/digitalizacion-de-archivos-historicos-y-patrimoniales.jpg' },
        { rx: /gesti[o\u00F3]n \u00E1rea fiscal[i\u00ED]a|fiscal[i\u00ED]a/i, src: 'img/gestion-fiscalias.jpg' },
        { rx: /gesti[o\u00F3]n de reclamos/i, src: 'img/gestion-reclamos.jpg' },
        { rx: /gesti[o\u00F3]n \u00E1reas de servicio/i, src: 'img/gestion-areas-servicios.jpg' },
        // Gen\u00E9ricos
        { rx: /documentos electr[o\u00F3]nicos/i, src: 'img/documento-electronico.png' },
        { rx: /digitalizaci[o\u00F3]n/i, src: 'img/digitalizacion.png' },
      ];
      for (const r of rules){ if (r.rx.test(L)) return { src: r.src }; }
      return null;
    }

    // Fallbacks por categoría si no hay coincidencia directa
    function getFallbackThumb(text){
      const s = (text||'').toLowerCase();
      if (/\b(rpa|automatiz|robot)\b/i.test(s)) return { src: 'img/rpa-1.png' };
      if (/(contrato|documento|firma|electr[o\u00F3]nico)/i.test(s)) return { src: 'img/documento-electronico.png' };
      if (/(digitaliz|archivo|biblioteca|patrimonial)/i.test(s)) return { src: 'img/digitalizacion.png' };
      if (/(ciudadan|atenci[o\u00F3]n|mesa de ayuda|reclamo)/i.test(s)) return { src: 'img/plataforma-de-atencin-ciudadana.jpg' };
      if (/(finanzas|factur|bancar|proveedor|cr[e\u00E9]dito|n[o\u00F3]mina|conciliaci[o\u00F3]n|indicadores)/i.test(s)) return { src: 'img/aprobacion-facturas.jpg' };
      // última opción: branding genérico
      return { src: 'img/og-cover.png' };
    }

    const existingImg = li.querySelector('img');
    let thumb = existingImg ? null : (getThumbForTitle(title) || getFallbackThumb(raw));

    const card = document.createElement('div');
    card.className = 'service-card';
    if (thumb){
      const img = document.createElement('img');
      img.className = 'service-thumb';
      img.src = thumb.src;
      img.alt = title;
      img.loading = 'lazy';
      img.decoding = 'async';
      card.appendChild(img);
    }
    // Mover el contenido existente dentro de la tarjeta sin eliminar imágenes ni encabezados
    const frag = document.createDocumentFragment();
    while (li.firstChild) { frag.appendChild(li.firstChild); }
    card.appendChild(frag);
    li.appendChild(card);
  });

  // Helper: tag items with categories based on keywords
  const catMatchers = {
    rpa: /(\bRPA\b|robot|automatiz)/i,
    documentos: /(documento|contrato|firma|certificad)/i,
    digitalizacion: /(digitaliz|archivo|biblioteca|patrimonial)/i,
    atencion: /(atenci[oó]n|ciudadan|mesa de ayuda|reclamo)/i,
    finanzas: /(finanzas|contable|factur|bancari|proveedor|cr[eé]dito|n[oó]mina|conciliaci[oó]n|indicadores)/i,
  };

  items.forEach(li => {
    const text = li.textContent || '';
    const cats = Object.entries(catMatchers)
      .filter(([, rx]) => rx.test(text))
      .map(([k]) => k);
    // Fallback: if none matched, assign to 'otros'
    if (!cats.length) cats.push('otros');
    li.dataset.cat = cats.join(',');
    li.hidden = true; // hide by default
  });

  function setActiveCard(active){
    cards.forEach(a => a.removeAttribute('aria-current'));
    if (active) active.setAttribute('aria-current', 'true');
  }

  function showCategory(cat){
    const norm = (cat || '').toLowerCase();
    const showAll = norm === 'all' || norm === '';

    let shown = 0;
    items.forEach(li => {
      const cats = (li.dataset.cat || '').split(',');
      const match = showAll ? true : cats.includes(norm);
      li.hidden = !match;
      if (match) shown++;
    });

    if (status){
      status.classList.remove('visually-hidden');
      const label = showAll ? 'todas las categorías' : `“${norm}”`;
      status.textContent = `Mostrando ${shown} servicio(s) para ${label}.`;
    }
  }

  function handleNav(hash, triggerEl){
    const cat = (hash || '').replace('#','');
    setActiveCard(triggerEl || null);
    showCategory(cat);
  }

  // Helpers para el card "Mostrar todo"
  function getAllCard(){
    return Array.from(cards).find(a => (a.getAttribute('href') || '').toLowerCase() === '#all') || null;
  }
  function updateAllCardLabel(showingAll){
    const allCard = getAllCard();
    if (!allCard) return;
    const titleEl = allCard.querySelector('.card-title');
    const next = showingAll ? 'Colapsar todo' : 'Mostrar todo';
    if (titleEl) titleEl.textContent = next; else allCard.textContent = next;
    allCard.setAttribute('aria-label', next);
  }

  // On load: use hash if present; otherwise keep hidden until selection
  const initialHash = location.hash;
  if (initialHash){
    const match = Array.from(cards).find(a => a.getAttribute('href') === initialHash);
    handleNav(initialHash, match || null);
    updateAllCardLabel(initialHash === '#all');
  } else {
    // Keep list items hidden; also ensure status is hidden
    if (status) status.textContent = '';
    updateAllCardLabel(false);
  }

  // Colapsar todo (ocultar todos los elementos y limpiar selección)
  function collapseAll(){
    items.forEach(li => { li.hidden = true; });
    setActiveCard(null);
    updateAllCardLabel(false);
    if (status){
      status.textContent = '';
      status.classList.add('visually-hidden');
    }
  }

  // Wire clicks
  cards.forEach(a => {
    a.addEventListener('click', (e)=>{
      e.preventDefault();
      const href = a.getAttribute('href') || '#all';
      // Toggle especial: si "Mostrar todo" (#all) ya está activo, colapsar todo al volver a hacer clic
      if (href === '#all' && a.getAttribute('aria-current') === 'true'){
        collapseAll();
        // Limpiar hash para indicar que no hay filtro activo
        history.replaceState(null, '', location.pathname + location.search);
        return;
      }
      history.replaceState(null, '', href); // keep hash updated
      handleNav(href, a);
      updateAllCardLabel(href === '#all');
      // No auto-scroll en desktop; en móviles, asegura que los filtros sigan visibles
      const filtersGrid = cards[0] && cards[0].closest('.grid');
      if (window.innerWidth <= 640 && filtersGrid){
        const top = filtersGrid.getBoundingClientRect().top + window.scrollY - 72;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });
})();
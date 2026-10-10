(() => {
  'use strict';
  const E = window.Explorer, C = window.ExplorerCurriculum, S = window.ExplorerStudio;
  const KEY = 'bhanzu-explorer-v1', START_KEY = `${KEY}:first-open`;
  const app = document.getElementById('app');
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
  const object = v => v && typeof v === 'object' && !Array.isArray(v);
  const gradeOK = g => Number.isInteger(g) && g >= 1 && g <= 12;
  const dateLabel = s => new Intl.DateTimeFormat(undefined, { day:'numeric', month:'short', year:'numeric' }).format(new Date(`${s}T12:00:00`));
  const themes = {
    detective: { key:'discovery', name:'Discovery', noun:'Discoveries', icon:'🧭', guide:'🌿', heading:'A new trail.<br>Five little discoveries.', action:'Explore the trail', collection:'Field journal', accent:'#426348', tag:'Follow your curiosity', mark:'Leaf by leaf', scene:'🌳' },
    space: { key:'space', name:'Space', noun:'Missions', icon:'🚀', guide:'🛰️', heading:'Mission control.<br>Five new frontiers.', action:'Start the mission', collection:'Mission log', accent:'#111a36', tag:'Your daily launch window', mark:'Ready for orbit', scene:'🪐' },
    sports: { key:'sports', name:'Sports', noun:'Challenges', icon:'🏆', guide:'📣', heading:'Game on.<br>Five daily challenges.', action:'Enter the arena', collection:'Trophy cabinet', accent:'#142a25', tag:'Your personal scoreboard', mark:'Your next personal best', scene:'🏆' }
  };
  let state = { profile:null, done:[], progress:{}, drafts:{}, artifacts:{} };
  let storageOK = true, raw = null, firstOpen = E.today();
  try { raw = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch { /* Keep the app usable if old data is malformed. */ }
  if (object(raw)) {
    state = {
      profile: E.validateProfile(raw.profile) ? raw.profile : null,
      done: Array.isArray(raw.done) ? raw.done.filter(x => E.missions.some(m => m.id === x)) : [],
      progress: object(raw.progress) ? raw.progress : {},
      drafts: object(raw.drafts) ? raw.drafts : {},
      artifacts: object(raw.artifacts) ? raw.artifacts : {}
    };
  }
  // Record the first visit before onboarding. Settings and grade/theme changes never reset it.
  try {
    const stored = localStorage.getItem(START_KEY);
    firstOpen = E.validDate(stored) ? stored : E.validDate(raw?.firstOpen) ? raw.firstOpen : E.today();
    localStorage.setItem(START_KEY, firstOpen);
  } catch { storageOK = false; }
  let draftTheme = state.profile?.avatar || 'detective';
  let selectedDay = currentDay(), selected = null;
  const cache = new Map();
  const theme = () => themes[state.profile?.avatar || draftTheme] || themes.detective;
  const missions = () => {
    const g = state.profile.grade;
    if (!cache.has(g)) cache.set(g, C.activities(g));
    return cache.get(g);
  };
  const gradeKey = () => String(state.profile.grade);
  const draftKey = id => `${gradeKey()}:${id}`;
  const allProgress = () => Array.isArray(state.progress[gradeKey()]) ? [...new Set(state.progress[gradeKey()])] : [];
  const done = () => allProgress().filter(id => missions().some(m => m.id === id));
  const dayMissions = day => missions().filter(m => m.day === day);
  const dayCount = day => dayMissions(day).filter(m => done().includes(m.id)).length;
  const canDay = day => Number.isInteger(day) && day >= 1 && day <= C.DAYS && (day <= currentDay() || dayCount(day) === C.PER_DAY);
  const canPlay = m => Boolean(m && canDay(m.day) && !E.status(state.profile).started);
  const options = (g, blank = false) => (blank ? '<option value="">Choose your grade</option>' : '') + C.grades.map(n => `<option value="${n}" ${Number(g) === n ? 'selected' : ''}>Grade ${n}</option>`).join('');
  const themeOptions = () => Object.entries(themes).map(([key, t]) => `<option value="${key}" ${(state.profile?.avatar || draftTheme) === key ? 'selected' : ''}>${t.icon} ${t.name}</option>`).join('');

  function elapsedDays() { return Math.max(0, E.dayNumber(E.today()) - E.dayNumber(firstOpen)); }
  function currentDay() { return Math.min(C.DAYS, elapsedDays() + 1); }
  function storageNotice() {
    if (!storageOK && !document.getElementById('storage-notice')) {
      const node = document.createElement('div');
      node.id = 'storage-notice'; node.className = 'storage-notice'; node.setAttribute('role', 'status');
      node.textContent = 'Browser storage is unavailable. Progress works in this tab, but may not survive closing or refreshing it.';
      app.prepend(node);
    }
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify({ ...state, firstOpen })); } catch { storageOK = false; }
    storageNotice();
  }
  function adoptGrade(g) {
    state.profile.grade = g; state.profile.level = g <= 3 ? 'starter' : 'challenger';
    if (!Array.isArray(state.progress[g])) state.progress[g] = [];
    if (state.done.length) {
      state.progress[g] = [...new Set([...state.progress[g], ...state.done])]; state.done = [];
    }
    selectedDay = currentDay(); selected = null; save();
  }
  function applyTheme() {
    const t = theme(); document.documentElement.dataset.theme = t.key;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', t.accent);
    document.querySelector('.brand span').textContent = `${t.name} · ${t.noun}`;
    document.querySelector('.prototype').textContent = '30 days · 150 activities';
  }
  function hero() {
    const t = theme();
    return `<section class="hero"><div class="hero-copy"><span class="pill">${state.profile ? `Grade ${state.profile.grade} · ${C.band(state.profile.grade)}` : t.tag}</span><h1>${t.heading}</h1><p>${state.profile ? `Five ${t.noun.toLowerCase()} per day. Missed a day? Your earlier days stay open.` : 'Choose a grade and a world. A new set opens each day from your first visit.'}</p></div><div class="hero-illustration" aria-hidden="true"><div class="orbit"></div><span class="planet">${t.scene}</span><span class="float one">${t.mark}</span><span class="float two">${t.icon} ${state.profile ? `${dayCount(currentDay())} / 5 today` : '5 a day'}</span></div></section>`;
  }
  function setup() {
    app.innerHTML = hero() + `<section class="panel setup"><h2>Build your own journey</h2><p class="small muted">Day 1: ${dateLabel(firstOpen)}. Your month starts on your first visit, even if you finish setup later.</p><form id="setup"><label>Explorer nickname<input name="nickname" maxlength="30" placeholder="Explorer"></label><label>Your grade<select name="grade" required>${options(null, true)}</select></label><label>Your world<select name="avatar">${themeOptions()}</select></label><div class="form-row"><label>Onboarding date<input name="onboard" type="date" value="${E.today()}" required></label><label>First class date<input name="start" type="date" value="${E.addDays(E.today(), 30)}" required></label></div><p class="small muted">Use your confirmed class date. Activities stop when classes begin; your passport stays available.</p><p id="setup-error" class="error" role="alert"></p><button class="primary" id="setup-submit">${theme().action} →</button></form></section>`;
    document.querySelector('#setup select[name="avatar"]').onchange = e => {
      draftTheme = e.target.value; applyTheme(); document.querySelector('.hero').outerHTML = hero();
      document.getElementById('setup-submit').textContent = `${theme().action} →`;
    };
    document.getElementById('setup').onsubmit = e => {
      e.preventDefault(); const p = Object.fromEntries(new FormData(e.target));
      p.grade = +p.grade; p.level = p.grade <= 3 ? 'starter' : 'challenger'; p.nickname = p.nickname.trim() || 'Explorer';
      if (!gradeOK(p.grade) || !E.validateProfile(p)) { document.getElementById('setup-error').textContent = 'Choose a grade and valid dates, with class on or after onboarding.'; return; }
      state.profile = p; adoptGrade(p.grade); render();
    };
  }
  function migrateGrade() {
    app.innerHTML = `<section class="panel setup"><h1>Choose your grade</h1><p>Welcome back, ${esc(state.profile.nickname)}. Your previous work is kept in your passport. The new 30-day journey starts ${dateLabel(firstOpen)}.</p><form id="choose-grade"><label>Your grade<select name="grade" required>${options(null, true)}</select></label><button class="primary">Continue</button></form></section>`;
    document.getElementById('choose-grade').onsubmit = e => { e.preventDefault(); adoptGrade(+new FormData(e.target).get('grade')); render(); };
  }
  function validArtifact(a) {
    return object(a) && ((a.type === 'paint' && [6,8].includes(a.size) && Array.isArray(a.pixels) && a.pixels.length === a.size * a.size && a.pixels.every(v => Number.isInteger(v) && v >= 0 && v <= 4)) || (a.type === 'postcard' && typeof a.text === 'string' && a.text.length <= 220 && typeof a.mood === 'string' && [1,2,3,4].includes(a.color)));
  }
  function gallery() {
    const prefix = `${gradeKey()}:`;
    return Object.entries(state.artifacts).filter(([key, a]) => key.startsWith(prefix) && validArtifact(a)).map(([key, a]) => {
      const id = key.slice(prefix.length), m = missions().find(x => x.id === id);
      return { id, a, m, title: m ? `Day ${m.day} · ${m.title}` : a.title || 'Earlier artwork' };
    }).filter(x => !x.m || canDay(x.m.day));
  }
  function passport() {
    const count = done().length, art = gallery(), previous = allProgress().filter(id => E.missions.some(m => m.id === id)).length;
    return `<section class="panel passport"><div class="eyebrow">${theme().collection}</div><h3>${theme().icon} ${esc(state.profile.nickname)}</h3><p class="small">Grade ${state.profile.grade} passport</p>${art.length ? `<details class="gallery-details"><summary>${art.length} saved creations · view gallery</summary><div class="art-gallery">${art.map(x => `<figure><figcaption>${esc(x.title)}</figcaption>${S.artwork(x.a, true)}<button class="export-art" data-export="${esc(x.id)}">Download ${x.a.type === 'paint' ? 'artwork' : 'postcard'}</button></figure>`).join('')}</div></details>` : '<div class="empty-art">🎨<p>Save artwork to add it to your gallery.</p></div>'}<div class="stamps">${[1,2,3,4].map(w => `<span class="stamp ${missions().some(m => m.week === w && done().includes(m.id)) ? 'earned' : ''}" aria-label="Milestone ${w}">${['🌱','🧩','💡','🏆'][w - 1]}</span>`).join('')}</div><div class="progress" role="progressbar" aria-label="Completed activities" aria-valuenow="${count}" aria-valuemin="0" aria-valuemax="150"><span style="width:${count / 150 * 100}%"></span></div><p>${count} of 150 activities saved</p>${previous ? `<p class="small">Earlier collection: ${previous} completed activities preserved.</p>` : ''}<p class="small muted">Each grade keeps its own progress. Changing worlds never resets your work.</p><button id="print-passport">Print passport</button></section>`;
  }
  function bindPassport() {
    document.getElementById('print-passport').onclick = () => {
      const details = document.querySelector('.gallery-details'); if (details) details.open = true;
      window.print();
    };
    document.querySelectorAll('[data-export]').forEach(b => b.onclick = () => exportArt(b.dataset.export));
  }
  function exportArt(id) {
    const item = gallery().find(x => x.id === id); if (!item) return;
    const a = item.a; let blob, ext;
    if (a.type === 'paint') {
      const colours = ['#ffffff','#8150af','#fc846d','#f6c847','#7bc5aa'];
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${a.size} ${a.size}" width="800" height="800">${a.pixels.map((v, i) => `<rect x="${i % a.size}" y="${Math.floor(i / a.size)}" width="1" height="1" fill="${colours[v]}"/>`).join('')}</svg>`;
      blob = new Blob([svg], { type:'image/svg+xml' }); ext = 'svg';
    } else { blob = new Blob([`${a.mood}\n\n${a.text}`], { type:'text/plain' }); ext = 'txt'; }
    const url = URL.createObjectURL(blob), link = document.createElement('a');
    link.href = url; link.download = `grade-${state.profile.grade}-${id}.${ext}`; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function progressText() { return `Day ${currentDay()} of 30 · ${dayCount(currentDay())}/5 done ${elapsedDays() >= 30 ? 'on day 30' : 'today'}`; }
  function calendar() {
    return `<section class="month-calendar" aria-label="30-day calendar"><h2>Your 30-day ${theme().noun.toLowerCase()}</h2><p class="small muted">Earlier days stay open. Future sets stay a surprise.</p><div class="day-grid">${Array.from({ length: C.DAYS }, (_, i) => {
      const day = i + 1, open = canDay(day), wait = day - currentDay();
      const text = open ? `${dayCount(day)}/5 saved` : wait === 1 ? 'Unlocks tomorrow' : `Come back in ${wait} days`;
      return `<button class="day-tile ${day === selectedDay ? 'active' : ''} ${open ? '' : 'locked'}" data-day="${day}" ${open ? '' : 'disabled'} aria-pressed="${day === selectedDay}" aria-label="Day ${day}. ${text}"><strong>${open ? (dayCount(day) === 5 ? '✓' : theme().icon) : '🔒'} Day ${day}</strong><span>${text}</span></button>`;
    }).join('')}</div></section>`;
  }
  function sidebar() {
    return `<div id="passport-slot">${passport()}</div><section class="panel guide"><span class="guide-icon">${theme().guide}</span><h3>${theme().name} guide</h3><p class="small">Prepared help, not a live teacher.</p><div class="guide-answer" id="guide-answer" role="status">Try today's five ${theme().noun.toLowerCase()}, or revisit an earlier day.</div><div class="quick-replies"><button data-guide="hint">A hint</button><button data-guide="save">Saving</button><button data-guide="class">Class details</button></div></section><section class="panel parent-note"><h3>Designed for Grade ${state.profile.grade}</h3><p>Activities combine creative play and grade-specific challenge settings. They are examples, not an official Bhanzu curriculum.</p><p class="small muted">Grades 1–2: discovery · 3–5: creative problem-solving · 6–8: fractions and logic · 9–12: design, functions and algebra.</p></section>`;
  }
  function details() {
    const m = missions().find(x => x.id === selected), list = dayMissions(selectedDay), index = list.findIndex(x => x.id === selected);
    return `<section class="panel detail" id="mission-detail"><div class="toolbar"><span class="pill">Grade ${state.profile.grade} · Day ${selectedDay} · ${index + 1}/5</span><span id="completion-chip" class="small">${done().includes(m.id) ? '✓ Saved to passport' : 'Take your time'}</span></div><h2>${m.icon} ${esc(m.title)}</h2><p class="question">${esc(m.prompt)}</p><div class="game" id="studio"><div class="game-label">${theme().noun.toUpperCase()} · PLAY SPACE</div><div class="studio-board"></div><div class="game-status" role="status">Explore at your own pace.</div></div><div class="actions"><button id="hint">Show a hint</button><button id="previous" ${index === 0 ? 'disabled' : ''}>← Previous</button><button id="next" class="primary" ${index === 4 ? 'disabled' : ''}>Next →</button></div><p class="benefit"><strong>What this practises:</strong> ${esc(m.benefit)}</p></section>`;
  }
  function record(id, artifact) {
    const m = missions().find(x => x.id === id);
    if (!canPlay(m)) { render(); return; }
    if (!done().includes(id)) state.progress[gradeKey()] = [...allProgress(), id];
    if (artifact) state.artifacts[draftKey(id)] = structuredClone(artifact);
    save(); const galleryWasOpen = document.querySelector('.gallery-details')?.open;
    document.getElementById('passport-slot').innerHTML = passport();
    const galleryDetails = document.querySelector('.gallery-details'); if (galleryDetails) galleryDetails.open = Boolean(artifact || galleryWasOpen);
    bindPassport(); document.getElementById('completion-chip').textContent = storageOK ? '✓ Saved to passport' : 'Created · saving unavailable';
    document.getElementById('daily-progress').textContent = progressText();
    document.getElementById('day-summary').textContent = `Day ${selectedDay} · ${dayCount(selectedDay)}/5 saved`;
    const dayButton = document.querySelector(`[data-day="${m.day}"]`), count = dayCount(m.day);
    dayButton.querySelector('span').textContent = `${count}/5 saved`;
    dayButton.querySelector('strong').textContent = `${count === 5 ? '✓' : theme().icon} Day ${m.day}`;
    dayButton.setAttribute('aria-label', `Day ${m.day}. ${count}/5 saved`);
    document.querySelector('.hero .float.two').textContent = `${theme().icon} ${dayCount(currentDay())} / 5 today`;
    document.querySelector(`#mission-picker option[value="${id}"]`).textContent = `✓ ${m.title}`;
  }
  function bindDetail() {
    const m = missions().find(x => x.id === selected); if (!canPlay(m)) return;
    S.mount(document.getElementById('studio'), m, state.drafts[draftKey(m.id)], {
      draft: d => { if (canPlay(m)) { state.drafts[draftKey(m.id)] = d; save(); } },
      complete: a => record(m.id, a)
    });
    document.getElementById('hint').onclick = () => { document.querySelector('.game-status').textContent = m.hint; };
    const list = dayMissions(selectedDay), index = list.findIndex(x => x.id === selected);
    document.getElementById('previous').onclick = () => select(list[index - 1]?.id);
    document.getElementById('next').onclick = () => select(list[index + 1]?.id);
  }
  function select(id) {
    const m = missions().find(x => x.id === id); if (!canPlay(m)) return;
    selectedDay = m.day; selected = id; render();
    document.getElementById('mission-detail')?.scrollIntoView({ block:'start', behavior:'instant' });
  }
  function selectDay(day) { if (canDay(day)) { selectedDay = day; selected = null; render(); } }
  function journey() {
    if (!canDay(selectedDay)) selectedDay = currentDay();
    const list = dayMissions(selectedDay);
    if (!list.some(m => m.id === selected)) selected = (list.find(m => !done().includes(m.id)) || list[0]).id;
    app.innerHTML = `<div class="toolbar"><span class="pill" id="daily-progress" role="status">${progressText()}</span><label class="grade-picker">Grade<select id="grade-picker">${options(state.profile.grade)}</select></label><label class="grade-picker">World<select id="theme-picker">${themeOptions()}</select></label><button id="settings-button">Settings</button></div>${hero()}${elapsedDays() >= 30 ? '<p class="banner">All 30 days have opened. Finish any activities you missed.</p>' : ''}<div class="activity-navigation"><div class="toolbar"><label for="mission-picker" id="day-summary">Day ${selectedDay} · ${dayCount(selectedDay)}/5 saved</label><button id="today-button">Go to today</button></div><select id="mission-picker">${list.map(m => `<option value="${m.id}" ${m.id === selected ? 'selected' : ''}>${done().includes(m.id) ? '✓ ' : ''}${esc(m.title)}</option>`).join('')}</select></div><div class="layout"><div>${details()}${calendar()}</div><aside class="side">${sidebar()}</aside></div>`;
    document.getElementById('mission-picker').onchange = e => select(e.target.value);
    document.getElementById('today-button').onclick = () => selectDay(currentDay());
    document.getElementById('grade-picker').onchange = e => { adoptGrade(+e.target.value); render(); };
    document.getElementById('theme-picker').onchange = e => { state.profile.avatar = e.target.value; save(); render(); };
    document.querySelectorAll('[data-day]').forEach(b => b.onclick = () => selectDay(+b.dataset.day));
    document.getElementById('settings-button').onclick = openSettings;
    bindPassport(); bindDetail();
    document.querySelectorAll('[data-guide]').forEach(b => b.onclick = () => {
      const m = missions().find(x => x.id === selected);
      document.getElementById('guide-answer').textContent = b.dataset.guide === 'hint' ? m.hint : b.dataset.guide === 'save' ? 'Games save their stamp when completed. Paintings and postcards have a Save button. Earlier days stay open, and drafts are stored on this device.' : `Your saved class date is ${dateLabel(state.profile.start)}. Use the confirmed time and joining link from Bhanzu.`;
    });
  }
  function started() {
    app.innerHTML = `<section class="panel complete-hero"><span class="big">${theme().icon}</span><h1>Your next adventure: class!</h1><p>Your saved class date is ${dateLabel(state.profile.start)}. Pre-class activities have stopped. Your saved artwork and passport remain available.</p><p>Use the time and joining link sent by Bhanzu.</p><button id="settings-button">Update class date or grade</button></section><div id="passport-slot" style="max-width:600px;margin:24px auto">${passport()}</div>`;
    document.getElementById('settings-button').onclick = openSettings; bindPassport();
  }
  function render() {
    S.dispose(); applyTheme();
    if (!state.profile) setup();
    else if (!gradeOK(state.profile.grade)) migrateGrade();
    else if (E.status(state.profile).started) started();
    else journey();
    storageNotice();
  }
  function openSettings() {
    const form = document.getElementById('settings-form');
    for (const key of ['nickname','onboard','start']) form.elements[key].value = state.profile[key];
    form.elements.grade.innerHTML = options(state.profile.grade);
    document.getElementById('settings-error').textContent = '';
    document.getElementById('settings').showModal();
  }
  document.getElementById('close-settings').onclick = () => document.getElementById('settings').close();
  document.getElementById('settings-form').onsubmit = e => {
    e.preventDefault(); const values = Object.fromEntries(new FormData(e.target));
    const p = { ...state.profile, ...values, grade:+values.grade, nickname:values.nickname.trim() || 'Explorer' };
    if (!gradeOK(p.grade) || !E.validateProfile(p)) { document.getElementById('settings-error').textContent = 'Choose valid dates and a grade. Class must be on or after onboarding.'; return; }
    state.profile = p; adoptGrade(p.grade); document.getElementById('settings').close(); render();
  };
  document.getElementById('reset').onclick = () => {
    if (!confirm('Remove all grades, drafts and artwork from this browser? Your original day-1 date will stay the same.')) return;
    state = { profile:null, done:[], progress:{}, drafts:{}, artifacts:{} };
    selected = null; selectedDay = currentDay(); draftTheme = 'detective'; save();
    document.getElementById('settings').close(); render();
  };
  let lastDate = E.today();
  const checkDate = () => { if (E.today() !== lastDate) { lastDate = E.today(); render(); } };
  setInterval(checkDate, 30000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) checkDate(); });
  save(); render();
})();


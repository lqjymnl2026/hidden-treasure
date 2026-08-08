/* ============================================================
 * 隐藏的珍宝｜66卷圣经互动学习平台 —— 应用层
 * 零依赖纯前端：hash 路由 + 本地进度存储 + 页面渲染
 * ============================================================ */

/* ---------- 进度存储 ---------- */
const STORE_KEY = 'yiqi-bible-progress-v1';
const store = {
  completed: {},   // 'genesis.1' -> { date: 'YYYY-MM-DD', minutes: 10 }
  notes: {},       // 'genesis.1' -> { discussion: '...', application: '...' }
  minutes: 0,
  counters: {},     // { recordings: n, reports: n }
  quiz: {},         // 'book.ch' -> 最佳挑战得分
  points: 0,        // 我的珍宝值
  reading: {},      // 'book.ch' -> { times, last, first }
  footprints: []    // 足迹记录
};
function loadStore() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) Object.assign(store, JSON.parse(raw));
  } catch (e) { /* ignore */ }
}
function saveStore() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(store)); } catch (e) { /* ignore */ }
}
loadStore();

const chKey = (bookId, n) => bookId + '.' + n;

function isDone(bookId, n) { return !!store.completed[chKey(bookId, n)]; }
function bookProgress(bookId) {
  const b = getBook(bookId);
  if (!b) return 0;
  let done = 0;
  for (let i = 1; i <= b.chapters; i++) if (isDone(bookId, i)) done++;
  return done / b.chapters;
}
function booksCompleted() {
  return BOOKS.filter(b => bookProgress(b.id) >= 1).length;
}
function chaptersDone() {
  return Object.keys(store.completed).length;
}
function totalMinutes() {
  return Object.values(store.completed).reduce((s, c) => s + (c.minutes || 0), 0);
}
function fmtMinutes(m) {
  const h = Math.floor(m / 60), mm = m % 60;
  if (h === 0) return mm + '分钟';
  return h + '小时' + (mm ? mm + '分钟' : '');
}
function recordActivity(type, key, pts) {
  try {
    store.points = (store.points || 0) + (pts || 0);
    const now = new Date();
    const date = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
    const time = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
    store.footprints = store.footprints || [];
    store.footprints.unshift({ t: type, k: key, d: date, tm: time });
    if (store.footprints.length > 300) store.footprints.length = 300;
    if (type === 'read') {
      store.reading = store.reading || {};
      const r = store.reading[key] || { times: 0, last: '', first: '' };
      r.times = (r.times || 0) + 1;
      r.last = date + ' ' + time;
      if (!r.first) r.first = date;
      store.reading[key] = r;
    }
    saveStore();
  } catch (e) {}
}

function streakDays() {
  const dates = Object.values(store.completed).map(c => c.date).filter(Boolean).sort();
  const uniq = [...new Set(dates)];
  if (!uniq.length) return 0;
  let streak = 1;
  for (let i = uniq.length - 1; i > 0; i--) {
    const prev = new Date(uniq[i - 1] + 'T00:00:00');
    const cur = new Date(uniq[i] + 'T00:00:00');
    const diff = (cur - prev) / 86400000;
    if (diff === 1) streak++;
    else break;
  }
  return streak;
}

/* ---------- 工具 ---------- */
function esc(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function todayStr() {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
function toast(msg) {
  let el = document.getElementById('toast');
  if (!el) { el = document.createElement('div'); el.id = 'toast'; el.className = 'toast'; document.body.appendChild(el); }
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove('show'), 2400);
}
function difficultyStars(n) {
  return '⭐'.repeat(n) + '☆'.repeat(Math.max(0, 3 - n));
}

/* ---------- 路由 ---------- */
function parseHash() {
  const h = location.hash.replace(/^#\/?/, '');
  const parts = h.split('/').filter(Boolean);
  return { path: parts[0] || 'home', parts };
}
function navigate(path) { location.hash = '#/' + path; }
function render() {
  const { path, parts } = parseHash();
  document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active'));
  const navMap = { home: 'nav-home', books: 'nav-books', themes: 'nav-themes', people: 'nav-people', progress: 'nav-progress', modes: 'nav-modes' };
  if (navMap[path]) {
    const el = document.getElementById(navMap[path]);
    if (el) el.classList.add('active');
  }
  const app = document.getElementById('app');
  const navLinksEl = document.querySelector('.nav-links');
  if (navLinksEl) navLinksEl.classList.remove('open');
  window.scrollTo(0, 0);
  switch (path) {
    case 'home': return renderHome(app);
    case 'book': return renderBook(app, parts[1]);
    case 'chapter': return renderChapter(app, parts[1], parseInt(parts[2], 10));
    case 'themes': return renderThemes(app);
    case 'theme': return renderTheme(app, parts[1]);
    case 'people': return renderPeople(app);
    case 'person': return renderPerson(app, parts[1]);
    case 'progress': return renderProgress(app);
    case 'modes': return renderModes(app);
    case 'start': return renderStart(app);
    default: return renderHome(app);
  }
}

/* ---------- 首页 ---------- */
function renderHome(app) {
  const done = chaptersDone();
  const firstIncomplete = firstIncompleteChapter();
  const continueTarget = done ? firstIncomplete : 'chapter/genesis/1';
  const continueLabel = done ? (firstIncomplete ? '继续学习' : '全部完成 🎉') : '开始创世记第1章';

  app.innerHTML = `
  <header class="hero">
    <div class="container">
      <span class="hero-kicker">📖 隐藏的珍宝 · 66卷圣经互动学习平台</span>
      <h1>从创世记到启示录，<br><span class="hl">一卷一卷学，一章一章走。</span></h1>
      <p class="lead">一起读、一起问、一起讨论、一起应用。每卷书都是学习世界，每章都是一次完整的灵修旅程：读经 → 观察 → 思考 → 回答 → 讨论 → 应用 → 祷告。</p>
      <p class="subtitle">📚 全圣经 · 66卷 · 1189章 · 主题地图 · 人物地图 · 四种查经模式</p>
      <p class="subtitle" style="margin-top:6px;color:rgba(255,255,255,.55)">「天国好像宝贝藏在地里。」—— 马太福音 13:44</p>
      <div class="entry-cards">
        <a class="entry-card" href="#/start">
          <div class="ec-emoji">🟢</div>
          <h3>从头开始</h3>
          <p>创世记 → 启示录，适合系统学习的完整旅程。</p>
          <span class="ec-tag">系统学习</span>
        </a>
        <a class="entry-card" href="#/books">
          <div class="ec-emoji">🔵</div>
          <h3>我想学某一卷</h3>
          <p>今天想学哪一卷？翻开任何一卷书的学习主页。</p>
          <span class="ec-tag">66卷目录</span>
        </a>
        <a class="entry-card" href="#/themes">
          <div class="ec-emoji">🟠</div>
          <h3>我现在遇到一个问题</h3>
          <p>「我最近很焦虑」→ 从生活进入圣经，找到相关经文与主题。</p>
          <span class="ec-tag">主题地图</span>
        </a>
      </div>
      <div class="hero-stats">
        <div class="hero-stat"><b>66</b><span>卷书</span></div>
        <div class="hero-stat"><b>1189</b><span>章</span></div>
        <div class="hero-stat"><b>${done}</b><span>已完成章节</span></div>
        <div class="hero-stat"><b>${streakDays()}</b><span>连续学习（天）</span></div>
      </div>
    </div>
  </header>
  <div class="container">

    <div class="section">
      ${renderDailyTreasure()}
    </div>

    <div class="section">
      <div class="section-head">
        <h2>🗺️ 我的圣经旅程</h2>
        <span class="sub">进度保存在本机浏览器</span>
        <a class="more" href="#/progress">查看全部 →</a>
      </div>
      <div class="card" style="padding:26px">
        <div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:10px;margin-bottom:10px">
          <span style="font-weight:800">已完成 ${done} / 1189 章</span>
          <span style="color:var(--muted);font-size:16px">${booksCompleted()} / 66 卷 · 累计 ${fmtMinutes(totalMinutes())}</span>
        </div>
        <div class="progress-track"><i style="width:${(done / 1189 * 100).toFixed(2)}%"></i></div>
        <a class="btn gold" href="#/${continueTarget}" style="margin-top:18px">${continueLabel} →</a>
      </div>
    </div>

    <div class="section">
      <div class="section-head">
        <h2>📚 全圣经 · 66卷</h2>
        <span class="sub">旧约39卷 + 新约27卷</span>
        <a class="more" href="#/books">打开完整目录 →</a>
      </div>
      ${renderAllBooksGrid()}
    </div>

    <div class="section">
      <div class="section-head">
        <h2>🧭 四种查经模式</h2>
        <span class="sub">从不同维度进入圣经</span>
        <a class="more" href="#/modes">了解更多 →</a>
      </div>
      ${renderModesGrid()}
    </div>

    <div class="section">
      <div class="section-head">
        <h2>❤️ 圣经主题地图</h2>
        <span class="sub">主题是横向学习：看「爱、信心、苦难……」如何贯穿全本圣经</span>
        <a class="more" href="#/themes">全部主题 →</a>
      </div>
      ${renderThemeGrid(10)}
    </div>

    <div class="section">
      <div class="section-head">
        <h2>👤 人物地图</h2>
        <span class="sub">跟着人物的人生轨迹查圣经：大卫、保罗、路得……</span>
        <a class="more" href="#/people">全部人物 →</a>
      </div>
      ${renderPeopleGrid(6)}
    </div>
  </div>`;
}

function firstIncompleteChapter() {
  for (const b of BOOKS) {
    for (let i = 1; i <= b.chapters; i++) {
      if (!isDone(b.id, i)) return 'chapter/' + b.id + '/' + i;
    }
  }
  return null;
}

/* ---------- 66卷目录 ---------- */
function renderBibleNavFull() {
  let html = '<div class="bible-nav"><div class="tab-col">';
  html += '<div class="testament-tabs">' + TESTAMENTS.map((t, i) =>
    `<button data-t="${t.id}" class="${i === 0 ? 'active' : ''}" onclick="switchTestament('${t.id}')">${t.name} ${t.count}卷</button>`).join('') + '</div>';
  html += '<div class="cat-list" id="catList">';
  TESTAMENTS.forEach((t, ti) => {
    t.categories.forEach((c, ci) => {
      html += `<button data-t="${t.id}" data-c="${c}" class="${ti === 0 && ci === 0 ? 'active' : ''}" onclick="switchCategory('${t.id}','${c}')">${c}</button>`;
    });
  });
  html += '</div></div><div class="book-sections" id="bookSections">';
  html += buildBookSections('ot', '律法书');
  html += '</div></div>';
  return html;
}
function buildBookSections(testamentId, category) {
  const books = booksOf(testamentId, category);
  const html = books.map(b => {
    const pct = Math.round(bookProgress(b.id) * 100);
    const cls = pct === 100 ? 'bt-done' : '';
    const doneLabel = pct === 100 ? '✓ 已完成' : (pct > 0 ? pct + '%' : '');
    return `<a class="book-tile" href="#/book/${b.id}" style="--tile-color:${b.color};--pct:${pct}%">
      <span class="bt-emoji">${b.emoji}</span>
      <span><span class="bt-name">${b.name}</span><br><span class="bt-meta">${b.chapters}章 · ${b.tagline}</span></span>
      ${doneLabel ? `<span class="bt-done">${doneLabel}</span>` : ''}
      <i class="bt-bar"></i>
    </a>`;
  }).join('');
  return `<div class="book-section"><h3>${category}</h3><div class="book-grid">${html}</div></div>`;
}
function switchTestament(id) {
  document.querySelectorAll('.testament-tabs button').forEach(b => b.classList.toggle('active', b.dataset.t === id));
  const t = getTestament(id);
  document.getElementById('bookSections').innerHTML = buildBookSections(id, t.categories[0]);
  document.querySelectorAll('.cat-list button').forEach(b => b.classList.toggle('active', b.dataset.t === id && b.dataset.c === t.categories[0]));
}
function switchCategory(id, cat) {
  document.getElementById('bookSections').innerHTML = buildBookSections(id, cat);
  document.querySelectorAll('.cat-list button').forEach(b => b.classList.toggle('active', b.dataset.t === id && b.dataset.c === cat));
}

function renderAllBooksGrid() {
  const sec = (tid) => {
    const t = getTestament(tid);
    return '<div class="book-section">' + t.categories.map(cat => {
      const books = booksOf(tid, cat);
      const tiles = books.map(b => {
        const pct = Math.round(bookProgress(b.id) * 100);
        const doneLabel = pct === 100 ? '✓' : (pct > 0 ? pct + '%' : '');
        return `<a class="book-tile" href="#/book/${b.id}" style="--tile-color:${b.color};--pct:${pct}%">
          <span class="bt-emoji">${b.emoji}</span>
          <span><span class="bt-name">${b.name}</span><br><span class="bt-meta">${b.chapters}章 · ${b.tagline}</span></span>
          ${doneLabel ? `<span class="bt-done">${doneLabel}</span>` : ''}
          <i class="bt-bar"></i>
        </a>`;
      }).join('');
      return `<div class="book-section"><h3>${cat}</h3><div class="book-grid">${tiles}</div></div>`;
    }).join('') + '</div>';
  };
  return `<div class="book-sections">${sec('ot')}${sec('nt')}</div>`;
}

function renderBooks(app) {
  app.innerHTML = `
  <div class="container" style="padding-top:40px">
    <div class="section-head" style="margin-bottom:4px"><h1 style="font-size:33px">📚 全圣经 · 66卷</h1></div>
    <p style="color:var(--muted);margin-bottom:6px">旧约 39 卷 · 新约 27 卷 · 从律法书到启示录。点开任何一卷，进入它的学习世界。</p>
    ${renderBibleNavFull()}
  </div>`;
}

/* ---------- 书卷主页 ---------- */
function renderBook(app, bookId) {
  const b = getBook(bookId);
  if (!b) { app.innerHTML = emptyPage('没有找到这卷书'); return; }
  const t = getTestament(b.testament);
  const pct = Math.round(bookProgress(b.id) * 100);
  const done = Math.round(bookProgress(b.id) * b.chapters);
  const first = firstIncompleteInBook(b.id);
  const goLabel = done === 0 ? '开始学习第1章' : (first ? '继续学习第' + first + '章' : '🎉 本卷已完成');

  let mapHtml = '<ul class="map-list">';
  for (let i = 1; i <= b.chapters; i++) {
    const title = chapterTitle(b.id, i);
    const doneCls = isDone(b.id, i) ? 'done' : '';
    const hereCls = (first === i) ? 'here' : '';
    mapHtml += `<li class="${doneCls} ${hereCls}">
      <span class="map-node">${isDone(b.id, i) ? '✓' : i}</span>
      <a class="map-label" href="#/chapter/${b.id}/${i}">
        <span class="ml-ref">第${i}章</span>
        <b>${title}</b>
        <span>${getLesson(b.id, i) ? '📖 精选互动课程' : '点击开始本章查经'}</span>
      </a>
    </li>`;
  }
  mapHtml += '</ul>';

  app.innerHTML = `
  <div class="container" style="padding-top:20px">
    <div class="book-hero" style="background:linear-gradient(135deg, ${b.color}, ${shade(b.color, -30)})">
      <div class="bh-crumbs"><a href="#/books">📚 全圣经</a> · ${t.name} · ${b.category}</div>
      <div class="bh-emoji">${b.emoji}</div>
      <h1>${b.name}</h1>
      <div class="bh-en">${b.en}</div>
      <span class="bh-tagline">${b.tagline}</span>
      <div class="bh-theme">核心主题：${b.theme}</div>
      <div class="bh-summary">${b.summary}</div>
      <div class="book-meta-row">
        <div class="bm-item"><span>作者</span><b>${b.author}</b></div>
        <div class="bm-item"><span>共</span><b>${b.chapters} 章</b></div>
        <div class="bm-item"><span>学习进度</span><b>🟢 ${done} / ${b.chapters}</b></div>
        <div class="bm-item"><span>完成度</span><b>${pct}%</b></div>
      </div>
    </div>

    <div class="book-body">
      <div class="book-main">
        <div class="card map-card">
          <h3>🗺️ 本卷学习地图</h3>
          <p class="map-sub">你现在走到哪里了？绿色 = 已完成，金色 = 当前位置。</p>
          ${mapHtml}
        </div>
      </div>
      <aside class="book-side">
        <div class="card progress-card">
          <h3>📊 学习进度</h3>
          <div class="pc-num">${done}<small> / ${b.chapters} 章</small></div>
          <div class="progress-track"><i style="width:${pct}%"></i></div>
          <div class="pc-pct">已完成 ${pct}% · ${done === b.chapters ? '本卷通关 🎉' : '继续加油！'}</div>
          <a class="btn gold btn-go" href="#/chapter/${b.id}/${first || 1}">${goLabel} →</a>
          <div style="margin-top:16px;font-size:12.5px;color:var(--muted);line-height:1.8">
            🎯 每章完成：读经 → 观察 → 思考 → 回答 → 讨论 → 应用 → 祷告<br>
            💾 进度自动保存在本机
          </div>
        </div>
        <div class="card" style="padding:20px;margin-top:16px">
          <h3 style="font-size:18px;margin-bottom:8px">相关主题</h3>
          ${relatedThemes(b.id)}
        </div>
      </aside>
    </div>
  </div>`;
}
function firstIncompleteInBook(bookId) {
  const b = getBook(bookId);
  for (let i = 1; i <= b.chapters; i++) if (!isDone(b.id, i)) return i;
  return null;
}
function relatedThemes(bookId) {
  const rel = THEMES.filter(th => th.books.some(x => x.book === bookId)).slice(0, 5);
  if (!rel.length) return '<p style="font-size:16px;color:var(--muted)">暂无相关主题</p>';
  return '<div style="display:flex;flex-wrap:wrap;gap:8px">' + rel.map(t =>
    `<a class="chip" href="#/theme/${t.id}" style="background:var(--cream);border:1px solid var(--line);color:var(--indigo-deep)">${t.emoji} ${t.name}</a>`).join('') + '</div>';
}
function shade(hex, percent) {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const r = Math.min(255, Math.max(0, (num >> 16) + amt));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + amt));
  const b = Math.min(255, Math.max(0, (num & 0x0000ff) + amt));
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

/* ---------- 章节互动页 ---------- */
function renderChapter(app, bookId, num) {
  const b = getBook(bookId);
  if (!b || !num || num < 1 || num > b.chapters) { app.innerHTML = emptyPage('没有找到这一章'); return; }
  const lesson = getLesson(bookId, num);
  const title = lesson ? lesson.title : chapterTitle(bookId, num);
  const ref = `${b.name} ${num}章`;
  const prev = num > 1 ? num - 1 : null;
  const next = num < b.chapters ? num + 1 : null;
  const done = isDone(b.id, num);
  const note = store.notes[chKey(b.id, num)] || {};

  app.innerHTML = `
  <div class="container" style="padding-top:20px">
    <div class="lesson-hero" style="background:linear-gradient(135deg, ${b.color}, ${shade(b.color, -30)})">
      <div class="lh-crumbs"><a href="#/book/${b.id}">${b.emoji} ${b.name}</a> · 第${num}章 / 共${b.chapters}章</div>
      <h1>🌅 今天学习：${title}</h1>
      <div class="lh-ref">📖 ${ref}</div>
      <div class="lesson-chips">
        <span class="chip">⏱ 学习时间 ${lesson ? lesson.minutes : 10} 分钟</span>
        <span class="chip">难度 ${lesson ? difficultyStars(lesson.difficulty) : '⭐'}</span>
        <span class="chip">👥 参与人数 ${(126 + ((bookId.length + num) * 37) % 900)} 人</span>
        ${done ? '<span class="chip" style="background:rgba(47,133,90,.25);border-color:rgba(47,133,90,.4)">✅ 已完成本章</span>' : ''}
      </div>
    </div>

    <nav class="lesson-nav">
      ${prev ? `<a class="ln-prev" href="#/chapter/${b.id}/${prev}">← 上一章 · ${chapterTitle(b.id, prev)}</a>` : '<span class="ln-prev disabled">← 已是第1章</span>'}
      <a class="ln-prev" href="#/book/${b.id}" style="border-style:dashed">🗺️ 本卷地图</a>
      ${next ? `<a class="ln-next" href="#/chapter/${b.id}/${next}">下一章 · ${chapterTitle(b.id, next)} →</a>` : '<span class="ln-next disabled">已是最后一章 →</span>'}
    </nav>

    ${renderChapterJump(b.id, num)}

    ${explainSection(b.id, num)}

    <div class="steps">
      ${lesson ? renderCuratedSteps(b, num, lesson, note, done) : renderGenericSteps(b, num, title, note, done)}
      ${recorderSection(chKey(b.id, num))}
      ${quizSection(chKey(b.id, num))}
    </div>

    ${done ? `<div class="complete-card" style="margin-top:30px">
      <div class="cc-emoji">🎉</div>
      <h3>本章学习完成</h3>
      <p>${b.name} ${num}章 · ${title} · 你已经完成了：读经 → 观察 → 思考 → 回答 → 讨论 → 应用 → 祷告</p>
      <div class="cc-btns">
        ${next ? `<a class="btn gold" href="#/chapter/${b.id}/${next}">继续下一章 →</a>` : `<a class="btn gold" href="#/book/${b.id}">返回本卷地图</a>`}
        <a class="btn ghost" href="#/progress">查看我的旅程</a>
        <button class="btn ghost" onclick="openReport('${b.id}', ${num})">📄 查经报告</button>
        <button class="btn ghost" onclick="downloadChapterReport('${b.id}', ${num})">📥 一键导出保存</button>
        <button class="btn ghost" onclick="downloadChapterReport('${b.id}', ${num})">📥 一键导出保存</button>
      </div>
    </div>` : ''}
  </div>`;
  try { initRecorder(qKey); } catch (e) {}
  try { loadChapterText(chKey(b.id, num)); } catch (e) {}
  try { recordActivity('read', chKey(b.id, num), 10); } catch (e) {}
}

function renderChapterJump(bookId, num) {
  const b = getBook(bookId);
  let items = '';
  for (let i = 1; i <= b.chapters; i++) {
    const cls = i === num ? 'current' : (isDone(bookId, i) ? 'done' : '');
    items += `<a class="cj-item ${cls}" href="#/chapter/${bookId}/${i}" title="第${i}章 · ${chapterTitle(bookId, i)}">${i}</a>`;
  }
  return `<div class="chapter-jump">
    <span class="cj-label">📑 章节</span>
    <div class="cj-links">${items}</div>
  </div>`;
}

/* ---------- 我的祷告录音 ---------- */
const REC_DB = 'yiqi-prayer-rec-v1';
const recStreams = {}, recRecorders = {}, recChunks = {}, recTimers = {}, recSecs = {}, recBlobs = {};
let recPausedBg = false;

function recorderSection(qKey) {
  return `
  <!-- ⑧ 我的祷告录音 -->
  <section class="step" data-step="8">
    <div class="step-head"><span class="step-badge gold-badge">⑧</span><div class="step-title"><h3>我的祷告录音</h3><p>把今天的祷告录下来，可以回放，也可以导出保存到手机或电脑</p></div></div>
    <div class="step-body">
      <div class="rec-box">
        <div class="rec-timer" id="rec-timer-${qKey}">00:00</div>
        <div class="rec-status" id="rec-status-${qKey}">🎙️ 点击「开始录音」，向神倾心吐意</div>
        <div class="rec-controls">
          <button class="btn gold sm" id="rec-start-${qKey}" onclick="startRecord('${qKey}')">🎙️ 开始录音</button>
          <button class="btn ghost sm" id="rec-stop-${qKey}" onclick="stopRecord('${qKey}')" style="display:none">⏹ 停止录音</button>
          <button class="btn ghost sm" id="rec-play-${qKey}" onclick="playRecording('${qKey}')" style="display:none">▶️ 播放</button>
          <button class="btn ghost sm" id="rec-export-${qKey}" onclick="exportRecording('${qKey}')" style="display:none">📥 导出到设备</button>
          <button class="btn ghost sm" id="rec-del-${qKey}" onclick="deleteRecording('${qKey}')" style="display:none">🗑 删除</button>
        </div>
        <audio id="rec-audio-${qKey}" controls style="display:none;width:100%;margin-top:12px"></audio>
        <div class="rec-note">🔒 录音只保存在你自己的设备上（浏览器本地），可随时导出；删除后无法找回。</div>
      </div>
    </div>
  </section>`;
}

function recDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(REC_DB, 1);
    req.onupgradeneeded = () => { if (!req.result.objectStoreNames.contains('recs')) req.result.createObjectStore('recs', { keyPath: 'key' }); };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function recSave(key, blob, duration) {
  const db = await recDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('recs', 'readwrite');
    tx.objectStore('recs').put({ key, blob, duration, date: todayStr() });
    tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error);
  });
}
async function recLoad(key) {
  const db = await recDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('recs', 'readonly');
    const rq = tx.objectStore('recs').get(key);
    rq.onsuccess = () => resolve(rq.result || null); rq.onerror = () => reject(rq.error);
  });
}
async function recDelete(key) {
  const db = await recDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('recs', 'readwrite');
    tx.objectStore('recs').delete(key);
    tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error);
  });
}
function recPickMime() {
  if (!window.MediaRecorder) return '';
  const types = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus'];
  for (const t of types) if (MediaRecorder.isTypeSupported(t)) return t;
  return '';
}
function recExt(mime) { return mime.indexOf('mp4') >= 0 ? 'm4a' : (mime.indexOf('ogg') >= 0 ? 'ogg' : 'webm'); }
function recFmtSec(s) { s = Math.max(0, Math.floor(s || 0)); return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0'); }
function recFileName(key, mime) {
  const parts = key.split('.');
  const b = getBook(parts[0]);
  const nm = (b ? b.name : parts[0]) + '第' + parts[1] + '章';
  return '隐藏的珍宝-祷告录音-' + nm + '-' + todayStr() + '.' + recExt(mime || '');
}
function recStopStream(key) { if (recStreams[key]) { recStreams[key].getTracks().forEach(t => t.stop()); recStreams[key] = null; } }
window.startRecord = async function (key) {
  const st = document.getElementById('rec-status-' + key);
  const startBtn = document.getElementById('rec-start-' + key);
  const stopBtn = document.getElementById('rec-stop-' + key);
  const timerEl = document.getElementById('rec-timer-' + key);
  if (!st || !startBtn || !stopBtn) return;
  try {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || !window.MediaRecorder) {
      st.textContent = '⚠️ 你的浏览器不支持录音，请用最新版 Chrome / Safari 访问（需 HTTPS）';
      return;
    }
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mime = recPickMime();
    const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
    recStreams[key] = stream; recRecorders[key] = rec; recChunks[key] = [];
    rec.ondataavailable = e => { if (e.data && e.data.size) recChunks[key].push(e.data); };
    rec.onstop = async () => {
      const blob = new Blob(recChunks[key], { type: mime || 'audio/webm' });
      const dur = recSecs[key] || 0;
      try { await recSave(key, blob, dur); } catch (e) {}
      store.counters = store.counters || {}; store.counters.recordings = (store.counters.recordings || 0) + 1; saveStore();
      recordActivity('record', key, 20);
      if (recPausedBg) { recPausedBg = false; const bg2 = document.getElementById('bgMusic'); if (bg2) bg2.play().catch(() => {}); }
      recBlobs[key] = blob;
      if (recTimers[key]) { clearInterval(recTimers[key]); recTimers[key] = null; }
      recStopStream(key);
      showRecorderResult(key, blob, dur, false);
    };
    const bg = document.getElementById('bgMusic');
    if (bg && !bg.paused) { recPausedBg = true; bg.pause(); }
    rec.start();
    startBtn.style.display = 'none'; stopBtn.style.display = '';
    st.textContent = recPausedBg ? '🔴 正在录音…（背景音乐已自动暂停）祷告结束后点「停止录音」' : '🔴 正在录音… 祷告结束后点「停止录音」';
    recSecs[key] = 0; if (timerEl) timerEl.textContent = '00:00';
    recTimers[key] = setInterval(() => { recSecs[key]++; if (timerEl) timerEl.textContent = recFmtSec(recSecs[key]); }, 1000);
  } catch (e) {
    st.textContent = '⚠️ 无法使用麦克风：' + (e && e.message ? e.message : '请允许麦克风权限后重试');
  }
};
window.stopRecord = function (key) { if (recRecorders[key]) recRecorders[key].stop(); };
function showRecorderResult(key, blob, duration, fromSaved) {
  const st = document.getElementById('rec-status-' + key);
  const startBtn = document.getElementById('rec-start-' + key);
  const stopBtn = document.getElementById('rec-stop-' + key);
  const playBtn = document.getElementById('rec-play-' + key);
  const expBtn = document.getElementById('rec-export-' + key);
  const delBtn = document.getElementById('rec-del-' + key);
  const audio = document.getElementById('rec-audio-' + key);
  const timerEl = document.getElementById('rec-timer-' + key);
  if (startBtn) startBtn.style.display = 'none';
  if (stopBtn) stopBtn.style.display = 'none';
  if (playBtn) playBtn.style.display = '';
  if (expBtn) expBtn.style.display = '';
  if (delBtn) delBtn.style.display = '';
  if (audio) { audio.style.display = 'block'; audio.src = URL.createObjectURL(blob); }
  if (timerEl) timerEl.textContent = recFmtSec(duration);
  if (st) st.textContent = fromSaved ? '📼 已有录音（' + recFmtSec(duration) + '），可播放或导出保存' : '✅ 录音完成（' + recFmtSec(duration) + '），可播放或导出保存';
  recBlobs[key] = blob;
}
window.playRecording = function (key) { const a = document.getElementById('rec-audio-' + key); if (a) a.play(); };
window.exportRecording = async function (key) {
  let blob = recBlobs[key];
  if (!blob) { try { const saved = await recLoad(key); if (saved) blob = saved.blob; } catch (e) {} }
  if (!blob) { toast('还没有可导出的录音'); return; }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = recFileName(key, blob.type);
  document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 900);
  toast('📥 已开始导出，请到「下载/文件」中查看保存');
};
window.deleteRecording = async function (key) {
  if (!confirm('确定删除这段祷告录音吗？删除后无法恢复。')) return;
  try { await recDelete(key); } catch (e) {}
  delete recBlobs[key];
  const st = document.getElementById('rec-status-' + key);
  const startBtn = document.getElementById('rec-start-' + key);
  const playBtn = document.getElementById('rec-play-' + key);
  const expBtn = document.getElementById('rec-export-' + key);
  const delBtn = document.getElementById('rec-del-' + key);
  const audio = document.getElementById('rec-audio-' + key);
  const timerEl = document.getElementById('rec-timer-' + key);
  if (st) st.textContent = '🎙️ 点击「开始录音」，向神倾心吐意';
  if (startBtn) startBtn.style.display = '';
  if (playBtn) playBtn.style.display = 'none';
  if (expBtn) expBtn.style.display = 'none';
  if (delBtn) delBtn.style.display = 'none';
  if (audio) { audio.style.display = 'none'; audio.src = ''; }
  if (timerEl) timerEl.textContent = '00:00';
  toast('🗑 录音已删除');
};
async function initRecorder(key) {
  try {
    const saved = await recLoad(key);
    if (saved) showRecorderResult(key, saved.blob, saved.duration || 0, true);
  } catch (e) {}
}
if (window.addEventListener) window.addEventListener('pagehide', () => { Object.keys(recStreams).forEach(k => recStopStream(k)); });

/* 精选章节：完整七步 */
function renderCuratedSteps(b, num, lesson, note, done) {
  const qKey = chKey(b.id, num);
  const savedDiscussion = note.discussion || '';
  const savedApp = note.application || '';
  const sampleAvatars = ['林', '慧', '大卫', '恩', '以勒', '小羊', 'Grace', 'Faith'];
  const samples = lesson.discussion.samples.map((s, i) =>
    `<div class="sample"><span class="s-avatar">${sampleAvatars[i % sampleAvatars.length]}</span><div><b>匿名学友 #${i + 1}${i === 0 ? ' · 最新' : ''}</b><p>${s}</p></div></div>`).join('');

  return `
  <!-- ① 开场问题 -->
  <section class="step" data-step="1">
    <div class="step-head"><span class="step-badge">①</span><div class="step-title"><h3>开场问题</h3><p>先别急着看答案，问问自己的心</p></div></div>
    <div class="step-body">
      <div class="step-question">${lesson.opening.question}</div>
      <div class="options">
        ${lesson.opening.options.map((o, i) => `<button class="option" data-q="opening" data-i="${i}" onclick="pickOpening(this,'${qKey}')"><span class="o-key">${i + 1}</span>${o}</button>`).join('')}
      </div>
      <div class="feedback info" id="fb-opening-${qKey}"><span class="fb-emoji">💭</span> 没有标准答案，重要的是先诚实面对自己。带着你的答案，一起读这段经文。</div>
    </div>
  </section>

  <!-- ② 阅读经文 -->
  <section class="step" data-step="2">
    <div class="step-head"><span class="step-badge gold-badge">②</span><div class="step-title"><h3>阅读经文</h3><p>慢慢读，留意触动你的字句</p></div></div>
    <div class="step-body">
      <div class="passage-box">
        <div class="pb-ref">📖 ${lesson.passage}</div>
        <div class="pb-verse">${lesson.memoryVerse}</div>
        <p class="pb-note">💡 下面是本章完整经文（和合本简体），慢慢读，读到触动你的句子时停下来默想。</p>
        <div class="bible-text" id="bible-text-${qKey}"><div class="bt-loading">📖 正在加载本章经文…</div></div>
      </div>
      <button class="btn ghost sm read-btn" onclick="markRead(this,'${qKey}')">✓ 我读完了这一章</button>
      <button class="btn ghost sm" onclick="speakChapter('${qKey}')">🔊 朗读全文</button>
      <div class="feedback ok" id="fb-read-${qKey}" style="margin-top:12px"><span class="fb-emoji">📖</span> 读经是查经的基础。接下来我们一起来观察这段经文。</div>
    </div>
  </section>

  <!-- ③ 经文观察 -->
  <section class="step" data-step="3">
    <div class="step-head"><span class="step-badge">③</span><div class="step-title"><h3>经文观察</h3><p>系统不直接解释，先问「经文说了什么」</p></div></div>
    <div class="step-body">
      <div class="step-question">${lesson.observation.question}</div>
      <div class="options">
        ${lesson.observation.options.map((o, i) => `<button class="option" data-q="obs" data-correct="${o.correct}" data-i="${i}" onclick="checkQuiz(this,'${qKey}')"><span class="o-key">${'ABCD'[i]}</span>${o.text}</button>`).join('')}
      </div>
      <div class="feedback ok" id="fb-obs-${qKey}"><span class="fb-emoji">🎉</span> 正确！你观察得很仔细。</div>
      <div class="feedback info" id="fb-obs-wrong-${qKey}"><span class="fb-emoji">🤔</span> 再读一遍经文看看？答案就在上下文里。</div>
    </div>
  </section>

  <!-- ④ 发现圣经 -->
  <section class="step" data-step="4">
    <div class="step-head"><span class="step-badge gold-badge">④</span><div class="step-title"><h3>发现圣经</h3><p>这一步没有唯一答案，可能全选哦</p></div></div>
    <div class="step-body">
      <div class="step-question">${lesson.discovery.question}</div>
      <div class="options">
        ${lesson.discovery.options.map(o => `<button class="option" data-q="disc" data-correct="${o.correct}" onclick="checkQuiz(this,'${qKey}')"><span class="o-key">${o.key}</span>${o.text}</button>`).join('')}
      </div>
      <div class="feedback ok" id="fb-disc-${qKey}" style="margin-top:14px">
        <span class="fb-emoji">✨</span> ${lesson.discovery.note}
      </div>
    </div>
  </section>

  <!-- ⑤ 一起讨论 -->
  <section class="step" data-step="5">
    <div class="step-head"><span class="step-badge">⑤</span><div class="step-title"><h3>一起讨论</h3><p>写下你的回答，或看看其他学友的想法</p></div></div>
    <div class="step-body">
      <div class="step-question">${lesson.discussion.prompt}</div>
      <div class="write-box">
        <textarea id="ta-disc-${qKey}" placeholder="✍️ 写下你的回答……">${esc(savedDiscussion)}</textarea>
        <div class="wb-actions">
          <button class="btn sm" onclick="saveNote('${qKey}','discussion','ta-disc-${qKey}')">保存我的回答</button>
          <span class="wb-saved" id="saved-disc-${qKey}">✓ 已保存</span>
          <button class="btn sm ghost" onclick="toggleSamples('${qKey}')">👥 查看其他人的回答</button>
        </div>
      </div>
      <div class="discuss-samples" id="samples-${qKey}" style="display:none">${samples}</div>
    </div>
  </section>

  <!-- ⑥ 今天应用 -->
  <section class="step" data-step="6">
    <div class="step-head"><span class="step-badge gold-badge">⑥</span><div class="step-title"><h3>今天应用</h3><p>把圣经从「读完」变成「活出来」</p></div></div>
    <div class="step-body">
      <div class="step-question">${lesson.application.prompt}</div>
      <div class="write-box">
        <textarea id="ta-app-${qKey}" placeholder="${lesson.application.placeholder}">${esc(savedApp)}</textarea>
        <div class="wb-actions">
          <button class="btn sm" onclick="saveNote('${qKey}','application','ta-app-${qKey}')">保存我的应用</button>
          <span class="wb-saved" id="saved-app-${qKey}">✓ 已保存</span>
        </div>
      </div>
    </div>
  </section>

  <!-- ⑦ 今日祷告 -->
  <section class="step" data-step="7">
    <div class="step-head"><span class="step-badge">⑦</span><div class="step-title"><h3>今日祷告</h3><p>系统根据今天的主题生成了祷告引导</p></div></div>
    <div class="step-body">
      <div class="passage-box" style="background:#eef3fb;border-color:#d6e2f5;border-left-color:var(--indigo)">
        <div class="pb-verse">🙏 ${lesson.prayer}</div>
      </div>
      <div style="display:flex;gap:12px;margin-top:16px;flex-wrap:wrap">
        <button class="btn gold" onclick="completeChapter('${qKey}', ${lesson.minutes})">✅ 完成本章学习</button>
        <button class="btn ghost" onclick="navigate('book/${b.id}')">🗺️ 返回本卷地图</button>
        <button class="btn ghost" onclick="openReport('${b.id}', ${num})">📄 查经报告</button>
        <button class="btn ghost" onclick="downloadChapterReport('${b.id}', ${num})">📥 一键导出保存</button>
      </div>
    </div>
  </section>`;
}

/* 未精选章节：统一七步结构（通用引导） */
function renderGenericSteps(b, num, title, note, done) {
  const qKey = chKey(b.id, num);
  const savedDiscussion = note.discussion || '';
  const savedApp = note.application || '';
  return `
  <section class="step">
    <div class="step-head"><span class="step-badge">①</span><div class="step-title"><h3>开场问题</h3><p>带着问题开始读经</p></div></div>
    <div class="step-body">
      <div class="step-question">在读${b.name} ${num}章之前，你对「${title}」这个话题有什么想法或疑问？</div>
      <div class="write-box">
        <textarea id="ta-opening-${qKey}" placeholder="✍️ 写下你的想法……"></textarea>
        <div class="wb-actions"><button class="btn sm" onclick="saveNote('${qKey}','opening','ta-opening-${qKey}')">保存</button><span class="wb-saved" id="saved-opening-${qKey}">✓ 已保存</span></div>
      </div>
    </div>
  </section>
  <section class="step">
    <div class="step-head"><span class="step-badge gold-badge">②</span><div class="step-title"><h3>阅读经文</h3><p>慢慢读，留意触动你的字句</p></div></div>
    <div class="step-body">
      <div class="passage-box">
        <div class="pb-ref">📖 ${b.name} ${num}章</div>
        <p class="pb-note">💡 下面是本章完整经文（和合本简体），慢慢读。留意：谁？在哪里？发生什么？神说了什么？</p>
        <div class="bible-text" id="bible-text-${qKey}"><div class="bt-loading">📖 正在加载本章经文…</div></div>
      </div>
      <button class="btn ghost sm read-btn" onclick="markRead(this,'${qKey}')">✓ 我读完了这一章</button>
      <button class="btn ghost sm" onclick="speakChapter('${qKey}')">🔊 朗读全文</button>
      <div class="feedback ok" id="fb-read-${qKey}" style="margin-top:12px"><span class="fb-emoji">📖</span> 很好！读完之后，试着用自己的话总结这一章。</div>
    </div>
  </section>
  <section class="step">
    <div class="step-head"><span class="step-badge">③</span><div class="step-title"><h3>经文观察</h3><p>问三个问题：谁、发生了什么、结果如何</p></div></div>
    <div class="step-body">
      <div class="step-question">试着回答：「这一章主要讲了什么？有什么关键词或重复出现的词？」</div>
      <div class="write-box">
        <textarea id="ta-obs-${qKey}" placeholder="✍️ 写下你的观察……"></textarea>
        <div class="wb-actions"><button class="btn sm" onclick="saveNote('${qKey}','observation','ta-obs-${qKey}')">保存</button><span class="wb-saved" id="saved-observation-${qKey}">✓ 已保存</span></div>
      </div>
    </div>
  </section>
  <section class="step">
    <div class="step-head"><span class="step-badge gold-badge">④</span><div class="step-title"><h3>发现圣经</h3><p>这段经文让我更多认识神和祂的旨意吗？</p></div></div>
    <div class="step-body">
      <div class="step-question">从这一章里，你发现关于神（祂的属性、祂的作为）或关于人（我们的本相、当行的路）的什么真理？</div>
      <div class="write-box">
        <textarea id="ta-disc-${qKey}" placeholder="✍️ 写下你的发现……"></textarea>
        <div class="wb-actions"><button class="btn sm" onclick="saveNote('${qKey}','discovery','ta-disc-${qKey}')">保存</button><span class="wb-saved" id="saved-discovery-${qKey}">✓ 已保存</span></div>
      </div>
    </div>
  </section>
  <section class="step">
    <div class="step-head"><span class="step-badge">⑤</span><div class="step-title"><h3>一起讨论</h3><p>把经文和我的生活连起来</p></div></div>
    <div class="step-body">
      <div class="step-question">这一章里，最触动你的一句话是什么？它和你现在的处境有什么关系？</div>
      <div class="write-box">
        <textarea id="ta-talk-${qKey}" placeholder="✍️ 写下你的回答……">${esc(savedDiscussion)}</textarea>
        <div class="wb-actions"><button class="btn sm" onclick="saveNote('${qKey}','discussion','ta-talk-${qKey}')">保存我的回答</button><span class="wb-saved" id="saved-discussion-${qKey}">✓ 已保存</span></div>
      </div>
    </div>
  </section>
  <section class="step">
    <div class="step-head"><span class="step-badge gold-badge">⑥</span><div class="step-title"><h3>今天应用</h3><p>把圣经从「读完」变成「活出来」</p></div></div>
    <div class="step-body">
      <div class="step-question">基于这一章，今天你可以做一个什么具体的行动？（哪怕很小）</div>
      <div class="write-box">
        <textarea id="ta-app-${qKey}" placeholder="✍️ 例如：对一个人说一句感谢、饶恕一个人、为一个人祷告……">${esc(savedApp)}</textarea>
        <div class="wb-actions"><button class="btn sm" onclick="saveNote('${qKey}','application','ta-app-${qKey}')">保存我的应用</button><span class="wb-saved" id="saved-application-${qKey}">✓ 已保存</span></div>
      </div>
    </div>
  </section>
  <section class="step">
    <div class="step-head"><span class="step-badge">⑦</span><div class="step-title"><h3>今日祷告</h3><p>用祷告回应今天所学</p></div></div>
    <div class="step-body">
      <div class="passage-box" style="background:#eef3fb;border-color:#d6e2f5;border-left-color:var(--indigo)">
        <div class="pb-verse">🙏 主啊，感谢你藉着${b.name} ${num}章对我说话。求你让我不只「读完」这一章，更能「活出」你的话语。求你光照我、引导我，使我今天有一个顺服的行动。奉耶稣的名，阿们。</div>
      </div>
      <div style="display:flex;gap:12px;margin-top:16px;flex-wrap:wrap">
        <button class="btn gold" onclick="completeChapter('${qKey}', 10)">✅ 完成本章学习</button>
        <button class="btn ghost" onclick="navigate('book/${b.id}')">🗺️ 返回本卷地图</button>
        <button class="btn ghost" onclick="openReport('${b.id}', ${num})">📄 查经报告</button>
      </div>
    </div>
  </section>`;
}

/* ---------- 查经报告 ---------- */
function reportFields(bookId, num) {
  const b = getBook(bookId);
  const lesson = getLesson(bookId, num);
  const title = lesson ? lesson.title : chapterTitle(bookId, num);
  const note = store.notes[chKey(bookId, num)] || {};
  const fields = [];
  const push = (label, q, a) => fields.push({ label, q, a: (a || '').trim() });
  if (lesson) {
    push('① 开场问题', lesson.opening.question, note.opening);
    push('② 经文观察', lesson.observation.question, note.observation);
    push('③ 发现圣经', lesson.discovery.question, note.discovery);
    push('④ 一起讨论', lesson.discussion.prompt, note.discussion);
    push('⑤ 今天应用', lesson.application.prompt, note.application);
  } else {
    push('① 开场问题', '读' + b.name + ' ' + num + '章之前，我对「' + title + '」的想法', note.opening);
    push('② 经文观察', '这一章主要讲了什么？有哪些关键词或重复出现的词？', note.observation);
    push('③ 发现圣经', '这一章让我更多认识神（或认识人）什么？', note.discovery);
    push('④ 一起讨论', '最触动我的一句话是什么？它和我现在的处境有什么关系？', note.discussion);
    push('⑤ 今天应用', '基于这一章，今天我可以做什么具体行动？', note.application);
  }
  return { b, num, title, lesson, fields };
}
function reportSections(bookId, num) {
  const d = reportFields(bookId, num);
  return d.fields.map(f => {
    const a = f.a ? esc(f.a) : '';
    return `<div class="sec"><h2>${f.label}</h2><p class="q">${esc(f.q)}</p><div class="a${a ? '' : ' empty'}">${a || '（未填写）'}</div></div>`;
  }).join('');
}
function reportDoc(title, inner, filename) {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(title)}</title>
<style>
:root{--gold:#c9a24b;--ink:#2b2b2b;--muted:#8a8578;--line:#e8e2d5;--paper:#fffdf8;--blue:#3b4a7a;}
*{box-sizing:border-box;}
body{font-family:"PingFang SC","Hiragino Sans GB","Microsoft YaHei","Noto Sans CJK SC",sans-serif;color:var(--ink);background:var(--paper);margin:0;padding:0 16px 56px;}
.toolbar{position:sticky;top:0;z-index:20;background:rgba(255,253,248,.96);border-bottom:1px solid var(--line);padding:12px 0;display:flex;gap:10px;flex-wrap:wrap;align-items:center;}
.t-title{font-weight:800;color:#7a5b1e;margin-right:auto;font-size:17px;}
.btn{border:none;border-radius:10px;padding:10px 16px;font-size:17px;font-weight:700;cursor:pointer;}
.btn.gold{background:linear-gradient(135deg,#c9a24b,#b38736);color:#fff;}
.btn.ghost{background:#fff;border:1.5px solid #c9a24b;color:#7a5b1e;}
.report{max-width:720px;margin:0 auto;}
.report-head{text-align:center;padding:36px 0 6px;}
.report-head .logo{font-size:43px;}
.report-head h1{font-size:29px;margin:8px 0 4px;color:#1f2430;}
.report-head .sub{color:var(--muted);font-size:17px;font-weight:600;}
.meta-box{background:#f7f1e2;border:1px solid #ece0c2;border-radius:14px;padding:18px 20px;margin:20px 0;display:flex;flex-wrap:wrap;gap:8px 30px;}
.mi b{display:block;font-size:15px;color:var(--muted);font-weight:600;}
.mi span{font-size:18px;font-weight:700;}
.memory{background:#eef3fb;border-left:5px solid var(--blue);border-radius:10px;padding:14px 18px;font-style:italic;font-family:"Songti SC","STSong",serif;font-size:18px;color:#2c3860;margin:0 0 26px;}
.note-h{font-size:21px;color:#7a5b1e;margin:0 0 16px;}
.chapter{background:#fbf7ee;border:1px solid var(--line);border-radius:14px;padding:18px 20px;margin-bottom:22px;page-break-inside:avoid;}
.ch-title{font-size:20px;color:#2c3860;border-bottom:2px solid var(--line);padding-bottom:8px;margin:0 0 14px;}
.ch-date{font-size:15px;color:var(--muted);font-weight:400;}
.sec{margin-bottom:20px;}
.sec h2{font-size:17px;color:#7a5b1e;margin:0 0 4px;}
.sec .q{font-size:12.5px;color:var(--muted);margin-bottom:6px;line-height:1.6;}
.sec .a{background:#fff;border:1px solid var(--line);border-radius:10px;padding:12px 14px;font-size:18px;line-height:1.8;white-space:pre-wrap;}
.sec .a.empty{color:#c0b9a8;}
.sec .a.correct{color:#2f855a;font-weight:700;background:#eef7f0;border-color:#bfe3cb;}
.foot{text-align:center;color:var(--muted);font-size:15px;margin-top:36px;padding-top:16px;border-top:1px solid var(--line);}
@media print{.toolbar{display:none}body{background:#fff;padding:0}.sec .a{border:none;padding:0}.chapter{box-shadow:none;border:1px solid #ddd}}
</style>
</head>
<body>
<div class="toolbar">
  <span class="t-title">💎 隐藏的珍宝 · 查经报告</span>
  <button class="btn gold" onclick="window.print()">🖨️ 打印 / 存为PDF</button>
  <button class="btn ghost" onclick="dl()">⬇️ 下载HTML</button>
</div>
<div class="report">${inner}
  <div class="foot">由「隐藏的珍宝｜66卷圣经互动学习平台」生成 · 愿查经的收获成为你的属灵珍宝 💎</div>
</div>
<script>
function dl(){
  var h='<!DOCTYPE html>\n'+document.documentElement.outerHTML;
  var b=new Blob([h],{type:'text/html;charset=utf-8'});
  var a=document.createElement('a');a.href=URL.createObjectURL(b);
  a.download=${JSON.stringify(filename)};
  document.body.appendChild(a);a.click();
  setTimeout(function(){URL.revokeObjectURL(a.href);a.remove();},500);
}
<\/script>
</body>
</html>`;
}
function reportQuizSection(bookId, num) {
  const qs = chapterQuiz(bookId, num);
  const best = store.quiz[chKey(bookId, num)] || 0;
  return `<h2 class="note-h">🧠 本章知识问答挑战（最佳成绩 ${best} / ${qs.length}）</h2>` + qs.map((q, i) =>
    `<div class="sec"><h2>${i + 1}. ${esc(q.q)}</h2>` +
    q.options.map(o => `<div class="a${o.correct ? ' correct' : ''}">${o.correct ? '✅ ' : ''}${esc(o.text)}</div>`).join('') +
    `</div>`).join('');
}
function buildChapterReportDoc(bookId, num) {
  const d = reportFields(bookId, num);
  const b = d.b;
  const comp = store.completed[chKey(bookId, num)] || {};
  const date = comp.date || '—';
  const minutes = comp.minutes ? comp.minutes + ' 分钟' : '—';
  const memory = d.lesson ? `<div class="memory">📜 记忆经文：${esc(d.lesson.memoryVerse)}</div>` : '';
  const inner = `
  <div class="report-head">
    <div class="logo">💎</div>
    <h1>查经报告</h1>
    <div class="sub">${b.emoji} ${esc(b.name)} 第${num}章 · ${esc(d.title)}</div>
  </div>
  <div class="meta-box">
    <div class="mi"><b>书卷</b><span>${b.emoji} ${esc(b.name)}</span></div>
    <div class="mi"><b>章节</b><span>第${num}章 · ${esc(d.title)}</span></div>
    <div class="mi"><b>学习日期</b><span>${date}</span></div>
    <div class="mi"><b>学习时间</b><span>${minutes}</span></div>
  </div>
  ${memory}
  <h2 class="note-h">✍️ 我的心得与笔记（题目 / 完成内容）</h2>
  ${reportSections(bookId, num)}
  ${reportQuizSection(bookId, num)}`;
  return reportDoc(b.name + '第' + num + '章 · 查经报告', inner, '隐藏的珍宝-查经报告-' + b.name + '第' + num + '章.html');
}
window.downloadChapterReport = function (bookId, num) {
  store.counters = store.counters || {}; store.counters.reports = (store.counters.reports || 0) + 1; saveStore();
  recordActivity('report', bookId + '.' + num, 10);
  const html = buildChapterReportDoc(bookId, num);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  const b = getBook(bookId);
  a.download = '隐藏的珍宝-读经报告-' + (b ? b.name : bookId) + '第' + num + '章.html';
  document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 900);
  toast('📥 读经报告已导出保存（含题目/完成内容/心得/笔记）');
};
window.openReport = function (bookId, num) {
  store.counters = store.counters || {}; store.counters.reports = (store.counters.reports || 0) + 1; saveStore();
  recordActivity('report', bookId + '.' + num, 10);
  const html = buildChapterReportDoc(bookId, num);
  const url = URL.createObjectURL(new Blob([html], { type: 'text/html;charset=utf-8' }));
  const w = window.open(url, '_blank');
  if (!w) { toast('浏览器拦截了弹窗，请允许弹出窗口，或使用「一键导出保存」'); }
};
window.openFullReport = function () {
  const chapters = [];
  BOOKS.forEach(b => {
    for (let i = 1; i <= b.chapters; i++) {
      if (store.completed[chKey(b.id, i)]) chapters.push({ bookId: b.id, num: i });
    }
  });
  if (!chapters.length) { toast('还没有完成任何章节，先去查经吧 😊'); return; }
  let inner = `
  <div class="report-head">
    <div class="logo">📚</div>
    <h1>我的查经报告 · 全部</h1>
    <div class="sub">共 ${chapters.length} 章 · 隐藏的珍宝 · 66卷圣经互动学习平台</div>
  </div>`;
  chapters.forEach(c => {
    const b = getBook(c.bookId);
    const comp = store.completed[chKey(c.bookId, c.num)] || {};
    const lesson = getLesson(c.bookId, c.num);
    const title = lesson ? lesson.title : chapterTitle(c.bookId, c.num);
    inner += `
    <div class="chapter">
      <h2 class="ch-title">${b.emoji} ${esc(b.name)} 第${c.num}章 · ${esc(title)} <span class="ch-date">${comp.date || ''}</span></h2>
      ${reportSections(c.bookId, c.num)}
      ${reportQuizSection(c.bookId, c.num)}
    </div>`;
  });
  const html = reportDoc('我的查经报告（全部）', inner, '隐藏的珍宝-我的查经报告-全部.html');
  const url = URL.createObjectURL(new Blob([html], { type: 'text/html;charset=utf-8' }));
  const w = window.open(url, '_blank');
  if (!w) { toast('浏览器拦截了弹窗，请允许弹出窗口，或使用「一键导出保存」'); }
};

/* ---------- 章节交互函数（挂到 window） ---------- */
window.pickOpening = function (el, key) {
  document.querySelectorAll(`.option[data-q="opening"]`).forEach(o => o.disabled = true);
  el.classList.add('correct');
  store.notes[key] = store.notes[key] || {};
  store.notes[key].opening = (el.textContent || '').trim();
  saveStore();
  const fb = document.getElementById('fb-opening-' + key);
  if (fb) fb.classList.add('show');
};
window.markRead = function (btn, key) {
  recordActivity('readdone', key, 5);
  btn.textContent = '✓ 已读';
  btn.disabled = true;
  btn.style.opacity = '.6';
  const fb = document.getElementById('fb-read-' + key);
  if (fb) fb.classList.add('show');
};
window.checkQuiz = function (el, key) {
  const q = el.dataset.q;
  const correct = el.dataset.correct === 'true';
  const group = document.querySelectorAll(`.option[data-q="${q}"]`);
  group.forEach(o => o.disabled = true);
  if (correct) {
    el.classList.add('correct');
    const fb = document.getElementById('fb-' + q + '-' + key);
    if (fb) fb.classList.add('show');
    toast('🎉 回答正确！');
  } else {
    el.classList.add('wrong');
    const fb = document.getElementById('fb-' + q + '-wrong-' + key);
    if (fb) fb.classList.add('show');
    toast('🤔 再想一想，答案就在经文里');
  }
};
window.toggleSamples = function (key) {
  const box = document.getElementById('samples-' + key);
  if (box) box.style.display = box.style.display === 'none' ? 'flex' : 'none';
};
window.saveNote = function (key, field, taId) {
  const ta = document.getElementById(taId);
  if (!ta) return;
  store.notes[key] = store.notes[key] || {};
  store.notes[key][field] = ta.value;
  saveStore();
  recordActivity('note', key, 2);
  const saved = document.getElementById('saved-' + field + '-' + key);
  if (saved) {
    saved.classList.add('show');
    setTimeout(() => saved.classList.remove('show'), 1800);
  }
  toast('✍️ 已保存到你的笔记');
};
window.completeChapter = function (key, minutes) {
  const today = todayStr();
  const existing = store.completed[key];
  store.completed[key] = { date: today, minutes: minutes || 10, completedAt: existing ? existing.completedAt : Date.now() };
  saveStore();
  recordActivity('complete', key, 30);
  toast('🎉 本章学习完成！');
  setTimeout(() => location.reload(), 700);
};

/* ---------- 主题地图 ---------- */
function renderThemeGrid(limit) {
  const list = THEMES.slice(0, limit || THEMES.length);
  return '<div class="theme-grid">' + list.map(t =>
    `<a class="theme-tile" href="#/theme/${t.id}">
      <span class="tt-emoji">${t.emoji}</span>
      <b>${t.name}</b>
      <span>${t.books.length} 处相关书卷</span>
    </a>`).join('') + '</div>';
}
function renderThemes(app) {
  app.innerHTML = `
  <div class="container" style="padding-top:40px">
    <div class="section-head" style="margin-bottom:4px"><h1 style="font-size:33px">❤️ 圣经主题地图</h1></div>
    <p style="color:var(--muted);max-width:720px">66卷是纵向学习，主题是横向学习。点进一个主题，看它如何贯穿整本圣经——从创世记到启示录。</p>
    ${renderThemeGrid()}
  </div>`;
}
function renderTheme(app, themeId) {
  const t = getTheme(themeId);
  if (!t) { app.innerHTML = emptyPage('没有找到这个主题'); return; }
  const rows = t.books.map(x => {
    const b = getBook(x.book);
    if (!b) return '';
    return `<a class="theme-book-row" href="#/book/${b.id}" style="background:var(--card);border:1px solid var(--line);margin-bottom:10px;display:flex">
      <span class="tbr-emoji">${b.emoji}</span>
      <b>${b.name}</b>
      <span>${x.note}</span>
      <span class="tbr-arrow">→</span>
    </a>`;
  }).join('');
  app.innerHTML = `
  <div class="container" style="padding-top:20px">
    <div class="theme-hero" style="background:linear-gradient(135deg, ${t.color}, ${shade(t.color, -30)})">
      <h1>${t.emoji} ${t.name}</h1>
      <p class="th-desc">${t.desc}</p>
      <span class="th-verse">${t.verse}</span>
    </div>
    <div class="theme-book-list section">
      <div class="section-head"><h2>贯穿全本圣经</h2><span class="sub">${t.books.length} 处相关书卷</span></div>
      ${rows}
      <div class="card" style="padding:20px;margin-top:18px;font-size:13.5px;color:var(--muted)">
        💡 想系统学习这个主题？回到 <a href="#/books" style="color:var(--gold-deep);font-weight:700">66卷目录</a>，从相关书卷的第1章开始，或去 <a href="#/modes" style="color:var(--gold-deep);font-weight:700">四种查经模式</a> 看看按主题学习。
      </div>
    </div>
  </div>`;
}

/* ---------- 人物地图 ---------- */
function renderPeopleGrid(limit) {
  const list = PEOPLE.slice(0, limit || PEOPLE.length);
  return '<div class="people-grid">' + list.map(p =>
    `<a class="card person-card" href="#/person/${p.id}">
      <span class="pc-avatar" style="background:linear-gradient(135deg, ${p.color}, ${shade(p.color, -30)})">${p.emoji}</span>
      <span><b>${p.name}</b><span>${p.role}</span></span>
      <span class="pc-arrow">→</span>
    </a>`).join('') + '</div>';
}
function renderPeople(app) {
  app.innerHTML = `
  <div class="container" style="padding-top:40px">
    <div class="section-head" style="margin-bottom:4px"><h1 style="font-size:33px">👤 人物地图</h1></div>
    <p style="color:var(--muted);max-width:720px">搜索一个人物，跟着他的人生轨迹查圣经——从蒙召、跌倒到成长，看见神在一个人一生中的工作。</p>
    ${renderPeopleGrid()}
  </div>`;
}
function renderPerson(app, personId) {
  const p = getPerson(personId);
  if (!p) { app.innerHTML = emptyPage('没有找到这个人物'); return; }
  const bookLinks = p.books.map(x => {
    const b = getBook(x.book);
    if (!b) return '';
    return `<a class="chip" href="#/book/${b.id}" style="background:var(--cream);border:1px solid var(--line);color:var(--indigo-deep)">${b.emoji} ${b.name} · ${x.note}</a>`;
  }).join('');
  const journey = p.journey.map((j, i) =>
    `<li class="journey-item">
      <span class="journey-dot">${i + 1}</span>
      <div class="journey-body">
        <span class="jb-ref">${j.ref}</span>
        <b>${j.title}</b>
        <p>${j.note}</p>
      </div>
    </li>`).join('');
  app.innerHTML = `
  <div class="container" style="padding-top:20px">
    <div class="person-hero" style="background:linear-gradient(135deg, ${p.color}, ${shade(p.color, -30)})">
      <span class="ph-avatar">${p.emoji}</span>
      <div>
        <h1>${p.name}</h1>
        <span class="ph-role">${p.role}</span>
        <p>${p.summary}</p>
      </div>
    </div>
    <div class="section">
      <div class="section-head"><h2>📖 相关书卷</h2></div>
      <div style="display:flex;flex-wrap:wrap;gap:8px">${bookLinks}</div>
    </div>
    <div class="section">
      <div class="section-head"><h2>👤 ${p.name}的一生</h2><span class="sub">跟着人生轨迹查圣经</span></div>
      <ul class="journey-list">${journey}</ul>
    </div>
  </div>`;
}

/* ---------- 我的旅程 ---------- */
function renderProgress(app) {
  const done = chaptersDone();
  const pct = done / 1189 * 100;
  const rows = BOOKS.map(b => {
    const p = Math.round(bookProgress(b.id) * 100);
    return `<div class="jm-row">
      <span class="jm-emoji">${b.emoji}</span>
      <a class="jm-name" href="#/book/${b.id}">${b.name}</a>
      <div class="jm-track"><i style="width:${p}%"></i></div>
      <span class="jm-pct">${p}%</span>
    </div>`;
  });
  const otRows = rows.filter((r, i) => BOOKS[i].testament === 'ot').join('');
  const ntRows = rows.filter((r, i) => BOOKS[i].testament === 'nt').join('');
  app.innerHTML = `
  <div class="container" style="padding-top:40px">
    <div class="section-head" style="margin-bottom:4px"><h1 style="font-size:33px">🗺️ 我的圣经旅程</h1></div>
    <p style="color:var(--muted)">一个账号，从创世记1章开始，一直走到启示录22章。进度保存在本机浏览器。</p>
    <div class="stats-grid">
      <div class="card stat-card"><div class="sc-emoji">📚</div><b>${booksCompleted()}</b><span>已完成 / 66卷</span></div>
      <div class="card stat-card"><div class="sc-emoji">📖</div><b>${done}</b><span>已学习 / 1189章</span></div>
      <div class="card stat-card"><div class="sc-emoji">⏱</div><b>${fmtMinutes(totalMinutes())}</b><span>累计学习时间</span></div>
      <div class="card stat-card"><div class="sc-emoji">🔥</div><b>${streakDays()}</b><span>连续学习 / 天</span></div>
      <div class="card stat-card"><div class="sc-emoji">💎</div><b>${store.points || 0}</b><span>我的珍宝值</span></div>
    </div>
    <div class="section">
      <div class="section-head"><h2>💎 今日珍宝</h2><span class="sub">每天一节经文，默想后可生成分享卡</span></div>
      ${renderDailyTreasure()}
    </div>
    <div class="section">
      <div class="section-head"><h2>🏅 我的徽章</h2><span class="sub">坚持查经，解锁属灵珍宝徽章</span></div>
      ${renderBadges()}
    </div>
    <div class="section">
      <div class="section-head"><h2>🗓️ 灵修打卡日历</h2><span class="sub">近 180 天学习记录</span></div>
      <div class="card" style="padding:22px">${renderStudyCalendar()}</div>
    </div>
    <div class="section">
      <div class="section-head"><h2>👣 我的足迹</h2><span class="sub">记录你读过的每一章、做过的每一件事</span></div>
      <div class="card" style="padding:22px">${renderFootprints()}</div>
    </div>
    <div class="journey-map">
      <div class="section-head"><h2>📈 整体进度</h2><span class="sub">${done} / 1189 章 · ${pct.toFixed(1)}%</span></div>
      <div class="card" style="padding:24px">
        <div class="progress-track"><i style="width:${pct.toFixed(2)}%"></i></div>
        <div style="display:flex;gap:14px;margin-top:16px;flex-wrap:wrap">
          <a class="btn gold sm" href="#/start">🟢 从头开始（创世记 → 启示录）</a>
          <a class="btn ghost sm" href="#/books">🔵 选择任意一卷</a>
          <a class="btn ghost sm" href="#/themes">🟠 从主题进入</a>
          <button class="btn gold sm" onclick="openFullReport()">📄 我的查经报告（全部）</button>
        </div>
      </div>
      <div class="jm-section" style="margin-top:34px">
        <h3>旧约 39卷</h3>
        <div class="jm-grid">${otRows}</div>
      </div>
      <div class="jm-section">
        <h3>新约 27卷</h3>
        <div class="jm-grid">${ntRows}</div>
      </div>
    </div>
  </div>`;
}

/* ---------- 四种查经模式 ---------- */
function renderModesGrid() {
  const modes = [
    { emoji: '📖', num: '01', name: '按卷查经', desc: '创世记 → 启示录，一卷一卷系统学习，最适合建立整全根基。', tag: '纵向 · 系统学习', href: '#/books' },
    { emoji: '🔍', num: '02', name: '按主题查经', desc: '信心、爱、祷告、家庭、苦难……专题学习一个主题如何贯穿全本圣经。', tag: '横向 · 专题学习', href: '#/themes' },
    { emoji: '👤', num: '03', name: '按人物查经', desc: '亚伯拉罕、大卫、彼得、保罗……跟着人物人生轨迹查圣经。', tag: '纵向 · 人物学习', href: '#/people' },
    { emoji: '🗺️', num: '04', name: '按历史查经', desc: '创造 → 族长 → 出埃及 → 王国 → 被掳 → 归回 → 耶稣 → 教会 → 新天新地。', tag: '纵向 · 历史观', href: '#/modes' }
  ];
  return '<div class="mode-grid">' + modes.map(m =>
    `<a class="card mode-card" href="${m.href}">
      <span class="mc-num">${m.num}</span>
      <div class="mc-emoji">${m.emoji}</div>
      <h3>${m.name}</h3>
      <p>${m.desc}</p>
      <span class="mc-tag">${m.tag}</span>
    </a>`).join('') + '</div>';
}
function renderModes(app) {
  const timeline = [
    ['🌎 创造', '创世记 1-2'],
    ['👨‍👩‍👧 族长时代', '创世记 12-50'],
    ['🔥 出埃及', '出埃及记'],
    ['🏜️ 旷野', '民数记 / 申命记'],
    ['⚔️ 进迦南', '约书亚记 / 士师记'],
    ['👑 王国时代', '撒母耳记 / 列王纪'],
    ['💔 被掳', '列王纪下 / 耶利米哀歌'],
    ['🏡 归回', '以斯拉记 / 尼希米记'],
    ['⭐ 两约之间', '——'],
    ['✝️ 耶稣降生', '福音书'],
    ['🌍 教会建立', '使徒行传 / 书信'],
    ['🌅 新天新地', '启示录 21-22']
  ];
  const tl = '<div class="card map-card">' + timeline.map((t, i) =>
    `<div style="display:flex;gap:16px;padding:10px 0;align-items:flex-start">
      <span class="map-node" style="background:${i === timeline.length - 1 ? 'var(--gold)' : 'var(--indigo)'};border-color:${i === timeline.length - 1 ? 'var(--gold)' : 'var(--indigo)'};color:#fff">${i + 1}</span>
      <div><b>${t[0]}</b><span style="color:var(--muted);font-size:16px">${t[1]}</span></div>
    </div>`).join('') + '</div>';
  app.innerHTML = `
  <div class="container" style="padding-top:40px">
    <div class="section-head" style="margin-bottom:4px"><h1 style="font-size:33px">🧭 四种查经模式</h1></div>
    <p style="color:var(--muted);max-width:720px">同一个全圣经系统，四种进入方式：按卷（纵向系统）、按主题（横向专题）、按人物（生命轨迹）、按历史（整本圣经时间轴）。</p>
    <div class="section">${renderModesGrid()}</div>
    <div class="section">
      <div class="section-head"><h2>🗺️ 按历史查经 · 圣经时间轴</h2><span class="sub">建立整本圣经历史观</span></div>
      ${tl}
    </div>
  </div>`;
}

/* ---------- 从头开始 ---------- */
function renderStart(app) {
  const first = firstIncompleteChapter();
  const target = first || 'chapter/revelation/22';
  const nextBook = getBook(target.split('/')[1]);
  app.innerHTML = `
  <div class="container" style="padding-top:40px">
    <div class="card" style="padding:40px;text-align:center">
      <div style="font-size:59px">🟢</div>
      <h1 style="font-size:31px;margin:10px 0 6px">从头开始 · 创世记 → 启示录</h1>
      <p style="color:var(--muted);max-width:560px;margin:0 auto">系统学习模式：从创世记1章开始，一卷一卷、一章一章往前走。每一章都是一次完整的互动查经：读经 → 观察 → 思考 → 回答 → 讨论 → 应用 → 祷告。</p>
      <div style="margin-top:24px;display:flex;gap:14px;justify-content:center;flex-wrap:wrap">
        <a class="btn gold" href="#/${target}">${first ? '继续我的旅程 →' : '重新开始（已完成全部 🎉）'}</a>
        <a class="btn ghost" href="#/books">或从任意一卷开始</a>
      </div>
      <div style="margin-top:30px;padding:16px;background:var(--cream);border-radius:12px;font-size:13.5px;color:var(--ink-soft);max-width:620px;margin-left:auto;margin-right:auto">
        📍 当前旅程进度：已完成 ${chaptersDone()} / 1189 章 · ${booksCompleted()} / 66 卷
        ${nextBook ? `<br>下一站：${nextBook.emoji} ${nextBook.name} ${target.split('/')[2]}章 · ${chapterTitle(nextBook.id, parseInt(target.split('/')[2], 10))}` : ''}
      </div>
    </div>
  </div>`;
}

/* ---------- 空状态 ---------- */
function emptyPage(msg) {
  return `<div class="container"><div class="empty"><div class="e-emoji">📭</div><h3>${msg}</h3><p><a href="#/" style="color:var(--gold-deep);font-weight:700">回到首页</a></p></div></div>`;
}

/* ---------- 页脚 ---------- */
function renderFooter() {
  return `
  <footer class="footer">
    <div class="container">
      <div class="verse">「你的话是我脚前的灯，是我路上的光。」—— 诗篇 119:105</div>
      <div>📖 隐藏的珍宝｜66卷圣经互动学习平台 · 第一阶段原型</div>
      <div class="tags">
        <a class="tag-link" href="#/">🏠 首页</a>
        <a class="tag-link" href="#/books">📚 全圣经 · 66卷</a>
        <a class="tag-link" href="#/themes">❤️ 主题地图</a>
        <a class="tag-link" href="#/people">👤 人物地图</a>
        <a class="tag-link" href="#/modes">🧭 四种查经模式</a>
        <a class="tag-link" href="#/progress">🗺️ 我的旅程</a>
        <a class="tag-link" href="./index.html">💎 返回首页</a>
      </div>
      <div style="margin-top:12px;opacity:.8">数据仅供学习参考 · 圣经经文请以纸质/权威译本为准</div>
      <div style="margin-top:14px"><a href="./index.html" style="color:var(--gold-deep);font-weight:700">← 返回隐藏的珍宝首页</a></div>
    </div>
  </footer>`;
}

/* ---------- 手机端汉堡菜单 ---------- */
window.toggleNav = function () {
  const l = document.querySelector('.nav-links');
  if (l) l.classList.toggle('open');
};
if (document.addEventListener) {
  document.addEventListener('click', function (e) {
    const l = document.querySelector('.nav-links');
    if (!l || !l.classList.contains('open')) return;
    if (!e.target.closest('.nav-links') && !e.target.closest('.nav-toggle')) l.classList.remove('open');
    else if (e.target.closest('.nav-links a')) l.classList.remove('open');
  });
}

/* ---------- 创意功能：每日珍宝 / 随机查经 / 徽章 / 日历 / 朗读 / 经文讲解 / 章节问答 ---------- */
function renderDailyTreasure() {
  const v = dailyVerse();
  const d = todayStr();
  return `<div class="card treasure-card">
    <div class="tc-head"><span class="tc-badge">💎 每日珍宝</span><span class="tc-date">${d}</span></div>
    <div class="tc-verse">"${esc(v.text)}"</div>
    <div class="tc-ref">—— ${esc(v.ref)}</div>
    <div class="tc-actions">
      <button class="btn gold sm" onclick="shareVerseCard()">🖼️ 生成经文分享卡</button>
      <button class="btn ghost sm" onclick="randomChapter()">🎲 随机查经</button>
      <button class="btn ghost sm" onclick="speakVerse('daily')">🔊 朗读</button>
    </div>
  </div>`;
}
window.randomChapter = function () {
  const b = BOOKS[Math.floor(Math.random() * BOOKS.length)];
  const n = Math.floor(Math.random() * b.chapters) + 1;
  navigate('chapter/' + b.id + '/' + n);
};
function wrapText(ctx, text, x, y, maxW, lineH) {
  const chars = String(text).split('');
  let line = '', lines = [];
  for (const ch of chars) {
    const test = line + ch;
    if (ctx.measureText(test).width > maxW && line) { lines.push(line); line = ch; }
    else line = test;
  }
  if (line) lines.push(line);
  lines.forEach((ln, i) => ctx.fillText(ln, x, y + i * lineH));
  return lines.length;
}
window.shareVerseCard = function () {
  const v = dailyVerse();
  const c = document.createElement('canvas');
  c.width = 1080; c.height = 1350;
  const ctx = c.getContext('2d');
  const g = ctx.createLinearGradient(0, 0, 0, 1350);
  g.addColorStop(0, '#1a1a2e'); g.addColorStop(0.5, '#16213e'); g.addColorStop(1, '#0f3460');
  ctx.fillStyle = g; ctx.fillRect(0, 0, 1080, 1350);
  ctx.fillStyle = 'rgba(255,215,0,0.07)';
  ctx.beginPath(); ctx.arc(540, 320, 250, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(150, 1150, 180, 0, Math.PI * 2); ctx.fill();
  ctx.textAlign = 'center';
  ctx.fillStyle = '#e8c873'; ctx.font = 'bold 60px "PingFang SC","Heiti SC",sans-serif';
  ctx.fillText('隐藏的珍宝 · 每日珍宝', 540, 170);
  ctx.font = '150px sans-serif';
  ctx.fillText('💎', 540, 400);
  ctx.fillStyle = '#ffffff'; ctx.font = '50px "PingFang SC","Heiti SC",sans-serif';
  const lines = wrapText(ctx, '"' + v.text + '"', 540, 620, 800, 76);
  ctx.fillStyle = 'rgba(232,200,115,0.95)'; ctx.font = '42px "PingFang SC","Heiti SC",sans-serif';
  ctx.fillText('—— ' + v.ref, 540, 690 + lines * 76);
  ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.font = '32px "PingFang SC",sans-serif';
  ctx.fillText('隐藏的珍宝 · 66卷圣经互动学习平台 · ' + todayStr(), 540, 1280);
  const url = c.toDataURL('image/png');
  const a = document.createElement('a');
  a.href = url; a.download = '隐藏的珍宝-每日珍宝-' + todayStr() + '.png';
  document.body.appendChild(a); a.click();
  setTimeout(() => { a.remove(); }, 800);
  toast('🖼️ 经文分享卡已生成，请在「下载」中查看');
};
window.speakVerse = function (key) {
  if (!window.speechSynthesis) { toast('⚠️ 当前浏览器不支持朗读'); return; }
  if (speechSynthesis.speaking) { speechSynthesis.cancel(); toast('⏹ 已停止朗读'); return; }
  let text = '';
  if (key === 'daily') { const v = dailyVerse(); text = v.ref + '。' + v.text; }
  else {
    const parts = String(key).split('.');
    const b = getBook(parts[0]);
    const lesson = getLesson(parts[0], parseInt(parts[1], 10));
    text = lesson && lesson.memoryVerse ? lesson.memoryVerse : ((b ? b.name : '') + ' 第' + parts[1] + '章');
  }
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'zh-CN'; u.rate = 0.95;
  speechSynthesis.speak(u);
};
function chunkText(text, max) {
  const t = String(text);
  const chunks = [];
  let buf = '';
  for (let i = 0; i < t.length; i++) {
    const ch = t[i];
    buf += ch;
    if (buf.length >= max || ('.。！？；'.indexOf(ch) >= 0 && buf.length >= 300)) {
      chunks.push(buf);
      buf = '';
    }
  }
  if (buf) chunks.push(buf);
  return chunks;
}
window.speakChapter = async function (key) {
  if (!window.speechSynthesis) { toast('⚠️ 当前浏览器不支持语音朗读'); return; }
  if (speechSynthesis.speaking) { speechSynthesis.cancel(); toast('⏹ 已停止朗读'); return; }
  let raw = bibleTextRaw[key] || cachedRaw(key);
  if (!raw) {
    toast('⏳ 正在加载经文，稍后自动朗读…');
    await loadChapterText(key);
    raw = bibleTextRaw[key] || cachedRaw(key);
  }
  if (!raw) { toast('⚠️ 经文加载失败，暂时无法朗读'); return; }
  const parts = String(key).split('.');
  const b = getBook(parts[0]);
  const head = (b ? b.name + '，第' + parts[1] + '章。' : '');
  const chunks = chunkText(head + raw, 450);
  let idx = 0;
  const speakNext = () => {
    if (idx >= chunks.length) { toast('🔊 本章朗读完毕'); return; }
    const u = new SpeechSynthesisUtterance(chunks[idx]);
    u.lang = 'zh-CN'; u.rate = 0.9;
    u.onend = () => { idx++; speakNext(); };
    u.onerror = (e) => {
      if (e && (e.error === 'interrupted' || e.error === 'canceled')) return;
      idx++; speakNext();
    };
    speechSynthesis.speak(u);
  };
  speechSynthesis.cancel();
  speakNext();
  toast('🔊 正在朗读本章全文…');
};
function badgeCheck() {
  const c = store.counters || {};
  const booksDone = () => BOOKS.filter(b => bookProgress(b.id) >= 1).length;
  const allOt = BOOKS.filter(b => b.testament === 'ot').every(b => bookProgress(b.id) >= 1);
  const allNt = BOOKS.filter(b => b.testament === 'nt').every(b => bookProgress(b.id) >= 1);
  return [
    { id: 'first', emoji: '🌱', name: '初尝主恩', desc: '完成第1章查经', got: chaptersDone() >= 1 },
    { id: 'seven', emoji: '🔥', name: '七日之旅', desc: '完成7章查经', got: chaptersDone() >= 7 },
    { id: 'book1', emoji: '📖', name: '一卷在手', desc: '完成任意1整卷', got: booksDone() >= 1 },
    { id: 'book5', emoji: '📚', name: '五卷同游', desc: '完成5整卷', got: booksDone() >= 5 },
    { id: 'streak3', emoji: '☕', name: '三天之火', desc: '连续学习3天', got: streakDays() >= 3 },
    { id: 'streak7', emoji: '🌿', name: '一周持守', desc: '连续学习7天', got: streakDays() >= 7 },
    { id: 'streak30', emoji: '🌙', name: '月月精进', desc: '连续学习30天', got: streakDays() >= 30 },
    { id: 'rec', emoji: '🎙️', name: '向神倾心', desc: '录制第一段祷告录音', got: (c.recordings || 0) >= 1 },
    { id: 'report', emoji: '📄', name: '珍宝存档', desc: '生成第一份查经报告', got: (c.reports || 0) >= 1 },
    { id: 'ot', emoji: '⛰️', name: '旧约行者', desc: '完成旧约39卷', got: allOt },
    { id: 'nt', emoji: '✝️', name: '新约行者', desc: '完成新约27卷', got: allNt },
    { id: 'all66', emoji: '👑', name: '集齐珍宝', desc: '完成全部66卷', got: booksDone() >= 66 }
  ];
}
function renderBadges() {
  const list = badgeCheck();
  const got = list.filter(x => x.got).length;
  return `<div class="badge-wrap"><div class="badge-count">🏅 已解锁 ${got} / ${list.length} 枚徽章</div><div class="badge-grid">
    ${list.map(x => `<div class="badge ${x.got ? 'got' : 'lock'}"><div class="bd-emoji">${x.got ? x.emoji : '🔒'}</div><b>${x.name}</b><span>${x.desc}</span></div>`).join('')}
  </div></div>`;
}
function renderStudyCalendar() {
  const days = {};
  Object.values(store.completed).forEach(c => { if (c.date) days[c.date] = (days[c.date] || 0) + 1; });
  const today = new Date();
  const cells = [];
  for (let i = 179; i >= 0; i--) {
    const d = new Date(today); d.setDate(d.getDate() - i);
    const key = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    const cnt = days[key] || 0;
    const cls = cnt === 0 ? '' : (cnt >= 3 ? 'l3' : (cnt >= 2 ? 'l2' : 'l1'));
    cells.push(`<span class="cal-cell ${cls}" title="${key}${cnt ? ' · 学习' + cnt + '次' : ''}"></span>`);
  }
  return `<div class="cal-grid">${cells.join('')}</div><div class="cal-legend"><span class="cal-cell"></span> 无 <span class="cal-cell l1"></span> 1次 <span class="cal-cell l2"></span> 2次 <span class="cal-cell l3"></span> 3次+</div>`;
}
function chapterExplain(bookId, num) {
  const b = getBook(bookId);
  const t = getTestament(b.testament);
  const lesson = getLesson(bookId, num);
  const title = lesson ? lesson.title : chapterTitle(bookId, num);
  const ratio = num / b.chapters;
  const pos = ratio <= 0.34 ? '前三分之一（全书开始部分）' : (ratio <= 0.67 ? '中间三分之一（全书展开部分）' : '后三分之一（全书收尾部分）');
  const catHint = {
    '律法书': '留意神与百姓所立的约、法则与应许，看见圣洁与恩典的平衡。',
    '历史书': '留意神在历史中的作为：顺服带来祝福，悖逆带来管教。',
    '诗歌智慧书': '用心灵去体会：祷告、赞美、哀叹与智慧，都是灵魂真实的声音。',
    '大先知书': '留意审判与盼望并存的宣告，以及指向弥赛亚的预言。',
    '小先知书': '留意神对公义、怜悯与悔改的呼唤，先知的话虽短却有力。',
    '福音书': '观察耶稣的所言所行，思想祂是谁、祂来做什么。',
    '保罗书信': '先明白福音的真理，再活出福音的生活，两者不可分割。',
    '普通书信': '留意在患难与错谬中如何持守信心、彼此相爱、活出真道。',
    '预言书': '留意末后的异象与盼望：基督得胜，新天新地必定来临。'
  }[b.category] || '祷告求圣灵开启，慢慢读，留心观察。';
  const app = lesson ? lesson.application.prompt : '读完本章，求神光照：哪一句话触动你？今天做一件具体的小事回应祂。';
  return { b, t, num, title, pos, catHint, lesson, app };
}
function explainSection(bookId, num) {
  const d = chapterExplain(bookId, num);
  const b = d.b;
  return `
  <div class="card explain-card">
    <div class="ex-head"><span class="ex-badge">📖 本章经文讲解</span><span class="ex-ref">${b.emoji} ${esc(b.name)} 第${num}章 · 共${b.chapters}章</span></div>
    <div class="ex-grid">
      <div class="ex-item"><b>本章主题</b><span>${esc(d.title)}</span></div>
      <div class="ex-item"><b>本书分类</b><span>${d.t.name} · ${b.category}</span></div>
      <div class="ex-item"><b>章节位置</b><span>${d.pos}</span></div>
      <div class="ex-item"><b>作者</b><span>${esc(b.author)}</span></div>
    </div>
    <div class="ex-block"><b>📖 本书简介</b><p>${esc(b.summary)}</p></div>
    <div class="ex-block"><b>🎯 本书核心主题</b><p>${esc(b.theme)}</p></div>
    <div class="ex-block"><b>💡 阅读提示</b><p>${esc(d.catHint)} 阅读时问自己：这一章让我更多认识神什么？又让我看见当如何行？</p></div>
    ${d.lesson && d.lesson.memoryVerse ? `<div class="ex-block gold"><b>📜 本章金句</b><p>${esc(d.lesson.memoryVerse)}</p></div>` : ''}
    ${d.lesson && d.lesson.discovery && d.lesson.discovery.note ? `<div class="ex-block"><b>✨ 讲解要点</b><p>${esc(d.lesson.discovery.note)}</p></div>` : ''}
    <div class="ex-block"><b>🛠️ 生活应用</b><p>${esc(d.app)}</p></div>
  </div>`;
}
function pickDistractors(correct, pool, n) {
  const arr = pool.filter(x => x !== correct);
  const out = [];
  while (out.length < n && arr.length) out.push(arr.splice(Math.floor(Math.random() * arr.length), 1)[0]);
  return out;
}
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function chapterQuiz(bookId, num) {
  const b = getBook(bookId);
  const t = getTestament(b.testament);
  const correctTheme = chapterTitle(bookId, num);
  const themePool = (CHAPTER_THEMES[bookId] && CHAPTER_THEMES[bookId].length > 4)
    ? CHAPTER_THEMES[bookId].slice()
    : Object.values(CHAPTER_THEMES).flat();
  const themeTitles = (CHAPTER_THEMES[bookId] || []).slice();
  const authorPool = BOOKS.map(x => x.author);
  const catPool = TESTAMENTS.flatMap(tt => tt.categories.map(c => tt.name + ' · ' + c));
  const kwPool = BOOKS.map(x => x.theme).join('、').split('、').map(s => s.trim()).filter(Boolean);
  const tagPool = BOOKS.map(x => x.tagline);
  const mk = (correct, distractors, n) => shuffle([{ text: correct, correct: true }].concat(pickDistractors(correct, distractors, n || 3).map(tx => ({ text: tx, correct: false }))));
  const catStr = t.name + ' · ' + b.category;
  const ratio = num / b.chapters;
  const pos = ratio <= 0.34 ? '前三分之一' : (ratio <= 0.67 ? '中间三分之一' : '后三分之一');
  const themeWords = b.theme.split('、').map(s => s.trim()).filter(Boolean);
  const prevTitle = num > 1 ? chapterTitle(bookId, num - 1) : null;
  const nextTitle = num < b.chapters ? chapterTitle(bookId, num + 1) : null;
  const Q = [];
  const add = (q, options) => Q.push({ q, options });
  add(`${b.name} 第${num}章的主题是什么？`, mk(correctTheme, themePool));
  add(`${b.name} 第${num}章最适合的标题是？`, mk(correctTheme, themePool));
  add(`《${b.name}》的作者是谁？`, mk(b.author, authorPool));
  add(`这卷书（${b.name}）通常被认为是由谁写作的？`, mk(b.author, authorPool));
  add(`《${b.name}》属于圣经的哪一部分？`, mk(catStr, catPool));
  add(`《${b.name}》属于哪一类别？`, mk(b.category, TESTAMENTS.flatMap(tt => tt.categories), 3));
  add(`《${b.name}》属于旧约还是新约？`, mk(t.name, ['旧约', '新约'], 1));
  add(`《${b.name}》一共有多少章？`, mk(b.chapters + '章', [Math.max(1, b.chapters - 6) + '章', (b.chapters + 6) + '章', Math.max(1, b.chapters - 13) + '章'], 3));
  add(`第${num}章位于《${b.name}》（共${b.chapters}章）的哪个位置？`, mk(pos, ['前三分之一', '中间三分之一', '后三分之一'], 2));
  add(`按阅读进度看，第${num}章大约在《${b.name}》的什么位置？`, mk(pos, ['前三分之一', '中间三分之一', '后三分之一'], 2));
  add(`《${b.name}》的主题词／别称是？`, mk(b.tagline, tagPool));
  add(`哪一项属于《${b.name}》的核心主题？`, mk(themeWords[0] || b.tagline, kwPool));
  add(`以下哪个关键词与《${b.name}》的核心主题最相关？`, mk(themeWords[Math.min(1, themeWords.length - 1)] || b.tagline, kwPool));
  if (prevTitle) add(`《${b.name}》第${num - 1}章的主题是什么？`, mk(prevTitle, themeTitles.length > 4 ? themeTitles : themePool));
  if (nextTitle) add(`《${b.name}》第${num + 1}章的主题是什么？`, mk(nextTitle, themeTitles.length > 4 ? themeTitles : themePool));
  let guard = 0;
  while (Q.length < 15 && guard++ < 20) add(`《${b.name}》第${num}章的经文主题是？`, mk(correctTheme, themePool));
  return Q.slice(0, 15);
}
const quizRun = {};
function quizSection(qKey) {
  return `
  <!-- ⑨ 本章知识问答挑战 -->
  <section class="step" data-step="9">
    <div class="step-head"><span class="step-badge">⑨</span><div class="step-title"><h3>本章知识问答挑战</h3><p>15 道小题，检验你对本章和本书的了解；可随时换一批新题</p></div></div>
    <div class="step-body">
      <div id="quiz-wrap-${qKey}">
        <div style="text-align:center;padding:8px 0;display:flex;gap:10px;justify-content:center;flex-wrap:wrap">
          <button class="btn gold" onclick="startChapterQuiz('${qKey}')">🧠 开始挑战</button>
          <button class="btn ghost" onclick="startChapterQuiz('${qKey}')">🔀 换一批挑战</button>
        </div>
      </div>
    </div>
  </section>`;
}
window.startChapterQuiz = function (key) {
  const wrap = document.getElementById('quiz-wrap-' + key);
  if (!wrap) return;
  const parts = key.split('.');
  const qs = chapterQuiz(parts[0], parseInt(parts[1], 10));
  quizRun[key] = 0;
  const best = store.quiz[key] || 0;
  let html = `<div class="quiz-best">🏆 历史最佳：${best} / ${qs.length}</div>
  <div class="quiz-tip">请为每道题选择一个答案，然后点「提交答卷」查看评分</div>`;
  qs.forEach((q, qi) => {
    html += `<div class="quiz-q" data-qn="${qi}">
      <div class="step-question">${qi + 1}. ${esc(q.q)}</div>
      <div class="options">` +
      q.options.map((o, oi) => `<button class="option" data-quiz="${key}" data-qn="${qi}" data-correct="${o.correct}" onclick="quizSelect(this,'${key}')"><span class="o-key">${'ABCD'[oi]}</span>${esc(o.text)}</button>`).join('') +
      `</div></div>`;
  });
  html += `<div class="quiz-submit"><button class="btn gold" onclick="submitQuiz('${key}')">📤 提交答卷</button></div>`;
  wrap.innerHTML = html;
};
window.quizSelect = function (el, key) {
  const qn = el.dataset.qn;
  const group = document.querySelectorAll(`.option[data-quiz="${key}"][data-qn="${qn}"]`);
  group.forEach(o => { o.classList.remove('selected'); o.disabled = false; });
  el.classList.add('selected');
};
window.submitQuiz = function (key) {
  const wrap = document.getElementById('quiz-wrap-' + key);
  if (!wrap) return;
  const qs = wrap.querySelectorAll('.quiz-q');
  let score = 0, wrong = 0, unanswered = 0;
  const total = qs.length;
  qs.forEach(q => {
    const group = q.querySelectorAll('.option[data-quiz="' + key + '"]');
    group.forEach(o => o.disabled = true);
    const sel = q.querySelector('.option.selected');
    if (sel) {
      if (sel.dataset.correct === 'true') { sel.classList.add('correct'); score++; }
      else {
        sel.classList.add('wrong'); wrong++;
        const c = q.querySelector('.option[data-correct="true"]'); if (c) c.classList.add('correct');
      }
    } else {
      unanswered++;
      const c = q.querySelector('.option[data-correct="true"]'); if (c) c.classList.add('correct');
    }
  });
  if (score > (store.quiz[key] || 0)) { store.quiz[key] = score; saveStore(); }
  recordActivity('quiz', key, score * 2);
  const msg = score === total ? '🌟 满分！你对本章了如指掌！' : (score >= Math.ceil(total * 0.6) ? '👍 不错，继续加油！' : '💪 再挑战一次，会更好！');
  const result = `<div class="quiz-result">
    <div class="qr-emoji">${score === total ? '🌟' : (score >= Math.ceil(total * 0.6) ? '👍' : '💪')}</div>
    <b>评分：${score} / ${total}</b>
    <p>✅ 答对 ${score} 题 · ❌ 答错 ${wrong} 题${unanswered ? ' · ⭕ 未答 ' + unanswered + ' 题' : ''}</p>
    <p>${msg}</p>
    <div class="qr-btns">
      <button class="btn gold sm" onclick="startChapterQuiz('${key}')">🔀 再挑战一次（换一批）</button>
    </div>
  </div>`;
  const submitBtn = wrap.querySelector('.quiz-submit');
  if (submitBtn) submitBtn.outerHTML = result;
  wrap.scrollIntoView({ behavior: 'smooth', block: 'start' });
  toast('📤 已提交，得分 ' + score + '/' + total);
};

/* ---------- 阅读经文（在线和合本简体） ---------- */
const BIBLE_TEXT_CACHE = 'yiqi-bibletext-cache-v1';
const BIBLE_TEXT_RAW = 'yiqi-bibletext-raw-v1';
const bibleTextRaw = {};
function cachedChapter(key) {
  try { const c = JSON.parse(localStorage.getItem(BIBLE_TEXT_CACHE) || '{}'); return c[key] ? c[key].t : null; } catch (e) { return null; }
}
function cacheChapter(key, html) {
  try {
    const c = JSON.parse(localStorage.getItem(BIBLE_TEXT_CACHE) || '{}');
    c[key] = { t: html, ts: Date.now() };
    const ks = Object.keys(c);
    if (ks.length > 25) { ks.sort((x, y) => c[x].ts - c[y].ts); delete c[ks[0]]; }
    localStorage.setItem(BIBLE_TEXT_CACHE, JSON.stringify(c));
  } catch (e) {}
}
function cachedRaw(key) {
  try { const c = JSON.parse(localStorage.getItem(BIBLE_TEXT_RAW) || '{}'); return c[key] || null; } catch (e) { return null; }
}
function cacheRaw(key, text) {
  try {
    const c = JSON.parse(localStorage.getItem(BIBLE_TEXT_RAW) || '{}');
    c[key] = text;
    const ks = Object.keys(c);
    if (ks.length > 25) delete c[ks[0]];
    localStorage.setItem(BIBLE_TEXT_RAW, JSON.stringify(c));
  } catch (e) {}
}
async function loadChapterText(key) {
  const box = document.getElementById('bible-text-' + key);
  if (!box) return;
  const parts = String(key).split('.');
  const bookId = parts[0], num = parseInt(parts[1], 10);
  const cached = cachedChapter(key);
  if (cached) { box.innerHTML = cached; return; }
  box.innerHTML = '<div class="bt-loading">📖 正在加载本章经文…</div>';
  try {
    const bookNr = BOOKS.findIndex(x => x.id === bookId) + 1;
    const res = await fetch('https://api.getbible.net/v2/cus/' + bookNr + '/' + num + '.json');
    if (!res.ok) throw new Error('bad status ' + res.status);
    const data = await res.json();
    const clean = (s) => String(s || '').replace(/\ufeff/g, '').replace(/\u3000/g, ' ').trim();
    const refBook = (getBook(bookId) || {}).name || clean(data.name);
    const html = '<div class="bt-ref">📖 ' + esc(refBook + ' 第' + num + '章') + '（和合本·简体）</div>' +
      data.verses.map(v => '<p><sup>' + v.verse + '</sup>' + esc(clean(v.text)) + '</p>').join('');
    const rawText = data.verses.map(v => clean(v.text).replace(/[。！？；]+$/, '')).join('。') + '。';
    bibleTextRaw[key] = rawText;
    box.innerHTML = html;
    cacheChapter(key, html);
    cacheRaw(key, rawText);
  } catch (e) {
    const b = getBook(bookId);
    const link = 'https://www.biblegateway.com/passage/?search=' + encodeURIComponent((b ? b.en : bookId) + ' ' + num) + '&version=CUVS';
    box.innerHTML = '<div class="bt-error">⚠️ 经文加载失败（可能网络问题）。<br>' +
      '<button class="btn ghost sm" onclick="loadChapterText(\'' + key + '\')">🔄 重试</button> ' +
      '<a class="btn ghost sm" target="_blank" rel="noopener" href="' + link + '">🔗 在线阅读</a></div>';
  }
}

function renderFootprints() {
  const list = store.footprints || [];
  if (!list.length) return '<div style="color:var(--muted);text-align:center;padding:24px 0">👣 还没有足迹，去读一章吧！</div>';
  const emoji = { read: '📖', readdone: '✅', complete: '🎉', note: '✍️', record: '🎙️', report: '📄', quiz: '🧠' };
  const label = { read: '阅读本章', readdone: '读完本章', complete: '完成本章', note: '写下笔记', record: '祷告录音', report: '生成报告', quiz: '答题挑战' };
  const rows = list.slice(0, 30).map(f => {
    const parts = f.k.split('.');
    const num = parseInt(parts[1], 10);
    const b = getBook(parts[0]);
    const lesson = getLesson(parts[0], num);
    const title = lesson ? lesson.title : chapterTitle(parts[0], num);
    return `<div class="foot-row"><span class="foot-emoji">${emoji[f.t] || '📌'}</span>
      <div class="foot-info"><b>${label[f.t] || f.t} · ${b ? esc(b.name) + ' 第' + num + '章' : esc(f.k)}</b><span>${esc(title)}</span></div>
      <span class="foot-date">${f.d} ${f.tm || ''}</span></div>`;
  }).join('');
  return `<div class="foot-list">${rows}</div><div class="foot-count">共 ${list.length} 条足迹 · 记录自动保存在本机</div>`;
}

/* ---------- 背景轻音乐 ---------- *//* ---------- 背景轻音乐 ---------- */
window.toggleBgMusic = function () {
  const a = document.getElementById('bgMusic');
  const btn = document.getElementById('bgMusicBtn');
  if (!a) return;
  if (a.paused) {
    a.volume = 0.45;
    a.play().then(() => {
      try { localStorage.setItem('yiqi-music', 'on'); } catch (e) {}
      if (btn) btn.classList.add('on');
      toast('🎵 轻音乐已开启');
    }).catch(() => { toast('⚠️ 无法播放音乐，请检查音频文件'); });
  } else {
    a.pause();
    try { localStorage.setItem('yiqi-music', 'off'); } catch (e) {}
    if (btn) btn.classList.remove('on');
    toast('🎵 轻音乐已暂停');
  }
};
function initBgMusic() {
  const a = document.getElementById('bgMusic');
  const btn = document.getElementById('bgMusicBtn');
  if (!a || !btn) return;
  let want = true;
  try { const v = localStorage.getItem('yiqi-music'); want = v ? v === 'on' : true; } catch (e) {}
  if (!want) return;
  a.volume = 0.45;
  const tryPlay = () => {
    const p = a.play();
    if (p && p.catch) p.catch(() => {});
    btn.classList.add('on');
    try { localStorage.setItem('yiqi-music', 'on'); } catch (e) {}
  };
  tryPlay();
  const unlock = (ev) => {
    tryPlay();
    document.removeEventListener(ev.type, unlock);
    ['pointerdown', 'touchstart', 'keydown'].forEach(t => document.removeEventListener(t, unlock));
  };
  ['pointerdown', 'touchstart', 'keydown'].forEach(t => document.addEventListener(t, unlock));
}

/* ---------- 启动 ---------- */
function init() {
  document.getElementById('app').innerHTML = '';
  window.addEventListener('hashchange', render);
  render();
  const footer = document.getElementById('site-footer');
  if (footer) footer.innerHTML = renderFooter();
  initBgMusic();
}
document.addEventListener('DOMContentLoaded', init);

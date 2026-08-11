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
  const navMap = { home: 'nav-home', books: 'nav-books', themes: 'nav-themes', people: 'nav-people', progress: 'nav-progress', modes: 'nav-modes', kids: 'nav-kids', games: 'nav-games' };
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
    case 'kids': return renderKids(app);
    case 'games': return renderGames(app);
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
        <h2>🎮 趣味学习</h2>
        <span class="sub">儿童乐园 · 金句拼拼 · 快问快答，边玩边学</span>
        <a class="more" href="#/games">进入趣味乐园 →</a>
      </div>
      ${renderFunGrid()}
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

    ${readingSection(b, num, chKey(b.id, num), lesson)}

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
    <div class="step-head"><span class="step-badge gold-badge">⑦</span><div class="step-title"><h3>我的祷告录音</h3><p>把今天的祷告录下来，可以回放，也可以导出保存到手机或电脑</p></div></div>
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

  <!-- ③ 经文观察 -->
  <section class="step" data-step="3">
    <div class="step-head"><span class="step-badge">②</span><div class="step-title"><h3>经文观察</h3><p>系统不直接解释，先问「经文说了什么」</p></div></div>
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
    <div class="step-head"><span class="step-badge gold-badge">③</span><div class="step-title"><h3>发现圣经</h3><p>这一步没有唯一答案，可能全选哦</p></div></div>
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
    <div class="step-head"><span class="step-badge">④</span><div class="step-title"><h3>一起讨论</h3><p>写下你的回答，或看看其他学友的想法</p></div></div>
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
    <div class="step-head"><span class="step-badge gold-badge">⑤</span><div class="step-title"><h3>今天应用</h3><p>把圣经从「读完」变成「活出来」</p></div></div>
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
    <div class="step-head"><span class="step-badge">⑥</span><div class="step-title"><h3>今日祷告</h3><p>系统根据今天的主题生成了祷告引导</p></div></div>
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
    <div class="step-head"><span class="step-badge">②</span><div class="step-title"><h3>经文观察</h3><p>问三个问题：谁、发生了什么、结果如何</p></div></div>
    <div class="step-body">
      <div class="step-question">试着回答：「这一章主要讲了什么？有什么关键词或重复出现的词？」</div>
      <div class="write-box">
        <textarea id="ta-obs-${qKey}" placeholder="✍️ 写下你的观察……"></textarea>
        <div class="wb-actions"><button class="btn sm" onclick="saveNote('${qKey}','observation','ta-obs-${qKey}')">保存</button><span class="wb-saved" id="saved-observation-${qKey}">✓ 已保存</span></div>
      </div>
    </div>
  </section>
  <section class="step">
    <div class="step-head"><span class="step-badge gold-badge">③</span><div class="step-title"><h3>发现圣经</h3><p>这段经文让我更多认识神和祂的旨意吗？</p></div></div>
    <div class="step-body">
      <div class="step-question">从这一章里，你发现关于神（祂的属性、祂的作为）或关于人（我们的本相、当行的路）的什么真理？</div>
      <div class="write-box">
        <textarea id="ta-disc-${qKey}" placeholder="✍️ 写下你的发现……"></textarea>
        <div class="wb-actions"><button class="btn sm" onclick="saveNote('${qKey}','discovery','ta-disc-${qKey}')">保存</button><span class="wb-saved" id="saved-discovery-${qKey}">✓ 已保存</span></div>
      </div>
    </div>
  </section>
  <section class="step">
    <div class="step-head"><span class="step-badge">④</span><div class="step-title"><h3>一起讨论</h3><p>把经文和我的生活连起来</p></div></div>
    <div class="step-body">
      <div class="step-question">这一章里，最触动你的一句话是什么？它和你现在的处境有什么关系？</div>
      <div class="write-box">
        <textarea id="ta-talk-${qKey}" placeholder="✍️ 写下你的回答……">${esc(savedDiscussion)}</textarea>
        <div class="wb-actions"><button class="btn sm" onclick="saveNote('${qKey}','discussion','ta-talk-${qKey}')">保存我的回答</button><span class="wb-saved" id="saved-discussion-${qKey}">✓ 已保存</span></div>
      </div>
    </div>
  </section>
  <section class="step">
    <div class="step-head"><span class="step-badge gold-badge">⑤</span><div class="step-title"><h3>今天应用</h3><p>把圣经从「读完」变成「活出来」</p></div></div>
    <div class="step-body">
      <div class="step-question">基于这一章，今天你可以做一个什么具体的行动？（哪怕很小）</div>
      <div class="write-box">
        <textarea id="ta-app-${qKey}" placeholder="✍️ 例如：对一个人说一句感谢、饶恕一个人、为一个人祷告……">${esc(savedApp)}</textarea>
        <div class="wb-actions"><button class="btn sm" onclick="saveNote('${qKey}','application','ta-app-${qKey}')">保存我的应用</button><span class="wb-saved" id="saved-application-${qKey}">✓ 已保存</span></div>
      </div>
    </div>
  </section>
  <section class="step">
    <div class="step-head"><span class="step-badge">⑥</span><div class="step-title"><h3>今日祷告</h3><p>用祷告回应今天所学</p></div></div>
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
.ch-open{font-size:15px;color:#7a5b1e;font-weight:700;margin-left:10px;text-decoration:none;border:1px solid #c9a24b;border-radius:8px;padding:2px 8px;}
.ch-open:hover{background:#fdf8ec;}
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
      <h2 class="ch-title">${b.emoji} ${esc(b.name)} 第${c.num}章 · ${esc(title)} <span class="ch-date">${comp.date || ''}</span>
        <a class="ch-open" href="platform.html#/chapter/${c.bookId}/${c.num}" target="_blank">📖 打开本章</a></h2>
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

/* ============================================================
 * 🧒 儿童乐园（儿童学习版块）+ 🎮 趣味乐园（金句拼拼/快问快答）
 * ============================================================ */
const KIDS_STICKERS_KEY = 'yiqi-kids-stickers-v1';
const KIDS_PROGRESS_KEY = 'yiqi-kids-progress-v1';
function kidsStickers() {
  try { const v = JSON.parse(localStorage.getItem(KIDS_STICKERS_KEY)); return Array.isArray(v) ? v : []; } catch (e) { return []; }
}
function saveKidsStickers(list) { try { localStorage.setItem(KIDS_STICKERS_KEY, JSON.stringify(list)); } catch (e) {} }
function kidsProgress() {
  try { const v = JSON.parse(localStorage.getItem(KIDS_PROGRESS_KEY)); return v && typeof v === 'object' ? v : {}; } catch (e) { return {}; }
}
function saveKidsProgress(p) { try { localStorage.setItem(KIDS_PROGRESS_KEY, JSON.stringify(p)); } catch (e) {} }
function addKidsSticker(emoji, label) {
  const list = kidsStickers();
  if (list.includes(emoji)) { toast('✨ 已经拥有这枚贴纸啦'); return false; }
  list.push(emoji);
  saveKidsStickers(list);
  toast('🎉 获得新贴纸 ' + emoji + '（' + label + '）');
  return true;
}
function shuffleArr(a) {
  const r = a.slice();
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const t = r[i]; r[i] = r[j]; r[j] = t;
  }
  return r;
}

let kidsTab = 'stories';
function renderKids(app) {
  kidsTab = 'stories';
  app.innerHTML = `
  <div class="container" style="padding-top:40px">
    <div class="kids-hero">
      <div class="kh-emoji">🧒</div>
      <h1>儿童乐园 · 小小寻宝家</h1>
      <p>圣经故事、金句游戏、智慧问答、闪闪贴纸——和爸爸妈妈一起，在圣经里寻找隐藏的珍宝吧！</p>
      <div class="kh-stats">
        <span>📖 ${KIDS_STORIES.length} 个故事</span>
        <span>🧩 ${KIDS_VERSE_FILL.length} 句金句</span>
        <span>🎯 ${KIDS_QUIZ.length} 道问答</span>
        <span>⭐ ${kidsStickers().length} 枚贴纸</span>
      </div>
    </div>
    <div class="kids-tabs">
      <button class="kids-tab ${kidsTab === 'stories' ? 'on' : ''}" onclick="kidsGo('stories')">📖 故事乐园</button>
      <button class="kids-tab ${kidsTab === 'fill' ? 'on' : ''}" onclick="kidsGo('fill')">🧩 金句拼拼</button>
      <button class="kids-tab ${kidsTab === 'quiz' ? 'on' : ''}" onclick="kidsGo('quiz')">🎯 智慧问答</button>
      <button class="kids-tab ${kidsTab === 'stickers' ? 'on' : ''}" onclick="kidsGo('stickers')">⭐ 我的贴纸</button>
    </div>
    <div id="kids-body"></div>
  </div>`;
  renderKidsBody();
}
window.kidsGo = function (t) { if (t === 'fill') kidsFillIdx = 0; kidsTab = t; renderKidsBody(); window.scrollTo({ top: 0, behavior: 'smooth' }); };
function renderKidsBody() {
  const el = document.getElementById('kids-body');
  if (!el) return;
  if (kidsTab === 'stories') el.innerHTML = kidsStoriesBody();
  else if (kidsTab === 'fill') { el.innerHTML = kidsFillBody(); }
  else if (kidsTab === 'quiz') el.innerHTML = kidsQuizBody();
  else el.innerHTML = kidsStickersBody();
}

/* ---- 故事乐园 ---- */
function kidsStoriesBody() {
  const p = kidsProgress();
  const done = p.stories || {};
  const cards = KIDS_STORIES.map(s => {
    const isDone = !!done[s.id];
    return `<div class="kids-card story-card">
      <div class="sc-emoji">${s.emoji}</div>
      <div class="sc-head">
        <h3>${s.title}</h3>
        <span class="sc-ref">${s.ref} · ${s.tag}</span>
      </div>
      <p class="sc-text">${esc(s.text)}</p>
      <div class="sc-verse">💎 ${esc(s.verse)}</div>
      <div class="sc-btns">
        <button class="btn gold sm" onclick="speakKidsStory('${s.id}')">🔊 读给我听</button>
        ${isDone
          ? '<span class="sc-done">✅ 已完成 · 贴纸 ' + s.sticker + '</span>'
          : '<button class="btn ok sm" onclick="completeKidsStory(\'' + s.id + '\')">✅ 读完啦，领贴纸</button>'}
      </div>
    </div>`;
  }).join('');
  return `<div class="kids-grid">${cards}</div>`;
}
window.speakKidsStory = function (id) {
  if (ttsActive()) { ttsStop(); toast('⏹ 已停止朗读'); return; }
  const s = KIDS_STORIES.find(x => x.id === id);
  if (!s) return;
  ttsSpeak('《' + s.title + '》。' + s.text + '。经文：' + s.verse.replace(/[「」]/g, ''), '🔊 朗读完毕', 0.92);
};
window.completeKidsStory = function (id) {
  const s = KIDS_STORIES.find(x => x.id === id);
  if (!s) return;
  const p = kidsProgress();
  p.stories = p.stories || {};
  if (p.stories[id]) { toast('✅ 这个故事你已经完成啦'); return; }
  p.stories[id] = 1;
  saveKidsProgress(p);
  addKidsSticker(s.sticker, '「' + s.title + '」');
  recordActivity('kids', 'story.' + id, 5);
  renderKidsBody();
};

/* ---- 金句拼拼（儿童版：选词填空） ---- */
let kidsFillIdx = 0;
function kidsFillBody() {
  const item = KIDS_VERSE_FILL[kidsFillIdx];
  if (!item) {
    return `<div class="game-done">
      <div class="gd-emoji">🎉</div>
      <h3>太棒了！金句拼拼全部完成！</h3>
      <p>你记住了 ${KIDS_VERSE_FILL.length} 句圣经金句，好厉害呀！</p>
      <button class="btn gold" onclick="kidsGo('fill')">🔁 再玩一次</button>
    </div>`;
  }
  const shown = item.text.replace('____', '<span class="fill-blank" id="fillBlank">＿＿＿</span>');
  return `<div class="game-box fill-game">
    <div class="game-top"><span>🧩 金句拼拼</span><span>第 ${kidsFillIdx + 1} / ${KIDS_VERSE_FILL.length} 句</span></div>
    <div class="fill-ref">${item.ref}</div>
    <div class="fill-sentence">${shown}</div>
    <div class="options fill-options" id="fillOptions">
      ${item.options.map((o, oi) => `<button class="option" id="fillOpt${oi}" onclick="kidsFillPick(${oi})">${esc(o)}</button>`).join('')}
    </div>
    <div id="fillFeedback"></div>
    <div class="game-actions" id="fillNext" style="display:none">
      <button class="btn gold" onclick="kidsFillNext()">${kidsFillIdx + 1 === KIDS_VERSE_FILL.length ? '🎉 完成挑战' : '➡️ 下一句'}</button>
    </div>
  </div>`;
}
window.kidsFillPick = function (oi) {
  const item = KIDS_VERSE_FILL[kidsFillIdx];
  if (!item) return;
  const opts = item.options.map((_, i) => document.getElementById('fillOpt' + i)).filter(Boolean);
  const fb = document.getElementById('fillFeedback');
  const next = document.getElementById('fillNext');
  opts.forEach(o => { o.disabled = true; });
  if (oi === item.answer) {
    const blank = document.getElementById('fillBlank');
    if (blank) blank.innerHTML = '<span class="fill-correct">' + esc(item.options[oi]) + '</span>';
    opts[oi].classList.add('correct');
    if (fb) fb.innerHTML = '<div class="fill-ok">🎉 答对啦！「' + esc(item.options[oi]) + '」填得真棒！</div>';
    if (next) next.style.display = 'flex';
  } else {
    opts[oi].classList.add('wrong');
    if (fb) fb.innerHTML = '<div class="fill-bad">😅 再想一想，看看上面那句话哦～</div>';
    opts.forEach(o => { o.disabled = false; });
  }
};
window.kidsFillNext = function () {
  if (kidsFillIdx + 1 === KIDS_VERSE_FILL.length) {
    const first = addKidsSticker('🧩', '金句拼拼');
    recordActivity('kids', 'fill.all', 8);
    kidsFillIdx++;
    renderKidsBody();
    if (first) toast('🎉 获得贴纸 🧩');
  } else {
    kidsFillIdx++;
    renderKidsBody();
  }
};

/* ---- 智慧问答（儿童版） ---- */
let kidsQuizState = { score: 0, answered: {} };
function kidsQuizBody() {
  if (Object.keys(kidsQuizState.answered).length === KIDS_QUIZ.length) {
    const sc = kidsQuizState.score;
    const msg = sc === KIDS_QUIZ.length ? '🌟 满分！你是小小圣经博士！' : (sc >= 7 ? '👍 真棒！继续加油！' : '💪 再答一次，一定更棒！');
    return `<div class="game-done">
      <div class="gd-emoji">${sc === KIDS_QUIZ.length ? '🌟' : (sc >= 7 ? '👍' : '💪')}</div>
      <h3>智慧问答完成！</h3>
      <p>得分：<b style="color:var(--gold-deep);font-size:26px">${sc} / ${KIDS_QUIZ.length}</b></p>
      <p>${msg}</p>
      <button class="btn gold" onclick="kidsGo('quiz')">🔁 再来一轮</button>
    </div>`;
  }
  const qs = KIDS_QUIZ.map((q, qi) => {
    const ans = kidsQuizState.answered[qi];
    let optionsHtml = q.options.map((o, oi) => {
      let cls = 'option';
      if (ans !== undefined) {
        if (oi === q.answer) cls += ' correct';
        else if (oi === ans) cls += ' wrong';
      }
      const disabled = ans !== undefined ? 'disabled' : '';
      return `<button class="${cls}" ${disabled} onclick="kidsQuizPick(${qi}, ${oi})"><span class="o-key">${'ABC'[oi]}</span>${esc(o)}</button>`;
    }).join('');
    const tip = ans !== undefined ? `<div class="quiz-tip-line">💡 ${esc(q.tip)}</div>` : '';
    return `<div class="quiz-q kids-q"><div class="step-question">${qi + 1}. ${esc(q.q)}</div><div class="options">${optionsHtml}</div>${tip}</div>`;
  }).join('');
  return `<div class="game-box"><div class="game-top"><span>🎯 智慧问答</span><span>答对 ${kidsQuizState.score} 题</span></div>
    <div class="quiz-tip">每题选一个答案，答完自动显示对错和提示哦～</div>
    ${qs}</div>`;
}
window.kidsQuizPick = function (qi, oi) {
  if (kidsQuizState.answered[qi] !== undefined) return;
  kidsQuizState.answered[qi] = oi;
  if (oi === KIDS_QUIZ[qi].answer) kidsQuizState.score++;
  renderKidsBody();
  const all = Object.keys(kidsQuizState.answered).length === KIDS_QUIZ.length;
  if (all) {
    if (kidsQuizState.score >= 7) { addKidsSticker('⭐', '智慧问答'); recordActivity('kids', 'quiz.all', 8); }
    else recordActivity('kids', 'quiz.retry', 2);
    setTimeout(() => { const el = document.querySelector('.game-done'); if (el) el.scrollIntoView({ behavior: 'smooth' }); }, 60);
  }
};

/* ---- 我的贴纸 ---- */
function kidsStickersBody() {
  const list = kidsStickers();
  const p = kidsProgress();
  const storyCount = Object.keys(p.stories || {}).length;
  const prayers = KIDS_PRAYERS.map(pr =>
    `<div class="prayer-card">
      <div class="pr-emoji">${pr.emoji}</div>
      <h3>${pr.title}</h3>
      <p>${esc(pr.text)}</p>
      <button class="btn gold sm" onclick="speakKidsPrayer('${esc(pr.title)}')">🔊 陪我一起祷告</button>
    </div>`).join('');
  return `
  <div class="sticker-panel">
    <div class="sticker-head">
      <h3>⭐ 我的贴纸墙</h3>
      <span>已收集 ${list.length} 枚</span>
    </div>
    <div class="sticker-wall">
      ${list.length ? list.map(s => `<span class="sticker-chip" title="${esc(s)}">${s}</span>`).join('') : '<div class="sticker-empty">还没有贴纸～去读一个故事、拼一句金句吧！</div>'}
    </div>
    <p class="sticker-help">💡 ${KIDS_STICKER_HELP}</p>
    <div style="margin-top:10px"><button class="btn ghost sm" onclick="resetKidsStickers()">🧹 清空贴纸</button></div>
  </div>
  <div class="section" style="margin-top:36px">
    <div class="section-head"><h2>🙏 亲子祷告</h2><span class="sub">和爸爸妈妈一起祷告</span></div>
    <div class="kids-grid">${prayers}</div>
  </div>
  <div class="section" style="margin-top:36px">
    <div class="section-head"><h2>📈 我的小小成就</h2></div>
    <div class="kids-stats-row">
      <div class="kids-stat"><b>${storyCount}</b><span>读完的故事</span></div>
      <div class="kids-stat"><b>${list.length}</b><span>收集的贴纸</span></div>
      <div class="kids-stat"><b>${KIDS_VERSE_FILL.length}</b><span>可背的金句</span></div>
      <div class="kids-stat"><b>${KIDS_QUIZ.length}</b><span>智慧问答</span></div>
    </div>
  </div>`;
}
window.speakKidsPrayer = function (title) {
  if (ttsActive()) { ttsStop(); toast('⏹ 已停止朗读'); return; }
  const pr = KIDS_PRAYERS.find(x => x.title === title);
  if (!pr) return;
  ttsSpeak(pr.title + '。' + pr.text, '🔊 朗读完毕', 0.9);
};
window.resetKidsStickers = function () {
  if (!confirm('确定要清空所有贴纸吗？')) return;
  saveKidsStickers([]);
  saveKidsProgress({});
  kidsTab = 'stickers';
  renderKidsBody();
  toast('🧹 已清空');
};

/* ============================================================
 * 🎮 趣味乐园（所有人）
 * ============================================================ */
function renderGames(app) {
  app.innerHTML = `
  <div class="container" style="padding-top:40px">
    <div class="section-head" style="margin-bottom:4px"><h1 style="font-size:33px">🎮 趣味乐园</h1></div>
    <p style="color:var(--muted);max-width:720px">查经也可以很好玩！把经文打乱拼回去、用快问快答检验自己——边玩边学，记住更多神的话语。</p>
    <div class="games-grid">
      <div class="card game-card">
        <div class="gc-emoji">🧩</div>
        <h3>金句拼拼看</h3>
        <p>打乱的词组，按顺序拼回一句完整的经文。考验你对神话语的熟悉程度！</p>
        <button class="btn gold" onclick="startScramble()">🎲 开始拼金句</button>
        <div id="scramble-wrap"></div>
      </div>
      <div class="card game-card">
        <div class="gc-emoji">🎯</div>
        <h3>圣经快问快答</h3>
        <p>${QUICK_QUESTIONS.length} 道趣味圣经知识题，答完看评分，每题都有小提示。</p>
        <button class="btn gold" onclick="startQuickQuiz()">🚀 开始答题</button>
        <div id="quick-wrap"></div>
      </div>
      <div class="card game-card kids-game-link">
        <div class="gc-emoji">🧒</div>
        <h3>儿童乐园</h3>
        <p>给小朋友的圣经故事、金句拼拼、智慧问答和闪闪贴纸。</p>
        <a class="btn indigo" href="#/kids">去儿童乐园 →</a>
      </div>
    </div>
  </div>`;
}

/* ---- 金句拼拼看 ---- */
let scrambleRun = { idx: 0, order: [], chosen: [], wrongFlash: false };
function scrambleVerse() { return VERSE_SCRAMBLE[scrambleRun.idx]; }
window.startScramble = function () {
  scrambleRun.idx = Math.floor(Math.random() * VERSE_SCRAMBLE.length);
  scrambleRun.order = shuffleArr(VERSE_SCRAMBLE[scrambleRun.idx].chunks.map((_, i) => i));
  scrambleRun.chosen = [];
  renderScramble();
};
function renderScramble() {
  const wrap = document.getElementById('scramble-wrap');
  if (!wrap) return;
  const v = scrambleVerse();
  const remain = v.chunks.length - scrambleRun.chosen.length;
  const slots = v.chunks.map((_, i) => {
    const filled = i < scrambleRun.chosen.length;
    const txt = filled ? v.chunks[scrambleRun.chosen[i]] : '';
    return `<div class="scramble-slot ${filled ? 'filled' : ''}">${filled ? esc(txt) : (i + 1)}</div>`;
  }).join('');
  const pool = scrambleRun.order.map((idx, i) => {
    const used = scrambleRun.chosen.indexOf(idx) >= 0;
    return `<button class="scramble-chip ${used ? 'used' : ''}" ${used ? 'disabled' : ''} onclick="scramblePick(${idx})">${esc(v.chunks[idx])}</button>`;
  }).join('');
  wrap.innerHTML = `
    <div class="scramble-box">
      <div class="scramble-ref">❓ 猜猜是哪句经文？（共 ${v.chunks.length} 个词组）</div>
      <div class="scramble-slots">${slots}</div>
      <div class="scramble-pool">${pool}</div>
      <div class="scramble-actions">
        <button class="btn ghost sm" onclick="scrambleHint()">💡 提示</button>
        <button class="btn ghost sm" onclick="startScramble()">🔀 换一句</button>
      </div>
      <div id="scramble-fb"></div>
    </div>`;
}
window.scramblePick = function (idx) {
  const v = scrambleVerse();
  const expected = scrambleRun.chosen.length;
  if (idx !== expected) {
    const btn = document.querySelectorAll('.scramble-chip')[scrambleRun.order.indexOf(idx)];
    if (btn) { btn.classList.add('shake'); setTimeout(() => btn.classList.remove('shake'), 450); }
    const fb = document.getElementById('scramble-fb');
    if (fb) fb.innerHTML = '<div class="fill-bad">😅 顺序不对哦，再试试看！</div>';
    return;
  }
  scrambleRun.chosen.push(idx);
  renderScramble();
  if (scrambleRun.chosen.length === v.chunks.length) {
    const first = addKidsSticker('🧩', '金句拼拼看');
    recordActivity('game', 'scramble.' + v.ref, 6);
    const fb = document.getElementById('scramble-fb');
    if (fb) fb.innerHTML = `<div class="fill-ok">🎉 拼对啦！<b>${esc(v.ref)}</b>${first ? ' · 获得贴纸 🧩' : ''}</div>`;
    if (first) setTimeout(() => { const wall = document.querySelector('.kids-tabs'); }, 0);
  }
};
window.scrambleHint = function () {
  const v = scrambleVerse();
  const expected = scrambleRun.chosen.length;
  const hint = v.chunks[expected];
  const fb = document.getElementById('scramble-fb');
  if (fb) fb.innerHTML = '<div class="fill-ok">💡 下一个词组是：「' + esc(hint) + '」</div>';
};

/* ---- 快问快答 ---- */
let quickRun = { score: 0, idx: 0, done: 0 };
window.startQuickQuiz = function () {
  quickRun = { score: 0, idx: 0, done: 0 };
  renderQuickQ();
};
function renderQuickQ() {
  const wrap = document.getElementById('quick-wrap');
  if (!wrap) return;
  if (quickRun.done === QUICK_QUESTIONS.length) {
    const sc = quickRun.score;
    const msg = sc === QUICK_QUESTIONS.length ? '🌟 满分！圣经知识达人！' : (sc >= 8 ? '👍 真不错！' : (sc >= 5 ? '😊 继续加油！' : '💪 多查经，会更棒！'));
    wrap.innerHTML = `<div class="game-done">
      <div class="gd-emoji">${sc === QUICK_QUESTIONS.length ? '🌟' : '👍'}</div>
      <h3>快问快答完成！</h3>
      <p>得分：<b style="color:var(--gold-deep);font-size:26px">${sc} / ${QUICK_QUESTIONS.length}</b></p>
      <p>${msg}</p>
      <button class="btn gold" onclick="startQuickQuiz()">🔁 再来一轮</button>
    </div>`;
    if (sc >= 8) { addKidsSticker('🎯', '快问快答'); recordActivity('game', 'quick.all', 8); }
    return;
  }
  const q = QUICK_QUESTIONS[quickRun.idx];
  const opts = q.options.map((o, oi) => `<button class="option" onclick="quickPick(${oi})"><span class="o-key">${'ABCD'[oi]}</span>${esc(o)}</button>`).join('');
  wrap.innerHTML = `<div class="quick-box">
    <div class="game-top"><span>🎯 快问快答</span><span>第 ${quickRun.idx + 1} / ${QUICK_QUESTIONS.length} 题 · 已答对 ${quickRun.score}</span></div>
    <div class="quick-q-text">${esc(q.q)}</div>
    <div class="options">${opts}</div>
    <div id="quick-fb"></div>
  </div>`;
}
window.quickPick = function (oi) {
  const q = QUICK_QUESTIONS[quickRun.idx];
  const fb = document.getElementById('quick-fb');
  const opts = document.querySelectorAll('#quick-wrap .option');
  opts.forEach(o => o.disabled = true);
  if (oi === q.answer) {
    quickRun.score++;
    opts[oi].classList.add('correct');
    if (fb) fb.innerHTML = `<div class="fill-ok">✅ 答对啦！${esc(q.tip)}</div>`;
  } else {
    opts[oi].classList.add('wrong');
    opts[q.answer].classList.add('correct');
    if (fb) fb.innerHTML = `<div class="fill-bad">❌ 答案是「${esc(q.options[q.answer])}」。${esc(q.tip)}</div>`;
  }
  quickRun.done++;
  if (fb) fb.innerHTML += `<div style="margin-top:12px"><button class="btn gold sm" onclick="${quickRun.done === QUICK_QUESTIONS.length ? 'renderQuickQ()' : 'quickNext()'}">${quickRun.done === QUICK_QUESTIONS.length ? '🏁 查看成绩' : '➡️ 下一题'}</button></div>`;
};
window.quickNext = function () { quickRun.idx++; renderQuickQ(); };

/* ---- 首页趣味学习卡片 ---- */
function renderFunGrid() {
  const cards = [
    { emoji: '🧒', name: '儿童乐园', desc: '圣经故事 · 金句拼拼 · 智慧问答 · 贴纸墙', href: '#/kids', tag: '亲子 · 儿童' },
    { emoji: '🧩', name: '金句拼拼看', desc: '把打乱的词组拼回一句经文，记住神的话', href: '#/games', tag: '记忆 · 游戏' },
    { emoji: '🎯', name: '快问快答', desc: '12道趣味圣经知识题，答完看评分', href: '#/games', tag: '挑战 · 竞答' }
  ];
  return `<div class="mode-grid fun-grid">` + cards.map(c =>
    `<a class="card mode-card" href="${c.href}">
      <div class="mc-emoji">${c.emoji}</div>
      <h3>${c.name}</h3>
      <p>${c.desc}</p>
      <span class="mc-tag">${c.tag}</span>
    </a>`).join('') + `</div>`;
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
        <a class="tag-link" href="#/kids">🧒 儿童乐园</a>
        <a class="tag-link" href="#/games">🎮 趣味乐园</a>
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
/* ============================================================
 * 🔊 朗读引擎（兼容安卓 / 苹果 / 电脑）
 * 系统语音优先；安卓或系统无中文语音时自动改用网络音频朗读，
 * 网络音频不可用时自动回退系统朗读。再次点击同一按钮可停止。
 * ============================================================ */
let ttsAudioEl = null;      // 当前网络音频播放器
let ttsAudioQueue = [];     // 剩余待播文本
let ttsAudioStop = false;   // 停止标记
let ttsLoading = false;     // 经文加载中标记

function isAndroidUA() {
  return /Android/i.test(navigator.userAgent || '');
}
/* 安卓 Chrome 的 getVoices() 一开始是空的，要等 voiceschanged 事件；这里页面加载时就预载 */
let ttsVoices = [];
function ttsRefreshVoices() {
  try { ttsVoices = window.speechSynthesis.getVoices() || []; } catch (e) { ttsVoices = []; }
}
function ttsPreloadVoices() {
  if (!window.speechSynthesis) return;
  ttsRefreshVoices();
  try {
    if (typeof window.speechSynthesis.onvoiceschanged === 'object' || window.speechSynthesis.addEventListener) {
      window.speechSynthesis.addEventListener('voiceschanged', ttsRefreshVoices);
    } else {
      window.speechSynthesis.onvoiceschanged = ttsRefreshVoices;
    }
  } catch (e) { try { window.speechSynthesis.onvoiceschanged = ttsRefreshVoices; } catch (e2) {} }
}
ttsPreloadVoices();
function ttsHasZhVoice() {
  ttsRefreshVoices();
  return !!(ttsVoices && ttsVoices.some(v => /zh|cmn|chinese/i.test((v.lang || '') + ' ' + (v.name || ''))));
}
function ttsCanSystem() {
  return !!(window.speechSynthesis && typeof window.speechSynthesis.speak === 'function');
}
function ttsUseSystem() {
  if (!ttsCanSystem()) return false;
  if (!isAndroidUA()) return true;   // 苹果/电脑一般都有中文语音
  return ttsHasZhVoice();            // 安卓：检测到中文语音才用系统朗读（预载后一般都能检测到）
}
function ttsActive() {
  if (ttsLoading) return true;
  if (ttsAudioEl || ttsAudioQueue.length) return true;
  try { if (window.speechSynthesis && window.speechSynthesis.speaking) return true; } catch (e) {}
  return false;
}
function ttsStop() {
  ttsAudioStop = true;
  ttsLoading = false;
  ttsAudioQueue = [];
  if (ttsAudioEl) {
    try { ttsAudioEl.pause(); ttsAudioEl.onended = null; ttsAudioEl.onerror = null; } catch (e) {}
    ttsAudioEl = null;
  }
  if (window.speechSynthesis) { try { window.speechSynthesis.cancel(); } catch (e) {} }
}
window.stopSpeak = function () { ttsStop(); toast('⏹ 已停止朗读'); };

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

function ttsSpeakSystemChunks(chunks, doneMsg, rate) {
  if (!chunks.length) { toast(doneMsg || '🔊 朗读完毕'); return; }
  let idx = 0, started = false, watchdog = null;
  const clearWatch = () => { if (watchdog){ clearTimeout(watchdog); watchdog = null; } };
  const failToNetwork = () => {
    clearWatch();
    if (ttsAudioStop) return;
    toast('⚠️ 系统语音无响应，改用网络音频');
    try { window.speechSynthesis.cancel(); } catch (e) {}
    ttsSpeakAudioChunks(chunks, doneMsg);
  };
  const next = () => {
    if (ttsAudioStop) { clearWatch(); return; }
    if (idx >= chunks.length) { clearWatch(); toast(doneMsg || '🔊 朗读完毕'); return; }
    const u = new SpeechSynthesisUtterance(chunks[idx]);
    u.lang = 'zh-CN';
    u.rate = rate || 0.95;
    u.onstart = () => { started = true; clearWatch(); };
    u.onend = () => { if (ttsAudioStop){ clearWatch(); return; } idx++; next(); };
    u.onerror = (e) => {
      if (ttsAudioStop) { clearWatch(); return; }
      if (e && (e.error === 'interrupted' || e.error === 'canceled')) return;
      if (!started) { failToNetwork(); return; }
      idx++; next();
    };
    try {
      window.speechSynthesis.speak(u);
      if (isAndroidUA()) { try { window.speechSynthesis.pause(); window.speechSynthesis.resume(); } catch (e) {} }
    } catch (err) { idx++; next(); }
    // 首段 3 秒内没有真正出声 -> 回退网络音频
    if (!started && !watchdog) watchdog = setTimeout(() => { if (!started && !ttsAudioStop) failToNetwork(); }, 3000);
  };
  try { window.speechSynthesis.cancel(); } catch (e) {}
  next();
}

function ttsAudioUrls(text) {
  return [
    'https://fanyi.baidu.com/gettts?lan=zh&spd=5&source=web&text=' + encodeURIComponent(text),
    'https://dict.youdao.com/dictvoice?audio=' + encodeURIComponent(text) + '&type=2',
    'https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=zh-CN&q=' + encodeURIComponent(text)
  ];
}
function ttsSpeakAudioChunks(chunks, doneMsg) {
  if (!chunks.length) { toast(doneMsg || '🔊 朗读完毕'); return; }
  const queue = chunks.slice();
  const playNext = () => {
    if (ttsAudioStop) return;
    if (!queue.length) { toast(doneMsg || '🔊 朗读完毕'); return; }
    const text = queue.shift();
    const urls = ttsAudioUrls(text);
    let ui = 0;
    const tryUrl = () => {
      if (ttsAudioStop) return;
      if (ui >= urls.length) {
        if (!ttsAudioStop) { toast('⚠️ 网络音频不可用，改用系统朗读'); ttsSpeakSystemChunks([text].concat(queue), doneMsg, 0.95); }
        return;
      }
      const a = new Audio();
      ttsAudioEl = a;
      a.src = urls[ui];
      a.onended = () => { if (ttsAudioEl === a) ttsAudioEl = null; playNext(); };
      a.onerror = () => { if (ttsAudioEl === a) ttsAudioEl = null; ui++; tryUrl(); };
      a.play().catch((err) => {
        if (ttsAudioEl === a) ttsAudioEl = null;
        // 安卓自动播放被拦截（用户手势已失效）-> 直接回退系统朗读
        if (err && (err.name === 'NotAllowedError' || /autoplay|user gesture|interrupt/i.test(String(err.message || '')))) {
          if (ttsAudioStop) return;
          toast('⚠️ 浏览器拦截了自动播放，改用系统朗读');
          try { if (window.speechSynthesis) window.speechSynthesis.cancel(); } catch (e) {}
          ttsSpeakSystemChunks([text].concat(queue), doneMsg, 0.95);
          return;
        }
        ui++; tryUrl();
      });
    };
    tryUrl();
  };
  playNext();
}

function ttsSpeak(text, doneMsg, rate) {
  ttsStop();
  ttsAudioStop = false;
  if (!text) { toast('⚠️ 没有可朗读的内容'); return; }
  if (ttsUseSystem()) {
    ttsSpeakSystemChunks(chunkText(text, isAndroidUA() ? 180 : 450), doneMsg, rate);
  } else {
    toast('🔊 正在朗读…');
    ttsSpeakAudioChunks(chunkText(text, 160), doneMsg);
  }
}

/* ---------- 朗读：每日珍宝 / 存心节 ---------- */
window.speakVerse = function (key) {
  if (ttsActive()) { ttsStop(); toast('⏹ 已停止朗读'); return; }
  let text = '';
  if (key === 'daily') { const v = dailyVerse(); text = v.ref + '。' + v.text; }
  else {
    const parts = String(key).split('.');
    const b = getBook(parts[0]);
    const lesson = getLesson(parts[0], parseInt(parts[1], 10));
    text = lesson && lesson.memoryVerse ? lesson.memoryVerse : ((b ? b.name : '') + ' 第' + parts[1] + '章');
  }
  ttsSpeak(text, '🔊 朗读完毕', 0.95);
};

/* ---------- 朗读：本章全文 ---------- */
window.speakChapter = async function (key) {
  if (ttsActive()) { ttsStop(); toast('⏹ 已停止朗读'); return; }
  ttsAudioStop = false;
  ttsLoading = true;
  let raw = bibleTextRaw[key] || cachedRaw(key);
  if (!raw) {
    toast('⏳ 正在加载经文，稍后自动朗读…');
    await loadChapterText(key);
    raw = bibleTextRaw[key] || cachedRaw(key);
  }
  ttsLoading = false;
  if (ttsAudioStop) return;   // 加载期间用户点了停止
  if (!raw) { toast('⚠️ 经文加载失败，暂时无法朗读'); return; }
  const parts = String(key).split('.');
  const b = getBook(parts[0]);
  const head = (b ? b.name + '，第' + parts[1] + '章。' : '');
  ttsSpeak(head + raw, '🔊 本章朗读完毕', 0.9);
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
/* ---------- 详细经文讲解生成系统 ---------- */
const EX_CAT = {
  '律法书': {
    bg: '本卷属于摩西五经（律法书），是圣经叙事的根基。它记载神创造万有、拣选亚伯拉罕的后裔、拯救以色列人出埃及，并在西奈山与他们立约。律法不是冷冰冰的条文，而是神爱的指引——祂要祂的子民认识祂的圣洁，并在生活中活出公义与怜悯。',
    orig: '本卷原文为希伯来文。希伯来文「妥拉」(Torah) 意为「教导、指引」，比中文常译的「律法」含义更广：它包含神全部的训诲与心意。理解这一点，读经时就不把诫命当作重担，而当作神爱的道路。',
    god: '在律法书中，我们看见神是圣洁、公义又有恩典的神：祂恨恶罪恶，却为犯罪的人预备赦免与救赎；祂要求顺服，也应许赐福。',
    resp: '对神的子民而言，回应就是「听命胜于献祭」：从心里顺服神的话语，把信仰落实在每一天的选择里。'
  },
  '历史书': {
    bg: '本卷属于旧约历史书，讲述以色列人进入应许之地、建立王国、经历分裂与被掳的历史。历史书的重点不是记录事件本身，而是从信心的眼光看见：顺服神带来祝福，背离神招致管教，而神始终信实守约。',
    orig: '旧约原文以希伯来文书写。历史书中反复出现的神名「耶和华」(YHWH)，意思是「自有永有者」，显明神是掌管历史、信实守约的主。读历史书时，留意「神怎样看待这件事」比「事情怎样发生」更重要。',
    god: '从历史中我们看见，神在每一个时代掌权：祂兴起领袖，也容许管教临到；祂的旨意不因人的失败而落空。',
    resp: '历史是最好的老师。读历史书，我们当以古为鉴，省察自己今天是否正走在顺服或背离的路上，并及时回转。'
  },
  '诗歌智慧书': {
    bg: '本卷属于诗歌智慧书，是圣经中最贴近人心的部分：诗篇是灵魂的祷告与赞美，箴言是生活的智慧格言，约伯记直面苦难之问，传道书思想人生的虚空与意义，雅歌歌唱爱情的圣洁与美好。',
    orig: '旧约原文为希伯来文。希伯来文诗歌善用「平行句」：同一意思用两句重复、对照或递进表达，读时宜放慢，感受其中情感与节奏。希伯来文的「智慧」(chokmah) 不只是聪明，更是敬畏神、按神心意生活的艺术。',
    god: '诗歌智慧书把我们带到神面前：祂是可亲近的（诗篇）、可信靠的（约伯记）、可敬畏的（箴言），也是人生意义的答案（传道书）。',
    resp: '智慧书的回应是「心」的回应：用心灵诚实敬拜，把神的话藏在心里，并在日常小事上活出敬畏与智慧。'
  },
  '大先知书': {
    bg: '本卷属于大先知书。先知是神的代言人，在国运兴衰之际宣告神的心意：一面责备罪恶、宣告审判，一面赐下安慰、指向弥赛亚与复兴的盼望。大先知书篇幅宏大，兼具历史、诗歌与异象。',
    orig: '旧约原文为希伯来文。「先知」(nabi) 字根与「呼出、宣告」相关，先知就是「被神的话充满而发言」的人；他们常以「耶和华如此说」开头，表明所言不是自己的意思。',
    god: '先知书让我们看见神既公义又慈爱：祂不能容忍罪恶，却为悔改留下出路；祂的怒气背后，是渴望儿女归家的爱。',
    resp: '面对先知的责备与应许，我们当「听了就回转」，在生活、家庭、教会中活出与悔改相称的果子。'
  },
  '小先知书': {
    bg: '本卷属于小先知书——「小」指篇幅较短，信息同样重要。十二位小先知从不同角度发出同一个呼召：回转归向神，行公义、好怜悯；同时预告审判与复兴、弥赛亚与末后的日子。',
    orig: '旧约原文为希伯来文。小先知书文字精炼，善用比喻与戏剧性表达（如婚姻、蝗灾、狮子等），读时要留意其意象背后的属灵含义。',
    god: '小先知书凸显神不改变的爱：即便百姓背道，神仍呼唤「回来吧」；祂管教，也为要得回祂的百姓。',
    resp: '回应小先知书的信息，就是「行公义，好怜悯，存谦卑的心与神同行」，并常以悔改的心回到神面前。'
  },
  '福音书': {
    bg: '本卷属于新约福音书，记载耶稣基督的降生、教训、神迹、受死与复活。福音书不是普通传记，而是「好消息」的宣告：神在基督里亲自来到人间，拯救罪人。',
    orig: '新约原文为希腊文。福音书中「基督」(Christos) 即旧约所应许的「弥赛亚/受膏者」；「悔改」(metanoia) 意为「心思的转变」；「天国」(basileia) 指神掌权的领域。明白这些词，能更准确抓住耶稣教训的重点。',
    god: '福音书最清楚地显明神是谁：祂是满有怜悯、寻找失丧者的神，是亲自担当我们罪债、赐下永生的神。',
    resp: '面对福音，唯一的回应就是「信而跟从」：承认耶稣是主，悔改离罪，背起十架跟随祂，并在爱中服事人。'
  },
  '历史书': {
    bg: '本卷属于新约历史书（使徒行传），是福音的延续：复活的主升天，圣灵降临，门徒得着能力，把福音从耶路撒冷、犹太全地、撒玛利亚传到地极。使徒行传见证教会如何在大使命中诞生与扩展。',
    orig: '新约原文为希腊文。「圣灵」(Pneuma) 意为「气息、风」，是赐生命、赐能力的神的灵；「见证人」(martyres) 后来衍生出「殉道者」一词，可见见证常付上代价。',
    god: '使徒行传显明神是差遣与赐能力的神：祂兴起人、使用人，也藉着患难与逼迫把福音推向更远的地方。',
    resp: '回应使徒行传，就是作「圣灵充满的见证人」：靠圣灵的能力，在自己的耶路撒冷、犹太全地、直到地极，为复活的主作见证。'
  },
  '保罗书信': {
    bg: '本卷属于保罗书信。使徒保罗写给教会或个人的书信，通常先讲「真理」（我们信什么、神为我们做了什么），再讲「生活」（我们当怎样活）。先扎根于福音，才能活出福音。',
    orig: '新约原文为希腊文。保罗书信中反复出现「恩典」(charis)、「信心」(pistis)、「称义」(dikaioō)、「在基督里」(en Christō) 等核心词——这些不是术语，而是福音的实质。',
    god: '保罗书信让我们看见：神是主动拯救、白白称罪人为义的神；祂的恩典先于我们的行为，祂的爱在基督里显明。',
    resp: '回应保罗书信，就是「既然蒙恩，就与蒙召的恩相称」：因信称义之后，靠圣灵活出圣洁、相爱与合一。'
  },
  '普通书信': {
    bg: '本卷属于普通书信，作者是雅各、彼得、约翰、犹大等使徒与教会领袖，写给分散各地的信徒。这些书信多写于逼迫与异端兴起的年代，鼓励信徒在患难中持守信心、在错谬中持守真理、在爱中彼此扶持。',
    orig: '新约原文为希腊文。普通书信重视「活出来的信仰」：如「信心」(pistis) 与「行为」(erga) 并重、「爱」(agapē) 是最大的诫命、「忍耐」(hypomonē) 是患难中的坚忍。',
    god: '普通书信显明神是赐盼望与够用恩典的神：祂在苦难中与我们同在，也在我们软弱时赐下力量。',
    resp: '回应普通书信，就是在试炼中以为大喜乐，用生活见证信心，用爱心彼此接纳，并为真道竭力争辩。'
  },
  '预言书': {
    bg: '本卷属于预言书（启示录）。启示录是圣经的终卷，用异象与象征宣告：基督已经得胜，历史终将终结于新天新地；它安慰受苦的教会，呼召圣徒忍耐到底。',
    orig: '新约原文为希腊文。「启示」(apokalypsis) 意为「揭开幔子」，启示录就是把将来之事揭开给人看；其中数字（7、12、144000等）多具象征意义，解读当以基督与教会为中心。',
    god: '启示录显明神是掌管终局、必定得胜的神：祂擦去一切眼泪，祂的帐幕在人间，祂要作我们的神。',
    resp: '回应启示录，就是以终局反观今天：警醒预备、忠心到底、常常喜乐祷告，并带着「主耶稣啊，我愿你来」的盼望生活。'
  }
};
const EX_POS = {
  head: '本章位于本书的前三分之一，是全书叙事的开端与铺垫。许多贯穿全书的重要主题，往往在此埋下伏笔；留意开头，能更好地理解整卷书的走向。',
  mid: '本章位于本书的中间部分，是故事与教训的展开与深化。前面的铺垫在此落地，主题逐渐清晰，人物与事件的选择显明信心的功课。',
  tail: '本章位于本书的后三分之一，是全书的收尾与升华。它常把前面的线索带向结局与应用，提醒我们：神的故事有一个荣耀的终点。'
};
const EX_APP = {
  '律法书': '今天我们可以活出「律法」的真义：不是靠行为称义，而是因信领受神的爱，用感恩的心遵守祂的道，把「爱人如己」落实在家庭与邻舍身上。',
  '历史书': '以史为鉴：省察自己的生命是「顺服得福」还是「背离受教」，并求神兴起我们成为这个时代的见证人，把信心传给下一代。',
  '诗歌智慧书': '让神的话进入我们的情感与日常：在祷告中倾心吐意，在赞美中重新得力，在每一个选择里求问智慧，把灵魂安放在神手中。',
  '大先知书': '听见先知的呼唤就当回转：远离罪恶、持守真道，同时抓住神的应许，在困境中仍仰望那位必定成就一切的主。',
  '小先知书': '行公义、好怜悯、存谦卑的心与神同行——从最小的行动开始：诚实、怜悯、饶恕、殷勤，把信仰活成可见的生活。',
  '福音书': '天天跟随耶稣：在祂的话语中学习，在祷告中亲近，在服事中效法；把「祂为我舍命」的恩典，化为「我为祂而活」的生活。',
  '历史书': '作圣灵充满的见证人：在家里、职场、校园勇敢分享复活的主，用生命与言语把福音带到你所能到的「地极」。',
  '保罗书信': '先扎根在福音里，再活出福音：每天默想「我在基督里」的身份，靠圣灵对付老我，在肢体相爱中见证救恩。',
  '普通书信': '在试炼中以为大喜乐，用信心带出行为，用爱心彼此接纳，为真道竭力争辩；让「活的信心」成为你每天最真实的见证。',
  '预言书': '以终局反观今天：警醒预备、忠心到底、常常喜乐、不住祷告，带着「主耶稣啊，我愿你来」的盼望，活出属天的生活。'
};
function buildDetailedExplain(bookId, num) {
  const b = getBook(bookId);
  const t = getTestament(b.testament);
  const lesson = getLesson(bookId, num);
  const title = lesson ? lesson.title : chapterTitle(bookId, num);
  const ratio = num / b.chapters;
  const posKey = ratio <= 0.34 ? 'head' : (ratio <= 0.67 ? 'mid' : 'tail');
  const cat = EX_CAT[b.category] || EX_CAT['律法书'];
  const app = EX_APP[b.category] || '';
  const themeWords = b.theme.split('、').map(s => s.trim()).filter(Boolean);
  const memory = lesson && lesson.memoryVerse ? lesson.memoryVerse : '';
  const T = themeWords.length ? themeWords : ['信靠神', '顺服神', '恩典', '盼望'];
  // 概论
  const overview = '《' + b.name + '》属于' + t.name + '的「' + b.category + '」，全书共' + b.chapters + '章，作者为' + b.author + '。' + b.summary + ' 本章（第' + num + '章）主题是「' + title + '」，位于' + (posKey === 'head' ? '全书前三分之一' : (posKey === 'mid' ? '全书中间' : '全书后三分之一')) + '。' + EX_POS[posKey];
  // 背景
  const background = cat.bg + ' 就本章而言，它继续推进全书主线「' + b.theme + '」，是整卷启示中不可分割的一环。读本章时，请把它放在整卷书和整本圣经的脉络里，才能看见更完整的图画。';
  // 原文解释
  const orig = cat.orig + ' 本章中反复出现的核心词与主题（' + T.slice(0, 3).join('、') + '），在原文里都承载着丰富的含义；默想这些词，能帮助我们把字句读进心里。';
  // 分段大纲
  const outline = [];
  outline.push('一、引言：' + EX_POS[posKey] + '本章主题是「' + title + '」。');
  T.slice(0, 3).forEach((w, i) => outline.push((i + 2) + '、' + w + '：本章围绕「' + w + '」展开，显明神在这一方面的心意与作为；留意经文如何用叙事、对话或教导来呈现这一主题。'));
  outline.push('五、总结与应用：把本章真理带回生活，求圣灵光照，行出所领受的，并留意神要你为谁祷告、向谁伸出援手。');
  // 金句赏析
  const verseNote = '「' + title + '」是本章的钥匙与窗口。每一章都有神要向祂儿女说的话，本章透过「' + title + '」这主题，把真理放在我们眼前。金句不只是一句话，更是可携带的属灵粮食：把它存在心里，在需要的时候，圣灵会用它提醒我们、安慰我们、引导我们。默想金句的秘诀不是「一次想很多」，而是「多次想一节」，让神的话渐渐渗透我们的心思意念。';
  // 属灵教训
  const lessons = T.slice(0, 4).map((w, i) =>
    '• 教训' + (i + 1) + '（' + w + '）：神藉「' + w + '」塑造我们的生命——不是叫我们停留在知识，而是叫我们经历祂、信靠祂、顺服祂。本章提醒我们：信仰必须从「知道」走向「活出」，从「头脑」进入「心与生活」。' + (i === 3 ? ' 四样教训合起来，正指向一个整全的信仰：认识神、信靠神、顺服神、并活出爱。' : '')).join('\n');
  // 讲章（长文）
  const sermon = [
    '【引言】' + b.summary + ' 今天我们一起思想《' + b.name + '》第' + num + '章，主题是「' + title + '」。' + EX_POS[posKey] + '本章不是孤立的一页，而是神整全启示中的一环；它既承接前面的故事，也指向后面的结局。让我们带着祷告的心，安静在神面前，领受祂藉这一章要对我们说的话。',
    '【第一点：认识神在这一章的心意】' + cat.god + ' 本章透过「' + title + '」这主题，把神的性情显明出来：祂是主动启示自己的神，是乐意与人同行的神。读经时，先不要急着问「我该做什么」，而是先问「这一章让我认识神是怎么样的一位神」。认识神，是一切敬拜与顺服的开端。我们若先看见神是谁，再看自己当如何行，读经就不再是负担，而成为与神相遇的喜乐。',
    '【第二点：看见我们当行的路】' + cat.resp + ' 神的话从来不是「听一听」就结束，而是要「行出来」才成全。本章针对我们的心思、言语、关系与选择发出邀请：什么地方需要悔改？什么地方需要信靠？什么地方需要饶恕与爱？求圣灵在我们读经时做「鉴察与光照」的工作，叫我们不只是读，更是被读。圣经像一面镜子，照出我们真实的光景；被光照不是难堪，而是蒙福的开始。',
    '【第三点：把真理带进今天的生活】我们可以用三个具体行动回应本章：第一，从本章选一节经文作「存心节」，反复默想、背记，让它成为今天的力量；第二，为身边一位需要的人祷告，并用实际的爱去帮助他；第三，把本章的领受写进查经笔记，让它成为你属灵足迹的一部分，也方便日后回顾神在你生命中的作为。属灵成长没有捷径，只有一次次「听见又遵行」的积累。',
    '【第四点：在群体中彼此建造】神的话不只是给个人的，也是给群体的。我们可以在家庭、小组、教会中彼此分享本章的领受，互相代祷、彼此劝勉；一个人的亮光可以照亮许多人，正如神的话「是我脚前的灯，是我路上的光」。不要独享真理，要与人同行。当我们在爱中说诚实话，在祷告中彼此担当，教会就真实地成为基督的身体。',
    '【生活应用】' + (app || cat.resp) + ' 把「今天」交给神：定一个具体的、今天就能做的小行动——一句感谢、一次饶恕、一通电话、一次低头祷告，都算数。属灵生命不是靠轰轰烈烈，而是靠日复一日对神话语的顺服积累而成。',
    '【结语】' + (memory ? '让我们记住本章的存心节：「' + memory + '」' : '愿神藉「' + title + '」这一主题更新我们的心，使我们把本章的真理活出来。') + ' 圣经的话安定在天，直到永远；愿我们不但读经、听道，更被神的话塑造，成为祂喜悦的器皿。愿「' + title + '」成为你今天行路的亮光。',
    '【祷告】主啊，谢谢你藉着《' + b.name + '》第' + num + '章向我们说话。求你打开我们的心窍，使我们明白你的心意；赐我们顺服的心，把今天所领受的活出来；也求你指教我们当为谁祷告、当怎样爱人。愿你的话成为我们脚前的灯、路上的光。奉耶稣基督的名祷告，阿们。'
  ].join('\n\n');
  return { title, posKey, cat, themeWords: T, memory, overview, background, orig, outline: outline.join('\n'), lessons, sermon, app };
}
function readingSection(b, num, qKey, lesson) {
  return `
  <div class="card reading-top">
    <div class="rt-head"><span class="rt-badge">📖 阅读圣经</span><span class="rt-ref">${b.emoji} ${esc(b.name)} 第${num}章 · 共${b.chapters}章</span></div>
    <div class="passage-box">
      <div class="pb-ref">📖 ${lesson ? lesson.passage : b.name + ' 第' + num + '章'}</div>
      ${lesson && lesson.memoryVerse ? `<div class="pb-verse">${lesson.memoryVerse}</div>` : ''}
      <p class="pb-note">💡 下面是本章完整经文（和合本简体）。慢慢读，读到触动你的句子时停下来默想；也可点「🔊 朗读全文」听读。</p>
      <div class="bible-text" id="bible-text-${qKey}"><div class="bt-loading">📖 正在加载本章经文…</div></div>
    </div>
    <div style="margin-top:14px;display:flex;gap:10px;flex-wrap:wrap">
      <button class="btn gold sm read-btn" onclick="markRead(this,'${qKey}')">✓ 我读完了这一章</button>
      <button class="btn ghost sm" onclick="speakChapter('${qKey}')">🔊 朗读全文</button>
    </div>
    <div class="feedback ok" id="fb-read-${qKey}" style="margin-top:12px"><span class="fb-emoji">📖</span> 读经是查经的基础。读完本章，再进入下面的讲解与互动。</div>
  </div>`;
}
function explainExtraBlocks(b, num, title, T, catName, scale) {
  const n = Math.max(0, Math.min(14, Math.round((scale - 0.6) * 6)));
  const themed = T.slice(0, 3).map((w) =>
    '围绕「' + w + '」再思想：《' + b.name + '》第' + num + '章把「' + w + '」放在我们面前，神要我们不只是知道这个词，更要在生活中经历它、活出它。试着写下：本周我在哪一件事上，最需要在「' + w + '」上信靠神？');
  const base = [
    '更深一步：本章提醒我们，神的话语不是用来满足好奇心的，而是用来改变生命的。读经之后，若没有带来敬拜、感恩或顺服的回应，就还没有真正「读进去」。',
    '从结构看：留意本章在上下文中的位置——它承接上一章，也引向下一章；试着找出本章的「转折点」，往往那里藏着最重要的信息。',
    '从人物看：本章中的人物或说话者是谁？他们的反应给你什么提醒？把自己放进场景里：如果我在场，我会怎样回应？',
    '从应许看：本章有没有神的应许？抓住应许，把它带进祷告，为着自己、家人和教会祈求，让应许在生命中生根。',
    '从命令看：本章有没有神的命令或劝勉？选择其中一条，定一个本周可以执行的小行动，具体到时间、地点与对象。',
    '从警告看：本章若提到罪的后果或警告，要存敬畏的心领受；求主保守我们远离试探，赐我们警醒与力量。',
    '从祷告看：把本章变成一篇祷告——用经文的话向神说话，感谢祂的启示，承认自己的亏欠，恳求圣灵帮助。',
    '从敬拜看：本章有没有值得你向神献上赞美的理由？今天就为这件事赞美神，把你的敬拜化为口中的感谢。',
    '从见证看：本章最想分享给哪一位朋友？试着用你自己的话讲一遍本章的要点，把领受传递出去。',
    '从默想看：选本章一节经文，今天反复默想三遍，让它成为你今天生活的「背景音乐」。'
  ];
  const pool = themed.concat(base);
  const out = [];
  for (let i = 0; i < n; i++) out.push(pool[i % pool.length] + ' 愿你在今天的生活中，把这一点化作具体的祷告与行动，经历神的信实与同在。');
  return out;
}
function renderExplainDetail(bookId, num) {
  const d = buildDetailedExplain(bookId, num);
  const b = getBook(bookId);
  const len = bibleTextLen[bookId + '.' + num] || 1800;
  const scale = Math.max(0.5, Math.min(3.5, len / 1800));
  const extras = explainExtraBlocks(b, num, d.title, d.themeWords, b.category, scale);
  const extraHtml = extras.length ? '<h4>深度扩展（按本章字数比例生成）</h4>' + extras.map((e, i) => '<p><b>扩展' + (i + 1) + '：</b>' + esc(e) + '</p>').join('') : '';
  const longHtml = scale >= 2 ? '<h4>长章深化（本章较长，另加两段默想）</h4>' +
    '<p><b>默想引导：</b>面对较长的经文，不必急于一次读完所有细节。可以分段默想：先读一遍把握大意，再选一段反复咀嚼，把触动你的句子圈出来，用祷告回应。神的话一句一句吃进去，比囫囵吞枣更有力量。</p>' +
    '<p><b>背诵与分享：</b>从本章选两节经文作为本周背诵目标，一天记一节；并尝试用自己的话向一位家人或朋友分享本章最重要的信息。说出来的真理，会在心里扎根更深。</p>' : '';
  return '<div class="ex-size">📏 本章经文 ' + len + ' 字 · 讲解已按字数比例生成' + (extras.length ? '（含' + extras.length + '段深度扩展）' : '') + '</div>' +
    '<div class="ex-sec"><h4>一、经文概论</h4><p>' + esc(d.overview) + '</p></div>' +
    '<div class="ex-sec"><h4>二、经文背景</h4><p>' + esc(d.background) + '</p></div>' +
    '<div class="ex-sec"><h4>三、原文解释</h4><p>' + esc(d.orig) + '</p></div>' +
    '<div class="ex-sec"><h4>四、分段大纲</h4><pre class="ex-pre">' + esc(d.outline) + '</pre></div>' +
    '<div class="ex-sec gold"><h4>五、存心节</h4><p>' + (d.memory ? esc(d.memory) : '建议：本章主题是「' + esc(d.title) + '」，请挑选一节最触动你的经文作为存心节，反复默想、背记。') + '</p></div>' +
    '<div class="ex-sec"><h4>六、属灵教训</h4><pre class="ex-pre">' + esc(d.lessons) + '</pre></div>' +
    '<div class="ex-sec"><h4>七、讲章</h4><pre class="ex-pre">' + esc(d.sermon) + '</pre></div>' +
    (extraHtml ? '<div class="ex-sec">' + extraHtml + '</div>' : '') +
    (longHtml ? '<div class="ex-sec">' + longHtml + '</div>' : '') +
    '<div class="ex-sec gold"><h4>八、金句赏析与默想</h4><p>' + esc(d.verseNote) + '</p></div>';
}
function explainSection(bookId, num) {
  const d = buildDetailedExplain(bookId, num);
  const b = getBook(bookId);
  const t = getTestament(b.testament);
  return `
  <div class="card explain-card">
    <div class="ex-head"><span class="ex-badge">📖 本章经文详细讲解</span><span class="ex-ref">${b.emoji} ${esc(b.name)} 第${num}章 · 共${b.chapters}章</span></div>
    <div class="ex-grid">
      <div class="ex-item"><b>本章主题</b><span>${esc(d.title)}</span></div>
      <div class="ex-item"><b>本书分类</b><span>${t.name} · ${b.category}</span></div>
      <div class="ex-item"><b>章节位置</b><span>${d.posKey === 'head' ? '前三分之一' : (d.posKey === 'mid' ? '中间三分之一' : '后三分之一')}</span></div>
      <div class="ex-item"><b>作者</b><span>${esc(b.author)}</span></div>
    </div>
    <div class="ex-block"><b>📖 本书简介</b><p>${esc(b.summary)}</p></div>
    <div class="ex-block"><b>🎯 本书核心主题</b><p>${esc(b.theme)}</p></div>
    <button class="btn gold sm ex-toggle" onclick="toggleExplain('${bookId}-${num}')">📖 展开完整详细讲解（概论 · 背景 · 原文 · 分段 · 存心节 · 属灵教训 · 讲章）</button>
    <div class="ex-detail" id="ex-detail-${bookId}-${num}" style="display:none">
      ${renderExplainDetail(bookId, num)}
    </div>
  </div>`;
}
window.toggleExplain = function (id) {
  const el = document.getElementById('ex-detail-' + id);
  const btn = event.target;
  if (!el) return;
  const open = el.style.display !== 'none';
  el.style.display = open ? 'none' : 'block';
  if (btn) btn.textContent = open ? '📖 展开完整详细讲解' : '📕 收起详细讲解';
};
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
    <div class="step-head"><span class="step-badge">⑧</span><div class="step-title"><h3>本章知识问答挑战</h3><p>15 道小题，检验你对本章和本书的了解；可随时换一批新题</p></div></div>
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
const bibleTextLen = {};
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
    bibleTextLen[key] = rawText.length;
    const exEl = document.getElementById('ex-detail-' + bookId + '-' + num);
    if (exEl) exEl.innerHTML = renderExplainDetail(bookId, num);
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
    return `<a class="foot-row" href="#/chapter/${parts[0]}/${num}" title="点击打开这一章">
      <span class="foot-emoji">${emoji[f.t] || '📌'}</span>
      <div class="foot-info"><b>${label[f.t] || f.t} · ${b ? esc(b.name) + ' 第' + num + '章' : esc(f.k)}</b><span>${esc(title)}</span></div>
      <span class="foot-date">${f.d} ${f.tm || ''} →</span></a>`;
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

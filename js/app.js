/* ============================================================
 * 隐藏的珍宝｜66卷圣经互动学习平台 —— 应用层
 * 零依赖纯前端：hash 路由 + 本地进度存储 + 页面渲染
 * ============================================================ */

/* ---------- 进度存储 ---------- */
const STORE_KEY = 'yiqi-bible-progress-v1';
const store = {
  completed: {},   // 'genesis.1' -> { date: 'YYYY-MM-DD', minutes: 10 }
  notes: {},       // 'genesis.1' -> { discussion: '...', application: '...' }
  minutes: 0
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
      <div class="section-head">
        <h2>🗺️ 我的圣经旅程</h2>
        <span class="sub">进度保存在本机浏览器</span>
        <a class="more" href="#/progress">查看全部 →</a>
      </div>
      <div class="card" style="padding:26px">
        <div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:10px;margin-bottom:10px">
          <span style="font-weight:800">已完成 ${done} / 1189 章</span>
          <span style="color:var(--muted);font-size:13px">${booksCompleted()} / 66 卷 · 累计 ${fmtMinutes(totalMinutes())}</span>
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
    <div class="section-head" style="margin-bottom:4px"><h1 style="font-size:30px">📚 全圣经 · 66卷</h1></div>
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
          <h3 style="font-size:15px;margin-bottom:8px">相关主题</h3>
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
  if (!rel.length) return '<p style="font-size:13px;color:var(--muted)">暂无相关主题</p>';
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

    <div class="steps">
      ${lesson ? renderCuratedSteps(b, num, lesson, note, done) : renderGenericSteps(b, num, title, note, done)}
    </div>

    ${done ? `<div class="complete-card" style="margin-top:30px">
      <div class="cc-emoji">🎉</div>
      <h3>本章学习完成</h3>
      <p>${b.name} ${num}章 · ${title} · 你已经完成了：读经 → 观察 → 思考 → 回答 → 讨论 → 应用 → 祷告</p>
      <div class="cc-btns">
        ${next ? `<a class="btn gold" href="#/chapter/${b.id}/${next}">继续下一章 →</a>` : `<a class="btn gold" href="#/book/${b.id}">返回本卷地图</a>`}
        <a class="btn ghost" href="#/progress">查看我的旅程</a>
      </div>
    </div>` : ''}
  </div>`;
}

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
        <p class="pb-note">💡 请打开你手边的圣经（或在线圣经）通读本章。读到触动你的句子时，停下来默想一下。</p>
      </div>
      <button class="btn ghost sm read-btn" onclick="markRead(this,'${qKey}')">✓ 我读完了这一章</button>
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
        <p class="pb-note">💡 请打开你手边的圣经（或在线圣经）通读本章。留意：谁？在哪里？发生什么？神说了什么？</p>
      </div>
      <button class="btn ghost sm read-btn" onclick="markRead(this,'${qKey}')">✓ 我读完了这一章</button>
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
      </div>
    </div>
  </section>`;
}

/* ---------- 章节交互函数（挂到 window） ---------- */
window.pickOpening = function (el, key) {
  document.querySelectorAll(`.option[data-q="opening"]`).forEach(o => o.disabled = true);
  el.classList.add('correct');
  const fb = document.getElementById('fb-opening-' + key);
  if (fb) fb.classList.add('show');
};
window.markRead = function (btn, key) {
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
    <div class="section-head" style="margin-bottom:4px"><h1 style="font-size:30px">❤️ 圣经主题地图</h1></div>
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
    <div class="section-head" style="margin-bottom:4px"><h1 style="font-size:30px">👤 人物地图</h1></div>
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
    <div class="section-head" style="margin-bottom:4px"><h1 style="font-size:30px">🗺️ 我的圣经旅程</h1></div>
    <p style="color:var(--muted)">一个账号，从创世记1章开始，一直走到启示录22章。进度保存在本机浏览器。</p>
    <div class="stats-grid">
      <div class="card stat-card"><div class="sc-emoji">📚</div><b>${booksCompleted()}</b><span>已完成 / 66卷</span></div>
      <div class="card stat-card"><div class="sc-emoji">📖</div><b>${done}</b><span>已学习 / 1189章</span></div>
      <div class="card stat-card"><div class="sc-emoji">⏱</div><b>${fmtMinutes(totalMinutes())}</b><span>累计学习时间</span></div>
      <div class="card stat-card"><div class="sc-emoji">🔥</div><b>${streakDays()}</b><span>连续学习 / 天</span></div>
    </div>
    <div class="journey-map">
      <div class="section-head"><h2>📈 整体进度</h2><span class="sub">${done} / 1189 章 · ${pct.toFixed(1)}%</span></div>
      <div class="card" style="padding:24px">
        <div class="progress-track"><i style="width:${pct.toFixed(2)}%"></i></div>
        <div style="display:flex;gap:14px;margin-top:16px;flex-wrap:wrap">
          <a class="btn gold sm" href="#/start">🟢 从头开始（创世记 → 启示录）</a>
          <a class="btn ghost sm" href="#/books">🔵 选择任意一卷</a>
          <a class="btn ghost sm" href="#/themes">🟠 从主题进入</a>
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
      <div><b>${t[0]}</b><span style="color:var(--muted);font-size:13px">${t[1]}</span></div>
    </div>`).join('') + '</div>';
  app.innerHTML = `
  <div class="container" style="padding-top:40px">
    <div class="section-head" style="margin-bottom:4px"><h1 style="font-size:30px">🧭 四种查经模式</h1></div>
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
      <div style="font-size:56px">🟢</div>
      <h1 style="font-size:28px;margin:10px 0 6px">从头开始 · 创世记 → 启示录</h1>
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
        <span>66卷目录</span><span>分卷学习主页</span><span>章节七步互动</span><span>主题地图</span><span>人物地图</span><span>学习进度</span>
      </div>
      <div style="margin-top:12px;opacity:.8">数据仅供学习参考 · 圣经经文请以纸质/权威译本为准</div>
      <div style="margin-top:14px"><a href="./index.html" style="color:var(--gold-deep);font-weight:700">← 返回隐藏的珍宝首页</a></div>
    </div>
  </footer>`;
}

/* ---------- 启动 ---------- */
function init() {
  document.getElementById('app').innerHTML = '';
  window.addEventListener('hashchange', render);
  render();
  const footer = document.getElementById('site-footer');
  if (footer) footer.innerHTML = renderFooter();
}
document.addEventListener('DOMContentLoaded', init);

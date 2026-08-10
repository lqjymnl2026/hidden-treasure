# 隐藏的珍宝｜GitHub Copilot 项目指令

本文件是 GitHub Copilot 的项目级自定义指令，帮助 Copilot 了解项目背景与编码规范，
从而给出更准确、更符合项目习惯的代码建议。

## 项目简介

「隐藏的珍宝」是一个**纯前端静态网站**（零依赖、零构建、零后端），
提供 66 卷圣经的互动式查经学习功能，全中文界面。

- 部署方式：GitHub Pages（仓库根目录直接作为站点根目录）
- 技术栈：原生 HTML + CSS + 原生 JavaScript（ES6，无框架、无打包器）
- 核心页面：
  - `index.html`：着陆页/首页
  - `platform.html`：主学习平台（单页应用外壳，所有路由都在这里）
  - `study.html`：旧版学习平台外壳（与 platform.html 保持同步）
  - `整本圣经知识问答闯关_手机版.html`：独立的知识问答闯关页
- 核心代码：
  - `js/app.js`：应用核心逻辑（路由、渲染、进度存储、朗读、录音、问答、报告、儿童乐园等）
  - `js/data/*.js`：纯数据层（66卷圣经、章节主题、经文讲解、主题地图、人物地图、每日金句、儿童故事、趣味游戏）
  - `css/style.css`：全局样式
  - `music/light-ambient.wav`：背景钢琴轻音乐（自动生成）

## 架构约定

1. **路由**：使用 hash 路由，格式为 `#/chapter/{bookId}/{chapterNum}`、`#/book/{bookId}`、
   `#/themes`、`#/people`、`#/kids`、`#/games` 等，由 `js/app.js` 的 `parseHash()` / `render()` 处理。
2. **数据流**：数据层（`js/data/*.js` 的全局常量，如 `BOOKS`、`THEMES`、`PEOPLE`、`KIDS_STORIES`）
   由 `platform.html` 按顺序 `<script>` 引入；`js/app.js` 最后加载。
3. **用户进度**：保存在浏览器 `localStorage`，主键为 `yiqi-bible-progress-v1`（`store` 对象）；
   儿童乐园贴纸用 `yiqi-kids-stickers-v1`，儿童进度用 `yiqi-kids-progress-v1`。
4. **经文章节全文**：运行时通过 `https://api.getbible.net/v2/cus/{book_nr}/{chapter}.json`
   在线获取（和合本简体），并缓存在 localStorage（`yiqi-bibletext-cache-v1` / `yiqi-bibletext-raw-v1`）。
5. **朗读（TTS）**：优先使用浏览器 `speechSynthesis`；安卓或无中文语音时自动切换到
   网络音频朗读（Google / Youdao TTS 接口），失败再回退系统朗读。相关函数在 `js/app.js`
   的「朗读引擎」段落（`ttsSpeak` / `ttsActive` / `ttsStop` 等）。
6. **音频**：背景音乐 `<audio id="bgMusic">`，录音使用 `MediaRecorder`（WebM/Opus），
   导出用 Blob URL；录音时自动暂停背景音乐。

## 编码规范

- 全部使用**中文注释**和中文 UI 文案；命名使用英文驼峰（如 `renderChapter`、`chKey`）。
- 保持**无构建、无依赖**：新增功能只能使用浏览器原生 API，不要引入 npm 包或 CDN 框架。
- 交互函数若被 HTML `onclick` 调用，必须挂到 `window` 上（如 `window.startChapterQuiz = ...`）。
- 所有 HTML 内容生成必须经过 `esc()` 转义，防止注入与显示错乱。
- 样式：使用 `css/style.css` 中已有的 CSS 变量（`--ink`、`--gold`、`--indigo`、`--paper` 等）
  与 `.card`、`.btn`、`.section` 等既有组件，保持视觉统一；新增组件注意移动端适配。
- 修改 `platform.html` / `study.html` / `index.html` 时，两个平台外壳必须保持一致；
  资源版本号（如 `?v=20260809-01`）在发布更新时同步递增，避免浏览器缓存旧文件。
- 保持页面性能：经文全文朗读需分块（`chunkText`，450 字符/块系统朗读、160 字符/块网络音频）。

## 禁止事项

- 不要引入后端/数据库/第三方登录依赖（项目是纯静态站点）。
- 不要覆盖用户的 localStorage 数据结构；新增字段时要向后兼容（读取时做空值判断）。
- 不要在代码里写入任何真实 API Key（AI 相关配置由用户在页面设置里自行填写并仅存于浏览器）。

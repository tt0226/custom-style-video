'use strict';

const http = require('http');
const { execFile } = require('child_process');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const Anthropic = require('@anthropic-ai/sdk');
const client = new Anthropic.default();

const PORT = process.env.PORT || 3001;
const OUT_DIR = path.join(__dirname, 'out');
const OUTPUT_FILE = path.join(OUT_DIR, 'output.mp4');
const REMOTION_BIN = path.join(__dirname, 'node_modules', '.bin', 'remotion');

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

// ─── Shared CSS ───────────────────────────────────────────────────────────────
function baseStyles() {
  return `
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', sans-serif; background: #07070f; min-height: 100vh; color: #eee; padding: 32px 16px; }
    .wrap { max-width: 760px; margin: 0 auto; }
    h1 { color: #fff; font-size: 26px; font-weight: 800; letter-spacing: -0.03em; margin-bottom: 6px; }
    .sub { color: #555; font-size: 13px; margin-bottom: 28px; line-height: 1.6; }
    .back { display: inline-flex; align-items: center; gap: 6px; color: #7c6ef7; font-size: 13px; text-decoration: none; margin-bottom: 20px; }
    .back:hover { color: #a899ff; }
    .card { background: #13131e; border: 1px solid #23233a; border-radius: 16px; padding: 28px; margin-bottom: 20px; }
    .section-title { font-size: 11px; font-weight: 700; color: #7c6ef7; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 14px; }
    label { display: block; font-size: 11px; font-weight: 700; color: #555; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 6px; margin-top: 16px; }
    label:first-child { margin-top: 0; }
    input[type=text], textarea { width: 100%; background: #07070f; border: 1.5px solid #23233a; border-radius: 10px; color: #eee; font-size: 14px; padding: 10px 14px; outline: none; font-family: inherit; line-height: 1.7; transition: border-color 0.2s; }
    input[type=text]:focus, textarea:focus { border-color: #7c6ef7; }
    input[type=color] { width: 48px; height: 36px; border: 1.5px solid #23233a; border-radius: 8px; background: #07070f; cursor: pointer; padding: 2px; }
    input[type=range] { width: 100%; accent-color: #7c6ef7; margin: 6px 0; }
    .color-row { display: flex; align-items: center; gap: 10px; margin-top: 6px; }
    .color-row span { font-size: 13px; color: #888; font-family: monospace; }
    .colors { display: flex; gap: 32px; flex-wrap: wrap; }
    .row { display: flex; gap: 16px; }
    .row > * { flex: 1; }
    .btn { display: inline-block; padding: 13px 28px; margin-top: 20px; background: linear-gradient(135deg, #7c6ef7, #a855f7); color: #fff; border: none; border-radius: 10px; font-size: 15px; font-weight: 700; cursor: pointer; transition: opacity 0.2s, transform 0.1s; text-decoration: none; }
    .btn:hover:not(:disabled) { opacity: 0.9; }
    .btn:active:not(:disabled) { transform: scale(0.98); }
    .btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .btn-full { width: 100%; display: block; text-align: center; }
    .btn-sm { padding: 7px 16px; font-size: 13px; margin-top: 12px; }
    .status { margin-top: 18px; padding: 14px 18px; border-radius: 10px; font-size: 14px; display: none; }
    .status.loading { background: #12102a; color: #9d8ff7; display: flex; align-items: center; gap: 12px; }
    .status.done { background: #0b1f0f; color: #4ade80; display: block; }
    .status.error { background: #1f0b0b; color: #f87171; display: block; }
    .spinner { width: 16px; height: 16px; flex-shrink: 0; border: 2px solid currentColor; border-top-color: transparent; border-radius: 50%; animation: spin 0.7s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .dl { display: inline-flex; align-items: center; gap: 8px; margin-top: 12px; padding: 12px 24px; background: #4ade80; color: #051a0d; text-decoration: none; border-radius: 8px; font-size: 15px; font-weight: 700; }
    .chips { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px; }
    .chip { padding: 5px 13px; background: #12122a; border: 1px solid #252548; border-radius: 20px; color: #7c7ca0; font-size: 12px; cursor: pointer; transition: all 0.15s; white-space: nowrap; }
    .chip:hover { background: #1e1e40; color: #ccc; border-color: #7c6ef7; }
    .slide-item { background: #0d0d1a; border: 1px solid #1e1e3a; border-radius: 12px; padding: 16px; margin-top: 12px; position: relative; }
    .slide-item label { margin-top: 10px; }
    .slide-item label:first-of-type { margin-top: 0; }
    .slide-num { font-size: 11px; color: #555; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 10px; }
    .remove-btn { position: absolute; top: 12px; right: 12px; background: #1f0b0b; color: #f87171; border: none; border-radius: 6px; padding: 4px 10px; font-size: 12px; cursor: pointer; }
    .remove-btn:hover { background: #2d1010; }
  `;
}

// ─── Shared polling script ────────────────────────────────────────────────────
function pollScript() {
  return `
    var timer = null;
    function poll() {
      fetch('/status').then(function(r){ return r.json(); }).then(function(res) {
        var msgEl = document.getElementById('msg');
        if (msgEl) msgEl.textContent = res.step || '处理中…';
        if (res.status === 'done') {
          clearInterval(timer);
          var s = document.getElementById('status');
          s.className = 'status done';
          s.innerHTML = '&#10003; ' + res.step;
          document.getElementById('dl').style.display = 'inline-flex';
          document.getElementById('btn').disabled = false;
          var vp = document.getElementById('preview');
          if (vp) { vp.src = '/preview?t=' + Date.now(); vp.style.display = 'block'; }
        } else if (res.status === 'error') {
          clearInterval(timer);
          var s = document.getElementById('status');
          s.className = 'status error';
          s.innerHTML = '&#10007; ' + (res.error || '渲染失败');
          document.getElementById('btn').disabled = false;
        }
      });
    }
    function startPolling() {
      document.getElementById('btn').disabled = true;
      document.getElementById('dl').style.display = 'none';
      var vp = document.getElementById('preview');
      if (vp) { vp.style.display = 'none'; vp.src = ''; }
      var s = document.getElementById('status');
      s.className = 'status loading';
      s.innerHTML = '<div class="spinner"></div><span id="msg">正在启动…</span>';
      clearInterval(timer);
      timer = setInterval(poll, 1200);
    }
  `;
}

// ─── HTML pages ───────────────────────────────────────────────────────────────
const HOME_HTML = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>视频生成器</title>
  <style>
    ${baseStyles()}
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 16px; margin-top: 4px; }
    .type-card { background: #13131e; border: 1px solid #23233a; border-radius: 16px; padding: 24px; text-decoration: none; color: inherit; display: flex; flex-direction: column; transition: border-color 0.2s, transform 0.15s; }
    .type-card:hover { border-color: #7c6ef7; transform: translateY(-2px); }
    .type-icon { font-size: 30px; margin-bottom: 12px; }
    .type-title { font-size: 16px; font-weight: 700; color: #fff; margin-bottom: 6px; }
    .type-desc { font-size: 13px; color: #555; line-height: 1.7; flex: 1; }
    .type-action { margin-top: 18px; font-size: 13px; color: #7c6ef7; font-weight: 600; }
  </style>
</head>
<body>
<div class="wrap">
  <h1>视频生成器</h1>
  <p class="sub">选择一种视频类型，填写参数后自动渲染，完成后下载 MP4</p>
  <div class="grid">
    <a href="/text" class="type-card">
      <div class="type-icon">&#10024;</div>
      <div class="type-title">AI 文字视频</div>
      <div class="type-desc">输入一句描述，AI 自动生成文字内容和配色，适合励志、祝福、宣传等场景。</div>
      <div class="type-action">开始制作 &rarr;</div>
    </a>
    <a href="/ecommerce" class="type-card">
      <div class="type-icon">&#128717;</div>
      <div class="type-title">电商广告视频</div>
      <div class="type-desc">填写产品信息、价格、特点和图片，生成专业的电商促销广告视频（15 秒）。</div>
      <div class="type-action">开始制作 &rarr;</div>
    </a>
    <a href="/slide" class="type-card">
      <div class="type-icon">&#128444;</div>
      <div class="type-title">图片轮播视频</div>
      <div class="type-desc">多张图片配文字，生成带 Ken Burns 效果的图片轮播视频（每张 3 秒）。</div>
      <div class="type-action">开始制作 &rarr;</div>
    </a>
  </div>
</div>
</body>
</html>`;

const TEXT_HTML = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AI 文字视频 - 视频生成器</title>
  <style>${baseStyles()}</style>
</head>
<body>
<div class="wrap">
  <a href="/" class="back">&larr; 返回首页</a>
  <h1>&#10024; AI 文字视频</h1>
  <p class="sub">输入一句描述，AI 自动生成文字内容和配色，每幕 3 秒</p>
  <div class="card">
    <form id="form">
      <label>描述你想要的视频</label>
      <textarea id="prompt" placeholder="例如：生成一个拜年视频" rows="3"></textarea>
      <div class="chips">
        <span class="chip" data-v="生成一个喜庆的拜年视频">&#129303; 拜年</span>
        <span class="chip" data-v="做一个励志奋斗的视频">&#128170; 励志</span>
        <span class="chip" data-v="生成一个生日快乐视频">&#127874; 生日</span>
        <span class="chip" data-v="旅行探索大自然">&#9992; 旅行</span>
        <span class="chip" data-v="浪漫的爱情视频">&#128149; 爱情</span>
        <span class="chip" data-v="毕业季青春不散场">&#127891; 毕业</span>
        <span class="chip" data-v="运动健身燃烧吧">&#127939; 运动</span>
        <span class="chip" data-v="美食舌尖上的享受">&#127964; 美食</span>
      </div>
      <label style="margin-top:16px;">背景音乐 URL（可选，留空则无音乐）</label>
      <input type="text" id="musicUrl" placeholder="https://example.com/music.mp3" />
      <button type="submit" class="btn btn-full" id="btn">生成视频</button>
    </form>
    <div class="status" id="status">
      <div class="spinner"></div>
      <span id="msg"></span>
    </div>
    <a href="/download" class="dl" id="dl" download="text-video.mp4" style="display:none">&#11015; 下载视频</a>
    <video id="preview" controls preload="none" style="display:none;width:100%;margin-top:16px;border-radius:12px;background:#000;"></video>
  </div>
</div>
<script>
  ${pollScript()}
  document.querySelectorAll('.chip').forEach(function(c) {
    c.addEventListener('click', function() { document.getElementById('prompt').value = c.dataset.v; });
  });
  document.getElementById('form').addEventListener('submit', function(e) {
    e.preventDefault();
    var prompt = document.getElementById('prompt').value.trim();
    if (!prompt) return;
    var musicUrl = document.getElementById('musicUrl').value.trim();
    startPolling();
    fetch('/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: prompt, musicUrl: musicUrl || undefined }) });
    timer = setInterval(poll, 1200);
  });
</script>
</body>
</html>`;

const ECOMMERCE_HTML = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>电商广告视频 - 视频生成器</title>
  <style>${baseStyles()}</style>
</head>
<body>
<div class="wrap">
  <a href="/" class="back">&larr; 返回首页</a>
  <h1>&#128717; 电商广告视频</h1>
  <p class="sub">填写产品信息，生成 15 秒专业电商广告视频（1920&times;1080，30fps）</p>
  <form id="form">
    <div class="card">
      <p class="section-title">品牌信息</p>
      <label>品牌名称</label>
      <input type="text" name="brandName" value="潮流旗舰店" />
      <label>品牌标语</label>
      <input type="text" name="tagline" value="品质生活 · 从这里开始" />
    </div>

    <div class="card">
      <p class="section-title">产品信息</p>
      <label>产品名称</label>
      <input type="text" name="productName" value="轻薄透气运动夹克" />
      <label>产品描述（支持换行）</label>
      <textarea name="productDescription" rows="2">四面弹力面料 · 防泼水涂层
适合跑步 · 健身 · 日常通勤</textarea>
      <label>产品图片 URL</label>
      <input type="text" name="productImage" placeholder="https://example.com/image.jpg" value="https://wlx-td.tos-cn-beijing.volces.com/1/materials/2026-02-11/a3f6abc73d051f41f04229cd6b58937f.jpg" />
    </div>

    <div class="card">
      <p class="section-title">价格 &amp; 行动号召</p>
      <div class="row">
        <div>
          <label>原价</label>
          <input type="text" name="originalPrice" value="&#165;599" />
        </div>
        <div>
          <label>折扣价</label>
          <input type="text" name="discountPrice" value="&#165;299" />
        </div>
        <div>
          <label>折扣标签</label>
          <input type="text" name="discountBadge" value="5折特惠" />
        </div>
      </div>
      <label>行动号召文字（CTA）</label>
      <input type="text" name="ctaText" value="立即抢购" />
    </div>

    <div class="card">
      <p class="section-title">产品特点（每行一条，最多 4 条）</p>
      <textarea name="features" rows="4">轻量科技面料，重量仅 180g
防泼水处理，应对多变天气
四面弹力，全方位自由活动
多色可选，简约百搭设计</textarea>
    </div>

    <div class="card">
      <p class="section-title">配色</p>
      <div class="colors">
        <div>
          <label>主色</label>
          <div class="color-row">
            <input type="color" name="primaryColor" value="#6366f1" oninput="document.getElementById('pct').textContent=this.value">
            <span id="pct">#6366f1</span>
          </div>
        </div>
        <div>
          <label>强调色</label>
          <div class="color-row">
            <input type="color" name="accentColor" value="#f59e0b" oninput="document.getElementById('act').textContent=this.value">
            <span id="act">#f59e0b</span>
          </div>
        </div>
        <div>
          <label>背景色</label>
          <div class="color-row">
            <input type="color" name="backgroundColor" value="#1e1b4b" oninput="document.getElementById('bct').textContent=this.value">
            <span id="bct">#1e1b4b</span>
          </div>
        </div>
      </div>
    </div>

    <div class="card">
      <p class="section-title">背景音乐（可选）</p>
      <label>音乐 URL（留空则无音乐）</label>
      <input type="text" name="musicUrl" placeholder="https://example.com/music.mp3" />
    </div>

    <button type="submit" class="btn btn-full" id="btn">生成视频（约 1-2 分钟）</button>
    <div class="status" id="status">
      <div class="spinner"></div>
      <span id="msg"></span>
    </div>
    <a href="/download" class="dl" id="dl" download="ecommerce-ad.mp4" style="display:none">&#11015; 下载视频</a>
    <video id="preview" controls preload="none" style="display:none;width:100%;margin-top:16px;border-radius:12px;background:#000;"></video>
  </form>
</div>
<script>
  ${pollScript()}
  document.getElementById('form').addEventListener('submit', function(e) {
    e.preventDefault();
    var fd = new FormData(e.target);
    var features = fd.get('features').split('\\n').map(function(s){ return s.trim(); }).filter(Boolean).slice(0, 4);
    var musicUrl = fd.get('musicUrl').trim();
    var props = {
      brandName: fd.get('brandName'),
      tagline: fd.get('tagline'),
      productName: fd.get('productName'),
      productDescription: fd.get('productDescription'),
      originalPrice: fd.get('originalPrice'),
      discountPrice: fd.get('discountPrice'),
      discountBadge: fd.get('discountBadge'),
      productImage: fd.get('productImage'),
      features: features,
      ctaText: fd.get('ctaText'),
      primaryColor: fd.get('primaryColor'),
      accentColor: fd.get('accentColor'),
      backgroundColor: fd.get('backgroundColor'),
    };
    if (musicUrl) props.musicUrl = musicUrl;
    startPolling();
    fetch('/render/ecommerce', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(props) });
  });
</script>
</body>
</html>`;

const SLIDE_HTML = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>图片轮播视频 - 视频生成器</title>
  <style>${baseStyles()}</style>
</head>
<body>
<div class="wrap">
  <a href="/" class="back">&larr; 返回首页</a>
  <h1>&#128444; 图片轮播视频</h1>
  <p class="sub">每张图片显示 3 秒，支持 Ken Burns 缩放效果和文字叠加</p>
  <form id="form">
    <div class="card">
      <p class="section-title">幻灯片（每张 3 秒）</p>
      <div id="slides">
        <div class="slide-item">
          <div class="slide-num">第 1 张</div>
          <label>文字</label>
          <input type="text" class="slide-text" value="新年快乐" />
          <label>图片 URL</label>
          <input type="text" class="slide-img" placeholder="https://example.com/image.jpg" />
        </div>
        <div class="slide-item">
          <button type="button" class="remove-btn" onclick="removeSlide(this)">删除</button>
          <div class="slide-num">第 2 张</div>
          <label>文字</label>
          <input type="text" class="slide-text" value="万事如意" />
          <label>图片 URL</label>
          <input type="text" class="slide-img" placeholder="https://example.com/image.jpg" />
        </div>
      </div>
      <button type="button" onclick="addSlide()" class="btn btn-sm">+ 添加幻灯片</button>
    </div>

    <div class="card">
      <p class="section-title">样式</p>
      <label>文字颜色</label>
      <div class="color-row">
        <input type="color" id="textColor" value="#ffffff" oninput="document.getElementById('tct').textContent=this.value">
        <span id="tct">#ffffff</span>
      </div>
      <label>遮罩深度（0 = 透明，1 = 全黑）</label>
      <input type="range" id="overlayOpacity" min="0" max="1" step="0.05" value="0.45" oninput="document.getElementById('ovv').textContent=this.value">
      <span id="ovv" style="font-size:13px;color:#888;">0.45</span>
    </div>

    <div class="card">
      <p class="section-title">背景音乐（可选）</p>
      <label>音乐 URL（留空则无音乐）</label>
      <input type="text" id="musicUrl" placeholder="https://example.com/music.mp3" />
    </div>

    <button type="submit" class="btn btn-full" id="btn">生成视频（约 1-2 分钟）</button>
    <div class="status" id="status">
      <div class="spinner"></div>
      <span id="msg"></span>
    </div>
    <a href="/download" class="dl" id="dl" download="slide-video.mp4" style="display:none">&#11015; 下载视频</a>
    <video id="preview" controls preload="none" style="display:none;width:100%;margin-top:16px;border-radius:12px;background:#000;"></video>
  </form>
</div>
<script>
  ${pollScript()}
  var slideCount = 2;
  function addSlide() {
    slideCount++;
    var div = document.createElement('div');
    div.className = 'slide-item';
    div.innerHTML = '<button type="button" class="remove-btn" onclick="removeSlide(this)">删除</button>' +
      '<div class="slide-num">第 ' + slideCount + ' 张</div>' +
      '<label>文字</label>' +
      '<input type="text" class="slide-text" value="" />' +
      '<label>图片 URL</label>' +
      '<input type="text" class="slide-img" placeholder="https://example.com/image.jpg" />';
    document.getElementById('slides').appendChild(div);
    renumber();
  }
  function removeSlide(btn) {
    var items = document.querySelectorAll('.slide-item');
    if (items.length <= 1) return;
    btn.closest('.slide-item').remove();
    renumber();
  }
  function renumber() {
    document.querySelectorAll('.slide-item .slide-num').forEach(function(el, i) {
      el.textContent = '第 ' + (i + 1) + ' 张';
    });
  }
  document.getElementById('form').addEventListener('submit', function(e) {
    e.preventDefault();
    var texts = Array.from(document.querySelectorAll('.slide-text')).map(function(i){ return i.value.trim(); });
    var imgs  = Array.from(document.querySelectorAll('.slide-img')).map(function(i){ return i.value.trim(); });
    var slides = texts.map(function(text, i){ return { text: text, imageFile: imgs[i] || '' }; });
    var musicUrl = document.getElementById('musicUrl').value.trim();
    var props = {
      slides: slides,
      textColor: document.getElementById('textColor').value,
      overlayOpacity: parseFloat(document.getElementById('overlayOpacity').value),
    };
    if (musicUrl) props.musicUrl = musicUrl;
    startPolling();
    fetch('/render/slide', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(props) });
  });
</script>
</body>
</html>`;

// ─── Job state ────────────────────────────────────────────────────────────────
let job = { status: 'idle', step: '', error: '' };

function runRender(composition, props) {
  const args = ['render', composition, '--props', JSON.stringify(props), '--output', OUTPUT_FILE, '--overwrite'];
  if (process.env.BROWSER_EXECUTABLE) {
    args.push('--browser-executable', process.env.BROWSER_EXECUTABLE);
  }
  return new Promise((resolve, reject) => {
    execFile(
      REMOTION_BIN,
      args,
      { cwd: __dirname, timeout: 600_000 },
      (err, _stdout, stderr) => {
        if (err) reject(new Error(stderr || err.message));
        else resolve();
      },
    );
  });
}

// ─── AI theme generation (TextVideo) ─────────────────────────────────────────
async function generateTheme(prompt) {
  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 512,
    messages: [{
      role: 'user',
      content: `根据用户的描述，生成一个动态视频的内容方案。

用户描述：${prompt}

请直接返回 JSON，不要加任何解释或代码块，格式如下：
{
  "lines": ["第一幕文字", "第二幕文字", "第三幕文字", "第四幕文字", "第五幕文字"],
  "textColor": "#ffffff",
  "accentColor": "#颜色十六进制",
  "backgroundColor": "#颜色十六进制"
}

要求：
- lines 数组包含 4-6 条文字，每条 2-10 个字，简洁有力
- 颜色风格要贴合主题（如喜庆用红橙，科技用蓝紫，自然用绿色）
- backgroundColor 要深色（亮度低），accentColor 要鲜艳突出
- 只返回 JSON，不要任何其他文字`,
    }],
  });
  return JSON.parse(message.content[0].text.trim());
}

async function processTextJob(prompt, musicUrl) {
  try {
    job.step = 'AI 生成视频方案…';
    const theme = await generateTheme(prompt);
    job.step = '渲染视频（' + theme.lines.length + ' 幕）…';
    const props = {
      lines: theme.lines,
      textColor: theme.textColor,
      accentColor: theme.accentColor,
      backgroundColor: theme.backgroundColor,
    };
    if (musicUrl) props.musicUrl = musicUrl;
    await runRender('TextVideo', props);
    job.status = 'done';
    job.step = '完成！共 ' + theme.lines.length + ' 幕，时长 ' + (theme.lines.length * 3) + ' 秒';
  } catch (err) {
    job.status = 'error';
    job.error = err.message;
  }
}

async function processRenderJob(composition, props, label) {
  try {
    job.step = '渲染' + label + '中，请稍候…';
    await runRender(composition, props);
    job.status = 'done';
    job.step = label + '渲染完成！';
  } catch (err) {
    job.status = 'error';
    job.error = err.message;
  }
}

// ─── HTTP Server ──────────────────────────────────────────────────────────────
const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  // ── Pages ──
  if (req.method === 'GET' && url.pathname === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    return res.end(HOME_HTML);
  }
  if (req.method === 'GET' && url.pathname === '/text') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    return res.end(TEXT_HTML);
  }
  if (req.method === 'GET' && url.pathname === '/ecommerce') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    return res.end(ECOMMERCE_HTML);
  }
  if (req.method === 'GET' && url.pathname === '/slide') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    return res.end(SLIDE_HTML);
  }

  // ── Render: TextVideo (AI) ──
  if (req.method === 'POST' && url.pathname === '/generate') {
    if (job.status === 'working') {
      res.writeHead(429, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: '正在处理，请稍候' }));
    }
    let body = '';
    req.on('data', c => { body += c; });
    req.on('end', () => {
      const parsed = JSON.parse(body);
      const prompt = String(parsed.prompt || '').slice(0, 300).trim();
      const musicUrl = String(parsed.musicUrl || '').trim() || undefined;
      if (!prompt) { res.writeHead(400); return res.end('{}'); }
      job = { status: 'working', step: '正在启动…', error: '' };
      processTextJob(prompt, musicUrl);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true }));
    });
    return;
  }

  // ── Render: EcommerceAd ──
  if (req.method === 'POST' && url.pathname === '/render/ecommerce') {
    if (job.status === 'working') {
      res.writeHead(429, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: '正在处理，请稍候' }));
    }
    let body = '';
    req.on('data', c => { body += c; });
    req.on('end', () => {
      const props = JSON.parse(body);
      job = { status: 'working', step: '正在启动…', error: '' };
      processRenderJob('EcommerceAd', props, '电商广告');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true }));
    });
    return;
  }

  // ── Render: SlideVideo ──
  if (req.method === 'POST' && url.pathname === '/render/slide') {
    if (job.status === 'working') {
      res.writeHead(429, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: '正在处理，请稍候' }));
    }
    let body = '';
    req.on('data', c => { body += c; });
    req.on('end', () => {
      const props = JSON.parse(body);
      job = { status: 'working', step: '正在启动…', error: '' };
      processRenderJob('SlideVideo', props, '图片轮播');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true }));
    });
    return;
  }

  // ── Status ──
  if (req.method === 'GET' && url.pathname === '/status') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify(job));
  }

  // ── Preview (supports Range for seeking) ──
  if (req.method === 'GET' && url.pathname === '/preview') {
    if (!fs.existsSync(OUTPUT_FILE)) {
      res.writeHead(404); return res.end('{}');
    }
    const stat = fs.statSync(OUTPUT_FILE);
    const fileSize = stat.size;
    const range = req.headers.range;
    if (range) {
      const [startStr, endStr] = range.replace(/bytes=/, '').split('-');
      const start = parseInt(startStr, 10);
      const end = endStr ? parseInt(endStr, 10) : fileSize - 1;
      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': end - start + 1,
        'Content-Type': 'video/mp4',
      });
      return fs.createReadStream(OUTPUT_FILE, { start, end }).pipe(res);
    }
    res.writeHead(200, {
      'Content-Type': 'video/mp4',
      'Content-Length': fileSize,
      'Accept-Ranges': 'bytes',
    });
    return fs.createReadStream(OUTPUT_FILE).pipe(res);
  }

  // ── Download ──
  if (req.method === 'GET' && url.pathname === '/download') {
    if (!fs.existsSync(OUTPUT_FILE)) {
      res.writeHead(404); return res.end('{}');
    }
    const stat = fs.statSync(OUTPUT_FILE);
    res.writeHead(200, {
      'Content-Type': 'video/mp4',
      'Content-Length': stat.size,
      'Content-Disposition': 'attachment; filename="video.mp4"',
    });
    return fs.createReadStream(OUTPUT_FILE).pipe(res);
  }

  res.writeHead(404); res.end('{}');
});

server.listen(PORT, () => {
  console.log('视频生成器已启动：http://localhost:' + PORT);
});

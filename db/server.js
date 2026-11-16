/**
 * 功能名称: 诗词图文数据服务器
 * 作者: 冯玺成
 * 建立时间: 2026-11-12
 * 使用模型: DeepSeek-V4.1-Flash
 * 功能简介: 基于 Express 的本地数据服务器，端口 3005；
 *   提供 /api/poems 接口返回 db.json 中的 poems 数组；
 *   同时将 db 目录作为静态资源根，使 poems.image 指向的图片可直接访问。
 *   启动方式：在 db 目录下执行 node server.js
 */

const fxc_express = require('express');
const fxc_fs = require('fs');
const fxc_path = require('path');

const fxc_app = fxc_express();
const fxc_PORT = 3005;

// ==== 读取 db.json 缓存一次 ====
const fxc_dbPath = fxc_path.join(__dirname, 'db.json');
let fxc_poems = [];
try {
  const fxc_raw = fxc_fs.readFileSync(fxc_dbPath, 'utf-8');
  fxc_poems = JSON.parse(fxc_raw).poems || [];
  console.log(`[server] 已加载 ${fxc_poems.length} 条诗歌数据`);
} catch (fxc_err) {
  console.error('[server] 读取 db.json 失败：', fxc_err.message);
}

// ==== 允许跨域（页面从任意源访问接口都 OK）====
fxc_app.use((fxc_req, fxc_res, fxc_next) => {
  fxc_res.setHeader('Access-Control-Allow-Origin', '*');
  fxc_res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  fxc_next();
});

// ==== 静态资源：db 目录下的 images/ 等文件可直接访问 ====
fxc_app.use(fxc_express.static(__dirname));

// ==== 接口：GET /api/poems 返回诗歌数组 ====
fxc_app.get('/api/poems', (fxc_req, fxc_res) => {
  fxc_res.json({
    code: 0,
    message: 'ok',
    data: fxc_poems
  });
});

// ==== 接口：GET /api/poems/:id 返回单条（id 从 1 开始）====
fxc_app.get('/api/poems/:id', (fxc_req, fxc_res) => {
  const fxc_idx = parseInt(fxc_req.params.id, 10) - 1;
  if (fxc_idx < 0 || fxc_idx >= fxc_poems.length) {
    return fxc_res.status(404).json({ code: 404, message: '未找到对应条目' });
  }
  fxc_res.json({ code: 0, message: 'ok', data: fxc_poems[fxc_idx] });
});

// ==== 启动 ====
fxc_app.listen(fxc_PORT, () => {
  console.log(`[server] 数据服务器已启动 → http://localhost:${fxc_PORT}`);
  console.log(`[server] 接口示例  → http://localhost:${fxc_PORT}/api/poems`);
});

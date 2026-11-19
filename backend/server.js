/**
 * 姓名：【冯玺成】 | 学号：【24001010403】 |
 * 时间：2026-11-19 | 大模型：DeepSeek-V4.1-Flash
 *
 * 功能简介：后端服务入口。装配 cors 跨域、JSON 解析、/api 路由与
 *   frontend/ 静态资源托管，监听端口 8403。
 */
const fxc_path = require('path');
const fxc_express = require('express');
const fxc_cors = require('cors');

const fxc_app = fxc_express();
const fxc_PORT = 8403;

// 课程作业用途：开放全部跨域访问
fxc_app.use(fxc_cors());
fxc_app.use(fxc_express.json());
fxc_app.use(fxc_express.urlencoded({ extended: true }));

// 静态资源：托管 frontend/ 目录，页面通过 http://localhost:8403/ 访问
fxc_app.use(fxc_express.static(fxc_path.join(__dirname, '..', 'frontend')));

// 业务路由统一挂载在 /api 前缀下
fxc_app.use('/api', require('./routes/fxc_index'));

// 兜底 404：统一 JSON 响应格式
fxc_app.use((fxc_req, fxc_res) => {
  fxc_res.status(404).json({ code: 404, msg: '接口不存在', data: null });
});

// 全局错误处理：把异常收敛成统一 JSON，避免返回 HTML 错误页
fxc_app.use((fxc_err, fxc_req, fxc_res, fxc_next) => {
  console.error('[api] 未捕获异常：', fxc_err.message);
  fxc_res.status(500).json({ code: 500, msg: '服务器内部错误', data: null });
});

fxc_app.listen(fxc_PORT, () => {
  console.log(`[server] 服务已启动 → http://localhost:${fxc_PORT}`);
  console.log(`[server] 健康检查 → http://localhost:${fxc_PORT}/api/health`);
});

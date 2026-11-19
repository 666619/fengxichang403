/**
 * 姓名：【冯玺成】 | 学号：【24001010403】 |
 * 时间：2026-11-19 | 大模型：DeepSeek-V4.1-Flash
 *
 * 功能简介：/api 路由汇总入口。集中注册各业务路由，保持 controller 与 model 分离。
 */
const fxc_express = require('express');
const fxc_router = fxc_express.Router();

const fxc_healthController = require('../controllers/fxc_healthController');
const fxc_poemsController = require('../controllers/fxc_poemsController');

// 健康检查：确认服务存活
fxc_router.get('/health', fxc_healthController.fxc_health);

// 诗词列表：演示 RESTful + MVC 的完整链路（route → controller → model）
fxc_router.get('/poems', fxc_poemsController.fxc_list);

module.exports = fxc_router;

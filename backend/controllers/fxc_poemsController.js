/**
 * 姓名：【冯玺成】 | 学号：【24001010403】 |
 * 时间：2026-11-19 | 大模型：DeepSeek-V4.1-Flash
 *
 * 功能简介：诗词控制器。调用模型层取数据，按统一格式 { code, msg, data } 返回。
 */
const fxc_poemsModel = require('../models/fxc_poemsModel');

/**
 * GET /api/poems —— 返回全部诗词，附带总条数。
 */
function fxc_list(fxc_req, fxc_res) {
  const fxc_list = fxc_poemsModel.fxc_findAll();
  fxc_res.json({
    code: 0,
    msg: 'ok',
    data: {
      fxc_total: fxc_list.length,
      fxc_list: fxc_list
    }
  });
}

module.exports = { fxc_list };

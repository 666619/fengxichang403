/**
 * 姓名：【冯玺成】 | 学号：【24001010403】 |
 * 时间：2026-11-19 | 大模型：DeepSeek-V4.1-Flash
 *
 * 功能简介：图文列表控制器。调用模型层读取 fxc_gallery，按统一格式返回列表与总数。
 */
const fxc_galleryModel = require('../models/fxc_galleryModel');

/**
 * GET /api/gallery —— 返回全部图文记录。
 */
async function fxc_list(fxc_req, fxc_res) {
  try {
    const fxc_list = await fxc_galleryModel.fxc_findAll();
    fxc_res.json({
      code: 0,
      msg: 'ok',
      data: {
        fxc_total: fxc_list.length,
        fxc_list: fxc_list
      }
    });
  } catch (fxc_err) {
    console.error('[gallery] 查询失败：' + fxc_err.message);
    fxc_res.json({
      code: 1,
      msg: '图文查询失败：' + fxc_err.message,
      data: null
    });
  }
}

module.exports = { fxc_list };

/**
 * 姓名：【冯玺成】 | 学号：【24001010403】 |
 * 时间：2026-11-19 | 大模型：DeepSeek-V4.1-Flash
 *
 * 功能简介：图文列表数据模型。从 MySQL 的 fxc_gallery 表按录入时间倒序读取记录。
 */
const fxc_pool = require('../config/fxc_db');

/**
 * 查询全部图文记录，按录入时间从新到旧排序。
 * @returns {Promise<Array>} 图文记录数组
 */
async function fxc_findAll() {
  const [fxc_rows] = await fxc_pool.query(
    'SELECT id, title, description, img_url, category, create_time ' +
    'FROM fxc_gallery ORDER BY create_time DESC'
  );
  return fxc_rows;
}

module.exports = { fxc_findAll };

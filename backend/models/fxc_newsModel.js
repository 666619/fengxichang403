/**
 * 姓名：【冯玺成】 | 学号：【24001010403】 |
 * 时间：2026-11-19 | 大模型：DeepSeek-V4.1-Flash
 *
 * 功能简介：科技新闻数据模型。从 MySQL 的 fxc_news 表按发布时间倒序读取新闻列表。
 */
const fxc_pool = require('../config/fxc_db');

/**
 * 查询全部新闻，按发布时间从新到旧排序。
 * @returns {Promise<Array>} 新闻记录数组
 */
async function fxc_findAll() {
  const [fxc_rows] = await fxc_pool.query(
    'SELECT id, title, summary, content, source, publish_time, cover_img ' +
    'FROM fxc_news ORDER BY publish_time DESC'
  );
  return fxc_rows;
}

module.exports = { fxc_findAll };

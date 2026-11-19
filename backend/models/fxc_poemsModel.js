/**
 * 姓名：【冯玺成】 | 学号：【24001010403】 |
 * 时间：2026-11-19 | 大模型：DeepSeek-V4.1-Flash
 *
 * 功能简介：诗词数据模型。读取项目根目录 db/db.json 中的 poems 数组，
 *   作为 /api/poems 接口的数据来源，避免骨架阶段依赖数据库即可跑通。
 */
const fxc_fs = require('fs');
const fxc_path = require('path');

const fxc_dbFile = fxc_path.join(__dirname, '..', '..', 'db', 'db.json');

/**
 * 读取全部诗词记录；文件缺失或解析失败时返回空数组，避免接口整体 500。
 */
function fxc_findAll() {
  try {
    const fxc_raw = fxc_fs.readFileSync(fxc_dbFile, 'utf-8');
    const fxc_json = JSON.parse(fxc_raw);
    return Array.isArray(fxc_json.poems) ? fxc_json.poems : [];
  } catch (fxc_err) {
    console.error('[model] 读取 db.json 失败：', fxc_err.message);
    return [];
  }
}

module.exports = { fxc_findAll };

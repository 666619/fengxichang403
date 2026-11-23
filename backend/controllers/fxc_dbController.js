/**
 * 姓名：【冯玺成】 | 学号：【24001010403】 |
 * 时间：2026-11-19 | 大模型：DeepSeek-V4.1-Flash
 *
 * 功能简介：数据库连通性测试控制器。用请求体传入的账号密码（缺省时回落到
 *   backend/.env 的配置）建立一次性 mysql2 连接，查询 VERSION() 后立即关闭连接，
 *   按统一格式返回版本号或错误信息。代码中不出现任何明文凭据。
 */
const fxc_mysql = require('mysql2/promise');
const fxc_path = require('path');

require('dotenv').config({ path: fxc_path.join(__dirname, '..', '.env') });

/**
 * POST /api/db-test —— 尝试连接 MySQL 并返回数据库版本。
 */
async function fxc_test(fxc_req, fxc_res) {
  const fxc_body = fxc_req.body || {};

  // 优先使用页面传入的值，未填则回落到 .env；host 与库名只取 .env
  const fxc_user = fxc_body.user || process.env.DB_USER;
  const fxc_password = fxc_body.password || process.env.DB_PASSWORD;
  const fxc_host = process.env.DB_HOST || 'localhost';
  const fxc_dbName = process.env.DB_NAME;

  let fxc_conn = null;
  try {
    fxc_conn = await fxc_mysql.createConnection({
      host: fxc_host,
      port: Number(process.env.DB_PORT) || 3306,
      user: fxc_user,
      password: fxc_password,
      database: fxc_dbName,
      connectTimeout: 5000
    });

    const [fxc_rows] = await fxc_conn.query('SELECT VERSION() AS fxc_version');
    const fxc_version = fxc_rows[0].fxc_version;

    console.log('[db-test] 连接成功，MySQL 版本：' + fxc_version);
    fxc_res.json({
      code: 0,
      msg: '数据库连接成功',
      data: {
        fxc_version: fxc_version,
        fxc_host: fxc_host,
        fxc_database: fxc_dbName
      }
    });
  } catch (fxc_err) {
    console.error('[db-test] 连接失败：' + fxc_err.code + ' ' + fxc_err.message);
    fxc_res.json({
      code: 1,
      msg: '数据库连接失败：' + (fxc_err.message || '未知错误'),
      data: { fxc_errCode: fxc_err.code || 'UNKNOWN' }
    });
  } finally {
    if (fxc_conn) {
      try { await fxc_conn.end(); } catch (fxc_endErr) { /* 连接已断开时忽略 */ }
    }
  }
}

module.exports = { fxc_test };

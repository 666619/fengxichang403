/**
 * 姓名：【冯玺成】 | 学号：【24001010403】 |
 * 时间：2026-11-19 | 大模型：DeepSeek-V4.1-Flash
 *
 * 功能简介：MySQL 连接池配置。凭据从 backend/.env 读取，代码中不出现明文账号密码。
 */
const fxc_mysql = require('mysql2/promise');

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const fxc_pool = fxc_mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  charset: 'utf8mb4'
});

module.exports = fxc_pool;

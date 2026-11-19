/**
 * 姓名：【冯玺成】 | 学号：【24001010403】 |
 * 时间：2026-11-19 | 大模型：DeepSeek-V4.1-Flash
 *
 * 功能简介：健康检查控制器。返回服务运行状态与当前时间，用于确认后端已启动。
 */
function fxc_health(fxc_req, fxc_res) {
  fxc_res.json({
    code: 0,
    msg: 'ok',
    data: {
      fxc_service: 'advanced-web-design-backend',
      fxc_port: 8403,
      fxc_time: new Date().toISOString()
    }
  });
}

module.exports = { fxc_health };

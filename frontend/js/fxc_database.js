/**
 * 姓名：【冯玺成】 | 学号：【24001010403】 |
 * 时间：2026-11-19 | 大模型：DeepSeek-V4.1-Flash
 *
 * 功能简介：数据库连接测试页脚本。把表单里的用户名、密码以 JSON POST 到
 *   /api/db-test，按 code 判断成功与否，在页面上用绿色/红色提示并同步输出到控制台。
 */
(function () {
  'use strict';

  const fxc_form = document.getElementById('fxc_form');
  const fxc_btn = document.getElementById('fxc_submit');
  const fxc_result = document.getElementById('fxc_result');

  /**
   * 把结果写进页面提示条，并按成功/失败切换配色。
   * @param {boolean} fxc_okFlag - true 表示连接成功
   * @param {string} fxc_text - 要展示的文案
   */
  function fxc_showResult(fxc_okFlag, fxc_text) {
    fxc_result.textContent = fxc_text;
    fxc_result.className = 'fxc_result fxc_result_show ' + (fxc_okFlag ? 'fxc_result_ok' : 'fxc_result_bad');
  }

  /**
   * 提交表单：禁用按钮防重复点击，请求结束后无论成败都恢复按钮。
   */
  async function fxc_testConnection(fxc_event) {
    fxc_event.preventDefault();

    const fxc_user = document.getElementById('fxc_user').value.trim();
    const fxc_password = document.getElementById('fxc_password').value;

    if (!fxc_user) {
      fxc_showResult(false, '请填写用户名');
      console.error('[db-test] 用户名不能为空');
      return;
    }

    fxc_btn.disabled = true;
    fxc_showResult(true, '正在连接数据库…');
    fxc_result.className = 'fxc_result fxc_result_show';

    try {
      const fxc_resp = await fetch('/api/db-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user: fxc_user, password: fxc_password })
      });

      if (!fxc_resp.ok) {
        throw new Error('HTTP ' + fxc_resp.status);
      }

      const fxc_json = await fxc_resp.json();

      if (fxc_json.code === 0) {
        const fxc_info = fxc_json.data || {};
        const fxc_text = fxc_json.msg + '\nMySQL 版本：' + fxc_info.fxc_version +
          '\n主机：' + fxc_info.fxc_host + '　数据库：' + fxc_info.fxc_database;
        fxc_showResult(true, fxc_text);
        console.log('[db-test] 成功：', fxc_json);
      } else {
        fxc_showResult(false, fxc_json.msg);
        console.error('[db-test] 失败：', fxc_json);
      }
    } catch (fxc_err) {
      fxc_showResult(false, '请求失败：' + fxc_err.message + '\n请确认后端已在 8403 端口启动。');
      console.error('[db-test] 请求异常：', fxc_err);
    } finally {
      fxc_btn.disabled = false;
    }
  }

  fxc_form.addEventListener('submit', fxc_testConnection);
  console.log('[db-test] 页面已就绪，接口地址 /api/db-test');
})();

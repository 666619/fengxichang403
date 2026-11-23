/**
 * 姓名：【冯玺成】 | 学号：【24001010403】 |
 * 时间：2026-11-19 | 大模型：DeepSeek-V4.1-Flash
 *
 * 功能简介：科技新闻列表页脚本。请求 /api/news 获取数据库中的新闻，
 *   渲染为列表；成功与失败信息同时输出到浏览器控制台。
 */
(function () {
  'use strict';

  const fxc_API = '/api/news';
  const fxc_list = document.getElementById('fxc_list');
  const fxc_count = document.getElementById('fxc_count');

  /**
   * 把 "2026-11-18T09:20:00.000Z" 这类时间格式化为 "2026-11-18 09:20"。
   * @param {string} fxc_raw - 接口返回的发布时间
   * @returns {string} 便于阅读的时间文本
   */
  function fxc_formatTime(fxc_raw) {
    if (!fxc_raw) return '—';
    const fxc_date = new Date(fxc_raw);
    if (isNaN(fxc_date.getTime())) return String(fxc_raw);
    const fxc_pad = function (fxc_n) { return fxc_n < 10 ? '0' + fxc_n : '' + fxc_n; };
    return fxc_date.getFullYear() + '-' + fxc_pad(fxc_date.getMonth() + 1) + '-' +
      fxc_pad(fxc_date.getDate()) + ' ' + fxc_pad(fxc_date.getHours()) + ':' +
      fxc_pad(fxc_date.getMinutes());
  }

  /**
   * 转义标题与摘要中的尖括号等字符，避免插入 HTML 时破坏结构。
   */
  function fxc_escape(fxc_text) {
    return String(fxc_text == null ? '' : fxc_text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /**
   * 按数组顺序渲染新闻条目；序号保留两位，便于对照接口返回顺序。
   */
  function fxc_render(fxc_rows) {
    if (!fxc_rows.length) {
      fxc_list.innerHTML = '<div class="fxc_state">数据库中暂无新闻数据。</div>';
      return;
    }

    fxc_list.innerHTML = fxc_rows.map(function (fxc_row, fxc_index) {
      const fxc_no = fxc_index + 1 < 10 ? '0' + (fxc_index + 1) : '' + (fxc_index + 1);
      return '' +
        '<article class="fxc_item">' +
          '<div class="fxc_no">' + fxc_no + '</div>' +
          '<div class="fxc_body">' +
            '<span class="fxc_tag">' + fxc_escape(fxc_row.source) + '</span>' +
            '<h2 class="fxc_itemTitle">' + fxc_escape(fxc_row.title) + '</h2>' +
            '<p class="fxc_summary">' + fxc_escape(fxc_row.summary) + '</p>' +
            '<div class="fxc_meta">' +
              '<span>来源：' + fxc_escape(fxc_row.source) + '</span>' +
              '<span>发布：' + fxc_formatTime(fxc_row.publish_time) + '</span>' +
            '</div>' +
          '</div>' +
        '</article>';
    }).join('');
  }

  /**
   * 拉取新闻数据并在页面与控制台同步反馈结果。
   */
  async function fxc_load() {
    try {
      const fxc_resp = await fetch(fxc_API);
      if (!fxc_resp.ok) throw new Error('HTTP ' + fxc_resp.status);

      const fxc_json = await fxc_resp.json();
      if (fxc_json.code !== 0) throw new Error(fxc_json.msg || '接口返回失败');

      const fxc_rows = (fxc_json.data && fxc_json.data.fxc_list) || [];
      fxc_count.textContent = '共 ' + (fxc_json.data.fxc_total || fxc_rows.length) + ' 条';
      fxc_render(fxc_rows);
      console.log('[news] 接口返回 ' + fxc_rows.length + ' 条新闻：', fxc_rows);
    } catch (fxc_err) {
      fxc_count.textContent = '加载失败';
      fxc_list.innerHTML = '<div class="fxc_state fxc_state_bad">' +
        '获取新闻失败：' + fxc_escape(fxc_err.message) +
        '<br>请确认后端已启动（8403 端口）且 fxc_news 表已建好。</div>';
      console.error('[news] 请求失败：', fxc_err);
    }
  }

  fxc_load();
})();

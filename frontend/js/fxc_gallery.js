/**
 * 姓名：【冯玺成】 | 学号：【24001010403】 |
 * 时间：2026-11-19 | 大模型：DeepSeek-V4.1-Flash
 *
 * 功能简介：图文列表页脚本。请求 /api/gallery 获取数据库记录并渲染为图文卡片，
 *   图片加载失败时替换为内联占位图；数据与错误同时输出到浏览器控制台。
 */
(function () {
  'use strict';

  const fxc_API = '/api/gallery';
  const fxc_grid = document.getElementById('fxc_grid');
  const fxc_count = document.getElementById('fxc_count');

  // 图片缺失时使用内联 SVG 占位，避免出现破图图标
  const fxc_PLACEHOLDER = 'data:image/svg+xml;utf8,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 200">' +
    '<rect width="320" height="200" fill="#171B22"/>' +
    '<text x="160" y="105" font-size="14" fill="#6B7280" text-anchor="middle">图片暂不可用</text>' +
    '</svg>'
  );

  /**
   * 转义文本，避免标题与简介中的特殊字符破坏 HTML 结构。
   */
  function fxc_escape(fxc_text) {
    return String(fxc_text == null ? '' : fxc_text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /**
   * 把接口时间格式化为 "YYYY-MM-DD"，列表里只需到日期。
   */
  function fxc_formatDate(fxc_raw) {
    if (!fxc_raw) return '—';
    const fxc_date = new Date(fxc_raw);
    if (isNaN(fxc_date.getTime())) return String(fxc_raw);
    const fxc_pad = function (fxc_n) { return fxc_n < 10 ? '0' + fxc_n : '' + fxc_n; };
    return fxc_date.getFullYear() + '-' + fxc_pad(fxc_date.getMonth() + 1) + '-' + fxc_pad(fxc_date.getDate());
  }

  /**
   * 渲染图文卡片；每条含配图、分类标签、标题、简介与日期。
   */
  function fxc_render(fxc_rows) {
    if (!fxc_rows.length) {
      fxc_grid.innerHTML = '<div class="fxc_state">数据库中暂无图文数据。</div>';
      return;
    }

    fxc_grid.innerHTML = fxc_rows.map(function (fxc_row) {
      return '' +
        '<article class="fxc_card">' +
          '<figure class="fxc_fig">' +
            '<img class="fxc_img" src="' + fxc_escape(fxc_row.img_url) + '" alt="' +
              fxc_escape(fxc_row.title) + '" loading="lazy" data-fxc-fallback="1">' +
            '<span class="fxc_tag">' + fxc_escape(fxc_row.category) + '</span>' +
          '</figure>' +
          '<div class="fxc_body">' +
            '<h2 class="fxc_cardTitle">' + fxc_escape(fxc_row.title) + '</h2>' +
            '<p class="fxc_desc">' + fxc_escape(fxc_row.description) + '</p>' +
            '<div class="fxc_date">' + fxc_formatDate(fxc_row.create_time) + '</div>' +
          '</div>' +
        '</article>';
    }).join('');

    // 统一绑定加载失败兜底，避免在 HTML 里写内联事件
    fxc_grid.querySelectorAll('img[data-fxc-fallback]').forEach(function (fxc_img) {
      fxc_img.addEventListener('error', function () {
        fxc_img.src = fxc_PLACEHOLDER;
        console.warn('[gallery] 图片加载失败，已替换占位块：' + fxc_img.alt);
      }, { once: true });
    });
  }

  /**
   * 拉取图文数据并在页面与控制台同步反馈结果。
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
      console.log('[gallery] 接口返回 ' + fxc_rows.length + ' 条图文：', fxc_rows);
    } catch (fxc_err) {
      fxc_count.textContent = '加载失败';
      fxc_grid.innerHTML = '<div class="fxc_state fxc_state_bad">' +
        '获取图文失败：' + fxc_escape(fxc_err.message) +
        '<br>请确认后端已启动（8403 端口）且 fxc_gallery 表已建好。</div>';
      console.error('[gallery] 请求失败：', fxc_err);
    }
  }

  fxc_load();
})();

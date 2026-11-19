/**
 * 姓名：【冯玺成】 | 学号：【24001010403】 |
 * 时间：2026-11-19 | 大模型：DeepSeek-V4.1-Flash
 *
 * 功能简介：首页背景动画。在 canvas 上绘制缓慢漂移的光点与连线，
 *   鼠标附近的光点被轻微排斥；窗口尺寸变化时重建网点，尊重系统「减少动态效果」偏好。
 */
(function () {
  'use strict';

  const fxc_canvas = document.getElementById('fxc_canvas');
  const fxc_ctx = fxc_canvas.getContext('2d');
  const fxc_reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let fxc_width = 0;
  let fxc_height = 0;
  let fxc_points = [];
  let fxc_pointer = { x: -9999, y: -9999 };
  let fxc_frame = 0;

  // 每个光点的最大连线距离（px），超过则不画线
  const fxc_LINK_DIST = 130;

  /**
   * 按画布尺寸与像素比重建点阵；点越多画面越密，这里按面积做线性控制。
   */
  function fxc_buildPoints() {
    const fxc_dpr = Math.min(window.devicePixelRatio || 1, 2);
    fxc_width = window.innerWidth;
    fxc_height = window.innerHeight;
    fxc_canvas.width = fxc_width * fxc_dpr;
    fxc_canvas.height = fxc_height * fxc_dpr;
    fxc_canvas.style.width = fxc_width + 'px';
    fxc_canvas.style.height = fxc_height + 'px';
    fxc_ctx.setTransform(fxc_dpr, 0, 0, fxc_dpr, 0, 0);

    const fxc_count = Math.round((fxc_width * fxc_height) / 22000);
    fxc_points = [];
    for (let fxc_i = 0; fxc_i < fxc_count; fxc_i++) {
      fxc_points.push({
        fxc_x: Math.random() * fxc_width,
        fxc_y: Math.random() * fxc_height,
        fxc_vx: (Math.random() - 0.5) * 0.28,
        fxc_vy: (Math.random() - 0.5) * 0.28,
        fxc_r: Math.random() * 1.4 + 0.6
      });
    }
    console.log('[index] 背景点阵已生成，共 ' + fxc_points.length + ' 个光点');
  }

  /**
   * 让每个点按自身速度漂移，越界时从对侧穿回；
   * 靠近鼠标的点会被轻轻推开，避免粒子糊在指针上。
   */
  function fxc_movePoints() {
    fxc_points.forEach(function (fxc_p) {
      fxc_p.fxc_x += fxc_p.fxc_vx;
      fxc_p.fxc_y += fxc_p.fxc_vy;

      if (fxc_p.fxc_x < 0) fxc_p.fxc_x = fxc_width;
      if (fxc_p.fxc_x > fxc_width) fxc_p.fxc_x = 0;
      if (fxc_p.fxc_y < 0) fxc_p.fxc_y = fxc_height;
      if (fxc_p.fxc_y > fxc_height) fxc_p.fxc_y = 0;

      const fxc_dx = fxc_p.fxc_x - fxc_pointer.x;
      const fxc_dy = fxc_p.fxc_y - fxc_pointer.y;
      const fxc_dist = Math.hypot(fxc_dx, fxc_dy);
      if (fxc_dist < 110 && fxc_dist > 0.1) {
        const fxc_push = (110 - fxc_dist) / 110 * 0.8;
        fxc_p.fxc_x += (fxc_dx / fxc_dist) * fxc_push;
        fxc_p.fxc_y += (fxc_dy / fxc_dist) * fxc_push;
      }
    });
  }

  /**
   * 绘制一帧：先铺底，再画点间连线（距离越近越亮），最后画光点本身。
   */
  function fxc_draw() {
    fxc_ctx.clearRect(0, 0, fxc_width, fxc_height);

    for (let fxc_i = 0; fxc_i < fxc_points.length; fxc_i++) {
      const fxc_a = fxc_points[fxc_i];
      for (let fxc_j = fxc_i + 1; fxc_j < fxc_points.length; fxc_j++) {
        const fxc_b = fxc_points[fxc_j];
        const fxc_gap = Math.hypot(fxc_a.fxc_x - fxc_b.fxc_x, fxc_a.fxc_y - fxc_b.fxc_y);
        if (fxc_gap < fxc_LINK_DIST) {
          const fxc_alpha = (1 - fxc_gap / fxc_LINK_DIST) * 0.32;
          fxc_ctx.strokeStyle = 'rgba(214, 176, 108, ' + fxc_alpha.toFixed(3) + ')';
          fxc_ctx.lineWidth = 0.7;
          fxc_ctx.beginPath();
          fxc_ctx.moveTo(fxc_a.fxc_x, fxc_a.fxc_y);
          fxc_ctx.lineTo(fxc_b.fxc_x, fxc_b.fxc_y);
          fxc_ctx.stroke();
        }
      }
    }

    fxc_points.forEach(function (fxc_p) {
      fxc_ctx.beginPath();
      fxc_ctx.arc(fxc_p.fxc_x, fxc_p.fxc_y, fxc_p.fxc_r, 0, Math.PI * 2);
      fxc_ctx.fillStyle = 'rgba(234, 214, 176, 0.72)';
      fxc_ctx.fill();
    });
  }

  /**
   * 动画主循环；开启「减少动态效果」时只画静态一帧，不持续刷新。
   */
  function fxc_tick() {
    fxc_movePoints();
    fxc_draw();
    fxc_frame = requestAnimationFrame(fxc_tick);
  }

  function fxc_start() {
    fxc_buildPoints();
    if (fxc_reduceMotion) {
      fxc_draw();
      console.log('[index] 已启用静态背景（系统偏好：减少动态效果）');
      return;
    }
    fxc_stop();
    fxc_frame = requestAnimationFrame(fxc_tick);
  }

  function fxc_stop() {
    if (fxc_frame) cancelAnimationFrame(fxc_frame);
    fxc_frame = 0;
  }

  let fxc_resizeTimer = 0;
  window.addEventListener('resize', function () {
    clearTimeout(fxc_resizeTimer);
    fxc_resizeTimer = setTimeout(fxc_start, 180);
  });

  window.addEventListener('pointermove', function (fxc_e) {
    fxc_pointer.x = fxc_e.clientX;
    fxc_pointer.y = fxc_e.clientY;
  });

  window.addEventListener('pointerleave', function () {
    fxc_pointer.x = -9999;
    fxc_pointer.y = -9999;
  });

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
      fxc_stop();
    } else if (!fxc_reduceMotion) {
      fxc_frame = requestAnimationFrame(fxc_tick);
    }
  });

  fxc_start();

  const fxc_linkCount = document.querySelectorAll('.fxc_card').length;
  console.log('[index] 页面导航已载入，共 ' + fxc_linkCount + ' 个作品入口');
})();

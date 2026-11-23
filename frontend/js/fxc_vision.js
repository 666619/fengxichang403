/**
 * 姓名：【冯玺成】 | 学号：【24001010403】 |
 * 时间：2026-11-23 | 大模型：DeepSeek-V4.1-Flash
 *
 * 功能简介：图像识别页面脚本。负责选择 / 拖拽图片、本地预览、调用 POST /api/vision
 *   上传识别，并把请求信息与接口返回完整打印到浏览器控制台。
 */
(function () {
  'use strict';

  const fxc_drop = document.getElementById('fxc_drop');
  const fxc_input = document.getElementById('fxc_image');
  const fxc_preview = document.getElementById('fxc_preview');
  const fxc_fileMeta = document.getElementById('fxc_fileMeta');
  const fxc_msg = document.getElementById('fxc_msg');
  const fxc_sendBtn = document.getElementById('fxc_sendBtn');
  const fxc_answer = document.getElementById('fxc_answer');
  const fxc_model = document.getElementById('fxc_model');
  const fxc_MAX_SIZE = 8 * 1024 * 1024;

  let fxc_file = null;
  let fxc_objectUrl = '';

  /**
   * 在页面上显示一条提示信息，成功为绿色、失败为红色。
   * @param {string} fxc_text - 提示文字
   * @param {boolean} fxc_ok - 是否成功
   */
  function fxc_showMsg(fxc_text, fxc_ok) {
    fxc_msg.textContent = fxc_text;
    fxc_msg.className = 'fxc_msg fxc_msg_show ' + (fxc_ok ? 'fxc_msg_ok' : 'fxc_msg_bad');
  }

  /**
   * 选中图片后的处理：校验大小、生成预览、恢复按钮状态。
   * @param {File} fxc_picked - 用户选择的图片文件
   */
  function fxc_pick(fxc_picked) {
    if (!fxc_picked) return;

    console.log('[vision] 选择图片：', fxc_picked.name, fxc_picked.type, fxc_picked.size + ' 字节');

    if (!/^image\//.test(fxc_picked.type)) {
      fxc_showMsg('请选择图片文件（jpg / png / webp / gif）', false);
      return;
    }
    if (fxc_picked.size > fxc_MAX_SIZE) {
      fxc_showMsg('图片超过 8MB，请压缩后再上传', false);
      return;
    }

    fxc_file = fxc_picked;
    if (fxc_objectUrl) URL.revokeObjectURL(fxc_objectUrl);
    fxc_objectUrl = URL.createObjectURL(fxc_picked);

    fxc_preview.innerHTML = '';
    const fxc_img = document.createElement('img');
    fxc_img.src = fxc_objectUrl;
    fxc_img.alt = fxc_picked.name;
    fxc_preview.appendChild(fxc_img);
    fxc_preview.className = 'fxc_preview fxc_preview_show';

    fxc_fileMeta.textContent = fxc_picked.name + ' · ' + Math.round(fxc_picked.size / 1024) + ' KB';
    fxc_answer.textContent = '已选择图片，点击「开始识别」。';
    fxc_answer.className = 'fxc_answer';
    fxc_sendBtn.disabled = false;
    fxc_showMsg('图片已就绪', true);
  }

  /**
   * 上传图片并请求识别结果。
   */
  async function fxc_recognize() {
    if (!fxc_file) {
      fxc_showMsg('请先选择一张图片', false);
      return;
    }

    fxc_sendBtn.disabled = true;
    fxc_sendBtn.textContent = '识别中…';
    fxc_answer.textContent = '正在请求视觉大模型，请稍候…';
    fxc_answer.className = 'fxc_answer';

    const fxc_form = new FormData();
    fxc_form.append('image', fxc_file);

    console.log('[vision] 发送给后端：POST /api/vision', {
      fxc_filename: fxc_file.name,
      fxc_type: fxc_file.type,
      fxc_size: fxc_file.size
    });

    try {
      const fxc_resp = await fetch('/api/vision', { method: 'POST', body: fxc_form });
      const fxc_data = await fxc_resp.json();
      console.log('[vision] 后端返回：', fxc_data);

      if (fxc_data.code !== 0) {
        console.error('[vision] 识别失败：', fxc_data.msg);
        fxc_answer.textContent = '识别失败：' + fxc_data.msg;
        fxc_answer.className = 'fxc_answer';
        fxc_showMsg(fxc_data.msg, false);
        return;
      }

      const fxc_info = fxc_data.data;
      fxc_answer.textContent = fxc_info.fxc_description;
      fxc_answer.className = 'fxc_answer fxc_answer_ready';
      if (fxc_info.fxc_model) fxc_model.textContent = fxc_info.fxc_model;
      fxc_showMsg('识别完成', true);
    } catch (fxc_err) {
      console.error('[vision] 请求异常：', fxc_err);
      fxc_answer.textContent = '请求异常：' + fxc_err.message;
      fxc_answer.className = 'fxc_answer';
      fxc_showMsg('请求异常，请检查后端是否启动', false);
    } finally {
      fxc_sendBtn.disabled = false;
      fxc_sendBtn.textContent = '开始识别';
    }
  }

  fxc_drop.addEventListener('click', function () { fxc_input.click(); });

  fxc_input.addEventListener('change', function () {
    fxc_pick(fxc_input.files && fxc_input.files[0]);
  });

  fxc_drop.addEventListener('dragover', function (fxc_e) {
    fxc_e.preventDefault();
    fxc_drop.classList.add('fxc_drop_over');
  });
  fxc_drop.addEventListener('dragleave', function () {
    fxc_drop.classList.remove('fxc_drop_over');
  });
  fxc_drop.addEventListener('drop', function (fxc_e) {
    fxc_e.preventDefault();
    fxc_drop.classList.remove('fxc_drop_over');
    fxc_pick(fxc_e.dataTransfer.files && fxc_e.dataTransfer.files[0]);
  });

  fxc_sendBtn.addEventListener('click', fxc_recognize);
})();

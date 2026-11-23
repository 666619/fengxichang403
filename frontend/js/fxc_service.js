/**
 * 姓名：【冯玺成】 | 学号：【24001010403】 |
 * 时间：2026-11-23 | 大模型：DeepSeek-V4.1-Flash
 *
 * 功能简介：在线客服页脚本。把访客提问与历史对话 POST 到 /api/service，
 *   渲染客服回复；等待时显示「正在思考…」，失败显示红色提示，
 *   数据与异常同步输出到浏览器控制台。
 */
(function () {
  'use strict';

  const fxc_API = '/api/service';
  const fxc_msgs = document.getElementById('fxc_msgs');
  const fxc_input = document.getElementById('fxc_input');
  const fxc_sendBtn = document.getElementById('fxc_send');
  const fxc_quick = document.getElementById('fxc_quick');

  const fxc_history = [];
  const fxc_MAX_CONTEXT = 18;
  let fxc_pending = false;

  /**
   * 转义文本，避免客服回复中的标签被解析成 HTML。
   */
  function fxc_escape(fxc_text) {
    return String(fxc_text == null ? '' : fxc_text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function fxc_scrollBottom() {
    fxc_msgs.scrollTop = fxc_msgs.scrollHeight;
  }

  /**
   * 追加一条气泡。fxc_me 为 true 时靠右显示访客消息。
   * @returns {HTMLElement} 气泡元素，用于后续替换文字
   */
  function fxc_append(fxc_me, fxc_text, fxc_bad) {
    const fxc_row = document.createElement('div');
    fxc_row.className = 'fxc_row' + (fxc_me ? ' fxc_row_me' : '');

    const fxc_wrap = document.createElement('div');
    const fxc_meta = document.createElement('div');
    fxc_meta.className = 'fxc_meta';
    fxc_meta.textContent = fxc_me ? '我' : '客服 · AI';

    const fxc_bubble = document.createElement('div');
    fxc_bubble.className = 'fxc_bubble' + (fxc_bad ? ' fxc_bubble_bad' : '');
    fxc_bubble.textContent = fxc_text;

    fxc_wrap.appendChild(fxc_meta);
    fxc_wrap.appendChild(fxc_bubble);
    fxc_row.appendChild(fxc_wrap);
    fxc_msgs.appendChild(fxc_row);
    fxc_scrollBottom();
    return fxc_bubble;
  }

  /**
   * 根据内容调整输入框高度，最高 130px。
   */
  function fxc_autoGrow() {
    fxc_input.style.height = 'auto';
    fxc_input.style.height = Math.min(fxc_input.scrollHeight, 130) + 'px';
  }

  /**
   * 发送一条访客消息，并在等待期间占位显示「正在思考…」。
   * @param {string} [fxc_preset] - 快捷问题文本；不传则取输入框内容
   */
  async function fxc_send(fxc_preset) {
    if (fxc_pending) return;

    const fxc_text = (typeof fxc_preset === 'string' ? fxc_preset : fxc_input.value).trim();
    if (!fxc_text) return;

    fxc_pending = true;
    fxc_sendBtn.disabled = true;
    fxc_input.value = '';
    fxc_autoGrow();

    fxc_history.push({ role: 'user', content: fxc_text });
    fxc_append(true, fxc_text, false);
    const fxc_typing = fxc_append(false, '正在思考…', false);

    try {
      const fxc_resp = await fetch(fxc_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: fxc_history.slice(-fxc_MAX_CONTEXT) })
      });
      if (!fxc_resp.ok) throw new Error('HTTP ' + fxc_resp.status);

      const fxc_json = await fxc_resp.json();
      console.log('[service] 接口返回：', fxc_json);

      if (fxc_json.code !== 0) throw new Error(fxc_json.msg || '接口返回失败');

      const fxc_answer = (fxc_json.data && fxc_json.data.fxc_reply) || '';
      fxc_typing.textContent = fxc_answer;
      fxc_history.push({ role: 'assistant', content: fxc_answer });
    } catch (fxc_err) {
      fxc_typing.textContent = '抱歉，暂时无法回答：' + fxc_err.message;
      fxc_typing.classList.add('fxc_bubble_bad');
      console.error('[service] 请求失败：', fxc_err);
      fxc_history.pop();
    } finally {
      fxc_pending = false;
      fxc_sendBtn.disabled = false;
      fxc_scrollBottom();
      fxc_input.focus();
    }
  }

  fxc_sendBtn.addEventListener('click', function () { fxc_send(); });

  fxc_input.addEventListener('keydown', function (fxc_event) {
    if (fxc_event.key === 'Enter' && !fxc_event.shiftKey && !fxc_event.isComposing) {
      fxc_event.preventDefault();
      fxc_send();
    }
  });

  fxc_input.addEventListener('input', fxc_autoGrow);

  // 快捷问题：点击后直接作为访客消息发出
  fxc_quick.addEventListener('click', function (fxc_event) {
    const fxc_chip = fxc_event.target.closest('.fxc_chip');
    if (fxc_chip) fxc_send(fxc_chip.textContent);
  });

  fxc_append(false, '您好，我是课程站点在线客服，可以帮您排查页面、接口和数据库相关问题。请描述您遇到的情况。', false);
  console.log('[service] 页面已就绪，接口地址 /api/service');
  fxc_input.focus();
})();

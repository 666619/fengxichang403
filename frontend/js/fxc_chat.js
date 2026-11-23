/**
 * 姓名：【冯玺成】 | 学号：【24001010403】 |
 * 时间：2026-11-23 | 大模型：DeepSeek-V4.1-Flash
 *
 * 功能简介：AI 聊天页脚本。把用户输入与历史对话提交到 /api/chat，
 *   把模型回复渲染成气泡；请求期间显示思考动画，失败时给出红色提示，
 *   所有返回数据与异常同步输出到浏览器控制台。
 */
(function () {
  'use strict';

  const fxc_API = '/api/chat';
  const fxc_msgs = document.getElementById('fxc_msgs');
  const fxc_input = document.getElementById('fxc_input');
  const fxc_sendBtn = document.getElementById('fxc_send');

  // 会话历史：仅保存在当前页面，刷新后清空
  const fxc_history = [];
  // 单次请求最多携带的上下文条数，超出时只发送最近的若干轮
  const fxc_MAX_CONTEXT = 18;
  let fxc_pending = false;

  /**
   * 转义文本，避免模型输出中的标签被当作 HTML 解析。
   */
  function fxc_escape(fxc_text) {
    return String(fxc_text == null ? '' : fxc_text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /**
   * 滚动到消息区底部，保证最新一条可见。
   */
  function fxc_scrollBottom() {
    fxc_msgs.scrollTop = fxc_msgs.scrollHeight;
  }

  /**
   * 追加一条消息气泡。
   * @param {'user'|'assistant'} fxc_role - 消息来源
   * @param {string} fxc_text - 气泡正文
   * @param {boolean} fxc_bad - 是否为错误提示
   * @returns {HTMLElement} 生成的气泡元素，便于后续替换
   */
  function fxc_append(fxc_role, fxc_text, fxc_bad) {
    const fxc_row = document.createElement('div');
    fxc_row.className = 'fxc_row' + (fxc_role === 'user' ? ' fxc_row_user' : '');

    const fxc_wrap = document.createElement('div');
    const fxc_meta = document.createElement('div');
    fxc_meta.className = 'fxc_meta';
    fxc_meta.textContent = fxc_role === 'user' ? '我' : 'AI 助手';

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
   * 在消息区显示「正在思考…」占位气泡，返回其元素用于替换成正式回复。
   */
  function fxc_showTyping() {
    return fxc_append('assistant', '正在思考…', false);
  }

  /**
   * 根据输入框内容调整高度，最多 140px，超出后内部滚动。
   */
  function fxc_autoGrow() {
    fxc_input.style.height = 'auto';
    fxc_input.style.height = Math.min(fxc_input.scrollHeight, 140) + 'px';
  }

  /**
   * 发送一条消息：先入列渲染用户气泡，再请求接口并把回复写回占位气泡。
   */
  async function fxc_send() {
    if (fxc_pending) return;

    const fxc_text = fxc_input.value.trim();
    if (!fxc_text) return;

    fxc_pending = true;
    fxc_sendBtn.disabled = true;
    fxc_input.value = '';
    fxc_autoGrow();

    fxc_history.push({ role: 'user', content: fxc_text });
    fxc_append('user', fxc_text, false);

    const fxc_typing = fxc_showTyping();

    try {
      const fxc_resp = await fetch(fxc_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // 每轮都把历史一起发过去，模型才能"记得"上文；过长时只带最近若干条
        body: JSON.stringify({ messages: fxc_history.slice(-fxc_MAX_CONTEXT) })
      });
      if (!fxc_resp.ok) throw new Error('HTTP ' + fxc_resp.status);

      const fxc_json = await fxc_resp.json();
      console.log('[chat] 接口返回：', fxc_json);

      if (fxc_json.code !== 0) throw new Error(fxc_json.msg || '接口返回失败');

      const fxc_reply = (fxc_json.data && fxc_json.data.fxc_reply) || '';
      fxc_typing.textContent = fxc_reply;
      fxc_history.push({ role: 'assistant', content: fxc_reply });
    } catch (fxc_err) {
      fxc_typing.textContent = '出错了：' + fxc_err.message;
      fxc_typing.classList.add('fxc_bubble_bad');
      console.error('[chat] 请求失败：', fxc_err);
      // 失败的用户消息不保留在上下文里，避免后续请求携带无效轮次
      fxc_history.pop();
    } finally {
      fxc_pending = false;
      fxc_sendBtn.disabled = false;
      fxc_scrollBottom();
      fxc_input.focus();
    }
  }

  // 点击发送
  fxc_sendBtn.addEventListener('click', fxc_send);

  // 回车发送，Shift+回车换行；输入法组合输入时不触发
  fxc_input.addEventListener('keydown', function (fxc_event) {
    if (fxc_event.key === 'Enter' && !fxc_event.shiftKey && !fxc_event.isComposing) {
      fxc_event.preventDefault();
      fxc_send();
    }
  });

  fxc_input.addEventListener('input', fxc_autoGrow);

  console.log('[chat] 页面已就绪，接口地址 /api/chat');
  fxc_input.focus();
})();

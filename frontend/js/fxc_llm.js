/**
 * 姓名：【冯玺成】 | 学号：【24001010403】 |
 * 时间：2026-11-23 | 大模型：DeepSeek-V4.1-Flash
 *
 * 功能简介：LLM 实践操作痕迹页面脚本。包含四个演示模块：
 *   1) AI 客服：下拉框切换「七牛云 / 硅基流动」，请求 /api/service 时带上 fxc_provider；
 *   2) 知识库：上传、列表、删除、提问；
 *   3) 图像识别：上传图片调 /api/vision；
 *   4) 语音识别：上传音频调 /api/asr。
 *   所有请求体与响应都打印到浏览器控制台，配合服务端日志形成完整操作痕迹。
 */
(function () {
  'use strict';

  /**
   * 按 id 取元素。
   * @param {string} fxc_id - 元素 id
   * @returns {HTMLElement}
   */
  function fxc_el(fxc_id) {
    return document.getElementById(fxc_id);
  }

  /**
   * 在指定容器内显示提示文字，成功绿色、失败红色。
   * @param {HTMLElement} fxc_box - 提示容器
   * @param {string} fxc_text - 提示文字
   * @param {boolean} fxc_ok - 是否成功
   */
  function fxc_msg(fxc_box, fxc_text, fxc_ok) {
    fxc_box.textContent = fxc_text;
    fxc_box.className = 'fxc_msg fxc_msg_show ' + (fxc_ok ? 'fxc_msg_ok' : 'fxc_msg_bad');
  }

  /**
   * 绑定上传区：点击打开文件选择，支持拖拽补全。
   * @param {HTMLElement} fxc_drop - 拖拽区
   * @param {HTMLInputElement} fxc_input - 隐藏的 file 输入
   * @param {Function} fxc_onPick - 选中文件后的回调
   */
  function fxc_bindDrop(fxc_drop, fxc_input, fxc_onPick) {
    fxc_drop.addEventListener('click', function () { fxc_input.click(); });
    fxc_input.addEventListener('change', function () {
      fxc_onPick(fxc_input.files && fxc_input.files[0]);
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
      fxc_onPick(fxc_e.dataTransfer.files && fxc_e.dataTransfer.files[0]);
    });
  }

  /* ===== 选项卡：先清除所有选中，再设置当前 ===== */
  fxc_el('fxc_tabs').addEventListener('click', function (fxc_e) {
    const fxc_btn = fxc_e.target.closest('.fxc_tab');
    if (!fxc_btn) return;

    document.querySelectorAll('.fxc_tab').forEach(function (fxc_item) {
      fxc_item.classList.remove('fxc_tab_on');
    });
    fxc_btn.classList.add('fxc_tab_on');

    document.querySelectorAll('.fxc_panel').forEach(function (fxc_panel) {
      fxc_panel.classList.remove('fxc_panel_on');
    });
    fxc_el('fxc_panel_' + fxc_btn.dataset.fxcTab).classList.add('fxc_panel_on');
    console.log('[llm] 切换到面板：' + fxc_btn.dataset.fxcTab);
  });

  /* ================= 01 AI 客服 ================= */
  const fxc_chat = fxc_el('fxc_chat');
  const fxc_history = [];
  let fxc_busy = false;

  /**
   * 追加一条对话气泡。
   * @param {'user'|'ai'} fxc_role - 说话方
   * @param {string} fxc_text - 文字内容
   * @param {string} [fxc_tag] - 气泡上方的小标签（供应商 / 模型）
   * @returns {HTMLElement} 追加的气泡元素
   */
  function fxc_bubble(fxc_role, fxc_text, fxc_tag) {
    const fxc_empty = fxc_chat.querySelector('.fxc_empty');
    if (fxc_empty) fxc_empty.remove();

    const fxc_div = document.createElement('div');
    fxc_div.className = 'fxc_bubble ' + (fxc_role === 'user' ? 'fxc_bubble_user' : 'fxc_bubble_ai');
    if (fxc_tag) {
      const fxc_tagEl = document.createElement('span');
      fxc_tagEl.className = 'fxc_bubble_tag';
      fxc_tagEl.textContent = fxc_tag;
      fxc_div.appendChild(fxc_tagEl);
    }
    fxc_div.appendChild(document.createTextNode(fxc_text));
    fxc_chat.appendChild(fxc_div);
    fxc_chat.scrollTop = fxc_chat.scrollHeight;
    return fxc_div;
  }

  /**
   * 发送一条客服消息：带上当前供应商与最近 18 条历史。
   */
  async function fxc_sendService() {
    const fxc_input = fxc_el('fxc_serviceInput');
    const fxc_text = fxc_input.value.trim();
    if (!fxc_text || fxc_busy) return;

    const fxc_provider = fxc_el('fxc_provider').value;
    fxc_busy = true;
    fxc_input.value = '';
    fxc_history.push({ role: 'user', content: fxc_text });
    fxc_bubble('user', fxc_text);

    const fxc_pending = fxc_bubble('ai', '正在思考…', '请求中');
    const fxc_payload = {
      fxc_provider: fxc_provider,
      messages: fxc_history.slice(-18)
    };

    console.log('[llm] 发送给 /api/service 的数据：', fxc_payload);

    try {
      const fxc_resp = await fetch('/api/service', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fxc_payload)
      });
      const fxc_data = await fxc_resp.json();
      console.log('[llm] /api/service 返回的数据：', fxc_data);
      fxc_pending.remove();

      if (fxc_data.code !== 0) {
        fxc_history.pop();
        fxc_bubble('ai', '调用失败：' + fxc_data.msg, '错误');
        return;
      }

      fxc_history.push({ role: 'assistant', content: fxc_data.data.fxc_reply });
      fxc_bubble('ai', fxc_data.data.fxc_reply,
        (fxc_data.data.fxc_providerLabel || fxc_provider) + ' · ' + (fxc_data.data.fxc_model || ''));
    } catch (fxc_err) {
      console.error('[llm] 客服请求异常：', fxc_err);
      fxc_pending.remove();
      fxc_history.pop();
      fxc_bubble('ai', '请求异常：' + fxc_err.message, '错误');
    } finally {
      fxc_busy = false;
    }
  }

  fxc_el('fxc_serviceSend').addEventListener('click', fxc_sendService);
  fxc_el('fxc_serviceInput').addEventListener('keydown', function (fxc_e) {
    if (fxc_e.key === 'Enter') fxc_sendService();
  });
  fxc_el('fxc_provider').addEventListener('change', function () {
    const fxc_name = fxc_el('fxc_provider').selectedOptions[0].textContent;
    fxc_el('fxc_providerHint').textContent = '已切换到「' + fxc_name + '」，继续发送即可验证切换后照常对话';
    console.log('[llm] 供应商切换为：' + fxc_el('fxc_provider').value);
  });

  /* ================= 02 知识库 ================= */
  const fxc_kbDocs = fxc_el('fxc_kbDocs');
  const fxc_kbCount = fxc_el('fxc_kbCount');

  /**
   * 渲染知识库文档列表，并显示总数。
   * @param {Array} fxc_list - /api/kb/list 返回的文档数组
   */
  function fxc_renderDocs(fxc_list) {
    fxc_kbDocs.innerHTML = '';
    fxc_kbCount.textContent = '共 ' + fxc_list.length + ' 个文件';

    if (!fxc_list.length) {
      const fxc_empty = document.createElement('div');
      fxc_empty.className = 'fxc_empty';
      fxc_empty.textContent = '知识库为空，先上传一个 txt / md / docx 文件试试。';
      fxc_kbDocs.appendChild(fxc_empty);
      return;
    }

    fxc_list.forEach(function (fxc_doc) {
      const fxc_row = document.createElement('div');
      fxc_row.className = 'fxc_doc';

      const fxc_ext = document.createElement('span');
      fxc_ext.className = 'fxc_ext';
      fxc_ext.textContent = fxc_doc.ext;

      const fxc_name = document.createElement('span');
      fxc_name.className = 'fxc_docName';
      fxc_name.textContent = fxc_doc.filename;

      const fxc_meta = document.createElement('span');
      fxc_meta.className = 'fxc_docMeta';
      fxc_meta.textContent = Math.round(fxc_doc.size / 1024) + ' KB · ' + fxc_doc.chunk_count + ' 块';

      const fxc_del = document.createElement('button');
      fxc_del.type = 'button';
      fxc_del.className = 'fxc_del';
      fxc_del.textContent = '删除';
      fxc_del.dataset.fxcId = fxc_doc.id;

      fxc_row.appendChild(fxc_ext);
      fxc_row.appendChild(fxc_name);
      fxc_row.appendChild(fxc_meta);
      fxc_row.appendChild(fxc_del);
      fxc_kbDocs.appendChild(fxc_row);
    });
  }

  /**
   * 拉取知识库文档列表。
   */
  async function fxc_loadDocs() {
    try {
      const fxc_resp = await fetch('/api/kb/list');
      const fxc_data = await fxc_resp.json();
      console.log('[llm] /api/kb/list 返回：', fxc_data);
      if (fxc_data.code !== 0) {
        fxc_kbCount.textContent = '加载失败';
        return;
      }
      fxc_renderDocs(fxc_data.data.fxc_list);
    } catch (fxc_err) {
      console.error('[llm] 文档列表请求异常：', fxc_err);
      fxc_kbCount.textContent = '加载失败';
    }
  }

  /**
   * 上传知识库文件。
   * @param {File} fxc_file - 选中的文件
   */
  async function fxc_uploadKb(fxc_file) {
    if (!fxc_file) return;
    const fxc_form = new FormData();
    fxc_form.append('file', fxc_file);
    fxc_msg(fxc_el('fxc_kbMsg'), '正在上传并解析…', true);
    console.log('[llm] 上传知识库文件：', fxc_file.name, fxc_file.size + ' 字节');

    try {
      const fxc_resp = await fetch('/api/kb/upload', { method: 'POST', body: fxc_form });
      const fxc_data = await fxc_resp.json();
      console.log('[llm] /api/kb/upload 返回：', fxc_data);

      if (fxc_data.code !== 0) {
        fxc_msg(fxc_el('fxc_kbMsg'), '上传失败：' + fxc_data.msg, false);
        return;
      }
      fxc_msg(fxc_el('fxc_kbMsg'),
        '已入库：' + fxc_data.data.fxc_filename + '，切块 ' + fxc_data.data.fxc_chunkCount + ' 段', true);
      fxc_loadDocs();
    } catch (fxc_err) {
      console.error('[llm] 上传异常：', fxc_err);
      fxc_msg(fxc_el('fxc_kbMsg'), '上传异常：' + fxc_err.message, false);
    }
  }

  /**
   * 删除指定文档，并刷新列表。
   * @param {number} fxc_id - 文档 id
   */
  async function fxc_deleteDoc(fxc_id) {
    if (!window.confirm('确定删除这个知识库文件吗？')) return;
    try {
      const fxc_resp = await fetch('/api/kb/' + fxc_id, { method: 'DELETE' });
      const fxc_data = await fxc_resp.json();
      console.log('[llm] 删除文档返回：', fxc_data);
      fxc_loadDocs();
    } catch (fxc_err) {
      console.error('[llm] 删除异常：', fxc_err);
    }
  }

  /**
   * 基于知识库提问。
   */
  async function fxc_askKb() {
    const fxc_input = fxc_el('fxc_kbQuestion');
    const fxc_question = fxc_input.value.trim();
    if (!fxc_question) return;

    const fxc_answer = fxc_el('fxc_kbAnswer');
    const fxc_sources = fxc_el('fxc_kbSources');
    fxc_answer.textContent = '正在检索并请求模型…';
    fxc_answer.className = 'fxc_answer';
    fxc_sources.innerHTML = '';

    const fxc_payload = { question: fxc_question };
    console.log('[llm] 发送给 /api/kb/ask 的数据：', fxc_payload);

    try {
      const fxc_resp = await fetch('/api/kb/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fxc_payload)
      });
      const fxc_data = await fxc_resp.json();
      console.log('[llm] /api/kb/ask 返回：', fxc_data);

      if (fxc_data.code !== 0) {
        fxc_answer.textContent = '提问失败：' + fxc_data.msg;
        fxc_answer.className = 'fxc_answer';
        return;
      }

      fxc_answer.textContent = fxc_data.data.fxc_reply;
      fxc_answer.className = 'fxc_answer fxc_answer_ready';

      (fxc_data.data.fxc_sources || []).forEach(function (fxc_src, fxc_i) {
        const fxc_item = document.createElement('div');
        fxc_item.className = 'fxc_src';
        const fxc_b = document.createElement('b');
        fxc_b.textContent = '资料' + (fxc_i + 1) + '：' + fxc_src.fxc_filename;
        fxc_item.appendChild(fxc_b);
        fxc_item.appendChild(document.createTextNode(
          ' · 块 ' + fxc_src.fxc_seq + ' · 得分 ' + fxc_src.fxc_score));
        fxc_sources.appendChild(fxc_item);
      });
    } catch (fxc_err) {
      console.error('[llm] 知识库提问异常：', fxc_err);
      fxc_answer.textContent = '请求异常：' + fxc_err.message;
      fxc_answer.className = 'fxc_answer';
    }
  }

  fxc_bindDrop(fxc_el('fxc_kbDrop'), fxc_el('fxc_kbFile'), fxc_uploadKb);
  fxc_el('fxc_kbAsk').addEventListener('click', fxc_askKb);
  fxc_el('fxc_kbQuestion').addEventListener('keydown', function (fxc_e) {
    if (fxc_e.key === 'Enter') fxc_askKb();
  });
  fxc_kbDocs.addEventListener('click', function (fxc_e) {
    const fxc_btn = fxc_e.target.closest('.fxc_del');
    if (!fxc_btn) return;
    fxc_deleteDoc(Number(fxc_btn.dataset.fxcId));
  });

  /* ================= 03 图像识别 ================= */
  let fxc_imageFile = null;
  let fxc_imageUrl = '';

  /**
   * 选择图片：校验大小并生成本地预览。
   * @param {File} fxc_file - 选中的图片
   */
  function fxc_pickImage(fxc_file) {
    if (!fxc_file) return;
    console.log('[llm] 选择图片：', fxc_file.name, fxc_file.type, fxc_file.size + ' 字节');

    if (!/^image\//.test(fxc_file.type)) {
      fxc_msg(fxc_el('fxc_visionMsg'), '请选择图片文件', false);
      return;
    }
    if (fxc_file.size > 8 * 1024 * 1024) {
      fxc_msg(fxc_el('fxc_visionMsg'), '图片超过 8MB，请压缩后再上传', false);
      return;
    }

    fxc_imageFile = fxc_file;
    if (fxc_imageUrl) URL.revokeObjectURL(fxc_imageUrl);
    fxc_imageUrl = URL.createObjectURL(fxc_file);

    const fxc_preview = fxc_el('fxc_visionPreview');
    fxc_preview.innerHTML = '';
    const fxc_img = document.createElement('img');
    fxc_img.src = fxc_imageUrl;
    fxc_img.alt = fxc_file.name;
    fxc_preview.appendChild(fxc_img);
    fxc_preview.className = 'fxc_preview fxc_preview_show';

    fxc_el('fxc_visionMeta').textContent = fxc_file.name + ' · ' + Math.round(fxc_file.size / 1024) + ' KB';
    fxc_el('fxc_visionSend').disabled = false;
    fxc_el('fxc_visionAnswer').textContent = '图片已就绪，点击「开始识别」。';
    fxc_el('fxc_visionAnswer').className = 'fxc_answer';
    fxc_msg(fxc_el('fxc_visionMsg'), '图片已就绪', true);
  }

  /**
   * 上传图片并显示识别描述。
   */
  async function fxc_describeImage() {
    if (!fxc_imageFile) return;

    const fxc_btn = fxc_el('fxc_visionSend');
    const fxc_answer = fxc_el('fxc_visionAnswer');
    fxc_btn.disabled = true;
    fxc_btn.textContent = '识别中…';
    fxc_answer.textContent = '正在请求视觉大模型，请稍候…';
    fxc_answer.className = 'fxc_answer';

    const fxc_form = new FormData();
    fxc_form.append('image', fxc_imageFile);
    console.log('[llm] 发送给 /api/vision：', {
      fxc_filename: fxc_imageFile.name,
      fxc_type: fxc_imageFile.type,
      fxc_size: fxc_imageFile.size
    });

    try {
      const fxc_resp = await fetch('/api/vision', { method: 'POST', body: fxc_form });
      const fxc_data = await fxc_resp.json();
      console.log('[llm] /api/vision 返回：', fxc_data);

      if (fxc_data.code !== 0) {
        fxc_answer.textContent = '识别失败：' + fxc_data.msg;
        fxc_answer.className = 'fxc_answer';
        fxc_msg(fxc_el('fxc_visionMsg'), fxc_data.msg, false);
        return;
      }
      fxc_answer.textContent = fxc_data.data.fxc_description;
      fxc_answer.className = 'fxc_answer fxc_answer_ready';
      fxc_msg(fxc_el('fxc_visionMsg'), '识别完成', true);
    } catch (fxc_err) {
      console.error('[llm] 图像识别异常：', fxc_err);
      fxc_answer.textContent = '请求异常：' + fxc_err.message;
      fxc_answer.className = 'fxc_answer';
    } finally {
      fxc_btn.disabled = false;
      fxc_btn.textContent = '开始识别';
    }
  }

  fxc_bindDrop(fxc_el('fxc_visionDrop'), fxc_el('fxc_visionFile'), fxc_pickImage);
  fxc_el('fxc_visionSend').addEventListener('click', fxc_describeImage);

  /* ================= 04 语音识别 ================= */
  let fxc_audioFile = null;
  let fxc_audioUrl = '';

  /**
   * 选择音频：校验大小并生成试听播放器。
   * @param {File} fxc_file - 选中的音频
   */
  function fxc_pickAudio(fxc_file) {
    if (!fxc_file) return;
    console.log('[llm] 选择音频：', fxc_file.name, fxc_file.type, fxc_file.size + ' 字节');

    if (!/^audio\//.test(fxc_file.type)) {
      fxc_msg(fxc_el('fxc_asrMsg'), '请选择音频文件', false);
      return;
    }
    if (fxc_file.size > 10 * 1024 * 1024) {
      fxc_msg(fxc_el('fxc_asrMsg'), '音频超过 10MB，请压缩后再上传', false);
      return;
    }

    fxc_audioFile = fxc_file;
    if (fxc_audioUrl) URL.revokeObjectURL(fxc_audioUrl);
    fxc_audioUrl = URL.createObjectURL(fxc_file);

    const fxc_preview = fxc_el('fxc_asrPreview');
    fxc_preview.innerHTML = '';
    const fxc_player = document.createElement('audio');
    fxc_player.src = fxc_audioUrl;
    fxc_player.controls = true;
    fxc_preview.appendChild(fxc_player);
    fxc_preview.className = 'fxc_preview fxc_preview_show';

    fxc_el('fxc_asrMeta').textContent = fxc_file.name + ' · ' + Math.round(fxc_file.size / 1024) + ' KB';
    fxc_el('fxc_asrSend').disabled = false;
    fxc_el('fxc_asrAnswer').textContent = '音频已就绪，点击「开始识别」。';
    fxc_el('fxc_asrAnswer').className = 'fxc_answer';
    fxc_msg(fxc_el('fxc_asrMsg'), '音频已就绪', true);
  }

  /**
   * 上传音频并显示识别文字。
   */
  async function fxc_transcribeAudio() {
    if (!fxc_audioFile) return;

    const fxc_btn = fxc_el('fxc_asrSend');
    const fxc_answer = fxc_el('fxc_asrAnswer');
    fxc_btn.disabled = true;
    fxc_btn.textContent = '识别中…';
    fxc_answer.textContent = '正在请求语音识别模型，请稍候…';
    fxc_answer.className = 'fxc_answer';

    const fxc_form = new FormData();
    fxc_form.append('audio', fxc_audioFile);
    console.log('[llm] 发送给 /api/asr：', {
      fxc_filename: fxc_audioFile.name,
      fxc_type: fxc_audioFile.type,
      fxc_size: fxc_audioFile.size
    });

    try {
      const fxc_resp = await fetch('/api/asr', { method: 'POST', body: fxc_form });
      const fxc_data = await fxc_resp.json();
      console.log('[llm] /api/asr 返回：', fxc_data);

      if (fxc_data.code !== 0) {
        fxc_answer.textContent = '识别失败：' + fxc_data.msg;
        fxc_answer.className = 'fxc_answer';
        fxc_msg(fxc_el('fxc_asrMsg'), fxc_data.msg, false);
        return;
      }
      fxc_answer.textContent = fxc_data.data.fxc_text;
      fxc_answer.className = 'fxc_answer fxc_answer_ready';
      fxc_msg(fxc_el('fxc_asrMsg'), '识别完成，共 ' + fxc_data.data.fxc_text.length + ' 字', true);
    } catch (fxc_err) {
      console.error('[llm] 语音识别异常：', fxc_err);
      fxc_answer.textContent = '请求异常：' + fxc_err.message;
      fxc_answer.className = 'fxc_answer';
    } finally {
      fxc_btn.disabled = false;
      fxc_btn.textContent = '开始识别';
    }
  }

  fxc_bindDrop(fxc_el('fxc_asrDrop'), fxc_el('fxc_asrFile'), fxc_pickAudio);
  fxc_el('fxc_asrSend').addEventListener('click', fxc_transcribeAudio);

  // 首屏预加载知识库列表，切到该面板时直接有数据
  fxc_loadDocs();
})();

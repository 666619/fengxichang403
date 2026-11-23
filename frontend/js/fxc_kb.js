/**
 * 姓名：【冯玺成】 | 学号：【24001010403】 |
 * 时间：2026-11-23 | 大模型：DeepSeek-V4.1-Flash
 *
 * 功能简介：知识库（RAG）页面脚本。负责文件上传、文档列表与删除、
 *   以及基于知识库的提问；请求体与响应体同步打印到浏览器控制台，
 *   与服务端日志一起构成"发出去 / 收回来"的完整链路记录。
 */
(function () {
  'use strict';

  const fxc_drop = document.getElementById('fxc_drop');
  const fxc_file = document.getElementById('fxc_file');
  const fxc_msg = document.getElementById('fxc_msg');
  const fxc_docs = document.getElementById('fxc_docs');
  const fxc_count = document.getElementById('fxc_docCount');
  const fxc_question = document.getElementById('fxc_question');
  const fxc_askBtn = document.getElementById('fxc_askBtn');
  const fxc_answer = document.getElementById('fxc_answer');
  const fxc_sources = document.getElementById('fxc_sources');

  /**
   * 顶部提示条：上传结果、错误都用这里反馈。
   */
  function fxc_message(fxc_okFlag, fxc_text) {
    fxc_msg.textContent = fxc_text;
    fxc_msg.className = 'fxc_msg fxc_msg_show ' + (fxc_okFlag ? 'fxc_msg_ok' : 'fxc_msg_bad');
  }

  /**
   * 渲染文档列表；无数据时给出空态提示。
   */
  function fxc_renderDocs(fxc_rows) {
    fxc_count.textContent = fxc_rows.length ? ('共 ' + fxc_rows.length + ' 个文件') : '暂无文件';

    if (!fxc_rows.length) {
      fxc_docs.innerHTML = '<div class="fxc_empty">还没有上传文件，先上传 1–2 个文档再提问。</div>';
      return;
    }

    fxc_docs.innerHTML = fxc_rows.map(function (fxc_row) {
      const fxc_time = String(fxc_row.create_time || '').replace('T', ' ').slice(0, 16);
      const fxc_kb = Math.max(1, Math.round((fxc_row.size || 0) / 1024));
      return '' +
        '<div class="fxc_doc">' +
          '<span class="fxc_ext">' + fxc_row.ext.replace('.', '').toUpperCase() + '</span>' +
          '<span class="fxc_docName">' + fxc_row.filename + '</span>' +
          '<span class="fxc_docMeta">' + fxc_row.chunk_count + ' 段 · ' + fxc_kb + ' KB · ' + fxc_time + '</span>' +
          '<button class="fxc_del" type="button" data-fxc-id="' + fxc_row.id + '">删除</button>' +
        '</div>';
    }).join('');
  }

  /**
   * 拉取文档列表并渲染。
   */
  async function fxc_loadDocs() {
    try {
      const fxc_resp = await fetch('/api/kb/list');
      const fxc_json = await fxc_resp.json();
      console.log('[kb] 文档列表返回：', fxc_json);
      if (fxc_json.code !== 0) throw new Error(fxc_json.msg);
      fxc_renderDocs((fxc_json.data && fxc_json.data.fxc_list) || []);
    } catch (fxc_err) {
      fxc_docs.innerHTML = '<div class="fxc_empty">文档列表加载失败：' + fxc_err.message + '</div>';
      console.error('[kb] 列表加载失败：', fxc_err);
    }
  }

  /**
   * 上传单个文件：用 FormData 提交到 /api/kb/upload。
   */
  async function fxc_upload(fxc_one) {
    if (!fxc_one) return;

    const fxc_form = new FormData();
    fxc_form.append('file', fxc_one);
    fxc_message(true, '正在解析并入库：' + fxc_one.name + '…');

    try {
      const fxc_resp = await fetch('/api/kb/upload', { method: 'POST', body: fxc_form });
      const fxc_json = await fxc_resp.json();
      console.log('[kb] 上传返回：', fxc_json);

      if (fxc_json.code !== 0) throw new Error(fxc_json.msg);
      fxc_message(true, '上传成功：' + fxc_json.data.fxc_filename + '，切分为 ' + fxc_json.data.fxc_chunkCount + ' 段');
      fxc_loadDocs();
    } catch (fxc_err) {
      fxc_message(false, '上传失败：' + fxc_err.message);
      console.error('[kb] 上传失败：', fxc_err);
    }
  }

  /**
   * 基于知识库提问：把请求体与响应体都打到控制台。
   */
  async function fxc_ask() {
    const fxc_text = fxc_question.value.trim();
    if (!fxc_text) {
      fxc_answer.className = 'fxc_answer fxc_answer_show';
      fxc_answer.textContent = '请先输入问题。';
      return;
    }

    const fxc_payload = { question: fxc_text };
    console.log('[kb] 发送的请求数据：', fxc_payload);

    fxc_askBtn.disabled = true;
    fxc_answer.className = 'fxc_answer fxc_answer_show';
    fxc_answer.textContent = '正在检索知识库并生成回答…';
    fxc_sources.innerHTML = '';

    try {
      const fxc_resp = await fetch('/api/kb/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fxc_payload)
      });
      const fxc_json = await fxc_resp.json();
      console.log('[kb] 收到大模型返回：', fxc_json);

      if (fxc_json.code !== 0) throw new Error(fxc_json.msg);

      fxc_answer.textContent = fxc_json.data.fxc_reply || '（模型没有返回内容）';

      const fxc_hits = fxc_json.data.fxc_sources || [];
      fxc_sources.innerHTML = fxc_hits.map(function (fxc_hit) {
        return '<div class="fxc_src">命中 <b>' + fxc_hit.fxc_filename + '</b>（相关度 ' +
          fxc_hit.fxc_score + '）<br>' + fxc_hit.fxc_preview + '…</div>';
      }).join('');

      if (fxc_json.data.fxc_usage) {
        console.log('[kb] token 用量：', fxc_json.data.fxc_usage);
      }
    } catch (fxc_err) {
      fxc_answer.textContent = '提问失败：' + fxc_err.message;
      console.error('[kb] 提问失败：', fxc_err);
    } finally {
      fxc_askBtn.disabled = false;
    }
  }

  // 点击选择文件
  fxc_drop.addEventListener('click', function () { fxc_file.click(); });

  fxc_file.addEventListener('change', function () {
    fxc_upload(fxc_file.files[0]);
    fxc_file.value = '';
  });

  // 拖拽上传
  ['dragenter', 'dragover'].forEach(function (fxc_type) {
    fxc_drop.addEventListener(fxc_type, function (fxc_event) {
      fxc_event.preventDefault();
      fxc_drop.classList.add('fxc_drop_over');
    });
  });

  ['dragleave', 'drop'].forEach(function (fxc_type) {
    fxc_drop.addEventListener(fxc_type, function (fxc_event) {
      fxc_event.preventDefault();
      fxc_drop.classList.remove('fxc_drop_over');
    });
  });

  fxc_drop.addEventListener('drop', function (fxc_event) {
    const fxc_files = fxc_event.dataTransfer && fxc_event.dataTransfer.files;
    if (fxc_files && fxc_files.length) fxc_upload(fxc_files[0]);
  });

  // 删除文档（事件委托）
  fxc_docs.addEventListener('click', async function (fxc_event) {
    const fxc_btn = fxc_event.target.closest('.fxc_del');
    if (!fxc_btn) return;

    const fxc_id = fxc_btn.getAttribute('data-fxc-id');
    try {
      const fxc_resp = await fetch('/api/kb/' + fxc_id, { method: 'DELETE' });
      const fxc_json = await fxc_resp.json();
      console.log('[kb] 删除返回：', fxc_json);
      if (fxc_json.code !== 0) throw new Error(fxc_json.msg);
      fxc_message(true, '已删除文档 #' + fxc_id);
      fxc_loadDocs();
    } catch (fxc_err) {
      fxc_message(false, '删除失败：' + fxc_err.message);
      console.error('[kb] 删除失败：', fxc_err);
    }
  });

  fxc_askBtn.addEventListener('click', fxc_ask);
  fxc_question.addEventListener('keydown', function (fxc_event) {
    if (fxc_event.key === 'Enter') fxc_ask();
  });

  fxc_loadDocs();
  console.log('[kb] 页面已就绪：/api/kb/upload、/api/kb/list、/api/kb/ask');
})();

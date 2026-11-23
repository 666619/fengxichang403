/**
 * 姓名：【冯玺成】 | 学号：【24001010403】 |
 * 时间：2026-11-23 | 大模型：DeepSeek-V4.1-Flash
 *
 * 功能简介：知识库（RAG）控制器。负责文件上传解析入库、列表查询、删除，
 *   以及基于检索结果的问答。每次调用大模型前，把完整请求体打印到服务端控制台，
 *   收到响应后再打印模型回复与用量，便于观察 RAG 链路。
 */
const fxc_fs = require('fs/promises');
const fxc_path = require('path');
const fxc_pool = require('../config/fxc_db');
const fxc_parser = require('../utils/fxc_kbParser');

require('dotenv').config({ path: fxc_path.join(__dirname, '..', '.env') });

const fxc_BASE = (process.env.QINIU_BASE_URL || 'https://api.qnaigc.com/v1').replace(/\/+$/, '');
const fxc_API_URL = fxc_BASE + '/chat/completions';
const fxc_MODEL = process.env.QINIU_MODEL || 'deepseek/deepseek-v4-flash';

const fxc_UPLOAD_DIR = fxc_path.join(__dirname, '..', 'uploads');

/**
 * POST /api/kb/upload —— 接收单个文件，解析文本、切块入库。
 */
async function fxc_upload(fxc_req, fxc_res) {
  if (!fxc_req.file) {
    fxc_res.json({ code: 1, msg: '请选择要上传的文件', data: null });
    return;
  }

  const fxc_diskTemp = fxc_req.file.path;
  const fxc_name = Buffer.from(fxc_req.file.originalname, 'latin1').toString('utf8');
  const fxc_ext = fxc_path.extname(fxc_name).toLowerCase();
  // multer 落盘的临时文件名没有扩展名，解析器依赖扩展名判断格式，先补上
  const fxc_disk = fxc_diskTemp + fxc_ext;

  try {
    await fxc_fs.rename(fxc_diskTemp, fxc_disk);
    const fxc_text = await fxc_parser.fxc_parse(fxc_disk);
    const fxc_chunks = fxc_parser.fxc_chunk(fxc_text);

    if (!fxc_chunks.length) {
      throw new Error('未能从文件中提取到有效文字');
    }

    const [fxc_doc] = await fxc_pool.query(
      'INSERT INTO fxc_kb_doc (filename, ext, size, chunk_count, create_time) VALUES (?, ?, ?, ?, NOW())',
      [fxc_name, fxc_ext, fxc_req.file.size, fxc_chunks.length]
    );

    const fxc_docId = fxc_doc.insertId;
    const fxc_values = fxc_chunks.map(function (fxc_c, fxc_i) {
      return [fxc_docId, fxc_i + 1, fxc_c];
    });
    await fxc_pool.query('INSERT INTO fxc_kb_chunk (doc_id, seq, content) VALUES ?', [fxc_values]);

    console.log('[kb] 入库成功：' + fxc_name + '，切块 ' + fxc_chunks.length + ' 段');
    fxc_res.json({
      code: 0,
      msg: '上传成功',
      data: {
        fxc_id: fxc_docId,
        fxc_filename: fxc_name,
        fxc_ext: fxc_ext,
        fxc_chunkCount: fxc_chunks.length
      }
    });
  } catch (fxc_err) {
    console.error('[kb] 上传失败：' + fxc_err.message);
    fxc_res.json({ code: 1, msg: '解析失败：' + fxc_err.message, data: null });
  } finally {
    // 文本已入库，原文件不再保留，避免占用空间
    fxc_fs.unlink(fxc_disk).catch(function () { /* 文件已删除时忽略 */ });
  }
}

/**
 * GET /api/kb/list —— 知识库文档列表。
 */
async function fxc_list(fxc_req, fxc_res) {
  try {
    const [fxc_rows] = await fxc_pool.query(
      'SELECT id, filename, ext, size, chunk_count, create_time FROM fxc_kb_doc ORDER BY id DESC'
    );
    fxc_res.json({ code: 0, msg: 'ok', data: { fxc_total: fxc_rows.length, fxc_list: fxc_rows } });
  } catch (fxc_err) {
    console.error('[kb] 列表查询失败：' + fxc_err.message);
    fxc_res.json({ code: 1, msg: '查询失败：' + fxc_err.message, data: null });
  }
}

/**
 * DELETE /api/kb/:id —— 删除文档及其全部文本块。
 */
async function fxc_remove(fxc_req, fxc_res) {
  const fxc_id = Number(fxc_req.params.id);
  if (!fxc_id) {
    fxc_res.json({ code: 1, msg: '文档 id 不合法', data: null });
    return;
  }

  try {
    await fxc_pool.query('DELETE FROM fxc_kb_chunk WHERE doc_id = ?', [fxc_id]);
    const [fxc_r] = await fxc_pool.query('DELETE FROM fxc_kb_doc WHERE id = ?', [fxc_id]);
    if (!fxc_r.affectedRows) {
      fxc_res.json({ code: 1, msg: '文档不存在', data: null });
      return;
    }
    console.log('[kb] 已删除文档 ' + fxc_id);
    fxc_res.json({ code: 0, msg: '删除成功', data: { fxc_id: fxc_id } });
  } catch (fxc_err) {
    console.error('[kb] 删除失败：' + fxc_err.message);
    fxc_res.json({ code: 1, msg: '删除失败：' + fxc_err.message, data: null });
  }
}

/**
 * POST /api/kb/ask —— 先检索再回答：取最相关的若干文本块拼进提示词。
 */
async function fxc_ask(fxc_req, fxc_res) {
  const fxc_question = String((fxc_req.body && fxc_req.body.question) || '').trim();
  if (!fxc_question) {
    fxc_res.json({ code: 1, msg: '问题不能为空', data: null });
    return;
  }

  const fxc_key = process.env.QINIU_API_KEY;
  if (!fxc_key) {
    fxc_res.json({ code: 1, msg: '服务端未配置 API Key（QINIU_API_KEY）', data: null });
    return;
  }

  try {
    const [fxc_rows] = await fxc_pool.query(
      'SELECT c.id, c.doc_id, c.content, d.filename FROM fxc_kb_chunk c ' +
      'JOIN fxc_kb_doc d ON d.id = c.doc_id'
    );

    if (!fxc_rows.length) {
      fxc_res.json({ code: 1, msg: '知识库为空，请先上传文件', data: null });
      return;
    }

    const fxc_ranked = fxc_rows
      .map(function (fxc_row) {
        return { fxc_row: fxc_row, fxc_score: fxc_parser.fxc_score(fxc_question, fxc_row.content) };
      })
      .filter(function (fxc_item) { return fxc_item.fxc_score > 0; })
      .sort(function (fxc_a, fxc_b) { return fxc_b.fxc_score - fxc_a.fxc_score; })
      .slice(0, 4);

    if (!fxc_ranked.length) {
      fxc_res.json({
        code: 0,
        msg: 'ok',
        data: {
          fxc_reply: '抱歉，知识库里没有找到与您问题相关的内容，建议换个说法或补充资料。',
          fxc_sources: []
        }
      });
      console.log('[kb] 未检索到相关片段，问题：' + fxc_question);
      return;
    }

    const fxc_context = fxc_ranked.map(function (fxc_item, fxc_i) {
      return '【资料' + (fxc_i + 1) + '｜' + fxc_item.fxc_row.filename + '】\n' + fxc_item.fxc_row.content;
    }).join('\n\n');

    const fxc_payload = {
      model: fxc_MODEL,
      messages: [
        {
          role: 'system',
          content: '你是课程站点的智能客服。只依据给出的资料回答；资料未覆盖时直接说明不知道，'
            + '不要编造。回答使用简体中文，先给结论再给必要步骤，不超过 200 字。'
        },
        {
          role: 'user',
          content: '资料：\n' + fxc_context + '\n\n问题：' + fxc_question
        }
      ],
      temperature: 0.3,
      max_tokens: 600,
      stream: false
    };

    console.log('[kb] 发送给大模型的数据：\n' + JSON.stringify(fxc_payload, null, 2));

    const fxc_upstream = await fetch(fxc_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + fxc_key
      },
      body: JSON.stringify(fxc_payload),
      signal: AbortSignal.timeout(60000)
    });

    const fxc_data = await fxc_upstream.json();
    console.log('[kb] 接收自大模型的数据：\n' + JSON.stringify(fxc_data, null, 2));

    if (!fxc_upstream.ok) {
      const fxc_reason = (fxc_data && fxc_data.error && fxc_data.error.message)
        || (fxc_data && fxc_data.message) || ('HTTP ' + fxc_upstream.status);
      if (fxc_upstream.status === 429) {
        fxc_res.json({ code: 1, msg: '免费模型请求过于频繁，请等待几秒后再试', data: null });
        return;
      }
      fxc_res.json({ code: 1, msg: '模型调用失败：' + fxc_reason, data: null });
      return;
    }

    const fxc_reply = fxc_data.choices && fxc_data.choices[0]
      && fxc_data.choices[0].message && fxc_data.choices[0].message.content;

    fxc_res.json({
      code: 0,
      msg: 'ok',
      data: {
        fxc_reply: fxc_reply || '',
        fxc_sources: fxc_ranked.map(function (fxc_item) {
          return {
            fxc_filename: fxc_item.fxc_row.filename,
            fxc_seq: fxc_item.fxc_row.doc_id + '-' + fxc_item.fxc_row.id,
            fxc_score: Number(fxc_item.fxc_score.toFixed(3)),
            fxc_preview: fxc_item.fxc_row.content.slice(0, 80)
          };
        }),
        fxc_usage: fxc_data.usage || null
      }
    });
  } catch (fxc_err) {
    const fxc_reason = fxc_err.name === 'TimeoutError' ? '请求超时（60 秒）' : fxc_err.message;
    console.error('[kb] 问答异常：' + fxc_reason);
    fxc_res.json({ code: 1, msg: '问答失败：' + fxc_reason, data: null });
  }
}

module.exports = { fxc_upload, fxc_list, fxc_remove, fxc_ask, fxc_UPLOAD_DIR };

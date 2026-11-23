/**
 * 姓名：【冯玺成】 | 学号：【24001010403】 |
 * 时间：2026-11-23 | 大模型：DeepSeek-V4.1-Flash
 *
 * 功能简介：语音识别控制器。接收前端上传的音频，按 OpenAI 兼容的
 *   multipart 表单转发到七牛云 /audio/transcriptions 接口，
 *   使用 Qwen-Audio-3.0-ASR-Flash 模型把语音转成文字。
 *   发送给大模型的数据与接收自大模型的数据都打印到服务端控制台。
 */
const fxc_path = require('path');

require('dotenv').config({ path: fxc_path.join(__dirname, '..', '.env') });

const fxc_BASE = (process.env.QINIU_BASE_URL || 'https://api.qnaigc.com/v1').replace(/\/+$/, '');
const fxc_API_URL = fxc_BASE + '/audio/transcriptions';
const fxc_MODEL = process.env.QINIU_ASR_MODEL || 'qwen/qwen-audio-3.0-asr-flash';

/**
 * POST /api/asr —— 上传一段音频，返回识别出的文字。
 */
async function fxc_transcribe(fxc_req, fxc_res) {
  if (!fxc_req.file || !fxc_req.file.buffer || !fxc_req.file.buffer.length) {
    fxc_res.json({ code: 1, msg: '请选择要识别的音频', data: null });
    return;
  }

  const fxc_key = process.env.QINIU_API_KEY;
  if (!fxc_key) {
    fxc_res.json({ code: 1, msg: '服务端未配置 API Key（QINIU_API_KEY）', data: null });
    return;
  }

  const fxc_name = Buffer.from(fxc_req.file.originalname, 'latin1').toString('utf8');
  const fxc_mime = fxc_req.file.mimetype || 'audio/wav';

  console.log('[asr] 发送给大模型的数据：\n' + JSON.stringify({
    url: fxc_API_URL,
    model: fxc_MODEL,
    file: {
      filename: fxc_name,
      type: fxc_mime,
      size: fxc_req.file.size
    }
  }, null, 2));

  try {
    // 用全局 FormData + Blob 构造 multipart 请求，浏览器与服务端 Node 均原生支持
    const fxc_form = new FormData();
    fxc_form.append('file', new Blob([fxc_req.file.buffer], { type: fxc_mime }), fxc_name);
    fxc_form.append('model', fxc_MODEL);

    const fxc_upstream = await fetch(fxc_API_URL, {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + fxc_key },
      body: fxc_form,
      signal: AbortSignal.timeout(90000)
    });

    const fxc_data = await fxc_upstream.json();
    console.log('[asr] 接收自大模型的数据：\n' + JSON.stringify(fxc_data, null, 2));

    if (!fxc_upstream.ok) {
      const fxc_reason = (fxc_data && fxc_data.error && fxc_data.error.message)
        || (fxc_data && fxc_data.message) || ('HTTP ' + fxc_upstream.status);
      console.error('[asr] 上游返回失败：' + fxc_reason);
      if (fxc_upstream.status === 429) {
        fxc_res.json({ code: 1, msg: '模型请求过于频繁，请等待几秒后再试', data: null });
        return;
      }
      fxc_res.json({ code: 1, msg: '语音识别失败：' + fxc_reason, data: null });
      return;
    }

    if (!fxc_data.text) {
      fxc_res.json({ code: 1, msg: '模型未返回识别文字', data: null });
      return;
    }

    console.log('[asr] 识别成功：' + fxc_name + '，返回 ' + fxc_data.text.length + ' 字');
    fxc_res.json({
      code: 0,
      msg: 'ok',
      data: {
        fxc_filename: fxc_name,
        fxc_text: fxc_data.text,
        fxc_model: fxc_MODEL,
        fxc_usage: fxc_data.usage || null
      }
    });
  } catch (fxc_err) {
    const fxc_reason = fxc_err.name === 'TimeoutError' ? '请求超时（90 秒）' : fxc_err.message;
    console.error('[asr] 请求异常：' + fxc_reason);
    fxc_res.json({ code: 1, msg: '语音识别请求异常：' + fxc_reason, data: null });
  }
}

module.exports = { fxc_transcribe };

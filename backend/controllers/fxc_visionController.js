/**
 * 姓名：【冯玺成】 | 学号：【24001010403】 |
 * 时间：2026-11-23 | 大模型：DeepSeek-V4.1-Flash
 *
 * 功能简介：图像识别控制器。接收前端上传的图片，转成 base64 Data URL，
 *   以 OpenAI 兼容的多模态消息格式发给七牛云视觉模型，返回中文图片描述。
 *   发送给大模型的数据（图片部分以长度占位）与收到的大模型数据都打印到服务端控制台。
 */
const fxc_path = require('path');

require('dotenv').config({ path: fxc_path.join(__dirname, '..', '.env') });

const fxc_BASE = (process.env.QINIU_BASE_URL || 'https://api.qnaigc.com/v1').replace(/\/+$/, '');
const fxc_API_URL = fxc_BASE + '/chat/completions';
// 视觉模型：沿用同一个七牛 Key，模型取视觉版 DeepSeek-V4-Flash
const fxc_MODEL = process.env.QINIU_VISION_MODEL || 'deepseek/deepseek-v4-flash-vision-exp';

const fxc_SYSTEM_PROMPT = '你是图像描述助手。用简体中文客观描述图片内容：'
  + '先说整体画面与主体，再补充场景、颜色、风格等细节，不超过 150 字；看不清的内容不要编造。';

/**
 * POST /api/vision —— 上传一张图片，返回图片描述。
 */
async function fxc_describe(fxc_req, fxc_res) {
  if (!fxc_req.file || !fxc_req.file.buffer || !fxc_req.file.buffer.length) {
    fxc_res.json({ code: 1, msg: '请选择要识别的图片', data: null });
    return;
  }

  const fxc_key = process.env.QINIU_API_KEY;
  if (!fxc_key) {
    fxc_res.json({ code: 1, msg: '服务端未配置 API Key（QINIU_API_KEY）', data: null });
    return;
  }

  const fxc_name = Buffer.from(fxc_req.file.originalname, 'latin1').toString('utf8');
  const fxc_mime = fxc_req.file.mimetype || 'image/jpeg';
  const fxc_base64 = fxc_req.file.buffer.toString('base64');
  const fxc_dataUrl = 'data:' + fxc_mime + ';base64,' + fxc_base64;

  const fxc_payload = {
    model: fxc_MODEL,
    messages: [
      { role: 'system', content: fxc_SYSTEM_PROMPT },
      {
        role: 'user',
        content: [
          { type: 'text', text: '请描述这张图片的内容。' },
          { type: 'image_url', image_url: { url: fxc_dataUrl } }
        ]
      }
    ],
    temperature: 0.3,
    // 该视觉模型会先输出推理内容，输出上限留足，避免正文被截断
    max_tokens: 2000,
    stream: false
  };

  // 控制台不打印整段 base64，只给出长度，其余字段原样输出
  const fxc_logPayload = JSON.parse(JSON.stringify(fxc_payload));
  fxc_logPayload.messages[1].content[1].image_url.url = fxc_mime + ' base64（' + fxc_base64.length + ' 字符，约 '
    + Math.round(fxc_req.file.size / 1024) + ' KB）';
  console.log('[vision] 发送给大模型的数据：\n' + JSON.stringify(fxc_logPayload, null, 2));

  try {
    const fxc_upstream = await fetch(fxc_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + fxc_key
      },
      body: JSON.stringify(fxc_payload),
      signal: AbortSignal.timeout(90000)
    });

    const fxc_data = await fxc_upstream.json();
    console.log('[vision] 接收自大模型的数据：\n' + JSON.stringify(fxc_data, null, 2));

    if (!fxc_upstream.ok) {
      const fxc_reason = (fxc_data && fxc_data.error && fxc_data.error.message)
        || (fxc_data && fxc_data.message) || ('HTTP ' + fxc_upstream.status);
      console.error('[vision] 上游返回失败：' + fxc_reason);
      if (fxc_upstream.status === 429) {
        fxc_res.json({ code: 1, msg: '模型请求过于频繁，请等待几秒后再试', data: null });
        return;
      }
      fxc_res.json({ code: 1, msg: '模型调用失败：' + fxc_reason, data: null });
      return;
    }

    const fxc_reply = fxc_data.choices && fxc_data.choices[0]
      && fxc_data.choices[0].message && fxc_data.choices[0].message.content;

    if (!fxc_reply) {
      fxc_res.json({ code: 1, msg: '模型未返回有效描述', data: null });
      return;
    }

    console.log('[vision] 识别成功：' + fxc_name + '，返回 ' + fxc_reply.length + ' 字');
    fxc_res.json({
      code: 0,
      msg: 'ok',
      data: {
        fxc_filename: fxc_name,
        fxc_description: fxc_reply,
        fxc_model: fxc_data.model || fxc_MODEL,
        fxc_usage: fxc_data.usage || null
      }
    });
  } catch (fxc_err) {
    const fxc_reason = fxc_err.name === 'TimeoutError' ? '请求超时（90 秒）' : fxc_err.message;
    console.error('[vision] 请求异常：' + fxc_reason);
    fxc_res.json({ code: 1, msg: '图像识别请求异常：' + fxc_reason, data: null });
  }
}

module.exports = { fxc_describe };

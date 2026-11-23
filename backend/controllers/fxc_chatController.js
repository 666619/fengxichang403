/**
 * 姓名：【冯玺成】 | 学号：【24001010403】 |
 * 时间：2026-11-23 | 大模型：DeepSeek-V4.1-Flash
 *
 * 功能简介：AI 聊天控制器。接收前端传来的对话历史，携带 backend/.env 中的
 *   硅基流动 API Key 调用对话补全接口，把模型回复按统一格式返回；
 *   密钥只存在于服务端环境变量，不下发到浏览器。
 */
const fxc_path = require('path');

require('dotenv').config({ path: fxc_path.join(__dirname, '..', '.env') });

const fxc_BASE = (process.env.QINIU_BASE_URL || 'https://api.qnaigc.com/v1').replace(/\/+$/, '');
const fxc_API_URL = fxc_BASE + '/chat/completions';
const fxc_MODEL = process.env.QINIU_MODEL || 'deepseek/deepseek-v4-flash';

// 系统提示：限定回答范围与语气，属于服务端配置，不由前端传入
const fxc_SYSTEM_PROMPT = '你是「高级网页设计」课程网站里的 AI 助手，回答要简洁、准确，'
  + '优先使用简体中文；涉及代码时给出可直接运行的最小示例。';

/**
 * 校验并清洗前端提交的消息数组。
 * @param {*} fxc_raw - 请求体中的 messages
 * @returns {Array|null} 合法消息数组；不合法时返回 null
 */
function fxc_normalize(fxc_raw) {
  if (!Array.isArray(fxc_raw) || fxc_raw.length === 0) return null;
  if (fxc_raw.length > 20) return null;

  const fxc_list = [];
  for (const fxc_item of fxc_raw) {
    const fxc_role = fxc_item && fxc_item.role;
    const fxc_content = fxc_item && fxc_item.content;
    if (fxc_role !== 'user' && fxc_role !== 'assistant') return null;
    if (typeof fxc_content !== 'string' || !fxc_content.trim()) return null;
    if (fxc_content.length > 2000) return null;
    fxc_list.push({ role: fxc_role, content: fxc_content.trim() });
  }
  return fxc_list;
}

/**
 * POST /api/chat —— 把对话历史发给大模型并返回一条回复。
 */
async function fxc_chat(fxc_req, fxc_res) {
  const fxc_key = process.env.QINIU_API_KEY;
  if (!fxc_key) {
    fxc_res.json({ code: 1, msg: '服务端未配置 API Key（QINIU_API_KEY）', data: null });
    return;
  }

  const fxc_messages = fxc_normalize(fxc_req.body && fxc_req.body.messages);
  if (!fxc_messages) {
    fxc_res.json({ code: 1, msg: '消息格式不正确：需为 1–20 条、内容非空的 user/assistant 消息', data: null });
    return;
  }

  try {
    const fxc_upstream = await fetch(fxc_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + fxc_key
      },
      body: JSON.stringify({
        model: fxc_MODEL,
        messages: [{ role: 'system', content: fxc_SYSTEM_PROMPT }].concat(fxc_messages),
        temperature: 0.7,
        max_tokens: 1024,
        stream: false
      }),
      signal: AbortSignal.timeout(60000)
    });

    const fxc_data = await fxc_upstream.json();

    if (!fxc_upstream.ok) {
      const fxc_reason = (fxc_data && fxc_data.error && fxc_data.error.message)
        || (fxc_data && fxc_data.message) || ('HTTP ' + fxc_upstream.status);
      console.error('[chat] 上游返回失败：' + fxc_reason);
      // 免费模型有严格频率限制，单独给出可操作的提示
      if (fxc_upstream.status === 429) {
        fxc_res.json({ code: 1, msg: '免费模型请求过于频繁，请等待几秒后再试', data: null });
        return;
      }
      fxc_res.json({ code: 1, msg: '模型服务调用失败：' + fxc_reason, data: null });
      return;
    }

    const fxc_reply = fxc_data.choices && fxc_data.choices[0]
      && fxc_data.choices[0].message && fxc_data.choices[0].message.content;

    if (!fxc_reply) {
      console.error('[chat] 上游响应缺少 choices[0].message.content');
      fxc_res.json({ code: 1, msg: '模型未返回有效内容', data: null });
      return;
    }

    console.log('[chat] 调用成功，模型：' + fxc_MODEL + '，返回 ' + fxc_reply.length + ' 字');
    fxc_res.json({
      code: 0,
      msg: 'ok',
      data: {
        fxc_reply: fxc_reply,
        fxc_model: fxc_data.model || fxc_MODEL,
        fxc_usage: fxc_data.usage || null
      }
    });
  } catch (fxc_err) {
    const fxc_reason = fxc_err.name === 'TimeoutError' ? '请求超时（60 秒）' : fxc_err.message;
    console.error('[chat] 请求异常：' + fxc_reason);
    fxc_res.json({ code: 1, msg: '模型服务请求异常：' + fxc_reason, data: null });
  }
}

module.exports = { fxc_chat };

/**
 * 姓名：【冯玺成】 | 学号：【24001010403】 |
 * 时间：2026-11-23 | 大模型：DeepSeek-V4.1-Flash
 *
 * 功能简介：在线客服控制器。把访客与客服助手的对话历史转发到大模型
 *   （OpenAI 兼容接口），返回一条客服口径的回复；密钥只存在于服务端 .env。
 *   支持按请求参数在「七牛云」与「硅基流动」之间切换，两家配置都从 .env 读取。
 */
const fxc_path = require('path');

require('dotenv').config({ path: fxc_path.join(__dirname, '..', '.env') });

/**
 * 读取两家供应商的配置：基址、密钥、模型都来自 .env。
 */
function fxc_providers() {
  return {
    qiniu: {
      label: '七牛云',
      base: (process.env.QINIU_BASE_URL || 'https://api.qnaigc.com/v1').replace(/\/+$/, ''),
      key: process.env.QINIU_API_KEY || '',
      model: process.env.QINIU_MODEL || 'deepseek/deepseek-v4-flash'
    },
    siliconflow: {
      label: '硅基流动',
      base: (process.env.SILICONFLOW_BASE_URL || 'https://api.siliconflow.cn/v1').replace(/\/+$/, ''),
      key: process.env.SILICONFLOW_API_KEY || '',
      model: process.env.SILICONFLOW_MODEL || 'deepseek-ai/DeepSeek-V4-Flash'
    }
  };
}

const fxc_DEFAULT_PROVIDER = 'qiniu';

// 客服人设：服务范围限定在本课程站点，语气礼貌、先给结论再给步骤
const fxc_SYSTEM_PROMPT = '你是「高级网页设计」课程站点的在线客服小助手。'
  + '用简体中文礼貌回答，先给结论再给必要步骤，单次回答不超过 200 字。'
  + '可解答：页面打不开、端口 8403、数据库连接、接口返回错误、课程作业提交等问题。'
  + '无法解决的问题，引导用户联系任课老师，不要编造不存在的信息。';

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
 * POST /api/service —— 在线客服应答。
 */
async function fxc_reply(fxc_req, fxc_res) {
  const fxc_all = fxc_providers();
  const fxc_keyName = String((fxc_req.body && fxc_req.body.fxc_provider) || fxc_DEFAULT_PROVIDER).trim();
  const fxc_conf = fxc_all[fxc_keyName];

  if (!fxc_conf) {
    fxc_res.json({ code: 1, msg: '不支持的供应商，仅可选 qiniu / siliconflow', data: null });
    return;
  }
  if (!fxc_conf.key) {
    fxc_res.json({ code: 1, msg: fxc_conf.label + ' 未配置 API Key', data: null });
    return;
  }

  const fxc_messages = fxc_normalize(fxc_req.body && fxc_req.body.messages);
  if (!fxc_messages) {
    fxc_res.json({ code: 1, msg: '消息格式不正确：需为 1–20 条、内容非空的 user/assistant 消息', data: null });
    return;
  }

  const fxc_apiUrl = fxc_conf.base + '/chat/completions';

  try {
    const fxc_upstream = await fetch(fxc_apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + fxc_conf.key
      },
      body: JSON.stringify({
        model: fxc_conf.model,
        messages: [{ role: 'system', content: fxc_SYSTEM_PROMPT }].concat(fxc_messages),
        temperature: 0.6,
        max_tokens: 512,
        stream: false
      }),
      signal: AbortSignal.timeout(60000)
    });

    const fxc_data = await fxc_upstream.json();

    if (!fxc_upstream.ok) {
      const fxc_reason = (fxc_data && fxc_data.error && fxc_data.error.message)
        || (fxc_data && fxc_data.message) || ('HTTP ' + fxc_upstream.status);
      console.error('[service] ' + fxc_conf.label + ' 返回失败：' + fxc_reason);
      // 免费模型有严格频率限制，单独给出可操作的提示
      if (fxc_upstream.status === 429) {
        fxc_res.json({ code: 1, msg: fxc_conf.label + ' 请求过于频繁，请等待几秒后再试', data: null });
        return;
      }
      fxc_res.json({ code: 1, msg: '客服服务调用失败：' + fxc_reason, data: null });
      return;
    }

    const fxc_answer = fxc_data.choices && fxc_data.choices[0]
      && fxc_data.choices[0].message && fxc_data.choices[0].message.content;

    if (!fxc_answer) {
      console.error('[service] 上游响应缺少 choices[0].message.content');
      fxc_res.json({ code: 1, msg: '客服未返回有效内容', data: null });
      return;
    }

    console.log('[service] 调用成功，供应商：' + fxc_conf.label + '，模型：' + (fxc_data.model || fxc_conf.model));
    fxc_res.json({
      code: 0,
      msg: 'ok',
      data: {
        fxc_reply: fxc_answer,
        fxc_provider: fxc_keyName,
        fxc_providerLabel: fxc_conf.label,
        fxc_model: fxc_data.model || fxc_conf.model,
        fxc_usage: fxc_data.usage || null
      }
    });
  } catch (fxc_err) {
    const fxc_reason = fxc_err.name === 'TimeoutError' ? '请求超时（60 秒）' : fxc_err.message;
    console.error('[service] 请求异常：' + fxc_reason);
    fxc_res.json({ code: 1, msg: '客服服务请求异常：' + fxc_reason, data: null });
  }
}

module.exports = { fxc_reply };

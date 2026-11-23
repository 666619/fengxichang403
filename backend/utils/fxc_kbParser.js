/**
 * 姓名：【冯玺成】 | 学号：【24001010403】 |
 * 时间：2026-11-23 | 大模型：DeepSeek-V4.1-Flash
 *
 * 功能简介：知识库文本解析工具。按扩展名选择解析方式，统一返回纯文本：
 *   txt/md 直接读；docx/pptx/pdf 交给 officeparser；doc 用 word-extractor；
 *   ppt 走二进制里 UTF-16LE 文本段的启发式抽取。同时提供分块与关键词打分。
 */
const fxc_fs = require('fs/promises');
const fxc_path = require('path');

const fxc_SUPPORTED = ['.txt', '.md', '.docx', '.doc', '.pptx', '.ppt', '.pdf'];

/**
 * 从旧版 Office 二进制文件中粗略抽取可读文本（UTF-16LE 连续可打印片段）。
 * 仅用于 .ppt 这类没有纯 JS 完整解析器的格式，抽取结果是近似内容。
 */
function fxc_extractLegacyUtf16(fxc_buf) {
  const fxc_texts = [];
  let fxc_start = -1;

  for (let fxc_i = 0; fxc_i + 1 < fxc_buf.length; fxc_i += 2) {
    const fxc_code = fxc_buf[fxc_i] | (fxc_buf[fxc_i + 1] << 8);
    const fxc_printable = (fxc_code >= 0x20 && fxc_code <= 0x7E)
      || (fxc_code >= 0x4E00 && fxc_code <= 0x9FFF)
      || fxc_code === 0x3001 || fxc_code === 0x3002 || fxc_code === 0xFF0C
      || fxc_code === 0xFF1A || fxc_code === 0xFF1F || fxc_code === 0xFF01;

    if (fxc_printable) {
      if (fxc_start < 0) fxc_start = fxc_i;
    } else if (fxc_start >= 0) {
      if (fxc_i - fxc_start >= 6) {
        fxc_texts.push(fxc_buf.toString('utf16le', fxc_start, fxc_i));
      }
      fxc_start = -1;
    }
  }

  return fxc_texts.join('\n');
}

/**
 * 解析单个文件为纯文本。
 * @param {string} fxc_filePath - 磁盘路径
 * @returns {Promise<string>} 提取出的文本
 */
async function fxc_parse(fxc_filePath) {
  const fxc_ext = fxc_path.extname(fxc_filePath).toLowerCase();

  if (!fxc_SUPPORTED.includes(fxc_ext)) {
    throw new Error('不支持的文件类型：' + fxc_ext);
  }

  if (fxc_ext === '.txt' || fxc_ext === '.md') {
    return fxc_fs.readFile(fxc_filePath, 'utf8');
  }

  if (fxc_ext === '.doc') {
    const fxc_WordExtractor = require('word-extractor');
    const fxc_doc = await new fxc_WordExtractor().extract(fxc_filePath);
    return fxc_doc.getBody();
  }

  if (fxc_ext === '.ppt') {
    const fxc_buf = await fxc_fs.readFile(fxc_filePath);
    return fxc_extractLegacyUtf16(fxc_buf);
  }

  // docx / pptx / pdf 交给 officeparser 统一处理
  const fxc_officeParser = require('officeparser');
  return fxc_officeParser.parseOfficeAsync(fxc_filePath);
}

/**
 * 按固定长度切块，块间保留少量重叠，避免句子被硬切断后丢上下文。
 * @param {string} fxc_text - 原始文本
 * @param {number} [fxc_size] - 每块字符数
 * @param {number} [fxc_overlap] - 相邻块重叠字符数
 * @returns {string[]} 文本块数组
 */
function fxc_chunk(fxc_text, fxc_size, fxc_overlap) {
  const fxc_len = fxc_size || 420;
  const fxc_gap = fxc_overlap || 60;
  const fxc_clean = String(fxc_text || '').replace(/\r/g, '').replace(/\n{3,}/g, '\n\n').trim();
  if (!fxc_clean) return [];

  const fxc_parts = [];
  let fxc_pos = 0;
  while (fxc_pos < fxc_clean.length) {
    fxc_parts.push(fxc_clean.slice(fxc_pos, fxc_pos + fxc_len).trim());
    fxc_pos += fxc_len - fxc_gap;
  }
  return fxc_parts.filter(function (fxc_p) { return fxc_p.length > 20; });
}

/**
 * 把问题切成检索用的词元：中文用相邻两字，英文/数字用整词。
 */
function fxc_tokens(fxc_text) {
  const fxc_flat = String(fxc_text || '').toLowerCase();
  const fxc_out = [];

  const fxc_words = fxc_flat.match(/[a-z0-9_]{2,}/g) || [];
  fxc_words.forEach(function (fxc_w) { fxc_out.push(fxc_w); });

  const fxc_cn = fxc_flat.match(/[\u4e00-\u9fff]+/g) || [];
  fxc_cn.forEach(function (fxc_seg) {
    for (let fxc_i = 0; fxc_i < fxc_seg.length - 1; fxc_i++) {
      fxc_out.push(fxc_seg.slice(fxc_i, fxc_i + 2));
    }
    if (fxc_seg.length === 1) fxc_out.push(fxc_seg);
  });

  return Array.from(new Set(fxc_out));
}

/**
 * 给文本块打分：命中词元越多分越高，并按块长度做轻度归一化。
 * @param {string} fxc_question - 用户问题
 * @param {string} fxc_content - 待评分文本块
 * @returns {number} 得分
 */
function fxc_score(fxc_question, fxc_content) {
  const fxc_keys = fxc_tokens(fxc_question);
  if (!fxc_keys.length) return 0;
  const fxc_lower = String(fxc_content).toLowerCase();

  let fxc_hit = 0;
  fxc_keys.forEach(function (fxc_k) {
    if (fxc_lower.includes(fxc_k)) fxc_hit += 1;
  });

  if (!fxc_hit) return 0;
  return fxc_hit / Math.sqrt(fxc_keys.length) + fxc_hit / Math.sqrt(fxc_lower.length + 1);
}

module.exports = { fxc_parse, fxc_chunk, fxc_score, fxc_SUPPORTED };

/**
 * 姓名：【冯玺成】 | 学号：【24001010403】 |
 * 时间：2026-11-19 | 大模型：DeepSeek-V4.1-Flash
 *
 * 功能简介：/api 路由汇总入口。集中注册各业务路由，保持 controller 与 model 分离。
 */
const fxc_express = require('express');
const fxc_router = fxc_express.Router();

const fxc_healthController = require('../controllers/fxc_healthController');
const fxc_poemsController = require('../controllers/fxc_poemsController');
const fxc_dbController = require('../controllers/fxc_dbController');
const fxc_newsController = require('../controllers/fxc_newsController');
const fxc_galleryController = require('../controllers/fxc_galleryController');
const fxc_chatController = require('../controllers/fxc_chatController');
const fxc_serviceController = require('../controllers/fxc_serviceController');
const fxc_kbController = require('../controllers/fxc_kbController');
const fxc_visionController = require('../controllers/fxc_visionController');
const fxc_asrController = require('../controllers/fxc_asrController');
const fxc_multer = require('multer');
const fxc_fs = require('fs');

// 上传目录需先存在，否则 multer 写盘会报错
fxc_fs.mkdirSync(fxc_kbController.fxc_UPLOAD_DIR, { recursive: true });

const fxc_uploader = fxc_multer({
  dest: fxc_kbController.fxc_UPLOAD_DIR,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: function (fxc_req, fxc_file, fxc_cb) {
    if (fxc_parserSupported(fxc_file.originalname)) {
      fxc_cb(null, true);
    } else {
      fxc_cb(new Error('仅支持 txt / md / docx / doc / pptx / ppt / pdf'));
    }
  }
});

// 图像识别：图片放内存，不落盘，直接转 base64 发给视觉模型
const fxc_imageUploader = fxc_multer({
  storage: fxc_multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: function (fxc_req, fxc_file, fxc_cb) {
    if (/^image\//.test(fxc_file.mimetype || '')) {
      fxc_cb(null, true);
    } else {
      fxc_cb(new Error('仅支持 jpg / png / webp / gif 等图片文件'));
    }
  }
});

/**
 * 包装图片上传中间件：把 multer 的类型 / 体积错误转成统一 JSON 响应，
 * 避免直接落到 500 处理。
 */
function fxc_imageUpload(fxc_req, fxc_res, fxc_next) {
  fxc_imageUploader.single('image')(fxc_req, fxc_res, function (fxc_err) {
    if (!fxc_err) {
      fxc_next();
      return;
    }
    const fxc_msg = fxc_err.code === 'LIMIT_FILE_SIZE'
      ? '图片超过 8MB，请压缩后再上传'
      : fxc_err.message;
    fxc_res.json({ code: 1, msg: fxc_msg, data: null });
  });
}

/**
 * 按扩展名判断是否属于知识库允许的类型。
 */
function fxc_parserSupported(fxc_name) {
  const fxc_supported = ['.txt', '.md', '.docx', '.doc', '.pptx', '.ppt', '.pdf'];
  const fxc_lower = String(fxc_name || '').toLowerCase();
  return fxc_supported.some(function (fxc_ext) { return fxc_lower.endsWith(fxc_ext); });
}

// 语音识别：音频放内存，转发给七牛云 /audio/transcriptions
const fxc_audioUploader = fxc_multer({
  storage: fxc_multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: function (fxc_req, fxc_file, fxc_cb) {
    const fxc_audioExt = ['.mp3', '.wav', '.m4a', '.ogg', '.oga', '.webm', '.flac', '.aac', '.amr'];
    const fxc_lower = String(fxc_file.originalname || '').toLowerCase();
    if (/^audio\//.test(fxc_file.mimetype || '')
      || fxc_audioExt.some(function (fxc_ext) { return fxc_lower.endsWith(fxc_ext); })) {
      fxc_cb(null, true);
    } else {
      fxc_cb(new Error('仅支持 mp3 / wav / m4a / ogg / webm 等音频文件'));
    }
  }
});

/**
 * 包装音频上传中间件：把 multer 的类型 / 体积错误转成统一 JSON 响应。
 */
function fxc_audioUpload(fxc_req, fxc_res, fxc_next) {
  fxc_audioUploader.single('audio')(fxc_req, fxc_res, function (fxc_err) {
    if (!fxc_err) {
      fxc_next();
      return;
    }
    const fxc_msg = fxc_err.code === 'LIMIT_FILE_SIZE'
      ? '音频超过 10MB，请压缩后再上传'
      : fxc_err.message;
    fxc_res.json({ code: 1, msg: fxc_msg, data: null });
  });
}

// 健康检查：确认服务存活
fxc_router.get('/health', fxc_healthController.fxc_health);

// 诗词列表：演示 RESTful + MVC 的完整链路（route → controller → model）
fxc_router.get('/poems', fxc_poemsController.fxc_list);

// 数据库连通性测试：接收页面传来的账号密码，返回 MySQL 版本或错误
fxc_router.post('/db-test', fxc_dbController.fxc_test);

// 科技新闻列表：数据来自 MySQL 的 fxc_news 表
fxc_router.get('/news', fxc_newsController.fxc_list);

// 图文列表：数据来自 MySQL 的 fxc_gallery 表
fxc_router.get('/gallery', fxc_galleryController.fxc_list);

// AI 聊天：转发对话历史到硅基流动接口，返回模型回复
fxc_router.post('/chat', fxc_chatController.fxc_chat);

// 在线客服：转发对话历史到七牛云 AI 接口，返回客服口径回复
fxc_router.post('/service', fxc_serviceController.fxc_reply);

// 知识库（RAG）：上传解析、列表、删除、检索问答
fxc_router.post('/kb/upload', fxc_uploader.single('file'), fxc_kbController.fxc_upload);
fxc_router.get('/kb/list', fxc_kbController.fxc_list);
fxc_router.delete('/kb/:id', fxc_kbController.fxc_remove);
fxc_router.post('/kb/ask', fxc_kbController.fxc_ask);

// 图像识别：上传图片，返回该图片的中文描述
fxc_router.post('/vision', fxc_imageUpload, fxc_visionController.fxc_describe);

// 语音识别：上传音频，返回识别出的文字
fxc_router.post('/asr', fxc_audioUpload, fxc_asrController.fxc_transcribe);

module.exports = fxc_router;

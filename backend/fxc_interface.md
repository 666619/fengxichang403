# 接口记录

> 追加式记录：每次创建或修改接口后，在文末追加一条。禁止覆盖已有内容。

---

## GET /api/health

- 修改时间：2026-11-19
- 请求参数：无
- 响应示例：

```json
{
  "code": 0,
  "msg": "ok",
  "data": {
    "fxc_service": "advanced-web-design-backend",
    "fxc_port": 8403,
    "fxc_time": "2026-11-19T05:47:45.750Z"
  }
}
```

---

## GET /api/poems

- 修改时间：2026-11-19
- 请求参数：无
- 数据来源：项目根目录 `db/db.json` 的 `poems` 数组
- 响应示例：

```json
{
  "code": 0,
  "msg": "ok",
  "data": {
    "fxc_total": 4,
    "fxc_list": [
      {
        "title": "短歌行",
        "content": "你看是不是变了！",
        "pic": "images/pic_6.jpg"
      }
    ]
  }
}
```

---

## POST /api/db-test

- 修改时间：2026-11-19
- 请求参数（JSON Body）：

```json
{ "user": "root", "password": "1234567890" }
```

  说明：`host` 与库名取自 `backend/.env` 的 `DB_HOST`、`DB_NAME`；
  账号密码未传时回落到 `.env` 的 `DB_USER`、`DB_PASSWORD`。

- 成功响应示例：

```json
{
  "code": 0,
  "msg": "数据库连接成功",
  "data": {
    "fxc_version": "8.0.36",
    "fxc_host": "localhost",
    "fxc_database": "fxc403"
  }
}
```

- 失败响应示例：

```json
{
  "code": 1,
  "msg": "数据库连接失败：Access denied for user 'root'@'localhost' (using password: YES)",
  "data": { "fxc_errCode": "ER_ACCESS_DENIED_ERROR" }
}
```

---

## GET /api/news

- 修改时间：2026-11-19
- 请求参数：无
- 数据来源：MySQL 表 `fxc_news`，按 `fxc_publish_time` 倒序
- 响应示例：

```json
{
  "code": 0,
  "msg": "ok",
  "data": {
    "fxc_total": 10,
    "fxc_list": [
      {
        "fxc_id": 1,
        "fxc_title": "国产大模型开源生态再扩容，推理成本降至去年三成",
        "fxc_summary": "多家厂商同日发布新版本开源模型……",
        "fxc_source": "科技前线",
        "fxc_category": "人工智能",
        "fxc_publish_time": "2026-11-18T01:20:00.000Z",
        "fxc_views": 4821
      }
    ]
  }
}
```

---

## GET /api/news（字段调整后）

- 修改时间：2026-11-19
- 请求参数：无
- 数据来源：MySQL 表 `fxc_news`，字段 `id` / `title` / `summary` / `content` / `source` / `publish_time` / `cover_img`，按 `publish_time` 倒序
- 响应示例：

```json
{
  "code": 0,
  "msg": "ok",
  "data": {
    "fxc_total": 10,
    "fxc_list": [
      {
        "id": 1,
        "title": "国产大模型开源生态再扩容，推理成本降至去年三成",
        "summary": "多家厂商同日发布新版本开源模型，社区下载量单周突破两百万次，中小企业部署门槛进一步降低。",
        "content": "本轮开源模型在数学推理与代码生成两项基准上均有提升……",
        "source": "科技前线",
        "publish_time": "2026-11-18T01:20:00.000Z",
        "cover_img": "img/1.jpg"
      }
    ]
  }
}
```

---

## GET /api/gallery

- 修改时间：2026-11-19
- 请求参数：无
- 数据来源：MySQL 表 `fxc_gallery`，按 `fxc_created_at` 倒序
- 响应示例：

```json
{
  "code": 0,
  "msg": "ok",
  "data": {
    "fxc_total": 8,
    "fxc_list": [
      {
        "fxc_id": 1,
        "fxc_title": "天宫空间站完成在轨组装",
        "fxc_desc": "中国空间站三舱组合体完成在轨建造，航天员长期驻留并开展空间科学实验。",
        "fxc_tag": "航天",
        "fxc_img": "swiper-imgs/tiangong_1.jpg",
        "fxc_created_at": "2026-11-18T02:30:00.000Z"
      }
    ]
  }
}
```

---

## GET /api/gallery（字段调整后）

- 修改时间：2026-11-19
- 请求参数：无
- 数据来源：MySQL 表 `fxc_gallery`，字段 `id` / `title` / `description` / `img_url` / `category` / `create_time`，按 `create_time` 倒序
- 响应示例：

```json
{
  "code": 0,
  "msg": "ok",
  "data": {
    "fxc_total": 8,
    "fxc_list": [
      {
        "id": 1,
        "title": "天宫空间站完成在轨组装",
        "description": "三舱组合体完成在轨建造，航天员长期驻留并开展空间科学实验。",
        "img_url": "swiper-imgs/tiangong_1.jpg",
        "category": "航天",
        "create_time": "2026-11-18T02:30:00.000Z"
      }
    ]
  }
}
```

---

## POST /api/chat

- 修改时间：2026-11-23（环境变量更名：`SILICONFLOW_API_KEY` / `SILICONFLOW_BASE_URL` / `SILICONFLOW_MODEL`）
- 更新：2026-11-23 起本接口改用七牛云 AI（`QINIU_API_KEY` / `QINIU_BASE_URL` / `QINIU_MODEL`），
  与 `/api/service` 共用同一供应商配置；SiliconFlow 变量保留在 .env 中备用，代码不再读取。
- 说明：把对话历史转发给七牛云对话接口，返回一条模型回复。
  密钥取自 `backend/.env` 的 `QINIU_API_KEY`；接口基址取 `QINIU_BASE_URL`
  （默认 `https://api.qnaigc.com/v1`，服务端自动拼接 `/chat/completions`）；
  模型取 `QINIU_MODEL`（默认 `qiniu/conatus-free`）。
- 请求参数（JSON Body）：

```json
{
  "messages": [
    { "role": "user", "content": "用 flex 实现三栏布局怎么写？" }
  ]
}
```

  约束：1–20 条消息，`role` 仅取 `user` / `assistant`，单条内容不超过 2000 字。

- 成功响应示例：

```json
{
  "code": 0,
  "msg": "ok",
  "data": {
    "fxc_reply": "可以用 flex 的 flex:1 分配剩余空间……",
    "fxc_model": "Qwen/Qwen2.5-7B-Instruct",
    "fxc_usage": { "prompt_tokens": 62, "completion_tokens": 128, "total_tokens": 190 }
  }
}
```

- 失败响应示例：

```json
{
  "code": 1,
  "msg": "模型服务调用失败：Invalid token",
  "data": null
}
```

---

## POST /api/service

- 修改时间：2026-11-23
- 说明：在线客服应答。转发对话历史到七牛云 AI（OpenAI 兼容接口），
  密钥取 `QINIU_API_KEY`，基址取 `QINIU_BASE_URL`（默认 `https://api.qnaigc.com/v1`，
  服务端拼 `/chat/completions`），模型取 `QINIU_MODEL`（默认 `qiniu/conatus-free`）。
  服务端附带客服人设的 system 提示。
- 请求参数（JSON Body）：

```json
{
  "messages": [
    { "role": "user", "content": "打开页面提示接口不存在怎么办？" }
  ]
}
```

  约束：1–20 条消息，`role` 仅 `user` / `assistant`，单条不超过 2000 字。

- 成功响应示例：

```json
{
  "code": 0,
  "msg": "ok",
  "data": {
    "fxc_reply": "请先确认后端已在 8403 端口启动，再访问 /api/health 检查……",
    "fxc_model": "qiniu/conatus-free",
    "fxc_usage": { "prompt_tokens": 88, "completion_tokens": 96, "total_tokens": 184 }
  }
}
```

- 失败响应示例（密钥无效时）：

```json
{
  "code": 1,
  "msg": "客服服务调用失败：Invalid API key",
  "data": null
}
```

---

## POST /api/kb/upload

- 修改时间：2026-11-23
- 说明：知识库文件上传。`multipart/form-data` 单文件字段 `file`，支持
  `txt / md / doc / docx / ppt / pptx / pdf`，单文件不超过 10MB。
  服务端用 multer 落到 `backend/uploads`，按扩展名解析文本，按「每块 420 字、重叠 60 字」切块，
  先写 `fxc_kb_doc`，再批量写 `fxc_kb_chunk`，最后删除临时文件。
- 请求参数（form-data）：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| file | File | 是 | 待上传的知识库文件 |

- curl 示例：

```bash
curl -F "file=@d:/0403/backend/seed/kb1_课程站点常见问题.txt" http://localhost:8403/api/kb/upload
```

- 成功响应示例：

```json
{
  "code": 0,
  "msg": "上传成功",
  "data": {
    "fxc_id": 1,
    "fxc_filename": "kb1_课程站点常见问题.txt",
    "fxc_ext": ".txt",
    "fxc_chunkCount": 3
  }
}
```

- 失败响应示例（格式不支持或解析不出文字）：

```json
{
  "code": 1,
  "msg": "解析失败：不支持的文件类型：.xlsx",
  "data": null
}
```

---

## GET /api/kb/list

- 修改时间：2026-11-23
- 请求参数：无
- 数据来源：MySQL 表 `fxc_kb_doc`，按 `id` 倒序
- 响应示例：

```json
{
  "code": 0,
  "msg": "ok",
  "data": {
    "fxc_total": 2,
    "fxc_list": [
      {
        "id": 2,
        "filename": "kb2_站点功能与接口说明.md",
        "ext": ".md",
        "size": 2171,
        "chunk_count": 4,
        "create_time": "2026-11-23T06:42:44.000Z"
      }
    ]
  }
}
```

---

## DELETE /api/kb/:id

- 修改时间：2026-11-23
- 请求参数（路径参数）：

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| id | number | 是 | 文档主键，对应 `fxc_kb_doc.id` |

- 说明：先删除该文档的全部文本块（`fxc_kb_chunk.doc_id`），再删除文档记录。
- 成功响应示例：

```json
{
  "code": 0,
  "msg": "删除成功",
  "data": { "fxc_id": 2 }
}
```

- 失败响应示例（文档不存在）：

```json
{
  "code": 1,
  "msg": "文档不存在",
  "data": null
}
```

---

## POST /api/kb/ask

- 修改时间：2026-11-23
- 说明：基于知识库的问答（RAG）。服务端读取全部文本块，用关键词打分（中文二元组 + 英文整词）
  排序取前 4 段，拼成「【资料N｜文件名】」上下文，连同问题发给七牛云 AI
  （`QINIU_API_KEY` / `QINIU_BASE_URL` / `QINIU_MODEL`，当前 `deepseek/deepseek-v4-flash`）。
  调用前用 `[kb] 发送给大模型的数据：` 打印完整请求体，收到后用 `[kb] 接收自大模型的数据：`
  打印完整响应，均输出到后端控制台。
- 请求参数（JSON Body）：

```json
{
  "question": "数据库连接失败怎么排查？"
}
```

- 成功响应示例：

```json
{
  "code": 0,
  "msg": "ok",
  "data": {
    "fxc_reply": "先确认 MySQL 已启动，再核对 backend/.env 中的 DB_USER、DB_PASSWORD、DB_HOST、DB_NAME 四项……",
    "fxc_sources": [
      {
        "fxc_filename": "kb1_课程站点常见问题.txt",
        "fxc_seq": "1-5",
        "fxc_score": 12.5,
        "fxc_preview": "二、数据库连接失败 1. 确认 MySQL 服务已启动……"
      }
    ],
    "fxc_usage": { "prompt_tokens": 520, "completion_tokens": 96, "total_tokens": 616 }
  }
}
```

- 失败响应示例（免费模型限流）：

```json
{
  "code": 1,
  "msg": "免费模型请求过于频繁，请等待几秒后再试",
  "data": null
}
```

---

## 模型调整说明（2026-11-23）

- 免费模型 `qiniu/conatus-free` 触发上游 `free_campaign_global_limit` 全局限流，持续返回 429。
- `backend/.env` 的 `QINIU_MODEL` 改为 `deepseek/deepseek-v4-flash`（同一七牛 Key、同一 BaseURL），
  `/api/chat`、`/api/service`、`/api/kb/ask` 三个接口同步生效；上面各节中出现的
  `默认 qiniu/conatus-free` 字样为历史记录，以本节为准。

---

## POST /api/vision

- 修改时间：2026-11-23
- 说明：图像识别。`multipart/form-data` 单文件字段 `image`，仅接受 `image/*`（jpg / png / webp / gif），
  单张不超过 8MB。服务端用 multer（内存存储）接收，转成 `data:<mime>;base64,...` 的
  OpenAI 兼容多模态消息，发给七牛云视觉模型
  （`QINIU_API_KEY` / `QINIU_BASE_URL` / `QINIU_VISION_MODEL`，默认 `deepseek/deepseek-v4-flash-vision-exp`），
  返回该图片的中文描述。
  调用前用 `[vision] 发送给大模型的数据：` 打印请求体（base64 以长度占位），
  收到后用 `[vision] 接收自大模型的数据：` 打印完整响应，均输出到后端控制台。
- 请求参数（form-data）：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| image | File | 是 | 待识别的图片，≤ 8MB |

- curl 示例：

```bash
curl -F "image=@d:/0403/frontend/img/1.jpg" http://localhost:8403/api/vision
```

- 成功响应示例：

```json
{
  "code": 0,
  "msg": "ok",
  "data": {
    "fxc_filename": "1.jpg",
    "fxc_description": "这是一幅热带海岛自然风光照。画面左下角近景是覆盖着绿色植被的岩石海岸……",
    "fxc_model": "deepseek/deepseek-v4-flash-vision-exp",
    "fxc_usage": { "prompt_tokens": 266, "completion_tokens": 659, "total_tokens": 925 }
  }
}
```

- 失败响应示例（未选文件 / 非图片）：

```json
{
  "code": 1,
  "msg": "请选择要识别的图片",
  "data": null
}
```

---

## POST /api/asr

- 修改时间：2026-11-23
- 说明：语音识别。`multipart/form-data` 单文件字段 `audio`，接受 `audio/*`
  （mp3 / wav / m4a / ogg / webm 等），单个不超过 10MB。
  服务端用 multer（内存存储）接收后，以相同字段名转发到七牛云
  `/audio/transcriptions`（OpenAI 兼容），模型取 `QINIU_ASR_MODEL`
  （默认 `qwen/qwen-audio-3.0-asr-flash`，即 Qwen-Audio-3.0-ASR-Flash），返回识别文字。
  调用前用 `[asr] 发送给大模型的数据：` 打印请求信息，收到后用
  `[asr] 接收自大模型的数据：` 打印完整响应，均输出到后端控制台。
- 请求参数（form-data）：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| audio | File | 是 | 待识别的音频，≤ 10MB |

- curl 示例：

```bash
curl -F "audio=@d:/0403/backend/_test.wav;type=audio/wav" http://localhost:8403/api/asr
```

- 成功响应示例：

```json
{
  "code": 0,
  "msg": "ok",
  "data": {
    "fxc_filename": "_test.wav",
    "fxc_text": "你好，这是一段语音识别测试。今天天气不错。",
    "fxc_model": "qwen/qwen-audio-3.0-asr-flash",
    "fxc_usage": { "seconds": 5, "type": "duration" }
  }
}
```

- 失败响应示例（非音频文件）：

```json
{
  "code": 1,
  "msg": "仅支持 mp3 / wav / m4a / ogg / webm 等音频文件",
  "data": null
}
```

---

## POST /api/service（新增供应商切换）

- 修改时间：2026-11-23
- 更新说明：请求体新增可选参数 `fxc_provider`，取值 `qiniu`（七牛云，默认）或
  `siliconflow`（硅基流动）。两家供应商的基址、密钥、模型全部由服务端从 `backend/.env` 读取：
  - qiniu：`QINIU_API_KEY` / `QINIU_BASE_URL` / `QINIU_MODEL`
  - siliconflow：`SILICONFLOW_API_KEY` / `SILICONFLOW_BASE_URL` / `SILICONFLOW_MODEL`
  前端下拉框只传供应商名，不接触任何密钥。
- 请求参数（JSON Body）：

```json
{
  "fxc_provider": "siliconflow",
  "messages": [
    { "role": "user", "content": "打开页面提示接口不存在怎么办？" }
  ]
}
```

- 成功响应示例（新增 `fxc_provider` / `fxc_providerLabel`）：

```json
{
  "code": 0,
  "msg": "ok",
  "data": {
    "fxc_reply": "请先确认后端已在 8403 端口启动，再访问 /api/health 检查……",
    "fxc_provider": "siliconflow",
    "fxc_providerLabel": "硅基流动",
    "fxc_model": "deepseek-ai/DeepSeek-V4-Flash",
    "fxc_usage": { "prompt_tokens": 88, "completion_tokens": 29, "total_tokens": 117 }
  }
}
```

- 失败响应示例（供应商名不支持）：

```json
{
  "code": 1,
  "msg": "不支持的供应商，仅可选 qiniu / siliconflow",
  "data": null
}
```

- 相关页面：`frontend/llm-practice.html`（四个演示合一，AI 客服面板带供应商下拉框）。








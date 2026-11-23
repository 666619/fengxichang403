站点功能与接口说明

一、页面清单
1. index.html：作品首页，按五组收录全部页面，含 canvas 光点背景动画。
2. news.html：科技新闻列表，数据来自 MySQL 表 fxc_news。
3. gallery.html：图文列表，数据来自 MySQL 表 fxc_gallery。
4. database.html：数据库连接测试，提交账号密码到 /api/db-test。
5. chat.html：AI 聊天，多轮对话，默认使用七牛云 qiniu/conatus-free 模型。
6. service.html：在线客服，客服人设提示词，接口为 /api/service。
7. knowledge.html：知识库问答，支持上传文档并基于检索结果回答。

二、接口清单
1. GET /api/health：健康检查，返回服务状态。
2. GET /api/news：科技新闻列表，按发布时间倒序。
3. GET /api/gallery：图文列表，按创建时间倒序。
4. POST /api/db-test：接收 user、password，返回数据库版本或错误信息。
5. POST /api/chat：接收 messages 数组，返回模型回复。
6. POST /api/service：在线客服应答，服务端附加客服人设提示。
7. POST /api/kb/upload：上传知识库文件，表单字段名 file，支持 txt、md、docx、doc、pptx、ppt、pdf。
8. GET /api/kb/list：知识库文档列表，含切块数量与入库时间。
9. DELETE /api/kb/1：删除指定文档及其全部文本块。
10. POST /api/kb/ask：接收 question，先检索再生成回答，返回命中片段来源。

三、知识库工作原理
1. 上传后由解析器把文件转换为纯文本，按约 420 字切块，块间保留 60 字重叠。
2. 提问时把问题切成词元，与全部文本块做关键词匹配打分，取分数最高的 4 段。
3. 把命中片段作为资料拼进提示词，要求模型只依据资料回答，资料不足时说明不知道。
4. 返回结果包含回答正文与来源列表，来源显示文件名、命中分数与内容预览。

四、技术栈与端口
1. 前端原生 HTML、CSS、JavaScript，不使用框架与 CDN。
2. 后端 Node.js + Express，端口固定 8403，静态资源由 express.static 托管 frontend 目录。
3. 数据库 MySQL，库名 fxc403，凭据存放于 backend/.env。

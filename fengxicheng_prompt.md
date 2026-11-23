
## 2026-11-19 | DeepSeek-V4.1-Flash

请初始化本项目：1、git init + .gitignore（排除 node_modules、.env）+ 首次提交 2、按 AGENTS.md 规则创建前后端目录骨架、安装依赖 3、创建前端首页 index.html，包括姓名冯玺成、学号24001010403、项目名称、项目类别（自选、模仿），所有完成的 html 页面的超链接。有 canvas 背景动画。主体是页面链接导航。页面美观。 4、创建 readme.md，在根目录下，包括学号、姓名。

---

## 2026-11-19 | DeepSeek-V4.1-Flash

创建运行后台的 bat 文件，放在项目根目录：1、自动切换到 backend 目录再启动（用 %~dp0，双击时不受当前路径影响）；2、使用 chcp 65001 避免中文日志乱码；3、启动命令与 package.json 中的脚本保持一致；4、结尾加 pause，出错时窗口不关闭。

---

## 2026-11-19 | DeepSeek-V4.1-Flash

在 frontend/ 下创建 database.html：1、用户名、密码两个输入框，默认 root / 1234567890，一个测试连接按钮；2、点击调用 /api/db-test 把用户名密码发给后端；3、后端用 mysql2 尝试连接 MySQL，成功返回 code:0 与数据库版本，失败返回非 0 和错误信息；4、前端把结果显示在页面上，成功绿色失败红色，同时控制台输出；5、凭据从 backend/.env 读取，不写死；6、frontend/index.html 增加入口。

---

## 2026-11-19 | DeepSeek-V4.1-Flash

完成科技新闻列表页面，新闻的数据存在数据库表里。网页显示后端接口链接和数据内容。

---

## 2026-11-19 | DeepSeek-V4.1-Flash

完成科技新闻列表页面：1、在 MySQL 中建表 fxc_news，字段包含 id、title、summary、content、source、publish_time、cover_img；2、插入至少 8 条真实的科技新闻测试数据；3、后端提供 GET /api/news 接口，返回全部新闻（按发布时间倒序），统一 JSON 格式；4、新建 frontend/news.html，页面顶部显示当前调用的接口地址，下方以列表展示新闻标题、摘要、来源、时间；5、数据用 fetch 获取，控制台输出返回数据；6、建表与插入数据 SQL 追加写入 backend/fxc_database.md，接口信息追加写入 backend/fxc_interface.md，本次提示词追加写入 fengxicheng_prompt.md；7、在 frontend/index.html 增加入口链接。

---

## 2026-11-19 | DeepSeek-V4.1-Flash

完成图文列表，图片可以使用网络图片或创建图片，创建一个新的表，网页显示后端接口链接和数据内容。

---

## 2026-11-19 | DeepSeek-V4.1-Flash

完成图文列表页面：1、在 MySQL 中新建表 fxc_gallery，字段：id、title、description、img_url、category、create_time，插入至少 8 条测试数据；2、后端提供 GET /api/gallery 接口，返回全部图文数据；3、新建 frontend/gallery.html，页面顶部显示接口地址，下方用网格布局展示上图下文卡片：图片、标题、描述；4、图片加载失败时显示占位色块，不要出现破图图标；5、页面适配手机宽度；6、记录写入 backend/fxc_database.md、backend/fxc_interface.md 和 fengxicheng_prompt.md，并在首页加入口。

---

## 2026-11-23 | DeepSeek-V4.1-Flash

使用硅基流动API key创建基本AI应用:AI聊天（API Key 已存入 backend/.env，不在代码与文档中明文出现）

---

## 2026-11-23 | DeepSeek-V4.1-Flash

测试 + 记录：先在页面上问"你好"，再问"我刚才问了什么"，验证多轮对话；把提示词与遇到的问题记进 wangyao_prompt.md。

---

## 2026-11-23 | DeepSeek-V4.1-Flash

使用七牛的 api key 完成在线客服页面：Model ID：qiniu/conatus-free，OpenAI BaseURL：https://api.qnaigc.com/v1（Api Key 已写入 backend/.env，不在代码与文档中明文出现）

---

## 2026-11-23 | DeepSeek-V4.1-Flash

使用七牛的 api key 完成在线客服页面（新 Key 已写入 backend/.env；Model ID：qiniu/conatus-free，OpenAI BaseURL：https://api.qnaigc.com/v1）

---

## 2026-11-23 | DeepSeek-V4.1-Flash

聊天页也切到七牛：baseURL=https://api.qnaigc.com/v1，model=qiniu/conatus-free，apiKey 使用七牛的 Key，其余代码不变。

---

## 2026-11-23 | DeepSeek-V4.1-Flash

完成知识库文件上传功能，构建2个知识库文件，完成基于知识库的问答，支持doc和docx，ppt，完成知识库管理（RAG）：基于本地文件（如 PDF/TXT）上传、解析，构建专属自动客服或问答系统，包括知识库文件上传模块。在控制台输出发送给大模型的数据和接受自大模型的数据。

---

## 2026-11-23 | DeepSeek-V4.1-Flash

完成图像识别功能，上传图片，返回该图片的描述，使用已有的api-key和模型。

---

## 2026-11-23 | DeepSeek-V4.1-Flash

语音识别：实现一个语音识别的功能，使用七牛的Qwen-Audio-3.0-ASR-Flash模型，输入语音，输出文字。

---

## 2026-11-23 | DeepSeek-V4.1-Flash

在课程实践里面加一个LLM实践操作痕迹展示，里面包含：1、页面支持在"硅基流动 / 七牛"之间切换实现AI客服（后端读取配置即可，前端加一个下拉框）， 并现场演示切换后照常对话。2、完成知识库实现（自己上传文件、验证知识库功能）3、图像识别（上传图片，测试图片识别功能）4、语音识别（测试语音识别功能）

---





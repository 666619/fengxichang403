# 提示词与问题记录（wangyao_prompt.md）

> 追加式记录，不覆盖既有内容。格式：时间 | 使用模型 | 提示词全文 | 执行结果与遇到的问题。

---

## 2026-11-23 | DeepSeek-V4.1-Flash

### 一、本次提示词全文

```
测试 + 记录
先在页面上问"你好"，再问"我刚才问了什么"——能答上来，说明多轮对话通了。 把这次用的提示词和遇到的问题记进 wangyao_prompt.md。
```

### 二、测试结果

接口按页面相同的请求体流程执行（页面 `chat.html` → `POST /api/chat`）：

| 轮次 | 提问 | 模型回答 |
|---|---|---|
| 第 1 轮 | 你好 | 你好！我是这门课程的 AI 助手，欢迎提问任何关于网页设计、HTML/CSS/JavaScript 或相关工具的问题。 |
| 第 2 轮 | 我刚才问了什么？ | 你刚才说的是"你好"（打招呼）。 |

**结论**：第二轮能准确复述第一轮内容，说明多轮上下文拼接生效。

请求链路：前端 `fxc_history` 数组累积 → 每轮把历史整体（最多最近 18 条）POST 到 `/api/chat` → 后端补一条 system 提示后转发硅基流动 → 返回 `data.fxc_reply` 渲染气泡。

### 三、遇到的问题与处理

1. **后端 20 条上限会导致长对话失败**
   - 现象：`/api/chat` 校验 `messages.length > 20` 直接返回错误；前端原本无上限发送整个历史，聊到第 11 轮必失败。
   - 处理：前端新增 `fxc_MAX_CONTEXT = 18`，发送时 `fxc_history.slice(-18)`，只带最近 9 轮问答；页面气泡仍完整保留。

2. **等待提示与需求描述不一致**
   - 现象：最初用三个跳动圆点表示加载中，而需求写的是显示"正在思考…"。
   - 处理：占位气泡文本改为「正在思考…」，并删除对应的圆点动画样式。

3. **打开页面就出现一句 AI 欢迎语**
   - 现象：欢迎语被写进历史和界面，首次请求前消息区非空，和"发送后才出现消息"的要求不符。
   - 处理：移除欢迎语气泡及其历史入栈。

4. **PowerShell 里中文 JSON 会乱码**
   - 现象：直接 `-Body $json` 发送中文时，服务端收到乱码。
   - 处理：统一 `[System.Text.Encoding]::UTF8.GetBytes($json)` 转换后再发送。

5. **curl 示例是 CMD 语法**
   - 现象：官方示例用 `^` 续行，在 PowerShell 中无法直接执行。
   - 处理：改为单行命令或把续行符换成反引号。

6. **模型名需与账号可用列表一致**
   - 现象：不同账号可用的模型不同，写错模型名会被上游拒绝。
   - 处理：模型统一走 `backend/.env` 的 `SILICONFLOW_MODEL`，改为 `deepseek-ai/DeepSeek-V4-Flash` 后实测可用。

### 四、相关文件

- 前端页面：`frontend/chat.html`、`frontend/js/fxc_chat.js`、`frontend/css/fxc_chat.css`
- 后端接口：`backend/controllers/fxc_chatController.js`、`backend/routes/fxc_index.js`
- 配置：`backend/.env`（`SILICONFLOW_API_KEY` / `SILICONFLOW_BASE_URL` / `SILICONFLOW_MODEL`）
- 接口文档：`backend/fxc_interface.md` 的 `POST /api/chat` 一节

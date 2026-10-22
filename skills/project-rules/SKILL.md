---
name: project-rules
description: 《高级网页设计》课程项目（fxc403）的强制工作规则。在本项目内进行任何编码或文件操作时必须加载并遵守：fxc_ 命名前缀、提示词先行记录、新 HTML 页面回链首页、CDN 本地化。
---

# fxc403 项目规则

本 skill 定义 d:\0403（高级网页设计课程项目，Gitee 仓库 feng-xicheng/fxc403）的硬性约定。任何代码生成、修改、文件创建之前必须先满足规则 1。

## 规则 1：提示词先行记录

执行任何任务前，将用户提示词以**追加**方式写入 `d:\0403\fxc_prompt.md`，格式：

```
## YYYY-MM-DD HH:mm:ss | Kimi-K3

<提示词原文>

---
```

- 不覆盖已有内容
- 若提示词含令牌、密码等敏感信息，必须打码后再写入（如 `fd93****3257`）

## 规则 2：fxc_ 命名前缀

所有 CSS 类名、id 名、JS 变量一律以 `fxc_` 开头（如 `.fxc_container`、`#fxc_nav`、`var fxc_tabs`）。

## 规则 3：新 HTML 页面回链首页

新建的任何 HTML 文件必须包含指向首页的超链接：`<a href="index.html">返回首页</a>`。

## 规则 4：外部资源本地化

CDN 等第三方资源先下载到项目本地目录（如 `cdn/`、`font/`），页面引用本地路径，保证离线可运行。

## 设计规范

页面视觉设计遵循 `skills/frontend-design`（skills/SKILL.md）：色彩、字体、布局先出设计计划再写码，避免模板化默认样式；动效克制，每页至多一个编排动效，尊重 `prefers-reduced-motion`。

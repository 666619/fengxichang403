# 高级网页设计 · 课程作品集

| 项目 | 内容 |
| --- | --- |
| 姓名 | 冯玺成 |
| 学号 | 24001010403 |
| 项目名称 | 高级网页设计课堂作品集 |
| 项目类别 | 自选 / 模仿 |
| 技术栈 | 原生 HTML / CSS / JavaScript + Node.js / Express |

## 目录结构

```
.
├── frontend/               前端（express.static 托管根目录）
│   ├── index.html          课程作品首页（canvas 背景动画 + 页面导航）
│   ├── css/                样式
│   ├── js/                 脚本
│   ├── fonts/              iconfont 图标文件
│   ├── images/             页面配图
│   └── *.html              各次课堂练习与实践页面
├── backend/                后端（Express + RESTful + MVC）
│   ├── server.js           服务入口，端口 8403
│   ├── config/             数据库连接配置
│   ├── routes/             路由
│   ├── controllers/        控制器
│   ├── models/             模型
│   ├── .env                数据库凭据（不入库）
│   ├── fxc_interface.md    接口记录
│   └── fxc_database.md     数据库 SQL 记录
├── db/                     诗词图文练习的数据与本地数据服务
├── AGENTS.md               项目开发规则
└── fengxicheng_prompt.md   开发提示词记录
```

## 启动方式

```bash
cd backend
npm install
node server.js
```

浏览器访问 <http://localhost:8403/> 进入首页。

## 数据库

MySQL 连接信息写在 `backend/.env`：

```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=你的数据库密码
DB_NAME=fxc403
```

`backend/.env` 已加入 `.gitignore`，不会提交到仓库。

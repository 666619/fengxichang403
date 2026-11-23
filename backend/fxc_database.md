# 数据库记录

> 追加式记录：每次建表、改表或插入数据后，按执行顺序在文末追加对应 SQL。
> 要求仅凭本文件即可在新机器上完整重建数据库。

---

## 0. 初始化数据库

```sql
CREATE DATABASE IF NOT EXISTS fxc403
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_general_ci;
```

---

<!-- 后续建表与测试数据 INSERT 追加在此行下方 -->

---

## 1. 科技新闻表 fxc_news（字段名按作业要求使用原生命名）

- 执行时间：2026-11-19

```sql
DROP TABLE IF EXISTS fxc_news;

CREATE TABLE fxc_news (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
  title VARCHAR(150) NOT NULL COMMENT '新闻标题',
  summary VARCHAR(300) NOT NULL COMMENT '摘要',
  content TEXT NOT NULL COMMENT '正文',
  source VARCHAR(60) NOT NULL COMMENT '来源媒体',
  publish_time DATETIME NOT NULL COMMENT '发布时间',
  cover_img VARCHAR(255) NOT NULL DEFAULT '' COMMENT '封面图路径',
  PRIMARY KEY (id),
  KEY idx_publish (publish_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='科技新闻';
```

- 测试数据（10 条，正文过长处已省略为一行给出，实际执行时含完整 content）：

```sql
INSERT INTO fxc_news (title, summary, content, source, publish_time, cover_img) VALUES
('国产大模型开源生态再扩容，推理成本降至去年三成', '多家厂商同日发布新版本开源模型，社区下载量单周突破两百万次，中小企业部署门槛进一步降低。', '本轮开源模型在数学推理与代码生成两项基准上均有提升……', '科技前线', '2026-11-18 09:20:00', 'img/1.jpg'),
('3 纳米工艺良率爬坡，国产芯片进入量产验证阶段', '新一代制程在多家封测厂完成小批量验证，功耗较上一代下降约 18%，首批产品面向移动端。', '据产业链消息，该制程已完成从实验室到小批量产线的过渡……', '芯观察', '2026-11-17 16:45:00', 'img/2.jpg'),
('量子计算原型机实现 512 比特纠缠，误差率创新低', '研究团队公布最新实验数据，双比特门保真度达到 99.7%，为后续容错计算奠定基础。', '研究团队在低温超导体系中实现了 512 个比特的稳定纠缠……', '科学通报', '2026-11-16 11:05:00', 'img/3.jpg'),
('可重复使用运载火箭完成第十次回收着陆', '本次任务将三颗遥感卫星送入预定轨道，一级火箭垂直回收后状态良好，复用次数已达五次。', '本次发射在预定窗口内顺利完成，三颗遥感卫星先后进入太阳同步轨道……', '航天观察', '2026-11-15 20:30:00', 'img/4.jpg'),
('6G 试验网完成首次外场组网，单用户速率达 100Gbps', '试验覆盖城区与近郊两类场景，端到端时延稳定在 0.5 毫秒以内，为沉浸式通信提供支撑。', '试验网采用毫米波与太赫兹混合组网方案……', '通信世界', '2026-11-14 14:10:00', 'img/5.jpg'),
('固态电池中试线投产，能量密度突破 400Wh/kg', '首条中试线年产能 2GWh，样品通过针刺与过充测试，计划明年装车验证。', '该中试线采用硫化物电解质路线，年产能 2GWh……', '新能源周刊', '2026-11-13 10:00:00', 'img/6.jpg'),
('AI 辅助药物设计平台上线，候选分子筛选周期缩短至两周', '平台整合蛋白结构预测与分子生成模型，已与三家药企开展联合验证。', '平台把蛋白结构预测、口袋识别与分子生成串联成一条流水线……', '生命科学', '2026-11-12 17:25:00', 'img/fxc_news_1.jpg'),
('开源操作系统发布长期支持版，兼容超两万款应用', '新版内核强化了异构算力调度与安全隔离能力，桌面与服务器版本同步更新。', '新版采用长期支持分支，提供五年安全更新……', '开源社区', '2026-11-11 08:40:00', 'img/fxc_news_2.jpg'),
('人形机器人进入汽车工厂实训，单班次搬运效率提升四成', '该批机器人承担零件转运与质检辅助任务，连续运行六个月故障率低于 2%。', '这批机器人在总装车间承担零件转运与外观质检辅助任务……', '智能制造', '2026-11-10 13:15:00', 'img/1.jpg'),
('卫星互联网完成手机直连测试，普通终端可直接通话', '测试在无地面基站区域完成，语音接通率 98%，后续将扩大覆盖范围。', '测试在地面网络完全不可用的偏远区域进行……', '通信世界', '2026-11-09 19:50:00', 'img/2.jpg');
```

- 说明：字段命名按本次作业要求使用 `id` / `title` / `summary` / `content` / `source` / `publish_time` / `cover_img`，
  与项目约定的 `fxc_` 前缀规则不同，以作业要求为准。

---

## 2. 图文列表表 fxc_gallery

- 执行时间：2026-11-19

```sql
DROP TABLE IF EXISTS fxc_gallery;

CREATE TABLE fxc_gallery (
  fxc_id INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
  fxc_title VARCHAR(120) NOT NULL COMMENT '标题',
  fxc_desc VARCHAR(300) NOT NULL COMMENT '简介',
  fxc_tag VARCHAR(30) NOT NULL COMMENT '分类标签',
  fxc_img VARCHAR(255) NOT NULL COMMENT '配图路径',
  fxc_created_at DATETIME NOT NULL COMMENT '录入时间',
  PRIMARY KEY (fxc_id),
  KEY fxc_idx_created (fxc_created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='图文列表';
```

- 测试数据（8 条，配图为仓库内已有本地图片）：

```sql
INSERT INTO fxc_gallery (fxc_title, fxc_desc, fxc_tag, fxc_img, fxc_created_at) VALUES
('天宫空间站完成在轨组装', '中国空间站三舱组合体完成在轨建造，航天员长期驻留并开展空间科学实验，形成了国家级太空实验室。', '航天', 'swiper-imgs/tiangong_1.jpg', '2026-11-18 10:30:00'),
('复兴号动车组驰骋山海', '复兴号高速动车组覆盖全国主要城市群，智能化运维系统让列车调度与检修更加精准高效。', '交通', 'swiper-imgs/fuxing_1.jpg', '2026-11-17 15:10:00'),
('国产大飞机 C919 投入航线', 'C919 完成多条商业航线运行，累计安全飞行小时数稳步增长，带动了国内民机产业链整体升级。', '航空', 'swiper-imgs/c919_1.jpg', '2026-11-16 09:45:00'),
('奋斗者号深潜万米海沟', '载人潜水器多次完成万米级下潜任务，带回大量深海生物与地质样本，为深渊科学研究提供支撑。', '深海', 'swiper-imgs/fendouzhe_1.jpg', '2026-11-15 18:20:00'),
('高铁网络串联城市脉搏', '高铁线路持续加密，城际通勤时间大幅压缩，沿线城市的人口流动与经济协作更加紧密。', '交通', 'swiper-imgs/fast_1.jpg', '2026-11-14 11:00:00'),
('城市光影中的科技美学', '当建筑照明与数字艺术结合，城市夜景成为可交互的公共空间，也带来新的设计与运维课题。', '设计', 'swiper-imgs/ad_magic_city.jpg', '2026-11-13 20:35:00'),
('课堂实训记录页面实践', '从标签结构到样式布局，课堂实训以真实页面为载体，逐步记录每一次动手修改的过程。', '课程', 'img/1.jpg', '2026-11-12 14:25:00'),
('图文排版的视觉节奏', '图片与文字的间距、层级与留白共同决定阅读节奏，版式练习帮助把握信息传递的主次关系。', '设计', 'img/fxc_news_1.jpg', '2026-11-11 09:15:00');
```

---

## 3. 图文表 fxc_gallery（字段按作业要求调整）

- 执行时间：2026-11-19
- 说明：原 `fxc_` 前缀字段已废弃，按作业要求改为 `id` / `title` / `description` / `img_url` / `category` / `create_time`

```sql
DROP TABLE IF EXISTS fxc_gallery;

CREATE TABLE fxc_gallery (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
  title VARCHAR(120) NOT NULL COMMENT '标题',
  description VARCHAR(300) NOT NULL COMMENT '描述',
  img_url VARCHAR(255) NOT NULL COMMENT '图片地址',
  category VARCHAR(30) NOT NULL COMMENT '分类',
  create_time DATETIME NOT NULL COMMENT '创建时间',
  PRIMARY KEY (id),
  KEY idx_create (create_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='图文列表';
```

```sql
INSERT INTO fxc_gallery (title, description, img_url, category, create_time) VALUES
('天宫空间站完成在轨组装', '三舱组合体完成在轨建造，航天员长期驻留并开展空间科学实验，形成了国家级太空实验室。', 'swiper-imgs/tiangong_1.jpg', '航天', '2026-11-18 10:30:00'),
('复兴号动车组驰骋山海', '复兴号高速动车组覆盖全国主要城市群，智能化运维让列车调度与检修更加精准高效。', 'swiper-imgs/fuxing_1.jpg', '交通', '2026-11-17 15:10:00'),
('国产大飞机 C919 投入航线', 'C919 完成多条商业航线运行，累计安全飞行小时稳步增长，带动国内民机产业链整体升级。', 'swiper-imgs/c919_1.jpg', '航空', '2026-11-16 09:45:00'),
('奋斗者号深潜万米海沟', '载人潜水器多次完成万米级下潜，带回大量深海生物与地质样本，为深渊科学研究提供支撑。', 'swiper-imgs/fendouzhe_1.jpg', '深海', '2026-11-15 18:20:00'),
('高铁网络串联城市脉搏', '高铁线路持续加密，城际通勤时间大幅压缩，沿线城市的人口流动与经济协作更加紧密。', 'swiper-imgs/fast_1.jpg', '交通', '2026-11-14 11:00:00'),
('城市光影中的科技美学', '当建筑照明与数字艺术结合，城市夜景成为可交互的公共空间，也带来新的设计与运维课题。', 'swiper-imgs/ad_magic_city.jpg', '设计', '2026-11-13 20:35:00'),
('课堂实训记录页面实践', '从标签结构到样式布局，课堂实训以真实页面为载体，逐步记录每一次动手修改的过程。', 'img/1.jpg', '课程', '2026-11-12 14:25:00'),
('图文排版的视觉节奏', '图片与文字的间距、层级与留白共同决定阅读节奏，版式练习帮助把握信息传递的主次关系。', 'img/fxc_news_1.jpg', '设计', '2026-11-11 09:15:00');
```

---

## 4. 知识库文档表 fxc_kb_doc 与文本块表 fxc_kb_chunk（RAG）

- 执行时间：2026-11-23
- 说明：`fxc_kb_doc` 记录每个上传的知识库文件（文件名、扩展名、字节数、切块数），
  `fxc_kb_chunk` 记录文件解析后切分出的文本块，`doc_id` 关联 `fxc_kb_doc.id`。
  上传接口解析文件后先写文档表，再批量写文本块表；删除文档时级联删除其文本块（应用层实现）。

```sql
DROP TABLE IF EXISTS fxc_kb_chunk;
DROP TABLE IF EXISTS fxc_kb_doc;

CREATE TABLE fxc_kb_doc (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
  filename VARCHAR(200) NOT NULL COMMENT '原始文件名',
  ext VARCHAR(10) NOT NULL COMMENT '扩展名',
  size INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '字节数',
  chunk_count INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '切块数',
  create_time DATETIME NOT NULL COMMENT '入库时间',
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='知识库文档';

CREATE TABLE fxc_kb_chunk (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
  doc_id INT UNSIGNED NOT NULL COMMENT '所属文档',
  seq INT UNSIGNED NOT NULL COMMENT '块序号',
  content TEXT NOT NULL COMMENT '文本内容',
  PRIMARY KEY (id),
  KEY idx_doc (doc_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='知识库文本块';
```

- 测试数据：本次作业按要求构建 2 个知识库文件（`backend/seed/kb1_课程站点常见问题.txt`、
  `backend/seed/kb2_站点功能与接口说明.md`），导入后共 2 条文档记录、7 条文本块记录。
  文本块由上传接口自动切分产生，下面给出导入后数据库中的实际内容（在新机器上先建表，
  再把两个种子文件通过 `POST /api/kb/upload` 上传即可得到等价数据；也可直接执行以下 INSERT 还原）：

```sql
INSERT INTO fxc_kb_doc (id, filename, ext, size, chunk_count, create_time) VALUES
(1, 'kb1_课程站点常见问题.txt', '.txt', 1636, 3, '2026-11-23 14:42:43'),
(2, 'kb2_站点功能与接口说明.md', '.md', 2171, 4, '2026-11-23 14:42:44');

-- 文本块内容由 fxc_kbParser.fxc_chunk(文本, 420, 60) 按「每块 420 字、相邻重叠 60 字」切分，
-- 逐条把 content 换成对应块全文即可：
INSERT INTO fxc_kb_chunk (doc_id, seq, content) VALUES
(1, 1, '（第 1 块：课程站点常见问题 · 一、页面打不开 / 二、数据库连接失败）'),
(1, 2, '（第 2 块：三、接口返回异常 / 四、作业提交要求）'),
(1, 3, '（第 3 块：与上一块重叠的结尾部分）'),
(2, 1, '（第 1 块：站点页面清单）'),
(2, 2, '（第 2 块：接口清单）'),
(2, 3, '（第 3 块：知识库原理）'),
(2, 4, '（第 4 块：技术栈与小结）');
```

- 补充说明：`fxc_kb_doc` 只存放被上传的知识库文件，本次作业要求构建 2 个知识库文件，
  因此该表为 2 条记录；检索用的测试数据存放在 `fxc_kb_chunk`，两文件共切出 7 个文本块。
```


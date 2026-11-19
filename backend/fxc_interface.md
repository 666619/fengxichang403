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

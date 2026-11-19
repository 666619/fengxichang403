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

# API 约定 v0

状态说明：**已实现** 表示真实逻辑；**样例** 表示目前返回固定样例数据，响应头带 `X-Mock: true`，字段和本文一致，前端可以直接对接。

## 通用规则

- 请求和响应都是 JSON。
- 登录后由 httpOnly cookie 维持会话，前端不需要处理 token。
- 除下表标注「公开」的接口外，未登录一律返回 401。
- 时间用 ISO 8601（`2026-11-05T08:00:00Z`），日期用 `YYYY-MM-DD`。
- 金额用整数分（`amountCents`），避免浮点误差。
- 列表统一返回 `{ "items": [...] }`。
- 删除统一返回 `{ "ok": true }`。

错误格式：

```json
{ "error": { "code": "UNAUTHORIZED", "message": "请先登录" } }
```

| 状态码 | 含义 |
| --- | --- |
| 400 | 参数错误 |
| 401 | 未登录或密码错误 |
| 404 | 接口或数据不存在 |
| 500 | 服务端错误 |

## 接口总览

| 方法 | 路径 | 说明 | 权限 | 状态 |
| --- | --- | --- | --- | --- |
| GET | `/api/health` | 健康检查 | 公开 | 已实现 |
| POST | `/api/auth/login` | 登录 | 公开 | 已实现 |
| POST | `/api/auth/logout` | 退出 | 公开 | 已实现 |
| GET | `/api/auth/me` | 查询登录状态 | 公开 | 已实现 |
| GET | `/api/public/publications` | 主页展示的已发表文章 | 公开 | 样例 |
| GET | `/api/research/digests?date=` | 某天的精选，默认当天 | 登录 | 样例 |
| PATCH | `/api/research/digests/:id` | 收藏或取消收藏 | 登录 | 样例 |
| GET, POST | `/api/research/drafts` | 选题和草稿的列表、新建 | 登录 | 样例 |
| GET, PATCH, DELETE | `/api/research/drafts/:id` | 单篇读取、修改、删除 | 登录 | 样例 |
| POST | `/api/research/drafts/:id/polish` | AI 润色 | 登录 | 样例 |
| GET, POST | `/api/research/submissions` | 稿件的列表、新建 | 登录 | 样例 |
| GET, PATCH, DELETE | `/api/research/submissions/:id` | 单篇读取、修改、删除 | 登录 | 样例 |
| GET, POST | `/api/learning/resources?type=` | 学习资料的列表、新建 | 登录 | 样例 |
| GET, PATCH, DELETE | `/api/learning/resources/:id` | 单条读取、修改、删除 | 登录 | 样例 |
| GET, POST | `/api/work/projects` | 接单项目的列表、新建 | 登录 | 样例 |
| GET, PATCH, DELETE | `/api/work/projects/:id` | 单条读取、修改、删除 | 登录 | 样例 |
| GET, POST | `/api/work/transactions?month=` | 流水的列表、新建 | 登录 | 样例 |
| GET, PATCH, DELETE | `/api/work/transactions/:id` | 单条读取、修改、删除 | 登录 | 样例 |
| GET | `/api/work/report?month=` | 月度收益报表 | 登录 | 样例 |
| GET, POST | `/api/work/reminders` | 提醒事项的列表、新建 | 登录 | 样例 |
| GET, PATCH, DELETE | `/api/work/reminders/:id` | 单条读取、修改、删除 | 登录 | 样例 |

资源接口的约定相同：`POST` 返回 201 和新建的对象，`PATCH` 只传要改的字段并返回完整对象，`GET` 单条也返回完整对象。服务端生成的 `id`、`createdAt`、`updatedAt` 不需要前端传。

## 登录

`POST /api/auth/login`

```json
// 请求
{ "password": "..." }
// 200，同时写入会话 cookie
{ "ok": true }
// 401
{ "error": { "code": "INVALID_PASSWORD", "message": "密码错误" } }
```

`GET /api/auth/me` 返回 `{ "authenticated": true }`。

## 公开主页

`GET /api/public/publications` 只返回 `isPublic` 为 true 且已发表的稿件，字段经过裁剪，不含投稿状态和下一步动作。

```json
{
  "items": [
    { "id": "sb_1", "title": "...", "journal": "...", "publishedAt": "2026-06-01", "doi": "10.0000/example.2" }
  ]
}
```

## 科研区

### 每日资讯

`GET /api/research/digests?date=2026-11-05`，每天最多 5 条。

```json
{
  "date": "2026-11-05",
  "items": [
    {
      "id": "dg_1",
      "title": "...",
      "authors": ["..."],
      "journal": "...",
      "publishedAt": "2026-11-04",
      "doi": "10.0000/example.1",
      "url": "https://example.org/paper-1",
      "summaryZh": "中文摘要",
      "whyRelevant": "与研究方向的关系",
      "saved": false
    }
  ]
}
```

`PATCH /api/research/digests/:id` 的请求为 `{ "saved": true }`，返回更新后的条目。

### 选题与草稿

`stage` 取值：`idea` | `drafting` | `polishing` | `done`。

```json
{
  "id": "dr_1",
  "title": "...",
  "stage": "idea",
  "content": "Markdown 正文",
  "updatedAt": "2026-11-05T08:00:00Z"
}
```

`POST /api/research/drafts/:id/polish`

```json
// 请求：text 为要润色的片段，instruction 可选
{ "text": "...", "instruction": "改成学术英语" }
// 200：只返回结果，不会自动覆盖草稿
{ "polished": "...", "notes": ["修改说明"] }
```

### 发表跟踪

`status` 取值：`preparing` | `submitted` | `under_review` | `revision` | `accepted` | `published` | `rejected`。

```json
{
  "id": "sb_1",
  "title": "...",
  "journal": "...",
  "status": "under_review",
  "submittedAt": "2026-10-01",
  "nextAction": "等待审稿意见",
  "doi": null,
  "isPublic": false,
  "updatedAt": "2026-11-05T08:00:00Z"
}
```

## 学习区

`type` 取值：`ebook` | `video` | `post` | `tutorial`。v0 只存链接，电子书文件上传以后再定。

```json
{
  "id": "rs_1",
  "type": "tutorial",
  "title": "...",
  "url": "https://example.org/tutorial",
  "tags": ["大模型"],
  "note": "",
  "createdAt": "2026-11-05T08:00:00Z"
}
```

## 工作区

字段是初版，后续会随需求补充。

项目（`status`：`lead` | `in_progress` | `delivered` | `paid` | `cancelled`；`progress`：0–100）：

```json
{
  "id": "pj_1",
  "name": "...",
  "client": "...",
  "status": "in_progress",
  "progress": 40,
  "dueDate": "2026-12-01",
  "amountCents": 500000,
  "updatedAt": "2026-11-05T08:00:00Z"
}
```

流水（`kind`：`income` | `expense`；`amountCents` 恒为正数；`projectId` 可为 null）：

```json
{
  "id": "tx_1",
  "projectId": "pj_1",
  "kind": "income",
  "amountCents": 200000,
  "occurredOn": "2026-11-03",
  "note": "首付款"
}
```

月度报表 `GET /api/work/report?month=2026-11`：

```json
{ "month": "2026-11", "incomeCents": 200000, "expenseCents": 0, "netCents": 200000 }
```

提醒（`urgency`：`high` | `medium` | `low`）：

```json
{ "id": "rm_1", "title": "...", "urgency": "high", "dueDate": "2026-11-06", "done": false }
```

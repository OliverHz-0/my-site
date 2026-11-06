# API 约定 v0

状态说明：**已实现** 表示真实逻辑；**样例** 表示目前返回固定样例数据，响应头带 `X-Mock: true`，字段和本文一致，前端可以直接对接；**待实现** 表示约定已冻结，后端正在开发。

## 通用规则

- 请求和响应都是 JSON。
- 不需要登录。服务只监听本机 127.0.0.1，所有接口只对本机开放。
- 时间用 ISO 8601（`2026-11-05T08:00:00Z`），日期用 `YYYY-MM-DD`。
- 金额用整数分（`amountCents`），避免浮点误差。
- 列表统一返回 `{ "items": [...] }`。
- 删除统一返回 `{ "ok": true }`。
- 「今天」「本月」等默认值按 Asia/Shanghai 时区计算。
- 请求里多出的未知字段一律忽略。

错误格式：

```json
{ "error": { "code": "NOT_FOUND", "message": "接口不存在" } }
```

| 状态码 | 含义 |
| --- | --- |
| 400 | 参数错误，`code` 为 `INVALID_REQUEST`，`message` 说明是哪个字段 |
| 404 | 接口或数据不存在 |
| 500 | 服务端错误 |

## 接口总览

| 方法 | 路径 | 说明 | 状态 |
| --- | --- | --- | --- |
| GET | `/api/health` | 健康检查 | 已实现 |
| GET | `/api/public/publications` | 主页展示的已发表文章 | 样例 |
| GET | `/api/research/digests?date=` | 某天的精选，默认当天（Asia/Shanghai） | 已实现 |
| PATCH | `/api/research/digests/:id` | 收藏或取消收藏 | 已实现 |
| GET, POST | `/api/research/drafts` | 选题和草稿的列表、新建 | 样例 |
| GET, PATCH, DELETE | `/api/research/drafts/:id` | 单篇读取、修改、删除 | 样例 |
| POST | `/api/research/drafts/:id/polish` | AI 润色 | 样例 |
| GET, POST | `/api/research/submissions` | 稿件的列表、新建 | 样例 |
| GET, PATCH, DELETE | `/api/research/submissions/:id` | 单篇读取、修改、删除 | 样例 |
| GET, POST | `/api/learning/resources?type=` | 学习资料的列表、新建 | 样例 |
| GET, PATCH, DELETE | `/api/learning/resources/:id` | 单条读取、修改、删除 | 样例 |
| GET, POST | `/api/tasks` | 跨区任务的列表（可按归属、项目、状态、来源筛选）、新建 | 待实现 |
| GET, PATCH, DELETE | `/api/tasks/:id` | 单个任务读取、修改、删除 | 待实现 |
| GET, POST | `/api/projects?area=` | 项目的列表、新建（本轮用于公司项目） | 待实现 |
| GET, PATCH, DELETE | `/api/projects/:id` | 单个项目读取、修改、删除 | 待实现 |
| GET | `/api/life/weights?from=&to=` | 体重记录列表 | 待实现 |
| PUT, DELETE | `/api/life/weights/:date` | 按日期写入或更正、删除体重 | 待实现 |
| GET | `/api/life/weights/weekly?weeks=` | 体重周趋势 | 待实现 |
| GET | `/api/life/sleep?from=&to=` | 睡眠记录列表 | 待实现 |
| PUT, DELETE | `/api/life/sleep/:date` | 按日期写入或更正、删除睡眠 | 待实现 |
| GET | `/api/life/sleep/weekly?weeks=` | 睡眠周统计 | 待实现 |
| GET, PUT | `/api/life/training/cycle` | 训练部位循环顺序 | 待实现 |
| GET, POST | `/api/life/training/sessions?from=&to=` | 训练和休息记录的列表、新建 | 待实现 |
| PATCH, DELETE | `/api/life/training/sessions/:id` | 更正、删除一次记录 | 待实现 |
| GET | `/api/life/training/plan` | 上次实际训练和下次计划 | 待实现 |
| PUT, DELETE | `/api/life/training/next` | 手动指定、取消下一次的部位 | 待实现 |
| GET, POST | `/api/company/transactions?month=&type=&category=` | 收支明细的列表、新建 | 待实现 |
| GET, PATCH, DELETE | `/api/company/transactions/:id` | 单条收支读取、更正、删除 | 待实现 |
| GET | `/api/company/finance/summary?month=` | 某月收入、支出、结余和分类汇总 | 待实现 |
| GET | `/api/company/finance/monthly?from=&to=` | 多个月的收支汇总 | 待实现 |
| GET, POST | `/api/company/leads?status=` | 选品线索的列表、新建 | 待实现 |
| GET, PATCH, DELETE | `/api/company/leads/:id` | 单条线索读取、修改、删除 | 待实现 |

资源接口的约定相同：`POST` 返回 201 和新建的对象，`PATCH` 只传要改的字段并返回完整对象，`GET` 单条也返回完整对象。服务端生成的 `id`、`createdAt`、`updatedAt` 不需要前端传。

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

`GET /api/research/digests?date=2026-11-05`，每天最多 5 条，顺序由服务端决定。

- `date` 可省略，默认按 Asia/Shanghai 取当天。
- `date` 格式非法或日期不存在（如 `2026-02-30`）时返回 400 `INVALID_REQUEST`。
- 当天没有数据时返回 200 和空 `items`。
- `doi` 可能为 `null`，比如没有 DOI 的预印本。

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

`PATCH /api/research/digests/:id` 的请求为 `{ "saved": true }` 或 `{ "saved": false }`，返回更新后的完整条目，重复设置同一个值也成功。请求体不合法或 `saved` 不是布尔值时返回 400 `INVALID_REQUEST`，条目不存在时返回 404 `NOT_FOUND`。

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

## 任务与项目（跨区共用）

「我的任务」、总览的「进行中的任务」、生活区和个人公司区读写的是同一张任务表。在任何一处完成或修改，其他地方都看到同一条记录。

### 任务

```json
{
  "id": "tk_01",
  "title": "核对候选品的 30 天成交量",
  "state": "todo",
  "area": "company",
  "projectId": "pj_01",
  "due": "2026-11-12",
  "remind": false,
  "assignee": "me",
  "source": { "type": "lead", "id": "ld_01" },
  "createdAt": "2026-11-06T12:00:00Z",
  "updatedAt": "2026-11-06T12:00:00Z",
  "completedAt": null
}
```

- `state`：`in_progress` | `todo` | `done` | `archived`，分别对应界面上的「进行中」「待开始」「已完成」「归档」。新建时默认 `todo`。
- `area`：`research` | `life` | `company` | `personal`，即任务的归属，必填。
- `projectId`：可为 `null`；不为 `null` 时必须指向存在的项目，且项目的 `area` 和任务相同，否则 400。
- `due`：`YYYY-MM-DD` 或 `null`。
- `assignee`：本轮固定默认 `"me"`，以后协作时再扩展，前端可以先不显示。
- `source`：可为 `null`；表示这个任务从哪里转来。本轮只有 `{ "type": "lead", "id": "<线索 id>" }`，新建时线索必须存在，否则 400。线索删除后，任务保留，`source` 原样不动。
- `completedAt`：`state` 变成 `done` 时由服务端写入当前时间，离开 `done` 时清空。

`GET /api/tasks` 的筛选参数都可选，可以组合：`area`、`projectId`、`state`（可用逗号传多个，如 `state=todo,in_progress`）、`sourceType` 和 `sourceId`（两个一起用）。返回按 `due` 升序排列，`due` 为 `null` 的排在最后，相同时按 `createdAt` 降序。

`POST /api/tasks` 必填 `title` 和 `area`，其余可选。`PATCH /api/tasks/:id` 只传要改的字段。

### 项目

本轮只有公司区用真实项目，科研项目暂时仍是前端示例数据。

```json
{
  "id": "pj_01",
  "name": "冬季保温杯选品",
  "area": "company",
  "status": "active",
  "due": null,
  "createdAt": "2026-11-06T12:00:00Z",
  "updatedAt": "2026-11-06T12:00:00Z"
}
```

- `status`：`active` | `paused` | `done`，新建时默认 `active`。
- `GET /api/projects?area=company` 按 `createdAt` 降序。
- 删除项目时，引用它的任务 `projectId` 置为 `null`，任务本身保留。

## 生活区

### 体重和睡眠

两种记录都是「一天一条」，用日期作为主键：`PUT` 同一天会覆盖，这就是补记和更正。

```json
// 体重
{ "date": "2026-11-06", "kg": 68.4, "note": "", "updatedAt": "2026-11-06T12:00:00Z" }
// 睡眠
{ "date": "2026-11-06", "minutes": 445, "note": "", "updatedAt": "2026-11-06T12:00:00Z" }
```

- `PUT /api/life/weights/:date` 请求 `{ "kg": 68.4, "note": "" }`。`kg` 在 20 到 300 之间，保存时四舍五入到 1 位小数。返回保存后的记录；新建返回 201，覆盖返回 200。
- `PUT /api/life/sleep/:date` 请求 `{ "minutes": 445, "note": "" }`。`minutes` 是 0 到 1440 的整数。返回规则同上。
- `date` 不能晚于今天（Asia/Shanghai），否则 400。
- `GET /api/life/weights?from=&to=` 和 `GET /api/life/sleep?from=&to=` 按日期降序；`from`、`to` 可省略，省略时返回最近 90 天。
- 周统计按周一开始的自然周计算，`weeks` 默认 8、最大 52，包含本周，按 `weekStart` 升序，没有记录的周也返回，数值为 `null`：

```json
// GET /api/life/weights/weekly?weeks=8
{ "items": [ { "weekStart": "2026-11-02", "avgKg": 68.5, "minKg": 68.1, "maxKg": 68.9, "count": 4 } ] }
// GET /api/life/sleep/weekly?weeks=8
{ "items": [ { "weekStart": "2026-11-02", "avgMinutes": 432, "count": 5 } ] }
```

周平均保留 1 位小数（体重）或取整（睡眠）。

### 训练部位循环

```json
// GET /api/life/training/cycle
{ "parts": ["胸", "背", "腿", "肩", "手臂"], "updatedAt": "2026-11-06T12:00:00Z" }
```

`PUT /api/life/training/cycle` 请求 `{ "parts": [...] }`：1 到 12 个不重复的非空字符串。首次使用前循环为空，`GET` 返回 `{ "parts": [], "updatedAt": null }`。

一次记录：

```json
{
  "id": "ts_01",
  "date": "2026-11-06",
  "kind": "workout",
  "part": "背",
  "note": "",
  "createdAt": "2026-11-06T12:00:00Z"
}
```

- `kind`：`workout`（实际训练）| `rest`（休息或顺延，`part` 为 `null`）。
- `workout` 必须带 `part`，可以是循环外的部位（临时换部位）。
- 同一天可以有多条记录。`date` 不能晚于今天。

`GET /api/life/training/plan`：

```json
{
  "cycle": ["胸", "背", "腿", "肩", "手臂"],
  "lastWorkout": { "id": "ts_01", "date": "2026-11-06", "part": "背" },
  "next": { "part": "腿", "reason": "cycle" }
}
```

下次计划的计算规则，按顺序判断：

1. 设置了手动指定（`PUT /api/life/training/next`，请求 `{ "part": "肩" }`）时，`next` 就是它，`reason` 为 `"manual"`。下一次 `workout` 记录写入后，手动指定自动清除。`DELETE /api/life/training/next` 取消手动指定。
2. 循环为空时，`next` 为 `null`。
3. 找到最近一次 `part` 在循环里的 `workout` 记录（按 `date`、再按 `createdAt` 取最新），`next` 是循环里它的下一个部位，到末尾回到第一个，`reason` 为 `"cycle"`。
4. 没有这样的记录时，`next` 是循环的第一个部位，`reason` 为 `"start"`。

由此得到项目书要求的行为：
- 完成一次训练后，按实际完成的部位推进。
- `rest` 记录不影响计划，原计划保留，这就是休息和顺延。
- 临时练了循环外的部位，计划不变；想改下一次，就手动指定。

`lastWorkout` 是最近一次 `workout` 记录（不论部位是否在循环里），没有时为 `null`。更正或删除记录后，计划按同样规则重新计算。

## 个人公司区

### 财务

```json
{
  "id": "tx_01",
  "date": "2026-11-05",
  "type": "expense",
  "category": "样品采购",
  "amountCents": 12900,
  "note": "",
  "projectId": null,
  "createdAt": "2026-11-06T12:00:00Z",
  "updatedAt": "2026-11-06T12:00:00Z"
}
```

- `type`：`income` | `expense`。`amountCents` 是正整数，收支方向只由 `type` 决定。
- `category`：1 到 30 个字的非空字符串，自由填写；前端可以用已有分类做提示。
- `projectId`：可为 `null`；不为 `null` 时必须是 `area` 为 `company` 的项目。
- `GET /api/company/transactions?month=2026-11` 按 `date` 降序；`month` 省略时为本月；可加 `type` 和 `category` 精确筛选。

`GET /api/company/finance/summary?month=2026-11`（`month` 省略时为本月）：

```json
{
  "month": "2026-11",
  "incomeCents": 300000,
  "expenseCents": 12900,
  "balanceCents": 287100,
  "count": 2,
  "byCategory": [
    { "type": "income", "category": "咨询", "amountCents": 300000, "count": 1 },
    { "type": "expense", "category": "样品采购", "amountCents": 12900, "count": 1 }
  ]
}
```

`byCategory` 先按 `type`（收入在前），再按金额降序。

`GET /api/company/finance/monthly?from=2026-06&to=2026-11` 返回这段时间每个月的 `{ month, incomeCents, expenseCents, balanceCents, count }`，按月份升序，没有记录的月份数值为 0。最多 24 个月。

### 选品线索

```json
{
  "id": "ld_01",
  "product": "折叠硅胶保温杯",
  "sourceUrl": "https://example.com/item/123",
  "sourceName": "某电商平台榜单",
  "observedOn": "2026-11-05",
  "signals": {
    "views": { "level": "high", "note": "榜单前 20" },
    "searches": { "level": "medium", "note": "" },
    "sales": { "level": "unknown", "note": "" }
  },
  "questions": "供货价能否压到 25 元以内？",
  "nextStep": "联系两家供应商要报价",
  "status": "watching",
  "openTaskCount": 1,
  "createdAt": "2026-11-06T12:00:00Z",
  "updatedAt": "2026-11-06T12:00:00Z"
}
```

- `product` 必填。`sourceUrl` 可为空字符串；不为空时必须是 `http` 或 `https` 地址，否则 400。
- `signals` 的三项分别对应浏览、搜索和成交信号，`level` 取 `unknown` | `low` | `medium` | `high`，新建时缺省为 `unknown`。
- `status`：`watching`（观察中）| `validating`（验证中）| `adopted`（已选定）| `dropped`（放弃），新建时默认 `watching`。
- `openTaskCount`：由服务端计算，是 `source` 指向这条线索、且 `state` 为 `todo` 或 `in_progress` 的任务数。
- `GET /api/company/leads?status=watching,validating` 按 `observedOn` 降序；`status` 可省略或用逗号传多个。

把一项验证行动转成待办：前端调用 `POST /api/tasks`，带上 `area: "company"`、`source: { "type": "lead", "id": "ld_01" }`，可选 `projectId`。在公司区按 `sourceType=lead&sourceId=ld_01` 就能列出这条线索的待办。

# My Site

个人工作站「研台 Lab Desk」，只在本机使用，不需要登录。

当前进度：

- 任务、生活区（体重、睡眠、训练循环）和个人公司区（财务、选品线索、公司待办）是真实数据，存在 SQLite 里，从空白开始。
- 总览里还没接真实数据的卡片、科研区、日历、统计和文档仍是 `public/scripts/data.js` 里的示例，页面上标有「示例」。
- 每日精选的接口是真实的，但目前没有页面在用。
- 第三方集成（Zotero、GitHub、Obsidian、插件和 MCP）还在方案评审阶段，见 [docs/integrations.md](docs/integrations.md)。

## 启动

需要 Node.js 24 或更高版本。

```bash
npm install
cp .env.example .env.local
npm run db:seed              # 可选：写入每日精选的示例数据
npm run dev
```

打开 http://127.0.0.1:3000 是启动页，点「start working！」进入工作台；也可以直接打开 http://127.0.0.1:3000/desk 。

**服务只监听本机 127.0.0.1**，同一局域网的其他设备打不开。因为没有登录，任何能访问它的人都能读写全部数据，所以不要改成监听其他地址；要在局域网或公网使用，必须先加回访问控制。

| 命令 | 作用 |
| --- | --- |
| `npm run dev` | 启动开发服务器 |
| `npm run build` | 生产构建 |
| `npm run start` | 运行生产构建（需先 build） |
| `npm run typecheck` | 类型检查 |
| `npm test` | 运行接口和数据库测试（使用临时数据库，不碰 `data/app.db`） |
| `npm run db:seed` | 写入每日精选的固定示例数据（11-05、11-04 各 5 条，11-03 无数据）。**会重置全部精选和收藏**，但不会动任务、生活和公司的记录 |
| `node scripts/smoke-workbench.mjs` | 先 build；在 3103 端口用临时数据库启动生产服务，把任务、生活、公司三个区的接口完整走一遍，结束后自动清理 |

`.env.local` 只需要 `DATABASE_PATH`，默认 `data/app.db`。**这个文件就是你的全部真实记录**，请定期备份；首次使用时会自动建表和升级，原有数据保留。

## 修改前端

直接编辑 `public/` 下的文件，刷新浏览器就能看到，不需要构建。

- 启动页是 `public/start.html`，样式和脚本都写在这一个文件里，双手素材图是 `public/images/hand-sheet.webp`。它会从 Google Fonts 加载 Inter 字体，从 Open-Meteo 获取台北天气，断网时这两项会退回系统字体和「Weather unavailable」。
- 工作台是 `public/index.html`，页面用 `#/overview` 这类 hash 地址切换，路由和页面逻辑都在 `public/scripts/app.js`。
- `public/scripts/api.js` 集中处理接口请求、错误和字段映射；改接口相关的前端逻辑先看这里。
- 新增的页面：生活区 `#/life/health`（健康记录）、`#/life/training`（训练记录）；个人公司区 `#/company/finance`（财务报表）、`#/company/leads`（选品观察）、`#/company/tasks`（公司待办）。「我的任务」支持 `#/tasks?area=company&project=<项目 id>` 这样的筛选地址。

`public/scripts/charts.js` 和 `public/styles/app.css` 来自 MIT 许可的界面套件，修改时保留文件开头的版权和许可说明。

## 技术栈

| 用途 | 选择 | 状态 |
| --- | --- | --- |
| 前端 | `public/` 下的静态 HTML/JS，Next.js 只负责提供静态文件和 API | 任务、生活、公司已接真实数据，其余为示例 |
| 后端 | Next.js + TypeScript 路由处理函数 | 已搭建 |
| 数据库 | SQLite（Node 内置 `node:sqlite`），路径由 `DATABASE_PATH` 决定，`PRAGMA user_version` 记录表结构版本 | 每日精选、任务、生活、公司已接入 |
| 每日精选 | 定时脚本抓取 PubMed、arXiv 和期刊 RSS，由 AI 筛选并生成摘要 | 待接入 |
| 第三方集成 | 统一连接器 + Zotero、GitHub、Obsidian、MCP | 方案评审中 |

## 目录结构

```text
public/
  start.html             启动页（/）
  index.html             工作台（/desk）
  images/                启动页双手素材图、工作台背景图
  styles/  scripts/      原型的样式和脚本（data.js 是示例数据）
  fonts/                 IBM Plex Sans、Source Serif 4、思源黑体/宋体（子集）、Geist Mono 及各自 OFL 许可
app/api/
  health/                健康检查
  research/digests/      每日精选（SQLite）
  tasks/  projects/      跨区任务和项目（SQLite）
  life/  company/        生活区和个人公司区（SQLite）
  [...path]/route.ts     其余接口的样例数据入口
lib/
  database.ts            统一打开数据库、建表和升级
  workbench-db.ts        任务、项目、生活、公司的数据库读写
  research-digests-db.ts 每日精选的数据库读写
  mock-api.ts            还没实现的接口的样例数据
scripts/
  seed.mjs               每日精选示例数据写入脚本
  smoke-workbench.mjs    生产服务的端到端检查脚本
tests/                   接口和数据库测试
next.config.ts           把 / 改写到 start.html，/desk 改写到 index.html
docs/
  API.md                 API 约定
  integrations.md        第三方集成方案（评审稿）
```

## 需要留意

- 标有「示例」的卡片和科研区仍来自 `data.js`，改动刷新后会丢失；新建菜单里标「（示例）」的项目、笔记、文献、实验也一样。
- 每日精选接口目前没有页面在用。
- `AGENTS.md` 由 `next dev` 自动生成，删除后还会再生成，所以一并提交。
- 浏览器请求 `/favicon.ico` 会得到 404，不影响使用。

## 下一步

1. 用一个真实科研课题（如抗菌肽调研）走通科研区，把科研项目、文献、实验换成真实数据（项目书第 4 步）。
2. 评审 `docs/integrations.md`，回答其中的决策问题，再接 Zotero、GitHub、Obsidian 和 Agent。
3. 把总览里剩下的示例卡片逐块换成真实数据；在科研区接上每日精选。
4. 实现每日 5 篇精选的抓取和 AI 筛选。

每日精选的期刊范围是待确认的初步名单：Nature、Science、Cell、NEJM、The Lancet、Nature Medicine、Nature Biomedical Engineering、Science Robotics、Science Translational Medicine、npj Digital Medicine，再加上 arXiv 预印本。

## 开发约定

- 接口字段以 [docs/API.md](docs/API.md) 为准，改接口时同步更新。
- 实现某个接口时，新建对应的 `app/api/.../route.ts`，它会优先于样例入口生效，然后删掉 `lib/mock-api.ts` 里的对应条目。

# My Site

个人工作站「研台 Lab Desk」，只在本机使用，不需要登录。

当前进度：

- 前端是 `public/` 下的静态 HTML/JS 原型，所有数据来自 `public/scripts/data.js` 里的示例，还没有调用接口。
- 后端里，每日精选的读取和收藏是真实的（SQLite），其余接口返回样例数据。
- 第三方集成（Zotero、GitHub、Obsidian、插件和 MCP）还在方案评审阶段，见 [docs/integrations.md](docs/integrations.md)。

## 启动

需要 Node.js 24 或更高版本。

```bash
npm install
cp .env.example .env.local
npm run db:seed              # 写入每日精选的示例数据
npm run dev
```

打开 http://127.0.0.1:3000 。

**服务只监听本机 127.0.0.1**，同一局域网的其他设备打不开。因为没有登录，任何能访问它的人都能读写全部数据，所以不要改成监听其他地址；要在局域网或公网使用，必须先加回访问控制。

| 命令 | 作用 |
| --- | --- |
| `npm run dev` | 启动开发服务器 |
| `npm run build` | 生产构建 |
| `npm run start` | 运行生产构建（需先 build） |
| `npm run typecheck` | 类型检查 |
| `npm test` | 运行接口和数据库测试（使用临时数据库，不碰 `data/app.db`） |
| `npm run db:seed` | 写入固定的示例数据（11-05、11-04 各 5 条，11-03 无数据）。**会重置全部精选和收藏**，接入真实数据后不要再运行 |

`.env.local` 只需要 `DATABASE_PATH`，默认 `data/app.db`。

## 修改前端

直接编辑 `public/` 下的文件，刷新浏览器就能看到，不需要构建。页面用 `#/overview` 这类 hash 地址切换，路由和页面逻辑都在 `public/scripts/app.js`。

`public/scripts/charts.js` 和 `public/styles/app.css` 来自 MIT 许可的界面套件，修改时保留文件开头的版权和许可说明。

## 技术栈

| 用途 | 选择 | 状态 |
| --- | --- | --- |
| 前端 | `public/` 下的静态 HTML/JS 原型，Next.js 只负责提供静态文件和 API | 已迁移，数据为示例 |
| 后端 | Next.js + TypeScript 路由处理函数 | 已搭建 |
| 数据库 | SQLite（Node 内置 `node:sqlite`），路径由 `DATABASE_PATH` 决定 | 每日精选已接入 |
| 每日精选 | 定时脚本抓取 PubMed、arXiv 和期刊 RSS，由 AI 筛选并生成摘要 | 待接入 |
| 第三方集成 | 统一连接器 + Zotero、GitHub、Obsidian、MCP | 方案评审中 |

## 目录结构

```text
public/
  index.html             前端入口
  styles/  scripts/      原型的样式和脚本（data.js 是示例数据）
  fonts/                 IBM Plex Sans、Source Serif 4、思源黑体/宋体（子集）、Geist Mono 及各自 OFL 许可
app/api/
  health/                健康检查
  research/digests/      每日精选（SQLite）
  [...path]/route.ts     其余接口的样例数据入口
lib/
  research-digests-db.ts 每日精选的数据库读写
  mock-api.ts            样例数据
scripts/seed.mjs         示例数据写入脚本
tests/                   接口和数据库测试
next.config.ts           把 / 改写到 public/index.html
docs/
  API.md                 API 约定
  integrations.md        第三方集成方案（评审稿）
```

## 需要留意

- 前端还没有接后端：页面上的数字都来自 `data.js`，每日精选接口目前没有页面在用。
- `AGENTS.md` 由 `next dev` 自动生成，删除后还会再生成，所以一并提交。
- 浏览器请求 `/favicon.ico` 会得到 404，不影响使用。

## 下一步

1. 评审 `docs/integrations.md`，回答其中的决策问题。
2. 把前端的示例数据逐步换成接口请求，先接每日精选。
3. 实现每日 5 篇精选的抓取和 AI 筛选。

每日精选的期刊范围是待确认的初步名单：Nature、Science、Cell、NEJM、The Lancet、Nature Medicine、Nature Biomedical Engineering、Science Robotics、Science Translational Medicine、npj Digital Medicine，再加上 arXiv 预印本。

## 开发约定

- 接口字段以 [docs/API.md](docs/API.md) 为准，改接口时同步更新。
- 实现某个接口时，新建对应的 `app/api/.../route.ts`，它会优先于样例入口生效，然后删掉 `lib/mock-api.ts` 里的对应条目。

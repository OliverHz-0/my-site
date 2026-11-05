# My Site

个人网站：公开主页 + 需要登录的私人工作区（科研区、学习区、工作区）。

当前是骨架阶段：登录和页面路由是真实的，业务接口返回样例数据，尚未接入数据库、论文抓取和 AI。

## 启动

需要 Node.js 24 或更高版本。

```bash
npm install
cp .env.example .env.local   # 然后修改里面的密码和密钥
npm run dev
```

打开 http://localhost:3000 ，登录密码是 `.env.local` 里的 `ADMIN_PASSWORD`。

| 命令 | 作用 |
| --- | --- |
| `npm run dev` | 启动开发服务器 |
| `npm run build` | 生产构建 |
| `npm run start` | 运行生产构建（需先 build；此模式下 cookie 带 Secure，线上需要 HTTPS） |
| `npm run typecheck` | 类型检查 |

## 技术栈

| 用途 | 选择 | 状态 |
| --- | --- | --- |
| 前端和后端 | Next.js + TypeScript，一个进程同时提供页面和 API | 已搭建 |
| 登录 | 单用户密码 + 签名 cookie | 已搭建 |
| 数据库 | SQLite，单文件，个人使用足够 | 待接入 |
| 每日精选 | 定时脚本抓取 PubMed、arXiv 和期刊 RSS，由 AI 筛选并生成摘要 | 待接入 |
| AI 润色 | 服务端调用 Claude API | 待接入 |

## 目录结构

```text
app/
  page.tsx               公开主页
  login/                 登录页
  (private)/             需要登录的页面
    research/            科研区：digest 资讯、writing 写作、publications 发表跟踪
    learning/            学习区
    work/                工作区
  api/
    health/  auth/       已实现的接口
    [...path]/route.ts   其余接口的样例数据入口
lib/
  auth.ts                会话签名和密码校验
  mock-api.ts            样例数据
  use-api.ts             前端请求 hook
proxy.ts                 登录拦截，默认全部需要登录
docs/API.md              API 约定
```

## 当前状态

已验证：

- 类型检查和生产构建没有报错。
- 未登录时，私人页面跳到登录页，接口返回 401；错误密码、伪造的 cookie 和指向外站的登录跳转都被拦下。
- 登录、私人页面、每日资讯和退出已在无头 Chrome 里走通。

需要留意：

- 业务数据全是样例，写入不会保存。
- `AGENTS.md` 由 `next dev` 自动生成，删除后还会再生成，所以一并提交。
- 上线前要给登录接口加尝试次数限制，并换掉 `.env.example` 里的默认密码和密钥。
- 学习区目前只存链接，电子书文件上传以后再做。
- 工作区的字段是初版，会随需求细化。
- 站点还没有网站图标，浏览器请求 `/favicon.ico` 会得到 404，不影响使用。

## 下一步

1. 接入 SQLite，替换样例数据。
2. 实现每日 5 篇精选。

每日精选的期刊范围是待确认的初步名单：Nature、Science、Cell、NEJM、The Lancet、Nature Medicine、Nature Biomedical Engineering、Science Robotics、Science Translational Medicine、npj Digital Medicine，再加上 arXiv 预印本。

## 开发约定

- 接口字段以 [docs/API.md](docs/API.md) 为准，改接口时同步更新。
- 实现某个接口时，新建对应的 `app/api/.../route.ts`，它会优先于样例入口生效，然后删掉 `lib/mock-api.ts` 里的对应条目。
- 新增公开路径时要改 `proxy.ts` 的白名单，其他路径默认需要登录。

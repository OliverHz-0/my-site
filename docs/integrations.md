# 第三方集成、连接器与 MCP 方案（评审稿）

查阅日期：**2026-11-06（Asia/Taipei）**。本文只提议后续实现，不表示接口、表或集成已上线。基于 `xsi88258-ship-it/integration` 的 `4eb47f9`，沿用 [API 约定](API.md) 的 JSON、时间、登录会话和错误格式；本轮只新增本文。

文中的服务能力以所链接的官方文档为依据；社区插件引用其维护者的一手资料，明确标注。轮询间隔、缓存、权限策略和工作量为本项目设计建议，均不是供应商承诺。未使用、索取或保存用户令牌，也未访问私人文献、仓库或 vault。

> **协调者注（2026-11-06）：** 本文写于登录功能移除之前。用户已决定整站不登录，服务只监听本机 127.0.0.1。文中凡是依赖登录会话的内容（例如「所有接口未登录 401」、沿用登录会话），在实施前都要按新的访问方式重新评审。存放第三方令牌和开放 MCP 服务之前，必须先确定访问控制方案。

## 1. 建议先评审的结论

| 集成 | 推荐起点与数据方向 | 网站在自己电脑运行 | 网站在服务器运行 |
| --- | --- | --- | --- |
| Zotero | Web API v3，只读文献元数据、集合、笔记及可取得的批注；人工创建最小权限 API key | 可行，访问已同步到 Zotero 云端的库 | 可行，同一 Web API，不依赖电脑开机 |
| GitHub | 第一阶段用 fine-grained PAT，只读指定仓库；长期常驻或组织场景改 GitHub App | 可行，先低频拉取，不要求公网入口 | 可行；GitHub App + webhook 可降低延迟，仍定时核对 |
| Obsidian | 本地首选只读 vault 文件夹；远端首选用户已有的同步方式产生服务器镜像，再只读索引 | 文件夹最直接；需要 Obsidian 运行时操作时才选 Local REST API | 不能直接读取电脑路径或电脑的 localhost；需服务器文件副本或受控桥接 |
| 站点插件 | 受信任的连接器包 + manifest + 通用设置页与同步队列 | 可装受审核的文件或进程连接器 | 同样可装；安装属于部署操作，初期关闭任意代码上传 |
| MCP | 数据连接器稳定后，先把站内选定数据只读开放给 AI 客户端；随后按需求接入外部 MCP | 优先 loopback HTTP；客户端只支持 stdio 时用小型桥接进程 | 使用 HTTPS Streamable HTTP 与独立的 MCP 授权；stdio 无法从浏览器连接远端服务器 |

科研区映射：Zotero →「文献与阅读」，GitHub →「数据与代码」，Obsidian → 阅读笔记、实验记录与写作素材。第一阶段不把实验记录解释为结构化实验管理，也不自动运行仓库代码。每日精选继续使用现有接口和收藏状态；将论文关联 Zotero 时使用独立映射，不改已有字段，不把“站内收藏”自动等同于“写入 Zotero”。

侧栏里的 Notion 暂列“规划中”，不显示可用的“连接”按钮；这轮没有评估 Notion API。待用户确认是否需要后，再按连接器规范独立评审。

## 2. Zotero

### 2.1 数据、读写与权限

建议读取题名、作者、摘要、期刊、日期、DOI/URL、标签、集合、条目类型及父子关系，保留 Zotero `key`、`version` 和 library 标识。Web API 的 `/items` 包含子条目，`/items/top` 不足以获取全部笔记和批注；需要遍历附件及其子条目。批注可包含选中文字、评论、页码、颜色和定位信息，图片区域批注不保证有文字。元数据接口与分页规则见 [Zotero Web API basics](https://www.zotero.org/support/dev/web_api/v3/basics)；字段可由 [类型与字段接口](https://www.zotero.org/support/dev/web_api/v3/types_and_fields) 查询。

第一阶段为**上游 → 本站单向只读**。个人库 key 开启 library 读取；需要笔记时开启 notes 读取；不开 write，不请求不必要的文件下载。群组库只授予选定群组的读取；不要默认“全部群组”。连接时通过 `/keys/current` 核对实际访问范围，不能只相信表单勾选。集合筛选是本站的数据范围控制，不能把它宣传成 API key 的集合级权限。依据：[Zotero 同步与 key 权限](https://www.zotero.org/support/dev/web_api/v3/syncing)。

Zotero 自身阅读器的批注与 PDF 文件内容分开存储，因此下载 PDF 不等于取得批注；外部 PDF 软件的批注、未上传附件和未同步到云端的数据不能保证可用。[官方 PDF 阅读器说明](https://www.zotero.org/support/pdf_reader)。已用公开模板接口确认 annotation 字段存在，见第 11 节；**未核实**用户库中批注的实际可见性，以及 annotation 是否在所有库场景均受同一个 notes 权限开关控制，实施时需用最小权限测试库验收。第一阶段不下载 PDF、图片批注或全文索引，避免为元数据展示扩大授权。

API key 从本站登录后的设置页一次输入，只发送给本站后端。单用户无需先搭建 OAuth；如果以后希望跳转授权，Zotero 提供的是 **OAuth 1.0a key exchange**，不能套用 GitHub/MCP 的 OAuth 2.1 流程。[官方 OAuth 说明](https://www.zotero.org/support/dev/web_api/v3/oauth)。

### 2.2 同步、限流与部署

推荐默认每 15 分钟检查一次，另提供手动同步；电脑睡眠或进程停止期间不保证刷新，恢复后补跑一次。本地与服务器均通过 `https://api.zotero.org` 访问已上云的文献。离线、只在本地库的数据需要另做 Zotero 本地连接器，不在第一阶段承诺。

增量方案按每个 user/group library 分开保存版本：

1. 首次分页读取 collections、items，保留子条目、父条目关系；Web API 每页最多 100，遵循返回的 `Link`。
2. 后续用 `If-Modified-Since-Version` 检查；304 只更新检查时间。用 `since=<上次成功库版本>` 取得变更，可先取 `format=versions` 再分批下载对象；同时读取 `/deleted?since=...`。
3. 所有页、父子条目与删除处理成功后才推进已完成版本；若响应中的库版本在这一轮变化，重新核对直到形成一致结果。已落库页可幂等重放，不能因某一页失败跳过条目。
4. 选定集合的视图也要处理“移出集合”，不能只处理条目删除；父条目变化要重新计算笔记/附件的可见性。先做整库元数据同步再筛选显示，可减少局部同步遗漏。

以上版本、删除和一致性依据：[官方同步协议](https://www.zotero.org/support/dev/web_api/v3/syncing)。

官方未给本站可固定依赖的“每分钟 N 次”额度；必须处理成功响应也可能带的 `Backoff`、429/503 的 `Retry-After`。建议每连接串行请求，退避加抖动，手动触发也不能绕过退避。[官方限流规则](https://www.zotero.org/support/dev/web_api/v3/basics#rate_limiting)。

403 可能是 key 失效或权限不足，标记“需要重新授权/检查库权限”，停止自动重试；群组权限移除后停止展示相应缓存。网络或 5xx 保留最近成功数据并标记过期，不当作空库删除。当前查阅的 key 文档没有可统一依赖的到期/刷新机制；记录用户提供的到期提醒，但不能声称所有 key 永不过期或能自动刷新。

## 3. GitHub

### 3.1 认证选择

| 方案 | 权限边界、维护成本 | 本项目建议 |
| --- | --- | --- |
| Fine-grained PAT | 面向本人，选择一个 resource owner 和指定仓库、只读权限；可能受组织审批与有效期政策限制 | 第一阶段采用，设置明确有效期，按 owner 分连接；私有仓库与权限需逐个验证 |
| GitHub App installation | 以安装身份访问选定仓库，权限细、集中 webhook；installation token 约 1 小时有效，服务端用 App 私钥续签 | 组织库、长期无人值守、希望少手动换 token 时优先，注册和私钥管理多一道运维 |
| OAuth App | 以用户身份授权；仓库授权粒度较粗，私库常涉及较宽的 `repo` scope | 当前单用户不优先；不能把“登录 GitHub”混同于必须采用 OAuth App |

依据：[PAT 官方说明及限制](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens)、[App 与 OAuth 比较](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/differences-between-github-apps-and-oauth-apps)、[installation token](https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/authenticating-as-a-github-app-installation)。GitHub 官方对长期集成倾向 GitHub App；这里先用 PAT 是单用户验证范围与成本的取舍，不是建议长期无限期使用个人令牌。

### 3.2 需要的数据与最小权限

第一阶段只读用户选择的仓库，不扫账号全部内容；保存 repo 数字 ID、issue/PR 数字 ID 和 commit SHA，名称仅用于显示，避免仓库改名后重复。

| 数据 | 用途 | Fine-grained 仓库权限 |
| --- | --- | --- |
| 仓库名称、描述、可见性、默认分支、更新时间与链接 |「数据与代码」索引 | Metadata: read（fine-grained token 包含元数据读取） |
| README、最近默认分支提交、release 元数据 | 了解研究代码与版本，默认最近 30 条提交，不下载 release 文件 | Contents: read |
| issues、labels、assignees 与状态 | 研究待办与问题跟踪 | Issues: read；不需要此视图就不申请 |
| PR 标题、状态、更新时间和链接 | 代码进展 | Pull requests: read；不默认抓取全部 diff、评论 |
| Actions run 状态（后续可选） | 复现实验的流水线状态 | Actions: read，仅启用时申请；不下载日志、artifact 或 secrets |

具体端点权限以 [fine-grained 权限表](https://docs.github.com/en/rest/authentication/permissions-required-for-fine-grained-personal-access-tokens) 为准；一期无仓库写入、Administration、Webhooks 写权限和工作流触发能力。未来若需开 issue、写文件或触发任务，要分别增权、重新确认，不能沿用“只读连接”的授权。REST 请求固定已核实的 `X-GitHub-Api-Version: 2026-03-10`，依据 [版本规则](https://docs.github.com/en/rest/about-the-rest-api/api-versions)，升级单独回归。

### 3.3 同步、webhook 与错误

本地优先每 15 分钟拉取 + 手动；在可用端点采用 ETag/Last-Modified 和分页。issue 按 `since` 更新，PR 按更新时间分页并使用重叠时间窗，commit 按默认分支 HEAD/SHA 核对；force-push、删除、仓库转移不能只靠“上次时间戳”，每日补做选定仓库和最近窗口核对。完整扫描成功前不判定数据已删除。同步策略参考 [GitHub REST best practices](https://docs.github.com/en/rest/using-the-rest-api/best-practices-for-using-the-rest-api)。

一般认证 REST 请求为 5,000 次/小时；未认证为 60 次/小时。App installation 的额度另算并可能扩展；搜索和 GraphQL 还有不同限制。实际遵从 `X-RateLimit-*`、`Retry-After` 与 secondary limit，不能用 5,000 推断所有端点均可同速调用。对 403/429 先判断额度和错误，再决定退避或重新授权；304 的正确认证条件请求可节约主额度。[限额](https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api)、[条件请求及退避](https://docs.github.com/en/rest/using-the-rest-api/best-practices-for-using-the-rest-api)。

服务器有稳定 HTTPS 地址后，推荐 GitHub App 订阅 `push`、`issues`、`pull_request`、`release` 及 installation/仓库访问变化；只订阅启用功能所需事件。webhook 只作为触发增量拉取的信号，按 `X-GitHub-Delivery` 去重，允许乱序和重复；落库入队后立即返回 202，控制在官方要求的 10 秒内。用原始请求字节验证 `X-Hub-Signature-256` 的 HMAC-SHA256，并恒定时间比较。停机漏件用定时核对或重投补偿，不能假设 GitHub 自动重试所有失败交付。[最佳实践](https://docs.github.com/en/webhooks/using-webhooks/best-practices-for-using-webhooks)、[签名校验](https://docs.github.com/en/webhooks/using-webhooks/validating-webhook-deliveries)。

本地没有公网入口时 webhook 不能直接到达 `localhost`；第一阶段轮询即可。开发验证可选 smee 等转发；它会接触事件 payload，应使用测试仓库。常驻私有事件如需低延迟，选自控 HTTPS 隧道或中继，并保持端到端签名校验；电脑关机仍须靠后续拉取补齐。[官方本地 webhook 测试方案](https://docs.github.com/en/webhooks/testing-and-troubleshooting-webhooks/testing-webhooks)。不为收 webhook 给只读 PAT 增加管理权限。

401 标记 token 失效/过期，PAT 由用户替换，App installation token 可在授权未撤销时续签一次后重试；403 先区分限流、组织审批和权限；404 也可能是失去私库访问权，不立即物理删除。installation 被卸载或仓库移除后停止任务并隐藏对应缓存，定时重新核验范围。

## 4. Obsidian：按部署位置选择

官方确认 vault 是本地 Markdown 文件夹，外部文件变更会被 Obsidian 感知。[数据存储说明](https://obsidian.md/help/Files%2Band%2Bfolders/How%2BObsidian%2Bstores%2Bdata)。本次没有找到供第三方直接对云端 vault 做通用 CRUD 的官方 HTTP API，不能把购买 Sync 当作拿到了这种接口。**已核实的新选项**是官方 Headless Sync 公测客户端，能把远端 vault 同步到服务器文件夹，详见下表；不需要逆向私有同步协议。

| 方式 | 能拿到什么、方向 | 认证与最小权限 | 本地/服务器可行性 | 频率与失败处理 |
| --- | --- | --- | --- | --- |
| 直接读文件夹（本地首选） | 指定子目录 `.md`、frontmatter、wikilinks、标签、文件路径/hash；附件只记引用，不解释为 Obsidian 插件计算结果 | 无云端 token；操作系统账户和预配置 vault root，第一版只读挂载，只允许选定目录 | 同机直接可行，Obsidian 可关闭；服务器必须有自己的副本或挂载，网页输入电脑路径无效 | watcher 去抖约 2 秒 + 每 30 分钟核对；无供应商 API 限额，项目限制文件大小/并发；读失败或挂载离线保留旧数据，不判全库删除 |
| 社区 Local REST API | 文件读写、搜索和部分运行中 Obsidian 能力；一期仍只调用读取端点 | 插件生成 Bearer API key；HTTPS 本地证书需专门信任；不假设 key 有原生只读 scope，本网站用调用白名单约束 | 同机需 Obsidian 打开、插件启用；服务器无法访问电脑的 127.0.0.1，需受控桥接/私网及在线电脑，运维成本更高 | 先手动/每 5 分钟；维护者 main 文档提供事件订阅，可在锁定版本验证后使用；无统一吞吐 SLA，项目串行，遵从实际 429；电脑关闭显示离线，401 提示换 key |
| Git 同步 vault | 私有仓库里的 Markdown 快照与历史；一期电脑 push → 服务器 fetch/read，服务器只读 | 独立的只读 deploy key 或独立仓库 Contents: read token；host key 校验，私库，仅 vault 指定内容 | 两种部署都可；用户先推送，服务器才可看到，未提交内容不可见 | 每 5–15 分钟 fetch + 手动/可选 webhook；Git 传输不等同 REST 额度，按托管服务限制，禁止高频全量 clone；失败保留旧 commit，不强制 reset 用户工作树 |
| 同步盘/文件同步镜像 | 同步完成后的文件副本；服务器索引只读副本 | 同步工具的设备配对/账户授权由用户运维，网站只持文件读取权，不接管个人云盘账户 | 本机可读已完整下载的目录；服务器需该服务支持其 OS；iCloud 不作为 Linux 服务器默认方案 | watcher + 定期核对；限额由选定服务决定，目前未选定，**未核实**；占位文件、离线、未完成同步不能当空文件或删除 |
| 官方 Headless Sync（服务器备选） | 官方 Sync 远端 vault → 服务器本地文件夹，再由同一文件连接器读取 | 需有效 Obsidian Sync 订阅、独立 CLI 登录及可能的 E2EE 密码；由部署用户保管 CLI 状态，不把账号密码放进网站表单 | 无需服务器运行桌面 App；可持续同步；同一设备不能同时运行 desktop Sync 和 Headless Sync | 支持单次及 continuous 模式；第一版优先 pull-only，避免网站写回；上游未公开本站可依赖的固定 API 吞吐 SLA，跟随 CLI 状态退避；订阅、网络或凭据失效须提示人工处理 |

Local REST API 为**社区插件**，不是 Obsidian 官方云端 API。上述端口、认证、ETag 条件写入与事件能力来自 [维护者仓库 main 文档](https://github.com/coddingtonbear/obsidian-local-rest-api)。默认 HTTPS 示例为 `https://127.0.0.1:27124`；生产不全局关闭 TLS 校验，也不把 27124 直接暴露公网。main 能力不代表用户已安装版本，**版本、吞吐、ETag/事件支持与端到端运行未核实**；落地时固定版本并做副本验收。key 的精细只读隔离未作为已具备能力承诺。

Git/云盘路线见 [Obsidian 官方跨设备方案](https://obsidian.md/help/sync-notes)；官方提醒不要把多个同步服务叠加在同一个 vault。若选 Syncthing，可用服务器 receive-only 镜像，具体语义见 [文件夹模式](https://docs.syncthing.net/users/foldertypes.html)；冲突副本会成为真实文件，网站应显式标记，不能当独立研究笔记重复导入，见 [冲突处理](https://docs.syncthing.net/users/syncing.html)。

Headless 的公测状态、订阅要求、pull-only 与 mirror-remote/bidirectional 模式及同机冲突提醒已在 [官方 Headless Sync 文档](https://obsidian.md/help/sync/headless) 查证；本轮未安装或登录，**与目标服务器 OS、用户 vault、CLI 凭据存储和运行稳定性的兼容性未核实**。它需要额外运维进程，应由用户决定是否接受，不暗中扩展当前“一个 Next.js 进程”的部署范围。

直接文件连接没有 token 到期概念，文件权限/挂载失效显示离线；Local REST API key 不承诺自动刷新，失效后由用户更换。Git token/deploy key 或同步工具登录失效时，暂停更新并提示重新授权，保留镜像和最后成功版本；同步工具自身的凭据轮换由其运维流程负责，不能靠重试文件读取来恢复认证。

### 双向写入的限制

一期不写回任何 vault。以后建议先允许网站向独立 `Inbox/Workstation/` 新建笔记，经用户确认后再扩展。写入前读取并核对上次版本/hash；已有笔记采用条件写入或三方合并，冲突进入待处理队列；保留历史和双方副本，禁止静默 last-write-wins。

直接文件写入的“检查 hash + rename”只能保证有限的原子替换，无法与 Obsidian、云盘、另一个设备形成跨进程 CAS 锁；mtime 也不能充分检测冲突。Local REST API 当前 main 文档支持 ETag/If-Match，但仍需验证目标插件版本与桌面并发编辑场景。Git 采用基于基线 commit 的分支/PR，遇 non-fast-forward 停止并合并；不 force-push。同步盘/Sync 的合并不保证语义正确，官方也说明 Markdown 自动合并可能需要人工修正。[Obsidian 冲突说明](https://obsidian.md/help/sync/troubleshoot)。

读取与写入都要拒绝 `..`、越过 vault root 的符号链接、配置目录、`.git`、插件脚本和凭据文件；保留 wikilink 与相对附件路径，不批量重命名已有笔记。移动文件优先用内容 hash 提示关联，未来可选择显式 note ID；不能用标题作为永久主键。

## 5. 统一连接器与设置页

### 5.1 结构与扩展边界

核心负责登录、配置校验、凭据保险箱、任务调度、限流、存储和状态展示；连接器只负责上游协议、对象映射与错误分类。页面查询 SQLite 缓存，不在每次打开设置页时调用供应商。所有连接器复用通用 API，不为每个 provider 新建一套连接/同步路由。

安装包包含受信任的 manifest、adapter 和版本校验信息。部署时将固定版本的包放入受控连接器目录，启动注册表按约定发现；新增集成只添加包及部署配置，不改核心 switch 或数据库主结构。Next.js 服务端打包需要对扩展加载路径做真实部署验收：初期可以随部署产物构建、重启，不能承诺网页上传后立即热加载。未知 manifest API 版本拒绝启用，升级需要配置/数据兼容策略。

“添加插件”第一版只打开受审核目录，或添加已支持的远端 MCP 配置；不接收任意 npm 包、shell 命令或前端 JS 上传。manifest 的权限声明用于审核与受控 I/O，**同进程 Node 插件不是安全沙箱**；不受信任的代码以后必须隔离进程/容器、网络和文件访问，不能靠 TypeScript 类型实现权限隔离。

### 5.2 Manifest 与接口草案

以下只是文档内的 TypeScript 类型。实际实现时需做运行时 schema 校验；所有新增配置表单从 manifest 生成，secret 字段独立，不混入普通 config。

```typescript
type Json = null | boolean | number | string | Json[] | { [key: string]: Json };
type Capability =
  | "items.read" | "items.write" | "search.read" | "files.read" | "files.write"
  | "sync.incremental" | "events.receive" | "mcp.resources.read" | "mcp.tools.call";
type AuthMethod = "none" | "api-key" | "fine-grained-pat" | "github-app" | "oauth1" | "oauth2";
type Runtime = "local" | "server";
type FailureKind = "auth" | "permission" | "rate-limit" | "offline" | "conflict" | "upstream" | "schema";

interface ConnectorManifest {
  manifestVersion: 1;
  connectorApiVersion: "1";
  id: string;                         // 例如 zotero、github、obsidian-files
  version: string;                    // 固定 semver，另记录包摘要及来源
  publisher: string;
  packageIntegrity: string;           // 部署时核对包摘要，不能只相信包自报身份
  license: string;
  minHostVersion: string;
  entrypoint: string;                 // 仅管理员部署的包内入口，不接受用户 URL
  runtime: Runtime[];
  auth: AuthMethod[];
  capabilities: Capability[];         // 声明可实现，不等于已经授权
  objectSchemas: Record<string, Json>; // paper/note/repository 等，带 schema 版本
  configSchema: Json;                 // JSON Schema：库/仓库、目录别名、刷新间隔
  credentialFields: Array<{
    name: string; label: string; required: boolean; writeOnly: true;
  }>;
  permissions: {
    upstream: Array<{ name: string; reason: string; optional: boolean }>;
    networkOrigins: string[];         // 受 host 审核的 API 源，不任意转发凭据
    fileRootAliases?: string[];       // 对应部署侧预先允许的目录，只读为默认
  };
  sync: {
    modes: Array<"full" | "incremental">;
    triggers: Array<"manual" | "schedule" | "webhook" | "watcher">;
    defaultIntervalSeconds: number;
    minIntervalSeconds: number;
  };
  ui: {
    label: string; description: string; iconName: string; // 站点已有图标白名单
    placements: Array<"integrations" | "research-reading" | "research-code" | "research-notes">;
  };
  documentationUrl: string;
  privacyNotice: string;
}

interface NormalizedItem {
  externalId: string;
  scopeId: string;                    // 库、仓库或 vault，连接内唯一
  kind: string;
  sourceVersion: string | null;      // Zotero version、Git SHA、ETag 或文件 hash
  sourceUpdatedAt: string | null;
  title: string;
  url: string | null;
  parentExternalId: string | null;
  data: Json;                        // 按 objectSchemas 校验的最小必要字段
}

interface ConnectorContext {
  connectionId: string;
  config: Json;
  grantedCapabilities: Capability[];
  allowedScopes: string[];
  secrets: {
    withSecret<T>(name: string, use: (secret: string) => Promise<T>): Promise<T>;
  };                                // 短时解密，不向模型/页面暴露
  http: { request(url: string, options: RequestInit): Promise<Response> };
  files?: {                          // 仅允许的 root，相对路径均再次规范化检查
    list(relativeDirectory: string): Promise<Array<{
      relativePath: string; size: number; modifiedAt: string;
    }>>;
    read(relativePath: string): Promise<Uint8Array>;
  };
}

interface SyncBatch {
  scopeId: string;
  items: NormalizedItem[];
  deletedExternalIds: string[];
  resumeToken: Json;                  // 已持久化页面的恢复位置，不是已完成库版本
  completedCheckpoint?: Json;         // 完成一致性校验后才出现
}

interface Connector {
  manifest: ConnectorManifest;
  validate(ctx: ConnectorContext, signal: AbortSignal): Promise<{
    accountLabel: string;
    grantedCapabilities: Capability[];
    allowedScopes: string[];
    credentialExpiresAt: string | null;
  }>;
  pull(ctx: ConnectorContext, input: {
    scopeId: string;
    mode: "full" | "incremental";
    checkpoint: Json;
    resumeToken: Json;
    signal: AbortSignal;
  }): AsyncIterable<SyncBatch>;
  classifyError(error: unknown): {
    kind: FailureKind; code: string; safeMessage: string;
    retryAfterSeconds?: number;
  };
  handleVerifiedWebhook?(ctx: ConnectorContext, event: Json): Promise<string[]>;
  write?(ctx: ConnectorContext, operation: {
    kind: string; externalId: string | null; data: Json;
    expectedVersion: string | null; idempotencyKey: string;
    approvalId: string;               // 核心核验的明确写入授权，不接受模型自证
  }): Promise<NormalizedItem>;
  revokeCredential?(ctx: ConnectorContext): Promise<{ upstreamRevoked: boolean }>;
}
```

`validate` 实际授予能力是 manifest、用户所选范围和上游权限的交集；不可借返回值扩大用户范围。第一阶段只注册 `pull`/只读能力，`write` 不存在或关闭。host 的 HTTP 封装控制超时、响应大小、源域名和重定向；file root 由部署配置确定，前端只选别名。配置修改与凭据替换必须重新验证，凭据指纹仅用于检测变更，不用于展示令牌片段。

### 5.3 状态与任务

把两个状态拆开：连接状态 `connected | reauth_required | permission_required | offline | error | disconnected`；任务状态 `idle | queued | running | waiting_retry | succeeded | failed | cancelled`。新建连接未成功校验不算 connected；connected 但没有成功任务时显示“已连接，尚未同步”。catalog 的 `ready | planned | disabled` 是插件可用性，与连接状态分开。

设置卡片显示名称、账户/资源范围、只读/可写、上次成功时间、缓存是否过期、下次重试时间和安全错误信息。按钮随状态显示“连接”“立即同步”“重新授权”“断开”；离线时说明最近缓存时间。不要把一次超时当作 token 失效，也不要把任务成功误显示为数据永远新鲜。

SQLite 持久化任务：手动触发先入队再返回，不能依赖 API handler 返回后留一个未等待的 Promise。常驻 Next.js Node 进程可在服务实例启动时启动单例调度器，循环领取到期任务；每连接最多一个活跃任务，手动与定时请求合并。生产必须保证进程常驻；若改为会冻结进程的 serverless 部署，需外部调度/队列，这项成本另算。框架启动约定已核对本项目安装包的 `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/instrumentation.md`，实现时不能在页面模块导入时顺带启动循环。

每次领取任务设置持久化 lease 和心跳，崩溃后由新进程恢复到期 lease；网络请求不持有 SQLite 写事务，批次 upsert + resume token 短事务提交，完整 checkpoint 另按一致性条件推进。可恢复错误指数退避加抖动；auth/permission/schema 错误暂停等待处理。取消/断开增加连接 generation 并使 lease 失效，旧任务回包不能再次落库；保留最后成功数据，访问已撤销的数据默认隐藏。

## 6. MCP 两个方向

### 6.1 网站作为 MCP 客户端

用途：从已批准的科研检索、代码或笔记 MCP 服务器读取 resources，或调用明确选定工具。结果通过连接器规范归一化，保留来源和同步时间。MCP 的 `tools/list` 不是固定领域 schema；不能假设“填 URL 就能变成本站论文列表”，仍需配置映射或薄 adapter。没有站内 AI 对话/工具执行需求时，普通 Zotero/GitHub 连接器更直接。

- 传输：远端首选 HTTPS Streamable HTTP；本机/服务器同机程序可用 stdio 子进程。子进程只能来自部署侧固定命令白名单，参数数组不经过 shell，不允许设置页输入任意命令，也不继承全部环境变量。
- 认证：HTTP 优先支持对方的 MCP OAuth 授权；私有固定服务允许独立 API key/Bearer（需实测客户端/服务端支持），不把这种手工 token 模式称为通用 OAuth 兼容。stdio 使用最小环境变量或受控凭据注入。各 server 额度不同，无全局 MCP 供应商限额，adapter 遵从对方限流并设置本站超时/调用预算。
- 失败：断线/5xx 退避，401 在 refresh 可用时尝试一次，再提示授权；403 提示能力/范围不足，不能自动增权。能力或 schema 改变时停止对应映射并提示重审。
- 安全：远端工具说明、返回正文和 `readOnlyHint` 均不能自行赋予权限；允许的 server、工具名、资源 URI、输入字段及输出范围由本站策略控制。初期禁止 shell、代码执行、自动写入和把本站全文传给另一个远端工具；写操作以后必须展示目标、变更、数据去向并取得逐项确认。发现能力不触发执行。

stdio 进程模型依据 [MCP stdio](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/stdio)；HTTP 授权采用 [MCP Authorization](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization)，安全边界参考 [MCP Security Best Practices](https://modelcontextprotocol.io/docs/2026-07-28/tutorials/security/security_best_practices)。

### 6.2 网站作为 MCP 服务器

用途：让 Claude 等客户端基于同一份站内数据查询精选、文献、获准的阅读笔记和代码索引。首批只开放 `search_papers`、`get_paper`、`list_digests`、`list_repositories` 等结构化只读工具/resources；不开放原始 SQL、文件系统浏览、凭据、管理配置、任意 URL 抓取或后台任务执行。

本地优先独立 loopback 入口或在现有进程的 `/mcp` 路径接入；原站点若必须监听 LAN，需对 MCP 路径另外限制来源，不把整站监听方式当作已隔离。客户端只支持 stdio 时用经过审核的桥接进程调用站点业务 API，不能共享数据库密钥或直接让桥接任意查表。远端使用本站 HTTPS `/mcp`，反向代理正确支持流式响应和取消，不能照搬普通 JSON API 的缓冲设置。

认证与边界：

1. MCP HTTP 使用独立 OAuth 2.1 资源服务器授权，提供 Protected Resource Metadata，接入经过维护的授权服务器组件，采用 PKCE S256、严格 redirect URI、state/issuer 校验、短期 access token 和可撤销 grant。为单用户保留手动预注册客户端选项，第一版不做匿名自动授权。
2. 站点登录 cookie 只用于用户浏览器登录和确认授权，不能作为 AI 客户端访问整个网站的凭据。每次 MCP 请求验证 token 的签发者、受众、有效期、客户端、owner 和 scopes；外部 GitHub/Zotero token 不可直接当本站 MCP token，也不可透传给下游。
3. 授权需同时选数据类型和资源范围，例如 `digests:read`、`literature:read`，加允许的 connection/library/repo IDs；`notes:read` 单独启用。每次检索、条目读取、分页、父子跳转和工具调用都在查询前应用同一范围过滤，不能只在 `tools/list` 隐藏工具。越界 ID、URI 和路径不返回数据或数量侧信道。
4. MCP 调用只经过带授权上下文的业务服务，不复用一个可访问全站的管理员 cookie。重连/多客户端不共享访问范围；不得以 session ID 代替认证。撤销 grant 后下一次调用即拒绝，缓存按 grant/策略版本隔离，不能将私人检索缓存标为 public。
5. 校验 Host、Origin 和请求大小；有非法 Origin 时拒绝，非浏览器没有 Origin 时仍须合法 token 和 Host。限制每个 grant 的调用频率、并发、结果数量和字节数，记录操作、目标与结果，不记录正文。起始建议为 30 次/分钟、每页 50 条、单次结果 1 MiB，后续根据实测调整；这些是项目策略，不是 MCP 规范额度。

依据：[授权规范](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization)、[受众绑定与 PKCE 要求](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization/security-considerations)。具体 Claude 版本、客户端注册方式和完整登录链路**未实测**，不能仅根据“支持 MCP”就保证互通。

### 6.3 版本与先后顺序

截至查阅日，官方 `latest` 指向 **2026-07-28**。该版 Streamable HTTP 使用 POST 请求并可返回单个 JSON 或该请求的 SSE 流，已移除独立 GET stream 和协议级 session；`server/discover` 提供支持版本/能力发现。不能将旧版 `initialize`/`Mcp-Session-Id` 设为所有连接的固定前提。实施时锁定 SDK 与协议版本，通过成熟 SDK 为确有需要的 2025-11-25 客户端提供明确的兼容路径，不手写一套混合协议。[当前规范](https://modelcontextprotocol.io/specification/2026-07-28)、[HTTP 传输与兼容](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http)、[发现](https://modelcontextprotocol.io/specification/2026-07-28/server/discover)。

推荐顺序：**站点只读连接器 → 选定 Obsidian 路线 → 本站只读 MCP 服务器 → 外部 MCP 客户端 → 有确认流程的写工具**。理由是现阶段已有个人工作站数据，而没有明确的站内 AI 工具执行器；先让用户现有 AI 客户端查询同一份数据更容易限定范围。如果用户首要目标改为在站内调用外部 MCP 工具，可以把客户端阶段前移，必须先选定具体 server 和用途。

## 7. 凭据、撤销与数据安全

凭据是后端专用数据，统一放入 `integration_credentials`，用 Node `crypto` 的 **AES-256-GCM** 加密。新建独立环境配置 `INTEGRATION_ENCRYPTION_KEY`（32 字节随机值，约定 base64 解码）和 `INTEGRATION_ENCRYPTION_KEY_ID`；不能复用 `SESSION_SECRET`、密码或任何 `NEXT_PUBLIC_*`。每次加密生成新的 12 字节 nonce、保存 16 字节 auth tag，以 connectionId/credentialId/kind/keyId 作 AAD 绑定。缺失密钥时拒绝新增/解密凭据，不回退明文；GCM 接口参考 [Node 24 crypto](https://nodejs.org/docs/latest-v24.x/api/crypto.html)。这些环境变量只是方案，本轮未加入实际配置文件。

- 只在服务端发请求前短暂解密；前端 POST 可输入新 token，但任何 GET、错误、Server Component props、HTML、localStorage 和导出都不返回 token，也不返回可恢复密文。设置页只显示 `hasCredential`、类型和已知到期时间；不提供“显示已保存令牌”。
- 日志采用字段白名单：connectionId/runId/provider/errorCode/httpStatus/耗时/计数。剔除 Authorization、Cookie、签名、OAuth code、refresh token、请求体与可能含 key 的 URL 查询；供应商异常先转成 safeMessage，不能原样传播。全文、批注和私有代码不进常规日志。
- 全站 HTTPS（loopback 明确例外）、写接口校验会话与 Origin/CSRF；数据库及备份限制文件权限，密钥与数据库分开保存。令牌加密不代表笔记、摘要和仓库缓存已加密，源数据仍需磁盘/备份加密；网站进程被攻破时密钥同样可被读，AES 不提供运行时沙箱。
- 轮换：部署同时提供当前密钥和受控旧密钥环，记录 keyId，逐条解密再用新 nonce/新密钥重加密，完成与恢复演练后移除旧 key。不要直接覆盖唯一密钥导致全库无法解密。丢失密钥只能重新连接，旧备份恢复也要匹配其 keyId。
- 上游令牌轮换：先在受保护请求中验证候选凭据和所选资源，通过后事务替换并增加 credentialRevision；失败保留原凭据和状态。调度器捕获 revision，禁止已断开的旧任务继续提交。
- 断开：先停任务/失效 lease、删除可用凭据并隐藏缓存；是否物理清除缓存由用户选择，默认保留至主动清理。断开本站不一定撤销供应商 token：PAT/API key 应明确提示去原平台撤销，App 应提示卸载或撤销相应授权；只有 adapter 确认可撤销时才声明“上游已撤销”。备份中的密文靠上游撤销与备份保留策略收敛风险。
- 任意远端 MCP URL、webhook 转发地址或插件配置均需防 SSRF：拒绝 userinfo、非许可协议、云元数据地址，检查 DNS 解析与每次跳转后的目标；默认阻断私网/loopback，显式本地连接器仅放行部署允许的固定 origin。不同 origin 不自动转发同一 Authorization。OAuth metadata URL 也经过相同校验。
- 外部笔记、README、摘要与 MCP 工具说明按不可信内容处理，渲染时清理 HTML/危险链接；其中的“请执行/上传/授权”文本不改变连接范围。数据发给 AI 服务前必须处于用户授权的出口范围，不因本站已有读取权就自动允许转发。

未来 webhook 和 `/mcp` 无法使用当前默认登录 cookie 检查。落地时需单独评审 `proxy.ts` 的**精确路径例外**和路由内鉴权：GitHub webhook 用签名，MCP 用自己的 bearer/OAuth；不能直接公开整个 `/api/integrations/`。OAuth discovery 元数据可公开但不含私有信息，回调须核验 state/issuer/会话绑定。本轮不修改 proxy、登录或任何源代码。

## 8. SQLite 数据模型草案

先用现有 `DATABASE_PATH` 与短事务，不另引入 ORM。连接器缓存是上游数据副本，站内收藏、草稿等由自己的领域表持有。第一阶段仅创建下列前六张表；其余随实际阶段增加，本文不要求立即建完。

| 表 | 关键字段与约束 | 作用 |
| --- | --- | --- |
| `integration_connections` | `id` PK、`providerId`、`pluginVersion`、`displayName`、`accountId/Label`、`runtime`、`authMethod`、`configJson`（无秘密）、`allowedScopesJson`、`grantedCapabilitiesJson`、`connectionStatus`、`credentialRevision`、`generation`、`createdAt/updatedAt/disconnectedAt` | 连接配置、权限及生命周期；一个 provider 可有多个连接 |
| `integration_credentials` | `id` PK、`connectionId` FK、`kind`、`ciphertext`、`nonce`、`authTag`、`keyId`、`expiresAt` nullable、`createdAt/rotatedAt`，唯一 `(connectionId, kind)` | 保存 API key/PAT/App 私钥/refresh token 等；访问 token 能短期只留内存则不持久化 |
| `integration_sync_states` | PK `(connectionId, scopeId)`、`checkpointJson`、`resumeTokenJson`、`etagJson`、`lastCheckedAt`、`lastSuccessfulAt`、`nextDueAt`、`retryAt`、`consecutiveFailures`、`lastErrorCode/SafeMessage`、`fullScanGeneration` | 库/仓库/vault 各自的增量进度；“已完成版本”与“中途分页恢复位置”分开 |
| `integration_sync_runs` | `id` PK、`connectionId` FK、`mode`、`trigger`、`status`、`idempotencyKey`、`connectionGeneration`、`credentialRevision`、`requestedAt/startedAt/finishedAt`、`leaseOwner/leaseExpiresAt`、`attempt`、`countsJson`、`errorCode/SafeMessage` | 持久任务、崩溃恢复、进度；唯一 `(connectionId, idempotencyKey)`，部分唯一索引保证每连接仅一个 queued/running/waiting_retry 任务 |
| `integration_items` | `id` PK、`connectionId` FK、`scopeId`、`externalId`、`kind`、`schemaVersion`、`sourceVersion`、`contentHash`、`title`、`url`、`parentExternalId`、`normalizedJson`、`sourceUpdatedAt`、`fetchedAt`、`lastSeenGeneration`、`deletedAt`；唯一 `(connectionId, scopeId, kind, externalId)` | 最小必要的归一化数据；Zotero key 不能跨 library 唯一，GitHub 采用稳定 ID；选定字段缓存，不默认全量原始 payload/PDF |
| `integration_item_links` | `id` PK、`connectionId` FK、`scopeId`、`externalId`、`kind`、`localEntityType/Id`、`relation`、`createdAt`；对应组合唯一 | 论文与精选/笔记/写作草稿的显式关联，保留来源；DOI 仅作候选去重信号，不按标题自动合并 |
| `integration_webhook_deliveries`（第二阶段） | `providerId + deliveryId` 唯一、`installationId`、`receivedAt`、`payloadHash`、`status`、`runId`，按需短期保留最小事件 envelope | 签名验证后的幂等收件箱；重复事件不会重复写入，原始正文默认不长期存 |
| `integration_write_operations`（写入阶段） | `id`、`connectionId`、`target`、`baseVersion`、`operationJson`、`approvalId`、`idempotencyKey`、`status`、`remoteResultId`、`conflictJson`、时间 | 写入 outbox 与冲突处理；超时后先查远端结果再决定是否重试 |
| `mcp_clients` / `mcp_grants`（MCP 服务端阶段） | 客户端 ID/登记方式、owner、允许 scopes/connection/resource 范围、期限、policyVersion、revokedAt；client secret 如有则加密 | 每客户端最小授权；OAuth token 生命周期由所选 AS 管理，本站保存关联与撤销状态；如自有 opaque bearer，仅存随机 token 的 hash |
| `mcp_audit_events`（MCP 阶段） | client/grant、工具或资源类型、目标 ID、允许/拒绝、safeError、时间和 requestId | 可审计谁读了哪类资源，不存完整查询结果或凭据 |

SQLite 开启外键约束，按 connection/scope/date 建索引；网络 I/O 在事务外。删除先写 tombstone，只有成功全量核对才据 generation 标记缺失条目。缓存删除不连带删除本站原创草稿和收藏；断开连接先隐藏并终止读取权限，清理策略单独执行。搜索索引后续按可见范围建立；不要把所有隐私条目放入一个不带授权过滤的搜索出口。

## 9. 建议新增的站点 API

以下都是**提案，未实现**，不改现有 `docs/API.md`。除未来明确声明的外部回调/协议入口，均由现有 cookie 登录保护；服务端生成 id 与时间。时间 ISO 8601，列表 `{ "items": [...] }`，删除 `{ "ok": true }`，错误继续 `{ "error": { "code": "...", "message": "..." } }`。

### 9.1 总览

| 方法 | 路径 | 说明 | 权限 | 建议阶段 |
| --- | --- | --- | --- | --- |
| GET | `/api/integrations` | 目录、能力、可用性与安全配置 schema | 登录 | 第一阶段 |
| GET | `/api/integrations/connections` | 已创建的连接与状态摘要 | 登录 | 第一阶段 |
| POST | `/api/integrations/:providerId/connections` | 校验凭据/范围后建立连接 | 登录 | 第一阶段 |
| GET | `/api/integrations/connections/:id` | 单个连接完整安全配置 | 登录 | 第一阶段 |
| PATCH | `/api/integrations/connections/:id` | 修改名称、普通配置或选择范围；重验权限 | 登录 | 第一阶段 |
| PATCH | `/api/integrations/connections/:id/credentials` | 原子替换凭据或重新授权结果 | 登录 | 第一阶段 |
| DELETE | `/api/integrations/connections/:id?purgeCache=false` | 停任务、清凭据、断开，可选清缓存 | 登录 | 第一阶段 |
| POST | `/api/integrations/connections/:id/sync` | 新建一次同步任务，返回任务对象 | 登录 | 第一阶段 |
| GET | `/api/integrations/connections/:id/sync` | 当前/最近任务、各 scope 状态 | 登录 | 第一阶段 |
| GET | `/api/integrations/sync-runs/:runId` | 指定任务进度与安全错误 | 登录 | 第一阶段 |
| POST | `/api/integrations/connections/:id/oauth/start` | 后续 OAuth/App 授权跳转初始化 | 登录 | 对应认证阶段 |
| GET | `/api/integrations/oauth/:providerId/callback` | 授权回调，严格校验临时 state 与绑定 | 专用回调校验 | 对应认证阶段 |
| POST | `/api/integrations/webhooks/github` | 原始字节验签后入队 | GitHub 签名，精确 proxy 例外 | 第二阶段可选 |
| POST | `/mcp` | MCP JSON-RPC；不是普通 JSON 资源 API | 独立 MCP OAuth/Bearer | MCP 阶段 |

MCP OAuth metadata/AS 回调的具体路径与接口由选定授权组件按标准生成后再定，不在 v0 随意固化。MCP 的协议错误遵循 JSON-RPC/传输规范，不强塞本站 `apiError` envelope。OAuth 回调成功重定向回设置页，URL 不放上游 token。

### 9.2 列出集成与连接

`GET /api/integrations`，200。字段 `id/label/availability/runtime/authMethods/capabilities/configSchema/credentialFields/documentationUrl`；下面为缩小的目录示例（真实响应各项使用同一字段集）。schema 只含定义，不含已保存 secret。

```json
{
  "items": [
    {
      "id": "zotero",
      "label": "Zotero",
      "availability": "ready",
      "runtime": ["local", "server"],
      "authMethods": ["api-key"],
      "capabilities": ["items.read", "sync.incremental"],
      "configSchema": {"type":"object","properties":{"libraryId":{"type":"string"},"libraryType":{"enum":["user","group"]}},"required":["libraryId","libraryType"]},
      "credentialFields": [{"name":"apiKey","label":"API key","required":true,"writeOnly":true}],
      "documentationUrl": "https://www.zotero.org/support/dev/web_api/v3/basics"
    }
  ]
}
```

`GET /api/integrations/connections` 返回 `{ "items": [<下例连接对象>] }`；`GET /api/integrations/connections/:id` 返回单个对象。连接公共字段固定为：

```json
{
  "id": "ic_demo_1",
  "providerId": "zotero",
  "displayName": "个人文献库",
  "accountLabel": "示例账户",
  "runtime": "server",
  "authMethod": "api-key",
  "config": {"libraryType":"user","libraryId":"12345","intervalSeconds":900},
  "allowedScopes": ["user:12345"],
  "grantedCapabilities": ["items.read", "sync.incremental"],
  "connectionStatus": "connected",
  "hasCredential": true,
  "credentialExpiresAt": null,
  "syncStatus": "idle",
  "lastSuccessfulAt": null,
  "latestRunId": null,
  "nextDueAt": "2026-11-06T08:15:00Z",
  "stale": true,
  "lastError": null,
  "createdAt": "2026-11-06T08:00:00Z",
  "updatedAt": "2026-11-06T08:00:00Z"
}
```

`credentialExpiresAt=null` 表示未知或上游未提供，不能显示“永不过期”。`stale` 依据各连接的期望间隔、是否已有成功数据及来源可用性计算，和 `connectionStatus` 分开。

### 9.3 建立连接、配置与换密钥

`POST /api/integrations/zotero/connections`

请求（示例值不是实际账户/key）：

```json
{
  "displayName": "个人文献库",
  "authMethod": "api-key",
  "config": {"libraryType":"user","libraryId":"12345","intervalSeconds":900},
  "requestedCapabilities": ["items.read", "sync.incremental"],
  "credentials": {"apiKey":"<用户本次输入，仅请求使用>"}
}
```

成功 201，返回 9.2 的完整连接对象，不回显 `credentials`。服务端验证与上游账号/资源一致后才保存；初次大同步异步执行，前端随后调用同步接口，不能把“验证通过”写成“同步完成”。GitHub 使用 `authMethod="fine-grained-pat"`、`config.repositories=["example-owner/example-repo"]`、`credentials.token`；Obsidian files 使用 `authMethod="none"`、`config.vaultRootAlias` 和允许的相对目录，不能上传任意绝对路径。

`PATCH /api/integrations/connections/:id` 请求只包含需改字段，例如：

```json
{"displayName":"研究文献","config":{"libraryType":"user","libraryId":"12345","intervalSeconds":1800}}
```

200 返回完整连接对象；`config` 如提供则完整替换而非不明确的深层 merge。修改资源范围后新建对应 sync state；旧范围缓存立即隐藏。库/账号身份替换建议新建连接，避免错误复用 checkpoint。

`PATCH /api/integrations/connections/:id/credentials` 请求：

```json
{"credentials":{"apiKey":"<新 key，仅请求使用>"}}
```

200 返回重新验证后的完整连接对象，原连接 id 不变；失败不覆盖原凭据。API-key/PAT 不因客户端省略字段而删掉 secret，删除由断开接口负责。OAuth 连接未来必须走对应授权流程，不能在这个接口接受浏览器伪造的 grant。

### 9.4 触发同步与查看状态

`POST /api/integrations/connections/:id/sync`

请求：

```json
{"mode":"incremental","idempotencyKey":"demo-request-20261106-1"}
```

`mode` 为 `incremental | full`，连接不支持的模式返回 400。`idempotencyKey` 为客户端生成、最长 128 字符、连接内唯一；相同 key 和相同参数重复请求返回原任务（200），不同参数复用 key 返回 409。新建任务返回 201（沿用资源 POST 约定），不等待远端数据取完。已有活跃任务时合并同模式请求并返回原任务 200；无法合并的模式返回 409 `SYNC_IN_PROGRESS`，不悄悄降级 full。

```json
{
  "id": "ir_demo_1",
  "connectionId": "ic_demo_1",
  "mode": "incremental",
  "trigger": "manual",
  "status": "queued",
  "requestedAt": "2026-11-06T08:01:00Z",
  "startedAt": null,
  "finishedAt": null,
  "retryAt": null,
  "counts": {"read":0,"upserted":0,"deleted":0,"failed":0},
  "error": null
}
```

`GET /api/integrations/sync-runs/ir_demo_1`，200 返回相同字段集；成功时 `status="succeeded"`、填写起止时间与计数。失败/等待重试时填写 `error`，计数可包含已提交的幂等批次，不表示未完成 checkpoint 已推进。

`GET /api/integrations/connections/ic_demo_1/sync`，200：

```json
{
  "connectionId": "ic_demo_1",
  "connectionStatus": "connected",
  "syncStatus": "succeeded",
  "activeRunId": null,
  "latestRunId": "ir_demo_1",
  "lastSuccessfulAt": "2026-11-06T08:02:00Z",
  "nextDueAt": "2026-11-06T08:17:00Z",
  "stale": false,
  "scopes": [
    {"id":"user:12345","lastSuccessfulAt":"2026-11-06T08:02:00Z","nextDueAt":"2026-11-06T08:17:00Z","retryAt":null,"lastError":null}
  ],
  "lastError": null
}
```

公开状态只暴露安全摘要，不回传供应商原始 checkpoint、分页 URL、内部路径或 headers。`lastError` 与任务 `error` 均为 `null` 或 `{ "code": "UPSTREAM_RATE_LIMITED", "message": "上游请求受限，稍后重试" }`，重试时间单独用 `retryAt`。

### 9.5 断开与错误

`DELETE /api/integrations/connections/:id?purgeCache=false`，200：

```json
{"ok":true}
```

同一已断开连接重复调用也成功；不存在的 id 返回 404。`purgeCache=true` 才清理连接缓存，站内原创内容不删；默认停止任务、隐藏缓存、删凭据并将连接保留为 disconnected。需要上游撤销时界面显示明确指引，不把 `{ok:true}` 解释为平台上的 key 已撤销。

普通接口示例错误：

```json
{"error":{"code":"INTEGRATION_CREDENTIAL_INVALID","message":"凭据无效，请检查或重新授权"}}
```

| 状态码 | 建议 code | 含义 |
| --- | --- | --- |
| 400 | `INVALID_REQUEST` / `INTEGRATION_CREDENTIAL_INVALID` / `CAPABILITY_UNSUPPORTED` | 参数、候选凭据或能力校验失败 |
| 401 | `UNAUTHORIZED` | 仅表示本站未登录；上游 token 失效不冒充本站登录失效 |
| 403（扩展） | `INTEGRATION_PERMISSION_REQUIRED` | 资源或能力未获授权，需用户处理 |
| 404 | `NOT_FOUND` | 本站连接/任务不存在；不能原样透传上游私库 404 |
| 409（扩展） | `SYNC_IN_PROGRESS` / `IDEMPOTENCY_CONFLICT` / `INTEGRATION_NOT_CONNECTED` | 任务、幂等键或连接状态冲突 |
| 429（扩展） | `RATE_LIMITED` | 本站主动触发频率限制，同时设置 Retry-After |
| 502（扩展） | `UPSTREAM_UNAVAILABLE` | 连接验证时上游不可用，区别于凭据错误 |
| 503（扩展） | `INTEGRATION_NOT_CONFIGURED` | 插件未安装、运行位置不支持或缺少加密配置 |
| 500 | `INTERNAL_ERROR` | 未知内部错误，记录内部 requestId，不向前端暴露堆栈 |

扩展状态码是本方案的待评审项，当前 `docs/API.md` 尚未声明。已受理的异步任务即便上游限流，其查询接口仍返回 200 和 `waiting_retry`，避免前端把任务失败误当作查询失败。

## 10. 分阶段落地与用户决策

工作量为一名熟悉本项目的开发者的工程日估算（含接口、通用设置交互和必要测试），不含供应商审批等待、视觉改版或海量历史数据导入。估算前提：个人文献约万条以内、指定仓库约十个以内；具体规模未核实，应先测首轮导入。阶段均可独立评审，不以未来阶段为理由提前建表。

| 阶段 | 明确范围与完成标准 | 工作量 | 依赖用户决定 |
| --- | --- | --- | --- |
| 1：只读连接闭环（推荐先做） | 六张基础表、加密保险箱、通用目录/连接/任务 API、状态卡片；Zotero 个人库文献/笔记与可验证批注、GitHub 指定仓库 README/提交/issue/PR 元数据；手动 + 15 分钟持久拉取；不做 Obsidian、webhook、MCP 或写回 | 8–12 日；核心与凭据约 2–3、Zotero 约 2–3、GitHub 约 1–2、通用 UI/故障测试与联调约 3–4，可交叉进行 | 部署是否常驻、允许同步哪些库/私库与正文、刷新要求、密钥与备份管理 |
| 2A：Obsidian 只读 | 选一种路线，索引选定 Markdown 子目录；处理离线、改名、删除、越界路径，证明无写入；Sync/Git 是用户选定的传输层 | 本地文件 2–4 日；服务器同步镜像/Local REST API 约 3–6 日，Headless 另留兼容验证时间 | 本地/服务器、OS、vault 路径/子目录、现有同步工具、是否有 Sync 订阅、是否接受额外进程 |
| 2B：GitHub App + webhook（可选） | 指定仓库安装、私钥续签、验签/去重/持久入队、撤销与漏件核对 | 3–5 日 | 组织审批、稳定域名/HTTPS、本地是否需要低延迟或转发 |
| 3：本站只读 MCP 服务器 | 选定工具/resources、独立客户端 grant、查询全链路范围过滤、撤销/限流/审计；与一个明确版本的 AI 客户端端到端验证 | 4–7 日；若没有可复用 OAuth AS，再加 3–5 日组件接入与兼容验证，不自行简化安全协议 | AI 客户端版本、本地/远端访问、允许的资料类型/连接、OAuth 组件与域名 |
| 4：网站 MCP 客户端 | 先接一个选定 server 的只读能力，工具/资源 allowlist、schema 映射、出站数据批准和故障处理 | 4–7 日；每新增 server 再按映射/认证估 1–3 日 | 具体 server、研究用途、能否把私人内容发给其运营方、是否已有站内 AI 入口 |
| 5：有限写回（按需） | 单独选一个上游/一个动作，preview + 明确确认 + expectedVersion + outbox + 冲突界面；先新建笔记或建 issue | 每种首个动作约 5–10 日，跨设备双向编辑另估 | 谁是数据主本、允许写入目录/仓库、删除策略、冲突责任、回滚/备份要求 |

第一阶段验收必须包含：上游 fixture 与测试库的分页/变更/删除、断点重启、权限缩小、401/403/429/5xx、断开后旧任务回包、幂等与配额退避；实际数据库不出现明文 token，任何响应/日志不泄漏 secret；所有接口未登录 401，已有每日精选行为不变。没有真实凭据时只能完成 fixture 测试，不应报告真实账号集成已经通过。

需要用户决定的问题（评审时回答，当前无需提供令牌）：

1. 网站长期运行在自己的哪台电脑/OS，还是常驻服务器？服务器是否可用持久磁盘、HTTPS 和进程管理？是否需要离开电脑后继续同步？
2. Zotero 使用个人库还是群组库、规模多大、是否只展示某些集合？允许本站缓存摘要、笔记和批注吗？PDF/全文第一阶段不抓取是否满足需求？
3. GitHub 指定哪些 owner/repo，是否包含私库/组织审批？首期接受有期限 PAT，还是愿意直接注册 GitHub App？issue/PR/README 哪些确有需要，15 分钟延迟是否可接受？
4. Obsidian vault 在哪里，有多少 Markdown/附件、哪些子目录不能同步？现用 Git、Sync、iCloud 或其他工具？若服务器部署，是否愿意维护只读镜像或付费 Sync 的 Headless 公测客户端及额外进程？
5. 各集成只读是否足够？若需写回，优先“新建阅读笔记”“收藏到 Zotero”还是“创建 GitHub issue”，由谁处理冲突，是否允许自动删除？
6. MCP 优先让现有 Claude/其他客户端读本站，还是让网站调用外部 MCP？具体客户端/server 与版本是什么？哪些连接、笔记和未发表内容允许向 AI 服务开放或发送？
7. 断开后保留隐藏缓存还是立即清除？密钥/备份由谁保管，历史缓存保留多久？
8. Notion 是实际需求还是设计占位？“添加插件”第一版采用审核目录和受支持 MCP 配置是否足够，是否真的需要安装第三方可执行代码？
9. 是否接受第 9 节新增状态码与独立 MCP/webhook 鉴权入口？如需与现有 API 进一步统一，应在实现前同步 `docs/API.md`，本轮不直接修改。

## 11. 查证记录、公开实验与未核实项

上文每个外部文档链接均于 **2026-11-06** 查阅；链接指向服务官方文档、官方规范，或明确注明的社区维护者资料，没有使用搜索结果摘要作为私有功能已可用的证据。

只读公开实验（均不带 Authorization，不读取本机私人应用）：

- `GET https://api.zotero.org/items/new?itemType=annotation&annotationType=highlight`：实测 HTTP 200，`Zotero-API-Version: 3`、schema 42；返回 `itemType=annotation`、`parentItem`、`annotationText`、`annotationComment`、`annotationPageLabel`、`annotationPosition` 等空模板字段。它验证字段存在，不验证私人库授权或已有批注可见性。[可复查公开模板](https://api.zotero.org/items/new?itemType=annotation&annotationType=highlight)。
- `GET https://api.github.com/rate_limit`：实测 HTTP 200，当前出口的 `resources.core.limit=60`、`remaining=58`；这符合未认证主额度，不能用此实验推断用户 PAT/App 的实际额度。[可复查公开接口](https://api.github.com/rate_limit)。
- MCP 官方 `latest` 重定向到 `2026-07-28`；已核对该版 HTTP、stdio、授权和发现页面。未连接任何第三方 MCP 服务器或 AI 客户端。

明确未核实：用户实际 Zotero/群组权限与批注授权；任何私人 GitHub 仓库、组织政策、PAT/App 实际额度与 webhook 交付；vault 路径/规模/同步工具；Local REST API 已安装版本及上述新能力；Headless 的目标 OS/CLI 凭据运行与长期稳定性；Claude 等客户端的实际版本与 OAuth/MCP 兼容链路；任意未选定 MCP server 的限额和数据使用政策；Notion API。本方案没有将这些写成已通过的集成验证，后续阶段需分别验收。

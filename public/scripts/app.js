// Hzzz_0's workbench: routing, views, layers and state. Renders only the active view, so the document holds one h1.
// Screen question (总览): what should I push forward today, and is research keeping pace with everything else?
// Face: the blue-grey ledger ground, research drawn in the one data hue. Signature: the research pipeline strip.
(() => {
  const D = window.DATA, C = window.Charts, A = window.API;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const cssv = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const T = 180, EASE = 'cubic-bezier(0.2, 0.8, 0.2, 1)';
  const md = (d) => `${+d.slice(5, 7)}月${+d.slice(8, 10)}日`;
  const wd = (d) => ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][new Date(d + 'T00:00:00').getDay()];
  const addDays = (d, n) => new Date(Date.parse(d + 'T00:00:00Z') + n * 86400000).toISOString().slice(0, 10);
  const h1 = (v) => `${C.fmt.dec(v % 1 ? 1 : 0)(v)} h`;
  const pct = (a, b) => Math.round((a / b) * 100);
  // real dates (Asia/Shanghai) for real records; sample cards keep D.SAMPLE_TODAY
  const today = () => A.today();
  const daysTo = (d) => A.daysBetween(today(), d);
  const ymd = (d) => `${+d.slice(0, 4)}年${md(d)}`;
  const cny = new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY' });
  const money = (cents) => cny.format(cents / 100);
  const dur = (m) => (m == null ? '—' : `${Math.floor(m / 60)} 小时 ${String(m % 60).padStart(2, '0')} 分`);
  const monthLabel = (m) => `${+m.slice(0, 4)}年${+m.slice(5, 7)}月`;
  let uid = 0;

  // ---------- icons: one outline set, 1.5px ----------
  const P = {
    overview: '<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    tasks: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="m7.5 12 3 3 6-6"/>',
    stats: '<path d="M3 3v18h18"/><path d="m7 15 4-5 3 3 5-6"/>',
    docs: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
    compass: '<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5z"/>',
    book: '<path d="M4 5a2 2 0 0 1 2-2h13v15H6a2 2 0 0 0-2 2z"/><path d="M4 20a2 2 0 0 0 2 1h13v-3"/>',
    flask: '<path d="M9 3h6M10 3v6l-5.5 9.5A1.7 1.7 0 0 0 6 21h12a1.7 1.7 0 0 0 1.5-2.5L14 9V3"/><path d="M7.5 15h9"/>',
    pen: '<path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>',
    data: '<ellipse cx="12" cy="5.5" rx="8" ry="2.5"/><path d="M4 5.5v13c0 1.4 3.6 2.5 8 2.5s8-1.1 8-2.5v-13M4 12c0 1.4 3.6 2.5 8 2.5s8-1.1 8-2.5"/>',
    plug: '<path d="M9 3v5M15 3v5M6 8h12v3a6 6 0 0 1-12 0zM12 17v4"/>',
    plusc: '<circle cx="12" cy="12" r="9" stroke-dasharray="2.5 2.5"/><path d="M12 8v8M8 12h8"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.6 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.7 1.7 0 0 0 1.6-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.9 1.9 0 0 0 3.4 0"/>',
    more: '<circle cx="5" cy="12" r="1.2" fill="currentColor"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/><circle cx="19" cy="12" r="1.2" fill="currentColor"/>',
    pin: '<path d="M12 17v5M9 3h6l-1 6 4 4H6l4-4z"/>',
    edit: '<path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z"/>',
    trash: '<path d="M4 7h16M10 11v6M14 11v6M5 7l1 13h12l1-13M9 7V4h6v3"/>',
    x: '<path d="M6 6l12 12M18 6 6 18"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    share: '<circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="m8.2 10.8 7.6-4.6M8.2 13.2l7.6 4.6"/>',
    download: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
    heart: '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>',
    doc: '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M8 13h8M8 17h5"/>',
    check: '<path d="m5 12.5 4.5 4.5L19 7.5" stroke-width="2.5"/>',
    grid: '<rect x="4" y="4" width="7" height="7" rx="1"/><rect x="13" y="4" width="7" height="7" rx="1"/><rect x="4" y="13" width="7" height="7" rx="1"/><rect x="13" y="13" width="7" height="7" rx="1"/>',
    list: '<path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01"/>',
    chevl: '<path d="m15 6-6 6 6 6"/>', chevr: '<path d="m9 6 6 6-6 6"/>',
    chevu: '<path d="m6 15 6-6 6 6"/>', chevd: '<path d="m6 9 6 6 6-6"/>',
    dumbbell: '<path d="M6.5 7v10M17.5 7v10M3.5 9.5v5M20.5 9.5v5M6.5 12h11"/>',
    wallet: '<path d="M4 7a2 2 0 0 1 2-2h11v4"/><path d="M4 7v10a2 2 0 0 0 2 2h14V9H6a2 2 0 0 1-2-2z"/><path d="M16 14h.01"/>',
    eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>',
    briefcase: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7M3 13h18"/>',
    scale: '<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M8.5 10a5 5 0 0 1 7 0L13 12.5"/>',
    moon: '<path d="M19.5 14.5A7.5 7.5 0 0 1 9.5 4.5a7.5 7.5 0 1 0 10 10z"/>',
    link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
  };
  const AREA_ICON = { research: 'flask', life: 'heart', company: 'briefcase', personal: 'doc' };
  const ic = (n, cls = '') => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[n] || ''}</svg>`;

  // ---------- state ----------
  const params = new URLSearchParams(location.search);
  const S = {
    weekly: 'this', projSort: 'updated', projView: 'list', resTab: '全部', paperTab: '全部', paperSort: 'added', taskTab: '进行中', taskSort: 'due',
    calWeek: 0, statsMetric: 'research', docFolder: '全部', docView: 'list', goalsEdit: false, unread: true,
    blockState: ['loading', 'error', 'empty'].includes(params.get('state')) ? params.get('state') : null,
    failed: new Set(), pinned: [],
    taskArea: 'all', taskProject: '', coTab: '未完成', coProject: '', leadTab: 'all', finMonth: A.month(), cycleDraft: null,
  };

  // ---------- real records: one store, loaded through scripts/api.js ----------
  // R[key] = { status: 'loading' | 'ready' | 'error', data, error }. A view lists the keys it reads (V.keys); render()
  // loads the ones not fetched yet, and a finished load re-renders the view only if it still reads that key.
  const R = {};
  const LOADERS = {
    tasks: () => A.tasks.list(),
    companyProjects: () => A.projects.list('company'),
    weights: () => A.life.weights(),
    weightWeekly: () => A.life.weightWeekly(8),
    sleep: () => A.life.sleep(),
    sleepWeekly: () => A.life.sleepWeekly(8),
    cycle: () => A.life.cycle(),
    plan: () => A.life.plan(),
    sessions: () => A.life.sessions(),
    leads: () => A.company.leads(),
  };
  const loaderFor = (key) => LOADERS[key] || (([k, arg]) => ({
    tx: () => A.company.transactions(arg),
    sum: () => A.company.summary(arg),
    monthly: () => A.company.monthly(A.addMonths(arg, -5), arg),
  })[k])(key.split(':'));
  const data = (key) => R[key]?.data;
  function load(key) {
    const prev = R[key];
    R[key] = { status: 'loading', data: prev?.data };
    return loaderFor(key)().then(
      (d) => { R[key] = { status: 'ready', data: d }; },
      (e) => { R[key] = { status: 'error', data: prev?.data, error: e.message }; },
    ).then(() => { if (viewKeys().includes(key)) queueRender(); });
  }
  const need = (keys) => keys.forEach((k) => { if (!R[k]) load(k); });
  const refresh = (...keys) => Promise.all(keys.map(load));
  // a change elsewhere made these stale: reload what is on screen, forget the rest until it is opened again
  const invalidate = (pred) => { const on = viewKeys(); for (const k of Object.keys(R)) if (pred(k)) { if (on.includes(k)) load(k); else delete R[k]; } };
  function stateOf(keys) {
    const err = keys.find((k) => R[k]?.status === 'error');
    if (err) return { st: 'error', keys, error: R[err].error };
    if (keys.some((k) => !R[k] || (R[k].status === 'loading' && R[k].data === undefined))) return { st: 'loading', keys };
    return { st: null, keys };
  }
  let renderQueued = false;
  const queueRender = () => { if (renderQueued) return; renderQueued = true; requestAnimationFrame(() => { renderQueued = false; render(); }); };
  const viewKeys = () => { const { path, q } = currentRoute(); return VIEWS[path].keys ? VIEWS[path].keys(q) : []; };

  const tasksAll = () => data('tasks') || [];
  const isOpen = (t) => t.state === '进行中' || t.state === '待开始';
  const companyProjects = () => data('companyProjects') || [];
  const projectName = (id) => companyProjects().find((p) => p.id === id)?.name || '';

  // ---------- navigation ----------
  const NAV = {
    main: [['总览', '#/overview', 'overview'], ['日历', '#/calendar', 'calendar'], ['我的任务', '#/tasks', 'tasks', 'due'], ['统计', '#/stats', 'stats'], ['文档', '#/docs', 'docs']],
    research: [['研究概览', '#/research', 'compass'], ['文献阅读', '#/research/papers', 'book'], ['实验记录', '#/research/experiments', 'flask'], ['论文写作', '#/research/writing', 'pen'], ['数据与代码', '#/research/data', 'data']],
    life: [['健康记录', '#/life/health', 'heart'], ['训练记录', '#/life/training', 'dumbbell']],
    company: [['财务报表', '#/company/finance', 'wallet'], ['选品观察', '#/company/leads', 'eye'], ['公司待办', '#/company/tasks', 'briefcase']],
    integrations: [['Zotero', '#/settings/integrations', 'plug', null, true], ['Notion', '#/settings/integrations', 'plug', null, true], ['GitHub', '#/settings/integrations', 'plug', null, true], ['添加插件', '#/settings/integrations', 'plusc']],
    bottom: [['设置', '#/settings', 'settings']],
  };
  const dueTodayCount = () => tasksAll().filter((t) => isOpen(t) && t.due === today()).length;
  function renderNav() {
    const route = currentRoute().path;
    for (const [group, items] of Object.entries(NAV)) {
      const el = $(`[data-nav-group="${group}"]`);
      el.innerHTML = '<span class="nav-indicator" aria-hidden="true"></span>' + items.map(([label, href, icon, count, noMatch]) => {
        const cur = !noMatch && '#' + route === href;
        const n = count === 'due' ? dueTodayCount() : null;
        return `<a class="nav-item" href="${href}"${cur ? ' aria-current="page"' : ''}>${ic(icon)}<span>${esc(label)}</span>${n ? `<span class="count" aria-label="今天截止 ${n} 项">${n}</span>` : ''}</a>`;
      }).join('');
    }
    syncFold(route);
  }

  // ---------- 侧栏分组折叠 ----------
  // 科研、生活、个人公司、集成四组可以折叠；展开状态存在 localStorage。
  // 第一次打开时只展开当前页面所在的组；之后进入一个收起组里的页面，会自动展开那一组。
  const FOLD_KEY = 'labdesk.navGroups';
  const FOLDABLE = ['research', 'life', 'company', 'integrations'];
  let fold = (() => { try { const v = JSON.parse(localStorage.getItem(FOLD_KEY)); return v && typeof v === 'object' ? v : null; } catch { return null; } })();
  const saveFold = () => { try { localStorage.setItem(FOLD_KEY, JSON.stringify(fold)); } catch { /* 隐私模式等情况下存不了，只在本次打开内有效 */ } };
  const groupOf = (route) => FOLDABLE.find((g) => NAV[g].some(([, href, , , noMatch]) => !noMatch && href === '#' + route)) || null;
  function applyFold() {
    for (const g of FOLDABLE) {
      const open = !!fold[g], btn = $(`[data-action="nav-group"][data-group="${g}"]`), box = $('#nav-' + g);
      if (!btn || !box) continue;
      btn.setAttribute('aria-expanded', String(open));
      box.classList.toggle('closed', !open);
      box.inert = !open;   // 收起后里面的链接不能用 Tab 选中，读屏也跳过
    }
  }
  let foldRoute = null;   // 只在切换到新页面时自动展开；同一页面重绘时，尊重用户刚才的收起
  function syncFold(route) {
    const cur = groupOf(route);
    if (!fold) { fold = Object.fromEntries(FOLDABLE.map((g) => [g, g === cur])); saveFold(); }
    else if (route !== foldRoute && cur && !fold[cur]) { fold[cur] = true; saveFold(); }
    foldRoute = route;
    applyFold();
  }
  function toggleFold(g) {
    if (!FOLDABLE.includes(g)) return;
    fold[g] = !fold[g]; saveFold(); applyFold();
  }
  const lastIndicator = {};
  function placeIndicators(animate) {
    for (const el of $$('.nav')) {
      const ind = $('.nav-indicator', el), cur = $('[aria-current="page"]', el), g = el.dataset.navGroup;
      if (!ind) continue;   // before the first render (tasks still loading) the nav has no indicator yet
      if (!cur) { ind.style.opacity = 0; lastIndicator[g] = null; continue; }
      const y = cur.offsetTop + 4;
      const from = lastIndicator[g];
      ind.style.transition = 'none';
      ind.style.opacity = 1;
      ind.style.transform = `translateY(${animate && from != null ? from : y}px)`;
      void ind.offsetWidth;
      ind.style.transition = '';
      ind.style.transform = `translateY(${y}px)`;
      lastIndicator[g] = y;
    }
  }
  function currentRoute() {
    const h = location.hash.replace(/^#/, '') || '/overview';
    const [path, q] = h.split('?');
    return { path: VIEWS[path] ? path : '/overview', q: new URLSearchParams(q || '') };
  }

  // ---------- blocks and states ----------
  // keys: the real records this card reads; it shows loading, error (with retry) and empty from them.
  // sample: the card is still on sample data and says so in its header ("示例", or the given text).
  // body and tools may be functions, so they are only built once the records are there.
  function block({ cls = '', inverse = false, title, count, tools = '', body, empty = '', isEmpty = false, id, keys = null, sample = false }) {
    const ks = keys ? stateOf(keys) : null;
    const st = S.failed.has(id) ? 'error' : S.blockState || ks?.st || null;
    const val = (v) => (typeof v === 'function' ? v() : v);
    let inner;
    if (st === 'loading') inner = `<div class="skel" aria-busy="true" aria-label="正在加载${esc(title)}"><div class="skeleton kpi"></div><div class="skeleton"></div><div class="skeleton"></div><div class="skeleton" style="width:60%"></div></div>`;
    else if (st === 'error') inner = errLine(title, ks?.error, keys, id);
    else if (st === 'empty' || val(isEmpty)) inner = `<div class="empty">${val(empty)}</div>`;
    else inner = val(body);
    const n = st ? null : val(count);
    const tag = sample ? ` <span class="sample-tag">${esc(sample === true ? '示例' : sample)}</span>` : '';
    return `<section class="card ${inverse ? 'inverse' : ''} ${cls}" aria-labelledby="h-${id}" data-block="${id}">
      <header class="card-head"><h2 id="h-${id}">${esc(title)}${n != null ? ` <span class="chip" aria-label="${n} 项">${n}</span>` : ''}${tag}</h2><div class="tools">${st ? '' : val(tools)}</div></header>
      ${inner}</section>`;
  }
  const errLine = (title, error, keys, id) => keys
    ? `<div class="err" role="alert"><i aria-hidden="true"></i><span>无法加载${esc(title)}${error ? `：${esc(error)}` : ''}。</span><button class="tlink" type="button" data-action="reload" data-keys="${esc(keys.join(','))}">重试</button></div>`
    : `<div class="err" role="alert"><i aria-hidden="true"></i><span>无法加载${esc(title)}，最后更新 09:14。</span><button class="tlink" type="button" data-action="retry" data-id="${id}">重试</button></div>`;
  // note: what on this screen is sample data, or '' when everything is a real record
  const topRow = (title, finding = '', note = '') => `<div class="top-row"><div><h1>${esc(title)}</h1>${finding ? `<p class="finding">${finding}</p>` : ''}</div>
    <div class="cluster">
      <button class="btn primary" type="button" data-action="create" aria-haspopup="menu" aria-expanded="false">${ic('plus')}新建 Create</button>
      <button class="icon-btn" type="button" data-action="search" aria-label="搜索">${ic('search')}</button>
      <button class="icon-btn" type="button" data-action="bell" aria-label="提醒${S.unread ? '，3 条未读' : ''}" aria-haspopup="dialog">${ic('bell')}${S.unread ? '<span class="dot-badge" aria-hidden="true"></span>' : ''}</button>
      <span class="avatar" aria-label="${esc(D.owner.name)}">${esc(D.owner.initial)}</span>
    </div></div>
    ${note ? `<p class="sample-line">${esc(note)}</p>` : ''}`;
  const NOTE = {
    research: '示例数据：科研项目、文献、实验、写作进度和日程为演示内容。',
    calendar: '示例数据：日历里的安排为演示内容。',
    stats: '示例数据：工时与完成任务的统计为演示内容。',
    docs: '示例数据：文件列表为演示内容，上传尚未开放。',
    settings: '示例数据：月度计划只保存在当前页面，刷新后恢复。',
  };
  const seg = (action, value, options, label) => `<div class="segmented" role="group" aria-label="${esc(label)}">${options.map(([v, l, icon]) => `<button type="button" data-action="${action}" data-value="${v}" aria-pressed="${v === value}"${icon ? ` aria-label="${esc(l)}"` : ''}>${icon ? ic(icon) : esc(l)}</button>`).join('')}</div>`;
  const tabs = (action, value, options, label) => `<div class="tabs" role="tablist" aria-label="${esc(label)}">${options.map(([v, l, n]) => `<button type="button" role="tab" data-action="${action}" data-value="${esc(v)}" aria-selected="${v === value}">${esc(l)}${n != null ? `<span class="n">${n}</span>` : ''}</button>`).join('')}<span class="tab-ind" aria-hidden="true"></span></div>`;
  const select = (action, value, options, label) => `<select class="select" data-action="${action}" aria-label="${esc(label)}">${options.map(([v, l]) => `<option value="${v}"${v === value ? ' selected' : ''}>${esc(l)}</option>`).join('')}</select>`;
  const pill = (status) => {
    const cls = { 已完成: 'pos', 已批注: 'pos', 已投稿: 'pos', 已逾期: 'neg', 运行中: '', 数据待清洗: 'warn', 写作中: '', 未开始: '', 暂停: '' }[status] ?? '';
    return `<span class="pill ${cls}">${esc(status)}</span>`;
  };
  // due text for real tasks, against the real date
  const dueText = (d) => { if (!d) return { t: '无截止日期', soon: false }; const n = daysTo(d); return n < 0 ? { t: `已逾期 ${-n} 天`, soon: true } : n === 0 ? { t: '今天截止', soon: true } : n === 1 ? { t: '明天截止', soon: true } : { t: `${md(d)} ${wd(d)}`, soon: false }; };

  // ---------- signature element: the research pipeline strip ----------
  function pipeline(r, full = false) {
    const n = D.daysLeft(r.due);
    return `<button type="button" class="pipe-row" data-key="${r.id}" data-nav="#/research" aria-label="${esc(r.name)}，${D.STAGES[r.stage]}阶段，${esc(r.milestone)}还剩 ${n} 天">
      <span class="name">${esc(r.name)}</span>
      <span class="when ${n <= 12 ? 'soon' : ''}" style="grid-row: span 3"><b>${esc(r.milestone)} · 还剩 ${n} 天</b>${md(r.due)}<br>下一步 ${esc(r.next.label)} ${md(r.next.due)}</span>
      <span class="pipe" aria-hidden="true">${D.STAGES.map((_, i) => `<span class="seg ${i < r.stage ? 'done' : i === r.stage ? 'now' : ''}"></span>`).join('')}</span>
      <span class="pipe-labels" aria-hidden="true">${D.STAGES.map((s, i) => `<span class="${i === r.stage ? 'now' : ''}">${s}${full ? `<small>${esc(r.stageDates[i])}</small>` : ''}</span>`).join('')}</span>
    </button>`;
  }
  const researchSorted = () => [...D.research].sort((a, b) => a.due.localeCompare(b.due));

  // small rings
  function ring28(done, steps, light) {
    const r = 11, c = 2 * Math.PI * r;
    return `<svg class="ring28" viewBox="0 0 28 28" role="img" aria-label="${done}/${steps} 步"><circle cx="14" cy="14" r="${r}" fill="none" stroke="${light ? 'var(--rule)' : 'var(--inverse-raised)'}" stroke-width="2.5"/><circle cx="14" cy="14" r="${r}" fill="none" stroke="${light ? 'var(--chart-1)' : 'var(--surface)'}" stroke-width="2.5" stroke-dasharray="${(c * done) / steps} ${c}" transform="rotate(-90 14 14)" stroke-linecap="round"/></svg>`;
  }

  // ======================= views =======================
  const VIEWS = {};

  // ---------- 总览 ----------
  VIEWS['/overview'] = {
    title: `你好，${D.owner.name}`,
    keys: () => ['tasks'],
    render() {
      const dr = D.draft(), days = D.daysLeft(dr.due), t = today();
      const real = R.tasks?.status === 'ready' ? `进行中的任务 <b>${tasksAll().filter((x) => x.state === '进行中').length} 项</b>，今天到期 ${dueTodayCount()} 项。` : '';
      const finding = `${ymd(t)} ${wd(t)} · ${real}示例课题「${esc(dr.name)}」${esc(dr.milestone)}还剩 ${days} 天。<button type="button" class="tlink" data-nav="#/research/writing">打开初稿</button>`;
      return topRow(`你好，${D.owner.name}`, finding, '「进行中的任务」和已完成任务数来自你的真实记录；标有「示例」的卡片是演示内容。') + `<div class="grid">
        ${this.summary()}${this.weekly()}${this.month()}${this.goals()}${this.tasks()}${this.research()}${this.projects()}
      </div>`;
    },
    summary() {
      const pc = D.projectCounts();
      const done = R.tasks?.status === 'ready' ? tasksAll().filter((t) => t.state === '已完成').length : '—';
      return block({ id: 'summary', cls: 'span-4 ov-summary', inverse: true, title: '总体概况', sample: '项目为示例',
        tools: `<button class="icon-btn" type="button" data-action="menu-summary" aria-label="总体概况菜单" aria-haspopup="menu">${ic('more')}</button>`,
        body: `<div class="figures"><div class="figure"><span class="v">${done}</span><span class="l">已完成任务<br>累计</span></div><span class="vrule" aria-hidden="true"></span>
          <div class="figure"><span class="v">${pc.paused}</span><span class="l">暂停<br>项目</span></div></div>
          <div class="tiles"><div class="tile dim"><span class="v">${pc.total}</span><span class="l">项目</span></div><div class="tile"><span class="v">${pc.active}</span><span class="l">进行中</span></div><div class="tile"><span class="v">${pc.done}</span><span class="l">已完成</span></div></div>`,
      });
    },
    weekly() {
      const wk = D.weeks[S.weekly], t = D.weekTotal(S.weekly);
      return block({ id: 'weekly', cls: 'span-4 ov-weekly', title: '本周进度', sample: true,
        tools: seg('weekly', S.weekly, [['this', '本周'], ['last', '上周']], '周期'),
        body: `<div class="legend-line"><span class="lg" id="weekly-legend"></span><span class="num" style="margin-left:auto">工作 ${h1(t.work)} · 科研 ${h1(t.research)}</span></div>
          <div class="chart" id="weekly-chart" aria-describedby="weekly-desc"></div><p class="sr-only" id="weekly-desc">${esc(wk.label)}，工作 ${h1(t.work)}，科研 ${h1(t.research)}</p>`,
      });
    },
    month() {
      const m = D.month(), pl = D.plan;
      const tracks = [['工作', m.work, pl.work, 'var(--chart-1)', 57], ['科研', m.research, pl.research, 'var(--chart-3)', 47], ['个人', m.personal, pl.personal, 'var(--chart-2)', 37]];
      const diff = m.research - D.octSamePeriodResearch;
      const rings = tracks.map(([l, v, p, col, r]) => { const c = 2 * Math.PI * r; return `<circle cx="60" cy="60" r="${r}" fill="none" stroke="var(--rule)" stroke-width="6"/><circle cx="60" cy="60" r="${r}" fill="none" stroke="${col}" stroke-width="6" stroke-dasharray="${(c * Math.min(1, v / p)).toFixed(1)} ${c.toFixed(1)}" transform="rotate(-90 60 60)" stroke-linecap="round"><title>${l} ${v} / ${p} h</title></circle>`; }).join('');
      return block({ id: 'month', cls: 'span-4 ov-month', title: '本月进度', sample: true,
        tools: `<span class="small muted">11月1日至6日</span>`,
        body: `<p class="small muted" style="margin-top:-6px">科研 <span class="up">${diff >= 0 ? '+' : '−'}${h1(Math.abs(diff))}</span> vs 10月同期（${h1(D.octSamePeriodResearch)}）</p>
          <div class="month-body"><div class="month-legend">${tracks.map(([l, v, p, col]) => `<div class="row2"><i style="background:${col}"></i><span>${l}</span><span class="val">${v} / ${p} h · ${pct(v, p)}%</span></div>`).join('')}</div>
          <div class="rings"><svg viewBox="0 0 120 120" width="120" height="120" role="img" aria-label="本月计划完成度：工作 ${pct(m.work, pl.work)}%，科研 ${pct(m.research, pl.research)}%，个人 ${pct(m.personal, pl.personal)}%">${rings}</svg><div class="centre"><b>${pct(m.research, pl.research)}%</b><span class="small muted">科研</span></div></div></div>
          <div class="card-foot"><button class="icon-btn dark" type="button" data-action="share-month" aria-label="复制本月摘要">${ic('share')}</button><button class="btn" type="button" data-action="download-month">下载报告 ${ic('download')}</button></div>`,
      });
    },
    goals() {
      const done = D.goals.filter((g) => g.done).length, total = D.goals.length, r = 10, c = 2 * Math.PI * r;
      const prog = (g) => (g.id === 'g2' ? `<span class="small muted num">${D.papersRead()}/8</span>` : '');
      const rows = S.goalsEdit
        ? D.goals.map((g) => `<div class="goal"><input class="input" data-goal-input="${g.id}" value="${esc(g.text)}" aria-label="目标名称"><button class="icon-btn bare" type="button" data-action="goal-del" data-id="${g.id}" aria-label="删除目标「${esc(g.text)}」">${ic('trash')}</button></div>`).join('') + `<div class="goal"><button class="tlink" type="button" data-action="goal-add">${ic('plus', 'sr-hide')}添加目标</button></div>`
        : D.goals.map((g) => `<div class="goal ${g.done ? 'done' : ''}" data-key="${g.id}"><button class="check" type="button" role="checkbox" aria-checked="${g.done}" data-action="goal-toggle" data-id="${g.id}" aria-label="${esc(g.text)}">${ic('check')}</button><span class="text">${esc(g.text)}</span>${prog(g)}</div>`).join('');
      return block({ id: 'goals', cls: 'span-4 ov-goals', title: '本月目标', sample: true, isEmpty: !D.goals.length && !S.goalsEdit,
        empty: `本月还没有目标，<button class="tlink" type="button" data-action="goal-edit">写下第一个</button>`,
        tools: `<span class="mini-ring"><svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true"><circle cx="14" cy="14" r="${r}" fill="none" stroke="var(--rule)" stroke-width="3"/><circle cx="14" cy="14" r="${r}" fill="none" stroke="var(--chart-1)" stroke-width="3" stroke-dasharray="${total ? (c * done) / total : 0} ${c}" transform="rotate(-90 14 14)" style="transition:stroke-dasharray ${T}ms ${EASE}"/></svg>${done}/${total}</span>
          <button class="icon-btn bare" type="button" data-action="goal-edit" aria-pressed="${S.goalsEdit}" aria-label="${S.goalsEdit ? '完成编辑' : '编辑目标'}">${ic(S.goalsEdit ? 'check' : 'edit')}</button>`,
        body: `<div class="list">${rows}</div>`,
      });
    },
    tasks() {
      const live = tasksInProgress();
      const card = (t) => { const d = dueText(t.due); return `<article class="task" data-key="${t.id}">
          <div class="top"><span class="task-area">${ic(AREA_ICON[t.area] || 'doc', 'ticon')}<span class="small muted">${esc(t.areaLabel)}${t.projectId ? ` · ${esc(projectName(t.projectId))}` : ''}</span></span><button class="icon-btn bare" type="button" data-action="task-menu" data-id="${t.id}" aria-label="「${esc(t.title)}」操作" aria-haspopup="menu">${ic('more')}</button></div>
          <h3>${esc(t.title)}</h3>${S.pinned.includes(t.id) ? '<span class="pinned-mark">已置顶</span>' : ''}
          <div class="foot"><span class="due ${d.soon ? 'soon' : ''}">${d.t}</span><button class="icon-btn" type="button" data-action="task-remind" data-id="${t.id}" aria-pressed="${!!t.remind}" aria-label="提醒「${esc(t.title)}」">${ic('bell')}</button></div></article>`; };
      const ks = stateOf(['tasks']);
      const st = S.failed.has('tasks') ? 'error' : S.blockState || ks.st;
      const body = st === 'loading' ? `<div class="skel" aria-busy="true" aria-label="正在加载任务"><div class="skeleton"></div><div class="skeleton"></div></div>`
        : st === 'error' ? errLine('任务', ks.error, ['tasks'], 'tasks')
        : `<div class="task-row">${st === 'empty' ? '' : live.slice(0, 3).map(card).join('')}<button type="button" class="add-card" data-action="new" data-type="task" data-state="进行中"><span>${ic('plus')}${(st === 'empty' || !live.length) ? '没有进行中的任务，添加一个' : '添加任务'}</span></button></div>`;
      return `<section class="card bare span-8" aria-labelledby="h-tasks" data-block="tasks"><header class="card-head"><h2 id="h-tasks">进行中的任务${st ? '' : ` <span class="chip">${st === 'empty' ? 0 : live.length}</span>`}</h2><div class="tools"><button type="button" class="card-link" data-nav="#/tasks?view=archive">打开归档</button></div></header>${body}</section>`;
    },
    research() {
      const lead = researchSorted()[0];
      return block({ id: 'research', cls: 'span-6', title: '科研进展', count: D.research.length, sample: true,
        tools: lead ? `<span class="lead-fig" aria-label="${esc(lead.milestone)}还剩 ${D.daysLeft(lead.due)} 天"><span class="small muted">${esc(lead.milestone)} · ${md(lead.due)}</span><b class="num">${D.daysLeft(lead.due)}<small> 天</small></b></span><button type="button" class="card-link" data-nav="#/research">查看全部</button>` : '',
        isEmpty: !D.research.length, empty: '还没有科研项目，点 新建 开一个',
        body: `<div class="list">${researchSorted().map((r) => pipeline(r)).join('')}</div>`,
      });
    },
    projects() {
      const top3 = [...D.projects].sort((a, b) => b.updated.localeCompare(a.updated)).slice(0, 3);
      const sorted = sortProjects(top3);
      const item = (p) => `<div class="proj" data-key="${p.id}"><span class="pname ellipsis">${esc(p.name)}</span>${ring28(p.done, p.steps)}
        <span class="pmeta"><i aria-hidden="true"></i>${esc(p.status)} · <span class="num">${p.done}/${p.steps}</span> 步</span>
        <span class="psum" title="${esc(p.summary)}">已完成：${esc(p.summary)}</span></div>`;
      return block({ id: 'projects', cls: 'span-6', inverse: true, title: '最近项目', sample: true,
        tools: select('proj-sort', S.projSort, [['updated', '最近更新'], ['due', '截止日期'], ['progress', '进度']], '排序') + `<span class="view-toggle">${seg('proj-view', S.projView, [['grid', '网格', 'grid'], ['list', '列表', 'list']], '视图')}</span>`,
        isEmpty: !sorted.length, empty: '还没有项目，点 新建 开始一个',
        body: `<div class="proj-list ${S.projView === 'grid' ? 'grid-view' : ''}">${sorted.map(item).join('')}</div>`,
      });
    },
    mount() {
      const el = $('#weekly-chart');
      if (!el) return;
      const wk = D.weeks[S.weekly], vals = wk.research.filter((v) => v != null), peak = Math.max(...vals), at = wk.research.indexOf(peak);
      C.line(el, {
        labels: ['一', '二', '三', '四', '五', '六', '日'],
        series: [{ name: '工作', values: wk.work, colour: cssv('--chart-1') }, { name: '科研', values: wk.research, colour: cssv('--chart-3') }],
        format: h1, tickFormat: (v) => `${v} h`, yTicks: [0, 5, 10], height: 150,
        today: S.weekly === 'this' ? 4 : null, todayLabel: '今天',
        annotations: [{ at, label: `科研 ${h1(peak)}` }], legend: $('#weekly-legend'),
      });
    },
  };
  function tasksInProgress() {
    const live = tasksAll().filter((t) => t.state === '进行中');
    return live.sort((a, b) => (S.pinned.indexOf(b.id) > -1) - (S.pinned.indexOf(a.id) > -1) || (a.due || '9999').localeCompare(b.due || '9999'));
  }
  function sortProjects(list) {
    const by = { updated: (a, b) => b.updated.localeCompare(a.updated), due: (a, b) => a.due.localeCompare(b.due), progress: (a, b) => b.done / b.steps - a.done / a.steps };
    return [...list].sort(by[S.projSort]);
  }

  // ---------- 研究概览 ----------
  const paperRow = (p, compact) => `<div class="lrow" data-key="${p.id}" style="grid-template-columns: ${compact ? '104px minmax(0,1fr) auto' : '104px minmax(0,1fr) 120px 96px 104px'}">
      <span class="venue">${esc(p.venue)} ${p.year}</span>
      <span class="ellipsis">${esc(p.title)}<span class="small muted" style="display:block">${esc(p.project)}</span></span>
      ${compact ? `<span class="r">${pill(p.status)}${p.status === '在读' ? `<span class="small muted" style="display:block">p.${p.page}/${p.pages}</span>` : ''}</span>`
        : `<span>${pill(p.status)}${p.status === '在读' ? ` <span class="small muted num">p.${p.page}/${p.pages}</span>` : p.notes ? ` <span class="small muted num">${p.notes} 条</span>` : ''}</span><span class="r small muted">${md(p.added)}</span>
           <span class="r">${p.status === '已批注' ? '<span class="small muted">已读完</span>' : `<button class="tlink" type="button" data-action="paper-next" data-id="${p.id}">标为${p.status === '待读' ? '在读' : '已批注'}</button>`}</span>`}
    </div>`;
  const expRow = (e) => `<button type="button" class="lrow click" data-key="${e.id}" data-action="exp-open" data-id="${e.id}" style="grid-template-columns: 76px minmax(0,1fr) auto 64px">
      <span class="mono small">${esc(e.id)}</span><span class="ellipsis">${esc(e.name)}<span class="small muted" style="display:block">${esc(e.project)}</span></span>${pill(e.status)}<span class="r small muted">${md(e.date)}</span></button>`;
  function writingCard(cls, full) {
    const m = D.manuscript, r = D.research.find((x) => x.id === m.research), days = D.daysLeft(r.due), left = m.target - m.words;
    const elapsedShare = (() => { const start = '2026-11-02', total = D.daysBetween(start, r.due), gone = D.daysBetween(start, D.SAMPLE_TODAY); return gone / total; })();
    return block({ id: 'writing', cls, title: '论文写作',
      tools: `<button class="btn" type="button" data-action="open-draft">打开初稿</button>`,
      body: `<p class="muted">${esc(m.title)} · 初稿 ${md(r.due)} · 还剩 ${days} 天</p>
        <div class="big" style="margin-top:8px">${C.fmt.int(m.words)}<small>/ ${C.fmt.int(m.target)} 字</small></div>
        <div class="track" role="img" aria-label="已写 ${C.fmt.int(m.words)} 字，目标 ${C.fmt.int(m.target)} 字"><span class="fill" style="width:${(m.words / m.target) * 100}%"></span><span class="pace" style="left:${elapsedShare * 100}%" title="按时完成今天应到的位置"></span></div>
        <div class="track-ends"><span>0</span><span>还剩 ${C.fmt.int(left)} 字，约 ${C.fmt.int(Math.ceil(left / days))} 字/天</span><span>${C.fmt.int(m.target)}</span></div>
        <div class="list" style="margin-top:8px">${m.sections.map((s) => `<div class="lrow" style="grid-template-columns:minmax(0,1fr) auto 72px"><span>${s.name}</span>${pill(s.state)}<span class="r small muted">${s.words ? C.fmt.int(s.words) + ' 字' : '—'}</span></div>`).slice(0, full ? 4 : 4).join('')}</div>
        <div style="display:flex;align-items:center;gap:6px;margin-top:8px" class="small muted">合作者 ${m.authors.map((a, i) => `<span class="avatar sm ${i ? 'co' : ''}" title="${esc(a.name)}">${esc(a.name)}</span>`).join('')}</div>`,
    });
  }
  function calendarCard(cls) {
    const start = '2026-11-02', days = [...Array(28)].map((_, i) => addDays(start, i));
    const ti = days.indexOf(D.SAMPLE_TODAY);
    return block({ id: 'rcal', cls, title: '科研日程',
      tools: `<button type="button" class="card-link" data-nav="#/calendar">在日历中查看</button>`,
      body: `<div class="strip-axis" aria-hidden="true"><span>11月2日</span><span>11月9日</span><span>11月16日</span><span>11月23日</span></div>
        <div class="strip" role="img" aria-label="11月2日至29日的科研日期，今天 11月6日">${days.map((d, i) => { const ev = D.researchDates.find((x) => x.date === d); const w = new Date(d + 'T00:00:00').getDay(); return `<span class="d ${w === 0 || w === 6 ? 'we' : ''} ${i === ti ? 'today' : ''}">${ev ? `<span class="mk ${ev.research ? 'res' : ''}" title="${md(d)} ${esc(ev.label)}"></span>` : ''}</span>`; }).join('')}
        <span class="strip-today" style="left:${(ti / 28) * 100}%">6日</span></div>
        <div class="list">${D.researchDates.map((e) => `<div class="lrow" style="grid-template-columns:72px minmax(0,1fr) auto"><span class="num">${md(e.date)}</span><span>${esc(e.label)}</span><span class="small muted num">${D.daysLeft(e.date)} 天后</span></div>`).join('')}</div>`,
    });
  }
  VIEWS['/research'] = {
    title: '研究概览',
    render() {
      const counts = D.STAGES.map((_, i) => D.research.filter((r) => r.stage === i).length);
      const rows = researchSorted().filter((r) => S.resTab === '全部' || D.STAGES[r.stage] === S.resTab);
      const first = researchSorted()[0];
      return topRow('研究概览', `初稿截止最近：${esc(first.name)} · ${md(first.due)}（还剩 ${D.daysLeft(first.due)} 天） <button type="button" class="tlink" data-nav="#/research/writing">打开写作</button>`, NOTE.research) + `<div class="grid">
        ${block({ id: 'pipelines', cls: 'span-12', title: '研究项目', count: D.research.length,
          tools: `<button class="btn" type="button" data-action="new" data-type="research">${ic('plus')}新建研究项目</button>`,
          body: `<div class="kpis">${D.STAGES.map((s, i) => `<div class="kpi"><div class="kpi-label">${s}</div><div class="kpi-value num ${counts[i] ? '' : 'zero'}">${counts[i]}</div></div>`).join('')}</div>
            ${tabs('res-tab', S.resTab, [['全部', '全部', D.research.length], ...D.STAGES.map((s, i) => [s, s, counts[i]])], '按阶段筛选')}
            <div class="list">${rows.length ? rows.map((r) => pipeline(r, true)).join('') : `<div class="empty">还没有处于${esc(S.resTab)}阶段的项目。</div>`}</div>` })}
        ${block({ id: 'reading', cls: 'span-6 rv-half', title: '文献阅读', count: D.papers.length,
          tools: `<button type="button" class="card-link" data-nav="#/research/papers">查看全部</button>`,
          body: `<p class="small muted" style="margin:-6px 0 4px">本月 ${D.papers.length} 篇：待读 ${D.paperCounts().todo} · 在读 ${D.paperCounts().reading} · 已批注 ${D.paperCounts().annotated}</p><div class="list">${[...D.papers].sort((a, b) => b.added.localeCompare(a.added)).slice(0, 4).map((p) => paperRow(p, true)).join('')}</div>` })}
        ${block({ id: 'experiments', cls: 'span-6 rv-half', title: '实验记录', count: D.experiments.length,
          tools: `<button type="button" class="card-link" data-nav="#/research/experiments">查看全部</button>`,
          isEmpty: !D.experiments.length, empty: '还没有实验记录，记下今天的第一批',
          body: `<p class="small muted" style="margin:-6px 0 4px">运行中 ${D.experiments.filter((e) => e.status === '运行中').length} · 待处理 ${D.experiments.filter((e) => e.status === '数据待清洗').length}</p><div class="list">${D.experiments.slice(0, 4).map(expRow).join('')}</div>` })}
        ${writingCard('span-6 rv-half')}
        ${calendarCard('span-6 rv-half')}
      </div>`;
    },
  };
  VIEWS['/research/papers'] = {
    title: '文献阅读',
    render() {
      const c = D.paperCounts();
      const map = { 待读: 'todo', 在读: 'reading', 已批注: 'annotated' };
      const rows = D.papers.filter((p) => S.paperTab === '全部' || p.status === S.paperTab).sort(S.paperSort === 'added' ? (a, b) => b.added.localeCompare(a.added) : (a, b) => ['在读', '待读', '已批注'].indexOf(a.status) - ['在读', '待读', '已批注'].indexOf(b.status));
      return topRow('文献阅读', `本月已读 ${D.papersRead()} / ${D.papers.length} 篇，离「读完 8 篇论文」还差 ${D.papers.length - D.papersRead()} 篇。`, NOTE.research) + `<div class="grid">
        ${block({ id: 'papers', cls: 'span-12', title: '阅读清单', count: rows.length,
          tools: select('paper-sort', S.paperSort, [['added', '添加日期'], ['status', '状态']], '排序') + `<button class="btn" type="button" data-action="new" data-type="paper">${ic('plus')}添加文献</button>`,
          body: `${tabs('paper-tab', S.paperTab, [['全部', '全部', D.papers.length], ['待读', '待读', c.todo], ['在读', '在读', c.reading], ['已批注', '已批注', c.annotated]], '按状态筛选')}
            <div class="list">${rows.length ? rows.map((p) => paperRow(p, matchMedia('(max-width: 640px)').matches)).join('') : `<div class="empty">没有${esc(S.paperTab)}的文献。</div>`}</div>
            <p class="small muted" style="margin-top:8px">标题均为示例，非真实论文。<button type="button" class="tlink" data-nav="#/settings/integrations">在 Zotero 打开</button></p>` })}
      </div>`;
      void map;
    },
  };
  VIEWS['/research/experiments'] = {
    title: '实验记录',
    render() {
      return topRow('实验记录', `EXP-014 第 4 批运行中，第 4 批实验 ${md('2026-11-20')} 前完成。`, NOTE.research) + `<div class="grid">
        ${block({ id: 'experiments-all', cls: 'span-8', title: '全部实验', count: D.experiments.length,
          tools: `<button class="btn" type="button" data-action="new" data-type="experiment">${ic('plus')}记一条实验</button>`,
          isEmpty: !D.experiments.length, empty: '还没有实验记录，记下今天的第一批',
          body: `<div class="list">${D.experiments.map(expRow).join('')}</div>` })}
        ${block({ id: 'exp-summary', cls: 'span-4', title: '按项目', body: `<div class="list">${[...new Set(D.experiments.map((e) => e.project))].map((p) => `<div class="lrow" style="grid-template-columns:minmax(0,1fr) auto"><span>${esc(p)}</span><span class="r num">${D.experiments.filter((e) => e.project === p).length} 条</span></div>`).join('')}</div>` })}
      </div>`;
    },
  };
  VIEWS['/research/writing'] = {
    title: '论文写作',
    render() {
      const r = D.draft();
      return topRow('论文写作', `初稿还剩 ${C.fmt.int(D.manuscript.target - D.manuscript.words)} 字，${md(r.due)} 截止。`, NOTE.research) + `<div class="grid">
        ${writingCard('span-8', true)}
        ${block({ id: 'writing-dates', cls: 'span-4', title: '截止日期', body: `<div class="list">${D.researchDates.filter((d) => d.research === 'r1' || !d.research).map((e) => `<div class="lrow" style="grid-template-columns:minmax(0,1fr) auto"><span>${esc(e.label)}<span class="small muted" style="display:block">${md(e.date)} ${wd(e.date)}</span></span><span class="r small muted num">${D.daysLeft(e.date)} 天后</span></div>`).join('')}</div>` })}
      </div>`;
    },
  };
  VIEWS['/research/data'] = {
    title: '数据与代码',
    render() {
      return topRow('数据与代码', `${D.datasets.filter((d) => d.kind === '数据集').length} 个数据集，${D.datasets.filter((d) => d.kind === '代码仓库').length} 个代码仓库。`, NOTE.research) + `<div class="grid">
        ${block({ id: 'datasets', cls: 'span-12', title: '数据集与仓库', count: D.datasets.length,
          tools: `<button type="button" class="card-link" data-nav="#/settings/integrations">在 GitHub 打开</button>`,
          body: `<div class="table-wrap"><table class="stack"><thead><tr><th>标识</th><th>类型</th><th>项目</th><th class="r">大小</th><th class="r">更新</th></tr></thead><tbody>
            ${D.datasets.map((d) => `<tr><td class="mono">${esc(d.key)}</td><td class="m-line2">${esc(d.kind)}</td><td class="m-line2">${esc(d.project)}</td><td class="r num">${d.size === '—' ? '<span class="muted">—</span>' : esc(d.size)}</td><td class="r num m-line2">${md(d.updated)}</td></tr>`).join('')}</tbody></table></div>` })}
      </div>`;
    },
  };

  // ---------- 日历 ----------
  VIEWS['/calendar'] = {
    title: '日历',
    render() {
      const mon = addDays('2026-11-02', S.calWeek * 7), days = [...Array(7)].map((_, i) => addDays(mon, i));
      const evs = D.events.filter((e) => days.includes(e.date));
      return topRow('日历', `${md(days[0])}至${md(days[6])}，${evs.length} 项安排，其中科研 ${evs.filter((e) => e.research).length} 项。`, NOTE.calendar) + `<div class="grid">
        ${block({ id: 'week', cls: 'span-12', title: `${md(days[0])} 至 ${md(days[6])}`,
          tools: `<button class="icon-btn bare" type="button" data-action="cal-week" data-value="-1" aria-label="上一周" ${S.calWeek <= -1 ? 'disabled' : ''}>${ic('chevl')}</button><button class="btn" type="button" data-action="cal-week" data-value="0" ${S.calWeek === 0 ? 'disabled' : ''}>本周</button><button class="icon-btn bare" type="button" data-action="cal-week" data-value="1" aria-label="下一周" ${S.calWeek >= 2 ? 'disabled' : ''}>${ic('chevr')}</button>`,
          body: `<div class="week" id="week-grid">${days.map((d) => { const w = new Date(d + 'T00:00:00').getDay(); const list = evs.filter((e) => e.date === d); return `<div class="col ${w === 0 || w === 6 ? 'we' : ''} ${d === D.SAMPLE_TODAY ? 'today' : ''} ${list.length ? '' : 'hidden-m'}"><div class="dh">${wd(d)} ${md(d)}${d === D.SAMPLE_TODAY ? ' · 今天（示例）' : ''}</div>${list.map((e) => `<div class="ev ${e.research ? 'res' : ''}"><span class="t">${e.time}</span><br>${esc(e.label)}</div>`).join('') || '<span class="small muted">—</span>'}</div>`; }).join('')}</div>` })}
      </div>`;
    },
  };

  // ---------- 我的任务 ----------
  // one task row, shared by 我的任务, 公司待办 and a lead's task list
  const taskMeta = (t) => [t.areaLabel, t.projectId ? projectName(t.projectId) || '已删除的项目' : '', t.source?.type === 'lead' ? '来自选品线索' : ''].filter(Boolean).map(esc).join(' · ');
  const taskLine = (t) => { const d = dueText(t.due); return `<div class="lrow task-line" data-key="${t.id}">
        <button class="check" type="button" role="checkbox" aria-checked="${t.state === '已完成'}" data-action="task-done" data-id="${t.id}" aria-label="完成「${esc(t.title)}」" ${t.state === '归档' ? 'disabled' : ''}>${ic('check')}</button>
        <span class="ellipsis">${esc(t.title)}<span class="small muted" style="display:block">${taskMeta(t)}</span></span>
        <span class="r due ${d.soon && isOpen(t) ? 'soon' : ''}">${t.state === '已完成' ? (t.due ? md(t.due) : '已完成') : d.t}</span>
        <button class="icon-btn bare" type="button" data-action="task-menu" data-id="${t.id}" aria-label="「${esc(t.title)}」操作" aria-haspopup="menu">${ic('more')}</button></div>`; };
  const sortTasks = (rows, by) => rows.sort(by === 'created' ? (a, b) => b.createdAt.localeCompare(a.createdAt) : (a, b) => (a.due || '9999').localeCompare(b.due || '9999') || b.createdAt.localeCompare(a.createdAt));
  const AREA_TABS = [['all', '全部'], ...Object.entries(A.AREA)];
  // the filter lives in the address (#/tasks?area=company&project=pj_01), so it can be opened directly
  function syncTaskUrl() {
    const q = new URLSearchParams();
    if (S.taskTab === '项目') q.set('view', 'projects'); else if (S.taskTab === '归档') q.set('view', 'archive');
    if (S.taskArea !== 'all') q.set('area', S.taskArea);
    if (S.taskArea === 'company' && S.taskProject) q.set('project', S.taskProject);
    const h = '#/tasks' + (q.toString() ? '?' + q : '');
    if (location.hash !== h) { history.replaceState(null, '', h); lastHash = location.hash; }
  }
  VIEWS['/tasks'] = {
    title: '我的任务',
    keys: () => ['tasks', 'companyProjects'],
    enter(q) {
      const v = q.get('view'); if (v === 'archive') S.taskTab = '归档'; else if (v === 'projects') S.taskTab = '项目'; else if (S.taskTab === '项目' || S.taskTab === '归档') S.taskTab = '进行中';
      const area = q.get('area'); S.taskArea = A.AREA[area] ? area : 'all';
      S.taskProject = S.taskArea === 'company' ? q.get('project') || '' : '';
    },
    render() {
      const states = ['进行中', '待开始', '已完成', '归档'];
      const inArea = tasksAll().filter((t) => (S.taskArea === 'all' || t.area === S.taskArea) && (!S.taskProject || (S.taskProject === 'none' ? !t.projectId : t.projectId === S.taskProject)));
      const n = (st) => inArea.filter((t) => t.state === st).length;
      const isProj = S.taskTab === '项目';
      const rows = sortTasks(inArea.filter((t) => t.state === S.taskTab), S.taskSort);
      const t0 = today(), sunday = A.sundayOf(t0);
      const open = tasksAll().filter(isOpen);
      const dueNow = open.filter((t) => t.due && t.due <= t0);
      const thisWeek = open.filter((t) => t.due && t.due > t0 && t.due <= sunday);
      const projLine = (p) => `<div class="lrow" data-key="${p.id}" style="grid-template-columns:minmax(0,1fr) auto 64px 28px"><span class="ellipsis">${esc(p.name)}<span class="small muted" style="display:block">截止 ${md(p.due)}</span></span>${pill(p.status)}<span class="r num small muted">${p.done}/${p.steps} 步</span>${ring28(p.done, p.steps, true)}</div>`;
      const areaName = S.taskArea === 'all' ? '' : A.AREA[S.taskArea];
      const filters = `<div class="filter-row">${seg('task-area', S.taskArea, AREA_TABS, '归属')}${S.taskArea === 'company'
        ? select('task-project', S.taskProject, [['', '全部公司项目'], ['none', '未归入项目'], ...companyProjects().map((p) => [p.id, p.name])], '公司项目') : ''}</div>`;
      const ready = R.tasks?.status === 'ready';
      const finding = ready ? `${areaName ? `${areaName}：` : ''}进行中 ${n('进行中')} 项，待开始 ${n('待开始')} 项，已完成 ${n('已完成')} 项。` : '';
      return topRow('我的任务', finding, isProj ? '示例数据：「项目」分组里的项目为演示内容；任务是你的真实记录。' : '') + `<div class="grid">
        ${block({ id: 'tasklist', cls: 'span-8', title: isProj ? '全部项目' : `${areaName ? areaName + ' · ' : ''}${S.taskTab}`, keys: isProj ? null : ['tasks'], sample: isProj,
          count: () => (isProj ? D.projects.length : rows.length),
          tools: () => (isProj ? '' : select('task-sort', S.taskSort, [['due', '截止日期'], ['created', '创建时间']], '排序')) + `<button class="btn" type="button" data-action="new" data-type="${isProj ? 'project' : 'task'}">${ic('plus')}${isProj ? '新建项目' : '添加任务'}</button>`,
          body: () => `${isProj ? '' : filters}${tabs('task-tab', S.taskTab, [...states.map((st) => [st, st, n(st)]), ['项目', '项目', D.projects.length]], '任务分组')}
            <div class="list">${isProj ? D.projects.map(projLine).join('') : rows.length ? rows.map(taskLine).join('') : `<div class="empty">${tasksAll().length ? `这里没有${esc(areaName)}${esc(S.taskTab)}的任务。` : '还没有任务，从这里开始记录。'}<button class="tlink" type="button" data-action="new" data-type="task">添加一个</button></div>`}</div>` })}
        ${block({ id: 'today', cls: 'span-4', title: '今天到期', keys: ['tasks'], count: () => dueNow.length,
          body: () => `<div class="list">${dueNow.length ? dueNow.map((t) => `<div class="lrow" style="grid-template-columns:minmax(0,1fr) auto"><span>${esc(t.title)}<span class="small muted" style="display:block">${taskMeta(t)}</span></span><span class="r due soon small">${dueText(t.due).t}</span></div>`).join('') : '<div class="empty">今天没有到期的任务。</div>'}</div>
            <p class="small muted" style="margin-top:12px">本周日（${md(sunday)}）前还有 ${thisWeek.length} 项到期。</p>` })}
      </div>`;
    },
  };

  // ---------- 统计 ----------
  VIEWS['/stats'] = {
    title: '统计',
    render() {
      const key = S.statsMetric, vals = D.monthly[key];
      const unit = key === 'tasks' ? '项' : 'h';
      const label = { research: '科研工时', work: '工作工时', tasks: '完成任务' }[key];
      return topRow('统计', `6月至11月，科研共 ${C.fmt.int(D.monthly.research.reduce((a, b) => a + b, 0))} h，工作共 ${C.fmt.int(D.monthly.work.reduce((a, b) => a + b, 0))} h。11月只含 1 至 6 日。`, NOTE.stats) + `<div class="grid">
        ${block({ id: 'stats-chart', cls: 'span-8', title: label,
          tools: seg('stats-metric', key, [['research', '科研工时'], ['work', '工作工时'], ['tasks', '完成任务']], '指标'),
          body: `<div class="chart" id="stats-chart"></div>` })}
        ${block({ id: 'stats-table', cls: 'span-4', title: '月度合计',
          body: `<div class="table-wrap"><table><thead><tr><th>月份</th><th class="r">科研</th><th class="r">工作</th><th class="r">任务</th></tr></thead><tbody>${D.months.map((m, i) => `<tr><td>${m}${i === 5 ? '<span class="small muted">（1至6日）</span>' : ''}</td><td class="r num">${D.monthly.research[i]} h</td><td class="r num">${D.monthly.work[i]} h</td><td class="r num">${D.monthly.tasks[i]}</td></tr>`).join('')}</tbody></table></div>` })}
      </div>`;
      void vals; void unit;
    },
    mount() {
      const el = $('#stats-chart'); if (!el) return;
      const key = S.statsMetric, unit = key === 'tasks' ? ' 项' : ' h';
      C.bars(el, { labels: D.months, values: D.monthly[key], height: 220, format: (v) => `${v}${unit}`, colour: cssv(key === 'research' ? '--chart-3' : '--chart-1'),
        annotations: [{ at: 5, label: '11月只含 6 天', short: '6 天' }] });
    },
  };

  // ---------- 文档 ----------
  VIEWS['/docs'] = {
    title: '文档',
    render() {
      const folders = ['全部', '科研', '个人', '归档'];
      const rows = D.docs.filter((d) => S.docFolder === '全部' || d.folder === S.docFolder).sort((a, b) => b.edited.localeCompare(a.edited));
      const list = S.docView === 'list'
        ? `<div class="table-wrap"><table class="stack"><thead><tr><th>名称</th><th>文件夹</th><th class="r">修改</th><th class="r">大小</th></tr></thead><tbody>${rows.map((d) => `<tr data-key="${d.id}"><td><span class="ellipsis" style="display:block">${esc(d.name)}</span></td><td class="m-line2">${esc(d.folder)}</td><td class="r num m-line2">${md(d.edited)}</td><td class="r num">${esc(d.size)}</td></tr>`).join('')}</tbody></table></div>`
        : `<div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(200px,1fr))">${rows.map((d) => `<div class="tile" data-key="${d.id}" style="border:1px solid var(--border);align-content:space-between;min-height:112px">${ic('doc', 'ticon')}<span class="ellipsis">${esc(d.name)}</span><span class="l num">${esc(d.folder)} · ${md(d.edited)} · ${esc(d.size)}</span></div>`).join('')}</div>`;
      return topRow('文档', `${D.docs.length} 个文件，科研 ${D.docs.filter((d) => d.folder === '科研').length} 个，最近修改 ${md(rows[0]?.edited || D.SAMPLE_TODAY)}。`, NOTE.docs) + `<div class="grid">
        ${block({ id: 'docs', cls: 'span-12', title: S.docFolder === '全部' ? '全部文件' : S.docFolder, count: rows.length,
          tools: seg('doc-view', S.docView, [['grid', '网格', 'grid'], ['list', '列表', 'list']], '视图') + `<button class="btn" type="button" data-action="upload">上传文档</button>`,
          body: `${tabs('doc-folder', S.docFolder, folders.map((f) => [f, f, f === '全部' ? D.docs.length : D.docs.filter((d) => d.folder === f).length]), '文件夹')}${rows.length ? list : '<div class="empty">这个文件夹还是空的。</div>'}` })}
      </div>`;
    },
  };

  // ---------- 设置 ----------
  VIEWS['/settings'] = {
    title: '设置',
    render() {
      return topRow('设置', `月度计划 工作 ${D.plan.work} h，科研 ${D.plan.research} h，个人 ${D.plan.personal} h。`, NOTE.settings) + `<div class="settings">
        <div class="set-sec"><div><h2>月度计划</h2><p>本月进度的三个环按这里的小时数计算。当前：工作 ${pct(D.month().work, D.plan.work)}%，科研 ${pct(D.month().research, D.plan.research)}%，个人 ${pct(D.month().personal, D.plan.personal)}%。</p></div>
          <form class="set-panel" data-form="plan"><div class="fields3">${[['work', '工作'], ['research', '科研'], ['personal', '个人']].map(([k, l]) => `<div class="field"><label for="f-${k}">${l}（h）</label><input class="input num" id="f-${k}" name="${k}" type="number" inputmode="numeric" min="1" max="400" value="${D.plan[k]}" required></div>`).join('')}</div>
          <div class="actions"><span class="small muted" data-saved></span><button class="btn primary" type="submit">保存</button></div></form></div>
        <div class="set-sec"><div><h2>集成</h2><p>Zotero、Notion 与 GitHub 尚未连接。</p></div>
          <div class="set-panel"><button type="button" class="card-link" data-nav="#/settings/integrations">管理集成</button></div></div>
      </div>`;
    },
  };
  VIEWS['/settings/integrations'] = {
    title: '集成',
    render() {
      return topRow('集成', '3 个工具，均未连接。连接后，文献和仓库会出现在科研视图里。') + `<div class="settings">
        <div class="set-sec"><div><h2>已列出的工具</h2><p>连接功能尚未开放，这里只显示计划接入的工具。</p></div>
          <div class="set-panel">${[['Zotero', '同步文献库与批注'], ['Notion', '同步笔记与写作大纲'], ['GitHub', '同步实验代码仓库']].map(([n, d]) => `<div class="int-row">${ic('plug')}<span class="grow"><b style="font-weight:500">${n}</b><span class="small muted" style="display:block">${d}</span></span><span class="pill">未连接</span><button class="btn" type="button" data-action="connect" data-name="${n}">连接</button></div>`).join('')}</div></div>
      </div>`;
    },
  };

  // ======================= 生活 =======================
  const dateInput = (id, value, { max = today(), required = true, label = '日期' } = {}) => `<input class="input num" type="date" id="${id}" name="date" value="${esc(value)}" ${max ? `max="${max}"` : ''} ${required ? 'required' : ''} aria-label="${esc(label)}" data-keep>`;
  // a weekly trend: one line, the latest week labelled with its value so a single record is visible too
  function weeklyLine(el, rows, { value, format, pad }) {
    const vals = rows.map(value), have = vals.filter((v) => v != null);
    if (!el || !have.length) return;
    const lo = Math.min(...have), hi = Math.max(...have), last = vals.map((v, i) => (v == null ? -1 : i)).filter((i) => i >= 0).at(-1);
    C.line(el, {
      labels: rows.map((r) => `${+r.weekStart.slice(5, 7)}/${+r.weekStart.slice(8, 10)}`),
      series: [{ name: el.dataset.name, values: vals, colour: cssv('--chart-1') }],
      format, min: Math.max(0, Math.floor(lo - pad)), max: Math.ceil(hi + pad), height: 160,
      annotations: [{ at: last, label: format(vals[last]) }],
    });
  }
  const weekNote = (rows, value, format) => {
    const cur = rows.at(-1), prev = rows.at(-2);
    return `<p class="small muted week-note">本周（${md(cur.weekStart)} 起）${value(cur) == null ? '还没有记录' : `均值 <b class="num">${format(value(cur))}</b>，${cur.count} 条`}${prev ? `；上周${value(prev) == null ? '没有记录' : ` ${format(value(prev))}`}` : ''}。</p>`;
  };
  const histActions = (kind, key, label) => `<span class="row-actions"><button class="tlink" type="button" data-action="${kind}-edit" data-id="${esc(key)}" aria-label="更正${esc(label)}">更正</button><button class="tlink danger" type="button" data-action="${kind}-del" data-id="${esc(key)}" aria-label="删除${esc(label)}">删除</button></span>`;
  const kgFmt = (v) => `${C.fmt.dec(1)(v)} kg`;
  const hFmt = (v) => `${C.fmt.dec(1)(v)} h`;

  VIEWS['/life/health'] = {
    title: '健康记录',
    keys: () => ['weights', 'weightWeekly', 'sleep', 'sleepWeekly'],
    render() {
      const ws = data('weights') || [], ss = data('sleep') || [], t = today();
      const last = ws[0], lastS = ss[0];
      const finding = R.weights?.status === 'ready' && R.sleep?.status === 'ready'
        ? (last || lastS ? `${last ? `最近体重 ${kgFmt(last.kg)}（${md(last.date)}）` : '还没有体重记录'}，${lastS ? `最近睡眠 ${dur(lastS.minutes)}（${md(lastS.date)}）` : '还没有睡眠记录'}。` : '还没有记录。日期默认今天，也可以选过去的日期补记。') : '';
      return topRow('健康记录', finding) + `<div class="grid">
        ${block({ id: 'weight', cls: 'span-6', title: '体重', keys: ['weightWeekly'],
          tools: `<span class="small muted">近 8 周</span>`,
          body: () => { const wk = data('weightWeekly'); return `<form class="entry" data-entry="weight" novalidate>
              <div class="field"><label for="e-w-date">日期</label>${dateInput('e-w-date', t)}</div>
              <div class="field"><label for="e-w-kg">体重（kg）</label><input class="input num" id="e-w-kg" name="kg" type="number" inputmode="decimal" step="0.1" min="20" max="300" placeholder="68.4" required data-keep></div>
              <button class="btn primary" type="submit">记录</button></form>
            ${wk.some((r) => r.avgKg != null) ? `<div class="chart" id="weight-chart" data-name="体重周均值"></div>${weekNote(wk, (r) => r.avgKg, kgFmt)}` : '<div class="empty">记下第一条体重后，这里显示每周均值的趋势。</div>'}`; } })}
        ${block({ id: 'sleep', cls: 'span-6', title: '睡眠', keys: ['sleepWeekly'],
          tools: `<span class="small muted">近 8 周</span>`,
          body: () => { const wk = data('sleepWeekly'); return `<form class="entry" data-entry="sleep" novalidate>
              <div class="field"><label for="e-s-date">日期</label>${dateInput('e-s-date', t)}</div>
              <div class="field"><label for="e-s-h">小时</label><input class="input num" id="e-s-h" name="h" type="number" inputmode="numeric" min="0" max="24" step="1" placeholder="7" required data-keep></div>
              <div class="field"><label for="e-s-m">分钟</label><input class="input num" id="e-s-m" name="m" type="number" inputmode="numeric" min="0" max="59" step="1" placeholder="30" data-keep></div>
              <button class="btn primary" type="submit">记录</button></form>
            ${wk.some((r) => r.avgMinutes != null) ? `<div class="chart" id="sleep-chart" data-name="睡眠周均值"></div>${weekNote(wk, (r) => (r.avgMinutes == null ? null : r.avgMinutes / 60), hFmt)}` : '<div class="empty">记下第一晚睡眠后，这里显示每周均值的趋势。</div>'}`; } })}
        ${block({ id: 'weight-history', cls: 'span-6', title: '体重记录', keys: ['weights'], count: () => ws.length,
          isEmpty: () => !ws.length, empty: '还没有体重记录。',
          body: () => `<div class="list">${ws.map((w) => `<div class="lrow hist" data-key="w-${w.date}"><span class="num">${md(w.date)} <span class="small muted">${wd(w.date)}</span></span><span class="ellipsis"><b class="num">${kgFmt(w.kg)}</b>${w.note ? ` <span class="small muted">${esc(w.note)}</span>` : ''}</span>${histActions('weight', w.date, `${md(w.date)} 的体重`)}</div>`).join('')}</div>` })}
        ${block({ id: 'sleep-history', cls: 'span-6', title: '睡眠记录', keys: ['sleep'], count: () => ss.length,
          isEmpty: () => !ss.length, empty: '还没有睡眠记录。',
          body: () => `<div class="list">${ss.map((w) => `<div class="lrow hist" data-key="s-${w.date}"><span class="num">${md(w.date)} <span class="small muted">${wd(w.date)}</span></span><span class="ellipsis"><b class="num">${dur(w.minutes)}</b>${w.note ? ` <span class="small muted">${esc(w.note)}</span>` : ''}</span>${histActions('sleep', w.date, `${md(w.date)} 的睡眠`)}</div>`).join('')}</div>` })}
      </div>`;
    },
    mount() {
      if (data('weightWeekly')) weeklyLine($('#weight-chart'), data('weightWeekly'), { value: (r) => r.avgKg, format: kgFmt, pad: 1 });
      if (data('sleepWeekly')) weeklyLine($('#sleep-chart'), data('sleepWeekly'), { value: (r) => (r.avgMinutes == null ? null : r.avgMinutes / 60), format: hFmt, pad: 1 });
    },
  };

  VIEWS['/life/training'] = {
    title: '训练记录',
    keys: () => ['plan', 'cycle', 'sessions'],
    render() {
      const plan = data('plan'), sessions = data('sessions') || [];
      const finding = plan ? (plan.next ? `下次练${esc(plan.next.part)}（${A.REASON[plan.next.reason]}）${plan.lastWorkout ? `，上次 ${md(plan.lastWorkout.date)} 练了${esc(plan.lastWorkout.part)}` : ''}。` : '先设置部位循环，就会按顺序排出下一次。') : '';
      return topRow('训练记录', finding) + `<div class="grid">
        ${block({ id: 'plan', cls: 'span-6', inverse: true, title: '训练计划', keys: ['plan'],
          body: () => {
            const nx = plan.next, lw = plan.lastWorkout;
            return `<div class="plan-figs">
                <div class="plan-fig"><span class="l">上次实际训练</span><span class="v">${lw ? esc(lw.part) : '—'}</span><span class="l">${lw ? `${md(lw.date)} ${wd(lw.date)}` : '还没有训练记录'}</span></div>
                <span class="vrule" aria-hidden="true"></span>
                <div class="plan-fig"><span class="l">下次计划</span><span class="v">${nx ? esc(nx.part) : '—'}</span><span class="l">${nx ? `<span class="reason">${A.REASON[nx.reason]}</span>` : '循环为空'}</span></div>
              </div>
              <div class="plan-actions">
                <button class="btn primary light" type="button" data-action="new" data-type="training">${ic('check')}完成训练</button>
                <button class="btn" type="button" data-action="train-rest">休息或顺延</button>
                <button class="btn" type="button" data-action="new" data-type="nextPart">手动指定下一次</button>
                ${nx?.reason === 'manual' ? '<button class="btn" type="button" data-action="train-unset">取消指定</button>' : ''}
              </div>
              <p class="small muted">休息或顺延不改变计划；练了循环外的部位，计划也不变，可以手动指定下一次。</p>`;
          } })}
        ${block({ id: 'cycle', cls: 'span-6', title: '部位循环', keys: ['cycle'],
          tools: () => (S.cycleDraft ? '' : `<button class="btn" type="button" data-action="cycle-edit">${ic('edit')}编辑顺序</button>`),
          body: () => {
            const parts = data('cycle').parts;
            if (S.cycleDraft) {
              const d = S.cycleDraft;
              return `<ol class="cycle-list editing">${d.map((p, i) => `<li><span class="num idx">${i + 1}</span><span class="grow">${esc(p)}</span>
                  <button class="icon-btn bare" type="button" data-action="cycle-up" data-id="${i}" aria-label="上移「${esc(p)}」" ${i === 0 ? 'disabled' : ''}>${ic('chevu')}</button>
                  <button class="icon-btn bare" type="button" data-action="cycle-down" data-id="${i}" aria-label="下移「${esc(p)}」" ${i === d.length - 1 ? 'disabled' : ''}>${ic('chevd')}</button>
                  <button class="icon-btn bare" type="button" data-action="cycle-del" data-id="${i}" aria-label="移除「${esc(p)}」">${ic('x')}</button></li>`).join('') || '<li class="small muted">还没有部位，先加一个。</li>'}</ol>
                <form class="entry" data-entry="cycle-add" novalidate><div class="field"><label for="e-part">新部位</label><input class="input" id="e-part" name="part" maxlength="30" placeholder="例如 胸" ${d.length >= 12 ? 'disabled' : ''}></div><button class="btn" type="submit" ${d.length >= 12 ? 'disabled' : ''}>加入</button></form>
                <div class="actions-row"><span class="small muted">最多 12 个，不能重复。</span><button class="btn" type="button" data-action="cycle-cancel">取消</button><button class="btn primary" type="button" data-action="cycle-save" ${d.length ? '' : 'disabled'}>保存顺序</button></div>`;
            }
            return parts.length ? `<ol class="cycle-list">${parts.map((p, i) => `<li class="${plan?.next?.part === p ? 'next' : ''}"><span class="num idx">${i + 1}</span><span class="grow">${esc(p)}</span>${plan?.next?.part === p ? '<span class="pill pos">下次</span>' : ''}</li>`).join('')}</ol>`
              : `<div class="empty">还没有设置循环。<button class="tlink" type="button" data-action="cycle-edit">设置常用的训练顺序</button></div>`;
          } })}
        ${block({ id: 'sessions', cls: 'span-12', title: '训练历史', keys: ['sessions'], count: () => sessions.length,
          isEmpty: () => !sessions.length, empty: '还没有训练或休息记录。完成第一次训练后，这里会按日期列出。',
          body: () => `<div class="list">${sessions.map((x) => `<div class="lrow hist session" data-key="${x.id}"><span class="num">${md(x.date)} <span class="small muted">${wd(x.date)}</span></span>
              <span class="ellipsis">${x.kind === 'workout' ? `<b>${esc(x.part)}</b>${(data('cycle')?.parts || []).includes(x.part) ? '' : ' <span class="pill">循环外</span>'}` : '<span class="pill">休息或顺延</span>'}${x.note ? ` <span class="small muted">${esc(x.note)}</span>` : ''}</span>
              ${histActions('session', x.id, `${md(x.date)} 的记录`)}</div>`).join('')}</div>` })}
      </div>`;
    },
  };

  // ======================= 个人公司 =======================
  const leadTasksOpen = (id) => tasksAll().filter((t) => t.source?.type === 'lead' && t.source.id === id && isOpen(t));
  VIEWS['/company/finance'] = {
    title: '财务报表',
    keys: () => [`sum:${S.finMonth}`, `tx:${S.finMonth}`, `monthly:${S.finMonth}`, 'companyProjects'],
    render() {
      const m = S.finMonth, sum = data(`sum:${m}`), txs = data(`tx:${m}`) || [];
      const isNow = m === A.month();
      const switcher = `<div class="month-switch"><button class="icon-btn bare" type="button" data-action="fin-month" data-value="-1" aria-label="上个月">${ic('chevl')}</button><span class="num" aria-live="polite">${monthLabel(m)}</span><button class="icon-btn bare" type="button" data-action="fin-month" data-value="1" aria-label="下个月" ${isNow ? 'disabled' : ''}>${ic('chevr')}</button>${isNow ? '' : '<button class="btn" type="button" data-action="fin-month" data-value="0">本月</button>'}</div>`;
      const finding = sum ? `${monthLabel(m)}：收入 ${money(sum.incomeCents)}，支出 ${money(sum.expenseCents)}，结余 ${money(sum.balanceCents)}，共 ${sum.count} 笔。` : '';
      return topRow('财务报表', finding) + `<div class="grid">
        ${block({ id: 'fin-sum', cls: 'span-4', inverse: true, title: '月度汇总', keys: [`sum:${m}`], tools: switcher,
          body: () => `<div class="money-figs">
              <div class="mf"><span class="l">收入</span><span class="v num">${money(sum.incomeCents)}</span></div>
              <div class="mf"><span class="l">支出</span><span class="v num">${money(sum.expenseCents)}</span></div>
              <div class="mf total"><span class="l">结余</span><span class="v num ${sum.balanceCents < 0 ? 'neg' : ''}">${money(sum.balanceCents)}</span></div></div>
            <p class="small muted">${sum.count ? `本月 ${sum.count} 笔明细` : '这个月还没有收支记录'}</p>` })}
        ${block({ id: 'fin-trend', cls: 'span-8', title: '近 6 个月', keys: [`monthly:${m}`],
          tools: `<span class="legend-line"><span><i style="background:var(--chart-1)"></i>收入</span><span><i style="background:var(--chart-muted)"></i>支出</span></span>`,
          isEmpty: () => !data(`monthly:${m}`).some((r) => r.count), empty: '近 6 个月还没有收支记录，记下第一笔后这里显示趋势。',
          body: '<div class="chart" id="fin-chart"></div>' })}
        ${block({ id: 'fin-tx', cls: 'span-8', title: `${monthLabel(m)}明细`, keys: [`tx:${m}`, 'companyProjects'], count: () => txs.length,
          tools: `<button class="btn" type="button" data-action="new" data-type="transaction">${ic('plus')}记一笔</button>`,
          isEmpty: () => !txs.length, empty: `${monthLabel(m)}还没有明细。<button class="tlink" type="button" data-action="new" data-type="transaction">记一笔</button>`,
          body: () => `<div class="list">${txs.map((x) => `<div class="lrow tx" data-key="${x.id}"><span class="num">${md(x.date)}</span>
              <span class="ellipsis">${esc(x.category)}<span class="small muted" style="display:block">${[x.type === 'income' ? '收入' : '支出', x.projectId ? projectName(x.projectId) : '', x.note].filter(Boolean).map(esc).join(' · ')}</span></span>
              <span class="r num amt ${x.type}">${x.type === 'income' ? '+' : '−'}${money(x.amountCents)}</span>
              ${histActions('tx', x.id, `${md(x.date)} ${x.category}`)}</div>`).join('')}</div>` })}
        ${block({ id: 'fin-cat', cls: 'span-4', title: '分类汇总', keys: [`sum:${m}`],
          isEmpty: () => !sum.byCategory.length, empty: '还没有分类。',
          body: () => ['income', 'expense'].map((type) => { const rows = sum.byCategory.filter((c) => c.type === type); return rows.length ? `<h3 class="sub-h">${type === 'income' ? '收入' : '支出'}</h3><div class="list">${rows.map((c) => `<div class="lrow" style="grid-template-columns:minmax(0,1fr) auto"><span class="ellipsis">${esc(c.category)} <span class="small muted">${c.count} 笔</span></span><span class="r num">${money(c.amountCents)}</span></div>`).join('')}</div>` : ''; }).join('') })}
      </div>`;
    },
    mount() {
      const rows = data(`monthly:${S.finMonth}`), el = $('#fin-chart');
      if (!rows || !el) return;
      C.diverging(el, { labels: rows.map((r) => `${+r.month.slice(5, 7)}月`), up: rows.map((r) => A.yuan(r.incomeCents)), down: rows.map((r) => A.yuan(r.expenseCents)),
        above: '收入', below: '支出', format: (v) => cny.format(v), tickFormat: (v) => `¥${C.fmt.int(v)}`, height: 200 });
    },
  };

  const LEAD_TABS = [['all', '全部'], ...Object.entries(A.LEAD_STATUS)];
  const signalChip = (label, s) => `<span class="signal lv-${s.level}"><b>${label}</b> ${A.LEVEL[s.level]}${s.note ? `<span class="small muted"> · ${esc(s.note)}</span>` : ''}</span>`;
  function leadCard(l) {
    const url = A.safeUrl(l.sourceUrl), src = l.sourceName || (url ? new URL(url).host : '');
    const source = url ? `<a class="tlink src" href="${esc(url)}" target="_blank" rel="noopener noreferrer">${ic('link')}${esc(src)}</a>` : src ? `<span class="small muted">${esc(src)}</span>` : '<span class="small muted">没有来源</span>';
    return `<article class="lead" data-key="${l.id}">
      <header><h3>${esc(l.product)}</h3><span class="pill ${l.status === 'adopted' ? 'pos' : l.status === 'validating' ? 'warn' : ''}">${A.LEAD_STATUS[l.status]}</span></header>
      <p class="lead-src">${source}<span class="small muted num">观察于 ${md(l.observedOn)}</span></p>
      <div class="signals">${signalChip('浏览', l.signals.views)}${signalChip('搜索', l.signals.searches)}${signalChip('成交', l.signals.sales)}</div>
      <dl class="kv lead-kv"><dt>待验证</dt><dd>${esc(l.questions) || '—'}</dd><dt>下一步</dt><dd>${esc(l.nextStep) || '—'}</dd></dl>
      <footer>
        <button class="tlink" type="button" data-action="lead-tasks" data-id="${l.id}">${l.openTaskCount ? `${l.openTaskCount} 个未完成待办` : '查看待办'}</button>
        <span class="grow"></span>
        <button class="btn" type="button" data-action="lead-edit" data-id="${l.id}">${ic('edit')}编辑</button>
        <button class="btn primary" type="button" data-action="lead-task" data-id="${l.id}">${ic('plus')}转成待办</button>
      </footer></article>`;
  }
  VIEWS['/company/leads'] = {
    title: '选品观察',
    keys: () => ['leads'],
    render() {
      const all = data('leads') || [];
      const rows = all.filter((l) => S.leadTab === 'all' || l.status === S.leadTab);
      const open = all.reduce((s, l) => s + l.openTaskCount, 0);
      const finding = R.leads?.status === 'ready' ? (all.length ? `${all.length} 条线索，验证中 ${all.filter((l) => l.status === 'validating').length} 条，未完成待办 ${open} 项。` : '人工维护的候选清单：记下产品、来源和信号，再把验证行动转成待办。') : '';
      return topRow('选品观察', finding) + `<div class="grid">
        ${block({ id: 'leads', cls: 'span-12', title: '候选清单', keys: ['leads'], count: () => rows.length,
          tools: `<button class="btn" type="button" data-action="new" data-type="lead">${ic('plus')}新增线索</button>`,
          body: () => `${tabs('lead-tab', S.leadTab, LEAD_TABS.map(([v, l]) => [v, l, v === 'all' ? all.length : all.filter((x) => x.status === v).length]), '按状态筛选')}
            ${rows.length ? `<div class="lead-grid">${rows.map(leadCard).join('')}</div>` : `<div class="empty">${all.length ? `没有${esc(A.LEAD_STATUS[S.leadTab])}的线索。` : '还没有线索。'}<button class="tlink" type="button" data-action="new" data-type="lead">新增一条</button></div>`}` })}
      </div>`;
    },
  };

  VIEWS['/company/tasks'] = {
    title: '公司待办',
    keys: () => ['tasks', 'companyProjects'],
    render() {
      const co = tasksAll().filter((t) => t.area === 'company');
      const inProj = co.filter((t) => !S.coProject || (S.coProject === 'none' ? !t.projectId : t.projectId === S.coProject));
      const states = ['进行中', '待开始', '已完成', '归档'];
      const rows = sortTasks(inProj.filter((t) => S.coTab === '全部' || (S.coTab === '未完成' ? isOpen(t) : t.state === S.coTab)), 'due');
      const projs = companyProjects();
      const ready = R.tasks?.status === 'ready';
      return topRow('公司待办', ready ? `公司待办 ${co.filter(isOpen).length} 项未完成，${projs.length} 个公司项目。在「我的任务」里选「公司」看到的是同一批任务。` : '') + `<div class="grid">
        ${block({ id: 'co-tasks', cls: 'span-8', title: S.coProject ? (S.coProject === 'none' ? '未归入项目' : projectName(S.coProject) || '公司待办') : '全部公司待办', keys: ['tasks', 'companyProjects'], count: () => rows.length,
          tools: () => select('co-project', S.coProject, [['', '全部项目'], ['none', '未归入项目'], ...projs.map((p) => [p.id, p.name])], '公司项目') + `<button class="btn" type="button" data-action="new" data-type="task" data-area="company" data-project="${esc(S.coProject === 'none' ? '' : S.coProject)}">${ic('plus')}添加待办</button>`,
          body: () => `${tabs('co-tab', S.coTab, [['未完成', '未完成', inProj.filter(isOpen).length], ...states.map((st) => [st, st, inProj.filter((t) => t.state === st).length]), ['全部', '全部', inProj.length]], '按状态筛选')}
            <div class="list">${rows.length ? rows.map(taskLine).join('') : `<div class="empty">${co.length ? '这里没有符合条件的待办。' : '还没有公司待办。可以在这里添加，或在「选品观察」里把验证行动转成待办。'}</div>`}</div>` })}
        ${block({ id: 'co-projects', cls: 'span-4', title: '公司项目', keys: ['companyProjects', 'tasks'], count: () => projs.length,
          tools: `<button class="btn" type="button" data-action="new" data-type="companyProject">${ic('plus')}新建项目</button>`,
          isEmpty: () => !projs.length, empty: '还没有公司项目。<button class="tlink" type="button" data-action="new" data-type="companyProject">新建一个</button>',
          body: () => `<div class="list">${projs.map((p) => { const n = co.filter((t) => t.projectId === p.id && isOpen(t)).length; return `<button type="button" class="lrow click" data-action="co-pick" data-id="${p.id}" aria-pressed="${S.coProject === p.id}" style="grid-template-columns:minmax(0,1fr) auto"><span class="ellipsis">${esc(p.name)}<span class="small muted" style="display:block">${A.PROJECT_STATUS[p.status]}${p.due ? ` · 截止 ${md(p.due)}` : ''}</span></span><span class="r small muted num">${n} 项未完成</span></button>`; }).join('')}</div>` })}
      </div>`;
    },
  };

  // ======================= render =======================
  const view = $('#view');
  let lastPath = null, lastHash = null;
  function render(opts = {}) {
    const { path, q } = currentRoute();
    const V = VIEWS[path];
    // enter() reads the address: on a new screen, or when the address itself changed (#/tasks → #/tasks?area=company)
    if ((path !== lastPath || location.hash !== lastHash) && V.enter) V.enter(q);
    if (V.keys) need(V.keys(q));
    // a re-render (a record arrived, a filter changed) keeps what was being typed into the screen's own entry fields
    const kept = path === lastPath && !opts.reset ? $$('[data-keep]', view).map((i) => [i.id, i.value]) : [];
    const focusId = view.contains(document.activeElement) ? document.activeElement.id : '';
    view.innerHTML = V.render();
    for (const [idv, v] of kept) { const el = document.getElementById(idv); if (el && view.contains(el)) el.value = v; }
    if (focusId && path === lastPath) document.getElementById(focusId)?.focus({ preventScroll: true });
    lastHash = location.hash;
    document.title = `${V.title} · Hzzz_0’s workbench`;
    renderNav();
    placeIndicators(opts.navChange);
    placeTabIndicators(opts.tabAnim);
    if (V.mount) V.mount();
    if (opts.navChange && !reduced()) view.animate([{ opacity: 0 }, { opacity: 1 }], { duration: T, easing: EASE });
    lastPath = path;
  }
  function placeTabIndicators(animate) {
    for (const t of $$('.tabs')) {
      const sel = $('[aria-selected="true"]', t), ind = $('.tab-ind', t);
      if (!sel) { ind.style.opacity = 0; continue; }
      const key = t.getAttribute('aria-label'), from = animate ? tabMemo[key] : null;
      ind.style.transition = 'none';
      ind.style.width = `${from ? from.width : sel.offsetWidth}px`;
      ind.style.transform = `translateX(${from ? from.left : sel.offsetLeft}px)`;
      void ind.offsetWidth;
      ind.style.transition = '';
      ind.style.width = `${sel.offsetWidth}px`;
      ind.style.transform = `translateX(${sel.offsetLeft}px)`;
      tabMemo[key] = { left: sel.offsetLeft, width: sel.offsetWidth };
    }
  }
  const tabMemo = {};
  // FLIP: rows keep their identity (data-key) and move to their new place
  function flip(mutate) {
    const before = new Map($$('[data-key]', view).map((el) => [el.dataset.key, el.getBoundingClientRect()]));
    mutate();
    if (reduced()) return;
    for (const el of $$('[data-key]', view)) {
      const a = before.get(el.dataset.key), b = el.getBoundingClientRect();
      if (!a) { el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: T, easing: EASE }); continue; }
      const dx = a.left - b.left, dy = a.top - b.top;
      if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) el.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }], { duration: 200, easing: EASE });
    }
  }
  const rerender = (o) => render(o);
  const fade = (sel) => { const el = $(sel); if (el && !reduced()) el.animate([{ opacity: 0.2 }, { opacity: 1 }], { duration: 220, easing: EASE }); };

  // ======================= layers =======================
  const layers = $('#layers');
  const stack = [];
  function openLayer(el, opener, { modal = false } = {}) {
    closeLayers(el.dataset.kind === 'pop' ? 'pop' : null);
    layers.appendChild(el);
    const entry = { el, opener, modal };
    stack.push(entry);
    if (opener) opener.setAttribute('aria-expanded', 'true');
    if (!reduced()) {
      if (el.classList.contains('pop')) el.animate([{ opacity: 0, transform: 'scale(0.96)' }, { opacity: 1, transform: 'none' }], { duration: 140, easing: EASE });
      if (el.classList.contains('dialog')) el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 140, easing: EASE });
    }
    requestAnimationFrame(() => { el.classList.add('open'); (el.querySelector('[autofocus], input, select, textarea, button:not([data-close])') || el.querySelector('button'))?.focus(); });
    return entry;
  }
  function closeTop() {
    const e = stack.pop(); if (!e) return;
    finishClose(e);
  }
  function finishClose(e) {
    const { el, opener } = e;
    if (opener) { opener.setAttribute('aria-expanded', 'false'); if (document.contains(opener)) opener.focus(); else restoreFocus(opener); }
    if (el.classList.contains('drawer')) { el.classList.remove('open'); $('#scrim').classList.remove('open'); setTimeout(() => el.remove(), reduced() ? 0 : 210); }
    else el.remove();
  }
  function restoreFocus(opener) {
    const id = opener?.dataset?.id, action = opener?.dataset?.action;
    const again = id ? $(`[data-action="${action}"][data-id="${id}"]`) : action ? $(`[data-action="${action}"]`) : null;
    (again || view).focus();
  }
  function closeLayers(kind) { for (let i = stack.length - 1; i >= 0; i--) { if (!kind || stack[i].el.dataset.kind === kind) { const [e] = stack.splice(i, 1); finishClose(e); } } }
  function popover(opener, html, { light = false, cls = '', label = '' } = {}) {
    const el = document.createElement('div');
    el.className = `pop ${light ? 'light' : ''} ${cls}`; el.dataset.kind = 'pop'; el.setAttribute('role', 'menu'); if (label) el.setAttribute('aria-label', label);
    el.innerHTML = html;
    el.style.visibility = 'hidden'; layers.appendChild(el);
    const r = opener.getBoundingClientRect(), w = el.offsetWidth;
    el.style.top = `${Math.min(r.bottom + 4, innerHeight - el.offsetHeight - 8)}px`;
    el.style.left = `${Math.max(8, Math.min(r.right - w, innerWidth - w - 8))}px`;
    el.style.visibility = ''; el.remove();
    openLayer(el, opener);
    return el;
  }
  function drawer(title, html, opener) {
    const el = document.createElement('div');
    el.className = 'drawer'; el.dataset.kind = 'drawer'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-label', title);
    el.innerHTML = `<header><h2>${esc(title)}</h2><button class="icon-btn bare" type="button" data-close aria-label="关闭">${ic('x')}</button></header>${html}`;
    $('#scrim').classList.add('open');
    openLayer(el, opener, { modal: true });
    return el;
  }
  function confirmDialog(text, okLabel, onOk, opener) {
    const el = document.createElement('div');
    el.className = 'dialog'; el.dataset.kind = 'dialog'; el.setAttribute('role', 'alertdialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-label', text);
    el.innerHTML = `<p>${esc(text)}</p><div class="actions"><button class="btn" type="button" data-close>取消</button><button class="btn primary" type="button" data-ok>${esc(okLabel)}</button></div>`;
    $('#scrim').classList.add('open');
    const entry = openLayer(el, opener, { modal: true });
    el.querySelector('[data-ok]').addEventListener('click', () => { stack.splice(stack.indexOf(entry), 1); $('#scrim').classList.remove('open'); el.remove(); onOk(); });
    requestAnimationFrame(() => el.querySelector('[data-close]').focus());
  }
  let toastTimer;
  function toast(msg) {
    $('.toast')?.remove(); clearTimeout(toastTimer);
    const el = document.createElement('div'); el.className = 'toast'; el.setAttribute('role', 'status'); el.textContent = msg; document.body.appendChild(el);
    toastTimer = setTimeout(() => el.remove(), 2600);
  }

  // ---------- forms ----------
  const dueOptions = () => { const t = today(); return [t, addDays(t, 1), addDays(t, 4), addDays(t, 7), addDays(t, 14)].map((d, i) => [d, ['今天', '明天', '', '', ''][i] ? `${['今天', '明天'][i]} · ${md(d)}` : `${md(d)} ${wd(d)}`]); };
  const sel = (name, options, value) => `<select class="select" id="f-${name}" name="${name}" style="width:100%">${options.map(([v, l]) => `<option value="${esc(v)}"${v === value ? ' selected' : ''}>${esc(l)}</option>`).join('')}</select>`;
  const field = (label, name, inner, extra = '') => `<div class="field" ${extra}><label for="f-${name}">${label}</label>${inner}</div>`;
  const text = (name, value = '', req = true, max = 60) => `<input class="input" id="f-${name}" name="${name}" value="${esc(value)}" ${req ? 'required' : ''} maxlength="${max}">`;
  const area = (name, value = '', rows = 3) => `<textarea class="input" id="f-${name}" name="${name}" rows="${rows}" maxlength="500">${esc(value)}</textarea>`;
  const num = (name, value, attrs) => `<input class="input num" id="f-${name}" name="${name}" type="number" value="${esc(value ?? '')}" ${attrs}>`;
  const date = (name, value, { max = today(), req = true } = {}) => `<input class="input num" id="f-${name}" name="${name}" type="date" value="${esc(value || '')}" ${max ? `max="${max}"` : ''} ${req ? 'required' : ''}>`;
  const projectSel = (value) => sel('projectId', [['', '不归入项目'], ...companyProjects().map((p) => [p.id, p.name])], value || '');
  // a part picker: the cycle's parts, or another part typed in (a one-off swap)
  const partPicker = (value, label = '部位') => {
    const parts = data('cycle')?.parts || data('plan')?.cycle || [], inCycle = parts.includes(value);
    return field(label, 'partSel', sel('partSel', [...parts.map((p) => [p, p]), ['__other', '其他部位…']], inCycle ? value : '__other'))
      + field('其他部位', 'partOther', text('partOther', inCycle ? '' : value || '', false, 30), `data-other ${inCycle ? 'hidden' : ''}`);
  };
  const partOf = (f) => (f.partSel === '__other' || !f.partSel ? (f.partOther || '').trim() : f.partSel);
  const wirePart = (form) => { const s = form.querySelector('[name="partSel"]'); s?.addEventListener('change', () => { const o = form.querySelector('[data-other]'); o.hidden = s.value !== '__other'; if (!o.hidden) o.querySelector('input').focus(); }); };
  const LEVEL_OPTS = Object.entries(A.LEVEL);
  const signalFields = (l) => [['views', '浏览'], ['searches', '搜索'], ['sales', '成交']].map(([k, label]) => `<div class="field signal-field"><label for="f-sig-${k}">${label}信号</label><div class="pair">${sel(`sig-${k}`, LEVEL_OPTS, l?.signals[k].level || 'unknown')}<input class="input" name="note-${k}" value="${esc(l?.signals[k].note || '')}" maxlength="60" placeholder="依据，可不填" aria-label="${label}信号的依据"></div></div>`).join('');

  // every save goes through the API; the drawer stays open (and nothing on screen changes) until it succeeds
  const FORMS = {
    task: { title: '新建任务', editTitle: '编辑任务',
      fields: (t, opener) => {
        const ar = t?.area || opener?.dataset.area || (S.taskArea !== 'all' && currentRoute().path === '/tasks' ? S.taskArea : 'personal');
        const pj = t ? t.projectId : opener?.dataset.project || (ar === 'company' ? S.taskProject.replace('none', '') : '');
        const st = t?.state || opener?.dataset.state || '待开始';
        return field('任务', 'title', text('title', t?.title, true, 200))
          + field('归属', 'area', sel('area', Object.entries(A.AREA), ar))
          + field('公司项目', 'projectId', projectSel(pj), `data-company ${ar === 'company' ? '' : 'hidden'}`)
          + field('截止日期（可不填）', 'due', date('due', t ? t.due : '', { max: null, req: false }))
          + field('状态', 'state', sel('state', (t ? ['进行中', '待开始', '已完成', '归档'] : ['进行中', '待开始']).map((x) => [x, x]), st));
      },
      wire(form) { const a = form.querySelector('[name="area"]'); a.addEventListener('change', () => { form.querySelector('[data-company]').hidden = a.value !== 'company'; }); },
      async save(f, t) {
        const body = { title: f.title.trim(), area: f.area, projectId: f.area === 'company' && f.projectId ? f.projectId : null, due: f.due || null, state: f.state };
        if (t) { const fresh = await A.tasks.update(t.id, body); Object.assign(t, fresh); afterTaskChange(t); return '已更新任务'; }
        const made = await A.tasks.create(body); tasksAll().push(made); if (!R.tasks) R.tasks = { status: 'ready', data: [made] }; return '已添加任务';
      } },
    companyProject: { title: '新建公司项目',
      fields: () => field('项目名称', 'name', text('name')) + field('截止日期（可不填）', 'due', date('due', '', { max: null, req: false })),
      async save(f) { const p = await A.projects.create({ name: f.name.trim(), area: 'company', due: f.due || null }); (data('companyProjects') || (R.companyProjects = { status: 'ready', data: [] }).data).unshift(p); return `已新建项目「${p.name}」`; } },
    weight: { title: '记录体重', editTitle: '更正体重',
      fields: (w) => field('日期', 'date', date('date', w?.date || today()) + (w ? '<span class="hint">日期不能改；要换日期，删除后重新记录。</span>' : '<span class="hint">可以选过去的日期补记；同一天再记一次会覆盖。</span>'))
        + field('体重（kg）', 'kg', num('kg', w?.kg, 'inputmode="decimal" step="0.1" min="20" max="300" required')) + field('备注（可不填）', 'note', text('note', w?.note, false)),
      wire(form, w) { if (w) form.querySelector('[name="date"]').readOnly = true; },
      async save(f) { const r = await A.life.putWeight(f.date, Number(f.kg), (f.note || '').trim()); invalidate((k) => k === 'weights' || k === 'weightWeekly'); return `${r.created ? '已记录' : '已更正'} ${md(f.date)} 的体重 ${kgFmt(r.row.kg)}`; } },
    sleep: { title: '记录睡眠', editTitle: '更正睡眠',
      fields: (w) => field('日期', 'date', date('date', w?.date || today()) + (w ? '<span class="hint">日期不能改；要换日期，删除后重新记录。</span>' : '<span class="hint">记在醒来的那一天；同一天再记一次会覆盖。</span>'))
        + `<div class="fields2">${field('小时', 'h', num('h', w ? Math.floor(w.minutes / 60) : '', 'inputmode="numeric" min="0" max="24" step="1" required'))}${field('分钟', 'm', num('m', w ? w.minutes % 60 : '', 'inputmode="numeric" min="0" max="59" step="1"'))}</div>`
        + field('备注（可不填）', 'note', text('note', w?.note, false)),
      wire(form, w) { if (w) form.querySelector('[name="date"]').readOnly = true; },
      async save(f) { const r = await A.life.putSleep(f.date, sleepMinutes(f), (f.note || '').trim()); invalidate((k) => k === 'sleep' || k === 'sleepWeekly'); return `${r.created ? '已记录' : '已更正'} ${md(f.date)} 的睡眠 ${dur(r.row.minutes)}`; } },
    training: { title: '完成训练', editTitle: '更正训练记录',
      prepare: () => Promise.all([R.plan?.data ? null : load('plan'), R.cycle?.data ? null : load('cycle')]),
      fields: (x) => {
        const plan = data('plan'), def = x ? x.part : plan?.next?.part || '';
        return field('日期', 'date', date('date', x?.date || today()))
          + (x ? field('类型', 'kind', sel('kind', [['workout', '实际训练'], ['rest', '休息或顺延']], x.kind)) : '')
          + `<div data-workout ${x?.kind === 'rest' ? 'hidden' : ''}>${partPicker(def, x ? '部位' : `部位${plan?.next ? `（计划：${plan.next.part}）` : ''}`)}</div>`
          + field('备注（可不填）', 'note', text('note', x?.note, false));
      },
      wire(form) { wirePart(form); const k = form.querySelector('[name="kind"]'); k?.addEventListener('change', () => { form.querySelector('[data-workout]').hidden = k.value === 'rest'; }); },
      async save(f, x) {
        const kind = f.kind || 'workout', part = kind === 'workout' ? partOf(f) : null;
        if (kind === 'workout' && !part) throw new Error('请填写训练部位');
        if (x) await A.life.updateSession(x.id, { date: f.date, kind, part, note: (f.note || '').trim() });
        else await A.life.addSession({ date: f.date, kind, part, note: (f.note || '').trim() });
        await refresh('plan', 'sessions');
        const nx = data('plan')?.next;
        return x ? '已更正训练记录' : `已记录：${part}。下次${nx ? `练${nx.part}（${A.REASON[nx.reason]}）` : '的计划待定'}`;
      } },
    nextPart: { title: '手动指定下一次',
      prepare: () => (R.cycle?.data ? null : load('cycle')),
      fields: () => partPicker(data('plan')?.next?.part || '', '下一次练') + '<p class="small muted">指定后，下一次完成训练时自动取消，之后按循环继续。</p>',
      wire: wirePart,
      // PUT returns the whole plan, so the card is refreshed from it without another GET
      async save(f) { const part = partOf(f); if (!part) throw new Error('请填写部位'); R.plan = { status: 'ready', data: await A.life.setNext(part) }; return `下一次改为 ${part}`; } },
    transaction: { title: '记一笔收支', editTitle: '更正收支',
      prepare: () => (R.companyProjects?.data ? null : load('companyProjects')),
      fields: (x) => {
        const cats = [...new Set(Object.keys(R).filter((k) => k.startsWith('sum:')).flatMap((k) => data(k)?.byCategory.map((c) => c.category) || []))];
        return field('日期', 'date', date('date', x?.date || (S.finMonth === A.month() ? today() : `${S.finMonth}-01`)))
          + field('收支类型', 'type', sel('type', [['expense', '支出'], ['income', '收入']], x?.type || 'expense'))
          + field('类别', 'category', `<input class="input" id="f-category" name="category" value="${esc(x?.category || '')}" required maxlength="30" list="cat-list" placeholder="例如 样品采购"><datalist id="cat-list">${cats.map((c) => `<option value="${esc(c)}"></option>`).join('')}</datalist>`)
          + field('金额（元）', 'amount', num('amount', x ? A.yuan(x.amountCents) : '', 'inputmode="decimal" step="0.01" min="0.01" required'))
          + field('公司项目（可不填）', 'projectId', projectSel(x?.projectId)) + field('备注（可不填）', 'note', text('note', x?.note, false));
      },
      async save(f, x) {
        const cents = A.toCents(f.amount);
        if (!(cents > 0)) throw new Error('金额要大于 0');
        const body = { date: f.date, type: f.type, category: f.category.trim(), amountCents: cents, projectId: f.projectId || null, note: (f.note || '').trim() };
        if (x) await A.company.updateTransaction(x.id, body); else await A.company.addTransaction(body);
        S.finMonth = f.date.slice(0, 7);
        invalidate((k) => /^(tx|sum|monthly):/.test(k));
        return `${x ? '已更正' : '已记录'}：${body.category} ${f.type === 'income' ? '+' : '−'}${money(cents)}`;
      } },
    lead: { title: '新增选品线索', editTitle: '编辑线索',
      fields: (l) => field('产品', 'product', text('product', l?.product, true, 100))
        + `<div class="fields2">${field('来源名称', 'sourceName', text('sourceName', l?.sourceName, false))}${field('观察日期', 'observedOn', date('observedOn', l?.observedOn || today()))}</div>`
        + field('来源链接（http 或 https）', 'sourceUrl', `<input class="input" id="f-sourceUrl" name="sourceUrl" type="url" inputmode="url" value="${esc(l?.sourceUrl || '')}" maxlength="500" placeholder="https://">`)
        + signalFields(l)
        + field('待验证问题', 'questions', area('questions', l?.questions, 2)) + field('下一步', 'nextStep', text('nextStep', l?.nextStep, false, 120))
        + field('状态', 'status', sel('status', Object.entries(A.LEAD_STATUS), l?.status || 'watching'))
        + (l ? `<p><button class="tlink danger" type="button" data-action="lead-del" data-id="${l.id}">删除这条线索</button></p>` : ''),
      async save(f, l) {
        const url = (f.sourceUrl || '').trim();
        if (url && !A.safeUrl(url)) throw new Error('来源链接要以 http:// 或 https:// 开头');
        const signals = Object.fromEntries(['views', 'searches', 'sales'].map((k) => [k, { level: f[`sig-${k}`], note: (f[`note-${k}`] || '').trim() }]));
        const body = { product: f.product.trim(), sourceName: (f.sourceName || '').trim(), sourceUrl: url, observedOn: f.observedOn, signals, questions: (f.questions || '').trim(), nextStep: (f.nextStep || '').trim(), status: f.status };
        if (l) await A.company.updateLead(l.id, body); else await A.company.addLead(body);
        invalidate((k) => k === 'leads');
        return l ? '已保存线索' : `已加入候选清单：${body.product}`;
      } },
    leadTask: { title: '转成待办',
      prepare: () => (R.companyProjects?.data ? null : load('companyProjects')),
      fields: (l) => `<p class="muted">来源：${esc(l.product)}</p>` + field('待办', 'title', text('title', l.nextStep || `验证：${l.questions || l.product}`, true, 200))
        + field('截止日期（可不填）', 'due', date('due', '', { max: null, req: false })) + field('公司项目（可不填）', 'projectId', projectSel('')),
      async save(f, l) {
        const made = await A.tasks.create({ title: f.title.trim(), area: 'company', projectId: f.projectId || null, due: f.due || null, source: { type: 'lead', id: l.id } });
        tasksAll().push(made);
        invalidate((k) => k === 'leads');
        return `已转成公司待办：${made.title}`;
      } },
    project: { title: '新建项目', fields: () => field('项目名称', 'name', text('name')) + field('截止', 'due', sel('due', dueOptions(), addDays(today(), 14))) + field('步骤数', 'steps', `<input class="input num" id="f-steps" name="steps" type="number" min="1" max="30" value="5" required>`),
      save(f) { D.projects.unshift({ id: 'p' + Date.now(), name: f.name, status: '进行中', steps: +f.steps, done: 0, summary: '刚开始', updated: today(), due: f.due }); return '已新建项目（示例数据，刷新后不保留）'; } },
    note: { title: '新建笔记', fields: () => field('标题', 'title', text('title')) + field('内容', 'body', `<textarea class="input" id="f-body" name="body"></textarea>`),
      save(f) { D.docs.push({ id: 'doc' + Date.now(), name: `${f.title}.md`, folder: '个人', edited: today(), size: '1 KB' }); return '笔记已存入文档（示例数据，刷新后不保留）'; } },
    paper: { title: '添加文献', fields: () => field('标题', 'title', text('title')) + field('来源', 'venue', sel('venue', [['Preprint', 'Preprint'], ['Journal', 'Journal'], ['Workshop', 'Workshop'], ['Thesis', 'Thesis']], 'Preprint')) + field('项目', 'project', sel('project', D.research.map((r) => [r.name, r.name]), D.research[0].name)),
      save(f) { D.papers.push({ id: 'pa' + Date.now(), title: f.title, venue: f.venue, year: 2026, project: f.project, status: '待读', added: today() }); return '已加入阅读清单（示例数据，刷新后不保留）'; } },
    experiment: { title: '记一条实验', fields: () => field('名称', 'name', text('name')) + field('项目', 'project', sel('project', D.research.map((r) => [r.name, r.name]), D.research[1].name)) + field('设置', 'setup', `<textarea class="input" id="f-setup" name="setup"></textarea>`),
      save(f) { const n = 11 + D.experiments.length; D.experiments.unshift({ id: `EXP-0${n}`, name: f.name, project: f.project, status: '运行中', date: today(), setup: f.setup || '—', notes: '', result: '' }); return `已记录 EXP-0${n}（示例数据，刷新后不保留）`; } },
    research: { title: '新建研究项目', fields: () => field('项目名称', 'name', text('name')) + field('当前阶段', 'stage', sel('stage', D.STAGES.map((s, i) => [String(i), s]), '0')) + field('下一个里程碑', 'milestone', text('milestone')) + field('截止', 'due', sel('due', dueOptions(), addDays(today(), 14))),
      save(f) { D.research.push({ id: 'r' + Date.now(), name: f.name, stage: +f.stage, milestone: f.milestone, due: f.due, next: { label: '待定', due: addDays(f.due, 14) }, stageDates: ['待定', '待定', '待定', '待定'] }); D.researchDates.push({ date: f.due, label: f.milestone, research: true }); D.researchDates.sort((a, b) => a.date.localeCompare(b.date)); return '已新建研究项目（示例数据，刷新后不保留）'; } },
  };
  const sleepMinutes = (f) => { const h = Number(f.h || 0), m = Number(f.m || 0); if (!Number.isInteger(h) || !Number.isInteger(m) || h < 0 || m < 0 || m > 59 || h * 60 + m > 1440) throw new Error('睡眠时长在 0 到 24 小时之间'); return h * 60 + m; };
  async function openForm(type, opener, target) {
    const F = FORMS[type];
    if (F.prepare) { const p = F.prepare(); if (p) { opener?.setAttribute('aria-busy', 'true'); await p; opener?.removeAttribute('aria-busy'); } }
    const el = drawer(target && F.editTitle ? F.editTitle : F.title, `<form class="settings" style="gap:16px;display:grid;flex:1;align-content:start" novalidate>${F.fields(target, opener)}<div class="actions"><button class="btn" type="button" data-close>取消</button><button class="btn primary" type="submit">保存</button></div></form>`, opener);
    const form = el.querySelector('form');
    F.wire?.(form, target);
    form.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const fd = Object.fromEntries(new FormData(form));
      const bad = [...form.querySelectorAll('input, select, textarea')].find((i) => !i.closest('[hidden]') && !i.checkValidity());
      form.querySelectorAll('[aria-invalid]').forEach((i) => i.removeAttribute('aria-invalid'));
      if (bad) { bad.setAttribute('aria-invalid', 'true'); bad.focus(); toast(bad.validationMessage || '请检查填写的内容'); return; }
      const btn = form.querySelector('[type="submit"]'); btn.disabled = true; btn.textContent = '正在保存…';
      try {
        const msg = await F.save(fd, target, opener);
        const i = stack.findIndex((e) => e.el === el); if (i > -1) { const [e] = stack.splice(i, 1); finishClose(e); }
        flip(() => rerender()); toast(msg);
      } catch (e) {
        btn.disabled = false; btn.textContent = '保存';
        toast(`没有保存：${e.message}`);
      }
    });
  }

  // ======================= events =======================
  document.addEventListener('click', (ev) => {
    const t = ev.target;
    // outside click closes popovers
    if (stack.length && !t.closest('.pop') && !t.closest('[aria-expanded="true"]')) closeLayers('pop');
    if (t.closest('[data-close]')) { const layer = t.closest('.drawer, .dialog'); const i = stack.findIndex((e) => e.el === layer); if (i > -1) { const [e] = stack.splice(i, 1); if (layer.classList.contains('dialog')) $('#scrim').classList.remove('open'); finishClose(e); } return; }
    const nav = t.closest('[data-nav]');
    if (nav) { closeLayers(); location.hash = nav.dataset.nav; return; }
    const a = t.closest('[data-action]'); if (!a || a.tagName === 'SELECT') return;
    const act = a.dataset.action, id = a.dataset.id, val = a.dataset.value;
    const H = {
      'open-nav': () => toggleNav(true),
      'nav-group': () => toggleFold(a.dataset.group),
      retry: () => { S.failed.delete(id); if (S.blockState) S.blockState = null; rerender(); },
      reload: () => { if (S.blockState) S.blockState = null; refresh(...a.dataset.keys.split(',')); rerender(); },
      'task-area': () => { if (S.taskArea === val) return; S.taskArea = val; S.taskProject = ''; syncTaskUrl(); flip(() => rerender()); },
      'co-tab': () => flip(() => { S.coTab = val; rerender({ tabAnim: true }); }),
      'co-pick': () => flip(() => { S.coProject = S.coProject === id ? '' : id; rerender(); }),
      'lead-tab': () => flip(() => { S.leadTab = val; rerender({ tabAnim: true }); }),
      'fin-month': () => { S.finMonth = +val === 0 ? A.month() : A.addMonths(S.finMonth, +val); rerender(); },
      'weight-edit': () => openForm('weight', a, (data('weights') || []).find((w) => w.date === id)),
      'sleep-edit': () => openForm('sleep', a, (data('sleep') || []).find((w) => w.date === id)),
      'session-edit': () => openForm('training', a, (data('sessions') || []).find((x) => x.id === id)),
      'tx-edit': () => openForm('transaction', a, (data(`tx:${S.finMonth}`) || []).find((x) => x.id === id)),
      'weight-del': () => removeRow({ key: 'weights', match: (w) => w.date === id, call: () => A.life.deleteWeight(id), also: ['weightWeekly'], ask: `删除 ${md(id)} 的体重记录？`, done: '已删除体重记录', opener: a }),
      'sleep-del': () => removeRow({ key: 'sleep', match: (w) => w.date === id, call: () => A.life.deleteSleep(id), also: ['sleepWeekly'], ask: `删除 ${md(id)} 的睡眠记录？`, done: '已删除睡眠记录', opener: a }),
      'session-del': () => removeRow({ key: 'sessions', match: (x) => x.id === id, call: () => A.life.deleteSession(id), also: ['plan'], ask: '删除这条训练记录？下次计划会重新计算。', done: '已删除，计划已重新计算', opener: a }),
      'tx-del': () => removeRow({ key: `tx:${S.finMonth}`, match: (x) => x.id === id, call: () => A.company.deleteTransaction(id), also: [`sum:${S.finMonth}`, `monthly:${S.finMonth}`], ask: '删除这笔收支？月度汇总会重新计算。', done: '已删除，汇总已更新', opener: a }),
      'train-rest': () => busy(a, async () => { await A.life.addSession({ date: today(), kind: 'rest', part: null, note: '' }); await refresh('plan', 'sessions'); const nx = data('plan')?.next; toast(`已记录休息，计划保留${nx ? `：下次练${nx.part}` : ''}`); }),
      'train-unset': () => busy(a, async () => { await A.life.clearNext(); await refresh('plan'); const nx = data('plan')?.next; toast(`已取消指定${nx ? `，下次按${A.REASON[nx.reason]}练${nx.part}` : ''}`); }),
      'cycle-edit': () => { S.cycleDraft = [...(data('cycle')?.parts || [])]; rerender(); $('#e-part')?.focus(); },
      'cycle-cancel': () => { S.cycleDraft = null; rerender(); },
      'cycle-up': () => { const i = +id, d = S.cycleDraft; [d[i - 1], d[i]] = [d[i], d[i - 1]]; rerender(); $(`[data-action="cycle-up"][data-id="${i - 1}"]`)?.focus(); },
      'cycle-down': () => { const i = +id, d = S.cycleDraft; [d[i + 1], d[i]] = [d[i], d[i + 1]]; rerender(); $(`[data-action="cycle-down"][data-id="${i + 1}"]`)?.focus(); },
      'cycle-del': () => { S.cycleDraft.splice(+id, 1); rerender(); },
      'cycle-save': () => busy(a, async () => { const parts = S.cycleDraft; await A.life.setCycle(parts); S.cycleDraft = null; await refresh('cycle', 'plan'); toast(`已保存循环：${parts.join(' → ')}`); }),
      'lead-edit': () => openForm('lead', a, (data('leads') || []).find((l) => l.id === id)),
      'lead-task': () => openForm('leadTask', a, (data('leads') || []).find((l) => l.id === id)),
      'lead-tasks': () => leadTasksDrawer(a, id),
      'lead-del': () => { const l = (data('leads') || []).find((x) => x.id === id); confirmDialog(`删除线索「${l?.product || ''}」？已转出的待办会保留。`, '删除', () => { closeLayers('drawer'); removeRow({ key: 'leads', match: (x) => x.id === id, call: () => A.company.deleteLead(id), done: '已删除线索' }); }, a); },
      weekly: () => { if (S.weekly === val) return; S.weekly = val; rerender(); fade('#weekly-chart'); },
      'proj-view': () => { if (S.projView === val) return; flip(() => { S.projView = val; rerender(); }); },
      'stats-metric': () => { S.statsMetric = val; rerender(); fade('#stats-chart'); },
      'doc-view': () => flip(() => { S.docView = val; rerender(); }),
      'res-tab': () => flip(() => { S.resTab = val; rerender({ tabAnim: true }); }),
      'paper-tab': () => flip(() => { S.paperTab = val; rerender({ tabAnim: true }); }),
      'task-tab': () => flip(() => { S.taskTab = val; rerender({ tabAnim: true }); }),
      'doc-folder': () => flip(() => { S.docFolder = val; rerender({ tabAnim: true }); }),
      'cal-week': () => { S.calWeek = +val === 0 ? 0 : S.calWeek + +val; rerender(); fade('#week-grid'); },
      'goal-toggle': () => { const g = D.goals.find((x) => x.id === id); g.done = !g.done; rerender(); $(`[data-action="goal-toggle"][data-id="${id}"]`)?.focus(); },
      'goal-edit': () => { if (S.goalsEdit) saveGoals(); S.goalsEdit = !S.goalsEdit; rerender(); $('[data-action="goal-edit"]')?.focus(); },
      'goal-del': () => { saveGoals(); D.goals.splice(D.goals.findIndex((g) => g.id === id), 1); rerender(); },
      'goal-add': () => { saveGoals(); D.goals.push({ id: 'g' + Date.now(), text: '新目标', done: false }); rerender(); $$('[data-goal-input]').at(-1)?.select(); },
      'task-remind': () => { const tk = findTask(id); if (!tk) return; saveTask(tk, { remind: !tk.remind }, (t) => (t.remind ? '截止前一天提醒你' : '已关闭提醒')); },
      'task-done': () => { const tk = findTask(id); if (!tk) return; saveTask(tk, { state: tk.state === '已完成' ? '进行中' : '已完成' }, (t) => (t.state === '已完成' ? `已完成「${t.title}」` : '已移回进行中')); },
      'task-menu': () => taskMenu(a, id),
      'paper-next': () => { const p = D.papers.find((x) => x.id === id); p.status = p.status === '待读' ? '在读' : '已批注'; if (p.status === '在读') Object.assign(p, { page: 1, pages: 12 }); if (p.status === '已批注') p.notes = 0; flip(() => rerender()); },
      'exp-open': () => expDrawer(a, id),
      'menu-summary': () => { const el = popover(a, `<button class="mi" role="menuitem" type="button" data-pop="export">导出概况 ${ic('download')}</button><button class="mi" role="menuitem" type="button" data-pop="all">查看全部项目 ${ic('chevr')}</button>`, { label: '总体概况' });
        el.addEventListener('click', (e) => { const k = e.target.closest('[data-pop]')?.dataset.pop; if (k === 'export') { closeTop(); const pc = D.projectCounts(); download('workbench_总体概况.csv', `指标,数值\n已完成任务（累计）,${tasksAll().filter((t) => t.state === '已完成').length}\n项目,${pc.total}\n进行中,${pc.active}\n已完成,${pc.done}\n暂停,${pc.paused}\n`); } if (k === 'all') { closeLayers(); location.hash = '#/tasks?view=projects'; } }); },
      'share-month': () => { const m = D.month(); const txt = `11月1日至6日：工作 ${m.work}/${D.plan.work} h，科研 ${m.research}/${D.plan.research} h，个人 ${m.personal}/${D.plan.personal} h（示例数据）`; (navigator.clipboard?.writeText(txt) || Promise.reject()).then(() => toast('已复制本月摘要'), () => toast(txt)); },
      'download-month': () => { const m = D.month(); download('workbench_11月报告.csv', `类别,已用小时,计划小时,完成度\n工作,${m.work},${D.plan.work},${pct(m.work, D.plan.work)}%\n科研,${m.research},${D.plan.research},${pct(m.research, D.plan.research)}%\n个人,${m.personal},${D.plan.personal},${pct(m.personal, D.plan.personal)}%\n`); toast('已下载 11月报告'); },
      create: () => { const el = popover(a, [['task', '任务', 'tasks'], ['weight', '体重', 'scale'], ['sleep', '睡眠', 'moon'], ['training', '训练', 'dumbbell'], ['transaction', '收支', 'wallet'], ['lead', '选品线索', 'eye'], ['project', '项目（示例）', 'overview'], ['note', '笔记（示例）', 'doc'], ['paper', '文献（示例）', 'book'], ['experiment', '实验记录（示例）', 'flask']].map(([k, l, i]) => `<button class="mi" role="menuitem" type="button" data-pop="${k}"><span style="display:flex;gap:10px;align-items:center">${ic(i)}${l}</span></button>`).join(''), { label: '新建' });
        el.addEventListener('click', (e) => { const k = e.target.closest('[data-pop]')?.dataset.pop; if (k) { closeTop(); openForm(k, a); } }); },
      new: () => openForm(a.dataset.type, a),
      search: () => searchPop(a),
      bell: () => { S.unread = false; $$('.dot-badge').forEach((d) => d.remove()); a.setAttribute('aria-label', '提醒'); popover(a, `<div role="none" style="width:300px">${D.notifications.map((n) => `<div class="note"><div>${esc(n.text)}</div><div class="t">${esc(n.when)}</div></div>`).join('')}</div>`, { light: true, label: '提醒' }); },
      upload: () => toast('上传功能尚未开放'),
      connect: () => toast(`${a.dataset.name} 连接功能尚未开放`),
      'open-draft': () => toast('初稿在「文档」里：初稿_稀疏注意力检索_v6.docx'),
    };
    if (H[act]) { ev.preventDefault(); H[act](); }
  });
  document.addEventListener('change', (ev) => {
    const a = ev.target.closest('select[data-action]'); if (!a) return;
    const k = { 'proj-sort': 'projSort', 'paper-sort': 'paperSort', 'task-sort': 'taskSort', 'task-project': 'taskProject', 'co-project': 'coProject' }[a.dataset.action];
    if (k) flip(() => { S[k] = a.value; if (k === 'taskProject') syncTaskUrl(); rerender(); $(`select[data-action="${a.dataset.action}"]`)?.focus(); });
  });
  // the screens' own entry rows (体重, 睡眠, 新部位)
  document.addEventListener('submit', async (ev) => {
    const f = ev.target.closest('[data-entry]'); if (!f) return;
    ev.preventDefault();
    const fd = Object.fromEntries(new FormData(f)), kind = f.dataset.entry;
    if (kind === 'cycle-add') {
      const part = (fd.part || '').trim();
      if (!part) return; if (S.cycleDraft.includes(part)) { toast(`「${part}」已经在循环里`); return; }
      S.cycleDraft.push(part); rerender({ reset: true }); $('#e-part')?.focus(); return;
    }
    const bad = [...f.querySelectorAll('input')].find((i) => !i.checkValidity());
    if (bad) { bad.setAttribute('aria-invalid', 'true'); bad.focus(); toast(bad.validationMessage || '请检查填写的内容'); return; }
    f.querySelectorAll('[aria-invalid]').forEach((i) => i.removeAttribute('aria-invalid'));
    await busy(f.querySelector('[type="submit"]'), async () => {
      const msg = await FORMS[kind].save(fd);
      f.reset(); rerender({ reset: true }); toast(msg);
    });
  });
  document.addEventListener('submit', (ev) => {
    const f = ev.target.closest('[data-form]'); if (!f) return;
    ev.preventDefault();
    const fd = Object.fromEntries(new FormData(f));
    if (f.dataset.form === 'plan') { for (const k of ['work', 'research', 'personal']) { const v = Math.round(+fd[k]); if (!(v > 0)) return; D.plan[k] = v; } }
    rerender();
    const stamp = $(`[data-form="${f.dataset.form}"] [data-saved]`); if (stamp) stamp.textContent = '已保存';
  });
  document.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape') { if (stack.length) { ev.preventDefault(); const e = stack.at(-1); if (e.el.classList.contains('dialog')) $('#scrim').classList.remove('open'); closeTop(); } else if ($('#sidebar').classList.contains('open')) toggleNav(false); }
    if ((ev.metaKey || ev.ctrlKey) && ev.key.toLowerCase() === 'k') { ev.preventDefault(); searchPop($('.cluster [data-action="search"]') || $('.mobile-bar [data-action="search"]')); }
    // keep focus inside an open modal
    const top = stack.at(-1);
    if (ev.key === 'Tab' && top?.modal) { const f = $$('button, input, select, textarea, a[href]', top.el).filter((x) => !x.disabled); if (!f.length) return; if (ev.shiftKey && document.activeElement === f[0]) { ev.preventDefault(); f.at(-1).focus(); } else if (!ev.shiftKey && document.activeElement === f.at(-1)) { ev.preventDefault(); f[0].focus(); } }
    if (top?.el.classList.contains('pop') && (ev.key === 'ArrowDown' || ev.key === 'ArrowUp') && !top.el.classList.contains('search-pop')) { const items = $$('.mi', top.el); const i = items.indexOf(document.activeElement); ev.preventDefault(); items[(i + (ev.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length]?.focus(); }
  });
  $('#scrim').addEventListener('click', () => { if (stack.some((e) => e.modal)) { const e = stack.at(-1); closeTop(); void e; } else toggleNav(false); });
  function toggleNav(open) {
    const sb = $('#sidebar'), btn = $('#menu-btn');
    sb.classList.toggle('open', open); $('#scrim').classList.toggle('open', open);
    btn.setAttribute('aria-expanded', open);
    if (open) $('.nav-item', sb).focus(); else btn.focus();
  }
  $('#sidebar').addEventListener('click', (ev) => { if (ev.target.closest('a') && $('#sidebar').classList.contains('open')) { $('#sidebar').classList.remove('open'); $('#scrim').classList.remove('open'); $('#menu-btn').setAttribute('aria-expanded', 'false'); } });

  function saveGoals() { $$('[data-goal-input]').forEach((i) => { const g = D.goals.find((x) => x.id === i.dataset.goalInput); if (g && i.value.trim()) g.text = i.value.trim(); }); }
  function taskMenu(opener, id) {
    const tk = findTask(id), pinned = S.pinned.includes(id);
    if (!tk) return;
    const el = popover(opener, `<button class="mi" role="menuitem" type="button" data-pop="pin">${pinned ? '取消置顶' : '置顶'} ${ic('pin')}</button><button class="mi" role="menuitem" type="button" data-pop="edit">编辑 ${ic('edit')}</button><button class="mi" role="menuitem" type="button" data-pop="del">删除 ${ic('trash')}</button>`, { label: '任务操作' });
    el.addEventListener('click', (e) => {
      const k = e.target.closest('[data-pop]')?.dataset.pop; if (!k) return;
      closeTop();
      if (k === 'pin') flip(() => { S.pinned = pinned ? S.pinned.filter((x) => x !== id) : [id, ...S.pinned]; rerender(); });
      if (k === 'edit') openForm('task', opener, tk);
      if (k === 'del') confirmDialog(`删除任务「${tk.title}」？`, '删除', () => { removeRow({ key: 'tasks', match: (x) => x.id === id, call: () => A.tasks.remove(id), done: '已删除任务', after: () => afterTaskChange(tk) }); view.focus(); }, opener);
    });
  }
  // ---------- writes to real records ----------
  const findTask = (id) => tasksAll().find((x) => x.id === id);
  // a task linked to a lead changes that lead's open-task count
  const afterTaskChange = (t) => { if (t?.source?.type === 'lead') invalidate((k) => k === 'leads'); };
  // optimistic: the screen changes at once; if the API refuses, it goes back and a toast says why
  async function saveTask(tk, patch, msg) {
    const before = Object.fromEntries(Object.keys(patch).map((k) => [k, tk[k]]));
    flip(() => { Object.assign(tk, patch); rerender(); });
    try {
      Object.assign(tk, await A.tasks.update(tk.id, patch));
      afterTaskChange(tk); rerender(); if (msg) toast(msg(tk));
    } catch (e) {
      flip(() => { Object.assign(tk, before); rerender(); });
      toast(`没有保存：${e.message}`);
    }
  }
  // remove a row at once, put it back if the delete fails
  async function removeRow({ key, match, call, also = [], ask, done, opener, after }) {
    if (ask) { confirmDialog(ask, '删除', () => removeRow({ key, match, call, also, done, after }), opener); return; }
    const list = data(key) || [], i = list.findIndex(match), row = list[i];
    if (i > -1) flip(() => { list.splice(i, 1); rerender(); });
    try {
      await call(); after?.(); if (also.length) await refresh(...also); rerender(); toast(done);
    } catch (e) {
      if (i > -1) flip(() => { list.splice(i, 0, row); rerender(); });
      toast(`没有删除：${e.message}`);
    }
  }
  // a button that runs one request: disabled while it runs, a toast if it fails
  async function busy(btn, fn) {
    if (btn) { btn.disabled = true; btn.setAttribute('aria-busy', 'true'); }
    try { await fn(); } catch (e) { toast(`没有保存：${e.message}`); }
    finally { if (btn && document.contains(btn)) { btn.disabled = false; btn.removeAttribute('aria-busy'); } }
  }
  function leadTasksDrawer(opener, id) {
    const l = (data('leads') || []).find((x) => x.id === id);
    const el = drawer(`「${l?.product || '线索'}」的待办`, '<div data-lt aria-live="polite"><div class="skel" aria-busy="true" aria-label="正在加载待办"><div class="skeleton"></div><div class="skeleton"></div></div></div><div class="actions"><button class="btn" type="button" data-close>关闭</button></div>', opener);
    const box = $('[data-lt]', el);
    const draw = async () => {
      try {
        const list = await A.company.leadTasks(id);
        // the drawer shows the same records as the task store, so ticking one here ticks it everywhere
        const rows = list.map((t) => findTask(t.id) || t);
        box.innerHTML = rows.length ? `<div class="list">${rows.map(taskLine).join('')}</div><p class="small muted" style="margin-top:8px">同样的待办在「公司待办」和「我的任务」里也能看到。</p>`
          : `<div class="empty">还没有从这条线索转出的待办。<button class="tlink" type="button" data-action="lead-task" data-id="${esc(id)}">转成待办</button></div>`;
      } catch (e) {
        box.innerHTML = `<div class="err" role="alert"><i aria-hidden="true"></i><span>无法加载待办：${esc(e.message)}。</span><button class="tlink" type="button" data-lt-retry>重试</button></div>`;
        $('[data-lt-retry]', box).addEventListener('click', draw);
      }
    };
    draw();
  }
  function expDrawer(opener, id) {
    const e = D.experiments.find((x) => x.id === id);
    drawer(`${e.id} ${e.name}`, `<dl class="kv"><dt>编号</dt><dd class="mono">${esc(e.id)}</dd><dt>项目</dt><dd>${esc(e.project)}</dd><dt>状态</dt><dd>${pill(e.status)}</dd><dt>日期</dt><dd class="num">${md(e.date)} ${wd(e.date)}</dd><dt>设置</dt><dd>${esc(e.setup)}</dd><dt>备注</dt><dd>${esc(e.notes || '—')}</dd><dt>结果</dt><dd class="num">${esc(e.result || '—')}</dd></dl>
      <div class="actions"><button class="btn" type="button" data-close>关闭</button></div>`, opener);
  }
  function searchPop(opener) {
    const el = popover(opener, `<input class="input" type="search" placeholder="搜索任务、文献、项目" aria-label="搜索任务、文献、项目" data-q><div role="listbox" aria-label="搜索结果" data-results></div>`, { light: true, cls: 'search-pop', label: '搜索' });
    el.setAttribute('role', 'dialog');
    const items = () => [
      ...tasksAll().filter((t) => t.state !== '归档').map((t) => ({ l: t.title, s: `任务 · ${t.areaLabel}`, to: `#/tasks?area=${t.area}` })),
      ...(data('leads') || []).map((l) => ({ l: l.product, s: '选品线索', to: '#/company/leads' })),
      ...D.papers.map((p) => ({ l: p.title, s: '文献', to: '#/research/papers' })),
      ...D.projects.map((p) => ({ l: p.name, s: '项目', to: '#/tasks?view=projects' })),
    ];
    let active = 0;
    const draw = () => { const q = $('[data-q]', el).value.trim().toLowerCase(); const r = items().filter((x) => !q || x.l.toLowerCase().includes(q)).slice(0, 6); active = Math.min(active, Math.max(0, r.length - 1));
      $('[data-results]', el).innerHTML = r.length ? r.map((x, i) => `<button type="button" class="mi" role="option" aria-selected="${i === active}" data-to="${x.to}"><span class="ellipsis">${esc(x.l)}</span><span class="sub">${x.s}</span></button>`).join('') : '<p class="small muted" style="padding:8px 10px">没有找到匹配的内容。</p>'; return r; };
    let res = draw();
    $('[data-q]', el).addEventListener('input', () => { active = 0; res = draw(); });
    $('[data-q]', el).addEventListener('keydown', (e) => { if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); active = (active + (e.key === 'ArrowDown' ? 1 : -1) + res.length) % Math.max(1, res.length); draw(); } if (e.key === 'Enter' && res[active]) { e.preventDefault(); closeLayers(); location.hash = res[active].to; } });
    el.addEventListener('click', (e) => { const b = e.target.closest('[data-to]'); if (b) { closeLayers(); location.hash = b.dataset.to; } });
  }
  function download(name, csv) {
    const url = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  // icons in static shell buttons
  $('#menu-btn').innerHTML = ic('menu');
  $('.mobile-bar [data-action="search"]').innerHTML = ic('search');

  window.addEventListener('hashchange', () => { closeLayers(); render({ navChange: true }); view.focus({ preventScroll: true }); scrollTo(0, 0); });
  window.addEventListener('resize', () => { placeIndicators(false); placeTabIndicators(false); });
  if (!location.hash) history.replaceState(null, '', '#/overview');
  // real tasks first (the overview, the nav count and 我的任务 all read them), then the screen
  view.innerHTML = '<div class="boot" aria-busy="true">正在加载你的任务…</div>';
  Promise.all([load('tasks'), load('companyProjects')]).then(() => render());

  // ---------- font and figure checks (read in the console) ----------
  Promise.all([document.fonts.load('400 12px "Geist Mono"'), document.fonts.load('600 30px "IBM Plex Sans"'), document.fonts.load('400 14px "Noto Sans SC"', '研'), document.fonts.load('600 24px "Source Serif 4"'), document.fonts.load('600 24px "Noto Serif SC"', '研')]).then(() => document.fonts.ready).then(() => {
    placeIndicators(false); placeTabIndicators(false);
    const faces = [...document.fonts].filter((f) => f.status === 'loaded').map((f) => f.family.replace(/"/g, ''));
    const probe = (style) => { const s = document.createElement('span'); s.style.cssText = `position:absolute;visibility:hidden;font:400 14px "IBM Plex Sans";${style}`; s.textContent = '1111'; document.body.appendChild(s); const a = s.getBoundingClientRect().width; s.textContent = '0000'; const b = s.getBoundingClientRect().width; s.remove(); return [a, b]; };
    const [p1, p0] = probe(''), [t1, t0] = probe('font-variant-numeric:tabular-nums');
    const report = {
      plexLoaded: faces.includes('IBM Plex Sans'), sansScLoaded: faces.includes('Noto Sans SC'), serifLoaded: faces.includes('Source Serif 4'), serifScLoaded: faces.includes('Noto Serif SC'), monoLoaded: faces.includes('Geist Mono'),
      check400: document.fonts.check('400 14px "IBM Plex Sans"'), check600: document.fonts.check('600 14px "IBM Plex Sans"'), checkHeading: document.fonts.check('600 24px "Source Serif 4"'), checkMono: document.fonts.check('400 12px "Geist Mono"'),
      tabularDigits: Math.abs(t1 - t0) < 0.1, proportionalDefault: Math.abs(p1 - p0) > 0.1,  // Plex's default digits are already tabular h1Count: $$('h1').length,
    };
    window.__fontReport = report;
    console.info('[workbench] font check', report);
  });
})();

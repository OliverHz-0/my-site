// 研台 Lab Desk: routing, views, layers and state. Renders only the active view, so the document holds one h1.
// Screen question (总览): what should I push forward today, and is research keeping pace with everything else?
// Face: the blue-grey ledger ground, research drawn in the one data hue. Signature: the research pipeline strip.
(() => {
  const D = window.DATA, C = window.Charts;
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
  };
  const ic = (n, cls = '') => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[n] || ''}</svg>`;

  // ---------- state ----------
  const params = new URLSearchParams(location.search);
  const S = {
    weekly: 'this', projSort: 'updated', projView: 'list', resTab: '全部', paperTab: '全部', paperSort: 'added', taskTab: '进行中', taskSort: 'due',
    calWeek: 0, statsMetric: 'research', docFolder: '全部', docView: 'list', goalsEdit: false, unread: true,
    blockState: ['loading', 'error', 'empty'].includes(params.get('state')) ? params.get('state') : null,
    failed: new Set(), pinned: [],
  };

  // ---------- navigation ----------
  const NAV = {
    main: [['总览', '#/overview', 'overview'], ['日历', '#/calendar', 'calendar'], ['我的任务', '#/tasks', 'tasks', 'due'], ['统计', '#/stats', 'stats'], ['文档', '#/docs', 'docs']],
    research: [['研究概览', '#/research', 'compass'], ['文献阅读', '#/research/papers', 'book'], ['实验记录', '#/research/experiments', 'flask'], ['论文写作', '#/research/writing', 'pen'], ['数据与代码', '#/research/data', 'data']],
    integrations: [['Zotero', '#/settings/integrations', 'plug', null, true], ['Notion', '#/settings/integrations', 'plug', null, true], ['GitHub', '#/settings/integrations', 'plug', null, true], ['添加插件', '#/settings/integrations', 'plusc']],
    bottom: [['设置', '#/settings', 'settings']],
  };
  const dueTodayCount = () => D.tasks.filter((t) => (t.state === '进行中' || t.state === '待开始') && t.due === D.TODAY).length;
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
  }
  const lastIndicator = {};
  function placeIndicators(animate) {
    for (const el of $$('.nav')) {
      const ind = $('.nav-indicator', el), cur = $('[aria-current="page"]', el), g = el.dataset.navGroup;
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
  function block({ cls = '', inverse = false, title, count, tools = '', body, empty = '', isEmpty = false, id }) {
    const st = S.failed.has(id) ? 'error' : S.blockState;
    let inner;
    if (st === 'loading') inner = `<div class="skel" aria-busy="true" aria-label="正在加载"><div class="skeleton kpi"></div><div class="skeleton"></div><div class="skeleton"></div><div class="skeleton" style="width:60%"></div></div>`;
    else if (st === 'error') inner = `<div class="err" role="alert"><i aria-hidden="true"></i><span>无法加载${esc(title)}，最后更新 09:14。</span><button class="tlink" type="button" data-action="retry" data-id="${id}">重试</button></div>`;
    else if (st === 'empty' || isEmpty) inner = `<div class="empty">${empty}</div>`;
    else inner = body;
    return `<section class="card ${inverse ? 'inverse' : ''} ${cls}" aria-labelledby="h-${id}" data-block="${id}">
      <header class="card-head"><h2 id="h-${id}">${esc(title)}${count != null ? ` <span class="chip" aria-label="${count} 项">${count}</span>` : ''}</h2><div class="tools">${st ? '' : tools}</div></header>
      ${inner}</section>`;
  }
  const topRow = (title, finding = '') => `<div class="top-row"><div><h1>${esc(title)}</h1>${finding ? `<p class="finding">${finding}</p>` : ''}</div>
    <div class="cluster">
      <button class="btn primary" type="button" data-action="create" aria-haspopup="menu" aria-expanded="false">${ic('plus')}新建 Create</button>
      <button class="icon-btn" type="button" data-action="search" aria-label="搜索">${ic('search')}</button>
      <button class="icon-btn" type="button" data-action="bell" aria-label="提醒${S.unread ? '，3 条未读' : ''}" aria-haspopup="dialog">${ic('bell')}${S.unread ? '<span class="dot-badge" aria-hidden="true"></span>' : ''}</button>
      <span class="avatar" aria-label="${esc(D.owner.name)}">${esc(D.owner.initial)}</span>
    </div></div>
    <p class="sample-line">示例数据：本页任务、文献、实验与工时均为演示内容。</p>`;
  const seg = (action, value, options, label) => `<div class="segmented" role="group" aria-label="${esc(label)}">${options.map(([v, l, icon]) => `<button type="button" data-action="${action}" data-value="${v}" aria-pressed="${v === value}"${icon ? ` aria-label="${esc(l)}"` : ''}>${icon ? ic(icon) : esc(l)}</button>`).join('')}</div>`;
  const tabs = (action, value, options, label) => `<div class="tabs" role="tablist" aria-label="${esc(label)}">${options.map(([v, l, n]) => `<button type="button" role="tab" data-action="${action}" data-value="${esc(v)}" aria-selected="${v === value}">${esc(l)}${n != null ? `<span class="n">${n}</span>` : ''}</button>`).join('')}<span class="tab-ind" aria-hidden="true"></span></div>`;
  const select = (action, value, options, label) => `<select class="select" data-action="${action}" aria-label="${esc(label)}">${options.map(([v, l]) => `<option value="${v}"${v === value ? ' selected' : ''}>${esc(l)}</option>`).join('')}</select>`;
  const pill = (status) => {
    const cls = { 已完成: 'pos', 已批注: 'pos', 已投稿: 'pos', 已逾期: 'neg', 运行中: '', 数据待清洗: 'warn', 写作中: '', 未开始: '', 暂停: '' }[status] ?? '';
    return `<span class="pill ${cls}">${esc(status)}</span>`;
  };
  const dueText = (d) => { const n = D.daysLeft(d); return n < 0 ? { t: `已逾期 ${-n} 天`, soon: true } : n === 0 ? { t: '今天截止', soon: true } : n === 1 ? { t: '明天截止', soon: true } : { t: `${md(d)} ${wd(d)}`, soon: false }; };

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
    title: '你好，林',
    render() {
      const w = D.weekTotal('this'), dr = D.draft(), days = D.daysLeft(dr.due);
      const finding = `${+D.TODAY.slice(0, 4)}年${md(D.TODAY)} ${wd(D.TODAY)} · 「${esc(dr.name)}」<b>${esc(dr.milestone)}还剩 ${days} 天</b>，本周科研 ${h1(w.research)}。<button type="button" class="tlink" data-nav="#/research/writing">打开初稿</button>`;
      return topRow(`你好，${D.owner.name}`, finding) + `<div class="grid">
        ${this.summary()}${this.weekly()}${this.month()}${this.goals()}${this.tasks()}${this.research()}${this.projects()}
      </div>`;
    },
    summary() {
      const pc = D.projectCounts();
      return block({ id: 'summary', cls: 'span-4 ov-summary', inverse: true, title: '总体概况',
        tools: `<button class="icon-btn" type="button" data-action="menu-summary" aria-label="总体概况菜单" aria-haspopup="menu">${ic('more')}</button>`,
        body: `<div class="figures"><div class="figure"><span class="v">${D.tasksDoneAllTime()}</span><span class="l">已完成任务<br>累计</span></div><span class="vrule" aria-hidden="true"></span>
          <div class="figure"><span class="v">${pc.paused}</span><span class="l">暂停<br>项目</span></div></div>
          <div class="tiles"><div class="tile dim"><span class="v">${pc.total}</span><span class="l">项目</span></div><div class="tile"><span class="v">${pc.active}</span><span class="l">进行中</span></div><div class="tile"><span class="v">${pc.done}</span><span class="l">已完成</span></div></div>`,
      });
    },
    weekly() {
      const wk = D.weeks[S.weekly], t = D.weekTotal(S.weekly);
      return block({ id: 'weekly', cls: 'span-4 ov-weekly', title: '本周进度',
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
      return block({ id: 'month', cls: 'span-4 ov-month', title: '本月进度',
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
      return block({ id: 'goals', cls: 'span-4 ov-goals', title: '本月目标', isEmpty: !D.goals.length && !S.goalsEdit,
        empty: `本月还没有目标，<button class="tlink" type="button" data-action="goal-edit">写下第一个</button>`,
        tools: `<span class="mini-ring"><svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true"><circle cx="14" cy="14" r="${r}" fill="none" stroke="var(--rule)" stroke-width="3"/><circle cx="14" cy="14" r="${r}" fill="none" stroke="var(--chart-1)" stroke-width="3" stroke-dasharray="${total ? (c * done) / total : 0} ${c}" transform="rotate(-90 14 14)" style="transition:stroke-dasharray ${T}ms ${EASE}"/></svg>${done}/${total}</span>
          <button class="icon-btn bare" type="button" data-action="goal-edit" aria-pressed="${S.goalsEdit}" aria-label="${S.goalsEdit ? '完成编辑' : '编辑目标'}">${ic(S.goalsEdit ? 'check' : 'edit')}</button>`,
        body: `<div class="list">${rows}</div>`,
      });
    },
    tasks() {
      const live = tasksInProgress();
      const card = (t) => { const d = dueText(t.due); return `<article class="task" data-key="${t.id}">
          <div class="top">${ic(t.icon, 'ticon')}<button class="icon-btn bare" type="button" data-action="task-menu" data-id="${t.id}" aria-label="「${esc(t.title)}」操作" aria-haspopup="menu">${ic('more')}</button></div>
          <h3>${esc(t.title)}</h3>${S.pinned.includes(t.id) ? '<span class="pinned-mark">已置顶</span>' : ''}
          <div class="foot"><span class="due ${d.soon ? 'soon' : ''}">${d.t}</span><button class="icon-btn" type="button" data-action="task-remind" data-id="${t.id}" aria-pressed="${!!t.remind}" aria-label="提醒「${esc(t.title)}」">${ic('bell')}</button></div></article>`; };
      const st = S.failed.has('tasks') ? 'error' : S.blockState;
      const body = st === 'loading' ? `<div class="skel"><div class="skeleton"></div><div class="skeleton"></div></div>`
        : st === 'error' ? `<div class="err" role="alert"><i></i><span>无法加载任务，最后更新 09:14。</span><button class="tlink" type="button" data-action="retry" data-id="tasks">重试</button></div>`
        : `<div class="task-row">${st === 'empty' ? '' : live.slice(0, 3).map(card).join('')}<button type="button" class="add-card" data-action="new" data-type="task"><span>${ic('plus')}${(st === 'empty' || !live.length) ? '没有进行中的任务，添加一个' : '添加任务'}</span></button></div>`;
      return `<section class="card bare span-8" aria-labelledby="h-tasks" data-block="tasks"><header class="card-head"><h2 id="h-tasks">进行中的任务 <span class="chip">${st === 'empty' ? 0 : live.length}</span></h2><div class="tools"><button type="button" class="card-link" data-nav="#/tasks?view=archive">打开归档</button></div></header>${body}</section>`;
    },
    research() {
      const lead = researchSorted()[0];
      return block({ id: 'research', cls: 'span-6', title: '科研进展', count: D.research.length,
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
      return block({ id: 'projects', cls: 'span-6', inverse: true, title: '最近项目',
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
    const live = D.tasks.filter((t) => t.state === '进行中');
    return live.sort((a, b) => (S.pinned.indexOf(b.id) > -1) - (S.pinned.indexOf(a.id) > -1) || a.due.localeCompare(b.due));
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
    const elapsedShare = (() => { const start = '2026-11-02', total = D.daysBetween(start, r.due), gone = D.daysBetween(start, D.TODAY); return gone / total; })();
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
    const ti = days.indexOf(D.TODAY);
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
      return topRow('研究概览', `初稿截止最近：${esc(first.name)} · ${md(first.due)}（还剩 ${D.daysLeft(first.due)} 天） <button type="button" class="tlink" data-nav="#/research/writing">打开写作</button>`) + `<div class="grid">
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
      return topRow('文献阅读', `本月已读 ${D.papersRead()} / ${D.papers.length} 篇，离「读完 8 篇论文」还差 ${D.papers.length - D.papersRead()} 篇。`) + `<div class="grid">
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
      return topRow('实验记录', `EXP-014 第 4 批运行中，第 4 批实验 ${md('2026-11-20')} 前完成。`) + `<div class="grid">
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
      return topRow('论文写作', `初稿还剩 ${C.fmt.int(D.manuscript.target - D.manuscript.words)} 字，${md(r.due)} 截止。`) + `<div class="grid">
        ${writingCard('span-8', true)}
        ${block({ id: 'writing-dates', cls: 'span-4', title: '截止日期', body: `<div class="list">${D.researchDates.filter((d) => d.research === 'r1' || !d.research).map((e) => `<div class="lrow" style="grid-template-columns:minmax(0,1fr) auto"><span>${esc(e.label)}<span class="small muted" style="display:block">${md(e.date)} ${wd(e.date)}</span></span><span class="r small muted num">${D.daysLeft(e.date)} 天后</span></div>`).join('')}</div>` })}
      </div>`;
    },
  };
  VIEWS['/research/data'] = {
    title: '数据与代码',
    render() {
      return topRow('数据与代码', `${D.datasets.filter((d) => d.kind === '数据集').length} 个数据集，${D.datasets.filter((d) => d.kind === '代码仓库').length} 个代码仓库。`) + `<div class="grid">
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
      return topRow('日历', `${md(days[0])}至${md(days[6])}，${evs.length} 项安排，其中科研 ${evs.filter((e) => e.research).length} 项。`) + `<div class="grid">
        ${block({ id: 'week', cls: 'span-12', title: `${md(days[0])} 至 ${md(days[6])}`,
          tools: `<button class="icon-btn bare" type="button" data-action="cal-week" data-value="-1" aria-label="上一周" ${S.calWeek <= -1 ? 'disabled' : ''}>${ic('chevl')}</button><button class="btn" type="button" data-action="cal-week" data-value="0" ${S.calWeek === 0 ? 'disabled' : ''}>本周</button><button class="icon-btn bare" type="button" data-action="cal-week" data-value="1" aria-label="下一周" ${S.calWeek >= 2 ? 'disabled' : ''}>${ic('chevr')}</button>`,
          body: `<div class="week" id="week-grid">${days.map((d) => { const w = new Date(d + 'T00:00:00').getDay(); const list = evs.filter((e) => e.date === d); return `<div class="col ${w === 0 || w === 6 ? 'we' : ''} ${d === D.TODAY ? 'today' : ''} ${list.length ? '' : 'hidden-m'}"><div class="dh">${wd(d)} ${md(d)}${d === D.TODAY ? ' · 今天' : ''}</div>${list.map((e) => `<div class="ev ${e.research ? 'res' : ''}"><span class="t">${e.time}</span><br>${esc(e.label)}</div>`).join('') || '<span class="small muted">—</span>'}</div>`; }).join('')}</div>` })}
      </div>`;
    },
  };

  // ---------- 我的任务 ----------
  VIEWS['/tasks'] = {
    title: '我的任务',
    enter(q) { const v = q.get('view'); if (v === 'archive') S.taskTab = '归档'; if (v === 'projects') S.taskTab = '项目'; },
    render() {
      const states = ['进行中', '待开始', '已完成', '归档'];
      const n = (s) => D.tasks.filter((t) => t.state === s).length;
      const isProj = S.taskTab === '项目';
      let rows = D.tasks.filter((t) => t.state === S.taskTab);
      rows.sort(S.taskSort === 'due' ? (a, b) => a.due.localeCompare(b.due) : (a, b) => b.created.localeCompare(a.created));
      const today = D.tasks.filter((t) => (t.state === '进行中' || t.state === '待开始') && D.daysLeft(t.due) <= 0);
      const thisWeek = D.tasks.filter((t) => (t.state === '进行中' || t.state === '待开始') && D.daysLeft(t.due) > 0 && t.due <= '2026-11-08');
      const taskLine = (t) => { const d = dueText(t.due); return `<div class="lrow" data-key="${t.id}" style="grid-template-columns:32px minmax(0,1fr) auto 44px">
        <button class="check" type="button" role="checkbox" aria-checked="${t.state === '已完成'}" data-action="task-done" data-id="${t.id}" aria-label="完成「${esc(t.title)}」" ${t.state === '归档' ? 'disabled' : ''}>${ic('check')}</button>
        <span class="ellipsis">${esc(t.title)}<span class="small muted" style="display:block">${esc(t.project)}</span></span>
        <span class="r due ${d.soon && t.state !== '已完成' ? 'soon' : ''}">${t.state === '已完成' ? md(t.due) : d.t}</span>
        <button class="icon-btn bare" type="button" data-action="task-menu" data-id="${t.id}" aria-label="「${esc(t.title)}」操作" aria-haspopup="menu">${ic('more')}</button></div>`; };
      const projLine = (p) => `<div class="lrow" data-key="${p.id}" style="grid-template-columns:minmax(0,1fr) auto 64px 28px"><span class="ellipsis">${esc(p.name)}<span class="small muted" style="display:block">截止 ${md(p.due)}</span></span>${pill(p.status)}<span class="r num small muted">${p.done}/${p.steps} 步</span>${ring28(p.done, p.steps, true)}</div>`;
      return topRow('我的任务', `进行中 ${n('进行中')} 项，待开始 ${n('待开始')} 项，本月已完成 ${n('已完成')} 项。`) + `<div class="grid">
        ${block({ id: 'tasklist', cls: 'span-8', title: isProj ? '全部项目' : S.taskTab, count: isProj ? D.projects.length : rows.length,
          tools: (isProj ? '' : select('task-sort', S.taskSort, [['due', '截止日期'], ['created', '创建时间']], '排序')) + `<button class="btn" type="button" data-action="new" data-type="${isProj ? 'project' : 'task'}">${ic('plus')}${isProj ? '新建项目' : '添加任务'}</button>`,
          body: `${tabs('task-tab', S.taskTab, [...states.map((s) => [s, s, n(s)]), ['项目', '项目', D.projects.length]], '任务分组')}
            <div class="list">${isProj ? D.projects.map(projLine).join('') : rows.length ? rows.map(taskLine).join('') : `<div class="empty">这里还没有任务。<button class="tlink" type="button" data-action="new" data-type="task">添加一个</button></div>`}</div>` })}
        ${block({ id: 'today', cls: 'span-4', title: '今天到期', count: today.length,
          body: `<div class="list">${today.length ? today.map((t) => `<div class="lrow" style="grid-template-columns:minmax(0,1fr)"><span>${esc(t.title)}<span class="small muted" style="display:block">${esc(t.project)}</span></span></div>`).join('') : '<div class="empty">今天没有到期的任务。</div>'}</div>
            <p class="small muted" style="margin-top:12px">本周日前还有 ${thisWeek.length} 项到期。</p>` })}
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
      return topRow('统计', `6月至11月，科研共 ${C.fmt.int(D.monthly.research.reduce((a, b) => a + b, 0))} h，工作共 ${C.fmt.int(D.monthly.work.reduce((a, b) => a + b, 0))} h。11月只含 1 至 6 日。`) + `<div class="grid">
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
      return topRow('文档', `${D.docs.length} 个文件，科研 ${D.docs.filter((d) => d.folder === '科研').length} 个，最近修改 ${md(rows[0]?.edited || D.TODAY)}。`) + `<div class="grid">
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
      return topRow('设置', `月度计划 工作 ${D.plan.work} h，科研 ${D.plan.research} h，个人 ${D.plan.personal} h。`) + `<div class="settings">
        <div class="set-sec"><div><h2>个人资料</h2><p>问候语和头像使用这里的称呼。</p></div>
          <form class="set-panel" data-form="profile"><div class="field"><label for="f-name">称呼</label><input class="input" id="f-name" name="name" value="${esc(D.owner.name)}" maxlength="8" required></div>
          <div class="actions"><span class="small muted" data-saved></span><button class="btn primary" type="submit">保存</button></div></form></div>
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

  // ======================= render =======================
  const view = $('#view');
  let lastPath = null;
  function render(opts = {}) {
    const { path, q } = currentRoute();
    const V = VIEWS[path];
    if (path !== lastPath && V.enter) V.enter(q);
    view.innerHTML = V.render();
    document.title = `${V.title} · 研台 Lab Desk`;
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
  const dueOptions = () => [D.TODAY, addDays(D.TODAY, 1), addDays(D.TODAY, 4), addDays(D.TODAY, 7), addDays(D.TODAY, 14)].map((d, i) => [d, ['今天', '明天', '', '', ''][i] ? `${['今天', '明天'][i]} · ${md(d)}` : `${md(d)} ${wd(d)}`]);
  const sel = (name, options, value) => `<select class="select" id="f-${name}" name="${name}" style="width:100%">${options.map(([v, l]) => `<option value="${esc(v)}"${v === value ? ' selected' : ''}>${esc(l)}</option>`).join('')}</select>`;
  const field = (label, name, inner) => `<div class="field"><label for="f-${name}">${label}</label>${inner}</div>`;
  const text = (name, value = '', req = true) => `<input class="input" id="f-${name}" name="${name}" value="${esc(value)}" ${req ? 'required' : ''} maxlength="60">`;
  const projectOpts = () => [['个人', '个人'], ...D.projects.map((p) => [p.name, p.name])];
  const FORMS = {
    task: { title: '新建任务', fields: (t = {}) => field('任务', 'title', text('title', t.title)) + field('截止', 'due', sel('due', dueOptions(), t.due)) + field('项目', 'project', sel('project', projectOpts(), t.project)),
      save(f, t) { if (t) Object.assign(t, { title: f.title, due: f.due, project: f.project }); else D.tasks.push({ id: 't' + Date.now(), title: f.title, due: f.due, project: f.project, state: '进行中', icon: 'doc', remind: false, created: D.TODAY }); return t ? '已更新任务' : '已添加任务'; } },
    project: { title: '新建项目', fields: () => field('项目名称', 'name', text('name')) + field('截止', 'due', sel('due', dueOptions(), addDays(D.TODAY, 14))) + field('步骤数', 'steps', `<input class="input num" id="f-steps" name="steps" type="number" min="1" max="30" value="5" required>`),
      save(f) { D.projects.unshift({ id: 'p' + Date.now(), name: f.name, status: '进行中', steps: +f.steps, done: 0, summary: '刚开始', updated: D.TODAY, due: f.due }); return '已新建项目'; } },
    note: { title: '新建笔记', fields: () => field('标题', 'title', text('title')) + field('内容', 'body', `<textarea class="input" id="f-body" name="body"></textarea>`),
      save(f) { D.docs.push({ id: 'doc' + Date.now(), name: `${f.title}.md`, folder: '个人', edited: D.TODAY, size: '1 KB' }); return '笔记已存入文档'; } },
    paper: { title: '添加文献', fields: () => field('标题', 'title', text('title')) + field('来源', 'venue', sel('venue', [['Preprint', 'Preprint'], ['Journal', 'Journal'], ['Workshop', 'Workshop'], ['Thesis', 'Thesis']], 'Preprint')) + field('项目', 'project', sel('project', D.research.map((r) => [r.name, r.name]), D.research[0].name)),
      save(f) { D.papers.push({ id: 'pa' + Date.now(), title: f.title, venue: f.venue, year: 2026, project: f.project, status: '待读', added: D.TODAY }); return '已加入阅读清单'; } },
    experiment: { title: '记一条实验', fields: () => field('名称', 'name', text('name')) + field('项目', 'project', sel('project', D.research.map((r) => [r.name, r.name]), D.research[1].name)) + field('设置', 'setup', `<textarea class="input" id="f-setup" name="setup"></textarea>`),
      save(f) { const n = 11 + D.experiments.length; D.experiments.unshift({ id: `EXP-0${n}`, name: f.name, project: f.project, status: '运行中', date: D.TODAY, setup: f.setup || '—', notes: '', result: '' }); return `已记录 EXP-0${n}`; } },
    research: { title: '新建研究项目', fields: () => field('项目名称', 'name', text('name')) + field('当前阶段', 'stage', sel('stage', D.STAGES.map((s, i) => [String(i), s]), '0')) + field('下一个里程碑', 'milestone', text('milestone')) + field('截止', 'due', sel('due', dueOptions(), addDays(D.TODAY, 14))),
      save(f) { D.research.push({ id: 'r' + Date.now(), name: f.name, stage: +f.stage, milestone: f.milestone, due: f.due, next: { label: '待定', due: addDays(f.due, 14) }, stageDates: ['待定', '待定', '待定', '待定'] }); D.researchDates.push({ date: f.due, label: f.milestone, research: true }); D.researchDates.sort((a, b) => a.date.localeCompare(b.date)); return '已新建研究项目'; } },
  };
  function openForm(type, opener, target) {
    const F = FORMS[type];
    const el = drawer(target ? '编辑任务' : F.title, `<form class="settings" style="gap:16px;display:grid;flex:1" novalidate>${F.fields(target)}<div class="actions"><button class="btn" type="button" data-close>取消</button><button class="btn primary" type="submit">保存</button></div></form>`, opener);
    el.querySelector('form').addEventListener('submit', (ev) => {
      ev.preventDefault();
      const fd = Object.fromEntries(new FormData(ev.target));
      const missing = [...ev.target.querySelectorAll('[required]')].find((i) => !String(i.value).trim());
      if (missing) { missing.focus(); missing.setAttribute('aria-invalid', 'true'); return; }
      const msg = F.save(fd, target);
      closeTop(); flip(() => rerender()); toast(msg);
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
      retry: () => { S.failed.delete(id); if (S.blockState) S.blockState = null; rerender(); },
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
      'task-remind': () => { const tk = D.tasks.find((x) => x.id === id); tk.remind = !tk.remind; a.setAttribute('aria-pressed', tk.remind); toast(tk.remind ? '截止前一天提醒你' : '已关闭提醒'); },
      'task-done': () => { const tk = D.tasks.find((x) => x.id === id); tk.state = tk.state === '已完成' ? '进行中' : '已完成'; flip(() => rerender()); toast(tk.state === '已完成' ? `已完成「${tk.title}」` : '已移回进行中'); },
      'task-menu': () => taskMenu(a, id),
      'paper-next': () => { const p = D.papers.find((x) => x.id === id); p.status = p.status === '待读' ? '在读' : '已批注'; if (p.status === '在读') Object.assign(p, { page: 1, pages: 12 }); if (p.status === '已批注') p.notes = 0; flip(() => rerender()); },
      'exp-open': () => expDrawer(a, id),
      'menu-summary': () => { const el = popover(a, `<button class="mi" role="menuitem" type="button" data-pop="export">导出概况 ${ic('download')}</button><button class="mi" role="menuitem" type="button" data-pop="all">查看全部项目 ${ic('chevr')}</button>`, { label: '总体概况' });
        el.addEventListener('click', (e) => { const k = e.target.closest('[data-pop]')?.dataset.pop; if (k === 'export') { closeTop(); const pc = D.projectCounts(); download('研台_总体概况.csv', `指标,数值\n已完成任务（累计）,${D.tasksDoneAllTime()}\n项目,${pc.total}\n进行中,${pc.active}\n已完成,${pc.done}\n暂停,${pc.paused}\n`); } if (k === 'all') { closeLayers(); location.hash = '#/tasks?view=projects'; } }); },
      'share-month': () => { const m = D.month(); const txt = `11月1日至6日：工作 ${m.work}/${D.plan.work} h，科研 ${m.research}/${D.plan.research} h，个人 ${m.personal}/${D.plan.personal} h（示例数据）`; (navigator.clipboard?.writeText(txt) || Promise.reject()).then(() => toast('已复制本月摘要'), () => toast(txt)); },
      'download-month': () => { const m = D.month(); download('研台_11月报告.csv', `类别,已用小时,计划小时,完成度\n工作,${m.work},${D.plan.work},${pct(m.work, D.plan.work)}%\n科研,${m.research},${D.plan.research},${pct(m.research, D.plan.research)}%\n个人,${m.personal},${D.plan.personal},${pct(m.personal, D.plan.personal)}%\n`); toast('已下载 11月报告'); },
      create: () => { const el = popover(a, [['task', '任务', 'tasks'], ['project', '项目', 'overview'], ['note', '笔记', 'doc'], ['paper', '文献', 'book'], ['experiment', '实验记录', 'flask']].map(([k, l, i]) => `<button class="mi" role="menuitem" type="button" data-pop="${k}"><span style="display:flex;gap:10px;align-items:center">${ic(i)}${l}</span></button>`).join(''), { label: '新建' });
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
    const k = { 'proj-sort': 'projSort', 'paper-sort': 'paperSort', 'task-sort': 'taskSort' }[a.dataset.action];
    if (k) flip(() => { S[k] = a.value; rerender(); $(`select[data-action="${a.dataset.action}"]`)?.focus(); });
  });
  document.addEventListener('submit', (ev) => {
    const f = ev.target.closest('[data-form]'); if (!f) return;
    ev.preventDefault();
    const fd = Object.fromEntries(new FormData(f));
    if (f.dataset.form === 'profile') { if (!fd.name.trim()) return; D.owner.name = fd.name.trim(); D.owner.initial = fd.name.trim().slice(0, 1); VIEWS['/overview'].title = `你好，${D.owner.name}`; }
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
    const tk = D.tasks.find((x) => x.id === id), pinned = S.pinned.includes(id);
    const el = popover(opener, `<button class="mi" role="menuitem" type="button" data-pop="pin">${pinned ? '取消置顶' : '置顶'} ${ic('pin')}</button><button class="mi" role="menuitem" type="button" data-pop="edit">编辑 ${ic('edit')}</button><button class="mi" role="menuitem" type="button" data-pop="del">删除 ${ic('trash')}</button>`, { label: '任务操作' });
    el.addEventListener('click', (e) => {
      const k = e.target.closest('[data-pop]')?.dataset.pop; if (!k) return;
      closeTop();
      if (k === 'pin') flip(() => { S.pinned = pinned ? S.pinned.filter((x) => x !== id) : [id, ...S.pinned]; rerender(); });
      if (k === 'edit') openForm('task', opener, tk);
      if (k === 'del') confirmDialog(`删除任务「${tk.title}」？`, '删除', () => { D.tasks.splice(D.tasks.indexOf(tk), 1); flip(() => rerender()); toast('已删除任务'); view.focus(); }, opener);
    });
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
      ...D.tasks.filter((t) => t.state !== '归档').map((t) => ({ l: t.title, s: '任务', to: '#/tasks' })),
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
  render();

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
    console.info('[研台] font check', report);
  });
})();

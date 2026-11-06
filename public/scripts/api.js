// Hzzz_0's workbench: the one place that talks to /api. Requests, errors and field mapping live here; app.js only sees
// plain objects and Chinese labels. Contract: docs/API.md (任务与项目, 生活区, 个人公司区).
(() => {
  // ---------- dates: "today" is always Asia/Shanghai ----------
  const dayFmt = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit' });
  const today = () => dayFmt.format(new Date());
  const addDays = (d, n) => new Date(Date.parse(d + 'T00:00:00Z') + n * 86400000).toISOString().slice(0, 10);
  const weekday = (d) => new Date(d + 'T00:00:00Z').getUTCDay();          // 0 = Sunday
  const sundayOf = (d) => addDays(d, (7 - weekday(d)) % 7);                // this week's Sunday (a Sunday is its own)
  const daysBetween = (a, b) => Math.round((Date.parse(b + 'T00:00:00Z') - Date.parse(a + 'T00:00:00Z')) / 86400000);
  const month = () => today().slice(0, 7);
  const addMonths = (m, n) => { const [y, mo] = m.split('-').map(Number), t = y * 12 + (mo - 1) + n; return `${Math.floor(t / 12)}-${String((t % 12) + 1).padStart(2, '0')}`; };

  // ---------- requests ----------
  class ApiError extends Error {
    constructor(status, code, message) { super(message); this.status = status; this.code = code; }
  }
  const FIELD = { title: '标题', area: '归属', projectId: '项目', due: '截止日期', date: '日期', kg: '体重', minutes: '睡眠时长', parts: '训练部位', part: '部位',
    category: '类别', amountCents: '金额', type: '收支类型', product: '产品', sourceUrl: '来源链接', observedOn: '观察日期', name: '名称', source: '来源' };
  function explain(status, body) {
    const e = body && body.error;
    if (e && e.code === 'INVALID_REQUEST') {
      const f = Object.keys(FIELD).find((k) => (e.message || '').includes(k));
      return f ? `${FIELD[f]}不符合要求` : e.message || '填写的内容不符合要求';
    }
    if (status === 404) return '这条记录已不存在，请刷新';
    if (e && e.message) return e.message;
    return status ? `服务暂时不可用（${status}）` : '无法连接到服务';
  }
  async function request(method, path, body) {
    let res;
    try {
      res = await fetch('/api' + path, { method, headers: body ? { 'Content-Type': 'application/json' } : {}, body: body ? JSON.stringify(body) : undefined, cache: 'no-store' });
    } catch {
      throw new ApiError(0, 'NETWORK', explain(0));
    }
    let data = null;
    try { data = await res.json(); } catch { /* empty or non-JSON body */ }
    if (!res.ok) throw new ApiError(res.status, data?.error?.code || 'HTTP', explain(res.status, data));
    return { data, status: res.status };
  }
  const get = async (p) => (await request('GET', p)).data;
  const send = async (m, p, b) => (await request(m, p, b || {})).data;
  const qs = (o) => { const s = new URLSearchParams(Object.entries(o).filter(([, v]) => v != null && v !== '')).toString(); return s ? '?' + s : ''; };
  const enc = encodeURIComponent;

  // ---------- field mapping ----------
  const STATE = { in_progress: '进行中', todo: '待开始', done: '已完成', archived: '归档' };
  const STATE_CODE = Object.fromEntries(Object.entries(STATE).map(([k, v]) => [v, k]));
  const AREA = { research: '科研', life: '生活', company: '公司', personal: '个人' };
  const PROJECT_STATUS = { active: '进行中', paused: '暂停', done: '已完成' };
  const LEAD_STATUS = { watching: '观察中', validating: '验证中', adopted: '已选定', dropped: '放弃' };
  const LEVEL = { unknown: '未知', low: '低', medium: '中', high: '高' };
  const REASON = { cycle: '按循环', manual: '手动指定', start: '第一次' };

  // a task as app.js uses it: state in Chinese (the existing views compare against 进行中 / 待开始 / 已完成 / 归档)
  const taskIn = (t) => ({ ...t, state: STATE[t.state] || t.state, areaLabel: AREA[t.area] || t.area });
  const taskOut = (t) => {
    const o = {};
    for (const k of ['title', 'area', 'projectId', 'due', 'remind', 'source']) if (k in t) o[k] = t[k];
    if ('state' in t) o.state = STATE_CODE[t.state] || t.state;
    return o;
  };
  const yuan = (cents) => cents / 100;
  const toCents = (v) => Math.round(Number(String(v).replace(/[,\s，]/g, '')) * 100);

  const API = {
    ApiError, today, addDays, sundayOf, daysBetween, month, addMonths, yuan, toCents,
    STATE, STATE_CODE, AREA, PROJECT_STATUS, LEAD_STATUS, LEVEL, REASON,

    tasks: {
      list: async (filter = {}) => (await get('/tasks' + qs(filter))).items.map(taskIn),
      create: async (t) => taskIn(await send('POST', '/tasks', taskOut(t))),
      update: async (id, patch) => taskIn(await send('PATCH', `/tasks/${enc(id)}`, taskOut(patch))),
      remove: (id) => send('DELETE', `/tasks/${enc(id)}`),
    },
    projects: {
      list: async (area) => (await get('/projects' + qs({ area }))).items,
      create: (p) => send('POST', '/projects', p),
    },
    life: {
      weights: async (range = {}) => (await get('/life/weights' + qs(range))).items,
      putWeight: async (date, kg, note = '') => { const r = await request('PUT', `/life/weights/${enc(date)}`, { kg, note }); return { row: r.data, created: r.status === 201 }; },
      deleteWeight: (date) => send('DELETE', `/life/weights/${enc(date)}`),
      weightWeekly: async (weeks = 8) => (await get('/life/weights/weekly' + qs({ weeks }))).items,
      sleep: async (range = {}) => (await get('/life/sleep' + qs(range))).items,
      putSleep: async (date, minutes, note = '') => { const r = await request('PUT', `/life/sleep/${enc(date)}`, { minutes, note }); return { row: r.data, created: r.status === 201 }; },
      deleteSleep: (date) => send('DELETE', `/life/sleep/${enc(date)}`),
      sleepWeekly: async (weeks = 8) => (await get('/life/sleep/weekly' + qs({ weeks }))).items,
      cycle: () => get('/life/training/cycle'),
      setCycle: (parts) => send('PUT', '/life/training/cycle', { parts }),
      sessions: async (range = {}) => (await get('/life/training/sessions' + qs(range))).items,
      addSession: (s) => send('POST', '/life/training/sessions', s),
      updateSession: (id, patch) => send('PATCH', `/life/training/sessions/${enc(id)}`, patch),
      deleteSession: (id) => send('DELETE', `/life/training/sessions/${enc(id)}`),
      plan: () => get('/life/training/plan'),
      setNext: (part) => send('PUT', '/life/training/next', { part }),
      clearNext: () => send('DELETE', '/life/training/next'),
    },
    company: {
      transactions: async (m) => (await get('/company/transactions' + qs({ month: m }))).items,
      addTransaction: (t) => send('POST', '/company/transactions', t),
      updateTransaction: (id, patch) => send('PATCH', `/company/transactions/${enc(id)}`, patch),
      deleteTransaction: (id) => send('DELETE', `/company/transactions/${enc(id)}`),
      summary: (m) => get('/company/finance/summary' + qs({ month: m })),
      monthly: async (from, to) => (await get('/company/finance/monthly' + qs({ from, to }))).items,
      leads: async (status) => (await get('/company/leads' + qs({ status }))).items,
      addLead: (l) => send('POST', '/company/leads', l),
      updateLead: (id, patch) => send('PATCH', `/company/leads/${enc(id)}`, patch),
      deleteLead: (id) => send('DELETE', `/company/leads/${enc(id)}`),
      leadTasks: async (id) => (await get('/tasks' + qs({ sourceType: 'lead', sourceId: id }))).items.map(taskIn),
    },
  };

  // a link only for http(s) addresses; anything else is shown as plain text by the caller
  API.safeUrl = (u) => { try { const x = new URL(String(u || '')); return x.protocol === 'http:' || x.protocol === 'https:' ? x.href : null; } catch { return null; } };

  window.API = API;
})();

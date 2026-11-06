// 研台 Lab Desk sample dataset. Every figure on screen is computed from these rows.
// All names, papers, experiments, dates and hours are illustrative sample data (示例数据).
(() => {
  const TODAY = '2026-11-06'; // Friday
  const DAY = 86400000;
  const daysBetween = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / DAY);

  const owner = { name: '林', initial: '林', hue: 214 };

  const STAGES = ['阅读', '实验', '写作', '投稿'];

  // research projects: stage = index of the current stage in STAGES
  const research = [
    { id: 'r1', name: '稀疏注意力检索', stage: 2, milestone: '初稿', due: '2026-11-18', next: { label: '导师反馈', due: '2026-11-25' }, project: 'p2',
      stageDates: ['9月1日至9月30日', '10月1日至11月1日', '11月2日至11月18日', '12月5日截止'] },
    { id: 'r2', name: '小样本分割基准', stage: 1, milestone: '第 4 批实验', due: '2026-11-20', next: { label: '结果汇总', due: '2026-11-27' }, project: 'p4',
      stageDates: ['9月15日至10月20日', '10月21日至11月20日', '待定', '待定'] },
    { id: 'r3', name: '多模态数据清洗工具', stage: 0, milestone: '综述框架', due: '2026-11-30', next: { label: '原型设计', due: '2026-12-14' }, project: 'p5',
      stageDates: ['10月26日至11月30日', '待定', '待定', '待定'] },
  ];

  const projects = [
    { id: 'p2', name: '稀疏注意力检索', status: '进行中', steps: 8, done: 5, summary: '文献综述；基线复现；路由层实验；消融实验；方法章节', updated: '2026-11-06', due: '2026-11-18' },
    { id: 'p1', name: '个人主页改版', status: '进行中', steps: 6, done: 3, summary: '配色与字体；首页结构；文案初稿', updated: '2026-11-05', due: '2026-11-28' },
    { id: 'p3', name: '年度阅读清单', status: '已完成', steps: 4, done: 4, summary: '书单；三次季度复盘', updated: '2026-11-04', due: '2026-10-31' },
    { id: 'p4', name: '小样本分割基准', status: '进行中', steps: 7, done: 3, summary: '数据划分；基线；前三批实验', updated: '2026-11-03', due: '2026-11-20' },
    { id: 'p5', name: '多模态数据清洗工具', status: '进行中', steps: 6, done: 1, summary: '需求梳理', updated: '2026-11-01', due: '2026-11-30' },
    { id: 'p6', name: '家庭记账整理', status: '进行中', steps: 5, done: 2, summary: '账户清单；十月对账', updated: '2026-10-30', due: '2026-12-10' },
    { id: 'p7', name: '课程助教材料', status: '已完成', steps: 5, done: 5, summary: '五次习题课讲义', updated: '2026-10-24', due: '2026-10-24' },
    { id: 'p8', name: '组会报告模板', status: '已完成', steps: 3, done: 3, summary: '版式；图表规范；示例页', updated: '2026-10-20', due: '2026-10-20' },
    { id: 'p9', name: '日语 N2 备考', status: '暂停', steps: 10, done: 4, summary: '词汇前四单元', updated: '2026-09-12', due: '2026-12-06' },
  ];

  // hours per day, Mon to Sun. null = not logged yet
  const weeks = {
    this: { label: '11月2日至8日', work: [6.5, 7, 5.5, 8, 4, null, null], research: [2, 3.5, 1.5, 4.5, 2.5, null, null] },
    last: { label: '10月26日至11月1日', work: [7, 6, 8, 7.5, 5, 1, 0], research: [1.5, 2, 3, 1, 2, 0.5, 1] },
  };

  // November so far (1 to 6 Nov). Sun 1 Nov belongs to last week's rows.
  const sun1Nov = { work: weeks.last.work[6], research: weeks.last.research[6] };
  const personalNov = 6;
  const plan = { work: 140, research: 60, personal: 30 };
  const octSamePeriodResearch = 11;

  const goals = [
    { id: 'g1', text: '提交组会报告', done: true },
    { id: 'g2', text: '读完 8 篇论文', done: false, progress: null }, // progress filled below from papers
    { id: 'g3', text: '完成文献综述框架', done: false },
    { id: 'g4', text: '跑完第 4 批实验', done: false },
  ];

  // tasks: state 进行中 / 待开始 / 已完成 / 归档
  const tasks = [
    { id: 't1', title: '回复导师关于实验设计的邮件', state: '进行中', due: '2026-11-06', project: '小样本分割基准', icon: 'mail', remind: true, created: '2026-11-04' },
    { id: 't2', title: '整理第 3 批实验数据', state: '进行中', due: '2026-11-07', project: '小样本分割基准', icon: 'flask', remind: false, created: '2026-11-04' },
    { id: 't3', title: '预约体检', state: '进行中', due: '2026-11-10', project: '个人', icon: 'heart', remind: true, created: '2026-11-02' },
    { id: 't4', title: '准备 11月11日 组会幻灯片', state: '待开始', due: '2026-11-10', project: '稀疏注意力检索', icon: 'doc', created: '2026-11-05' },
    { id: 't5', title: '写实验章节第 2 节', state: '待开始', due: '2026-11-12', project: '稀疏注意力检索', icon: 'doc', created: '2026-11-05' },
    { id: 't6', title: '核对十一月房租转账', state: '待开始', due: '2026-11-15', project: '家庭记账整理', icon: 'doc', created: '2026-11-03' },
    { id: 't7', title: '整理首页项目截图', state: '待开始', due: '2026-11-20', project: '个人主页改版', icon: 'doc', created: '2026-11-01' },
    { id: 't8', title: '下载多模态原始数据', state: '待开始', due: '2026-11-21', project: '多模态数据清洗工具', icon: 'flask', created: '2026-11-01' },
    ...['提交组会报告', '复现基线 B2', '修正路由层 bug', '读完第 5 篇论文', '更新简历', '整理 Zotero 标签', '回复合作者周的批注', '补交十月报销', '检查 EXP-012 日志', '写方法章节小结', '订下周组会会议室', '备份实验数据盘']
      .map((title, i) => ({ id: 'd' + (i + 1), title, state: '已完成', due: `2026-11-0${1 + (i % 6)}`, project: i % 3 ? '稀疏注意力检索' : '个人', icon: 'doc', created: '2026-10-28' })),
    { id: 'a1', title: '十月月度复盘', state: '归档', due: '2026-10-31', project: '个人', icon: 'doc', created: '2026-10-25' },
    { id: 'a2', title: '退回旧版数据集许可', state: '归档', due: '2026-10-18', project: '小样本分割基准', icon: 'doc', created: '2026-10-10' },
  ];

  // papers: illustrative titles only, no real publications
  const papers = [
    { id: 'pa1', title: 'Sparse retrieval with learned routing', venue: 'Preprint', year: 2025, project: '稀疏注意力检索', status: '在读', page: 7, pages: 14, added: '2026-11-03' },
    { id: 'pa2', title: 'Few-shot segmentation benchmarks revisited', venue: 'Workshop', year: 2024, project: '小样本分割基准', status: '已批注', notes: 12, added: '2026-10-28' },
    { id: 'pa3', title: 'Routing tokens for long-context attention', venue: 'Preprint', year: 2025, project: '稀疏注意力检索', status: '已批注', notes: 8, added: '2026-10-30' },
    { id: 'pa4', title: 'Cleaning noisy image–text pairs at scale', venue: 'Journal', year: 2023, project: '多模态数据清洗工具', status: '待读', added: '2026-11-05' },
    { id: 'pa5', title: 'Prototype calibration for few-shot masks', venue: 'Workshop', year: 2025, project: '小样本分割基准', status: '在读', page: 3, pages: 11, added: '2026-11-04' },
    { id: 'pa6', title: 'A survey of dataset deduplication', venue: 'Journal', year: 2024, project: '多模态数据清洗工具', status: '待读', added: '2026-11-06' },
    { id: 'pa7', title: 'Block-sparse kernels in practice', venue: 'Thesis', year: 2024, project: '稀疏注意力检索', status: '已批注', notes: 5, added: '2026-10-26' },
    { id: 'pa8', title: 'Label noise in segmentation benchmarks', venue: 'Preprint', year: 2025, project: '小样本分割基准', status: '待读', added: '2026-11-02' },
  ];

  const experiments = [
    { id: 'EXP-014', name: '第 4 批', project: '小样本分割基准', status: '运行中', date: '2026-11-06', setup: '5-shot，3 个随机种子，A100 × 2', notes: '第 2 个种子已跑完', result: '' },
    { id: 'EXP-013', name: '第 3 批', project: '小样本分割基准', status: '数据待清洗', date: '2026-11-04', setup: '1-shot，3 个随机种子', notes: '有 41 张掩码标注错位', result: '' },
    { id: 'EXP-012', name: '消融：去掉路由层', project: '稀疏注意力检索', status: '已完成', date: '2026-11-02', setup: '去掉路由层，其余同基线', notes: '召回明显下降', result: 'Recall@10 0.612 → 0.548' },
    { id: 'EXP-011', name: '基线复现', project: '稀疏注意力检索', status: '已完成', date: '2026-10-29', setup: '论文默认超参', notes: '与预印本报告值接近', result: 'Recall@10 0.612' },
  ];

  const manuscript = {
    research: 'r1', title: '稀疏注意力检索 初稿', words: 4820, target: 8000,
    sections: [
      { name: '引言', state: '已完成', words: 1150 },
      { name: '方法', state: '已完成', words: 2240 },
      { name: '实验', state: '写作中', words: 1430 },
      { name: '结论', state: '未开始', words: 0 },
    ],
    authors: [{ name: '林', hue: 214 }, { name: '周', hue: 34 }],
  };

  const researchDates = [
    { date: '2026-11-11', label: '组会' },
    { date: '2026-11-18', label: '初稿截止', research: 'r1' },
    { date: '2026-11-20', label: '第 4 批实验完成', research: 'r2' },
    { date: '2026-11-25', label: '导师反馈', research: 'r1' },
    { date: '2026-11-30', label: '综述框架', research: 'r3' },
    { date: '2026-12-05', label: '目标会议投稿截止（示例）' },
  ];

  const events = [
    { date: '2026-11-02', time: '09:30', label: '写作时段', research: true },
    { date: '2026-11-03', time: '15:00', label: '与周对批注', research: true },
    { date: '2026-11-04', time: '14:00', label: '组会', research: true },
    { date: '2026-11-05', time: '19:00', label: '羽毛球' },
    { date: '2026-11-06', time: '10:00', label: 'EXP-014 检查点', research: true },
    { date: '2026-11-07', time: '11:00', label: '家庭记账对账' },
    { date: '2026-11-08', time: '16:00', label: '每周复盘' },
    { date: '2026-11-10', time: '08:30', label: '体检预约' },
    { date: '2026-11-11', time: '14:00', label: '组会', research: true },
    { date: '2026-11-12', time: '09:30', label: '写作时段', research: true },
    { date: '2026-11-18', time: '23:59', label: '初稿截止', research: true },
    { date: '2026-11-20', time: '18:00', label: '第 4 批实验完成', research: true },
  ];

  const docs = [
    ['初稿_稀疏注意力检索_v6.docx', '科研', '2026-11-05', '412 KB'], ['实验记录_EXP-011至014.xlsx', '科研', '2026-11-06', '96 KB'],
    ['组会_11月4日.pptx', '科研', '2026-11-04', '3.1 MB'], ['文献综述大纲.md', '科研', '2026-11-02', '14 KB'],
    ['分割基准_数据划分.csv', '科研', '2026-10-30', '220 KB'], ['路由层推导.pdf', '科研', '2026-10-27', '1.2 MB'],
    ['审稿意见模板.docx', '科研', '2026-10-21', '38 KB'], ['数据许可说明.pdf', '科研', '2026-10-15', '540 KB'],
    ['十月账单.xlsx', '个人', '2026-11-01', '52 KB'], ['体检须知.pdf', '个人', '2026-10-31', '180 KB'],
    ['个人主页文案.md', '个人', '2026-11-05', '9 KB'], ['简历_2026.pdf', '个人', '2026-10-29', '210 KB'],
    ['旧版数据集许可.pdf', '归档', '2026-10-18', '330 KB'], ['九月复盘.md', '归档', '2026-10-01', '6 KB'],
  ].map(([name, folder, edited, size], i) => ({ id: 'doc' + (i + 1), name, folder, edited, size }));

  const datasets = [
    { key: 'ds-fewshot-v3', kind: '数据集', project: '小样本分割基准', size: '2.4 GB', updated: '2026-11-04' },
    { key: 'ds-retrieval-qa', kind: '数据集', project: '稀疏注意力检索', size: '860 MB', updated: '2026-10-29' },
    { key: 'ds-mm-raw', kind: '数据集', project: '多模态数据清洗工具', size: '11 GB', updated: '2026-11-01' },
    { key: 'sparse-route @ a3f9c21', kind: '代码仓库', project: '稀疏注意力检索', size: '—', updated: '2026-11-06' },
    { key: 'seg-bench @ 7d01e4b', kind: '代码仓库', project: '小样本分割基准', size: '—', updated: '2026-11-05' },
  ];

  // monthly totals, June to November (November is 1 to 6 Nov only)
  const months = ['6月', '7月', '8月', '9月', '10月', '11月'];
  const monthly = { work: [118, 96, 132, 128, 135, null], research: [42, 51, 38, 47, 52, null], tasks: [21, 18, 25, 23, 26, null] };

  const notifications = [
    { id: 'n1', text: '「回复导师关于实验设计的邮件」今天截止', when: '08:00' },
    { id: 'n2', text: 'EXP-014 第 2 个种子已跑完', when: '昨天 22:14' },
    { id: 'n3', text: '11月11日 14:00 组会', when: '周三提醒' },
  ];

  const tasksDoneBeforeNov = 174; // completed before 1 Nov

  // ---------- derived figures (one variable per fact) ----------
  const sum = (a) => a.reduce((s, v) => s + (v || 0), 0);
  const D = {
    TODAY, STAGES, owner, research, projects, weeks, plan, goals, tasks, papers, experiments, manuscript, researchDates, events, docs, datasets,
    months, monthly, notifications, personalNov, octSamePeriodResearch, daysBetween,
  };
  D.weekTotal = (k) => ({ work: sum(weeks[k].work), research: sum(weeks[k].research) });
  D.month = () => {
    const w = D.weekTotal('this');
    return { work: w.work + sun1Nov.work, research: w.research + sun1Nov.research, personal: personalNov };
  };
  D.projectCounts = () => ({
    total: projects.length,
    active: projects.filter((p) => p.status === '进行中').length,
    done: projects.filter((p) => p.status === '已完成').length,
    paused: projects.filter((p) => p.status === '暂停').length,
  });
  D.tasksDoneAllTime = () => tasksDoneBeforeNov + tasks.filter((t) => t.state === '已完成').length;
  D.paperCounts = () => ({
    todo: papers.filter((p) => p.status === '待读').length,
    reading: papers.filter((p) => p.status === '在读').length,
    annotated: papers.filter((p) => p.status === '已批注').length,
  });
  D.papersRead = () => papers.filter((p) => p.status !== '待读').length;
  D.daysLeft = (date) => daysBetween(TODAY, date);
  D.draft = () => research.find((r) => r.id === manuscript.research);
  monthly.work[5] = D.month().work;
  monthly.research[5] = D.month().research;
  monthly.tasks[5] = tasks.filter((t) => t.state === '已完成').length;

  // ---------- assertions: figures that must agree ----------
  const pc = D.projectCounts();
  console.assert(pc.total === 9 && pc.active + pc.done + pc.paused === pc.total, 'projects split', pc);
  console.assert(D.weekTotal('this').work === 31 && D.weekTotal('this').research === 14, 'this week hours');
  console.assert(D.month().research === D.weekTotal('this').research + 1 && D.month().research === 15, 'November research hours');
  console.assert(Math.round((D.month().work / plan.work) * 100) === 22 && Math.round((D.month().research / plan.research) * 100) === 25 && Math.round((personalNov / plan.personal) * 100) === 20, 'month ratios');
  console.assert(goals.filter((g) => g.done).length === 1 && goals.length === 4, 'goals 1/4');
  console.assert(tasks.filter((t) => t.state === '进行中').length === 3, 'tasks in progress');
  const pcs = D.paperCounts();
  console.assert(papers.length === 8 && pcs.todo === 3 && pcs.reading === 2 && pcs.annotated === 3 && D.papersRead() === 5, 'papers split');
  console.assert(sum(manuscript.sections.map((s) => s.words)) === manuscript.words && manuscript.target - manuscript.words === 3180, 'manuscript words');
  console.assert(D.daysLeft(D.draft().due) === 12, 'draft is 12 days away');
  console.assert(D.tasksDoneAllTime() === 186, 'tasks done all time');
  console.assert(docs.length === 14 && docs.filter((d) => d.folder === '科研').length === 8, 'docs split');
  research.forEach((r) => console.assert(researchDates.some((d) => d.date === r.due), 'research due date on calendar', r.id));

  window.DATA = D;
})();

import "./register.mjs";

const { openDigestDatabase } = await import("../lib/research-digests-db.ts");

const examples = [
  ["单细胞数据质量检查演示", "示例作者甲", "示例期刊：数据方法", "演示如何检查单细胞数据中的缺失值与批次差异。", "适合练习阅读数据质量报告，所有内容均为示例。"],
  ["蛋白质结构比较演示", "示例作者乙", "示例期刊：结构研究", "用虚构的数据展示两种蛋白质结构比较思路。", "帮助理解结构比较的基本问题，不能作为研究证据。"],
  ["科研文献检索策略演示", "示例作者丙", "示例期刊：信息检索", "展示关键词组合和筛选条件对检索结果的影响。", "可用于练习构建检索式和记录检索过程。"],
  ["基因表达可视化演示", "示例作者丁", "示例期刊：图形方法", "用示例表达矩阵说明图表选择与标注方式。", "适合练习检查坐标、单位和图例是否清楚。"],
  ["实验记录与复现演示", "示例作者戊", "示例期刊：开放研究", "展示示例实验的参数记录、版本标注与结果归档。", "可作为整理复现记录的练习材料。"],
];

const db = openDigestDatabase();
try {
  db.exec("BEGIN IMMEDIATE");
  try {
    // 此脚本重置本功能的全部示例条目及收藏状态。
    db.prepare("DELETE FROM research_digests").run();
    const insert = db.prepare(`
      INSERT INTO research_digests (
        id, date, position, title, authors, journal, publishedAt, doi, url, summaryZh, whyRelevant, saved
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const date of ["2026-11-05", "2026-11-04"]) {
      const day = date.replaceAll("-", "");
      examples.forEach(([title, author, journal, summaryZh, whyRelevant], index) => {
        const position = index + 1;
        insert.run(
          `dg_${day}_${position}`, date, position, `【示例】${title}`,
          JSON.stringify([author, "示例研究团队"]), journal, date,
          position === 5 ? null : `10.0000/example.${day}.${position}`,
          `https://example.org/research/${day}/${position}`, summaryZh, whyRelevant,
          Number(position === 1),
        );
      });
    }
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
  console.log("Seeded 10 example digests for 2026-11-05 and 2026-11-04; saved states reset.");
} finally {
  db.close();
}

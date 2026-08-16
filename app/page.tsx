"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import workbookDataJson from "./data/workbook-data.json";

type CellValue = string | number | boolean | null;
type SheetData = { address: string; values: CellValue[][]; formulas: CellValue[][] };
type WorkbookData = { generatedAt: string; sheets: Record<string, SheetData> };
type Requirement = {
  id: number;
  project: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  progress: number;
  progressNote: string;
  owner: string;
  createdAt: string;
  updatedAt: string;
};

const workbookData = workbookDataJson as unknown as WorkbookData;
const sheets = workbookData.sheets;

const sectionTabs = [
  ["solutions", "需求与解决方案"],
  ["followup", "复诊测试"],
  ["landing", "复诊落地路径"],
  ["companion", "陪伴测试"],
  ["anniversary", "周年庆UI"],
  ["requirements", "新增需求与进展"],
  ["raw", "全部表格"],
] as const;

function text(value: CellValue) {
  return value === null || value === undefined ? "" : String(value);
}

function displayProjectName(name: string) {
  return name === "物理治疗叫号系统" ? "物理治疗管理系统" : name;
}

function uniqueStrings(values: CellValue[]) {
  return [...new Set(values.map(text).filter(Boolean))];
}

function priorityClass(priority: string) {
  return priority === "P0" ? "priority p0" : priority === "P2" ? "priority p2" : "priority p1";
}

function statusClass(status: string) {
  if (status.includes("未生成") || status.includes("立即")) return "status danger";
  if (status.includes("核对") || status.includes("核验") || status.includes("测试") || status.includes("设计")) return "status warning";
  return "status stable";
}

function DataTable({ headers, rows, compact = false }: { headers: CellValue[]; rows: CellValue[][]; compact?: boolean }) {
  return (
    <div className="table-shell">
      <table className={compact ? "data-table compact" : "data-table"}>
        <thead><tr>{headers.map((header, index) => <th key={index}>{text(header) || `列${index + 1}`}</th>)}</tr></thead>
        <tbody>{rows.map((row, rowIndex) => <tr key={rowIndex}>{headers.map((_, colIndex) => <td key={colIndex}>{text(row[colIndex]) || "—"}</td>)}</tr>)}</tbody>
      </table>
    </div>
  );
}

function EditorialHeading({ index, eyebrow, title, description }: { index: string; eyebrow: string; title: string; description?: string }) {
  return (
    <div className="editorial-heading">
      <span className="chapter-index">{index}</span>
      <div><span className="eyebrow">{eyebrow}</span><h2>{title}</h2>{description && <p>{description}</p>}</div>
    </div>
  );
}

function RequirementsPanel({ projects }: { projects: CellValue[][] }) {
  const projectNames = projects.map((row) => displayProjectName(text(row[0])));
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [filter, setFilter] = useState("全部");
  const [form, setForm] = useState({ project: projectNames[0] || "其他", title: "", description: "", priority: "P1", owner: "" });

  useEffect(() => {
    let mounted = true;
    async function loadRequirements() {
      try {
        const response = await fetch("/api/requirements");
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || "读取失败");
        if (mounted) { setRequirements(payload.requirements ?? []); setMessage(""); }
      } catch (error) {
        if (mounted) setMessage(error instanceof Error ? error.message : "需求记录暂时无法读取");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    void loadRequirements();
    return () => { mounted = false; };
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setMessage("正在保存…");
    const response = await fetch("/api/requirements", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(form) });
    const payload = await response.json();
    if (!response.ok) return setMessage(payload.error || "保存失败");
    setRequirements((current) => [payload.requirement, ...current]);
    setForm((current) => ({ ...current, title: "", description: "", owner: "" }));
    setMessage("新需求已记录，可在右侧继续反馈进展。");
  }

  async function save(item: Requirement) {
    setMessage(`正在保存“${item.title}”的进展…`);
    const response = await fetch("/api/requirements", {
      method: "PATCH", headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: item.id, status: item.status, progress: item.progress, progressNote: item.progressNote, owner: item.owner, priority: item.priority }),
    });
    const payload = await response.json();
    if (!response.ok) return setMessage(payload.error || "进展保存失败");
    setRequirements((current) => current.map((row) => row.id === item.id ? payload.requirement : row));
    setMessage("进展已更新。");
  }

  const visible = requirements.filter((item) => filter === "全部" || item.status === filter);

  return (
    <section>
      <EditorialHeading index="06" eyebrow="NEW NEEDS" title="新增需求与进展" description="从现场问题进入需求池，再持续记录排期、验证与完成情况。" />
      <div className="requirements-grid">
        <form className="requirement-form panel" onSubmit={submit}>
          <div className="section-heading small"><div><span className="eyebrow">需求入口</span><h3>收集新的需求</h3></div></div>
          <label>所属项目<select value={form.project} onChange={(e) => setForm({ ...form, project: e.target.value })}>{[...projectNames, "其他"].map((name) => <option key={name}>{name}</option>)}</select></label>
          <label>需求标题<input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="例如：患者提前结束后仍生成未完成报告" /></label>
          <label>需求描述<textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="说明场景、问题、期望结果和验证方式" rows={5} /></label>
          <div className="form-row"><label>优先级<select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}><option>P0</option><option>P1</option><option>P2</option></select></label><label>负责人<input value={form.owner} onChange={(e) => setForm({ ...form, owner: e.target.value })} placeholder="待分配" /></label></div>
          <button className="primary-button" type="submit">记录需求</button>
          {message && <p className="form-message" role="status">{message}</p>}
        </form>

        <div className="requirement-list panel">
          <div className="section-heading small"><div><span className="eyebrow">进展反馈</span><h3>需求处理记录</h3></div><select aria-label="按状态筛选" value={filter} onChange={(e) => setFilter(e.target.value)}><option>全部</option><option>待评估</option><option>已排期</option><option>进行中</option><option>待验证</option><option>已完成</option></select></div>
          {loading ? <p className="empty-state">正在读取需求…</p> : visible.length === 0 ? <p className="empty-state">暂无记录。左侧新增后，将在这里持续反馈进展。</p> : visible.map((item) => (
            <article className="requirement-item" key={item.id}>
              <div className="requirement-top"><div><span className={priorityClass(item.priority)}>{item.priority}</span><span className="project-chip">{item.project}</span><h3>{item.title}</h3></div><span className="requirement-date">更新 {item.updatedAt?.slice(0, 10)}</span></div>
              {item.description && <p>{item.description}</p>}
              <div className="progress-line"><div className="progress-track"><span style={{ width: `${item.progress}%` }} /></div><strong>{item.progress}%</strong></div>
              <div className="form-row three"><label>状态<select value={item.status} onChange={(e) => setRequirements((all) => all.map((row) => row.id === item.id ? { ...row, status: e.target.value } : row))}><option>待评估</option><option>已排期</option><option>进行中</option><option>待验证</option><option>已完成</option></select></label><label>进度<input type="number" min="0" max="100" value={item.progress} onChange={(e) => setRequirements((all) => all.map((row) => row.id === item.id ? { ...row, progress: Number(e.target.value) } : row))} /></label><label>负责人<input value={item.owner} onChange={(e) => setRequirements((all) => all.map((row) => row.id === item.id ? { ...row, owner: e.target.value } : row))} /></label></div>
              <label>进展反馈<textarea rows={2} value={item.progressNote} onChange={(e) => setRequirements((all) => all.map((row) => row.id === item.id ? { ...row, progressNote: e.target.value } : row))} placeholder="记录已完成事项、阻碍和下一步" /></label>
              <button className="secondary-button" onClick={() => save(item)}>保存进展</button>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const [active, setActive] = useState<(typeof sectionTabs)[number][0]>("solutions");
  const [projectQuery, setProjectQuery] = useState("");
  const [rawSheet, setRawSheet] = useState("项目调研汇总");
  const [rawQuery, setRawQuery] = useState("");

  const summaryValues = sheets["项目调研汇总"].values;
  const projects = summaryValues.slice(8, 13);
  const landingValues = sheets["复诊落地方案"].values;
  const companionValues = sheets["陪伴测试明细"].values;
  const companionRows = companionValues.slice(7, 13);
  const companionDisplayRows: CellValue[][] = companionRows;
  const rawValues = sheets[rawSheet].values;
  const rawWidth = Math.max(...rawValues.map((row) => row.length));
  const rawRows = useMemo(() => rawValues.map((row, index) => ({ row, index })).filter(({ row }) => row.some((cell) => text(cell).toLowerCase().includes(rawQuery.toLowerCase()))), [rawValues, rawQuery]);

  function go(section: (typeof sectionTabs)[number][0]) {
    setActive(section);
    requestAnimationFrame(() => document.getElementById("workspace")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  const pathways = [
    { index: "01", tag: "P0 · FIRST", title: "医生端预检助手", copy: text(landingValues[7][1]), result: "先采集并生成结构化预诊信息，医生核对后开检查。", metric: "预诊字段准确度 · 医生修订量 · 核对用时" },
    { index: "02", tag: "P0 · FLOW", title: "全流程效率提升", copy: "在结构化病史后加入检查推荐草案，再串联医生核对、开检查、病例生成与后续随访。", result: "AI推荐检查并说明依据，医生确认后执行，减少重复询问与开检查决策时间。", metric: "问诊用时 · 推荐采纳率 · 门诊全流程时长" },
    { index: "03", tag: "P1 · ENTRY", title: "挂号小程序入口", copy: "患者挂号后进入小程序，在候诊前自愿完成信息采集，并随挂号记录进入医生端。", result: "把采集前置到候诊阶段，扩大覆盖但不设置强制门槛。", metric: "入口点击率 · 完成率 · 医生采用率" },
    { index: "04", tag: "P2 · LATER", title: "用药助手", copy: text(landingValues[10][1]), result: "待处方数据准确且经医生确认后，再提供患者端用药安排与安全提示。", metric: "处方一致率 · 理解度 · 错误反馈率" },
  ];

  const projectDashboards = [
    {
      index: "01", name: "晚星陪伴机器人", focus: true, visual: "ring", value: "2 / 3", label: "医护认可需求", visualRate: 66.7,
      need: "夜间陪伴需求已得到2/3医护认可，新增2名目标患者进入验证。", current: "既有3名患者均未持续10分钟；语音、ASR与承接感仍是主要退出点。", solution: "先修中文语音、ASR与首3分钟连接，再验证10分钟留存。",
      stats: [{ value: "8", label: "相关样本", rate: 100 }, { value: "0 / 3", label: "患者达10分钟", rate: 0 }, { value: "2", label: "新增患者待测", rate: 40 }],
    },
    {
      index: "02", name: "复诊机器人", focus: true, visual: "time", value: "−15 min", label: "原9例平均节省", visualRate: 78.6,
      need: "需求已被时间数据验证：原9例平均节省15分钟；新增2例病史整理再节省5分钟与3分钟。", current: "累计14例、11例有报告和用时；总体字段准确率仍缺医生逐字段审计，报告尚未输出检查推荐。", solution: "结构化问诊后生成检查推荐草案与依据，医生核对字段和推荐后直接开检查。",
      stats: [{ value: "14", label: "累计样本", rate: 100 }, { value: "11 / 14", label: "报告＋用时记录", rate: 78.6 }, { value: "2 / 2", label: "新例来源可追溯", rate: 100 }],
    },
    {
      index: "03", name: "Copilot系统", focus: true, visual: "flow", value: "2 场景", label: "门诊＋病房需求已验证", visualRate: 100,
      need: "门诊与病房两个场景的连续管理需求均已验证。", current: "药物变化缺少连续轨迹；检查结果人工写回，报告更新不及时。", solution: "电子服药卡记录变更并由医生核对；检查结果接入HIS自动同步。",
      stats: [{ value: "2", label: "已验证需求场景", rate: 100 }, { value: "1", label: "电子服药卡" }, { value: "1", label: "HIS检查链路" }],
    },
    {
      index: "04", name: "物理治疗管理系统", focus: true, visual: "queue", value: "2 层", label: "排队＋疗程管理", visualRate: 50,
      need: "双端排队、治疗次数与疗程管理的需求范围已经明确。", current: "实时队列尚未建立；治疗次数与疗程进度也缺少统一追踪。", solution: "患者/医护双端队列先落地，再按需求标准接入次数与疗程管理。",
      stats: [{ value: "2", label: "患者/医护端" }, { value: "3", label: "核心等待字段" }, { value: "2", label: "次数＋疗程维度" }],
    },
    {
      index: "05", name: "周年庆UI设计", focus: false, visual: "ui", value: "4", label: "体验模块", visualRate: 80,
      need: "院庆主页、能量卡与拍照打卡三类体验需求均已有可视化样稿。", current: "主视觉与活动列表已完成，正补齐能量卡和拍照打卡模块。", solution: "统一蓝金视觉、吉祥物与卡牌边框，形成完整活动体验链。",
      stats: [{ value: "2", label: "新增能量卡" }, { value: "1", label: "拍照打卡模块" }, { value: "1", label: "院庆活动主页" }],
    },
  ].map((item) => {
    const row = projects[Number(item.index) - 1];
    return { ...item, priority: text(row?.[5]), status: text(row?.[6]) };
  });
  const filteredProjects = projectDashboards.filter((item) => Object.values(item).join(" ").toLowerCase().includes(projectQuery.toLowerCase()));

  return (
    <main>
      <header className="hero">
        <div className="hero-orbit orbit-one" /><div className="hero-orbit orbit-two" />
        <div className="hero-copy">
          <span className="hero-kicker">八月第二周</span>
          <h1>AI解决方案进展<br /><em>＋</em>需求收集</h1>
          <div className="hero-actions"><button className="gold-button" onClick={() => go("solutions")}>查看解决方案</button><button className="ghost-button" onClick={() => go("requirements")}>提交新需求</button></div>
          <div className="hero-stats"><div><strong>05</strong><span>PROJECTS / 项目</span></div></div>
        </div>
        <aside className="hero-ledger" aria-label="项目目录"><span>FIELD NOTE / 08—W2</span>{projects.map((row, index) => <button key={text(row[0])} onClick={() => go("solutions")}><b>{String(index + 1).padStart(2, "0")}</b>{displayProjectName(text(row[0]))}</button>)}</aside>
      </header>

      <nav className="section-nav" aria-label="看板栏目">{sectionTabs.map(([id, label]) => <button key={id} className={active === id ? "active" : ""} onClick={() => go(id)}>{label}</button>)}</nav>

      <div id="workspace" className="workspace">
        {active === "solutions" && <section>
          <div className="heading-row"><EditorialHeading index="01" eyebrow="SOLUTIONS" title="需求与解决方案" description="先用数据回答需求是否被满足，再聚焦当前问题与下一步方案。重点项目为前四项。" /><label className="search-box">筛选项目<input value={projectQuery} onChange={(e) => setProjectQuery(e.target.value)} placeholder="输入项目或关键词" /></label></div>
          <div className="portfolio-strip"><div><strong>04</strong><span>重点项目</span></div><div><strong>14</strong><span>复诊累计样本</span></div><div><strong>11</strong><span>复诊完整用时</span></div><div><strong>08</strong><span>陪伴相关样本</span></div></div>
          <div className="solution-dashboard">{filteredProjects.map((item) => <article className={`project-dashboard ${item.focus ? "is-focus" : "is-secondary"}`} key={item.name}>
            <header className="project-dashboard-head"><div><span className="project-number">{item.index}</span><div><small>PROJECT / {item.focus ? "重点" : "UI"}</small><h3>{item.name}</h3></div></div><div><span className={priorityClass(item.priority)}>{item.priority}</span><span className={statusClass(item.status)}>{item.status}</span></div></header>
            <div className="project-dashboard-body">
              <div className={`project-visual visual-${item.visual}`}>
                <div className="project-ring" style={{ background: `conic-gradient(var(--gold) 0 ${item.visualRate}%, rgba(255,255,255,.12) ${item.visualRate}% 100%)` }}><div><strong>{item.value}</strong><span>{item.label}</span></div></div>
                <div className="project-mini-stats">{item.stats.map((stat) => <div key={stat.label}><header><strong>{stat.value}</strong><span>{stat.label}</span></header>{"rate" in stat && <div className="mini-track"><i style={{ width: `${Math.max(stat.rate ?? 0, 2)}%` }} /></div>}</div>)}</div>
              </div>
              <div className="project-story"><div className="need"><span>01 / 需求满足</span><p>{item.need}</p></div><div className="now"><span>02 / 当前问题</span><p>{item.current}</p></div><div className="solve"><span>03 / 下一步方案</span><p>{item.solution}</p></div></div>
            </div>
          </article>)}</div>
        </section>}

        {active === "followup" && <section>
          <EditorialHeading index="02" eyebrow="FOLLOW-UP TEST" title="复诊机器人：效率与准确度更新" description="累计14例，11例已有报告与用时记录；先看节约的就诊时间，再看准确度证据、问题和下一步效率方案。" />
          <div className="satisfaction-banner"><span>NEED SATISFIED / 需求满足</span><strong>机器人已能把问诊前置信息采集压缩到约10分钟，并形成可进入医生核对流程的结构化摘要。</strong><p>原9例平均节省15分钟；新增2例的病史整理时间平均再节省4分钟。</p></div>
          <div className="time-saved-feature"><div className="time-before"><span>医生常规预检</span><strong>15–30<small>min</small></strong></div><div className="time-reduction"><span>原9例总体结果</span><strong>−15 min</strong><b>每例平均节省</b></div><div className="time-after"><span>更新后机器人平均问诊</span><strong>9.8<small>min</small></strong></div><p>公开版仅展示汇总口径：11例完整记录的机器人平均问诊为9.8分钟。</p></div>
          <div className="metric-ribbon"><div><strong>14</strong><span>累计样本</span><small>汇总统计</small></div><div><strong>11 / 14</strong><span>报告＋用时记录</span><small>完整记录率78.6%</small></div><div><strong>9.8 min</strong><span>机器人平均问诊</span><small>按11例完整记录回算</small></div><div><strong>4 min</strong><span>新增样本平均病史节约</span><small>两例汇总均值</small></div></div>
          <div className="accuracy-dashboard">
            <div className="accuracy-intro"><span>ACCURACY / 准确度</span><strong>准确率是下一轮核心验收指标</strong><p>新增2例均具备来源标签，但“来源可追溯”不等于“临床字段准确”。</p></div>
            <div className="accuracy-signal verified"><strong>2 / 2</strong><span>新增记录来源可追溯</span><small>匿名汇总</small></div>
            <div className="accuracy-signal pending"><strong>待审计</strong><span>总体预诊字段准确率</span><small>医生确认字段 ÷ 全部已审字段</small></div>
          </div>
          <div className="followup-action-board"><article><span>02 / 当前问题</span><h3>准确率未形成医生审计结果</h3><p>报告生成率不能替代准确率；需逐字段记录确认、修改与缺失，并统计医生核对时间。</p></article><article><span>03 / 下一步方案</span><h3>加入检查推荐，继续压缩门诊流程</h3><p>机器人完成病史摘要后生成检查推荐草案与依据，医生核对后开检查，并记录推荐采纳率与总流程节约时间。</p></article></div>
          <div className="dataset-note"><strong>公开数据边界</strong><span>仅展示样本量、完整记录率、平均问诊用时、平均节约时间与来源可追溯率；不包含个案、年龄、病史字段或临床截图。</span></div>
        </section>}

        {active === "landing" && <section>
          <EditorialHeading index="03" eyebrow="IMPLEMENTATION" title="复诊落地路径" description="医生端预检助手先落地；新增检查推荐并由医生确认，继续压缩问诊到开检查的全流程时间。" />
          <div className="pathway-lead"><div><span>首要落地点</span><strong>医生端预检助手</strong></div><p>AI先采集、再生成病史摘要与检查推荐草案，医生核对后执行。验收重点是字段准确度、推荐采纳率、医生核对成本和全流程节约时间。</p></div>
          <div className="landing-efficiency-flow" aria-label="复诊效率闭环"><div><span>01</span><strong>结构化问诊</strong><small>平均9.8 min</small></div><i>→</i><div><span>02</span><strong>病史摘要</strong><small>来源可追溯</small></div><i>→</i><div className="recommended"><span>03</span><strong>检查推荐</strong><small>新增能力</small></div><i>→</i><div><span>04</span><strong>医生核对</strong><small>确认后执行</small></div></div>
          <div className="pathway-grid">{pathways.map((item) => <article key={item.index} className={item.index === "01" ? "pathway-card featured" : item.index === "02" ? "pathway-card efficiency" : "pathway-card"}><span className="pathway-index">{item.index}</span><small>{item.tag}</small><h3>{item.title}</h3><p>{item.copy}</p><b>{item.result}</b><footer>{item.metric}</footer></article>)}</div>
          <div className="measurement-grid"><div><span>预诊信息准确度</span><code>医生确认字段 / 全部已审字段</code></div><div><span>节省书写时间</span><code>常规书写时间 − AI辅助核对时间</code></div><div><span>检查推荐采纳率</span><code>医生确认推荐 / 已生成推荐</code></div><div><span>临床采用率</span><code>直接或轻修采用病例 / 已生成病例</code></div></div>
        </section>}

        {active === "companion" && <section>
          <EditorialHeading index="04" eyebrow="NIGHT COMPANION" title="晚星陪伴测试：样本扩展至8人" description="样本构成为患者5人、医护3人；其中既有实测6人，新增2名患者已纳入下一轮并保留待补录状态。" />
          <div className="companion-overview"><div className="donut-wrap"><div className="donut"><div><strong>8</strong><span>相关对象</span></div></div><div className="donut-legend"><span><i className="patient-dot" />患者 5人 · 62.5%</span><span><i className="staff-dot" />医护 3人 · 37.5%</span></div></div><div className="signal-board">
            <div><header><span>医护需求认可 / 愿继续试用</span><strong>2 / 3</strong></header><div className="signal-track"><i style={{ width: "66.7%" }} /></div><p>医护A认可需求价值，医护C支持患者小范围试用。</p></div>
            <div><header><span>既有患者达到10分钟</span><strong>0 / 3</strong></header><div className="signal-track"><i style={{ width: "2%" }} /></div><p>主要退出点集中在中文语音、ASR与对话承接。</p></div>
            <div><header><span>新增患者样本</span><strong>2</strong></header><div className="signal-track"><i style={{ width: "40%" }} /></div><p>已纳入下一轮，反馈尚未补录，不与既有实测结果混算。</p></div>
          </div></div>
          <div className="table-section"><h3>医护与患者测试反馈</h3><DataTable headers={companionValues[6]} rows={companionDisplayRows} /></div>
          <div className="table-section"><h3>夜间需求场景与解决方案</h3><DataTable headers={companionValues[16]} rows={companionValues.slice(17, 20)} /></div>
          <div className="judgment-callout">{uniqueStrings(companionValues[21]).join(" ")}</div>
        </section>}

        {active === "anniversary" && <section>
          <EditorialHeading index="05" eyebrow="ANNIVERSARY UI" title="周年庆UI与互动模块" description="活动主页、能量卡与拍照打卡采用同一套蓝金视觉语言。" />
          <div className="anniversary-gallery"><figure><Image unoptimized src="/assets/anniversary-ui-title-corrected.png" alt="标题为年少心中结、梓笙园中解的院庆活动网页设计稿" width={942} height={1669} /></figure><figure><Image unoptimized src="/assets/anniversary-ui-02.png" alt="院庆活动列表网页设计稿" width={942} height={1669} /></figure></div>
          <div className="ui-module-heading"><span>02 / ENERGY CARDS</span><h3>能量卡设计</h3><p>院庆限定与情绪接纳两类卡牌，保留青少年友好的轻叙事与收藏感。</p></div>
          <div className="energy-card-grid"><figure><Image unoptimized src="/assets/anniversary-energy-card-01.png" alt="二周年限定能量卡" width={942} height={1669} /><figcaption><span>院庆限定</span><strong>自爱置顶岛</strong></figcaption></figure><figure><Image unoptimized src="/assets/anniversary-energy-card-02.png" alt="接纳此刻的自己情绪能量卡" width={942} height={1669} /><figcaption><span>情绪接纳</span><strong>能量补给站</strong></figcaption></figure></div>
          <div className="ui-module-heading"><span>03 / PHOTO CHECK-IN</span><h3>拍照打卡模块</h3><p>选择照片或现场拍摄，套用院庆边框与兴趣标签，生成可保存的周年纪念卡。</p></div>
          <article className="photo-checkin-module"><figure className="photo-example"><div className="photo-example-label"><span>示例成片</span><b>INFJ · 平静</b></div><Image unoptimized src="/assets/anniversary-photo-checkin-example.png" alt="梓笙园二周年院庆拍照打卡成片示例" width={1003} height={1568} /><figcaption>人物照片 × 情绪标签 × 院庆边框</figcaption></figure><div className="photo-controls"><span>PHOTO ENERGY CARD</span><h3>生成你的院庆纪念卡</h3><ol><li><b>01</b>拍摄或选择照片</li><li><b>02</b>选择个性与情绪标签</li><li><b>03</b>生成并保存纪念卡</li></ol><div><button>现场拍摄</button><button>选择照片</button></div><small>示例展示 · 不会上传真实照片</small></div></article>
        </section>}

        {active === "requirements" && <RequirementsPanel projects={projects} />}

        {active === "raw" && <section>
          <div className="heading-row"><EditorialHeading index="07" eyebrow="SOURCE TABLES" title="全部表格" description="保留工作簿现有工作表的全部单元格内容；仅更新阅读样式，不改变原始事实口径。" /><label className="search-box">检索当前表<input value={rawQuery} onChange={(e) => setRawQuery(e.target.value)} placeholder="输入关键词" /></label></div>
          <div className="raw-tabs">{Object.keys(sheets).map((name) => <button key={name} className={rawSheet === name ? "active" : ""} onClick={() => setRawSheet(name)}>{name}</button>)}</div>
          <div className="raw-meta"><span>{rawSheet}</span><span>{sheets[rawSheet].address}</span><span>{rawRows.length} 行</span></div>
          <div className="table-shell raw-table"><table className="data-table compact"><thead><tr><th>行号</th>{Array.from({ length: rawWidth }, (_, index) => <th key={index}>{String.fromCharCode(65 + index)}</th>)}</tr></thead><tbody>{rawRows.map(({ row, index }) => <tr key={index}><th>{index + 1}</th>{Array.from({ length: rawWidth }, (_, col) => <td key={col}>{text(row[col]) || "—"}</td>)}</tr>)}</tbody></table></div>
        </section>}
      </div>
      <footer className="site-footer"><div><strong>AI解决方案进展＋需求收集</strong><span>八月第二周</span></div><p>公开汇报版 · 已移除临床原始截图与可识别明细。</p></footer>
    </main>
  );
}

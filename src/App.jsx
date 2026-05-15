import { useMemo, useState } from "react";
import {
  BrowserRouter,
  Navigate,
  NavLink,
  Outlet,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";

const menuSections = [
  {
    title: "业务运营",
    items: [
      { path: "/analysis", label: "用户行为分析", badge: "核心" },
      { path: "/review", label: "数据智能审核", badge: "28" },
      { path: "/topic", label: "专题发布管理" },
      { path: "/data", label: "标绘与轨迹管理" },
      { path: "/release-notes", label: "更新日志管理" },
      { path: "/feedback", label: "意见反馈管理" },
    ],
  },
  {
    title: "平台管理",
    items: [
      { path: "/ops", label: "日志与监控", badge: "3" },
      { path: "/system/users", label: "系统管理" },
    ],
  },
];

const analysisSummary = [
  { label: "活跃用户", value: "28,456", note: "较昨日 +8.5%" },
  { label: "新增用户", value: "4,218", note: "新用户占比 14.8%" },
  { label: "7日留存", value: "41.8%", note: "较上周 +3.2%" },
  { label: "人均停留时长", value: "4分45秒", note: "较上周 +15.2%" },
  { label: "搜索使用率", value: "71.3%", note: "活跃用户中触发过搜索" },
  { label: "闭环率", value: "89.2%", note: "纠错与反馈处理闭环占比" },
];

const activeProfileRows = [
  ["DAU", "28,456", "较昨日 +8.5%"],
  ["WAU", "96,214", "近 7 日活跃去重用户"],
  ["MAU", "318,560", "近 30 日活跃去重用户"],
  ["回访用户占比", "63.4%", "老用户仍是主活跃来源"],
];

const retentionRows = [
  ["D1 留存", "52.3%", "新用户次日继续打开应用"],
  ["D7 留存", "41.8%", "使用搜索、专题和地图浏览的留存更高"],
  ["D30 留存", "24.6%", "长期留存主要来自行业用户和高频搜索用户"],
];

const trendData = [
  { label: "03-27", dau: 52, newUsers: 21, avgDuration: 34 },
  { label: "03-28", dau: 66, newUsers: 27, avgDuration: 39 },
  { label: "03-29", dau: 61, newUsers: 24, avgDuration: 36 },
  { label: "03-30", dau: 78, newUsers: 33, avgDuration: 43 },
  { label: "03-31", dau: 86, newUsers: 37, avgDuration: 46 },
  { label: "04-01", dau: 80, newUsers: 31, avgDuration: 41 },
  { label: "04-02", dau: 92, newUsers: 35, avgDuration: 44 },
];

const featureUsageRows = [
  ["标绘", "18.6%", "94.1%", "6分12秒", "搜索结果进入最多"],
  ["导航", "22.4%", "76.8%", "8分04秒", "任务型路径最明显"],
  ["轨迹记录", "14.2%", "88.7%", "12分25秒", "巡检场景最典型"],
  ["空间分析", "9.8%", "81.4%", "5分33秒", "专题和工具栏带动明显"],
];

const featureSourceRows = [
  ["工具栏直达", "34.2%", "标绘和空间分析最常从工具栏启动"],
  ["搜索结果进入", "26.8%", "导航和标绘的主要任务入口"],
  ["专题详情进入", "18.1%", "空间分析和专题图层联动明显"],
  ["首页快捷入口", "12.7%", "公众用户更依赖快捷入口"],
  ["历史记录进入", "8.2%", "导航重访与轨迹回看用户占比"],
];

const funnelRows = [
  { step: "进入首页", users: "28,456", rate: "100%" },
  { step: "触发搜索入口", users: "20,281", rate: "71.3%" },
  { step: "进入搜索结果页", users: "16,924", rate: "59.5%" },
  { step: "打开专题详情或地图对象", users: "10,804", rate: "38.0%" },
  { step: "继续使用标绘 / 轨迹 / 反馈", users: "4,389", rate: "15.4%" },
];

const topicInterestRows = [
  ["汛期风险专题图", "29,843", "专题图层点击高峰出现在 9:00 - 11:00"],
  ["校园安全专题", "26,114", "教育行业用户访问占比高"],
  ["外业巡检图层", "21,205", "与轨迹记录行为关联明显"],
  ["历史影像比对", "18,764", "搜索导入用户比例最高"],
  ["景区导览专题", "16,990", "公众用户停留时长更长"],
];

const searchHotRows = [
  ["学校周边停车", "12,483", "18.6%", "2.4%"],
  ["防汛隐患点", "9,216", "14.3%", "4.8%"],
  ["历史影像比对", "7,884", "11.1%", "1.6%"],
  ["雨水井巡检", "6,341", "8.9%", "6.3%"],
  ["专题图层叠加", "5,987", "7.7%", "2.1%"],
];

const keywordCloud = [
  "学校周边停车",
  "防汛隐患点",
  "历史影像比对",
  "专题图层叠加",
  "应急避难点",
  "雨水井巡检",
  "校园安全专题",
  "城市更新影像",
  "离线底图下载",
  "轨迹回放",
  "工业园区标绘",
  "景区导览",
];

const screenHeatRows = [
  ["搜索页", "74.8%", "首页进入后的第一主路径"],
  ["搜索结果页", "61.1%", "搜索后继续浏览对象详情"],
  ["专题详情页", "22.7%", "探索频道与搜索结果双入口承接"],
  ["标绘提交页", "5.9%", "行业用户使用更集中"],
  ["意见反馈页", "3.6%", "问题反馈和建议行为的收口页"],
];

const searchCategoryRows = [
  ["专题图层", "34.6%", "汛期、校园安全、巡检专题搜索最集中"],
  ["标准地图", "22.8%", "政区图、线划图、标准底图访问稳定"],
  ["主题地图", "18.3%", "教育、文旅、应急主题关注更高"],
  ["多时相影像", "15.1%", "历史影像与更新比对需求明显"],
  ["POI / 地名", "9.2%", "导航和位置查询需求承接"],
];

const resourceClouds = [
  {
    title: "专题图层热词",
    words: ["汛期风险", "校园安全", "外业巡检", "景区导览", "城市更新"],
  },
  {
    title: "标准地图热词",
    words: ["湖北省地图", "武汉市地图", "江岸区", "江汉区", "政区版"],
  },
  {
    title: "主题地图热词",
    words: ["教育主题", "文旅热力", "应急保障", "农业监测", "产业分布"],
  },
  {
    title: "多时相影像热词",
    words: ["2024 影像", "历史对比", "建设前后", "季度更新", "变化检测"],
  },
];

const governanceSummary = [
  ["纠错提交量", "1,284", "近 30 日累计"],
  ["意见反馈量", "842", "近 30 日累计"],
  ["待处理总量", "126", "当前仍未闭环"],
  ["闭环率", "89.2%", "较上月 +6.1%"],
];

const governanceTrendRows = [
  { label: "03-27", correction: 28, feedback: 19, backlog: 24 },
  { label: "03-28", correction: 34, feedback: 22, backlog: 27 },
  { label: "03-29", correction: 31, feedback: 20, backlog: 29 },
  { label: "03-30", correction: 40, feedback: 24, backlog: 26 },
  { label: "03-31", correction: 44, feedback: 27, backlog: 23 },
  { label: "04-01", correction: 38, feedback: 21, backlog: 21 },
  { label: "04-02", correction: 36, feedback: 18, backlog: 18 },
];

const governanceRows = [
  ["离线地图问题", "31", "下载失败和解压失败仍是主要积压点"],
  ["专题图层问题", "17", "与图层切换和数据更新有关"],
  ["坐标偏移纠错", "23", "基础设施点位类问题最常见"],
  ["功能建议", "22", "以导出、筛选、回放增强为主"],
];

const insightBlocks = [
  {
    title: "当前判断",
    items: ["搜索仍是移动端最强入口", "专题浏览承接了大量二次行为", "标绘、导航、轨迹是最值得持续盯的生产能力"],
  },
  {
    title: "主要问题",
    items: ["无结果词仍反映数据缺口", "专题到空间分析的转化偏低", "离线地图相关反馈还在高位"],
  },
  {
    title: "建议动作",
    items: ["先补高频无结果数据", "优化专题详情到分析功能的引导", "优先清理离线地图与图层问题积压"],
  },
];

const reviewRows = [
  {
    id: "RV-2031",
    type: "纠错",
    title: "雨水井巡检点 A 坐标偏移",
    source: "公众用户",
    area: "江岸区",
    status: "待初审",
    priority: "高",
    time: "2026-05-15 09:42",
    summary: "用户附带现场照片，建议将点位向东南方向修正约 32 米。",
  },
  {
    id: "RV-2018",
    type: "标绘",
    title: "防汛封控区域线要素提交",
    source: "行业用户",
    area: "汉阳区",
    status: "待复审",
    priority: "中",
    time: "2026-05-15 08:10",
    summary: "新增临时封控线 1 条，附加两张巡检照片，待入正式库。",
  },
  {
    id: "RV-1994",
    type: "专题发布",
    title: "汛期风险专题上架申请",
    source: "专题运营组",
    area: "全省",
    status: "待终审",
    priority: "高",
    time: "2026-05-14 16:08",
    summary: "专题包含 4 个风险图层和 1 个说明页，待确认可见范围。",
  },
];

const topicRows = [
  ["TP-084", "汛期风险专题地图", "待终审", "专题运营组", "全省可见", "今天 10:20"],
  ["TP-081", "城市更新影像比对", "草稿", "测绘中心", "内部试用", "今天 08:55"],
  ["TP-077", "校园安全专题", "已发布", "教育行业组", "市级授权", "昨天 18:42"],
  ["TP-073", "旅游热力导览图", "定时发布", "文旅专题组", "公众可见", "昨天 14:03"],
];

const topicSteps = ["基础信息", "图层配置", "范围权限", "审核信息", "发布设置"];

const dataRows = [
  ["DT-301", "标绘", "雨水井点位 A", "基础设施", "已发布", "张颖", "2026-05-15"],
  ["DT-287", "轨迹", "防汛巡查轨迹 4 月 12 日", "安全巡查", "已归档", "陈帆", "2026-05-14"],
  ["DT-276", "纠错", "围栏破损线 B", "基础设施", "待处理", "系统同步", "2026-05-14"],
  ["DT-260", "专题", "校园安全专题", "教育", "已上线", "刘洋", "2026-05-13"],
];

const releaseNoteRows = [
  ["1.0.0", "Android", "天地图移动端试运行版", "已发布", "2026-04-08 17:00", "100"],
  ["1.0.1", "iOS", "专题图层与反馈优化", "待发布", "2026-05-20 10:00", "0"],
];

const feedbackRows = [
  ["其他问题", "如何查看账号授权入口", "user1010", "待处理", "2026-04-02 03:40:57"],
  ["功能建议", "希望支持轨迹导出 Excel", "user1007", "处理中", "2026-04-01 15:40:57"],
  ["地图建议", "专题图层切换时有明显卡顿", "user1008", "待处理", "2026-04-01 15:40:57"],
  ["BUG反馈", "离线底图下载失败", "user1005", "已处理", "2026-03-31 15:40:57"],
];

const serviceRows = [
  ["地图服务", "99.98%", "1.8x", "稳定"],
  ["搜索服务", "99.72%", "2.6x", "高峰"],
  ["标绘入库", "98.41%", "0.9x", "积压"],
  ["专题发布流", "99.36%", "1.2x", "正常"],
];

const logRows = [
  ["14:12:33", "INFO", "SearchCluster", "热门搜索统计任务执行完成，写入 4,182 条聚合记录。"],
  ["14:08:19", "WARN", "ReviewFlow", "标绘复审队列等待时间超过 37 分钟，触发提醒。"],
  ["14:03:06", "INFO", "PublishGate", "专题《校园安全专题》完成终审，进入定时发布队列。"],
  ["13:58:47", "ERROR", "TileGateway", "瓦片网关节点 gw-03 在 8 秒内出现 3 次超时重试。"],
];

const systemTabs = [
  { id: "users", label: "用户管理" },
  { id: "roles", label: "角色权限" },
  { id: "menus", label: "菜单管理" },
  { id: "dicts", label: "字典配置" },
  { id: "params", label: "系统参数" },
];

const systemTables = {
  users: {
    columns: ["账号", "姓名", "角色", "组织", "状态", "最后登录"],
    rows: [
      ["admin", "平台管理员", "超级管理员", "省级平台", "启用", "今天 14:02"],
      ["topic_op", "周玥", "专题运营", "专题运营组", "启用", "今天 10:31"],
      ["review_01", "林程", "审核员", "数据治理组", "启用", "今天 09:16"],
      ["ops_01", "赵航", "运维", "平台运维组", "停用", "昨天 18:52"],
    ],
    formTitle: "用户信息",
    formFields: ["账号", "姓名", "手机号", "所属组织", "角色", "状态"],
  },
  roles: {
    columns: ["角色编码", "角色名称", "数据范围", "用户数", "状态", "更新时间"],
    rows: [
      ["SUPER_ADMIN", "超级管理员", "全部", "2", "启用", "2026-05-12"],
      ["TOPIC_OP", "专题运营", "专题模块", "6", "启用", "2026-05-10"],
      ["REVIEWER", "审核员", "审核中心", "12", "启用", "2026-05-09"],
      ["OPS", "运维", "日志监控", "4", "启用", "2026-05-08"],
    ],
    formTitle: "角色配置",
    formFields: ["角色编码", "角色名称", "数据范围", "菜单权限", "按钮权限", "状态"],
  },
  menus: {
    columns: ["菜单名称", "路由", "类型", "上级菜单", "排序", "状态"],
    rows: [
      ["用户行为分析", "/analysis", "菜单", "-", "1", "启用"],
      ["数据智能审核", "/review", "菜单", "-", "2", "启用"],
      ["专题发布管理", "/topic", "菜单", "-", "3", "启用"],
      ["系统管理", "/system/users", "菜单", "-", "4", "启用"],
    ],
    formTitle: "菜单配置",
    formFields: ["菜单名称", "路由地址", "组件路径", "菜单类型", "排序", "状态"],
  },
  dicts: {
    columns: ["字典类型", "字典标签", "字典值", "排序", "状态", "备注"],
    rows: [
      ["review_status", "待初审", "pending_first", "1", "启用", "-"],
      ["review_status", "待复审", "pending_second", "2", "启用", "-"],
      ["topic_stage", "定时发布", "scheduled", "3", "启用", "-"],
      ["service_level", "高", "high", "1", "启用", "优先级"],
    ],
    formTitle: "字典项配置",
    formFields: ["字典类型", "字典标签", "字典值", "排序", "状态", "备注"],
  },
  params: {
    columns: ["参数键", "参数值", "分类", "是否内置", "状态", "更新时间"],
    rows: [
      ["review.timeout.minutes", "30", "审核", "是", "启用", "2026-05-12"],
      ["topic.publish.window", "18:00", "专题", "否", "启用", "2026-05-11"],
      ["search.hotwords.limit", "20", "搜索", "否", "启用", "2026-05-10"],
      ["log.retain.days", "180", "日志", "是", "启用", "2026-05-09"],
    ],
    formTitle: "参数配置",
    formFields: ["参数键", "参数值", "参数分类", "描述", "状态", "备注"],
  },
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/analysis" replace />} />
        <Route element={<AppLayout />}>
          <Route path="/analysis" element={<AnalysisPage />} />
          <Route path="/review" element={<ReviewPage />} />
          <Route path="/review/:reviewId" element={<ReviewDetailPage />} />
          <Route path="/topic" element={<TopicPage />} />
          <Route path="/data" element={<DataPage />} />
          <Route path="/data/:dataId" element={<DataDetailPage />} />
          <Route path="/release-notes" element={<ReleaseNotesPage />} />
          <Route path="/feedback" element={<FeedbackPage />} />
          <Route path="/ops" element={<OpsPage />} />
          <Route path="/system" element={<Navigate to="/system/users" replace />} />
          <Route path="/system/:tab" element={<SystemPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

function AppLayout() {
  const location = useLocation();
  const currentMeta = resolveRouteMeta(location.pathname);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-brand-mark">T</div>
          <div>
            <strong>天地图后台</strong>
            <span>Web Admin Platform</span>
          </div>
        </div>

        <nav className="menu-tree" aria-label="平台菜单">
          {menuSections.map((section) => (
            <div key={section.title} className="menu-section">
              <div className="menu-section-title">
                <span className="menu-section-line" />
                <span>{section.title}</span>
              </div>
              {section.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `menu-item ${isActive || location.pathname.startsWith(`${item.path}/`) ? "active" : ""}`
                  }
                >
                  <span>{item.label}</span>
                  {item.badge ? <em>{item.badge}</em> : null}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-card">
            <div className="user-avatar">管</div>
            <div className="user-meta">
              <strong>平台管理员</strong>
              <span>admin@tianditu.cn</span>
            </div>
            <button type="button" className="user-more">
              ···
            </button>
          </div>
        </div>
      </aside>

      <main className="main-panel">
        <header className="topbar">
          <div>
            <h1>{currentMeta.title}</h1>
            <span className="topbar-path">
              平台后台 / {currentMeta.parent ? `${currentMeta.parent} / ` : ""}
              {currentMeta.title}
            </span>
          </div>
          <div className="topbar-right">
            <div className="topbar-status">生产环境</div>
            <button type="button" className="primary-button">
              新建
            </button>
          </div>
        </header>
        <Outlet />
      </main>
    </div>
  );
}

function resolveRouteMeta(pathname) {
  if (pathname.startsWith("/review/")) {
    return { title: "审核详情", parent: "数据智能审核" };
  }
  if (pathname.startsWith("/data/")) {
    return { title: "数据详情", parent: "标绘与轨迹管理" };
  }
  if (pathname.startsWith("/system/")) {
    return { title: "系统管理", parent: "平台管理" };
  }
  const flat = menuSections.flatMap((section) =>
    section.items.map((item) => ({
      path: item.path,
      title: item.label,
      parent: section.title,
    })),
  );
  return flat.find((item) => item.path === pathname) ?? { title: "用户行为分析", parent: "业务运营" };
}

function AnalysisPage() {
  return (
    <div className="page-content">
      <section className="stats-grid analysis-stats">
        {analysisSummary.map((item) => (
          <article key={item.label} className="stat-card">
            <span>{item.label}</span>
            <strong>{item.value}</strong>
            <em>{item.note}</em>
          </article>
        ))}
      </section>

      <section className="content-grid analysis-main">
        <article className="panel">
          <div className="panel-header">
            <h2>总体活跃趋势</h2>
            <button type="button" className="text-button">
              DAU / 新增 / 时长
            </button>
          </div>
          <div className="grouped-trend-chart">
            {trendData.map((item) => (
              <div key={item.label} className="trend-group">
                <div className="trend-bars">
                  <div className="trend-bar dau" style={{ height: `${item.dau}%` }} />
                  <div className="trend-bar new" style={{ height: `${item.newUsers}%` }} />
                  <div className="trend-bar duration" style={{ height: `${item.avgDuration}%` }} />
                </div>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
          <div className="legend-row">
            <span><i className="legend-dot search" />DAU</span>
            <span><i className="legend-dot topic" />新增用户</span>
            <span><i className="legend-dot tool" />人均时长</span>
          </div>
        </article>

        <article className="panel">
          <div className="panel-header">
            <h2>总体活跃画像</h2>
            <button type="button" className="text-button">
              留存与回访
            </button>
          </div>
          <div className="metric-ribbon compact">
            {activeProfileRows.map(([name, value, meta]) => (
              <div key={name} className="metric-ribbon-item">
                <strong>{name}</strong>
                <div className="metric-ribbon-top">
                  <span>{value}</span>
                </div>
                <p>{meta}</p>
              </div>
            ))}
          </div>
          <div className="retention-grid">
            {retentionRows.map(([name, value, meta]) => (
              <div key={name} className="retention-card">
                <strong>{name}</strong>
                <span>{value}</span>
                <p>{meta}</p>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="content-grid analysis-main">
        <article className="panel">
          <div className="panel-header">
            <h2>核心功能使用分析</h2>
            <button type="button" className="text-button">
              使用率 / 完成率 / 时长
            </button>
          </div>
          <div className="feature-usage-grid">
            {featureUsageRows.map(([name, usage, complete, duration, note]) => (
              <div key={name} className="feature-card">
                <strong>{name}</strong>
                <div className="feature-metric">
                  <span>使用率 {usage}</span>
                  <span>完成率 {complete}</span>
                </div>
                <div className="progress-pair">
                  <div className="progress-line">
                    <div className="progress-fill primary" style={{ width: usage }} />
                  </div>
                  <div className="progress-line">
                    <div className="progress-fill success" style={{ width: complete }} />
                  </div>
                </div>
                <em>{duration}</em>
                <p>{note}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="panel">
          <div className="panel-header">
            <h2>功能入口来源</h2>
            <button type="button" className="text-button">
              值得埋点的来源关系
            </button>
          </div>
          <div className="ranking-list">
            {featureSourceRows.map(([name, value, note]) => (
              <div key={name} className="ranking-item">
                <div className="ranking-top">
                  <strong>{name}</strong>
                  <span>{value}</span>
                </div>
                <div className="ranking-track">
                  <div style={{ width: value }} />
                </div>
                <p>{note}</p>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="content-grid analysis-main">
        <article className="panel">
          <div className="panel-header">
            <h2>数据资源热度分析</h2>
            <button type="button" className="text-button">
              搜索词与分类偏好
            </button>
          </div>
          <div className="cloud-hero">
            {keywordCloud.map((word, index) => (
              <span key={word} className={`keyword-pill size-${(index % 4) + 1}`}>
                {word}
              </span>
            ))}
          </div>
          <div className="table-spacer">
            <SimpleTable
              columns={["检索分类", "占比", "说明"]}
              rows={searchCategoryRows}
            />
          </div>
        </article>

        <article className="panel">
          <div className="panel-header">
            <h2>热门数据分类型热度</h2>
            <button type="button" className="text-button">
              专题图层 / 标准地图 / 主题地图 / 多时相影像
            </button>
          </div>
          <div className="cloud-grid">
            {resourceClouds.map((group) => (
              <div key={group.title} className="cloud-panel">
                <strong>{group.title}</strong>
                <div className="keyword-cloud small">
                  {group.words.map((word, index) => (
                    <span key={word} className={`keyword-pill size-${(index % 3) + 1}`}>
                      {word}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="path-list compact">
            {screenHeatRows.map(([name, rate, note]) => (
              <div key={name} className="path-item">
                <div className="path-item-top">
                  <strong>{name}</strong>
                  <span>{rate}</span>
                </div>
                <div className="path-meter">
                  <div style={{ width: rate }} />
                </div>
                <em>{note}</em>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="content-grid analysis-main">
        <article className="panel">
          <div className="panel-header">
            <h2>纠错与反馈闭环分析</h2>
            <button type="button" className="text-button">
              处理量 / 积压量 / 改善趋势
            </button>
          </div>
          <div className="grouped-trend-chart compact">
            {governanceTrendRows.map((item) => (
              <div key={item.label} className="trend-group">
                <div className="trend-bars">
                  <div className="trend-bar correction" style={{ height: `${item.correction}%` }} />
                  <div className="trend-bar feedback" style={{ height: `${item.feedback}%` }} />
                  <div className="trend-bar backlog" style={{ height: `${item.backlog}%` }} />
                </div>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
          <div className="legend-row">
            <span><i className="legend-dot correction" />纠错提交</span>
            <span><i className="legend-dot feedback" />反馈提交</span>
            <span><i className="legend-dot backlog" />待处理积压</span>
          </div>
          <div className="metric-ribbon compact">
            {governanceSummary.map(([name, value, meta]) => (
              <div key={name} className="metric-ribbon-item">
                <strong>{name}</strong>
                <div className="metric-ribbon-top">
                  <span>{value}</span>
                </div>
                <p>{meta}</p>
              </div>
            ))}
          </div>
          <div className="table-spacer">
            <SimpleTable
              columns={["问题类型", "待处理", "说明"]}
              rows={governanceRows}
            />
          </div>
        </article>

        <article className="panel">
          <div className="panel-header">
            <h2>分析结论与优化建议</h2>
            <button type="button" className="text-button">
              基于移动端功能闭环
            </button>
          </div>
          <div className="insight-grid">
            {insightBlocks.map((block) => (
              <div key={block.title} className="insight-card">
                <strong>{block.title}</strong>
                <ul>
                  {block.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}

function ReviewPage() {
  const [page, setPage] = useState(1);
  const navigate = useNavigate();

  return (
    <div className="page-content">
      <section className="toolbar">
        <div className="toolbar-fields">
          <input className="input" placeholder="输入标题 / 单号 / 提交人" />
          <select className="select" defaultValue="全部类型">
            <option>全部类型</option>
            <option>纠错</option>
            <option>标绘</option>
            <option>专题发布</option>
          </select>
          <select className="select" defaultValue="全部状态">
            <option>全部状态</option>
            <option>待初审</option>
            <option>待复审</option>
            <option>待终审</option>
          </select>
          <button type="button" className="ghost-button">
            查询
          </button>
        </div>
      </section>

      <section className="content-grid single-column">
        <article className="panel">
          <div className="panel-header">
            <h2>审核列表</h2>
            <button type="button" className="text-button">
              批量审核
            </button>
          </div>
          <div className="table-shell selectable">
            <div className="table-row table-head cols-7-review">
              <span>单号</span>
              <span>类型</span>
              <span>标题</span>
              <span>来源</span>
              <span>状态</span>
              <span>提交时间</span>
              <span>操作</span>
            </div>
            {reviewRows.map((row) => (
              <div key={row.id} className="table-row cols-7-review">
                <span>{row.id}</span>
                <span>{row.type}</span>
                <span>{row.title}</span>
                <span>{row.source}</span>
                <span>{row.status}</span>
                <span>{row.time}</span>
                <span>
                  <button
                    type="button"
                    className="inline-button"
                    onClick={() => navigate(`/review/${row.id}`)}
                  >
                    查看详情
                  </button>
                </span>
              </div>
            ))}
          </div>
          <Pagination
            currentPage={page}
            totalPages={9}
            totalLabel="共 84 条"
            onChangePage={setPage}
          />
        </article>
      </section>
    </div>
  );
}

function ReviewDetailPage() {
  const { reviewId } = useParams();
  const navigate = useNavigate();
  const record = reviewRows.find((item) => item.id === reviewId) ?? reviewRows[0];

  return (
    <div className="page-content">
      <section className="toolbar">
        <div className="toolbar-fields">
          <button type="button" className="ghost-button" onClick={() => navigate("/review")}>
            返回列表
          </button>
        </div>
      </section>

      <section className="content-grid review-grid">
        <article className="panel">
          <div className="panel-header">
            <h2>{record.title}</h2>
            <button type="button" className="text-button">
              查看原始附件
            </button>
          </div>
          <div className="detail-grid compact">
            <InfoField label="单号" value={record.id} />
            <InfoField label="类型" value={record.type} />
            <InfoField label="来源" value={record.source} />
            <InfoField label="区域" value={record.area} />
            <InfoField label="状态" value={record.status} />
            <InfoField label="优先级" value={record.priority} />
          </div>
          <div className="rich-block">
            <span className="rich-label">问题摘要</span>
            <p>{record.summary}</p>
          </div>
          <div className="rich-block">
            <span className="rich-label">审核流程</span>
            <div className="timeline">
              <div className="timeline-item">
                <strong>提交</strong>
                <span>{record.time} · 已进入待审核池</span>
              </div>
              <div className="timeline-item">
                <strong>系统校验</strong>
                <span>已完成属性校验与坐标合法性检查</span>
              </div>
              <div className="timeline-item">
                <strong>人工审核</strong>
                <span>待当前管理员确认处理结果</span>
              </div>
            </div>
          </div>
        </article>

        <article className="panel">
          <div className="panel-header">
            <h2>审核操作</h2>
          </div>
          <div className="form-block">
            <label>审核意见</label>
            <textarea
              className="textarea"
              rows="6"
              defaultValue="核验影像与原始坐标后，可按用户提交位置修正。"
            />
          </div>
          <div className="form-block">
            <label>处理结果</label>
            <select className="select" defaultValue="审核通过">
              <option>审核通过</option>
              <option>退回补充</option>
              <option>驳回</option>
              <option>转人工复核</option>
            </select>
          </div>
          <div className="action-row">
            <button type="button" className="ghost-button">
              退回
            </button>
            <button type="button" className="primary-button">
              提交审核
            </button>
          </div>
        </article>
      </section>
    </div>
  );
}

function TopicPage() {
  const [page, setPage] = useState(1);

  return (
    <div className="page-content">
      <section className="toolbar">
        <div className="toolbar-fields">
          <input className="input" placeholder="输入专题名称" />
          <select className="select" defaultValue="全部状态">
            <option>全部状态</option>
            <option>草稿</option>
            <option>待终审</option>
            <option>定时发布</option>
            <option>已发布</option>
          </select>
          <button type="button" className="ghost-button">
            查询
          </button>
        </div>
      </section>

      <section className="content-grid review-grid">
        <article className="panel">
          <div className="panel-header">
            <h2>专题列表</h2>
            <button type="button" className="text-button">
              新建专题
            </button>
          </div>
          <SimpleTable
            columns={["专题编号", "专题名称", "状态", "负责人", "可见范围", "更新时间"]}
            rows={topicRows}
          />
          <Pagination
            currentPage={page}
            totalPages={6}
            totalLabel="共 24 条"
            onChangePage={setPage}
          />
        </article>

        <article className="panel">
          <div className="panel-header">
            <h2>发布表单</h2>
            <button type="button" className="text-button">
              保存草稿
            </button>
          </div>
          <div className="step-line">
            {topicSteps.map((step, index) => (
              <div key={step} className={`step-chip ${index < 3 ? "done" : ""}`}>
                {step}
              </div>
            ))}
          </div>
          <div className="form-grid">
            <div className="form-block">
              <label>专题名称</label>
              <input className="input" defaultValue="汛期风险专题地图" />
            </div>
            <div className="form-block">
              <label>可见范围</label>
              <select className="select" defaultValue="全省可见">
                <option>全省可见</option>
                <option>市级授权</option>
                <option>内部试用</option>
              </select>
            </div>
            <div className="form-block">
              <label>上架时间</label>
              <input className="input" defaultValue="2026-05-15 18:00" />
            </div>
            <div className="form-block">
              <label>审核人</label>
              <input className="input" defaultValue="终审管理员" />
            </div>
            <div className="form-block span-2">
              <label>发布说明</label>
              <textarea
                className="textarea"
                rows="5"
                defaultValue="包含 4 个风险图层，发布后同步到移动端探索频道。"
              />
            </div>
          </div>
          <div className="action-row">
            <button type="button" className="ghost-button">
              提交审核
            </button>
            <button type="button" className="primary-button">
              发布
            </button>
          </div>
        </article>
      </section>
    </div>
  );
}

function DataPage() {
  const [page, setPage] = useState(1);
  const navigate = useNavigate();

  return (
    <div className="page-content">
      <section className="toolbar">
        <div className="toolbar-fields">
          <input className="input" placeholder="资源名称 / 分类 / 提交人" />
          <select className="select" defaultValue="全部数据">
            <option>全部数据</option>
            <option>标绘</option>
            <option>轨迹</option>
            <option>纠错</option>
            <option>专题</option>
          </select>
          <select className="select" defaultValue="全部状态">
            <option>全部状态</option>
            <option>已发布</option>
            <option>已归档</option>
            <option>待处理</option>
            <option>已上线</option>
          </select>
          <button type="button" className="ghost-button">
            检索
          </button>
        </div>
      </section>

      <section className="content-grid single-column">
        <article className="panel">
          <div className="panel-header">
            <h2>数据列表</h2>
            <button type="button" className="text-button">
              批量导出
            </button>
          </div>
          <div className="table-shell selectable">
            <div className="table-row table-head cols-8">
              <span>编号</span>
              <span>类型</span>
              <span>名称</span>
              <span>分类</span>
              <span>状态</span>
              <span>维护人</span>
              <span>更新时间</span>
              <span>操作</span>
            </div>
            {dataRows.map((row) => (
              <div key={row[0]} className="table-row cols-8">
                {row.map((cell, index) => (
                  <span key={`${row[0]}-${index}`}>{cell}</span>
                ))}
                <span>
                  <button
                    type="button"
                    className="inline-button"
                    onClick={() => navigate(`/data/${row[0]}`)}
                  >
                    查看详情
                  </button>
                </span>
              </div>
            ))}
          </div>
          <Pagination
            currentPage={page}
            totalPages={5}
            totalLabel="共 20 条"
            onChangePage={setPage}
          />
        </article>
      </section>
    </div>
  );
}

function DataDetailPage() {
  const { dataId } = useParams();
  const navigate = useNavigate();
  const record = dataRows.find((item) => item[0] === dataId) ?? dataRows[0];

  return (
    <div className="page-content">
      <section className="toolbar">
        <div className="toolbar-fields">
          <button type="button" className="ghost-button" onClick={() => navigate("/data")}>
            返回列表
          </button>
        </div>
      </section>

      <section className="content-grid review-grid">
        <article className="panel">
          <div className="panel-header">
            <h2>{record[2]}</h2>
            <button type="button" className="text-button">
              编辑
            </button>
          </div>
          <div className="detail-grid compact">
            <InfoField label="编号" value={record[0]} />
            <InfoField label="类型" value={record[1]} />
            <InfoField label="分类" value={record[3]} />
            <InfoField label="状态" value={record[4]} />
            <InfoField label="维护人" value={record[5]} />
            <InfoField label="更新时间" value={record[6]} />
          </div>
          <div className="preview-map">
            <span>地图预览</span>
            <strong>{record[2]}</strong>
          </div>
        </article>

        <article className="panel">
          <div className="panel-header">
            <h2>编辑信息</h2>
          </div>
          <div className="form-grid">
            <div className="form-block">
              <label>经纬度</label>
              <input className="input" defaultValue="31.2304, 121.4737" />
            </div>
            <div className="form-block">
              <label>附件数</label>
              <input className="input" defaultValue="1" />
            </div>
            <div className="form-block span-2">
              <label>描述</label>
              <textarea
                className="textarea"
                rows="5"
                defaultValue="用于移动端标绘、轨迹与专题成果在后台统一检索和修订。"
              />
            </div>
          </div>
          <div className="action-row">
            <button type="button" className="ghost-button">
              下线
            </button>
            <button type="button" className="primary-button">
              保存修改
            </button>
          </div>
        </article>
      </section>
    </div>
  );
}

function ReleaseNotesPage() {
  const [page, setPage] = useState(1);

  return (
    <div className="page-content">
      <section className="toolbar">
        <div className="toolbar-fields">
          <input className="input" placeholder="搜索版本号、标题或摘要" />
          <input className="input compact" placeholder="版本号" />
          <select className="select" defaultValue="平台">
            <option>平台</option>
            <option>Android</option>
            <option>iOS</option>
          </select>
          <select className="select" defaultValue="状态">
            <option>状态</option>
            <option>已发布</option>
            <option>待发布</option>
          </select>
          <button type="button" className="ghost-button">
            重置
          </button>
          <button type="button" className="primary-button">
            新增日志
          </button>
        </div>
      </section>

      <section className="content-grid single-column">
        <article className="panel">
          <div className="panel-header">
            <h2>更新日志列表</h2>
          </div>
          <SimpleTable
            columns={["版本号", "平台", "标题", "状态", "发布时间", "用户量"]}
            rows={releaseNoteRows}
          />
          <Pagination
            currentPage={page}
            totalPages={1}
            totalLabel="共 2 条"
            onChangePage={setPage}
          />
        </article>
      </section>
    </div>
  );
}

function FeedbackPage() {
  const [page, setPage] = useState(1);

  return (
    <div className="page-content">
      <section className="toolbar">
        <div className="toolbar-fields">
          <input className="input" placeholder="搜索反馈内容、联系方式或用户 ID" />
          <select className="select" defaultValue="反馈类型">
            <option>反馈类型</option>
            <option>功能建议</option>
            <option>地图建议</option>
            <option>BUG反馈</option>
            <option>其他问题</option>
          </select>
          <select className="select" defaultValue="处理状态">
            <option>处理状态</option>
            <option>待处理</option>
            <option>处理中</option>
            <option>已处理</option>
          </select>
          <button type="button" className="ghost-button">
            查询
          </button>
        </div>
      </section>

      <section className="content-grid single-column">
        <article className="panel">
          <div className="panel-header">
            <h2>意见反馈列表</h2>
          </div>
          <SimpleTable
            columns={["反馈类型", "反馈内容", "用户 ID", "状态", "提交时间"]}
            rows={feedbackRows}
          />
          <Pagination
            currentPage={page}
            totalPages={6}
            totalLabel="共 55 条"
            onChangePage={setPage}
          />
        </article>
      </section>
    </div>
  );
}

function OpsPage() {
  return (
    <div className="page-content">
      <section className="stats-grid small">
        {serviceRows.map(([name, health, load, status]) => (
          <article key={name} className="stat-card">
            <span>{name}</span>
            <strong>{health}</strong>
            <em>
              {load} / {status}
            </em>
          </article>
        ))}
      </section>

      <section className="toolbar">
        <div className="toolbar-fields">
          <select className="select" defaultValue="全部服务">
            <option>全部服务</option>
            <option>地图服务</option>
            <option>搜索服务</option>
            <option>标绘入库</option>
            <option>专题发布流</option>
          </select>
          <select className="select" defaultValue="全部级别">
            <option>全部级别</option>
            <option>INFO</option>
            <option>WARN</option>
            <option>ERROR</option>
          </select>
          <button type="button" className="ghost-button">
            查询
          </button>
        </div>
      </section>

      <section className="content-grid two-one">
        <article className="panel">
          <div className="panel-header">
            <h2>系统日志</h2>
            <button type="button" className="text-button">
              下载日志
            </button>
          </div>
          <div className="table-shell">
            <div className="table-row table-head four">
              <span>时间</span>
              <span>级别</span>
              <span>来源</span>
              <span>内容</span>
            </div>
            {logRows.map((row) => (
              <div key={`${row[0]}-${row[2]}`} className="table-row four">
                <span>{row[0]}</span>
                <span className={`log-tag ${row[1].toLowerCase()}`}>{row[1]}</span>
                <span>{row[2]}</span>
                <span>{row[3]}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="panel">
          <div className="panel-header">
            <h2>告警时间线</h2>
            <button type="button" className="text-button">
              全部告警
            </button>
          </div>
          <div className="timeline">
            <div className="timeline-item">
              <strong>14:08</strong>
              <span>标绘复审队列等待时间超过阈值。</span>
            </div>
            <div className="timeline-item">
              <strong>13:58</strong>
              <span>TileGateway 节点 gw-03 出现超时重试。</span>
            </div>
            <div className="timeline-item">
              <strong>11:21</strong>
              <span>搜索集群自动扩容完成。</span>
            </div>
          </div>
        </article>
      </section>
    </div>
  );
}

function SystemPage() {
  const { tab = "users" } = useParams();
  const navigate = useNavigate();
  const current = systemTables[tab] ?? systemTables.users;

  return (
    <div className="page-content">
      <section className="tabbar">
        {systemTabs.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`tabbar-item ${tab === item.id ? "active" : ""}`}
            onClick={() => navigate(`/system/${item.id}`)}
          >
            {item.label}
          </button>
        ))}
      </section>

      <section className="content-grid review-grid">
        <article className="panel">
          <div className="panel-header">
            <h2>{systemTabs.find((item) => item.id === tab)?.label ?? "系统管理"}</h2>
            <button type="button" className="text-button">
              新增
            </button>
          </div>
          <SimpleTable columns={current.columns} rows={current.rows} />
        </article>

        <article className="panel">
          <div className="panel-header">
            <h2>{current.formTitle}</h2>
            <button type="button" className="text-button">
              重置
            </button>
          </div>
          <div className="form-grid">
            {current.formFields.map((field) => (
              <div key={field} className="form-block">
                <label>{field}</label>
                <input className="input" placeholder={`请输入${field}`} />
              </div>
            ))}
          </div>
          <div className="action-row">
            <button type="button" className="ghost-button">
              取消
            </button>
            <button type="button" className="primary-button">
              保存
            </button>
          </div>
        </article>
      </section>
    </div>
  );
}

function InfoField({ label, value }) {
  return (
    <div className="info-field">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function Pagination({ currentPage, totalPages, totalLabel, onChangePage }) {
  return (
    <div className="pagination">
      <span className="pagination-total">{totalLabel}</span>
      <div className="pagination-controls">
        <button
          type="button"
          className="page-button"
          disabled={currentPage === 1}
          onClick={() => onChangePage(Math.max(1, currentPage - 1))}
        >
          上一页
        </button>
        {Array.from({ length: Math.min(totalPages, 5) }, (_, index) => {
          const pageNumber = index + 1;
          return (
            <button
              key={pageNumber}
              type="button"
              className={`page-button ${currentPage === pageNumber ? "active" : ""}`}
              onClick={() => onChangePage(pageNumber)}
            >
              {pageNumber}
            </button>
          );
        })}
        <button
          type="button"
          className="page-button"
          disabled={currentPage === totalPages}
          onClick={() => onChangePage(Math.min(totalPages, currentPage + 1))}
        >
          下一页
        </button>
      </div>
    </div>
  );
}

function SimpleTable({ columns, rows }) {
  return (
    <div className="table-shell">
      <div className={`table-row table-head cols-${columns.length}`}>
        {columns.map((column) => (
          <span key={column}>{column}</span>
        ))}
      </div>
      {rows.map((row, index) => (
        <div key={`${row[0]}-${index}`} className={`table-row cols-${columns.length}`}>
          {row.map((cell, cellIndex) => (
            <span key={`${row[0]}-${cellIndex}`}>{cell}</span>
          ))}
        </div>
      ))}
    </div>
  );
}

export default App;

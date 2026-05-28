import { useState } from "react";
import hubeiHeatmapImage from "../../../imgs/hubei.png";

const topicMapImageModules = import.meta.glob("../../../imgs/主题地图/*.{png,jpg,jpeg,webp}", {
  eager: true,
  import: "default",
});

const resourceCloudImageModules = import.meta.glob("../../../imgs/cloud/*.{png,jpg,jpeg,webp}", {
  eager: true,
  import: "default",
});

const resourceCloudImageMap = Object.fromEntries(
  Object.entries(resourceCloudImageModules).map(([filePath, url]) => [
    filePath
      .split("/")
      .pop()
      .replace(/\.[^.]+$/, "")
      .replace(/词云-云朵版$/, ""),
    url,
  ]),
);

const analysisOverviewCards = [
  { label: "DAU", value: "3,128", note: "较昨日 +6.8%" },
  { label: "MAU", value: "2,864", note: "较上月 +12.4%" },
  { label: "留存率", value: "43.6%", note: "7日留存较上周 +2.1%" },
  { label: "软件下载量", value: "86,412", note: "本月累计较上月 +9.3%" },
  { label: "系统总用户量", value: "1,248,630", note: "累计注册较上月 +5.7%" },
];

const analysisTrendRanges = [
  { key: "7d", label: "7日" },
  { key: "30d", label: "30日" },
  { key: "1y", label: "一年" },
];

const analysisHotSearchRanges = [
  { key: "day", label: "日" },
  { key: "week", label: "周" },
  { key: "month", label: "月" },
];

const analysisUserGrowthSeries = {
  "7d": [
    { label: "05-13", value: 182 },
    { label: "05-14", value: 208 },
    { label: "05-15", value: 236 },
    { label: "05-16", value: 224 },
    { label: "05-17", value: 268 },
    { label: "05-18", value: 294 },
    { label: "05-19", value: 312 },
  ],
  "30d": [
    { label: "04-20", value: 146 },
    { label: "04-24", value: 162 },
    { label: "04-28", value: 174 },
    { label: "05-02", value: 188 },
    { label: "05-06", value: 214 },
    { label: "05-10", value: 228 },
    { label: "05-14", value: 257 },
    { label: "05-19", value: 312 },
  ],
  "1y": [
    { label: "2025-06", value: 1820 },
    { label: "2025-08", value: 2140 },
    { label: "2025-10", value: 2380 },
    { label: "2025-12", value: 2760 },
    { label: "2026-02", value: 3150 },
    { label: "2026-04", value: 3640 },
    { label: "2026-05", value: 4020 },
  ],
};

function buildAnalysisLineChart(series, width = 520, height = 292, paddingX = 28, paddingY = 18) {
  const maxValue = Math.max(...series.map((item) => item.value));
  const safeMax = Math.ceil(maxValue * 1.1);
  const plotWidth = width - paddingX * 2;
  const plotHeight = height - paddingY * 2;
  const stepX = series.length > 1 ? plotWidth / (series.length - 1) : 0;
  const baselineY = height - paddingY;

  const points = series.map((item, index) => {
    const x = paddingX + stepX * index;
    const y = baselineY - (item.value / safeMax) * plotHeight;
    return { ...item, x, y };
  });

  const linePath = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");

  const areaPath = [
    `M ${points[0]?.x ?? paddingX} ${baselineY}`,
    ...points.map((point) => `L ${point.x} ${point.y}`),
    `L ${points.at(-1)?.x ?? width - paddingX} ${baselineY}`,
    "Z",
  ].join(" ");

  const gridValues = Array.from({ length: 5 }, (_, index) => Math.round((safeMax * (4 - index)) / 4));

  return {
    width,
    height,
    paddingX,
    paddingY,
    baselineY,
    points,
    linePath,
    areaPath,
    gridValues,
  };
}

const analysisHotSearchTimeline = {
  day: {
    title: "当日热门功能",
    window: "近24小时",
    items: [
      { keyword: "搜索", heat: "4.8万次" },
      { keyword: "专题图层", heat: "4.1万次" },
      { keyword: "导航", heat: "3.7万次" },
      { keyword: "AI小助手", heat: "3.3万次" },
      { keyword: "主题地图", heat: "2.9万次" },
      { keyword: "标准地图", heat: "2.5万次" },
      { keyword: "标绘", heat: "2.2万次" },
      { keyword: "多时相影像", heat: "1.9万次" },
      { keyword: "轨迹记录", heat: "1.6万次" },
      { keyword: "空间分析", heat: "1.2万次" },
    ],
  },
  week: {
    title: "本周热门功能",
    window: "近7日",
    items: [
      { keyword: "搜索", heat: "28.6万次" },
      { keyword: "专题图层", heat: "24.3万次" },
      { keyword: "导航", heat: "22.1万次" },
      { keyword: "AI小助手", heat: "20.4万次" },
      { keyword: "主题地图", heat: "18.7万次" },
      { keyword: "标准地图", heat: "17.1万次" },
      { keyword: "标绘", heat: "15.8万次" },
      { keyword: "多时相影像", heat: "14.2万次" },
      { keyword: "轨迹记录", heat: "12.8万次" },
      { keyword: "空间分析", heat: "10.6万次" },
    ],
  },
  month: {
    title: "本月热门功能",
    window: "近30日",
    items: [
      { keyword: "搜索", heat: "118.4万次" },
      { keyword: "专题图层", heat: "103.6万次" },
      { keyword: "导航", heat: "96.2万次" },
      { keyword: "AI小助手", heat: "88.9万次" },
      { keyword: "主题地图", heat: "79.5万次" },
      { keyword: "标准地图", heat: "73.4万次" },
      { keyword: "标绘", heat: "68.8万次" },
      { keyword: "多时相影像", heat: "61.7万次" },
      { keyword: "轨迹记录", heat: "56.2万次" },
      { keyword: "空间分析", heat: "44.9万次" },
    ],
  },
};

const resourceClouds = [
  {
    title: "专题图层",
    image: resourceCloudImageMap["专题图层"],
    hasDownload: false,
    items: [
      { name: "防汛风险", views: "8.3万" },
      { name: "外业巡检", views: "6.7万" },
      { name: "校园安全", views: "5.1万" },
      { name: "城市更新", views: "4.5万" },
      { name: "景区导览", views: "3.8万" },
    ],
  },
  {
    title: "标准地图",
    image: resourceCloudImageMap["标准地图"],
    hasDownload: true,
    items: [
      { name: "武汉市地图", downloads: "2.1万", views: "12.6万" },
      { name: "湖北省地图", downloads: "1.8万", views: "10.3万" },
      { name: "基础底图", downloads: "1.5万", views: "9.8万" },
      { name: "行政区划", downloads: "1.2万", views: "8.7万" },
      { name: "江岸区", downloads: "0.9万", views: "6.4万" },
    ],
  },
  {
    title: "主题地图",
    image: resourceCloudImageMap["主题地图"],
    hasDownload: false,
    items: [
      { name: "文旅热力", views: "7.2万" },
      { name: "教育专题", views: "5.6万" },
      { name: "产业分布", views: "4.8万" },
      { name: "应急保障", views: "3.9万" },
      { name: "农业监测", views: "3.2万" },
    ],
  },
];

export default function AnalysisPage() {
  const [trendRange, setTrendRange] = useState("7d");
  const [hotSearchRange, setHotSearchRange] = useState("day");
  const trendSeries = analysisUserGrowthSeries[trendRange];
  const trendChart = buildAnalysisLineChart(trendSeries);
  const hotSearchGroup = analysisHotSearchTimeline[hotSearchRange];
  const totalUsersCard = analysisOverviewCards.find((item) => item.label === "系统总用户量");
  const downloadCard = analysisOverviewCards.find((item) => item.label === "软件下载量");
  const rightCards = analysisOverviewCards.filter((item) => item.label !== "系统总用户量" && item.label !== "软件下载量");

  return (
    <div className="page-content analysis-page">
      <section className="analysis-hero-dashboard">
        <article className="analysis-metric-stage">
          <div className="panel-header">
            <h2>数据概览</h2>
          </div>
          <div className="analysis-metric-split">
            <div className="analysis-metric-left">
              {totalUsersCard ? (
                <article className="stat-card analysis-stat-card analysis-stat-card--spotlight">
                  <div className="analysis-stat-kicker">核心用户资产</div>
                  <div className="analysis-stat-head">
                    <span>{totalUsersCard.label}</span>
                  </div>
                  <div className="analysis-stat-main">
                    <strong>{totalUsersCard.value}</strong>
                    <em>{totalUsersCard.note}</em>
                  </div>
                </article>
              ) : null}
              {downloadCard ? (
                <article className="stat-card analysis-stat-card analysis-stat-card--download">
                  <div className="analysis-stat-head">
                    <span>{downloadCard.label}</span>
                  </div>
                  <div className="analysis-stat-main">
                    <strong>{downloadCard.value}</strong>
                    <em>{downloadCard.note}</em>
                  </div>
                </article>
              ) : null}
            </div>
            <div className="analysis-metric-right">
              {rightCards.map((item) => (
                <article
                  key={item.label}
                  className={`stat-card analysis-stat-card analysis-stat-card--stack${item.label === "留存率" ? " analysis-stat-card--retention" : ""}`}
                >
                  <div className="analysis-stat-head">
                    <span>{item.label}</span>
                  </div>
                  <div className="analysis-stat-main">
                    <strong>{item.value}</strong>
                    <em>{item.note}</em>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </article>

        <article className="panel analysis-panel-trend analysis-hero-panel">
          <div className="panel-header">
            <h2>新增用户趋势</h2>
            <div className="analysis-range-switch" role="tablist" aria-label="新增用户趋势时间范围">
              {analysisTrendRanges.map((option) => (
                <button
                  key={option.key}
                  type="button"
                  className={`analysis-range-button${trendRange === option.key ? " active" : ""}`}
                  onClick={() => setTrendRange(option.key)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          <div className="analysis-trend-surface">
            <svg
              viewBox={`0 0 ${trendChart.width} ${trendChart.height}`}
              className="analysis-line-chart"
              role="img"
              aria-label="系统新增用户数量趋势折线图"
            >
              {trendChart.gridValues.map((value, index) => {
                const y =
                  trendChart.paddingY +
                  ((trendChart.height - trendChart.paddingY * 2) / (trendChart.gridValues.length - 1)) * index;

                return (
                  <g key={value}>
                    <line
                      x1={trendChart.paddingX}
                      y1={y}
                      x2={trendChart.width - trendChart.paddingX}
                      y2={y}
                      className="analysis-line-grid"
                    />
                    <text x="6" y={y + 4} className="analysis-line-grid-label">
                      {value}
                    </text>
                  </g>
                );
              })}

              <path d={trendChart.areaPath} className="analysis-line-area" />
              <path d={trendChart.linePath} className="analysis-line-path" />

              {trendChart.points.map((point) => (
                <g key={point.label}>
                  <circle cx={point.x} cy={point.y} r="4.5" className="analysis-line-point" />
                  <text x={point.x} y={trendChart.height - 4} textAnchor="middle" className="analysis-line-axis-label">
                    {point.label}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        </article>
      </section>

      <section className="analysis-map-band">
        <article className="panel analysis-panel-map analysis-hero-panel">
          <div className="panel-header">
            <h2>用户分布</h2>
          </div>
          <div className="analysis-map-band-layout">
            <div className="analysis-map-surface analysis-map-image-shell">
              <img className="analysis-map-image" src={hubeiHeatmapImage} alt="湖北省用户分布热力图" />
            </div>

            <aside className="analysis-hot-search-rail" aria-label="热门功能分析">
              <div className="analysis-hot-search-head">
                <div>
                  <strong>热门功能分析</strong>
                  <span>{hotSearchGroup.window}</span>
                </div>
                <div className="analysis-hot-search-tabs" role="tablist" aria-label="热门功能时间维度">
                  {analysisHotSearchRanges.map((option) => (
                    <button
                      key={option.key}
                      type="button"
                      className={`analysis-hot-search-tab${hotSearchRange === option.key ? " active" : ""}`}
                      onClick={() => setHotSearchRange(option.key)}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="analysis-hot-search-timeline">
                <div className="analysis-hot-search-group-head">
                  <em>{hotSearchGroup.items.length} 项功能</em>
                </div>
                <div className="analysis-hot-search-list">
                  {hotSearchGroup.items.map((item, index) => (
                    <div key={`${hotSearchRange}-${item.keyword}`} className="analysis-hot-search-group">
                      <div className="analysis-hot-search-marker analysis-hot-search-marker--group">
                        <i>{index + 1}</i>
                        {index < hotSearchGroup.items.length - 1 ? <span /> : null}
                      </div>
                      <div className="analysis-hot-search-group-body">
                        <div className="analysis-hot-search-entry">
                          <span>{item.keyword}</span>
                          <b>{item.heat}</b>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </article>
      </section>

      <section className="content-grid">
        <article className="panel">
          <div className="panel-header">
            <h2>数据资源热度</h2>
          </div>
          <div className="cloud-image-grid">
            {resourceClouds.map((group) => (
              <div key={group.title} className="cloud-image-card">
                <strong className="cloud-image-title">{group.title}</strong>
                <img className="cloud-image" src={group.image} alt={`${group.title}词云`} />
                <div className="cloud-keyword-list">
                  {group.items.map((item) => (
                    <div key={item.name} className="cloud-keyword-row">
                      <span className="cloud-keyword-name">{item.name}</span>
                      <span className="cloud-keyword-values">
                        {group.hasDownload ? (
                          <span className="cloud-keyword-val">
                            <em>下载</em>
                            <b>{item.downloads}</b>
                          </span>
                        ) : null}
                        <span className="cloud-keyword-val">
                          <em>查看</em>
                          <b>{item.views}</b>
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}

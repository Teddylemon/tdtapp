import { useEffect, useRef, useState } from "react";
import { CircleMarker, MapContainer, Polygon, Polyline, Popup, TileLayer, Tooltip, useMap } from "react-leaflet";
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
import "leaflet/dist/leaflet.css";
import MonitoringPageModule from "./modules/monitoring/MonitoringPage";
import ReleaseNotesManager from "./modules/release/ReleaseNotesManager";
import RoleManagementPageModule from "./modules/roles/RoleManagementPage";
import hubeiHeatmapImage from "../imgs/hubei.png";

const menuItems = [
  { path: "/analysis", label: "用户行为分析", icon: "analysis" },
  {
    path: "/review",
    label: "数据审核管理",
    icon: "review",
    children: [
      { path: "/review/corrections", label: "纠错审核" },
      { path: "/review/markers", label: "标注审核" },
    ],
  },
  { path: "/topic", label: "主题地图发布管理", icon: "topic" },
  { path: "/feedback", label: "意见反馈管理", icon: "feedback" },
  { path: "/release-notes", label: "更新日志管理", icon: "release" },
  { path: "/ops", label: "日志与监控", icon: "ops" },
  { path: "/system/users", label: "系统管理", icon: "system" },
];

const systemMenuEntry = menuItems.find((item) => item.path === "/system/users");
if (systemMenuEntry) {
  systemMenuEntry.label = "用户角色管理";
}

const topicMapImageModules = import.meta.glob("../imgs/主题地图/*.{png,jpg,jpeg,webp}", {
  eager: true,
  import: "default",
});

const resourceCloudImageModules = import.meta.glob("../imgs/cloud/*.{png,jpg,jpeg,webp}", {
  eager: true,
  import: "default",
});

const reviewImageModules = import.meta.glob("../imgs/*.{png,jpg,jpeg,webp}", {
  eager: true,
  import: "default",
});

const topicMapImageMap = Object.fromEntries(
  Object.entries(topicMapImageModules).map(([filePath, url]) => [
    filePath.split("/").pop().replace(/\.[^.]+$/, ""),
    url,
  ]),
);

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

const reviewImageMap = Object.fromEntries(
  Object.entries(reviewImageModules).map(([filePath, url]) => [
    filePath.split("/").pop().replace(/\.[^.]+$/, ""),
    url,
  ]),
);

const topicMapStorageKey = "tdt-topic-map-publish-status";
const reviewStorageKey = "tdt-mobile-submission-review-state";

const flattenedMenuItems = menuItems.flatMap((item) =>
  item.children ? [item, ...item.children] : [item],
);

const topicMapBaseRecords = [
  {
    id: "TM-001",
    name: "2026十堰马拉松",
    imageKey: "十堰2026马拉松赛事",
    description:
      "2026年十堰马拉松赛事动态比赛路线图。为参赛选手和观众提供了直观的赛道走向与地形参考，实时展示赛事相关的空间布局，是体育赛事与地理信息技术结合的典型应用。",
    status: "待审核",
    operator: "主题运营组",
    updatedAt: "2026-05-18 14:37",
  },
  {
    id: "TM-002",
    name: "祥马贺春",
    imageKey: "祥马贺春",
    description:
      "新春主题图鉴地图。它将生肖“马”的文化元素、传统新春祝福与地理场景相结合，通过可视化交互的形式向用户传递平安喜乐、万事顺遂的节日祝愿，属于文化互动类的主题地图。",
    status: "已下架",
    operator: "节庆内容组",
    updatedAt: "2026-05-18 14:38",
  },
  {
    id: "TM-003",
    name: "潜江市小龙虾全产业链动态分布图",
    imageKey: "潜江市小龙虾全产业链动态分布图",
    description:
      "潜江市的招牌产业——小龙虾动态地图，全面展示了从小龙虾养殖、加工、流通到餐饮消费的全产业链空间动态分布。它是利用大数据和GIS技术赋能地方特色农业经济、助力产业数字化转型的代表作。",
    status: "已上架",
    operator: "产业地图组",
    updatedAt: "2026-05-18 14:38",
  },
  {
    id: "TM-004",
    name: "鄂州市湖泊分布图",
    imageKey: "鄂州市湖泊分布图",
    description:
      "鄂州市湖泊分布图，呈现了“百湖之市”鄂州市境内的湖泊空间分布情况，清晰标注了各区域的核心水体。该地图不仅为公众提供了生态旅游和科普向导，也为当地的生态环境保护与水资源管理提供了直观的地理数据支持。",
    status: "待审核",
    operator: "生态专题组",
    updatedAt: "2026-05-18 14:39",
  },
  {
    id: "TM-005",
    name: "襄阳三国文化",
    imageKey: "襄阳三国文化",
    description:
      "襄阳三国文化地图。该地图将襄阳“三国文化”这一核心IP进行数字化地理呈现。地图串联了襄阳市内丰富的三国历史遗迹与故事发生地，为历史文化爱好者和游客提供了一条沉浸式的线上文化寻踪指南。",
    status: "已上架",
    operator: "文旅专题组",
    updatedAt: "2026-05-18 14:39",
  },
  {
    id: "TM-006",
    name: "数字中秋.云端团圆",
    imageKey: "数字中秋.云端团圆",
    description:
      "节日主题地图。它打破了地域限制，通过“云端团圆”的数字化场景，让用户在中秋佳节期间在线上进行文化互动、寄托思乡之情，实现了传统节日习俗的数字化表达。",
    status: "已下架",
    operator: "节庆内容组",
    updatedAt: "2026-05-18 14:39",
  },
  {
    id: "TM-007",
    name: "黄石公园分布图",
    imageKey: "黄石公园分布图",
    description:
      "黄石公园分布图。该地图详细盘点了黄石市内的各类公园绿地分布，包括铁山区、黄石港区、西塞山区、大冶市和阳新县等地的公园布局。它是市民休闲娱乐、绿色出行的“口袋指南”，同时也展现了黄石市城市生态文明建设的成果。",
    status: "待审核",
    operator: "城市治理组",
    updatedAt: "2026-05-18 14:39",
  },
  {
    id: "TM-008",
    name: "荆州中心城区景点",
    imageKey: "荆州中心城区景点",
    description:
      "荆州中心城区景点。该地图针对荆州市中心城区的旅游资源进行了精细化梳理，集中展示了古城及周边的核心旅游景点、历史名胜和人文景观，为前往荆州旅游的游客提供了高效、便捷的导览与路线规划服务。",
    status: "已上架",
    operator: "文旅专题组",
    updatedAt: "2026-05-18 14:39",
  },
  {
    id: "TM-009",
    name: "黄冈大别山红色旅游地图",
    imageKey: "黄冈大别山红色旅游地图",
    description:
      "黄冈大别山红色旅游地图。该地图依托黄冈大别山深厚的革命历史底蕴，将区域内的红色旅游景点、革命纪念馆及烈士陵园等红色资源串联成图。它为开展爱国主义教育、红色研学旅行提供了清晰的路线指引和空间参考。",
    status: "待审核",
    operator: "红色文旅组",
    updatedAt: "2026-05-18 14:39",
  },
  {
    id: "TM-010",
    name: "仙桃市文化场馆地图",
    imageKey: "仙桃市文化场馆地图",
    description:
      "仙桃市文化场馆地图。该应用全面收录了仙桃市内的图书馆、博物馆、文化馆等各类公共文化服务场馆的空间位置。通过一张图的形式方便市民快速查找身边的文化去处，有助于推动当地公共文化服务的普及与共享。",
    status: "已上架",
    operator: "公共服务组",
    updatedAt: "2026-05-18 14:40",
  },
  {
    id: "TM-011",
    name: "湖北省研学一张图",
    imageKey: "湖北省研学一张图",
    description:
      "湖北省研学一张图。这是一款面向教育与文旅融合的省级主题地图，集中展示了湖北省内的研学实践基地分布。地图整合了各地市的科普、历史、自然等研学资源，为学校、家长和教育机构规划研学旅行提供了全方位的数据支撑。",
    status: "待审核",
    operator: "研学专题组",
    updatedAt: "2026-05-18 14:40",
  },
  {
    id: "TM-012",
    name: "潜江市历史名人分布图",
    imageKey: "潜江市历史名人分布图",
    description:
      "潜江市历史名人分布图。该地图从人文地理的角度出发，梳理并标注了潜江历史名人的故里、纪念地或活动足迹。通过将历史人物与地理空间相结合，生动展示了潜江丰富的人文历史底蕴和地灵人杰的文化特色。",
    status: "已下架",
    operator: "人文专题组",
    updatedAt: "2026-05-18 14:40",
  },
  {
    id: "TM-013",
    name: "孝感市奥体中心实景三维",
    imageKey: "孝感市奥体中心实景三维",
    description:
      "孝感市奥体中心实体三维。该应用突破了传统二维地图的限制，采用了先进的三维建模技术，对孝感市奥体中心进行了高精度的实体三维重建。用户可以通过直观的立体视角鸟瞰场馆全貌及周边环境，是数字孪生和智慧场馆建设的基础应用。",
    status: "待审核",
    operator: "三维产品组",
    updatedAt: "2026-05-18 14:40",
  },
  {
    id: "TM-014",
    name: "汉川市古树名木分布图",
    imageKey: "汉川市古树名木分布图",
    description:
      "汉川市古树名木地图。该地图致力于汉川市的生态保护与历史传承，详细记录并定位了全市境内的古树名木。通过对这些“活文物”进行数字化建档与地图展示，增强了公众的生态保护意识，也为林业部门的精细化管理提供了依据。",
    status: "已上架",
    operator: "生态专题组",
    updatedAt: "2026-05-18 14:40",
  },
  {
    id: "TM-015",
    name: "十堰市汽车产业链布局",
    imageKey: "十堰市汽车产业链布局",
    description:
      "十堰市汽车产业链布局。作为著名的“车城”，十堰市的这张地图精准聚焦于当地的支柱产业——汽车工业。地图详细梳理了汽车产业链上下游企业的空间分布与园区布局，是服务于政府招商引资、企业产业协作以及区域经济分析的重要产业地图。",
    status: "待审核",
    operator: "产业地图组",
    updatedAt: "2026-05-18 14:41",
  },
].map((item) => ({
  ...item,
  thumbnail: topicMapImageMap[item.imageKey] ?? "",
}));

const analysisCards = [
  { label: "DAU", value: "28,456", note: "较昨日 +8.5%" },
  { label: "新增用户", value: "4,218", note: "新用户占比 14.8%" },
  { label: "7日留存", value: "41.8%", note: "较上周 +3.2%" },
  { label: "人均时长", value: "4分45秒", note: "较上周 +15.2%" },
];

const trendData = [
  { label: "03-27", dau: 54, add: 22, duration: 31 },
  { label: "03-28", dau: 68, add: 28, duration: 38 },
  { label: "03-29", dau: 62, add: 24, duration: 35 },
  { label: "03-30", dau: 80, add: 33, duration: 42 },
  { label: "03-31", dau: 88, add: 37, duration: 46 },
  { label: "04-01", dau: 83, add: 31, duration: 40 },
  { label: "04-02", dau: 92, add: 35, duration: 44 },
];

const analysisOverviewCards = [
  { label: "DAU", value: "31,284", note: "较昨日 +6.8%" },
  { label: "MAU", value: "286,410", note: "较上月 +12.4%" },
  { label: "留存率", value: "43.6%", note: "7日留存较上周 +2.1%" },
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

const featureCards = [
  {
    name: "标绘",
    usage: "18.6%",
    complete: "94.1%",
    duration: "6分12秒",
    note: "搜索结果和地图工具栏是最主要入口。",
  },
  {
    name: "导航",
    usage: "22.4%",
    complete: "76.8%",
    duration: "8分04秒",
    note: "任务型使用特征最明显，起终点选择最集中。",
  },
  {
    name: "轨迹记录",
    usage: "14.2%",
    complete: "88.7%",
    duration: "12分05秒",
    note: "巡检和外业场景使用更集中。",
  },
  {
    name: "空间分析",
    usage: "9.8%",
    complete: "81.4%",
    duration: "5分03秒",
    note: "专题详情和工具栏联动最明显。",
  },
];

const sourceRows = [
  ["工具栏直达", "34.2%", "标绘和空间分析更依赖主动触发"],
  ["搜索结果进入", "26.8%", "导航与标绘的任务入口最强"],
  ["专题详情进入", "18.1%", "专题图层到分析功能仍有提升空间"],
  ["首页快捷入口", "12.7%", "公众用户更偏好快捷入口"],
  ["历史记录进入", "8.2%", "导航复访和轨迹回看更集中"],
];

const keywordCloud = [
  "学校周边停车",
  "防汛隐患点",
  "历史影像对比",
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
  },
  {
    title: "标准地图",
    image: resourceCloudImageMap["标准地图"],
  },
  {
    title: "主题地图",
    image: resourceCloudImageMap["主题地图"],
  },
  {
    title: "多时相影像",
    image: resourceCloudImageMap["多时相影像"],
  },
];

const governanceCards = [
  { label: "纠错提交量", value: "1,284", note: "近30日累计" },
  { label: "意见反馈量", value: "842", note: "近30日累计" },
  { label: "待处理总量", value: "126", note: "当前未闭环" },
  { label: "闭环率", value: "89.2%", note: "较上月 +6.1%" },
];

const governanceTrend = [
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
  ["专题图层问题", "17", "多与图层切换和数据更新相关"],
  ["坐标偏移纠错", "23", "基础设施点位类问题最常见"],
  ["功能建议", "22", "以导出、筛选、回放增强为主"],
];

const insightBlocks = [
  {
    title: "当前判断",
    items: [
      "搜索仍是移动端最强入口。",
      "专题浏览承接了大量二次行为。",
      "标绘、导航、轨迹是最值得持续跟的生产能力。",
    ],
  },
  {
    title: "主要问题",
    items: [
      "无结果搜索词仍反映出数据缺口。",
      "专题到空间分析的转化偏低。",
      "离线底图相关反馈仍在高位。",
    ],
  },
  {
    title: "建议动作",
    items: [
      "优先补齐高频无结果数据。",
      "优化专题详情到分析功能的引导。",
      "持续清理离线地图与图层问题积压。",
    ],
  },
];

const reviewBaseRecords = [
  {
    id: "RV-2031",
    module: "corrections",
    category: "纠错数据",
    title: "雨水井巡检点 A",
    description: "用户反馈当前点位偏移约 32 米，建议按现场井盖位置修正。",
    submitter: "张倩",
    submittedAt: "2026-05-15 09:42",
    area: "江岸区",
    status: "待审核",
    source: "移动端纠错",
    correctionType: "改地址",
    currentName: "雨水井巡检点 A",
    currentAddress: "江汉南路雨水井点位口中山路 188 号",
    currentCoordinate: "30.6031, 114.3148",
    nextCoordinate: "30.6034, 114.3152",
    currentCoordinateLabel: "30.6031, 114.3148",
    nextCoordinateLabel: "30.6034, 114.3152",
    detailNote: "现场井盖位于路口东南侧，现网坐标偏到绿化带内。",
    summary: "附带现场定位点和补充说明，建议进入在线更新平台修正基础点位。",
    reviewedAt: "-",
    platformUpdatedAt: "-",
    reviewComment: "",
  },
  {
    id: "RV-2027",
    module: "corrections",
    category: "纠错数据",
    title: "围栏破损线 B",
    description: "用户反馈该对象已拆除，不应继续在移动端展示。",
    submitter: "黄睿",
    submittedAt: "2026-05-15 08:26",
    area: "汉阳区",
    status: "审核通过待更新",
    source: "移动端纠错",
    correctionType: "不存在",
    currentName: "围栏破损线 B",
    currentAddress: "汉阳大道巡检围栏区段 B",
    currentCoordinate: "30.5492, 114.2051",
    currentCoordinateLabel: "30.5492, 114.2051",
    missingReason: "道路施工结束，临时围挡与封控线已全部拆除。",
    detailNote: "用户附带两张现场照片，运营确认对象确已不存在。",
    summary: "适合推送至在线更新平台，下线该条临时围栏数据。",
    reviewedAt: "2026-05-15 10:18",
    platformUpdatedAt: "-",
    reviewComment: "现场核验通过，建议同步下线线上对象。",
  },
  {
    id: "RV-2024",
    module: "corrections",
    category: "纠错数据",
    title: "雨水井巡检点 A",
    description: "用户申请将对象名称改为“雨水井巡检点南门点”。",
    submitter: "王茜",
    submittedAt: "2026-05-14 18:12",
    area: "武昌区",
    status: "审核不通过",
    source: "移动端纠错",
    correctionType: "改名称",
    currentName: "雨水井巡检点 A",
    currentAddress: "中南路巡检点位",
    currentCoordinate: "30.5434, 114.3358",
    currentCoordinateLabel: "30.5434, 114.3358",
    nextName: "雨水井巡检点南门点",
    detailNote: "名称变更依据不足，未提供统一命名说明。",
    summary: "已驳回，建议补充权威命名依据或现场铭牌照片后重新提交。",
    reviewedAt: "2026-05-15 09:06",
    platformUpdatedAt: "-",
    reviewComment: "命名变更依据不足，请补充统一命名或铭牌照片。",
  },
  {
    id: "RV-2018",
    module: "markers",
    category: "用户标注",
    title: "雨水井巡检隐患点 A",
    description: "用户新增隐患点位，附带现场图片与巡检备注。",
    submitter: "陈朗",
    submittedAt: "2026-05-15 08:10",
    area: "硚口区",
    status: "待审核",
    source: "移动端标注",
    markerType: "标点",
    markerStyle: "蓝色默认",
    markerCategory: "防汛巡检",
    markerCoordinates: ["31.2304, 121.4737"],
    markerGeometry: "point",
    markerRemark: "记录井盖破损情况与周边积水。",
    markerImage: reviewImageMap.biaohui ?? "",
    markerFolder: "根目录 / 默认",
    summary: "建议审核后同步至在线更新平台，补充移动端防汛隐患专题。",
    reviewedAt: "-",
    platformUpdatedAt: "-",
    reviewComment: "",
  },
  {
    id: "RV-2012",
    module: "markers",
    category: "用户标注",
    title: "学校北门积水区",
    description: "用户补充校园北门积水范围，建议纳入雨季隐患图层。",
    submitter: "刘洋",
    submittedAt: "2026-05-14 16:32",
    area: "洪山区",
    status: "审核通过待更新",
    source: "移动端标注",
    markerType: "标线",
    markerStyle: "橙色巡检线",
    markerCategory: "校园安全",
    markerCoordinates: ["30.5179, 114.3752", "30.5187, 114.3768", "30.5191, 114.3776"],
    markerGeometry: "line",
    markerRemark: "积水范围沿人行道延伸约 50 米，晚高峰更明显。",
    markerImage: reviewImageMap.biaohui ?? "",
    markerFolder: "校园安全 / 2026-05",
    summary: "已完成人工审核，待推送至在线更新平台补齐雨季巡检图层。",
    reviewedAt: "2026-05-15 09:58",
    platformUpdatedAt: "-",
    reviewComment: "标注内容完整，可同步到在线更新平台。",
  },
  {
    id: "RV-2006",
    module: "markers",
    category: "用户标注",
    title: "防汛封控区域",
    description: "用户新增半幅封控区域并标注临时绕行方向。",
    submitter: "何静",
    submittedAt: "2026-05-14 10:06",
    area: "蔡甸区",
    status: "已更新到在线更新平台",
    source: "移动端标注",
    markerType: "标面",
    markerStyle: "红色封控面",
    markerCategory: "应急保障",
    markerCoordinates: ["30.5810, 114.0291", "30.5821, 114.0302", "30.5814, 114.0316", "30.5802, 114.0304"],
    markerGeometry: "polygon",
    markerRemark: "封控时间预计持续 48 小时，已同步至在线更新平台。",
    markerImage: reviewImageMap.biaohui ?? "",
    markerFolder: "应急保障 / 封控区域",
    summary: "已完成审核并同步，移动端下一次在线更新即可生效。",
    reviewedAt: "2026-05-14 11:12",
    platformUpdatedAt: "2026-05-14 11:26",
    reviewComment: "封控范围与图片一致，已完成更新。",
  },
  {
    id: "RV-1998",
    module: "corrections",
    category: "纠错数据",
    title: "消防栓点位 C",
    description: "用户反馈消防栓点位在底图上偏到路中央，建议重新定位。",
    submitter: "沈越",
    submittedAt: "2026-05-13 17:36",
    area: "江夏区",
    status: "待审核",
    source: "移动端纠错",
    correctionType: "改地址",
    currentName: "消防栓点位 C",
    currentAddress: "纸坊大街 211 号门前",
    currentCoordinate: "30.3751, 114.3217",
    nextCoordinate: "30.3756, 114.3221",
    currentCoordinateLabel: "30.3751, 114.3217",
    nextCoordinateLabel: "30.3756, 114.3221",
    detailNote: "现场拍照显示消防栓位于门前步道内侧。",
    summary: "建议按用户上传位置进行点位校正。",
    reviewedAt: "-",
    platformUpdatedAt: "-",
    reviewComment: "",
  },
  {
    id: "RV-1991",
    module: "corrections",
    category: "纠错数据",
    title: "应急避难场所 D",
    description: "用户认为当前名称过旧，建议更正为最新挂牌名称。",
    submitter: "朱茗",
    submittedAt: "2026-05-13 14:12",
    area: "青山区",
    status: "待审核",
    source: "移动端纠错",
    correctionType: "改名称",
    currentName: "应急避难场所 D",
    currentAddress: "和平大道应急广场",
    currentCoordinate: "30.6344, 114.3937",
    currentCoordinateLabel: "30.6344, 114.3937",
    nextName: "和平广场应急避难场所",
    detailNote: "补充说明里附带了现场新挂牌照片。",
    summary: "需核验挂牌信息后决定是否改名。",
    reviewedAt: "-",
    platformUpdatedAt: "-",
    reviewComment: "",
  },
  {
    id: "RV-1986",
    module: "corrections",
    category: "纠错数据",
    title: "临时围挡点位 E",
    description: "用户反馈对象已拆除，建议从移动端数据中移除。",
    submitter: "罗晨",
    submittedAt: "2026-05-13 11:28",
    area: "东西湖区",
    status: "待审核",
    source: "移动端纠错",
    correctionType: "不存在",
    currentName: "临时围挡点位 E",
    currentAddress: "金山大道施工围挡口",
    currentCoordinate: "30.6552, 114.1304",
    currentCoordinateLabel: "30.6552, 114.1304",
    missingReason: "道路施工结束，围挡与提醒牌已经全部撤除。",
    detailNote: "用户连续两次上报该对象不存在。",
    summary: "建议现场复核后下线该对象。",
    reviewedAt: "-",
    platformUpdatedAt: "-",
    reviewComment: "",
  },
  {
    id: "RV-1982",
    module: "corrections",
    category: "纠错数据",
    title: "景区导览点 F",
    description: "用户反馈导览点偏离景区入口，建议向西调整。",
    submitter: "唐悦",
    submittedAt: "2026-05-13 09:54",
    area: "黄陂区",
    status: "审核通过待更新",
    source: "移动端纠错",
    correctionType: "改地址",
    currentName: "景区导览点 F",
    currentAddress: "木兰景区东入口",
    currentCoordinate: "30.8821, 114.3632",
    nextCoordinate: "30.8820, 114.3626",
    currentCoordinateLabel: "30.8821, 114.3632",
    nextCoordinateLabel: "30.8820, 114.3626",
    detailNote: "景区导览牌已迁到停车场入口旁。",
    summary: "已通过审核，待同步到在线更新平台。",
    reviewedAt: "2026-05-13 10:36",
    platformUpdatedAt: "-",
    reviewComment: "现场比对后确认需向西平移。",
  },
  {
    id: "RV-1975",
    module: "markers",
    category: "用户标注",
    title: "桥下积水点 G",
    description: "用户新增桥下积水点位，建议纳入雨季巡检图层。",
    submitter: "谢航",
    submittedAt: "2026-05-13 18:02",
    area: "汉南区",
    status: "待审核",
    source: "移动端标注",
    markerType: "标点",
    markerStyle: "蓝色默认",
    markerCategory: "积水隐患",
    markerCoordinates: ["30.3098, 114.0872"],
    markerGeometry: "point",
    markerRemark: "降雨 30 分钟后会出现明显积水。",
    markerImage: reviewImageMap.biaohui ?? "",
    markerFolder: "防汛巡检 / 2026-05",
    summary: "建议审核后补充进积水巡检专题。",
    reviewedAt: "-",
    platformUpdatedAt: "-",
    reviewComment: "",
  },
  {
    id: "RV-1971",
    module: "markers",
    category: "用户标注",
    title: "学校南门巡检路线",
    description: "用户补充学校南门到操场的巡检路线。",
    submitter: "江墨",
    submittedAt: "2026-05-13 15:20",
    area: "东湖高新区",
    status: "待审核",
    source: "移动端标注",
    markerType: "标线",
    markerStyle: "橙色巡检线",
    markerCategory: "校园安全",
    markerCoordinates: ["30.4803, 114.4251", "30.4808, 114.4262", "30.4815, 114.4273"],
    markerGeometry: "line",
    markerRemark: "建议作为防汛和放学时段联合巡检路线。",
    markerImage: reviewImageMap.biaohui ?? "",
    markerFolder: "校园安全 / 路线",
    summary: "可在校园安全专题中作为巡检推荐路径。",
    reviewedAt: "-",
    platformUpdatedAt: "-",
    reviewComment: "",
  },
  {
    id: "RV-1968",
    module: "markers",
    category: "用户标注",
    title: "临时封控区 H",
    description: "用户新增施工封控面，附带绕行说明。",
    submitter: "顾青",
    submittedAt: "2026-05-13 13:08",
    area: "蔡甸区",
    status: "待审核",
    source: "移动端标注",
    markerType: "标面",
    markerStyle: "红色封控面",
    markerCategory: "应急保障",
    markerCoordinates: ["30.5641, 114.0134", "30.5650, 114.0148", "30.5642, 114.0161", "30.5632, 114.0147"],
    markerGeometry: "polygon",
    markerRemark: "封控区域预计持续三天，建议提示绕行。",
    markerImage: reviewImageMap.biaohui ?? "",
    markerFolder: "应急保障 / 临时封控",
    summary: "需核验现场封控信息和时效后再更新。",
    reviewedAt: "-",
    platformUpdatedAt: "-",
    reviewComment: "",
  },
  {
    id: "RV-1962",
    module: "markers",
    category: "用户标注",
    title: "河堤巡查线 I",
    description: "用户补充河堤巡查线，方便防汛排查。",
    submitter: "严川",
    submittedAt: "2026-05-12 18:18",
    area: "新洲区",
    status: "审核通过待更新",
    source: "移动端标注",
    markerType: "标线",
    markerStyle: "绿色巡查线",
    markerCategory: "防汛巡检",
    markerCoordinates: ["30.8431, 114.8233", "30.8442, 114.8245", "30.8451, 114.8259"],
    markerGeometry: "line",
    markerRemark: "路线覆盖重点排查堤段。",
    markerImage: reviewImageMap.biaohui ?? "",
    markerFolder: "防汛巡检 / 河堤",
    summary: "建议同步到防汛巡查路线图层。",
    reviewedAt: "2026-05-12 19:02",
    platformUpdatedAt: "-",
    reviewComment: "路线信息完整，可更新。",
  },
  {
    id: "RV-1958",
    module: "markers",
    category: "用户标注",
    title: "公园积水面 J",
    description: "用户标注公园低洼积水面，建议提醒游客绕行。",
    submitter: "姚杉",
    submittedAt: "2026-05-12 16:46",
    area: "江汉区",
    status: "审核不通过",
    source: "移动端标注",
    markerType: "标面",
    markerStyle: "蓝色积水面",
    markerCategory: "公园管理",
    markerCoordinates: ["30.6011, 114.2732", "30.6018, 114.2741", "30.6009, 114.2752", "30.6001, 114.2740"],
    markerGeometry: "polygon",
    markerRemark: "疑似积水面范围过大，需重新核实。",
    markerImage: reviewImageMap.biaohui ?? "",
    markerFolder: "公园管理 / 积水面",
    summary: "已退回，建议重新测量范围后再提交。",
    reviewedAt: "2026-05-12 17:18",
    platformUpdatedAt: "-",
    reviewComment: "面状范围与图片不符，请重新确认边界。",
  },
];

function formatTimestamp(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function showToast(message, tone = "default") {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent("tdt-toast", {
      detail: {
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        message,
        tone,
      },
    }),
  );
}

function readStoredReviewStates() {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(reviewStorageKey) ?? "{}");
  } catch {
    return {};
  }
}

function useReviewRecords() {
  const [records, setRecords] = useState(() => {
    const stored = readStoredReviewStates();
    return reviewBaseRecords.map((item) => ({
      ...item,
      status: stored[item.id]?.status ?? item.status,
      reviewedAt: stored[item.id]?.reviewedAt ?? item.reviewedAt,
      platformUpdatedAt: stored[item.id]?.platformUpdatedAt ?? item.platformUpdatedAt,
      reviewComment: stored[item.id]?.reviewComment ?? item.reviewComment,
    }));
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const payload = Object.fromEntries(
      records.map((item) => [
        item.id,
        {
          status: item.status,
          reviewedAt: item.reviewedAt,
          platformUpdatedAt: item.platformUpdatedAt,
          reviewComment: item.reviewComment,
        },
      ]),
    );
    window.localStorage.setItem(reviewStorageKey, JSON.stringify(payload));
  }, [records]);

  return [records, setRecords];
}

function reviewStatusTone(status) {
  if (status === "已更新到在线更新平台") return "success";
  if (status === "审核不通过") return "danger";
  if (status === "审核通过待更新") return "info";
  return "pending";
}

function readStoredTopicStatuses() {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(topicMapStorageKey) ?? "{}");
  } catch {
    return {};
  }
}

function useTopicMapRecords() {
  const [records, setRecords] = useState(() => {
    const stored = readStoredTopicStatuses();
    return topicMapBaseRecords.map((item) => ({
      ...item,
      status: stored[item.id]?.status ?? item.status,
      updatedAt: stored[item.id]?.updatedAt ?? item.updatedAt,
    }));
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const payload = Object.fromEntries(
      records.map((item) => [item.id, { status: item.status, updatedAt: item.updatedAt }]),
    );
    window.localStorage.setItem(topicMapStorageKey, JSON.stringify(payload));
  }, [records]);

  return [records, setRecords];
}

function nextTopicStatus(targetStatus) {
  return targetStatus === "已上架" ? "已下架" : "已上架";
}

function topicActionLabel(status) {
  return status === "已上架" ? "下架" : "上架";
}

function topicStatusTone(status) {
  if (status === "已上架") return "success";
  if (status === "已下架") return "muted";
  return "pending";
}

function readStoredFeedbackStates() {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(feedbackStorageKey) ?? "{}");
  } catch {
    return {};
  }
}

function useFeedbackRecords() {
  const [records, setRecords] = useState(() => {
    const stored = readStoredFeedbackStates();
    return feedbackBaseRecords.map((item) => ({
      ...item,
      status: stored[item.id]?.status ?? item.status,
      handler: stored[item.id]?.handler ?? item.handler,
      handledAt: stored[item.id]?.handledAt ?? item.handledAt,
      handleResult: stored[item.id]?.handleResult ?? item.handleResult,
      adoptStatus: stored[item.id]?.adoptStatus ?? item.adoptStatus,
    }));
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const payload = Object.fromEntries(
      records.map((item) => [
        item.id,
        {
          status: item.status,
          handler: item.handler,
          handledAt: item.handledAt,
          handleResult: item.handleResult,
          adoptStatus: item.adoptStatus,
        },
      ]),
    );
    window.localStorage.setItem(feedbackStorageKey, JSON.stringify(payload));
  }, [records]);

  return [records, setRecords];
}

function feedbackStatusTone(status) {
  if (status === "已处理") return "success";
  if (status === "已关闭") return "muted";
  if (status === "处理中") return "info";
  return "pending";
}

function compactFeedbackStatus(status) {
  if (status === "已处理") return "已处理";
  if (status === "已关闭") return "已关闭";
  if (status === "处理中") return "处理中";
  return "待处理";
}

const releaseNoteRows = [
  ["1.0.0", "Android", "移动端试运行版", "已发布", "2026-04-08 17:00", "100"],
  ["1.0.1", "iOS", "专题图层与反馈优化", "待发布", "2026-05-20 10:00", "0"],
];

const feedbackStorageKey = "tdt-feedback-state";

const feedbackBaseRecords = [
  {
    id: "FB-001",
    submitter: "张明",
    contact: "13800138001",
    submittedAt: "2026-05-14 09:23",
    type: "问题反馈",
    content: "离线地图下载到80%时经常失败，重试后还是同样的问题，已经尝试过清除缓存重新下载。",
    images: [reviewImageMap.biaohui ?? ""],
    status: "待处理",
    handler: "",
    handledAt: "",
    handleResult: "",
    adoptStatus: "",
  },
  {
    id: "FB-002",
    submitter: "李华",
    contact: "lihua@example.com",
    submittedAt: "2026-05-13 16:45",
    type: "功能建议",
    content: "希望能支持轨迹导出为Excel格式，方便我们做外业记录的整理和上报。",
    images: [],
    status: "处理中",
    handler: "周洁",
    handledAt: "",
    handleResult: "",
    adoptStatus: "已纳入计划",
  },
  {
    id: "FB-003",
    submitter: "王芳",
    contact: "13900139002",
    submittedAt: "2026-05-13 14:12",
    type: "体验优化",
    content: "专题图层切换时有明显卡顿，特别是在叠加多个图层的情况下，响应时间超过2秒。",
    images: [reviewImageMap.biaohui ?? ""],
    status: "已处理",
    handler: "林程",
    handledAt: "2026-05-14 10:30",
    handleResult: "已优化图层切换逻辑，下个版本发布后生效。",
    adoptStatus: "",
  },
  {
    id: "FB-004",
    submitter: "赵强",
    contact: "zhaoqiang@test.com",
    submittedAt: "2026-05-12 11:08",
    type: "问题反馈",
    content: "在导航过程中，语音播报偶尔会延迟3-5秒，错过转弯提醒。",
    images: [],
    status: "已关闭",
    handler: "赵航",
    handledAt: "2026-05-13 09:15",
    handleResult: "已定位问题并修复，将在v1.0.2版本更新。",
    adoptStatus: "",
  },
  {
    id: "FB-005",
    submitter: "陈静",
    contact: "13700137003",
    submittedAt: "2026-05-11 18:30",
    type: "功能建议",
    content: "建议增加收藏夹功能，可以保存常用地点和路线，方便下次快速调用。",
    images: [],
    status: "待处理",
    handler: "",
    handledAt: "",
    handleResult: "",
    adoptStatus: "",
  },
  {
    id: "FB-006",
    submitter: "刘洋",
    contact: "liuyang@example.com",
    submittedAt: "2026-05-10 09:15",
    type: "体验优化",
    content: "搜索结果列表太长时没有分页，建议增加分页或无限滚动加载。",
    images: [],
    status: "处理中",
    handler: "周洁",
    handledAt: "",
    handleResult: "",
    adoptStatus: "采纳",
  },
  {
    id: "FB-007",
    submitter: "黄磊",
    contact: "13600136004",
    submittedAt: "2026-05-09 15:42",
    type: "问题反馈",
    content: "标绘功能在绘制多边形时，双击结束偶尔会无响应，需要重新开始。",
    images: [],
    status: "已处理",
    handler: "林程",
    handledAt: "2026-05-10 14:20",
    handleResult: "已修复双击事件监听问题。",
    adoptStatus: "",
  },
  {
    id: "FB-008",
    submitter: "周婷",
    contact: "zhouting@test.com",
    submittedAt: "2026-05-08 12:00",
    type: "功能建议",
    content: "希望能支持离线标注功能，在没有网络的情况下也能进行标绘，联网后自动同步。",
    images: [],
    status: "已处理",
    handler: "周洁",
    handledAt: "2026-05-09 16:45",
    handleResult: "暂不采纳，当前技术架构不支持离线标绘，后续版本考虑。",
    adoptStatus: "暂不采纳",
  },
];

const feedbackStatusChoices = ["待处理", "已采纳", "不采纳"];
const feedbackDecisionOptions = [
  { value: "待处理", label: "待处理" },
  { value: "已采纳", label: "采纳" },
  { value: "不采纳", label: "不采纳" },
];

const simplifiedFeedbackPresets = {
  "FB-001": {
    status: "待处理",
    handler: "",
    handledAt: "",
    handleResult: "",
    duplicateOf: "",
  },
  "FB-002": {
    status: "已采纳",
    handler: "周洁",
    handledAt: "2026-05-14 11:10",
    handleResult: "该诉求已记录为后续可参考能力，适合在类似项目的成果导出场景中复用。",
    duplicateOf: "",
  },
  "FB-003": {
    status: "不采纳",
    handler: "林程",
    handledAt: "2026-05-14 10:30",
    handleResult: "已记录为性能体验问题，建议在项目总结中单列为专题图层交互优化项。",
    duplicateOf: "",
  },
  "FB-004": {
    status: "不采纳",
    handler: "赵航",
    handledAt: "2026-05-13 09:15",
    handleResult: "已作为一般问题记录，建议在导航稳定性说明中补充该场景风险。",
    duplicateOf: "",
  },
  "FB-005": {
    status: "待处理",
    handler: "",
    handledAt: "",
    handleResult: "",
    duplicateOf: "",
  },
  "FB-006": {
    status: "已采纳",
    handler: "周洁",
    handledAt: "2026-05-11 15:20",
    handleResult: "已记录为搜索体验相关建议，后续如出现同类意见可再统一归集。",
    duplicateOf: "",
  },
  "FB-007": {
    status: "不采纳",
    handler: "林程",
    handledAt: "2026-05-10 14:20",
    handleResult: "已记录为标绘交互问题，建议后续在典型操作链路中增加专项测试。",
    duplicateOf: "",
  },
  "FB-008": {
    status: "不采纳",
    handler: "周洁",
    handledAt: "2026-05-09 16:45",
    handleResult: "已记录为产品建议，但结合当前项目交付边界，暂不作为本期能力范围。",
    duplicateOf: "",
  },
};

function normalizeSimplifiedFeedbackStatus(status, resultCategory = "", adoptStatus = "") {
  if (feedbackStatusChoices.includes(status)) return status;

  if (status === "已处理" || status === "已关闭") {
    if (
      adoptStatus === "采纳" ||
      adoptStatus === "已纳入计划" ||
      resultCategory === "产品建议" ||
      resultCategory === "数据需求"
    ) {
      return "已采纳";
    }
    return "不采纳";
  }

  return "待处理";
}

function normalizeFeedbackDuplicateOf(status, duplicateOf = "") {
  return status === "已采纳" ? duplicateOf : "";
}

const simplifiedFeedbackBaseRecords = feedbackBaseRecords.map((item) => {
  const preset = simplifiedFeedbackPresets[item.id] ?? {};
  const normalizedStatus = normalizeSimplifiedFeedbackStatus(
    preset.status ?? item.status,
    preset.resultCategory ?? item.resultCategory ?? "",
    preset.adoptStatus ?? item.adoptStatus ?? "",
  );
  return {
    ...item,
    status: normalizedStatus,
    handler: preset.handler ?? item.handler ?? "",
    handledAt: preset.handledAt ?? item.handledAt ?? "",
    handleResult: preset.handleResult ?? item.handleResult ?? "",
    duplicateOf: normalizeFeedbackDuplicateOf(normalizedStatus, preset.duplicateOf ?? ""),
  };
});

function useSimplifiedFeedbackRecords() {
  const [records, setRecords] = useState(() => {
    const stored = readStoredFeedbackStates();
    return simplifiedFeedbackBaseRecords.map((item) => {
      const normalizedStatus = normalizeSimplifiedFeedbackStatus(
        stored[item.id]?.status ?? item.status,
        stored[item.id]?.resultCategory ?? item.resultCategory ?? "",
        stored[item.id]?.adoptStatus ?? item.adoptStatus ?? "",
      );

      return {
        ...item,
        status: normalizedStatus,
        handler: stored[item.id]?.handler ?? item.handler,
        handledAt: stored[item.id]?.handledAt ?? item.handledAt,
        handleResult: stored[item.id]?.handleResult ?? item.handleResult,
        duplicateOf: normalizeFeedbackDuplicateOf(
          normalizedStatus,
          stored[item.id]?.duplicateOf ?? item.duplicateOf,
        ),
      };
    });
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const payload = Object.fromEntries(
      records.map((item) => [
        item.id,
        {
          status: item.status,
          handler: item.handler,
          handledAt: item.handledAt,
          handleResult: item.handleResult,
          duplicateOf: item.duplicateOf,
        },
      ]),
    );
    window.localStorage.setItem(feedbackStorageKey, JSON.stringify(payload));
  }, [records]);

  return [records, setRecords];
}

function simplifiedFeedbackStatusTone(status) {
  if (status === "已采纳") return "success";
  if (status === "不采纳") return "danger";
  return "pending";
}

function simplifiedFeedbackStatusLabel(status) {
  return feedbackStatusChoices.includes(status) ? status : "待处理";
}

function feedbackDecisionLabel(status) {
  return feedbackDecisionOptions.find((item) => item.value === status)?.label ?? "待处理";
}

function summarizeFeedbackContent(content) {
  if (!content) return "";
  return content.length > 28 ? `${content.slice(0, 28)}...` : content;
}

const logRows = [
  ["14:12:33", "INFO", "SearchCluster", "热门搜索统计任务执行完成，写入 24,182 条聚合记录。"],
  ["14:08:19", "WARN", "ReviewFlow", "标绘复审队列等待时间超过 37 分钟，已触发提醒。"],
  ["14:03:06", "INFO", "PublishGate", "专题《校园安全专题》完成终审，进入定时发布队列。"],
  ["13:58:47", "ERROR", "TileGateway", "网关节点 gw-03 在 8 秒内出现 3 次超时重试。"],
];

const systemTabs = [
  { id: "users", label: "用户管理" },
  { id: "roles", label: "角色权限" },
  { id: "menus", label: "菜单管理" },
  { id: "dicts", label: "字典配置" },
  { id: "params", label: "系统参数" },
];

const reviewTabs = [
  { id: "corrections", label: "纠错审核", module: "corrections" },
  { id: "markers", label: "标注审核", module: "markers" },
];

const systemTables = {
  users: {
    columns: ["账号", "姓名", "角色", "组织", "状态", "最后登录"],
    rows: [
      ["admin", "平台管理员", "超级管理员", "省级平台", "启用", "今天 14:02"],
      ["topic_op", "周洁", "专题运营", "专题运营组", "启用", "今天 10:31"],
      ["review_01", "林程", "审核员", "数据治理组", "启用", "今天 09:16"],
      ["ops_01", "赵航", "运维", "平台运维组", "停用", "昨天 18:52"],
    ],
  },
  roles: {
    columns: ["角色编码", "角色名称", "数据范围", "用户数", "状态", "更新时间"],
    rows: [
      ["SUPER_ADMIN", "超级管理员", "全部", "2", "启用", "2026-05-12"],
      ["TOPIC_OP", "专题运营", "专题模块", "6", "启用", "2026-05-10"],
      ["REVIEWER", "审核员", "数据审核管理", "12", "启用", "2026-05-09"],
      ["OPS", "运维", "日志监控", "4", "启用", "2026-05-08"],
    ],
  },
  menus: {
    columns: ["菜单名称", "路由", "类型", "上级菜单", "排序", "状态"],
    rows: [
      ["用户行为分析", "/analysis", "菜单", "-", "1", "启用"],
      ["数据审核管理", "/review/corrections", "菜单", "-", "2", "启用"],
      ["主题地图发布管理", "/topic", "菜单", "-", "3", "启用"],
      ["系统管理", "/system/users", "菜单", "-", "4", "启用"],
    ],
  },
  dicts: {
    columns: ["字典类型", "字典标签", "字典值", "排序", "状态", "备注"],
    rows: [
      ["review_status", "待审核", "pending", "1", "启用", "-"],
      ["review_status", "审核通过待更新", "approved_pending_sync", "2", "启用", "-"],
      ["review_status", "审核不通过", "rejected", "3", "启用", "-"],
      ["review_status", "已更新到在线更新平台", "synced", "4", "启用", "-"],
      ["service_level", "高", "high", "1", "启用", "优先级"],
    ],
  },
  params: {
    columns: ["参数键", "参数值", "分类", "是否内置", "状态", "更新时间"],
    rows: [
      ["review.timeout.minutes", "30", "审核", "是", "启用", "2026-05-12"],
      ["topic.publish.window", "18:00", "专题", "否", "启用", "2026-05-11"],
      ["search.hotwords.limit", "20", "搜索", "否", "启用", "2026-05-10"],
      ["log.retain.days", "180", "日志", "是", "启用", "2026-05-09"],
    ],
  },
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/analysis" replace />} />
        <Route element={<AppLayoutShell />}>
          <Route path="/analysis" element={<AnalysisPage />} />
          <Route path="/review" element={<Navigate to="/review/corrections" replace />} />
          <Route path="/review/:tab" element={<ReviewPage />} />
          <Route path="/review/:tab/:reviewId" element={<ReviewDetailPage />} />
          <Route path="/topic" element={<TopicPage />} />
          <Route path="/topic/:topicId" element={<TopicDetailPage />} />
          <Route path="/feedback" element={<FeedbackPageV2 />} />
          <Route path="/feedback/:feedbackId" element={<FeedbackDetailPageV2 />} />
          <Route path="/release-notes" element={<ReleaseNotesManager />} />
          <Route path="/ops" element={<MonitoringPageModule />} />
          <Route path="/system" element={<Navigate to="/system/users" replace />} />
          <Route path="/system/:tab" element={<RoleManagementPageModule />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

function resolveRouteMeta(pathname) {
  if (pathname.startsWith("/system/")) return { title: "用户角色管理", parent: "" };
  if (pathname.startsWith("/review/")) {
    const parts = pathname.split("/").filter(Boolean);
    if (parts.length >= 3) return { title: "", parent: "数据审核管理", hideHeader: true };
    if (pathname.startsWith("/review/markers")) return { title: "标注审核", parent: "" };
    return { title: "纠错审核", parent: "" };
  }
  if (pathname.startsWith("/topic/")) return { title: "", parent: "主题地图发布管理", hideHeader: true };
  if (pathname.startsWith("/feedback/")) return { title: "", parent: "意见反馈管理", hideHeader: true };
  if (pathname.startsWith("/system/")) return { title: "系统管理", parent: "" };

  const item = flattenedMenuItems.find((entry) => entry.path === pathname);
  return item ? { title: item.label, parent: "" } : { title: "用户行为分析", parent: "" };
}

function AppLayoutShell() {
  const location = useLocation();
  const currentMeta = resolveRouteMeta(location.pathname);
  const [collapsed, setCollapsed] = useState(false);
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handleToast = (event) => {
      const payload = event.detail;
      if (!payload?.message) return;
      setToasts((current) => [...current, payload]);
      window.setTimeout(() => {
        setToasts((current) => current.filter((item) => item.id !== payload.id));
      }, 2600);
    };

    window.addEventListener("tdt-toast", handleToast);
    return () => window.removeEventListener("tdt-toast", handleToast);
  }, []);

  return (
    <div className={`app-shell ${collapsed ? "sidebar-collapsed" : ""}`}>
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-brand-main">
            <div className="sidebar-brand-mark" aria-hidden="true">
              <span className="brand-tile brand-tile-a" />
              <span className="brand-tile brand-tile-b" />
              <span className="brand-tile brand-tile-c" />
            </div>
            <div className="sidebar-brand-copy">
              <strong>天地图后台</strong>
            </div>
          </div>
          <button
            type="button"
            className="sidebar-toggle"
            aria-label={collapsed ? "展开侧边栏" : "收起侧边栏"}
            onClick={() => setCollapsed((value) => !value)}
          >
            <ToggleIcon collapsed={collapsed} />
          </button>
        </div>

        <nav className="menu-tree" aria-label="平台菜单">
          {menuItems.map((item) => {
            const exactActive = location.pathname === item.path;
            const prefixActive = !item.children && location.pathname.startsWith(`${item.path}/`);
            const childActive = item.children?.some(
              (child) => location.pathname === child.path || location.pathname.startsWith(`${child.path}/`),
            );
            const active = exactActive || prefixActive || childActive;
            return (
              <div key={item.path} className={`menu-group ${active ? "active" : ""}`}>
                <NavLink
                  to={item.path}
                  className={() =>
                    `menu-item ${exactActive || prefixActive ? "active" : childActive ? "branch-active" : ""}`.trim()
                  }
                  title={collapsed ? item.label : undefined}
                >
                  <NavIcon type={item.icon} />
                  <span className="menu-item-text">{item.label}</span>
                </NavLink>
                {!collapsed && item.children?.length ? (
                  <div className="menu-children">
                    {item.children.map((child) => {
                      const childActive =
                        location.pathname === child.path || location.pathname.startsWith(`${child.path}/`);
                      return (
                        <NavLink
                          key={child.path}
                          to={child.path}
                          className={() => `menu-subitem ${childActive ? "active" : ""}`}
                        >
                          <span className="menu-subitem-dot" aria-hidden="true" />
                          <span>{child.label}</span>
                        </NavLink>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="user-card">
            <div className="user-avatar">管</div>
            <div className="user-meta">
              <strong>平台管理员</strong>
              <span>admin@tianditu.cn</span>
            </div>
          </div>
        </div>
      </aside>

      <main className="main-panel">
        {!currentMeta.hideHeader ? (
          <header className="topbar">
            <div>
              <h1>{currentMeta.title}</h1>
            </div>
          </header>
        ) : null}
        <Outlet />
        <ToastViewport toasts={toasts} />
      </main>
    </div>
  );
}

function ToastViewport({ toasts }) {
  return (
    <div className="toast-viewport" aria-live="polite" aria-atomic="true">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast-item ${toast.tone ?? "default"}`}>
          <span>{toast.message}</span>
        </div>
      ))}
    </div>
  );
}

function ToggleIcon({ collapsed }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 5.5h8" />
      <path d="M4 10h8" />
      <path d="M4 14.5h8" />
      {collapsed ? <path d="m12 6 4 4-4 4" /> : <path d="m14 6-4 4 4 4" />}
    </svg>
  );
}

function NavIcon({ type }) {
  return (
    <span className={`nav-icon nav-icon-${type}`} aria-hidden="true">
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        {type === "analysis" && (
          <>
            <path d="M4 15V9" />
            <path d="M10 15V5" />
            <path d="M16 15v-7" />
          </>
        )}
        {type === "review" && (
          <>
            <rect x="4" y="4" width="12" height="12" rx="2" />
            <path d="m7.5 10 1.8 1.8 3.6-3.6" />
          </>
        )}
        {type === "topic" && (
          <>
            <path d="M4 6h12" />
            <path d="M4 10h8" />
            <path d="M4 14h12" />
          </>
        )}
        {type === "release" && (
          <>
            <path d="M6 4.5v11" />
            <path d="M14 4.5v11" />
            <path d="M6 8h8" />
            <path d="M6 12h8" />
          </>
        )}
        {type === "feedback" && <path d="M5 6.5h10v7H9l-3.5 2v-2H5z" />}
        {type === "ops" && <path d="M4 13h2.5l1.5-6 2.5 9 1.5-5H16" />}
        {type === "system" && (
          <>
            <circle cx="10" cy="10" r="2.4" />
            <path d="M10 4.5v1.6" />
            <path d="M10 13.9v1.6" />
            <path d="m5.7 5.7 1.1 1.1" />
            <path d="m13.2 13.2 1.1 1.1" />
            <path d="M4.5 10h1.6" />
            <path d="M13.9 10h1.6" />
          </>
        )}
      </svg>
    </span>
  );
}

function FilterSelect({ placeholder, options, defaultAll = false, onChange, optionCounts = {} }) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(defaultAll ? [...options] : []);

  useEffect(() => {
    if (!open) return undefined;

    const close = (event) => {
      if (!event.target.closest(".filter-select-shell")) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const allSelected = selected.length === options.length && options.length > 0;
  const hasSelected = selected.length > 0;

  useEffect(() => {
    onChange?.(selected, allSelected);
  }, [allSelected, onChange, selected]);

  const toggleOption = (value) => {
    if (value === "__ALL__") {
      setSelected(allSelected ? [] : [...options]);
      return;
    }

    setSelected((current) => {
      const exists = current.includes(value);
      if (exists) return current.filter((item) => item !== value);
      return [...current, value];
    });
  };

  const clear = () => setSelected([]);
  const getCount = (option) => optionCounts?.[option];

  return (
    <div
      className={[
        "filter-select-shell",
        open ? "open" : "",
        hasSelected ? "has-selected" : "",
        allSelected ? "all-selected" : "",
        selected.length > 1 && !allSelected ? "multi-selected" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <button
        type="button"
        className={`filter-select-trigger ${hasSelected ? "selected" : ""} ${open ? "open" : ""}`}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="filter-trigger-label">
          {!hasSelected && <span className="filter-placeholder">{placeholder}</span>}
          {allSelected && <span className="filter-token filter-token-all">全部</span>}
          {!allSelected && selected.length === 1 && <span className="filter-token">{selected[0]}</span>}
          {!allSelected && selected.length > 1 && (
            <span className="filter-token-group">
              {selected.map((item) => (
                <span key={item} className="filter-token">
                  {item}
                </span>
              ))}
            </span>
          )}
        </span>
        {hasSelected ? (
          <i
            className="filter-clear"
            role="button"
            tabIndex={0}
            onClick={(event) => {
              event.stopPropagation();
              clear();
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                event.stopPropagation();
                clear();
              }
            }}
          >
            ×
          </i>
        ) : (
          <b className="filter-caret" aria-hidden="true">
            <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="m3 4.5 3 3 3-3" />
            </svg>
          </b>
        )}
      </button>

      {open && (
        <div className="filter-select-menu">
          <button
            type="button"
            className={`filter-select-option ${allSelected ? "active" : ""}`}
            onClick={() => toggleOption("__ALL__")}
          >
            <span className={`checkmark ${allSelected ? "checked" : ""}`} />
            <span>全部</span>
          </button>
          {options.map((option) => {
            const active = selected.includes(option);
            return (
              <button
                key={option}
                type="button"
                className={`filter-select-option ${active ? "active" : ""}`}
                onClick={() => toggleOption(option)}
              >
                <span className={`checkmark ${active ? "checked" : ""}`} />
                <span>{option}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function FeedbackSingleSelect({ value, options, onChange, placeholder = "请选择", compact = false, searchable = false, searchPlaceholder = "请输入关键词" }) {
  const shellRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const selected = options.find((item) => item.value === value) ?? null;

  useEffect(() => {
    if (!open) return undefined;

    const close = (event) => {
      if (!shellRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const normalizedQuery = query.trim().toLowerCase();
  const filteredOptions = searchable
    ? options.filter((item) =>
        [item.label, item.searchText, item.meta, item.idText]
          .filter(Boolean)
          .some((field) => field.toLowerCase().includes(normalizedQuery)),
      )
    : options;

  return (
    <div ref={shellRef} className={`feedback-picker ${compact ? "compact" : ""} ${open ? "open" : ""}`}>
      <button
        type="button"
        className="feedback-picker-trigger"
        onClick={() => setOpen((current) => !current)}
      >
        <span className={`feedback-picker-trigger-text ${selected ? "" : "placeholder"}`}>
          {selected ? selected.label : placeholder}
        </span>
        <span className="feedback-picker-caret" aria-hidden="true">
          <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="m3 4.5 3 3 3-3" />
          </svg>
        </span>
      </button>

      {open ? (
        <div className="feedback-picker-menu">
          {searchable ? (
            <div className="feedback-picker-search-shell">
              <input
                className="input feedback-picker-search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={searchPlaceholder}
              />
            </div>
          ) : null}

          <div className="feedback-picker-options">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => {
                const active = option.value === value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    className={`feedback-picker-option ${active ? "active" : ""}`}
                    onClick={() => {
                      onChange(option.value);
                      setOpen(false);
                    }}
                  >
                    <span className="feedback-picker-option-main">
                      <strong>{option.label}</strong>
                      {option.meta ? <em>{option.meta}</em> : null}
                    </span>
                    {option.idText ? <span className="feedback-picker-option-id">{option.idText}</span> : null}
                  </button>
                );
              })
            ) : (
              <div className="feedback-picker-empty">没有匹配的主反馈</div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function AnalysisPage() {
  const [trendRange, setTrendRange] = useState("7d");
  const [hotSearchRange, setHotSearchRange] = useState("day");
  const trendSeries = analysisUserGrowthSeries[trendRange];
  const trendChart = buildAnalysisLineChart(trendSeries);
  const hotSearchGroup = analysisHotSearchTimeline[hotSearchRange];
  const totalUsersCard = analysisOverviewCards.find((item) => item.label === "系统总用户量");
  const secondaryOverviewCards = analysisOverviewCards.filter((item) => item.label !== "系统总用户量");

  return (
    <div className="page-content analysis-page">
      <section className="analysis-hero-dashboard">
        <article className="analysis-metric-stage">
          <div className="panel-header">
            <h2>数据概览</h2>
          </div>
          <div className="analysis-metric-mosaic">
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

            {secondaryOverviewCards.map((item, index) => (
              <article
                key={item.label}
                className={`stat-card analysis-stat-card analysis-stat-card--stack analysis-stat-card--stack-${index + 1}${item.label === "留存率" ? " analysis-stat-card--retention" : ""}`}
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
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}

function ReviewPage() {
  const { tab = "corrections" } = useParams();
  const navigate = useNavigate();
  const [records, setRecords] = useReviewRecords();
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const currentTab = reviewTabs.find((item) => item.id === tab) ?? reviewTabs[0];

  useEffect(() => {
    setSearchText("");
    setStatusFilter([]);
    setSelectedIds([]);
    setPage(1);
  }, [currentTab.id]);

  const reviewStatusCounts = records
    .filter((item) => item.module === currentTab.module)
    .reduce(
      (acc, item) => {
        acc[item.status] = (acc[item.status] ?? 0) + 1;
        return acc;
      },
      { "待审核": 0, "审核通过待更新": 0, "审核不通过": 0, "已更新到在线更新平台": 0 },
    );

  const reviewStatusOptions = [
    { label: "待审核", full: "待审核" },
    { label: "待更新", full: "审核通过待更新" },
    { label: "不通过", full: "审核不通过" },
    { label: "已更新", full: "已更新到在线更新平台" },
  ].map((item) => `${item.label} ${reviewStatusCounts[item.full] ?? 0}`);

  const filteredRecords = records.filter((item) => {
    const keyword = searchText.trim().toLowerCase();
    const matchSearch =
      keyword === "" ||
      [item.id, item.title, item.description, item.submitter].some((field) =>
        field.toLowerCase().includes(keyword),
      );
    const matchStatus = statusFilter.length === 0 || statusFilter.includes(item.status);
    return item.module === currentTab.module && matchSearch && matchStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / pageSize));

  useEffect(() => {
    setPage((current) => Math.min(current, totalPages));
  }, [totalPages]);

  const pagedRecords = filteredRecords.slice((page - 1) * pageSize, page * pageSize);
  const selectedSet = new Set(selectedIds);
  const eligibleRecords = pagedRecords.filter((item) => item.status === "审核通过待更新");
  const allVisibleSelected =
    eligibleRecords.length > 0 && eligibleRecords.every((item) => selectedSet.has(item.id));

  const toggleSelectAll = () => {
    setSelectedIds((current) => {
      if (allVisibleSelected) {
        return current.filter((id) => !eligibleRecords.some((item) => item.id === id));
      }

      const merged = new Set(current);
      eligibleRecords.forEach((item) => merged.add(item.id));
      return [...merged];
    });
  };

  const toggleSelectOne = (id) => {
    const record = records.find((item) => item.id === id);
    if (record?.status !== "审核通过待更新") return;
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  };

  const updateReviewStatuses = (ids, nextStatus) => {
    if (ids.length === 0) return;
    const stamp = formatTimestamp();

    setRecords((current) =>
      current.map((item) => {
        if (!ids.includes(item.id)) return item;

        if (nextStatus === "已更新到在线更新平台") {
          return {
            ...item,
            status: nextStatus,
            reviewedAt: item.reviewedAt === "-" ? stamp : item.reviewedAt,
            platformUpdatedAt: stamp,
            reviewComment: item.reviewComment,
          };
        }

        return {
          ...item,
          status: nextStatus,
          reviewedAt: stamp,
          platformUpdatedAt: nextStatus === "审核通过待更新" ? "-" : item.platformUpdatedAt,
          reviewComment: item.reviewComment,
        };
      }),
    );
  };

  const handleSingleAction = (record, nextStatus) => {
    updateReviewStatuses([record.id], nextStatus);
  };

  const handleBatchAction = (nextStatus) => {
    if (selectedIds.length === 0) return;

    const eligibleIds = selectedIds.filter((id) => {
      const target = records.find((item) => item.id === id);
      if (!target) return false;
      if (nextStatus === "已更新到在线更新平台") return target.status === "审核通过待更新";
      return true;
    });

    updateReviewStatuses(eligibleIds, nextStatus);
    setSelectedIds([]);
    if (eligibleIds.length > 0) {
      showToast(`已将 ${eligibleIds.length} 条数据更新到在线更新平台`, "success");
    }
  };

  return (
    <div className="page-content page-content--list review-management-page">
      <ListShell
        className="review-list-shell"
        searchBar={
          <input
            className="input search-input"
            placeholder="搜索编号、名称、描述或提交人"
            value={searchText}
            onChange={(event) => {
              setSearchText(event.target.value);
              setPage(1);
            }}
          />
        }
        filters={
          <FilterSelect
            placeholder="审核状态"
            options={reviewStatusOptions}
            onChange={(selected, allSelected) => {
              const statusMap = {
                "待审核": "待审核",
                "待更新": "审核通过待更新",
                "不通过": "审核不通过",
                "已更新": "已更新到在线更新平台",
              };
              setStatusFilter(allSelected ? [] : selected.map((item) => {
                const key = item.replace(/\s+\d+$/, "");
                return statusMap[key] ?? key;
              }));
              setPage(1);
            }}
          />
        }
        filterActions={
          <div className="review-filter-actions">
            <label className="topic-select-all">
              <input type="checkbox" checked={allVisibleSelected} disabled={eligibleRecords.length === 0} onChange={toggleSelectAll} />
              <span>全选</span>
            </label>
            <button
              type="button"
              className="ghost-button slim-button"
              disabled={selectedIds.length === 0}
              onClick={() => handleBatchAction("已更新到在线更新平台")}
            >
              批量更新平台
            </button>
          </div>
        }
        footer={
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            totalLabel={`共 ${filteredRecords.length} 条`}
            onChangePage={setPage}
            pageSize={pageSize}
            pageSizeOptions={[10, 20, 30, 50]}
            onChangePageSize={(size) => {
              setPageSize(size);
              setPage(1);
            }}
          />
        }
      >
        <div className="review-table-scroll">
          <div className="table-shell selectable review-table-shell">
                {currentTab.id === "corrections" ? (
              <>
                <div className="table-row table-head cols-review-corrections">
                  <span className="checkbox-cell">
                    <input type="checkbox" checked={allVisibleSelected} disabled={eligibleRecords.length === 0} onChange={toggleSelectAll} />
                  </span>
                  <span>编号</span>
                  <span>纠错类型</span>
                  <span>当前对象</span>
                  <span>提交人</span>
                  <span>提交时间</span>
                  <span>审核状态</span>
                  <span>操作</span>
                </div>
                {pagedRecords.map((record) => (
                  <div
                    key={record.id}
                    className="table-row cols-review-corrections review-row"
                    onClick={() => navigate(`/review/${currentTab.id}/${record.id}`)}
                  >
                    <span className="checkbox-cell" onClick={(event) => event.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedSet.has(record.id)}
                        disabled={record.status !== "审核通过待更新"}
                        onChange={() => toggleSelectOne(record.id)}
                      />
                    </span>
                    <span>{record.id}</span>
                    <span>
                      <span className="review-type-badge correction">{record.correctionType}</span>
                    </span>
                    <span className="review-main">
                      <strong>{record.title}</strong>
                      <em>{record.description}</em>
                    </span>
                    <span>{record.submitter}</span>
                    <span>{record.submittedAt}</span>
                    <span>
                      <span className={`status-pill ${reviewStatusTone(record.status)}`}>{compactReviewStatus(record.status)}</span>
                    </span>
                    <span className="review-actions" onClick={(event) => event.stopPropagation()}>
                      <button type="button" className="inline-button action-view" onClick={() => navigate(`/review/${currentTab.id}/${record.id}`)}>
                        <ButtonIcon type="view" />
                        <span>查看</span>
                      </button>
                    </span>
                  </div>
                ))}
              </>
            ) : (
              <>
                <div className="table-row table-head cols-review-markers">
                  <span className="checkbox-cell">
                    <input type="checkbox" checked={allVisibleSelected} disabled={eligibleRecords.length === 0} onChange={toggleSelectAll} />
                  </span>
                  <span>编号</span>
                  <span>标注类型</span>
                  <span>标注名称</span>
                  <span>提交人</span>
                  <span>提交时间</span>
                  <span>审核状态</span>
                  <span>操作</span>
                </div>
                {pagedRecords.map((record) => (
                  <div
                    key={record.id}
                    className="table-row cols-review-markers review-row"
                    onClick={() => navigate(`/review/${currentTab.id}/${record.id}`)}
                  >
                    <span className="checkbox-cell" onClick={(event) => event.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedSet.has(record.id)}
                        disabled={record.status !== "审核通过待更新"}
                        onChange={() => toggleSelectOne(record.id)}
                      />
                    </span>
                    <span>{record.id}</span>
                    <span>
                      <span className="review-type-badge marker">{record.markerType}</span>
                    </span>
                    <span className="review-main">
                      <strong>{record.title}</strong>
                      <em>{record.description}</em>
                    </span>
                    <span>{record.submitter}</span>
                    <span>{record.submittedAt}</span>
                    <span>
                      <span className={`status-pill ${reviewStatusTone(record.status)}`}>{compactReviewStatus(record.status)}</span>
                    </span>
                    <span className="review-actions" onClick={(event) => event.stopPropagation()}>
                      <button type="button" className="inline-button action-view" onClick={() => navigate(`/review/${currentTab.id}/${record.id}`)}>
                        <ButtonIcon type="view" />
                        <span>查看</span>
                      </button>
                    </span>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </ListShell>
    </div>
  );
}

function ReviewDetailPage() {
  const { tab = "corrections", reviewId } = useParams();
  const navigate = useNavigate();
  const [records, setRecords] = useReviewRecords();
  const record = records.find((item) => item.id === reviewId) ?? records[0];
  const [remark, setRemark] = useState("");
  const [error, setError] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const scrollAreaRef = useRef(null);
  const remarkInputRef = useRef(null);

  useEffect(() => {
    setRemark(record?.reviewComment ?? "");
    setError("");
    setPreviewOpen(false);
  }, [record]);

  if (!record) return null;

  const scrollToRemark = () => {
    const scrollArea = scrollAreaRef.current;
    const textarea = remarkInputRef.current;

    window.requestAnimationFrame(() => {
      if (scrollArea) {
        scrollArea.scrollTo({ top: scrollArea.scrollHeight, behavior: "smooth" });
      }
      if (textarea) {
        textarea.focus({ preventScroll: true });
      }
    });
  };

  const persistReview = (nextStatus) => {
    if (nextStatus === "审核不通过" && remark.trim() === "") {
      setError("审核不通过时需要填写处理意见。");
      scrollToRemark();
      return;
    }

    const stamp = formatTimestamp();
    setError("");
    setRecords((current) =>
      current.map((item) => {
        if (item.id !== record.id) return item;
        if (nextStatus === "已更新到在线更新平台") {
          return {
            ...item,
            status: nextStatus,
            reviewedAt: item.reviewedAt === "-" ? stamp : item.reviewedAt,
            platformUpdatedAt: stamp,
            reviewComment: item.status === "审核不通过" ? "" : item.reviewComment,
          };
        }
        return {
          ...item,
          status: nextStatus,
          reviewedAt: stamp,
          platformUpdatedAt: nextStatus === "审核通过待更新" ? "-" : item.platformUpdatedAt,
          reviewComment: nextStatus === "审核不通过" ? remark.trim() : "",
        };
      }),
    );

    if (nextStatus === "审核不通过") {
      showToast("审核不通过，已记录审核意见", "warning");
      return;
    }
    if (nextStatus === "审核通过待更新") {
      showToast("审核通过，待更新到在线更新平台", "success");
      return;
    }
    if (nextStatus === "已更新到在线更新平台") {
      showToast("已更新到在线更新平台", "success");
    }
  };

  const mapData = getReviewMapData(record);

  return (
    <div className="page-content review-detail-page">
      <section className="review-detail-header">
        <div className="review-detail-heading">
          <button type="button" className="icon-back-button" onClick={() => navigate(`/review/${tab}`)} aria-label="返回">
            <ButtonIcon type="back" />
          </button>
          <div className="review-detail-title">
            <h2>{record.title}</h2>
            <span className={`status-pill ${reviewStatusTone(record.status)}`}>{compactReviewStatus(record.status)}</span>
          </div>
        </div>
      </section>

      <section className="content-grid review-detail-layout">
        <article className="panel review-map-panel">
          <ReviewLeafletMap record={record} mapData={mapData} />
        </article>

        <article className="panel review-operation-panel">
          <div ref={scrollAreaRef} className="review-operation-scroll">
            <div className="review-info-sheet">
              {tab === "corrections" ? (
                <>
                  <ReviewInfoRow label="纠错类型" value={record.correctionType} />
                  <ReviewInfoRow
                    label={record.correctionType === "改名称" ? "当前要素" : "当前地点"}
                    value={record.currentName}
                  />
                  <ReviewInfoRow
                    label={
                      record.correctionType === "改地址"
                        ? "当前位置"
                        : record.correctionType === "不存在"
                          ? "当前位置"
                          : "现有名称"
                    }
                    value={record.correctionType === "改名称" ? record.currentName : record.currentAddress}
                  />
                  {record.correctionType === "改地址" ? (
                    <ReviewInfoRow label="新坐标点" value={record.nextCoordinateLabel ?? record.nextCoordinate ?? "-"} />
                  ) : null}
                  {record.correctionType === "不存在" ? (
                    <ReviewInfoRow label="不存在原因" value={record.missingReason ?? "-"} />
                  ) : null}
                  {record.correctionType === "改名称" ? (
                    <ReviewInfoRow label="更改名称" value={record.nextName ?? "-"} />
                  ) : null}
                  <ReviewInfoRow label="补充描述" value={record.detailNote} multiline />
                  <ReviewInfoRow label="提交时间" value={record.submittedAt} />
                </>
              ) : (
                <>
                  <ReviewInfoRow label="名称" value={record.title} />
                  <ReviewInfoRow label="标签分类" value={record.markerCategory} />
                  <ReviewInfoRow label="坐标点" value={(record.markerCoordinates ?? []).join(" / ")} multiline />
                  <ReviewInfoRow label="备注" value={record.markerRemark} multiline />
                  <ReviewInfoRow label="提交时间" value={record.submittedAt} />
                  <div className="review-info-row review-info-row-image">
                    <span>对应图片</span>
                    <button type="button" className="review-image-preview" onClick={() => setPreviewOpen(true)}>
                      <img src={record.markerImage} alt={record.title} />
                      <strong>点击查看大图</strong>
                    </button>
                  </div>
                </>
              )}
            </div>

            <div className="review-remark-section">
              <div className="form-block">
                <label>审核意见</label>
                <textarea
                  className="textarea"
                  rows="5"
                  value={remark}
                  ref={remarkInputRef}
                  onChange={(event) => {
                    setRemark(event.target.value);
                    if (error) setError("");
                  }}
                  placeholder="请撰写审核意见"
                />
                {error ? <span className="form-error">{error}</span> : null}
              </div>
            </div>
          </div>

          <div className="review-operation-footer">
            {record.status === "待审核" ? (
              <>
                <button type="button" className="ghost-button slim-button" onClick={() => persistReview("审核不通过")}>
                  <ButtonIcon type="reject" />
                  <span>审核不通过</span>
                </button>
                <button type="button" className="ghost-button slim-button" onClick={() => persistReview("审核通过待更新")}>
                  <ButtonIcon type="approve" />
                  <span>审核通过</span>
                </button>
                <button type="button" className="primary-button slim-button" onClick={() => persistReview("已更新到在线更新平台")}>
                  <ButtonIcon type="sync" />
                  <span>通过并更新</span>
                </button>
              </>
            ) : null}
            {record.status === "审核通过待更新" ? (
              <button type="button" className="primary-button slim-button" onClick={() => persistReview("已更新到在线更新平台")}>
                <ButtonIcon type="sync" />
                <span>更新到在线更新平台</span>
              </button>
            ) : null}
            {record.status === "审核不通过" ? (
              <>
                <button type="button" className="ghost-button slim-button" onClick={() => persistReview("审核通过待更新")}>
                  <ButtonIcon type="approve" />
                  <span>重新审核通过</span>
                </button>
                <button type="button" className="primary-button slim-button" onClick={() => persistReview("已更新到在线更新平台")}>
                  <ButtonIcon type="sync" />
                  <span>通过并更新</span>
                </button>
              </>
            ) : null}
            {record.status === "已更新到在线更新平台" ? (
              <div className="review-completed-hint">
                <ButtonIcon type="approve" />
                <span>已同步到在线更新平台</span>
              </div>
            ) : null}
          </div>
        </article>
      </section>

      {previewOpen && record.markerImage ? (
        <div className="image-lightbox" role="dialog" aria-modal="true" onClick={() => setPreviewOpen(false)}>
          <div className="image-lightbox-inner" onClick={(event) => event.stopPropagation()}>
            <button type="button" className="image-lightbox-close" onClick={() => setPreviewOpen(false)}>
              ×
            </button>
            <img src={record.markerImage} alt={record.title} />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function compactReviewStatus(status) {
  if (status === "审核通过待更新") return "待更新";
  if (status === "审核不通过") return "不通过";
  if (status === "已更新到在线更新平台") return "已更新";
  return "待审核";
}

function ReviewInfoRow({ label, value, multiline = false }) {
  return (
    <div className={`review-info-row ${multiline ? "multiline" : ""}`}>
      <span>{label}</span>
      <strong>{value || "-"}</strong>
    </div>
  );
}

function parseCoordinateText(text) {
  const [latText, lngText] = String(text ?? "")
    .split(",")
    .map((item) => item.trim());
  const lat = Number(latText);
  const lng = Number(lngText);
  if (Number.isFinite(lat) && Number.isFinite(lng)) return [lat, lng];
  return null;
}

function getReviewMapData(record) {
  if (record.module === "markers") {
    const points = (record.markerCoordinates ?? [])
      .map((item) => parseCoordinateText(item))
      .filter(Boolean);
    return {
      geometry: record.markerGeometry ?? "point",
      center: points[0] ?? [30.6031, 114.3148],
      points,
    };
  }

  const points = [record.currentCoordinate, record.nextCoordinate]
    .filter(Boolean)
    .map((item) => parseCoordinateText(item))
    .filter(Boolean);

  return {
    geometry: "correction",
    center: points[points.length - 1] ?? [30.6031, 114.3148],
    points,
  };
}

function ReviewMapResize() {
  const map = useMap();

  useEffect(() => {
    const id = window.requestAnimationFrame(() => {
      map.invalidateSize();
    });

    return () => window.cancelAnimationFrame(id);
  }, [map]);

  return null;
}

function ReviewLeafletMap({ record, mapData }) {
  return (
    <div className="review-leaflet-shell">
      <MapContainer center={mapData.center} zoom={15} className="review-leaflet-map" scrollWheelZoom>
        <ReviewMapResize />
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {record.module === "corrections"
          ? mapData.points.map((point, index) => (
              <CircleMarker
                key={`${record.id}-${index}`}
                center={point}
                radius={10}
                pathOptions={{
                  color: "#27272a",
                  weight: 2,
                  fillColor: index === 0 ? "#9ca3af" : "#f0b44b",
                  fillOpacity: 0.92,
                }}
              >
                <Tooltip direction="top" offset={[0, -10]} permanent>
                  {index === 0 ? "旧地点" : "新地点"}
                </Tooltip>
                <Popup>
                  <strong>{record.title}</strong>
                  <div>{index === 0 ? "旧地点" : "新地点"}</div>
                </Popup>
              </CircleMarker>
            ))
          : null}
        {record.module === "markers" && mapData.geometry === "point"
          ? mapData.points.map((point, index) => (
              <CircleMarker
                key={`${record.id}-${index}`}
                center={point}
                radius={10}
                pathOptions={{
                  color: "#27272a",
                  weight: 2,
                  fillColor: "#4f7fe0",
                  fillOpacity: 0.92,
                }}
              >
                <Popup>
                  <strong>{record.title}</strong>
                  <div>{record.markerType}</div>
                </Popup>
              </CircleMarker>
            ))
          : null}
        {record.module === "markers" && mapData.geometry === "line" ? (
          <Polyline positions={mapData.points} pathOptions={{ color: "#4f7fe0", weight: 5, opacity: 0.9 }} />
        ) : null}
        {record.module === "markers" && mapData.geometry === "polygon" ? (
          <Polygon
            positions={mapData.points}
            pathOptions={{ color: "#4f7fe0", weight: 3, fillColor: "#4f7fe0", fillOpacity: 0.18 }}
          />
        ) : null}
      </MapContainer>
    </div>
  );
}

function ReviewThumbnail({ record }) {
  if (record.category === "用户标注" && record.markerImage) {
    return <img className="review-thumb-image" src={record.markerImage} alt={record.title} />;
  }

  return (
    <div className="review-thumb-correction">
      <div className="review-thumb-correction-grid" />
      <div className="review-thumb-correction-pin">
        <ButtonIcon type="marker" />
      </div>
      <span>{record.correctionType}</span>
    </div>
  );
}

function TopicPage() {
  const navigate = useNavigate();
  const [records, setRecords] = useTopicMapRecords();
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filteredRecords = records.filter((item) => {
    const keyword = searchText.trim().toLowerCase();
    const matchSearch =
      keyword === "" ||
      [item.id, item.name, item.description].some((field) => field.toLowerCase().includes(keyword));
    const matchStatus = statusFilter.length === 0 || statusFilter.includes(item.status);
    return matchSearch && matchStatus;
  });

  const topicStatusCounts = records.reduce(
    (acc, item) => {
      acc[item.status] = (acc[item.status] ?? 0) + 1;
      return acc;
    },
    { "待审核": 0, "已上架": 0, "已下架": 0 },
  );

  const topicStatusOptions = ["待审核", "已上架", "已下架"].map(
    (status) => `${status} ${topicStatusCounts[status] ?? 0}`,
  );

  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / pageSize));

  useEffect(() => {
    setPage((current) => Math.min(current, totalPages));
  }, [totalPages]);

  const pagedRecords = filteredRecords.slice((page - 1) * pageSize, page * pageSize);
  const selectedSet = new Set(selectedIds);
  const allVisibleSelected =
    pagedRecords.length > 0 && pagedRecords.every((item) => selectedSet.has(item.id));

  const toggleSelectAll = () => {
    setSelectedIds((current) => {
      if (allVisibleSelected) {
        return current.filter((id) => !pagedRecords.some((item) => item.id === id));
      }

      const merged = new Set(current);
      pagedRecords.forEach((item) => merged.add(item.id));
      return [...merged];
    });
  };

  const toggleSelectOne = (id) => {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  };

  const updateStatuses = (ids, nextStatus) => {
    const now = new Date();
    const stamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
      now.getDate(),
    ).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

    setRecords((current) =>
      current.map((item) =>
        ids.includes(item.id)
          ? { ...item, status: nextStatus, updatedAt: stamp }
          : item,
      ),
    );
  };

  const handleSingleToggle = (record) => {
    updateStatuses([record.id], nextTopicStatus(record.status));
  };

  const handleBatchToggle = (targetStatus) => {
    if (selectedIds.length === 0) return;
    updateStatuses(selectedIds, targetStatus);
  };

  return (
    <div className="page-content page-content--list topic-management-page">
      <ListShell
        className="topic-list-shell"
        searchBar={
          <input
            className="input search-input"
            placeholder="搜索主题地图编号、名称或描述"
            value={searchText}
            onChange={(event) => {
              setSearchText(event.target.value);
              setPage(1);
            }}
          />
        }
        filters={
          <FilterSelect
            placeholder="发布状态"
            options={topicStatusOptions}
            onChange={(selected, allSelected) => {
              setStatusFilter(
                allSelected
                  ? []
                  : selected.map((item) => item.replace(/\s+\d+$/, "")),
              );
              setPage(1);
            }}
          />
        }
        filterActions={
          <div className="topic-filter-actions">
            <label className="topic-select-all">
              <input type="checkbox" checked={allVisibleSelected} onChange={toggleSelectAll} />
              <span>全选</span>
            </label>
            <button
              type="button"
              className="ghost-button slim-button"
              onClick={() => handleBatchToggle("已下架")}
              disabled={selectedIds.length === 0}
            >
              <span>批量下架</span>
            </button>
            <button
              type="button"
              className="ghost-button slim-button"
              onClick={() => handleBatchToggle("已上架")}
              disabled={selectedIds.length === 0}
            >
              <span>批量上架</span>
            </button>
          </div>
        }
        footer={
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            totalLabel={`共 ${filteredRecords.length} 条`}
            onChangePage={setPage}
            pageSize={pageSize}
            pageSizeOptions={[10, 20, 30, 50]}
            onChangePageSize={(size) => {
              setPageSize(size);
              setPage(1);
            }}
          />
        }
      >
        <div className="topic-table-scroll">
          <div className="table-shell selectable topic-table-shell">
            <div className="table-row table-head cols-topic-map">
              <span className="checkbox-cell">
                <input type="checkbox" checked={allVisibleSelected} onChange={toggleSelectAll} />
              </span>
              <span>编号</span>
              <span>缩略图</span>
              <span>名称与描述</span>
              <span>发布状态</span>
              <span>更新时间</span>
              <span>操作</span>
            </div>
            {pagedRecords.map((record) => (
              <div
                key={record.id}
                className="table-row cols-topic-map topic-map-row"
                onClick={() => navigate(`/topic/${record.id}`)}
              >
                <span className="checkbox-cell" onClick={(event) => event.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={selectedSet.has(record.id)}
                    onChange={() => toggleSelectOne(record.id)}
                  />
                </span>
                <span>{record.id}</span>
                <span>
                  <img className="topic-thumb" src={record.thumbnail} alt={record.name} />
                </span>
                <span className="topic-map-main">
                  <strong>{record.name}</strong>
                  <em>{record.description}</em>
                </span>
                <span>
                  <span className={`status-pill ${topicStatusTone(record.status)}`}>{record.status}</span>
                </span>
                <span>{record.updatedAt}</span>
                <span className="topic-map-actions" onClick={(event) => event.stopPropagation()}>
                  <button type="button" className="inline-button action-view" onClick={() => navigate(`/topic/${record.id}`)}>
                    <ButtonIcon type="view" />
                    <span>查看</span>
                  </button>
                  <button
                    type="button"
                    className={`inline-button action-publish ${record.status === "已上架" ? "danger-button" : ""}`}
                    onClick={() => handleSingleToggle(record)}
                  >
                    <ButtonIcon type={record.status === "已上架" ? "down" : "up"} />
                    <span>{topicActionLabel(record.status)}</span>
                  </button>
                </span>
              </div>
            ))}
          </div>
        </div>
      </ListShell>
    </div>
  );
}

function TopicDetailPage() {
  const { topicId } = useParams();
  const navigate = useNavigate();
  const [records, setRecords] = useTopicMapRecords();
  const record = records.find((item) => item.id === topicId) ?? records[0];

  if (!record) return null;

  const toggleStatus = () => {
    const now = new Date();
    const stamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
      now.getDate(),
    ).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

    setRecords((current) =>
      current.map((item) =>
        item.id === record.id
          ? { ...item, status: nextTopicStatus(item.status), updatedAt: stamp }
          : item,
      ),
    );
  };

  return (
    <div className="page-content topic-detail-page">
      <section className="topic-detail-header">
        <div className="topic-detail-heading">
          <button type="button" className="icon-back-button" onClick={() => navigate("/topic")} aria-label="返回">
            <ButtonIcon type="back" />
          </button>
          <div className="topic-detail-title">
            <h2>{record.name}</h2>
            <span className={`status-pill ${topicStatusTone(record.status)}`}>{record.status}</span>
          </div>
        </div>
        <div className="topic-detail-toolbar">
          <button type="button" className={record.status === "已上架" ? "ghost-button slim-button" : "primary-button slim-button"} onClick={toggleStatus}>
            <ButtonIcon type={record.status === "已上架" ? "down" : "up"} />
            <span>{topicActionLabel(record.status)}</span>
          </button>
        </div>
      </section>

      <section className="topic-detail-description">
        <p>{record.description}</p>
      </section>

      <section className="topic-detail-map-shell">
        <TopicMapViewer record={record} />
      </section>
    </div>
  );
}

function TopicMapViewer({ record }) {
  return (
    <div className="topic-map-viewer">
      <div className="topic-map-canvas">
        <img className="topic-map-image static" src={record.thumbnail} alt={record.name} />
      </div>
    </div>
  );
}

function ButtonIcon({ type }) {
  return (
    <span className={`button-icon button-icon-${type}`} aria-hidden="true">
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        {type === "view" && (
          <>
            <path d="M1.5 8s2.3-4 6.5-4 6.5 4 6.5 4-2.3 4-6.5 4-6.5-4-6.5-4Z" />
            <circle cx="8" cy="8" r="1.8" />
          </>
        )}
        {type === "up" && (
          <>
            <path d="M8 12V4" />
            <path d="m4.8 7.2 3.2-3.2 3.2 3.2" />
          </>
        )}
        {type === "down" && (
          <>
            <path d="M8 4v8" />
            <path d="m4.8 8.8 3.2 3.2 3.2-3.2" />
          </>
        )}
        {type === "approve" && (
          <>
            <path d="m3.8 8.3 2.4 2.4 6-6" />
          </>
        )}
        {type === "reject" && (
          <>
            <path d="m5 5 6 6" />
            <path d="m11 5-6 6" />
          </>
        )}
        {type === "sync" && (
          <>
            <path d="M13 8a5 5 0 0 1-8.5 3.5" />
            <path d="m2.8 9.8 1.7 1.8 2.1-1.5" />
            <path d="M3 8a5 5 0 0 1 8.5-3.5" />
            <path d="m13.2 6.2-1.7-1.8-2.1 1.5" />
          </>
        )}
        {type === "marker" && (
          <>
            <path d="M8 13s3.2-3.3 3.2-5.7A3.2 3.2 0 0 0 8 4.1a3.2 3.2 0 0 0-3.2 3.2C4.8 9.7 8 13 8 13Z" />
            <circle cx="8" cy="7.3" r="1.1" />
          </>
        )}
        {type === "back" && (
          <>
            <path d="M13 8H3" />
            <path d="m6.8 4.4-3.6 3.6 3.6 3.6" />
          </>
        )}
      </svg>
    </span>
  );
}

function ReleaseNotesPage() {
  const [page, setPage] = useState(1);

  return (
    <div className="page-content page-content--list">
      <ListShell
        actions={<button type="button" className="primary-button slim-button">新增日志</button>}
        searchBar={<input className="input search-input" placeholder="搜索版本号、标题或摘要" />}
        filters={
          <>
            <FilterSelect placeholder="版本" options={["1.0.0", "1.0.1", "2.0.0"]} defaultAll />
            <FilterSelect placeholder="平台" options={["Android", "iOS"]} />
            <FilterSelect placeholder="状态" options={["已发布", "待发布"]} />
          </>
        }
        footer={<Pagination currentPage={page} totalPages={1} totalLabel="共 2 条" onChangePage={setPage} />}
      >
        <SimpleTable
          columns={["版本号", "平台", "标题", "状态", "发布时间", "用户量"]}
          rows={releaseNoteRows}
        />
      </ListShell>
    </div>
  );
}

function FeedbackPage() {
  const navigate = useNavigate();
  const [records] = useFeedbackRecords();
  const [searchText, setSearchText] = useState("");
  const [typeFilter, setTypeFilter] = useState([]);
  const [statusFilter, setStatusFilter] = useState([]);
  const [adoptFilter, setAdoptFilter] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filteredRecords = records.filter((item) => {
    const keyword = searchText.trim().toLowerCase();
    const matchSearch =
      keyword === "" ||
      [item.id, item.submitter, item.contact, item.content].some((field) =>
        field.toLowerCase().includes(keyword),
      );
    const matchType = typeFilter.length === 0 || typeFilter.includes(item.type);
    const matchStatus = statusFilter.length === 0 || statusFilter.includes(item.status);
    const matchAdopt = adoptFilter.length === 0 || (item.adoptStatus && adoptFilter.includes(item.adoptStatus));
    return matchSearch && matchType && matchStatus && matchAdopt;
  });

  const feedbackTypeCounts = records.reduce(
    (acc, item) => {
      acc[item.type] = (acc[item.type] ?? 0) + 1;
      return acc;
    },
    { "问题反馈": 0, "功能建议": 0, "体验优化": 0 },
  );

  const feedbackStatusCounts = records.reduce(
    (acc, item) => {
      acc[item.status] = (acc[item.status] ?? 0) + 1;
      return acc;
    },
    { "待处理": 0, "处理中": 0, "已处理": 0, "已关闭": 0 },
  );

  const feedbackTypeOptions = ["问题反馈", "功能建议", "体验优化"].map(
    (type) => `${type} ${feedbackTypeCounts[type] ?? 0}`,
  );

  const feedbackStatusOptions = ["待处理", "处理中", "已处理", "已关闭"].map(
    (status) => `${status} ${feedbackStatusCounts[status] ?? 0}`,
  );

  const feedbackAdoptCounts = records
    .filter((item) => item.type === "功能建议" && item.adoptStatus)
    .reduce(
      (acc, item) => {
        acc[item.adoptStatus] = (acc[item.adoptStatus] ?? 0) + 1;
        return acc;
      },
      { "采纳": 0, "暂不采纳": 0, "已纳入计划": 0 },
    );

  const feedbackAdoptOptions = ["采纳", "暂不采纳", "已纳入计划"].map(
    (status) => `${status} ${feedbackAdoptCounts[status] ?? 0}`,
  );

  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / pageSize));

  useEffect(() => {
    setPage((current) => Math.min(current, totalPages));
  }, [totalPages]);

  const pagedRecords = filteredRecords.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="page-content page-content--list feedback-management-page">
      <ListShell
        className="feedback-list-shell"
        searchBar={
          <input
            className="input search-input"
            placeholder="搜索编号、提交人、联系方式或反馈内容"
            value={searchText}
            onChange={(event) => {
              setSearchText(event.target.value);
              setPage(1);
            }}
          />
        }
        filters={
          <>
            <FilterSelect
              placeholder="反馈类型"
              options={feedbackTypeOptions}
              onChange={(selected, allSelected) => {
                setTypeFilter(allSelected ? [] : selected.map((item) => item.replace(/\s+\d+$/, "")));
                setPage(1);
              }}
            />
            <FilterSelect
              placeholder="处理状态"
              options={feedbackStatusOptions}
              onChange={(selected, allSelected) => {
                setStatusFilter(allSelected ? [] : selected.map((item) => item.replace(/\s+\d+$/, "")));
                setPage(1);
              }}
            />
            <FilterSelect
              placeholder="采纳状态"
              options={feedbackAdoptOptions}
              onChange={(selected, allSelected) => {
                setAdoptFilter(allSelected ? [] : selected.map((item) => item.replace(/\s+\d+$/, "")));
                setPage(1);
              }}
            />
          </>
        }
        footer={
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            totalLabel={`共 ${filteredRecords.length} 条`}
            onChangePage={setPage}
            pageSize={pageSize}
            pageSizeOptions={[10, 20, 30, 50]}
            onChangePageSize={(size) => {
              setPageSize(size);
              setPage(1);
            }}
          />
        }
      >
        <div className="feedback-table-scroll">
          <div className="table-shell selectable feedback-table-shell">
            <div className="table-row table-head cols-feedback">
              <span>编号</span>
              <span>反馈类型</span>
              <span>反馈内容</span>
              <span>提交人</span>
              <span>提交时间</span>
              <span>处理状态</span>
              <span>操作</span>
            </div>
            {pagedRecords.map((record) => (
              <div
                key={record.id}
                className="table-row cols-feedback feedback-row"
                onClick={() => navigate(`/feedback/${record.id}`)}
              >
                <span>{record.id}</span>
                <span>
                  <span className={`feedback-type-badge ${record.type === "问题反馈" ? "bug" : record.type === "功能建议" ? "feature" : "optimize"}`}>
                    {record.type}
                  </span>
                </span>
                <span className="feedback-content-cell">
                  <em>{record.content}</em>
                </span>
                <span>{record.submitter}</span>
                <span>{record.submittedAt}</span>
                <span>
                  <span className={`status-pill ${feedbackStatusTone(record.status)}`}>
                    {compactFeedbackStatus(record.status)}
                  </span>
                </span>
                <span className="feedback-actions" onClick={(event) => event.stopPropagation()}>
                  <button
                    type="button"
                    className="inline-button action-view"
                    onClick={() => navigate(`/feedback/${record.id}`)}
                  >
                    <ButtonIcon type="view" />
                    <span>查看</span>
                  </button>
                </span>
              </div>
            ))}
          </div>
        </div>
      </ListShell>
    </div>
  );
}

function FeedbackDetailPage() {
  const { feedbackId } = useParams();
  const navigate = useNavigate();
  const [records, setRecords] = useFeedbackRecords();
  const record = records.find((item) => item.id === feedbackId) ?? records[0];
  const [handleResult, setHandleResult] = useState("");
  const [adoptStatus, setAdoptStatus] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setHandleResult(record?.handleResult ?? "");
    setAdoptStatus(record?.adoptStatus ?? "");
    setError("");
  }, [record]);

  if (!record) return null;

  const isFeatureType = record.type === "功能建议";
  const canProcess = record.status === "待处理" || record.status === "处理中";
  const typeTone = record.type === "问题反馈" ? "bug" : record.type === "功能建议" ? "feature" : "optimize";

  const updateFeedback = (nextStatus) => {
    if (nextStatus === "已处理" && handleResult.trim() === "") {
      setError("处理结果不能为空");
      return;
    }

    if (isFeatureType && nextStatus === "已处理" && !adoptStatus) {
      setError("功能建议需要选择采纳状态");
      return;
    }

    const stamp = formatTimestamp();
    setError("");
    setRecords((current) =>
      current.map((item) => {
        if (item.id !== record.id) return item;
        return {
          ...item,
          status: nextStatus,
          handler: "平台管理员",
          handledAt: nextStatus === "已处理" || nextStatus === "已关闭" ? stamp : item.handledAt,
          handleResult: handleResult.trim(),
          adoptStatus: isFeatureType ? adoptStatus : item.adoptStatus,
        };
      }),
    );

    if (nextStatus === "已处理") {
      showToast("反馈已处理", "success");
    } else if (nextStatus === "处理中") {
      showToast("已标记为处理中", "success");
    } else if (nextStatus === "已关闭") {
      showToast("反馈已关闭", "success");
    }
  };

  return (
    <div className="page-content feedback-detail-page">
      <section className="feedback-detail-header">
        <div className="feedback-detail-heading">
          <button type="button" className="icon-back-button" onClick={() => navigate("/feedback")} aria-label="返回">
            <ButtonIcon type="back" />
          </button>
          <div className="feedback-detail-title-block">
            <div className="feedback-detail-title">
              <h2>{record.id}</h2>
              <span className={`status-pill ${feedbackStatusTone(record.status)}`}>
                {compactFeedbackStatus(record.status)}
              </span>
            </div>
            <div className="feedback-detail-subline">
              <span className={`feedback-type-badge ${typeTone}`}>{record.type}</span>
              <span>{record.submitter}</span>
              <span>{record.submittedAt}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="content-grid feedback-detail-layout">
        <article className="panel feedback-info-panel feedback-story-panel">
          <div className="feedback-panel-head">
            <div>
              <span className="feedback-panel-kicker">反馈概览</span>
              <h3>用户提交内容</h3>
            </div>
          </div>
          <div className="feedback-info-scroll">
            <section className="feedback-hero-card">
              <div className="feedback-hero-copy">
                <span className="feedback-section-label">反馈内容</span>
                <div className="feedback-content-text feedback-content-text--hero">
                  {record.content}
                </div>
              </div>
              <div className="feedback-meta-grid">
                <div className="feedback-meta-card">
                  <span>提交人</span>
                  <strong>{record.submitter}</strong>
                </div>
                <div className="feedback-meta-card">
                  <span>联系方式</span>
                  <strong>{record.contact}</strong>
                </div>
                <div className="feedback-meta-card">
                  <span>提交时间</span>
                  <strong>{record.submittedAt}</strong>
                </div>
                <div className="feedback-meta-card">
                  <span>反馈类型</span>
                  <strong>
                    <span className={`feedback-type-badge ${typeTone}`}>{record.type}</span>
                  </strong>
                </div>
              </div>
            </section>

            <section className="feedback-surface-card feedback-images-block">
              <div className="feedback-section-heading">
                <div>
                  <span className="feedback-section-label">图片补充</span>
                  <h4>现场截图与附件</h4>
                </div>
              </div>
              {record.images.length > 0 ? (
                <div className="feedback-images">
                  {record.images.filter(Boolean).map((img, index) => (
                    <figure key={index} className="feedback-image-frame">
                      <img src={img} alt={`反馈图片 ${index + 1}`} />
                    </figure>
                  ))}
                </div>
              ) : (
                <div className="feedback-images-empty">
                  <span>当前反馈未附带截图或补充图片</span>
                </div>
              )}
            </section>
          </div>
        </article>

        <article className="panel feedback-operation-panel feedback-workbench-panel">
          <div className="feedback-panel-head">
            <div>
              <span className="feedback-panel-kicker">处理工作台</span>
              <h3>跟进状态与操作</h3>
            </div>
            <span className={`status-pill ${feedbackStatusTone(record.status)}`}>
              {compactFeedbackStatus(record.status)}
            </span>
          </div>
          <div className="feedback-operation-scroll">
            <section className="feedback-status-grid">
              <div className="feedback-status-card">
                <span>处理人</span>
                <strong>{record.handler || "待分配"}</strong>
              </div>
              <div className="feedback-status-card">
                <span>处理时间</span>
                <strong>{record.handledAt || "尚未处理"}</strong>
              </div>
              {record.adoptStatus ? (
                <div className="feedback-status-card feedback-status-card--accent">
                  <span>采纳状态</span>
                  <strong className={`adopt-status ${record.adoptStatus === "采纳" ? "adopt" : record.adoptStatus === "暂不采纳" ? "reject" : "plan"}`}>
                    {record.adoptStatus}
                  </strong>
                </div>
              ) : null}
            </section>

            <section className="feedback-surface-card feedback-result-block">
              <div className="feedback-section-heading">
                <div>
                  <span className="feedback-section-label">处理结果</span>
                  <h4>当前结论</h4>
                </div>
              </div>
              {record.handleResult ? (
                <p>{record.handleResult}</p>
              ) : (
                <div className="feedback-result-empty">
                  <span>尚未填写处理结果，完成流转后会在这里展示。</span>
                </div>
              )}
            </section>

            {canProcess ? (
              <div className="feedback-handle-section">
                <div className="feedback-section-heading">
                  <div>
                    <span className="feedback-section-label">填写处理意见</span>
                    <h4>更新处理进展</h4>
                  </div>
                </div>
                <div className="form-block">
                  <textarea
                    className="textarea"
                    rows="4"
                    value={handleResult}
                    onChange={(event) => {
                      setHandleResult(event.target.value);
                      if (error) setError("");
                    }}
                    placeholder="请填写处理结果"
                  />
                </div>

                {isFeatureType ? (
                  <div className="form-block">
                    <label>采纳状态</label>
                    <div className="adopt-options">
                      {["采纳", "暂不采纳", "已纳入计划"].map((option) => (
                        <button
                          key={option}
                          type="button"
                          className={`adopt-option ${adoptStatus === option ? "active" : ""}`}
                          onClick={() => {
                            setAdoptStatus(option);
                            if (error) setError("");
                          }}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}

                {error ? <span className="form-error">{error}</span> : null}
              </div>
            ) : null}
          </div>

          <div className="feedback-operation-footer">
            {record.status === "待处理" ? (
              <>
                <button type="button" className="ghost-button slim-button" onClick={() => updateFeedback("处理中")}>
                  <ButtonIcon type="approve" />
                  <span>标记处理中</span>
                </button>
                <button type="button" className="primary-button slim-button" onClick={() => updateFeedback("已处理")}>
                  <ButtonIcon type="sync" />
                  <span>处理完成</span>
                </button>
              </>
            ) : null}
            {record.status === "处理中" ? (
              <>
                <button type="button" className="ghost-button slim-button" onClick={() => updateFeedback("已关闭")}>
                  <ButtonIcon type="reject" />
                  <span>关闭反馈</span>
                </button>
                <button type="button" className="primary-button slim-button" onClick={() => updateFeedback("已处理")}>
                  <ButtonIcon type="sync" />
                  <span>处理完成</span>
                </button>
              </>
            ) : null}
            {record.status === "已处理" ? (
              <button type="button" className="ghost-button slim-button" onClick={() => updateFeedback("已关闭")}>
                <ButtonIcon type="reject" />
                <span>关闭反馈</span>
              </button>
            ) : null}
            {record.status === "已关闭" ? (
              <div className="feedback-completed-hint">
                <ButtonIcon type="approve" />
                <span>反馈已关闭</span>
              </div>
            ) : null}
          </div>
        </article>
      </section>
    </div>
  );
}

function FeedbackPageV2() {
  const navigate = useNavigate();
  const [records] = useSimplifiedFeedbackRecords();
  const [searchText, setSearchText] = useState("");
  const [typeFilter, setTypeFilter] = useState([]);
  const [statusFilter, setStatusFilter] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const duplicateCountMap = records.reduce((acc, item) => {
    if (item.duplicateOf) {
      acc[item.duplicateOf] = (acc[item.duplicateOf] ?? 0) + 1;
    }
    return acc;
  }, {});

  const filteredRecords = records.filter((item) => {
    const keyword = searchText.trim().toLowerCase();
    const matchSearch =
      keyword === "" ||
      [item.id, item.submitter, item.contact, item.content, item.duplicateOf]
        .filter(Boolean)
        .some((field) => field.toLowerCase().includes(keyword));
    const matchType = typeFilter.length === 0 || typeFilter.includes(item.type);
    const matchStatus = statusFilter.length === 0 || statusFilter.includes(item.status);
    return matchSearch && matchType && matchStatus;
  });

  const feedbackTypeCounts = records.reduce(
    (acc, item) => {
      acc[item.type] = (acc[item.type] ?? 0) + 1;
      return acc;
    },
    { "问题反馈": 0, "功能建议": 0, "体验优化": 0 },
  );

  const feedbackStatusCounts = records.reduce(
    (acc, item) => {
      acc[item.status] = (acc[item.status] ?? 0) + 1;
      return acc;
    },
    { "待处理": 0, "已采纳": 0, "不采纳": 0 },
  );

  const feedbackTypeOptions = ["问题反馈", "功能建议", "体验优化"].map(
    (type) => `${type} ${feedbackTypeCounts[type] ?? 0}`,
  );
  const feedbackStatusOptions = feedbackStatusChoices.map(
    (status) => `${status} ${feedbackStatusCounts[status] ?? 0}`,
  );

  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / pageSize));

  useEffect(() => {
    setPage((current) => Math.min(current, totalPages));
  }, [totalPages]);

  const pagedRecords = filteredRecords.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="page-content page-content--list feedback-management-page">
      <ListShell
        className="feedback-list-shell"
        searchBar={
          <input
            className="input search-input"
            placeholder="搜索编号、提交人、联系方式或反馈内容"
            value={searchText}
            onChange={(event) => {
              setSearchText(event.target.value);
              setPage(1);
            }}
          />
        }
        filters={
          <>
            <FilterSelect
              placeholder="反馈类型"
              options={feedbackTypeOptions}
              onChange={(selected, allSelected) => {
                setTypeFilter(allSelected ? [] : selected.map((item) => item.replace(/\s+\d+$/, "")));
                setPage(1);
              }}
            />
            <FilterSelect
              placeholder="处理状态"
              options={feedbackStatusOptions}
              onChange={(selected, allSelected) => {
                setStatusFilter(allSelected ? [] : selected.map((item) => item.replace(/\s+\d+$/, "")));
                setPage(1);
              }}
            />
          </>
        }
        footer={
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            totalLabel={`共 ${filteredRecords.length} 条`}
            onChangePage={setPage}
            pageSize={pageSize}
            pageSizeOptions={[10, 20, 30, 50]}
            onChangePageSize={(size) => {
              setPageSize(size);
              setPage(1);
            }}
          />
        }
      >
        <div className="feedback-table-scroll">
          <div className="table-shell selectable feedback-table-shell">
            <div className="table-row table-head cols-feedback-v2">
              <span>编号</span>
              <span>反馈类型</span>
              <span>反馈内容</span>
              <span>提交人</span>
              <span>提交时间</span>
              <span>处理状态</span>
              <span>操作</span>
            </div>
            {pagedRecords.map((record) => {
              const duplicateCount = duplicateCountMap[record.id] ?? 0;
              const typeTone = record.type === "问题反馈" ? "bug" : record.type === "功能建议" ? "feature" : "optimize";

              return (
                <div
                  key={record.id}
                  className="table-row cols-feedback-v2 feedback-row"
                  onClick={() => navigate(`/feedback/${record.id}`)}
                >
                  <span>{record.id}</span>
                  <span>
                    <span className={`feedback-type-badge ${typeTone}`}>{record.type}</span>
                  </span>
                  <span className="feedback-content-cell">
                    <em>{record.content}</em>
                  </span>
                  <span>{record.submitter}</span>
                  <span>{record.submittedAt}</span>
                  <span>
                    <span className="feedback-status-cell">
                      <span className={`status-pill ${simplifiedFeedbackStatusTone(record.status)}`}>
                        {simplifiedFeedbackStatusLabel(record.status)}
                      </span>
                      {record.status === "已采纳" && record.duplicateOf ? (
                        <em className="feedback-inline-note">已归集到 {record.duplicateOf}</em>
                      ) : record.status === "已采纳" && duplicateCount > 0 ? (
                        <em className="feedback-inline-note">已归集 {duplicateCount} 条</em>
                      ) : null}
                    </span>
                  </span>
                  <span className="feedback-actions" onClick={(event) => event.stopPropagation()}>
                    <button
                      type="button"
                      className="inline-button action-view"
                      onClick={() => navigate(`/feedback/${record.id}`)}
                    >
                      <ButtonIcon type="view" />
                      <span>查看</span>
                    </button>
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </ListShell>
    </div>
  );
}

function FeedbackDetailPageV2() {
  const { feedbackId } = useParams();
  const navigate = useNavigate();
  const [records, setRecords] = useSimplifiedFeedbackRecords();
  const record = records.find((item) => item.id === feedbackId) ?? records[0];
  const [handleResult, setHandleResult] = useState("");
  const [status, setStatus] = useState("待处理");
  const [duplicateOf, setDuplicateOf] = useState("");
  const [previewImage, setPreviewImage] = useState("");
  const [activeGroupIndex, setActiveGroupIndex] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    setHandleResult(record?.handleResult ?? "");
    setStatus(record?.status ?? "待处理");
    setDuplicateOf(record?.duplicateOf ?? "");
    setPreviewImage("");
    setError("");
  }, [record]);

  if (!record) return null;

  const typeTone = record.type === "问题反馈" ? "bug" : record.type === "功能建议" ? "feature" : "optimize";
  const duplicateParent = records.find((item) => item.id === record.duplicateOf);
  const duplicateChildren = records.filter((item) => item.duplicateOf === record.id);
  const groupRoot = duplicateParent ?? record;
  const groupedRecords = duplicateParent
    ? [duplicateParent, ...records.filter((item) => item.duplicateOf === duplicateParent.id)]
    : [record, ...duplicateChildren];
  const groupedRecordIds = groupedRecords.map((item) => item.id).join("|");
  const activeGroupRecord = groupedRecords[activeGroupIndex] ?? record;
  const duplicateCandidates = records.filter(
    (item) =>
      item.id !== record.id &&
      item.status === "已采纳" &&
      (item.id === record.duplicateOf || !item.duplicateOf),
  );
  const duplicateCandidateOptions = duplicateCandidates.map((item) => ({
    value: item.id,
    label: summarizeFeedbackContent(item.content),
    meta: `${item.submitter} · ${item.submittedAt}`,
    idText: item.id,
    searchText: `${item.content} ${item.submitter} ${item.id}`,
  }));
  const imageList = activeGroupRecord.images.filter(Boolean);
  const canLinkDuplicate = status === "已采纳";
  const canSaveAsNonAccepted = duplicateChildren.length === 0;

  useEffect(() => {
    const currentIndex = groupedRecords.findIndex((item) => item.id === record.id);
    setActiveGroupIndex(currentIndex >= 0 ? currentIndex : 0);
  }, [record.id, groupedRecordIds]);

  useEffect(() => {
    if (status !== "已采纳" && duplicateOf) {
      setDuplicateOf("");
    }
  }, [status, duplicateOf]);

  const saveFeedback = () => {
    if (status !== "已采纳" && duplicateChildren.length > 0) {
      setError("已归集其他反馈的主反馈需保持为已采纳");
      return;
    }

    if (status !== "已采纳" && duplicateOf) {
      setError("待处理和不采纳的反馈不能归集");
      return;
    }

    if (duplicateChildren.length > 0 && duplicateOf) {
      setError("当前反馈已经归集了其他重复反馈，不能再归集到其他主反馈");
      return;
    }

    const stamp = formatTimestamp();
    const trimmedResult = handleResult.trim();
    const isResolved = status !== "待处理";
    const nextDuplicateOf = status === "已采纳" ? duplicateOf : "";
    setError("");
    setRecords((current) =>
      current.map((item) => {
        if (item.id !== record.id) return item;
        return {
          ...item,
          status,
          handler: isResolved ? item.handler || "平台管理员" : "",
          handledAt: isResolved ? item.handledAt || stamp : "",
          handleResult: trimmedResult,
          duplicateOf: nextDuplicateOf,
        };
      }),
    );

    if (status === "待处理") {
      showToast("反馈已更新", "success");
    } else {
      showToast(record.status === status ? "反馈处理结果已更新" : `反馈已标记为${status}`, "success");
    }
  };

  return (
    <div className="page-content feedback-v2-page">
      <section className="feedback-detail-header">
        <div className="feedback-detail-heading">
          <button type="button" className="icon-back-button" onClick={() => navigate("/feedback")} aria-label="返回">
            <ButtonIcon type="back" />
          </button>
          <div className="feedback-v2-title-block">
            <div className="feedback-detail-title">
              <h2>{record.id}</h2>
              <span className={`status-pill ${simplifiedFeedbackStatusTone(record.status)}`}>
                {simplifiedFeedbackStatusLabel(record.status)}
              </span>
            </div>
            <div className="feedback-v2-meta">
              <span className={`feedback-type-badge ${typeTone}`}>{record.type}</span>
              <span>{record.submitter}</span>
              <span>{record.submittedAt}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="content-grid feedback-v2-layout">
        <article className="panel feedback-v2-main">
          <section className="feedback-v2-section">
            <div className="feedback-v2-section-head">
              <h3>反馈内容</h3>
              {groupedRecords.length > 1 ? (
                <div className="feedback-v2-group-switch">
                  <button
                    type="button"
                    className="feedback-v2-nav-button"
                    onClick={() => setActiveGroupIndex((current) => (current - 1 + groupedRecords.length) % groupedRecords.length)}
                    aria-label="查看上一条反馈"
                  >
                    <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M7.5 2.5 4 6l3.5 3.5" />
                    </svg>
                  </button>
                  <span>{activeGroupIndex + 1} / {groupedRecords.length}</span>
                  <button
                    type="button"
                    className="feedback-v2-nav-button"
                    onClick={() => setActiveGroupIndex((current) => (current + 1) % groupedRecords.length)}
                    aria-label="查看下一条反馈"
                  >
                    <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4.5 2.5 8 6 4.5 9.5" />
                    </svg>
                  </button>
                </div>
              ) : null}
            </div>
            {groupedRecords.length > 1 ? (
              <div className="feedback-v2-group-meta">
                <strong>{activeGroupRecord.id}</strong>
                <span>{activeGroupRecord.submitter} · {activeGroupRecord.submittedAt}</span>
              </div>
            ) : null}
            <div className="feedback-v2-content">{activeGroupRecord.content}</div>
            <div className="feedback-v2-contact">
              <span>反馈人联系方式</span>
              <strong>{activeGroupRecord.contact}</strong>
            </div>
          </section>

          <section className="feedback-v2-section">
            <div className="feedback-v2-section-head">
              <h3>补充图片</h3>
              {imageList.length > 0 ? <span>点击查看大图</span> : null}
            </div>
            {imageList.length > 0 ? (
              <div className="feedback-v2-gallery">
                {imageList.map((img, index) => (
                  <button
                    key={`${img}-${index}`}
                    type="button"
                    className="feedback-v2-thumb"
                    onClick={() => setPreviewImage(img)}
                  >
                    <img src={img} alt={`反馈图片 ${index + 1}`} />
                  </button>
                ))}
              </div>
            ) : (
              <div className="feedback-v2-empty">暂无补充图片</div>
            )}
          </section>
        </article>

        <article className="panel feedback-v2-side">
          <div className="feedback-v2-side-scroll">
            <section className="feedback-v2-section">
              <div className="feedback-v2-section-head">
                <h3>处理反馈</h3>
                <span>当前处理 {record.id}</span>
              </div>

              {duplicateParent ? (
                <div className="feedback-v2-note feedback-v2-note-actionable">
                  <span>{`这条反馈已归集到「${summarizeFeedbackContent(duplicateParent.content)}」`}</span>
                  <button
                    type="button"
                    className="feedback-v2-link-button"
                    onClick={() => navigate(`/feedback/${duplicateParent.id}`)}
                  >
                    查看主反馈
                  </button>
                </div>
              ) : null}

              {!duplicateParent && duplicateChildren.length > 0 ? (
                <div className="feedback-v2-note">
                  <span>已归集 {duplicateChildren.length} 条重复反馈</span>
                  <div className="feedback-v2-related-list">
                    {duplicateChildren.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        className="feedback-v2-related-item"
                        onClick={() => navigate(`/feedback/${item.id}`)}
                      >
                        <strong>{summarizeFeedbackContent(item.content)}</strong>
                        <span>{item.id} · {item.submitter}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="form-block">
                <label>是否采纳</label>
                <FeedbackSingleSelect
                  value={status}
                  compact
                  options={feedbackDecisionOptions}
                  onChange={(nextValue) => {
                    setStatus(nextValue);
                    if (error) setError("");
                  }}
                />
              </div>

              {canLinkDuplicate ? (
                <div className="form-block">
                  <label>归集到主反馈</label>
                  <FeedbackSingleSelect
                    value={duplicateOf}
                    options={[
                      { value: "", label: "不归集", meta: "保留为独立反馈" },
                      ...duplicateCandidateOptions,
                    ]}
                    searchable
                    searchPlaceholder="搜索反馈内容、提交人或编号"
                    placeholder="请选择主反馈"
                    onChange={(nextValue) => {
                      setDuplicateOf(nextValue);
                      if (error) setError("");
                    }}
                  />
                </div>
              ) : null}

              {!canLinkDuplicate ? (
                <div className="feedback-v2-inline-hint">待处理和不采纳的反馈不参与归集</div>
              ) : null}

              {!canSaveAsNonAccepted && status !== "已采纳" ? (
                <div className="feedback-v2-inline-hint">当前反馈已归集其他反馈，需保持为已采纳</div>
              ) : null}

              <div className="form-block">
                <label>处理意见</label>
                <textarea
                  className="textarea feedback-v2-textarea"
                  rows="5"
                  value={handleResult}
                  onChange={(event) => {
                    setHandleResult(event.target.value);
                    if (error) setError("");
                  }}
                  placeholder="请简要填写处理意见"
                />
              </div>

              {error ? <span className="form-error">{error}</span> : null}
            </section>
          </div>

          <div className="feedback-v2-actions">
            <button type="button" className="primary-button slim-button" onClick={saveFeedback}>
              <ButtonIcon type="approve" />
              <span>{record.status === "待处理" ? "处理完成" : "保存更新"}</span>
            </button>
          </div>
        </article>
      </section>

      {previewImage ? (
        <div className="image-lightbox" role="dialog" aria-modal="true" onClick={() => setPreviewImage("")}>
          <div className="image-lightbox-inner" onClick={(event) => event.stopPropagation()}>
            <button type="button" className="image-lightbox-close" onClick={() => setPreviewImage("")}>
              ×
            </button>
            <img src={previewImage} alt="反馈图片预览" />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function OpsPage() {
  const [page, setPage] = useState(1);

  return (
    <div className="page-content page-content--list">
      <ListShell
        actions={<button type="button" className="ghost-button slim-button">导出日志</button>}
        searchBar={<input className="input search-input" placeholder="搜索服务、日志级别或关键字" />}
        filters={
          <>
            <FilterSelect placeholder="服务类型" options={["地图服务", "搜索服务", "标签入库", "专题发布流"]} defaultAll />
            <FilterSelect placeholder="级别" options={["INFO", "WARN", "ERROR"]} />
          </>
        }
        footer={<Pagination currentPage={page} totalPages={8} totalLabel="共 128 条" onChangePage={setPage} />}
      >
        <SimpleTable columns={["时间", "级别", "来源", "内容"]} rows={logRows} rowClassName="four" />
      </ListShell>
    </div>
  );
}

function SystemPage() {
  const { tab = "users" } = useParams();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const current = systemTables[tab] ?? systemTables.users;
  const title = systemTabs.find((item) => item.id === tab)?.label ?? "系统管理";

  return (
    <div className="page-content page-content--list">
      <section className="tabbar soft-tabbar">
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

      <ListShell
        actions={<button type="button" className="primary-button slim-button">新增</button>}
        searchBar={<input className="input search-input" placeholder={`搜索${title}`} />}
        filters={<FilterSelect placeholder="状态" options={["启用", "停用"]} defaultAll />}
        footer={<Pagination currentPage={page} totalPages={5} totalLabel={`共 ${current.rows.length * 5} 条`} onChangePage={setPage} />}
      >
        <SimpleTable columns={current.columns} rows={current.rows} />
      </ListShell>
    </div>
  );
}

function ListShell({ className = "", actions, searchBar, filters, filterActions, children, footer }) {
  return (
    <article className={`panel list-shell ${className}`.trim()}>
      <div className="list-shell-top">
        <div className="list-shell-search search-slot">{searchBar}</div>
        <div className="shell-actions">{actions}</div>
      </div>
      <div className="list-shell-filters">
        <div className="filter-cluster">{filters}</div>
        <div className="filter-actions">{filterActions}</div>
      </div>
      <div className="list-shell-body">{children}</div>
      <div className="list-shell-footer">{footer}</div>
    </article>
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

function Pagination({
  currentPage,
  totalPages,
  totalLabel,
  onChangePage,
  pageSize = 10,
  pageSizeOptions = [10, 20, 30],
  onChangePageSize,
}) {
  return (
    <div className="pagination">
      <div className="pagination-meta">
        <span className="pagination-total">{totalLabel}</span>
        <label className="page-size-select">
          <span>每页</span>
          <select value={pageSize} onChange={(event) => onChangePageSize?.(Number(event.target.value))}>
            {pageSizeOptions.map((option) => (
              <option key={option} value={option}>
                {option} 条
              </option>
            ))}
          </select>
        </label>
      </div>
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

function SimpleTable({ columns, rows, rowClassName }) {
  const columnsClass = rowClassName ?? `cols-${columns.length}`;

  return (
    <div className="table-shell">
      <div className={`table-row table-head ${columnsClass}`}>
        {columns.map((column) => (
          <span key={column}>{column}</span>
        ))}
      </div>
      {rows.map((row, index) => (
        <div key={`${row[0]}-${index}`} className={`table-row ${columnsClass}`}>
          {row.map((cell, cellIndex) => (
            <span key={`${row[0]}-${cellIndex}`}>
              {columns[cellIndex] === "级别" ? (
                <span className={`log-tag ${String(cell).toLowerCase()}`}>{cell}</span>
              ) : (
                cell
              )}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}

export default App;

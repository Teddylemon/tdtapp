import { useMemo, useState } from "react";
import "./monitoring.css";

const rangeOptions = ["今日", "近7天", "近30天"];

const clusterCards = [
  { label: "可用率", value: "98%", tone: "violet" },
  { label: "全部节点", value: "1,000", tone: "blue" },
  { label: "可用节点", value: "800", tone: "green" },
  { label: "异常节点", value: "200", tone: "red" },
];

const metricPanels = [
  {
    key: "cpu",
    title: "CPU",
    unit: "核",
    usage: 39,
    detail: { used: "24.8", reserved: "148.3", total: "384" },
    seriesA: [28, 42, 37, 46, 35, 33, 40, 32, 44, 36, 48, 41],
    seriesB: [18, 22, 21, 26, 25, 24, 28, 20, 29, 24, 31, 26],
    tone: "teal",
  },
  {
    key: "gpu",
    title: "GPU",
    unit: "卡",
    usage: 54,
    detail: { used: "43.0", reserved: "52.0", total: "128" },
    seriesA: [20, 22, 24, 35, 44, 42, 50, 47, 45, 53, 58, 54],
    seriesB: [12, 14, 16, 17, 26, 22, 30, 29, 26, 31, 34, 28],
    tone: "violet",
  },
  {
    key: "memory",
    title: "内存",
    unit: "GiB",
    usage: 39,
    detail: { used: "24.8", reserved: "148.3", total: "384" },
    seriesA: [8, 10, 11, 13, 18, 12, 14, 12, 54, 20, 44, 28],
    seriesB: [3, 4, 4, 5, 6, 5, 8, 5, 18, 10, 26, 12],
    tone: "sky",
  },
  {
    key: "disk",
    title: "磁盘",
    unit: "%",
    usage: 57,
    detail: { used: "482", reserved: "96", total: "1,024" },
    seriesA: [48, 50, 55, 52, 51, 50, 49, 48, 50, 51, 56, 57],
    seriesB: [12, 13, 24, 16, 11, 10, 9, 10, 10, 11, 19, 17],
    tone: "green",
  },
  {
    key: "network",
    title: "网络 I/O",
    unit: "%",
    usage: 31,
    detail: { used: "2.4Gbps", reserved: "8.0Gbps", total: "10Gbps" },
    seriesA: [22, 24, 24, 25, 26, 27, 28, 27, 29, 30, 30, 31],
    seriesB: [6, 7, 8, 8, 9, 10, 10, 11, 11, 10, 12, 11],
    tone: "blue",
  },
  {
    key: "load",
    title: "设备负载",
    unit: "%",
    usage: 46,
    detail: { used: "1.84", reserved: "0.76", total: "4.00" },
    seriesA: [18, 22, 26, 31, 28, 34, 38, 41, 39, 44, 48, 46],
    seriesB: [10, 12, 15, 17, 14, 19, 21, 24, 23, 26, 28, 27],
    tone: "amber",
  },
];

const recentEvents = [
  { level: "INFO", source: "node-gw-01", message: "瓦片服务实例扩容完成，新增 6 个工作节点。", time: "16:42" },
  { level: "WARN", source: "queue-dispatch", message: "标注审核队列等待时长超过 31 分钟。", time: "16:35" },
  { level: "ERROR", source: "sync-broker", message: "版本同步任务第 2 次重试失败，已进入人工排查。", time: "16:27" },
  { level: "INFO", source: "storage-vol-02", message: "离线资源磁盘整理完成，可用容量恢复至 57%。", time: "16:18" },
];

function buildLine(points, width = 280, height = 100) {
  return points
    .map((point, index) => {
      const x = (index / Math.max(points.length - 1, 1)) * width;
      const y = height - (point / 100) * height;
      return `${index === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
}

function buildArea(points, width = 280, height = 100) {
  const line = buildLine(points, width, height);
  return `${line} L ${width} ${height} L 0 ${height} Z`;
}

function UsageRing({ value, tone }) {
  const angle = `conic-gradient(var(--ring-${tone}) 0deg ${value * 3.6}deg, #e7ecf4 ${value * 3.6}deg 360deg)`;
  return (
    <div className="monitor-ring" style={{ backgroundImage: angle }}>
      <div className="monitor-ring-inner">
        <strong>{value}</strong>
        <span>使用率</span>
      </div>
    </div>
  );
}

function MetricChart({ primary, secondary, tone }) {
  const primaryPath = useMemo(() => buildArea(primary), [primary]);
  const secondaryPath = useMemo(() => buildArea(secondary), [secondary]);
  const primaryLine = useMemo(() => buildLine(primary), [primary]);
  const secondaryLine = useMemo(() => buildLine(secondary), [secondary]);

  return (
    <svg viewBox="0 0 280 100" className="monitor-chart" preserveAspectRatio="none">
      <defs>
        <linearGradient id={`area-${tone}-a`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={`var(--ring-${tone})`} stopOpacity="0.3" />
          <stop offset="100%" stopColor={`var(--ring-${tone})`} stopOpacity="0.05" />
        </linearGradient>
        <linearGradient id={`area-${tone}-b`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#9ed8b4" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#9ed8b4" stopOpacity="0.03" />
        </linearGradient>
      </defs>
      <path d={secondaryPath} fill={`url(#area-${tone}-b)`} />
      <path d={primaryPath} fill={`url(#area-${tone}-a)`} />
      <path d={secondaryLine} className="monitor-chart-line monitor-chart-line--secondary" />
      <path d={primaryLine} className={`monitor-chart-line monitor-chart-line--${tone}`} />
    </svg>
  );
}

export default function MonitoringPage() {
  const [activeRange, setActiveRange] = useState("今日");

  return (
    <div className="page-content page-content--list monitoring-page">
      <section className="monitoring-shell">
        <div className="monitoring-layout">
          <div className="monitoring-main">
            <section className="monitor-panel">
              <div className="monitor-panel-head monitor-panel-head--range">
                <div>
                  <h3>集群监控</h3>
                  <span>核心资源与节点健康度</span>
                </div>
                <div className="monitoring-range">
                  {rangeOptions.map((option) => (
                    <button
                      key={option}
                      type="button"
                      className={activeRange === option ? "is-active" : ""}
                      onClick={() => setActiveRange(option)}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
              <div className="monitor-cluster-grid">
                {clusterCards.map((card) => (
                  <article key={card.label} className="monitor-cluster-card">
                    <span className={`cluster-dot ${card.tone}`} />
                    <div>
                      <span>{card.label}</span>
                      <strong>{card.value}</strong>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section className="monitor-metrics-grid">
              {metricPanels.map((panel) => (
                <article key={panel.key} className="monitor-panel metric-panel">
                  <div className="monitor-panel-head">
                    <h3>
                      {panel.title} <small>({panel.unit})</small>
                    </h3>
                    <span>16:31 - 16:42</span>
                  </div>
                  <div className="metric-panel-body">
                    <div className="metric-panel-top">
                      <UsageRing value={panel.usage} tone={panel.tone} />
                      <div className="metric-detail-grid">
                        <article>
                          <span>已使用</span>
                          <strong>{panel.detail.used}</strong>
                        </article>
                        <article>
                          <span>已预留</span>
                          <strong>{panel.detail.reserved}</strong>
                        </article>
                        <article>
                          <span>总量</span>
                          <strong>{panel.detail.total}</strong>
                        </article>
                      </div>
                    </div>
                    <MetricChart primary={panel.seriesA} secondary={panel.seriesB} tone={panel.tone} />
                  </div>
                </article>
              ))}
            </section>

            <section className="monitor-panel">
              <div className="monitor-panel-head">
                <h3>最近日志 / 告警</h3>
                <span>自动滚动监控摘要</span>
              </div>
              <div className="monitor-event-table">
                <div className="monitor-event-head">
                  <span>时间</span>
                  <span>级别</span>
                  <span>来源</span>
                  <span>内容</span>
                </div>
                {recentEvents.map((event) => (
                  <div key={`${event.time}-${event.source}`} className="monitor-event-row">
                    <span>{event.time}</span>
                    <span>
                      <em className={`monitor-level ${event.level.toLowerCase()}`}>{event.level}</em>
                    </span>
                    <span>{event.source}</span>
                    <span>{event.message}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </section>
    </div>
  );
}

import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ListShell,
  Pagination,
  ButtonIcon,
  FilterSelect,
} from "../../components";
import { formatTimestamp, formatDate, showToast } from "../../components/utils";
import "./banners.css";

const bannerImageModules = import.meta.glob("../../../imgs/**/*.{png,jpg,jpeg,webp}", {
  eager: true,
  import: "default",
});

const STORAGE_KEY = "tdt-banner-state-v2";

const STATUS_DRAFT = "草稿";
const STATUS_PUBLISHED = "已上线";
const STATUS_OFFLINE = "已下线";

const TYPE_URL = "url";
const TYPE_FEATURE = "feature";
const TYPE_RICHTEXT = "richtext";

const statusOptions = [STATUS_DRAFT, STATUS_PUBLISHED, STATUS_OFFLINE];

const typeOptions = [
  { key: TYPE_URL, label: "外部链接" },
  { key: TYPE_FEATURE, label: "移动端功能" },
  { key: TYPE_RICHTEXT, label: "富文本展示" },
];

const featureOptions = [
  { key: "topic-map", label: "专题地图" },
  { key: "markers", label: "标绘工具" },
  { key: "trajectory", label: "轨迹记录" },
  { key: "search", label: "搜索找点" },
  { key: "ai-assistant", label: "AI 助手" },
  { key: "standard-map", label: "标准地图" },
  { key: "multi-temporal", label: "多时相影像" },
  { key: "spatial-analysis", label: "空间分析" },
  { key: "navigation", label: "导航服务" },
];

const featurePreviewMeta = {
  "topic-map": {
    title: "专题地图即刻直达",
    summary: "进入应用内专题地图页，集中查看专题内容与关联信息。",
    actionText: "立即进入专题地图",
  },
  markers: {
    title: "标绘工具一键打开",
    summary: "支持点线面标绘、属性填写与地图成果管理。",
    actionText: "立即进入标绘工具",
  },
  trajectory: {
    title: "轨迹记录随手开启",
    summary: "开始记录、查看汇总与回放历史轨迹都更方便。",
    actionText: "立即进入轨迹记录",
  },
  search: {
    title: "搜索找点更高效",
    summary: "支持关键字、分类检索与周边点位快速查看。",
    actionText: "立即进入搜索找点",
  },
  "ai-assistant": {
    title: "AI 助手快速响应",
    summary: "围绕地图问答、工具推荐与智能交互提供帮助。",
    actionText: "立即进入 AI 助手",
  },
  "standard-map": {
    title: "标准地图规范查看",
    summary: "快速进入标准地图模块，查看规范化地图内容。",
    actionText: "立即查看标准地图",
  },
  "multi-temporal": {
    title: "多时相影像一键比对",
    summary: "可直接切换时间轴、分屏对比与卷帘查看，快速识别变化点。",
    actionText: "立即体验多时相影像",
  },
  "spatial-analysis": {
    title: "空间分析快速上手",
    summary: "缓冲区、叠加分析与结果查看都可在应用内直接完成。",
    actionText: "立即进入空间分析",
  },
  navigation: {
    title: "导航服务一键唤起",
    summary: "查点位、选路线与常用地点管理都可快速进入。",
    actionText: "立即开始导航",
  },
};

function resolveBannerAsset(relativePath) {
  const normalized = `../../../imgs/${relativePath}`.replace(/\\/g, "/");
  return bannerImageModules[normalized] ?? "";
}

const baseRecords = [
  {
    id: "BAN-001",
    title: "清明踏春导览地图",
    type: TYPE_URL,
    content: "https://hubei.tianditu.gov.cn/science/",
    summary:
      "清明踏春正当时，精选春日景点、游览路线与沿途风光，让每一次出发都能遇见好春光。",
    coverImage: resolveBannerAsset("通知公告/通知公告一.jpg"),
    contentImage: resolveBannerAsset("通知公告/通知公告一.jpg"),
    status: STATUS_PUBLISHED,
    createdAt: "2026-05-20 09:00",
    publishedAt: "2026-05-20 09:05",
    offlineAt: "",
    expiresAt: "2026-06-30 23:59",
    readCount: 342,
    sortOrder: 10,
  },
  {
    id: "BAN-002",
    title: "多时相影像一键比对",
    type: TYPE_FEATURE,
    content: "multi-temporal",
    summary:
      "在地图内直接切换时间轴、分屏对比与卷帘查看，快速识别变化点，适合做重点能力宣传入口。",
    coverImage: resolveBannerAsset("通知公告/多时相影像内容图.png"),
    contentImage: resolveBannerAsset("通知公告/多时相影像内容图.png"),
    status: STATUS_PUBLISHED,
    createdAt: "2026-05-22 14:30",
    publishedAt: "2026-05-22 14:35",
    offlineAt: "",
    expiresAt: "2026-07-15 23:59",
    readCount: 218,
    sortOrder: 8,
  },
  {
    id: "BAN-003",
    title: "自然资源一张图",
    type: TYPE_RICHTEXT,
    content:
      "<p>湖泊湿地、自然保护区、森林公园与地质公园共同铺展荆楚自然画卷。</p><p>生态保护红线、永久基本农田与城镇开发边界等重点信息集中呈现，山水林田湖草尽收眼底。</p><p>一张图读懂自然资源，让每一片土地、每一方水域都清晰可见。</p>",
    summary:
      "从湿地公园到生态保护红线，常用自然资源专题内容已集中整理，适合通过单页宣传的方式直接展示给用户。",
    coverImage: resolveBannerAsset("主题地图/鄂州市湖泊分布图.png"),
    contentImage: resolveBannerAsset("主题地图/鄂州市湖泊分布图.png"),
    status: STATUS_DRAFT,
    createdAt: "2026-05-25 10:00",
    publishedAt: "",
    offlineAt: "",
    expiresAt: "2026-08-01 23:59",
    readCount: 0,
    sortOrder: 5,
  },
  {
    id: "BAN-004",
    title: "防汛专题地图紧急上线通知",
    type: TYPE_FEATURE,
    content: "topic-map",
    summary: "雨情、水情与重点区域信息集中呈现，防汛专题地图助力快速掌握关键动态。",
    coverImage: resolveBannerAsset("通知公告/防汛专题内容图.png"),
    contentImage: resolveBannerAsset("通知公告/防汛专题内容图.png"),
    status: STATUS_OFFLINE,
    createdAt: "2026-05-10 08:00",
    publishedAt: "2026-05-10 08:10",
    offlineAt: "2026-05-18 18:00",
    expiresAt: "2026-05-18 23:59",
    readCount: 1520,
    sortOrder: 15,
  },
  {
    id: "BAN-005",
    title: "AI 助手智能问答体验",
    type: TYPE_URL,
    content: "https://hubei.tianditu.gov.cn/ai-help/",
    summary:
      "地图问答、工具推荐与智能交互一站式体验，让查地图、找服务和获取信息更加轻松。",
    coverImage: resolveBannerAsset("通知公告/AI助手内容图.png"),
    contentImage: resolveBannerAsset("通知公告/AI助手内容图.png"),
    status: STATUS_PUBLISHED,
    createdAt: "2026-05-26 16:00",
    publishedAt: "2026-05-26 16:05",
    offlineAt: "",
    expiresAt: "2026-06-10 23:59",
    readCount: 89,
    sortOrder: 6,
  },
];

function getFeatureLabel(key) {
  return featureOptions.find((item) => item.key === key)?.label ?? key;
}

function getTypeLabel(typeKey) {
  return typeOptions.find((item) => item.key === typeKey)?.label ?? typeKey;
}

function getBannerStatusTone(status) {
  if (status === STATUS_PUBLISHED) return "success";
  if (status === STATUS_OFFLINE) return "danger";
  return "muted";
}

function stripHtml(html = "") {
  if (!html) return "";
  if (typeof window === "undefined") {
    return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  }
  const div = document.createElement("div");
  div.innerHTML = html;
  return (div.textContent || div.innerText || "").replace(/\s+/g, " ").trim();
}

function getRecordSummary(record) {
  if (record.summary?.trim()) return record.summary.trim();
  if (record.type === TYPE_URL) return record.content;
  if (record.type === TYPE_FEATURE) return `跳转至：${getFeatureLabel(record.content)}`;
  return stripHtml(record.content);
}

function getFeatureMeta(featureKey) {
  return (
    featurePreviewMeta[featureKey] ?? {
      title: `${getFeatureLabel(featureKey)}即刻可达`,
      summary: "对应功能页面集中呈现相关能力与服务内容。",
      actionText: "立即进入功能",
    }
  );
}

function getUrlHost(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

function BannerThumb({ record, className = "banner-thumb-small" }) {
  if (record.coverImage) {
    return <img className={className} src={record.coverImage} alt={record.title} />;
  }

  const placeholderText =
    record.type === TYPE_URL
      ? getUrlHost(record.content)
      : record.type === TYPE_FEATURE
        ? getFeatureLabel(record.content)
        : "宣传图片";

  return (
    <div className={`${className} banner-thumb-placeholder banner-thumb-placeholder--${record.type}`}>
      <span>{placeholderText}</span>
    </div>
  );
}

function BannerArtwork({ record }) {
  const artwork = record.contentImage || record.coverImage;
  if (artwork) {
    return <img className="banner-detail-visual-image" src={artwork} alt={record.title} />;
  }

  if (record.type === TYPE_FEATURE) {
    return (
      <div className="banner-detail-visual banner-detail-visual--feature">
        <div className="banner-detail-visual-split">
          <div className="banner-detail-visual-panel banner-detail-visual-panel--past">
            <span>历史影像</span>
          </div>
          <div className="banner-detail-visual-panel banner-detail-visual-panel--current">
            <span>最新影像</span>
          </div>
          <div className="banner-detail-visual-divider" />
        </div>
        <div className="banner-detail-visual-track">
          <span className="banner-detail-visual-dot" />
          <span className="banner-detail-visual-line" />
          <strong>{getFeatureLabel(record.content)}</strong>
        </div>
      </div>
    );
  }

  if (record.type === TYPE_URL) {
    return (
      <div className="banner-detail-visual banner-detail-visual--url">
        <div className="banner-detail-visual-chip">{getUrlHost(record.content)}</div>
        <div className="banner-detail-visual-glow" />
        <div className="banner-detail-visual-block banner-detail-visual-block--large" />
        <div className="banner-detail-visual-block banner-detail-visual-block--small" />
      </div>
    );
  }

  return (
    <div className="banner-detail-visual banner-detail-visual--richtext">
      <div className="banner-detail-visual-glow" />
      <div className="banner-detail-visual-paper" />
      <div className="banner-detail-visual-leaf banner-detail-visual-leaf--left" />
      <div className="banner-detail-visual-leaf banner-detail-visual-leaf--right" />
    </div>
  );
}

function getBannerDetailNarrative(record) {
  if (record.type === TYPE_URL) {
    const isAiAssistant = record.title.includes("AI 助手");
    return {
      paragraphs: isAiAssistant
        ? [
          record.summary?.trim() ||
            "地图问答、工具推荐与智能交互一站式体验，让查地图、找服务和获取信息更加轻松。",
          "无论是寻找地点、了解周边信息，还是探索常用地图能力，AI 助手都能围绕当前需求给出更清晰的指引。自然语言交流让地图服务更加亲切，也让复杂功能更容易上手。",
          "从一次简单提问开始，快速发现地图中的丰富内容。常用服务、专题资源与操作建议都可以更顺畅地触达，让每一次地图探索都有回应。",
        ]
        : [
          record.summary?.trim() ||
            "春日出游正当时，精选路线、景点信息与专题内容已集中呈现。",
          "沿着清明踏春导览地图，可以发现湖畔花径、城市公园、郊野绿道与人文景点。无论是短途漫步、亲子出行，还是与家人朋友共赴一场春日小游，都能找到合适的目的地。",
          "地图汇集沿途风光与游览线索，让山水之间的春意更加清晰。趁着草木新绿、微风正好，循着地图出发，遇见荆楚大地的明媚春光。",
        ],
    };
  }

  if (record.type === TYPE_FEATURE) {
    const featureMeta = getFeatureMeta(record.content);
    const isMultiTemporal = record.content === "multi-temporal";
    return {
      paragraphs: isMultiTemporal
        ? [
          record.summary?.trim() || featureMeta.summary,
          "多时相影像将不同时期的卫星影像集中呈现，通过时间轴切换、分屏对比与卷帘查看，土地变化、城市生长与自然环境演变更加直观。",
          "从重点区域巡查到日常地图浏览，从历史影像回溯到最新影像观察，多种查看方式让每一次对比都有迹可循，也让地图中的时间变化清晰可见。",
        ]
        : [
          record.summary?.trim() || featureMeta.summary,
          "专题地图汇集重点区域、关键点位与相关资源信息，将分散内容集中呈现在同一张地图上。雨情、水情与重点区域动态层层展开，重要信息更加清晰。",
          "面向防汛巡查与应急关注场景，专题地图让区域态势一目了然。通过地图查看重点信息，能够更直观地掌握当前情况与空间分布。",
        ],
    };
  }

  return {
    paragraphs: [],
  };
}

function normalizeStorageState(payload) {
  return {
    overrides: payload?.overrides && typeof payload.overrides === "object" ? payload.overrides : {},
    additions: Array.isArray(payload?.additions) ? payload.additions : [],
    deletedIds: Array.isArray(payload?.deletedIds) ? payload.deletedIds : [],
  };
}

function readStoredState() {
  if (typeof window === "undefined") return normalizeStorageState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return normalizeStorageState(raw ? JSON.parse(raw) : {});
  } catch {
    return normalizeStorageState();
  }
}

function isExpired(expiresAt) {
  if (!expiresAt) return false;
  return new Date(expiresAt).getTime() <= Date.now();
}

function isExpiringSoon(expiresAt) {
  if (!expiresAt) return false;
  const diff = new Date(expiresAt).getTime() - Date.now();
  return diff > 0 && diff < 3 * 24 * 60 * 60 * 1000;
}

function sortRecords(left, right) {
  if ((right.sortOrder ?? 0) !== (left.sortOrder ?? 0)) {
    return (right.sortOrder ?? 0) - (left.sortOrder ?? 0);
  }
  return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
}

function normalizeDateTimeValue(value) {
  if (!value) return "";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : formatTimestamp(parsed);
}

function useRecords() {
  const [state, setState] = useState(readStoredState);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const records = useMemo(() => {
    const deleted = new Set(state.deletedIds);
    const basePart = baseRecords
      .filter((item) => !deleted.has(item.id))
      .map((item) => ({
        ...item,
        ...(state.overrides[item.id] ?? {}),
      }));

    const additionPart = state.additions
      .filter((item) => !deleted.has(item.id))
      .map((item) => ({
        ...item,
        ...(state.overrides[item.id] ?? {}),
      }));

    return [...basePart, ...additionPart].sort(sortRecords);
  }, [state]);

  useEffect(() => {
    const now = Date.now();
    const expiredOnlineIds = records
      .filter(
        (record) =>
          record.status === STATUS_PUBLISHED &&
          record.expiresAt &&
          new Date(record.expiresAt).getTime() <= now,
      )
      .map((record) => record.id);

    if (expiredOnlineIds.length === 0) return;

    setState((previous) => {
      let changed = false;
      const overrides = { ...previous.overrides };
      const additions = previous.additions.map((item) => {
        if (!expiredOnlineIds.includes(item.id)) return item;
        changed = true;
        return {
          ...item,
          status: STATUS_OFFLINE,
          offlineAt: formatTimestamp(new Date()),
        };
      });

      for (const id of expiredOnlineIds) {
        const baseRecord = baseRecords.find((item) => item.id === id);
        if (!baseRecord) continue;
        changed = true;
        overrides[id] = {
          ...(overrides[id] ?? {}),
          status: STATUS_OFFLINE,
          offlineAt: formatTimestamp(new Date()),
        };
      }

      if (!changed) return previous;
      return { ...previous, overrides, additions };
    });
  }, [records]);

  const updateRecord = (id, patch) => {
    setState((previous) => {
      const additionExists = previous.additions.some((item) => item.id === id);
      if (additionExists) {
        return {
          ...previous,
          additions: previous.additions.map((item) =>
            item.id === id ? { ...item, ...patch } : item,
          ),
        };
      }

      return {
        ...previous,
        overrides: {
          ...previous.overrides,
          [id]: { ...(previous.overrides[id] ?? {}), ...patch },
        },
      };
    });
  };

  const addRecord = (record) => {
    setState((previous) => ({
      ...previous,
      additions: [record, ...previous.additions.filter((item) => item.id !== record.id)],
      deletedIds: previous.deletedIds.filter((id) => id !== record.id),
    }));
  };

  const deleteRecord = (id) => {
    setState((previous) => {
      const additionExists = previous.additions.some((item) => item.id === id);
      if (additionExists) {
        return {
          ...previous,
          additions: previous.additions.filter((item) => item.id !== id),
          overrides: Object.fromEntries(
            Object.entries(previous.overrides).filter(([key]) => key !== id),
          ),
        };
      }

      return {
        ...previous,
        deletedIds: previous.deletedIds.includes(id)
          ? previous.deletedIds
          : [...previous.deletedIds, id],
        overrides: Object.fromEntries(
          Object.entries(previous.overrides).filter(([key]) => key !== id),
        ),
      };
    });
  };

  return { records, updateRecord, addRecord, deleteRecord };
}

function RichTextEditor({ value, onChange }) {
  const editorRef = useRef(null);
  const imageInputRef = useRef(null);
  const savedSelection = useRef(null);

  const saveSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      savedSelection.current = selection.getRangeAt(0);
    }
  };

  const restoreSelection = () => {
    if (!savedSelection.current) return;
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(savedSelection.current);
  };

  const syncValue = () => {
    if (editorRef.current) onChange(editorRef.current.innerHTML);
  };

  const execCommand = (command, commandValue = null) => {
    restoreSelection();
    document.execCommand(command, false, commandValue);
    syncValue();
  };

  const handleInsertLink = () => {
    saveSelection();
    const url = window.prompt("请输入链接地址", "https://");
    if (!url) return;
    restoreSelection();
    execCommand("createLink", url);
  };

  const handleInsertImage = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      restoreSelection();
      editorRef.current?.focus();
      document.execCommand("insertImage", false, reader.result);
      syncValue();
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  };

  return (
    <div className="banner-richtext-container">
      <div className="banner-richtext-toolbar" onMouseDown={(event) => event.preventDefault()}>
        <button type="button" title="加粗" onClick={() => execCommand("bold")}>
          <b>B</b>
        </button>
        <button type="button" title="斜体" onClick={() => execCommand("italic")}>
          <i>I</i>
        </button>
        <button type="button" title="下划线" onClick={() => execCommand("underline")}>
          <u>U</u>
        </button>
        <button type="button" title="删除线" onClick={() => execCommand("strikeThrough")}>
          <s>S</s>
        </button>
        <span className="banner-richtext-divider" />
        <button type="button" title="标题 1" onClick={() => execCommand("formatBlock", "H1")}>
          H1
        </button>
        <button type="button" title="标题 2" onClick={() => execCommand("formatBlock", "H2")}>
          H2
        </button>
        <button type="button" title="标题 3" onClick={() => execCommand("formatBlock", "H3")}>
          H3
        </button>
        <button type="button" title="正文" onClick={() => execCommand("formatBlock", "P")}>
          P
        </button>
        <span className="banner-richtext-divider" />
        <button type="button" title="无序列表" onClick={() => execCommand("insertUnorderedList")}>
          &bull;
        </button>
        <button type="button" title="有序列表" onClick={() => execCommand("insertOrderedList")}>
          1.
        </button>
        <span className="banner-richtext-divider" />
        <button type="button" title="左对齐" onClick={() => execCommand("justifyLeft")}>
          &#8676;
        </button>
        <button type="button" title="居中" onClick={() => execCommand("justifyCenter")}>
          &#8596;
        </button>
        <button type="button" title="右对齐" onClick={() => execCommand("justifyRight")}>
          &#8677;
        </button>
        <span className="banner-richtext-divider" />
        <button type="button" title="插入图片" onClick={() => imageInputRef.current?.click()}>
          &#128247;
        </button>
        <button type="button" title="插入链接" onClick={handleInsertLink}>
          &#128279;
        </button>
        <label title="文字颜色">
          <input
            type="color"
            onChange={(event) => execCommand("foreColor", event.target.value)}
            style={{ width: 0, height: 0, opacity: 0, position: "absolute" }}
          />
          <span style={{ color: "inherit", fontWeight: 700 }}>A</span>
        </label>
        <input
          ref={imageInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={handleInsertImage}
          style={{ display: "none" }}
        />
      </div>
      <div
        ref={editorRef}
        className="banner-richtext-editor"
        contentEditable
        suppressContentEditableWarning
        dangerouslySetInnerHTML={{ __html: value }}
        onInput={syncValue}
        onBlur={() => {
          saveSelection();
          syncValue();
        }}
        onFocus={restoreSelection}
      />
    </div>
  );
}

function ImageUploadField({ image, onChange, label, alt }) {
  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onChange(reader.result);
    reader.readAsDataURL(file);
  };

  return (
    <div className="banner-cover-upload">
      {image ? (
        <div className="banner-cover-preview">
          <img src={image} alt={alt} />
          <button type="button" className="banner-cover-remove" onClick={() => onChange("")}>
            &times;
          </button>
        </div>
      ) : (
        <label className="banner-cover-trigger">
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleFileChange}
            hidden
          />
          <span>+ {label}</span>
        </label>
      )}
    </div>
  );
}

export function BannerListPage() {
  const navigate = useNavigate();
  const { records, updateRecord, deleteRecord, addRecord } = useRecords();
  const [searchText, setSearchText] = useState("");
  const [selectedStatuses, setSelectedStatuses] = useState([]);
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [showModal, setShowModal] = useState(false);

  const statusCounts = useMemo(
    () =>
      records.reduce((accumulator, record) => {
        accumulator[record.status] = (accumulator[record.status] || 0) + 1;
        return accumulator;
      }, {}),
    [records],
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchText, selectedStatuses, pageSize]);

  const filteredRecords = useMemo(() => {
    const keyword = searchText.trim().toLowerCase();
    return records.filter((record) => {
      const matchKeyword =
        !keyword ||
        [record.id, record.title, getRecordSummary(record), getFeatureLabel(record.content)]
          .filter(Boolean)
          .some((item) => item.toLowerCase().includes(keyword));
      const matchStatus =
        selectedStatuses.length === 0 || selectedStatuses.includes(record.status);
      return matchKeyword && matchStatus;
    });
  }, [records, searchText, selectedStatuses]);

  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const pageRecords = filteredRecords.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize,
  );

  const handlePublish = (id) => {
    const record = records.find((item) => item.id === id);
    if (!record) return;
    if (record.expiresAt && isExpired(record.expiresAt)) {
      showToast("该通知公告已过期，请调整到期时间后再上线。", "warning");
      return;
    }
    const now = formatTimestamp(new Date());
    updateRecord(id, { status: STATUS_PUBLISHED, publishedAt: now, offlineAt: "" });
    showToast("通知公告已上线。", "success");
  };

  const handleOffline = (id) => {
    const now = formatTimestamp(new Date());
    updateRecord(id, { status: STATUS_OFFLINE, offlineAt: now });
    showToast("通知公告已下线。");
  };

  const handleDelete = (id) => {
    if (!window.confirm("确认删除该通知公告吗？")) return;
    deleteRecord(id);
    showToast("通知公告已删除。");
  };

  const handleCreate = (record) => {
    addRecord(record);
    setShowModal(false);
    showToast(record.status === STATUS_PUBLISHED ? "通知公告已上线。" : "草稿已保存。", "success");
  };

  return (
    <div className="page-content page-content--list banners-page">
      <ListShell
        className="banners-list-shell"
        searchBar={
          <input
            className="input search-input"
            placeholder="搜索编号、标题、功能或文案..."
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
          />
        }
        actions={
          <button
            type="button"
            className="primary-button slim-button"
            onClick={() => setShowModal(true)}
          >
            新建通知公告
          </button>
        }
        filters={
          <FilterSelect
            placeholder="上线状态"
            options={statusOptions}
            optionCounts={statusCounts}
            onChange={(values) => setSelectedStatuses(values)}
          />
        }
        footer={
          <Pagination
            currentPage={safePage}
            totalPages={totalPages}
            totalLabel={`共 ${filteredRecords.length} 条`}
            pageSize={pageSize}
            pageSizeOptions={[10, 20, 50]}
            onChangePage={setCurrentPage}
            onChangePageSize={(size) => {
              setPageSize(size);
              setCurrentPage(1);
            }}
          />
        }
      >
        <div className="banners-table-scroll">
          <div className="table-shell selectable banners-table-shell">
            <div className="table-row table-head cols-banners">
              <span>编号</span>
              <span>封面图片</span>
              <span>标题与内容概述</span>
              <span>跳转类型</span>
              <span>到期时间</span>
              <span>状态</span>
              <span>操作</span>
            </div>
            {pageRecords.length === 0 ? (
              <div className="empty-state">暂无匹配的通知公告</div>
            ) : (
              pageRecords.map((record) => (
                <div
                  key={record.id}
                  className="table-row cols-banners banner-row"
                  onClick={() => navigate(`/banners/${record.id}`)}
                >
                  <span className="cell-muted">{record.id}</span>
                  <div className="banner-thumb-cell">
                    <BannerThumb record={record} />
                  </div>
                  <div className="banner-main">
                    <strong>{record.title}</strong>
                    <em>{getRecordSummary(record)}</em>
                  </div>
                  <span>
                    <span className={`banner-type-badge ${record.type}`}>
                      {getTypeLabel(record.type)}
                    </span>
                  </span>
                  <span
                    className={`banner-expires-cell ${
                      record.status === STATUS_PUBLISHED && isExpired(record.expiresAt)
                        ? "expired"
                        : record.status === STATUS_PUBLISHED && isExpiringSoon(record.expiresAt)
                          ? "expiring-soon"
                          : ""
                    }`}
                  >
                    {record.expiresAt ? formatDate(record.expiresAt) : "-"}
                  </span>
                  <span>
                    <span className={`status-pill ${getBannerStatusTone(record.status)}`}>
                      {record.status}
                    </span>
                  </span>
                  <span className="banner-action-group" onClick={(event) => event.stopPropagation()}>
                    <button
                      type="button"
                      className="inline-button action-view"
                      onClick={() => navigate(`/banners/${record.id}`)}
                    >
                      <ButtonIcon type="view" />
                      <span>查看</span>
                    </button>
                    {record.status === STATUS_PUBLISHED ? (
                      <button
                        type="button"
                        className="inline-button"
                        onClick={() => handleOffline(record.id)}
                      >
                        <ButtonIcon type="down" />
                        <span>下线</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="inline-button action-publish"
                        onClick={() => handlePublish(record.id)}
                      >
                        <ButtonIcon type="up" />
                        <span>上线</span>
                      </button>
                    )}
                    {record.status === STATUS_DRAFT ? (
                      <button
                        type="button"
                        className="inline-button danger-button"
                        onClick={() => handleDelete(record.id)}
                      >
                        <ButtonIcon type="reject" />
                        <span>删除</span>
                      </button>
                    ) : null}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </ListShell>

      {showModal ? <BannerModal onClose={() => setShowModal(false)} onSubmit={handleCreate} /> : null}
    </div>
  );
}

export function BannerDetailPage() {
  const navigate = useNavigate();
  const { bannerId } = useParams();
  const { records, updateRecord, deleteRecord } = useRecords();
  const record = records.find((item) => item.id === bannerId);

  if (!record) {
    return (
      <div className="page-content topic-detail-page banner-detail-page">
        <section className="topic-detail-header banner-detail-header">
          <div className="topic-detail-heading banner-detail-heading">
            <button
              type="button"
              className="icon-back-button"
              onClick={() => navigate("/banners")}
              aria-label="返回"
            >
              <ButtonIcon type="back" />
            </button>
          </div>
        </section>
        <div className="empty-state">通知公告不存在或已被删除</div>
      </div>
    );
  }

  const expired = record.status === STATUS_PUBLISHED && isExpired(record.expiresAt);
  const detailNarrative = getBannerDetailNarrative(record);

  const handlePublish = () => {
    if (record.expiresAt && isExpired(record.expiresAt)) {
      showToast("该通知公告已过期，请调整到期时间后再上线。", "warning");
      return;
    }
    const now = formatTimestamp(new Date());
    updateRecord(record.id, { status: STATUS_PUBLISHED, publishedAt: now, offlineAt: "" });
    showToast("通知公告已上线。", "success");
  };

  const handleOffline = () => {
    const now = formatTimestamp(new Date());
    updateRecord(record.id, { status: STATUS_OFFLINE, offlineAt: now });
    showToast("通知公告已下线。");
  };

  const handleDelete = () => {
    if (!window.confirm("确认删除该通知公告吗？")) return;
    deleteRecord(record.id);
    showToast("通知公告已删除。");
    navigate("/banners");
  };

  return (
    <div className="page-content topic-detail-page banner-detail-page">
      <section className="topic-detail-header banner-detail-header">
        <div className="topic-detail-heading banner-detail-heading">
          <button
            type="button"
            className="icon-back-button"
            onClick={() => navigate("/banners")}
            aria-label="返回"
          >
            <ButtonIcon type="back" />
          </button>
          <div className="topic-detail-title banner-detail-title">
            <h2>{record.title}</h2>
            <span className={`status-pill ${getBannerStatusTone(record.status)}`}>
              {record.status}
            </span>
          </div>
        </div>
        <div className="topic-detail-toolbar banner-detail-toolbar">
          {expired ? (
            <span className="banner-detail-expired-hint">已过期，请调整到期时间后重新上线</span>
          ) : null}
          {record.status === STATUS_PUBLISHED ? (
            <button type="button" className="ghost-button slim-button" onClick={handleOffline}>
              <ButtonIcon type="down" />
              <span>下线</span>
            </button>
          ) : (
            <button type="button" className="primary-button slim-button" onClick={handlePublish}>
              <ButtonIcon type="up" />
              <span>上线</span>
            </button>
          )}
          <button
            type="button"
            className="ghost-button slim-button danger-button"
            onClick={handleDelete}
          >
            <ButtonIcon type="reject" />
            <span>删除</span>
          </button>
        </div>
      </section>

      <div className="banner-detail-reading">
        <div className="banner-detail-reading-head">
          <div className="banner-detail-reading-meta">
            <span className={`banner-type-badge ${record.type}`}>{getTypeLabel(record.type)}</span>
            <span>编号：{record.id}</span>
            <span>到期时间：{record.expiresAt ? formatDate(record.expiresAt) : "-"}</span>
          </div>
        </div>

        <div className="banner-detail-reading-main">
          <div className="banner-detail-media">
            <BannerArtwork record={record} />
          </div>

          <div className="banner-detail-reading-body">
            {record.type === TYPE_RICHTEXT ? (
              <div
                className="banner-detail-preview-richtext"
                dangerouslySetInnerHTML={{ __html: record.content }}
              />
            ) : (
              detailNarrative.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))
            )}

            {record.type === TYPE_URL ? (
              <p className="banner-detail-target">
                跳转链接：
                <a href={record.content} target="_blank" rel="noopener noreferrer">
                  {record.content}
                </a>
              </p>
            ) : null}

            {record.type === TYPE_FEATURE ? (
              <p className="banner-detail-target">目标功能：{getFeatureLabel(record.content)}</p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function BannerModal({ onClose, onSubmit }) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState(TYPE_URL);
  const [content, setContent] = useState("");
  const [summary, setSummary] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [contentImage, setContentImage] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [errors, setErrors] = useState({});

  const validate = () => {
    const nextErrors = {};

    if (!title.trim()) nextErrors.title = "标题不能为空";
    if (type === TYPE_URL && !content.trim()) nextErrors.content = "请输入链接地址";
    if (type === TYPE_FEATURE && !content) nextErrors.content = "请选择功能模块";
    if (type === TYPE_RICHTEXT) {
      const textValue = stripHtml(content);
      if (!textValue.trim()) nextErrors.content = "请输入富文本内容";
    }
    if (type !== TYPE_RICHTEXT && !summary.trim()) nextErrors.summary = "请输入内容概述";
    if (!expiresAt) {
      nextErrors.expiresAt = "请设置到期时间";
    } else if (new Date(expiresAt).getTime() <= Date.now()) {
      nextErrors.expiresAt = "到期时间不能早于当前时间";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSave = (status) => {
    if (!validate()) return;
    const now = formatTimestamp(new Date());
    onSubmit({
      id: `BAN-${String(Date.now()).slice(-6)}`,
      title: title.trim(),
      type,
      content: type === TYPE_URL ? content.trim() : content,
      summary: type === TYPE_RICHTEXT ? "" : summary.trim(),
      coverImage,
      contentImage,
      status,
      createdAt: now,
      publishedAt: status === STATUS_PUBLISHED ? now : "",
      offlineAt: "",
      expiresAt: normalizeDateTimeValue(expiresAt),
      readCount: 0,
      sortOrder: 0,
    });
  };

  return (
    <div className="export-modal-overlay">
      <div className="export-modal-card banner-modal-card">
        <div className="export-modal-header">
          <h3>新建通知公告</h3>
          <button type="button" className="export-modal-close" onClick={onClose}>
            &times;
          </button>
        </div>

        <div className="banner-modal-body banner-modal-body--split">
          <div className="banner-modal-panel banner-modal-panel--base">
            <div className="banner-modal-panel-title">基础设置</div>

            <div className="form-block">
              <label>
                <span className="form-required">*</span>标题
              </label>
              <input
                className="input"
                value={title}
                placeholder="请输入通知公告标题"
                onChange={(event) => {
                  setTitle(event.target.value);
                  if (errors.title) setErrors((previous) => ({ ...previous, title: "" }));
                }}
              />
              {errors.title ? <span className="form-error">{errors.title}</span> : null}
            </div>

            <div className="form-block">
              <label>
                <span className="form-required">*</span>到期时间
              </label>
              <input
                className="input"
                type="datetime-local"
                value={expiresAt}
                onChange={(event) => {
                  setExpiresAt(event.target.value);
                  if (errors.expiresAt) {
                    setErrors((previous) => ({ ...previous, expiresAt: "" }));
                  }
                }}
              />
              {errors.expiresAt ? <span className="form-error">{errors.expiresAt}</span> : null}
            </div>

            <div className="form-block">
              <label>封面图片</label>
              <ImageUploadField
                image={coverImage}
                onChange={setCoverImage}
                label="选择封面图片"
                alt="封面图片预览"
              />
            </div>
          </div>

          <div className="banner-modal-panel banner-modal-panel--config">
            <div className="form-block">
              <label>
                <span className="form-required">*</span>公告类型
              </label>
              <div className="banner-type-selector">
                {typeOptions.map((option) => (
                  <button
                    key={option.key}
                    type="button"
                    className={`banner-type-option ${type === option.key ? "selected" : ""}`}
                    onClick={() => {
                      setType(option.key);
                      setContent("");
                      setSummary((current) =>
                        option.key === TYPE_RICHTEXT
                          ? ""
                          : current || (option.key === TYPE_FEATURE
                            ? getFeatureMeta("multi-temporal").summary
                            : ""),
                      );
                      setErrors((previous) => ({ ...previous, content: "", summary: "" }));
                    }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-block">
              <label>内容图片</label>
              <ImageUploadField
                image={contentImage}
                onChange={setContentImage}
                label="选择内容图片"
                alt="内容图片预览"
              />
            </div>

            <div className="form-block">
              <label>
                <span className="form-required">*</span>
                {type === TYPE_URL
                  ? "链接地址"
                  : type === TYPE_FEATURE
                    ? "功能模块"
                    : "富文本内容"}
              </label>
              {type === TYPE_URL ? (
                <input
                  className="input"
                  value={content}
                  placeholder="https://..."
                  onChange={(event) => {
                    setContent(event.target.value);
                    if (errors.content) setErrors((previous) => ({ ...previous, content: "" }));
                  }}
                />
              ) : null}
              {type === TYPE_FEATURE ? (
                <select
                  className="select"
                  value={content}
                  onChange={(event) => {
                    const featureKey = event.target.value;
                    setContent(featureKey);
                    if (featureKey) {
                      setSummary((current) => current || getFeatureMeta(featureKey).summary);
                    }
                    if (errors.content) setErrors((previous) => ({ ...previous, content: "" }));
                  }}
                >
                  <option value="">请选择功能模块</option>
                  {featureOptions.map((item) => (
                    <option key={item.key} value={item.key}>
                      {item.label}
                    </option>
                  ))}
                </select>
              ) : null}
              {type === TYPE_RICHTEXT ? (
                <RichTextEditor
                  key={type}
                  value={content}
                  onChange={(html) => {
                    setContent(html);
                    if (errors.content) setErrors((previous) => ({ ...previous, content: "" }));
                  }}
                />
              ) : null}
              {errors.content ? <span className="form-error">{errors.content}</span> : null}
            </div>

            {type !== TYPE_RICHTEXT ? (
              <div className="form-block">
                <label>
                  <span className="form-required">*</span>内容概述
                </label>
                <textarea
                  className="textarea banner-modal-textarea"
                  value={summary}
                  maxLength={90}
                  placeholder="请输入用于展示的宣传文案概述，最多 90 字"
                  onChange={(event) => {
                    setSummary(event.target.value);
                    if (errors.summary) setErrors((previous) => ({ ...previous, summary: "" }));
                  }}
                />
                {errors.summary ? <span className="form-error">{errors.summary}</span> : null}
              </div>
            ) : null}
          </div>
        </div>

        <div className="export-modal-footer">
          <button type="button" className="ghost-button slim-button" onClick={onClose}>
            取消
          </button>
          <button
            type="button"
            className="ghost-button slim-button"
            onClick={() => handleSave(STATUS_DRAFT)}
          >
            保存草稿
          </button>
          <button
            type="button"
            className="primary-button slim-button"
            onClick={() => handleSave(STATUS_PUBLISHED)}
          >
            直接上线
          </button>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ListShell, Pagination, ButtonIcon, InfoField, FilterSelect } from "../../components";
import { formatTimestamp, formatDate, showToast } from "../../components/utils";

const topicMapImageModules = import.meta.glob("../../../imgs/主题地图/*.{png,jpg,jpeg,webp}", {
  eager: true,
  import: "default",
});

const topicMapImageMap = Object.fromEntries(
  Object.entries(topicMapImageModules).map(([filePath, url]) => [
    filePath.split("/").pop().replace(/\.[^.]+$/, ""),
    url,
  ]),
);

const topicMapStorageKey = "tdt-topic-map-publish-status";
const topicImageDbName = "tdt-topic-images";
const topicImageStoreName = "images";
const TOPIC_STATUS_UNPUBLISHED = "未上架";
const TOPIC_STATUS_PUBLISHED = "已上架";

function openTopicImageDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(topicImageDbName, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(topicImageStoreName);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function getTopicImage(id) {
  const db = await openTopicImageDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(topicImageStoreName, "readonly");
    const req = tx.objectStore(topicImageStoreName).get(id);
    req.onsuccess = () => resolve(req.result ?? "");
    req.onerror = () => reject(req.error);
  });
}

async function setTopicImage(id, dataUrl) {
  const db = await openTopicImageDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(topicImageStoreName, "readwrite");
    tx.objectStore(topicImageStoreName).put(dataUrl, id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

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
  status: item.status === "已上架" ? TOPIC_STATUS_PUBLISHED : TOPIC_STATUS_UNPUBLISHED,
  thumbnail: topicMapImageMap[item.imageKey] ?? "",
}));

function normalizeTopicStatus(status) {
  return status === TOPIC_STATUS_PUBLISHED || status === "已上架"
    ? TOPIC_STATUS_PUBLISHED
    : TOPIC_STATUS_UNPUBLISHED;
}

function stripThumbnails(items) {
  return items.map(({ thumbnail, ...rest }) => rest);
}

function resolveThumbnail(item) {
  if (item.imageKey && topicMapImageMap[item.imageKey]) return topicMapImageMap[item.imageKey];
  return item.thumbnail ?? "";
}

function useTopicMapRecords() {
  const [records, setRecords] = useState(() => {
    try {
      const stored = JSON.parse(window.localStorage.getItem(topicMapStorageKey) ?? "null");
      if (Array.isArray(stored) && stored.length > 0) {
        return stored.map((item) => ({ ...item, thumbnail: resolveThumbnail(item) }));
      }
    } catch {}
    return topicMapBaseRecords;
  });

  // Load uploaded images from IndexedDB on mount
  useEffect(() => {
    const uploadedIds = records.filter((r) => !r.imageKey && !r.thumbnail).map((r) => r.id);
    if (uploadedIds.length === 0) return;
    (async () => {
      const updates = {};
      for (const id of uploadedIds) {
        try {
          const img = await getTopicImage(id);
          if (img) updates[id] = img;
        } catch {}
      }
      if (Object.keys(updates).length > 0) {
        setRecords((current) =>
          current.map((item) => (updates[item.id] ? { ...item, thumbnail: updates[item.id] } : item)),
        );
      }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Persist metadata only (no base64 thumbnails) to localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(topicMapStorageKey, JSON.stringify(stripThumbnails(records)));
    } catch {}
  }, [records]);

  return [records, setRecords];
}

function nextTopicStatus(targetStatus) {
  return normalizeTopicStatus(targetStatus) === TOPIC_STATUS_PUBLISHED
    ? TOPIC_STATUS_UNPUBLISHED
    : TOPIC_STATUS_PUBLISHED;
}

function topicActionLabel(status) {
  return normalizeTopicStatus(status) === TOPIC_STATUS_PUBLISHED ? "下架" : "上架";
}

function topicStatusTone(status) {
  return normalizeTopicStatus(status) === TOPIC_STATUS_PUBLISHED ? "success" : "muted";
}

export function TopicListPage() {
  const navigate = useNavigate();
  const [records, setRecords] = useTopicMapRecords();
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);

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
    { [TOPIC_STATUS_UNPUBLISHED]: 0, [TOPIC_STATUS_PUBLISHED]: 0 },
  );

  const topicStatusOptions = [TOPIC_STATUS_UNPUBLISHED, TOPIC_STATUS_PUBLISHED];

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

  const handleUploadSubmit = async ({ id, name, description, imagePreview, publish }) => {
    const now = new Date();
    const stamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
      now.getDate(),
    ).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    const maxId = records.reduce((max, item) => {
      const num = Number(item.id.replace(/\D+/g, ""));
      return Number.isFinite(num) ? Math.max(max, num) : max;
    }, 0);

    const newId = id ?? `TM-${String(maxId + 1).padStart(3, "0")}`;

    try {
      await setTopicImage(newId, imagePreview);
    } catch {
      showToast("图片保存失败", "error");
      return;
    }

    const newRecord = {
      id: newId,
      name,
      description,
      status: publish ? TOPIC_STATUS_PUBLISHED : TOPIC_STATUS_UNPUBLISHED,
      operator: "平台管理员",
      updatedAt: stamp,
      thumbnail: imagePreview,
      imageKey: "",
    };

    setRecords((current) =>
      id ? current.map((item) => (item.id === id ? { ...item, ...newRecord } : item)) : [newRecord, ...current],
    );
    setUploadOpen(false);
    setEditingRecord(null);
    showToast(
      publish ? (id ? "主题地图已更新并上架" : "已上传并上架") : (id ? "草稿已更新" : "已上传，可在列表中上架"),
      "success",
    );
    return;
    showToast(publish ? "已上传并上架" : "已上传，可在列表中上架", "success");
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
        actions={
          <button type="button" className="primary-button slim-button" onClick={() => {
            setEditingRecord(null);
            setUploadOpen(true);
          }}>
            <span>上传主题地图</span>
          </button>
        }
        filters={
          <FilterSelect
            placeholder="发布状态"
            options={topicStatusOptions}
            onChange={(selected, allSelected) => {
              setStatusFilter(allSelected ? [] : selected);
              setPage(1);
            }}
            optionCounts={topicStatusCounts}
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
              onClick={() => handleBatchToggle(TOPIC_STATUS_UNPUBLISHED)}
              disabled={selectedIds.length === 0}
            >
              <span>批量下架</span>
            </button>
            <button
              type="button"
              className="ghost-button slim-button"
              onClick={() => handleBatchToggle(TOPIC_STATUS_PUBLISHED)}
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
                <span>{formatDate(record.updatedAt)}</span>
                <span className="topic-map-actions" onClick={(event) => event.stopPropagation()}>
                  <button type="button" className="inline-button action-view" onClick={() => navigate(`/topic/${record.id}`)}>
                    <ButtonIcon type="view" />
                    <span>查看</span>
                  </button>
                  {record.status === TOPIC_STATUS_UNPUBLISHED ? (
                    <button
                      type="button"
                      className="inline-button"
                      onClick={() => {
                        setEditingRecord(record);
                        setUploadOpen(true);
                      }}
                    >
                      <ButtonIcon type="edit" />
                      <span>编辑</span>
                    </button>
                  ) : null}
                  <button
                    type="button"
                    className={`inline-button action-publish ${record.status === TOPIC_STATUS_PUBLISHED ? "danger-button" : ""}`}
                    onClick={() => handleSingleToggle(record)}
                  >
                    <ButtonIcon type={record.status === TOPIC_STATUS_PUBLISHED ? "down" : "up"} />
                    <span>{topicActionLabel(record.status)}</span>
                  </button>
                </span>
              </div>
            ))}
          </div>
        </div>
      </ListShell>
      <TopicUploadModal
        open={uploadOpen}
        onClose={() => {
          setUploadOpen(false);
          setEditingRecord(null);
        }}
        onSubmit={handleUploadSubmit}
        initialRecord={editingRecord}
      />
    </div>
  );
}

export function TopicDetailPage() {
  const { topicId } = useParams();
  const navigate = useNavigate();
  const [records, setRecords] = useTopicMapRecords();
  const [editingRecord, setEditingRecord] = useState(null);
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
          {record.status === TOPIC_STATUS_UNPUBLISHED ? (
            <button type="button" className="ghost-button slim-button" onClick={() => setEditingRecord(record)}>
              <ButtonIcon type="edit" />
              <span>编辑</span>
            </button>
          ) : null}
          <button type="button" className={record.status === TOPIC_STATUS_PUBLISHED ? "ghost-button slim-button" : "primary-button slim-button"} onClick={toggleStatus}>
            <ButtonIcon type={record.status === TOPIC_STATUS_PUBLISHED ? "down" : "up"} />
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
      <TopicUploadModal
        open={Boolean(editingRecord)}
        onClose={() => setEditingRecord(null)}
        onSubmit={async (payload) => {
          const now = new Date();
          const stamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
            now.getDate(),
          ).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
          await setTopicImage(record.id, payload.imagePreview);
          setRecords((current) =>
            current.map((item) =>
              item.id === record.id
                ? {
                    ...item,
                    name: payload.name,
                    description: payload.description,
                    status: payload.publish ? TOPIC_STATUS_PUBLISHED : TOPIC_STATUS_UNPUBLISHED,
                    updatedAt: stamp,
                    thumbnail: payload.imagePreview,
                    imageKey: "",
                  }
                : item,
            ),
          );
          setEditingRecord(null);
          showToast(payload.publish ? "主题地图已更新并上架" : "草稿已更新", "success");
        }}
        initialRecord={editingRecord}
      />
    </div>
  );
}

export function TopicMapViewer({ record }) {
  return (
    <div className="topic-map-viewer">
      <div className="topic-map-canvas">
        <img className="topic-map-image static" src={record.thumbnail} alt={record.name} />
      </div>
    </div>
  );
}

function TopicUploadModal({ open, onClose, onSubmit, initialRecord = null }) {
  const isEditing = Boolean(initialRecord);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const resetForm = () => {
    setName("");
    setDescription("");
    setImageFile(null);
    setImagePreview("");
    setError("");
    setSubmitting(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  useEffect(() => {
    if (!open) return;
    setName(initialRecord?.name ?? "");
    setDescription(initialRecord?.description ?? "");
    setImageFile(null);
    setImagePreview(initialRecord?.thumbnail ?? "");
    setError("");
    setSubmitting(false);
  }, [initialRecord, open]);

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = (publish) => {
    if (!name.trim()) {
      setError("请填写名称");
      return;
    }
    if (!description.trim()) {
      setError("请填写描述");
      return;
    }
    if (!imagePreview) {
      setError("请上传图片");
      return;
    }
    setError("");
    setSubmitting(true);
    onSubmit({ id: initialRecord?.id, name: name.trim(), description: description.trim(), imagePreview, publish });
    resetForm();
    onClose();
  };

  if (!open) return null;

  return (
    <div className="export-modal-overlay" onClick={handleClose}>
      <div className="export-modal-card" style={{ maxWidth: 520 }} onClick={(e) => e.stopPropagation()}>
        <div className="export-modal-header">
          <h3>上传主题地图</h3>
          <button type="button" className="export-modal-close" onClick={handleClose}>×</button>
        </div>
        <div className="topic-upload-body">
          <div className="form-block">
            <label>名称</label>
            <input
              className="input"
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); if (error) setError(""); }}
              placeholder="请输入主题地图名称"
            />
          </div>
          <div className="form-block">
            <label>描述</label>
            <textarea
              className="textarea"
              rows="4"
              value={description}
              onChange={(e) => { setDescription(e.target.value); if (error) setError(""); }}
              placeholder="请输入主题地图描述"
            />
          </div>
          <div className="form-block">
            <label>主题图片</label>
            <div className="topic-upload-image-area">
              {imagePreview ? (
                <div className="topic-upload-preview">
                  <img src={imagePreview} alt="预览" />
                  <button type="button" className="topic-upload-remove" onClick={() => {
                    setImageFile(null);
                    setImagePreview("");
                  }}>×</button>
                </div>
              ) : (
                <label className="topic-upload-trigger">
                  <input type="file" accept="image/*" onChange={handleImageChange} hidden />
                  <span>+ 选择图片</span>
                </label>
              )}
            </div>
          </div>
          {error ? <span className="form-error">{error}</span> : null}
        </div>
        <div className="export-modal-footer">
          <button type="button" className="ghost-button slim-button" onClick={handleClose}>
            取消
          </button>
          <button type="button" className="ghost-button slim-button" onClick={() => handleSubmit(false)}>
            仅上传
          </button>
          <button type="button" className="primary-button slim-button" onClick={() => handleSubmit(true)}>
            上传并上架
          </button>
        </div>
      </div>
    </div>
  );
}

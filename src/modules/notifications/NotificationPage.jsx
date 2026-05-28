import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ListShell,
  Pagination,
  ButtonIcon,
  FilterSelect,
} from "../../components";
import { formatTimestamp, formatDate, showToast } from "../../components/utils";
import "./notifications.css";

const storageKey = "tdt-notification-state";

const statusOptions = ["草稿", "已发送"];

const baseRecords = [
  {
    id: "MSG-001",
    type: "影像更新",
    title: "卫星影像更新通知",
    content: "湖北省2025年第一季度卫星影像已完成更新，本次更新覆盖武汉、鄂州、黄石、黄冈等区域，空间分辨率优于1米。\n\n新增影像已自动入库，可直接在地图浏览和下载使用。建议尽快查看最新数据以支持业务分析。\n\n本次更新涉及以下方面：\n• 高分辨率光学影像：覆盖全省13个地级市，空间分辨率0.5m-1m\n• 多光谱影像：新增近红外、红边波段，适用于植被监测与土地利用分类\n• 历史影像归档：2020-2024年度影像已整理入库，支持时序对比分析\n\n如在使用过程中发现问题，请及时反馈至省级技术支撑团队。",
    tags: ["武汉市", "鄂州市", "黄石市", "黄冈市"],
    status: "已发送",
    createdAt: "2026-05-26 09:30",
    sentAt: "2026-05-26 09:35",
    readCount: 128,
  },
  {
    id: "MSG-002",
    type: "系统通知",
    title: "系统维护公告",
    content: "平台将于本周六 22:00-次日 02:00 进行升级维护，届时地图浏览、数据下载等功能将暂停服务。请提前做好数据备份。\n\n本次维护主要内容：\n• 数据库主从切换与性能优化，预计读写性能提升30%\n• 影像切片服务升级，新增WebP格式支持，加载速度更快\n• 用户权限模块重构，修复部分用户角色同步延迟问题\n• 安全补丁更新，修复已知高危漏洞CVE-2026-XXXX\n\n维护期间，天地图Web端、移动端App及API服务均不可用。建议各业务系统提前缓存所需数据。\n\n如有疑问请联系运维团队：027-8765XXXX。",
    tags: ["全省"],
    status: "已发送",
    createdAt: "2026-05-25 16:45",
    sentAt: "2026-05-25 17:00",
    readCount: 210,
  },
  {
    id: "MSG-003",
    type: "影像更新",
    title: "高分辨率影像上线",
    content: "襄阳市0.5米高分辨率影像已完成处理并入库，可满足城市规划、土地调查等高精度应用场景需求。\n\n影像覆盖范围：襄阳市全域（襄城区、樊城区、襄州区、南漳县、谷城县、保康县、老河口市、枣阳市、宜城市），总面积约1.97万平方公里。\n\n数据参数：\n• 空间分辨率：0.5m（全色）/ 2m（多光谱融合）\n• 采集时间：2026年4月-5月\n• 云覆盖率：<5%\n• 坐标系：CGCS2000\n• 数据格式：GeoTIFF（含金字塔分层）\n\n推荐应用方向：城市规划红线核查、违法建设用地监测、耕地保护执法、地质灾害隐患排查。",
    tags: ["襄阳市"],
    status: "已发送",
    createdAt: "2026-05-22 11:30",
    sentAt: "2026-05-22 11:35",
    readCount: 156,
  },
  {
    id: "MSG-004",
    type: "系统通知",
    title: "功能升级通知",
    content: "天地图移动端 v2.1.0 已发布，新增多时相影像对比、轨迹回放优化等功能，请引导用户更新。\n\nv2.1.0 更新详情：\n• 多时相影像对比：支持在同一视图内对比最多3个时期的卫星影像，可滑动分割线查看变化\n• 轨迹回放优化：新增速度颜色渲染，低速段绿色、中速段黄色、高速段红色，直观展示巡检节奏\n• 离线地图包管理：支持按行政区划下载离线瓦片，下载进度可断点续传\n• 语音标注：核查现场支持语音输入，自动转文字填入核查备注\n• UI交互优化：底部工具栏可自定义排序，常用功能一键直达\n\n升级方式：App内「我的」→「检查更新」或访问应用商店。\n\n旧版本（v2.0.x）将在30天后停止服务，请务必及时更新。",
    tags: ["全省"],
    status: "草稿",
    createdAt: "2026-05-20 15:40",
    sentAt: "",
    readCount: 0,
  },
  {
    id: "MSG-005",
    type: "影像更新",
    title: "季度影像更新预告",
    content: "2026年Q2影像更新预计于6月中旬启动，届时将覆盖全省17个地市州，请各用户提前规划数据使用计划。\n\nQ2更新计划概览：\n• 覆盖范围：湖北省全域（武汉市、黄石市、十堰市、宜昌市、襄阳市、鄂州市、荆门市、孝感市、荆州市、黄冈市、咸宁市、随州市、恩施州、仙桃市、潜江市、天门市、神农架林区）\n• 影像来源：高分七号（GF-7）、资源三号03星（ZY-3-03）立体像对\n• 预计数据量：约12TB（原始影像）+ 4TB（切片瓦片）\n• 更新周期：分批推送，首批6月15日上线武汉及周边城市圈\n\n注意事项：\n• Q2影像将替换Q1数据，请提前导出Q1期间标注的核查成果\n• 新影像入库后，现有任务中的SHP图斑坐标不受影响\n• 如有特殊区域需要优先处理，请在6月10日前提交申请",
    tags: ["全省"],
    status: "草稿",
    createdAt: "2026-05-18 10:00",
    sentAt: "",
    readCount: 0,
  },
];

function readStoredStates() {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(storageKey) ?? "{}");
  } catch {
    return {};
  }
}

function useRecords() {
  const [overrides, setOverrides] = useState(readStoredStates);

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(overrides));
  }, [overrides]);

  const records = useMemo(() => {
    return baseRecords.map((rec) => {
      const ov = overrides[rec.id];
      return ov ? { ...rec, ...ov } : rec;
    });
  }, [overrides]);

  const updateRecord = (id, patch) => {
    setOverrides((prev) => ({ ...prev, [id]: { ...(prev[id] ?? {}), ...patch } }));
  };

  const deleteRecord = (id) => {
    setOverrides((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const addRecord = (record) => {
    setOverrides((prev) => ({ ...prev, [record.id]: record }));
  };

  return { records, updateRecord, deleteRecord, addRecord };
}

function getNotificationStatusTone(status) {
  return status === "已发送" ? "success" : "muted";
}

/* ─── List Page ─── */

export function NotificationListPage() {
  const navigate = useNavigate();
  const { records, updateRecord, deleteRecord, addRecord } = useRecords();

  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [showModal, setShowModal] = useState(false);

  const filteredRecords = useMemo(() => {
    return records.filter((rec) => {
      if (searchText) {
        const kw = searchText.toLowerCase();
        const match =
          rec.title.toLowerCase().includes(kw) ||
          rec.id.toLowerCase().includes(kw) ||
          rec.content.toLowerCase().includes(kw) ||
          rec.tags.some((t) => t.toLowerCase().includes(kw));
        if (!match) return false;
      }
      if (statusFilter.length > 0 && !statusFilter.includes(rec.status)) return false;
      return true;
    });
  }, [records, searchText, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pagedRecords = filteredRecords.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize,
  );

  const statusCounts = useMemo(() => {
    const counts = {};
    records.forEach((r) => {
      counts[r.status] = (counts[r.status] || 0) + 1;
    });
    return counts;
  }, [records]);

  const handleDelete = (id) => {
    if (!window.confirm("确认删除该消息？")) return;
    deleteRecord(id);
    showToast("消息已删除");
  };

  const handleSend = (id) => {
    updateRecord(id, {
      status: "已发送",
      sentAt: formatTimestamp(new Date()),
    });
    showToast("消息已发送");
  };

  const handleCreate = (newRecord) => {
    addRecord(newRecord);
    setShowModal(false);
    showToast("消息创建成功");
  };

  return (
    <div className="page-content page-content--list notifications-page">
      <ListShell
        className="notifications-list-shell"
        searchBar={
          <input
            type="text"
            className="input search-input"
            placeholder="搜索标题、内容、标签..."
            value={searchText}
            onChange={(e) => {
              setSearchText(e.target.value);
              setPage(1);
            }}
          />
        }
        actions={
          <button
            type="button"
            className="primary-button slim-button"
            onClick={() => setShowModal(true)}
          >
            <span>新建消息</span>
          </button>
        }
        filters={
          <>
            <FilterSelect
              placeholder="状态"
              options={statusOptions}
              onChange={(vals) => {
                setStatusFilter(vals);
                setPage(1);
              }}
              optionCounts={statusCounts}
            />
          </>
        }
        footer={
          <Pagination
            currentPage={safePage}
            totalPages={totalPages}
            totalLabel={`共 ${filteredRecords.length} 条`}
            onChangePage={setPage}
            pageSize={pageSize}
            pageSizeOptions={[10, 20, 50]}
            onChangePageSize={(size) => {
              setPageSize(size);
              setPage(1);
            }}
          />
        }
      >
        <div className="notifications-table-scroll">
          <div className="table-shell selectable notifications-table-shell">
            <div className="table-row table-head cols-notifications">
              <span>编号</span>
              <span>标题与内容</span>
              <span>发送时间</span>
              <span>已读</span>
              <span>状态</span>
              <span>操作</span>
            </div>
            {pagedRecords.map((rec) => (
              <div
                key={rec.id}
                className="table-row cols-notifications notification-message-row"
                onClick={() => navigate(`/notifications/${rec.id}`)}
              >
                <span className="cell-muted">{rec.id}</span>
                <span className="notification-main">
                  <strong>{rec.title}</strong>
                  <em>{rec.content}</em>
                </span>
                <span>{formatDate(rec.sentAt) || formatDate(rec.createdAt)}</span>
                <span className="notification-read-count">
                  {rec.status === "草稿" ? "--" : rec.readCount}
                </span>
                <span>
                  <span className={`status-pill ${getNotificationStatusTone(rec.status)}`}>
                    {rec.status}
                  </span>
                </span>
                <span className="notification-action-group" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    className="inline-button action-view"
                    onClick={() => navigate(`/notifications/${rec.id}`)}
                  >
                    <ButtonIcon type="view" />
                    查看
                  </button>
                  {rec.status === "草稿" ? (
                    <button
                      type="button"
                      className="inline-button action-publish"
                      onClick={() => handleSend(rec.id)}
                    >
                      <ButtonIcon type="up" />
                      发送
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="inline-button danger-button"
                      onClick={() => handleDelete(rec.id)}
                    >
                      <ButtonIcon type="reject" />
                      删除
                    </button>
                  )}
                </span>
              </div>
            ))}
            {pagedRecords.length === 0 && (
              <div className="empty-state">暂无匹配的消息记录</div>
            )}
          </div>
        </div>
      </ListShell>

      {showModal && (
        <NotificationModal
          onClose={() => setShowModal(false)}
          onSubmit={handleCreate}
        />
      )}
    </div>
  );
}

/* ─── Detail Page ─── */

export function NotificationDetailPage() {
  const navigate = useNavigate();
  const { notificationId } = useParams();
  const { records, updateRecord, deleteRecord } = useRecords();

  const record = records.find((r) => r.id === notificationId);

  if (!record) {
    return (
      <div className="page-content notification-detail-page">
        <section className="notification-detail-header">
          <div className="notification-detail-heading">
            <button type="button" className="icon-back-button" onClick={() => navigate("/notifications")} aria-label="返回">
              <ButtonIcon type="back" />
            </button>
          </div>
        </section>
        <div className="empty-state">消息不存在或已被删除</div>
      </div>
    );
  }

  const handleDelete = () => {
    if (!window.confirm("确认删除该消息？")) return;
    deleteRecord(record.id);
    showToast("消息已删除");
    navigate("/notifications");
  };

  const detailFields = [
    { label: "消息编号", value: record.id },
    { label: "创建时间", value: formatDate(record.createdAt) },
    { label: "发送时间", value: formatDate(record.sentAt) || "未发送" },
  ];

  return (
    <div className="page-content topic-detail-page notification-detail-page">
      <section className="topic-detail-header notification-detail-header">
        <div className="topic-detail-heading notification-detail-heading">
          <button type="button" className="icon-back-button" onClick={() => navigate("/notifications")} aria-label="返回">
            <ButtonIcon type="back" />
          </button>
          <div className="topic-detail-title notification-detail-title">
            <h2>{record.title}</h2>
            <span className={`status-pill ${getNotificationStatusTone(record.status)}`}>{record.status}</span>
          </div>
        </div>
        <div className="topic-detail-toolbar notification-detail-toolbar">
          {record.status === "草稿" && (
            <button
              type="button"
              className="primary-button slim-button"
              onClick={() => {
                updateRecord(record.id, {
                  status: "已发送",
                  sentAt: formatTimestamp(new Date()),
                });
                showToast("消息已发送");
              }}
            >
              发送消息
            </button>
          )}
          <button type="button" className="ghost-button slim-button danger-button" onClick={handleDelete}>
            删除
          </button>
        </div>
      </section>

      <div className="notification-detail-main-grid">
        <div className="notification-detail-form">
          {detailFields.map((field) => (
            <div key={field.label} className="notification-detail-form-group">
              <label className="notification-detail-form-label">{field.label}</label>
              <div className="notification-detail-form-value">{field.value}</div>
            </div>
          ))}

          <div className="notification-detail-form-group">
            <label className="notification-detail-form-label">标签</label>
            <div className="notification-detail-form-tags">
              {record.tags.length ? (
                record.tags.map((tag) => (
                  <span key={tag} className="notification-detail-tag">{tag}</span>
                ))
              ) : (
                <span className="notification-detail-form-value" style={{ color: "#8a8176" }}>暂无标签</span>
              )}
            </div>
          </div>

          <div className="notification-detail-form-stats">
            <div className="notification-detail-stat-item">
              <span className="notification-detail-stat-value">{record.readCount}</span>
              <span className="notification-detail-stat-label">已读人数</span>
            </div>
          </div>
        </div>

        <div className="notification-detail-content">
          <h3 className="notification-detail-content-title">{record.title}</h3>
          <div className="notification-detail-content-body">{record.content}</div>
        </div>
      </div>
    </div>
  );
}

/* ─── Create Modal ─── */

function NotificationModal({ onClose, onSubmit }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState("");
  const [errors, setErrors] = useState({});

  const addTag = () => {
    const val = tagInput.trim();
    if (val && !tags.includes(val)) {
      setTags((prev) => [...prev, val]);
    }
    setTagInput("");
  };

  const removeTag = (tag) => {
    setTags((prev) => prev.filter((t) => t !== tag));
  };

  const validate = () => {
    const errs = {};
    if (!title.trim()) errs.title = "标题不能为空";
    if (!content.trim()) errs.content = "正文不能为空";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = (status) => {
    if (!validate()) return;
    const now = formatTimestamp(new Date());
    const id = `MSG-${String(Date.now()).slice(-6)}`;
    onSubmit({
      id,
      type: "系统通知",
      title: title.trim(),
      content: content.trim(),
      tags,
      status,
      createdAt: now,
      sentAt: status === "已发送" ? now : "",
      readCount: 0,
    });
  };

  return (
    <div className="export-modal-overlay" onClick={onClose}>
      <div className="export-modal-card" style={{ maxWidth: 520 }} onClick={(e) => e.stopPropagation()}>
        <div className="export-modal-header">
          <h3>新建消息</h3>
          <button type="button" className="export-modal-close" onClick={onClose}>×</button>
        </div>

        <div className="topic-upload-body">
          <div className="form-block">
            <label>标题</label>
            <input
              className="input"
              placeholder="请输入消息标题"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            {errors.title && <span className="form-error">{errors.title}</span>}
          </div>

          <div className="form-block">
            <label>正文</label>
            <textarea
              className="textarea"
              rows="8"
              placeholder="请输入消息正文内容"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
            {errors.content && <span className="form-error">{errors.content}</span>}
          </div>

          <div className="form-block">
            <label>标签</label>
            <div className="notification-tag-input-row">
              <input
                className="input"
                placeholder="输入标签后按回车添加"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTag();
                  }
                }}
              />
              <button type="button" className="ghost-button slim-button" onClick={addTag}>
                添加
              </button>
            </div>
            {tags.length > 0 && (
              <div className="notification-form-tags">
                {tags.map((tag) => (
                  <span key={tag} className="notification-form-tag-option selected">
                    {tag}
                    <span className="notification-tag-remove" onClick={() => removeTag(tag)}>×</span>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="export-modal-footer">
          <button type="button" className="ghost-button slim-button" onClick={onClose}>
            取消
          </button>
          <button type="button" className="ghost-button slim-button" onClick={() => handleSave("草稿")}>
            保存草稿
          </button>
          <button type="button" className="primary-button slim-button" onClick={() => handleSave("已发送")}>
            直接发送
          </button>
        </div>
      </div>
    </div>
  );
}

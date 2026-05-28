import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ListShell,
  Pagination,
  ButtonIcon,
  InfoField,
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
    content: "湖北省2025年第一季度卫星影像已完成更新，本次更新覆盖武汉、鄂州、黄石、黄冈等区域，空间分辨率优于1米。\n\n新增影像已自动入库，可直接在地图浏览和下载使用。建议尽快查看最新数据以支持业务分析。",
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
    content: "平台将于本周六 22:00-次日 02:00 进行升级维护，届时地图浏览、数据下载等功能将暂停服务。请提前做好数据备份。",
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
    content: "襄阳市0.5米高分辨率影像已完成处理并入库，可满足城市规划、土地调查等高精度应用场景需求。",
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
    content: "天地图移动端 v2.1.0 已发布，新增多时相影像对比、轨迹回放优化等功能，请引导用户更新。",
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
    content: "2026年Q2影像更新预计于6月中旬启动，届时将覆盖全省17个地市州，请各用户提前规划数据使用计划。",
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

  const readRate = record.status === "草稿" ? "--" : "98%";

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

      <section className="topic-detail-description notification-detail-description">
        <p>{record.content}</p>
      </section>

      <section className="topic-detail-map-shell notification-detail-panel-shell">
        <div className="notification-detail-panel">
          <div className="notification-detail-body-section">
            <div className="notification-detail-info-grid">
              {detailFields.map((field) => (
                <InfoField key={field.label} label={field.label} value={field.value} />
              ))}
            </div>

            <div className="notification-detail-section">
              <span className="notification-detail-section-label">标签</span>
              <div className="notification-detail-tags">
                {record.tags.map((tag) => (
                  <span key={tag} className="notification-detail-tag">{tag}</span>
                ))}
                {record.tags.length === 0 && (
                  <span className="cell-muted">暂无标签</span>
                )}
              </div>
            </div>

            <div className="notification-detail-stats-row">
              <div className="notification-stat-box">
                <div className="stat-value">{record.readCount}</div>
                <div className="stat-label">已读人数</div>
              </div>
              <div className="notification-stat-box">
                <div className="stat-value">{readRate}</div>
                <div className="stat-label">阅读率</div>
              </div>
              <div className="notification-stat-box">
                <div className="stat-value">{record.tags.length}</div>
                <div className="stat-label">标签数</div>
              </div>
            </div>
          </div>
        </div>
      </section>
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

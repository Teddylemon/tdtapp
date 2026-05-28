import { useEffect, useMemo, useState } from "react";
import FilterSelect from "../../components/FilterSelect";
import { formatDate } from "../../components/utils";
import "./release-notes.css";

const RELEASE_STATUS_OPTIONS = ["已同步推送", "待同步推送", "同步推送中"];

const initialReleases = [
  {
    id: "REL-2026-0518",
    version: "V2.6.0",
    publishedAt: "2026-05-18 20:30",
    status: "已同步推送",
    summary: "优化专题发布链路，补充离线数据包提示，并修复审核同步异常。",
    content: {
      新增: ["新增专题地图发布结果摘要卡片", "新增更新日志详情弹窗查看入口"],
      优化: ["优化专题审核后的状态流转提示", "优化离线资源下载失败说明"],
      修复: ["修复节点同步后状态未刷新问题", "修复意见反馈列表重复字段展示异常"],
    },
  },
  {
    id: "REL-2026-0511",
    version: "V2.5.4",
    publishedAt: "2026-05-11 10:00",
    status: "已同步推送",
    summary: "提升搜索结果页加载稳定性，修复地图标注偶发漂移。",
    content: {
      新增: ["新增热搜词统计导出能力"],
      优化: ["优化搜索结果页首屏渲染速度", "优化底图切换动画表现"],
      修复: ["修复轨迹记录偶发丢点问题", "修复地图标注拖拽后的坐标漂移"],
    },
  },
  {
    id: "REL-2026-0426",
    version: "V2.5.0",
    publishedAt: "2026-04-26 16:40",
    status: "待同步推送",
    summary: "版本灰度准备完成，等待统一发布窗口推送。",
    content: {
      新增: ["新增用户专题收藏分组能力"],
      优化: ["优化地图缩放灵敏度", "优化反馈提交通知链路"],
      修复: ["修复多图层叠加时的样式错乱"],
    },
  },
];

const emptyDraft = {
  version: "",
  publishedAt: new Date().toISOString().slice(0, 16),
  newItems: "",
  optimizeItems: "",
  fixItems: "",
};

function emitToast(message, tone = "success") {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent("tdt-toast", {
      detail: {
        id: `release-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
        message,
        tone,
      },
    }),
  );
}

function countItems(content) {
  return Object.values(content).reduce((sum, items) => sum + items.length, 0);
}

function parseLines(value) {
  return value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
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

function ReleaseModal({ title, description, onClose, children, actions, wide = false }) {
  return (
    <div className="release-modal-backdrop" role="dialog" aria-modal="true" onClick={onClose}>
      <div
        className={`release-modal ${wide ? "release-modal--wide" : ""}`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="release-modal-head">
          <div>
            <h3>{title}</h3>
            {description ? <p>{description}</p> : null}
          </div>
          <button type="button" className="release-modal-close" onClick={onClose} aria-label="关闭">
            ×
          </button>
        </div>
        <div className="release-modal-body">{children}</div>
        {actions ? <div className="release-modal-actions">{actions}</div> : null}
      </div>
    </div>
  );
}

export default function ReleaseNotesManager() {
  const [releases, setReleases] = useState(initialReleases);
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedReleaseId, setSelectedReleaseId] = useState(null);
  const [draft, setDraft] = useState(emptyDraft);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const filteredReleases = useMemo(() => {
    return releases.filter((release) => {
      const normalizedKeyword = keyword.trim().toLowerCase();
      const matchKeyword =
        normalizedKeyword === "" ||
        release.version.toLowerCase().includes(normalizedKeyword) ||
        release.summary.toLowerCase().includes(normalizedKeyword);
      const matchStatus = statusFilter.length === 0 || statusFilter.includes(release.status);
      return matchKeyword && matchStatus;
    });
  }, [keyword, releases, statusFilter]);

  const releaseStatusCounts = useMemo(
    () =>
      releases.reduce(
        (acc, release) => {
          acc[release.status] = (acc[release.status] ?? 0) + 1;
          return acc;
        },
        Object.fromEntries(RELEASE_STATUS_OPTIONS.map((status) => [status, 0])),
      ),
    [releases],
  );

  const totalPages = Math.max(1, Math.ceil(filteredReleases.length / pageSize));

  useEffect(() => {
    setPage((current) => Math.min(current, totalPages));
  }, [totalPages]);

  const pagedReleases = filteredReleases.slice((page - 1) * pageSize, page * pageSize);
  const selectedRelease = releases.find((release) => release.id === selectedReleaseId) ?? null;

  const handleCreateRelease = () => {
    if (!draft.version.trim()) {
      emitToast("请填写版本号", "warning");
      return;
    }

    const content = {
      新增: parseLines(draft.newItems),
      优化: parseLines(draft.optimizeItems),
      修复: parseLines(draft.fixItems),
    };

    if (countItems(content) === 0) {
      emitToast("请至少填写一条更新内容", "warning");
      return;
    }

    const nextId = `REL-${Date.now()}`;
    const nextRelease = {
      id: nextId,
      version: draft.version.trim(),
      publishedAt: draft.publishedAt.replace("T", " "),
      status: "同步推送中",
      summary: [...content.新增, ...content.优化, ...content.修复].slice(0, 2).join("；"),
      content,
    };

    setReleases((current) => [nextRelease, ...current]);
    setIsCreateOpen(false);
    setDraft(emptyDraft);
    setPage(1);
    emitToast(`版本 ${nextRelease.version} 已创建，正在同步推送`);

    window.setTimeout(() => {
      setReleases((current) =>
        current.map((release) =>
          release.id === nextId ? { ...release, status: "已同步推送" } : release,
        ),
      );
      emitToast(`版本 ${nextRelease.version} 已完成同步推送`);
    }, 1200);
  };

  return (
    <div className="page-content page-content--list release-page">
      <article className="panel list-shell release-list-shell">
        <div className="list-shell-top">
          <div className="list-shell-search search-slot">
            <input
              className="input search-input"
              value={keyword}
              onChange={(event) => {
                setKeyword(event.target.value);
                setPage(1);
              }}
              placeholder="搜索版本号、更新摘要"
            />
          </div>
        </div>

        <div className="list-shell-filters">
          <div className="filter-cluster release-filter-cluster">
            <FilterSelect
              placeholder="推送状态"
              options={RELEASE_STATUS_OPTIONS}
              onChange={(selected, allSelected) => {
                setStatusFilter(allSelected ? [] : selected);
                setPage(1);
              }}
              optionCounts={releaseStatusCounts}
            />
          </div>
          <div className="filter-actions">
            <button
              type="button"
              className="primary-button slim-button"
              onClick={() => setIsCreateOpen(true)}
            >
              新增版本发布
            </button>
          </div>
        </div>

        <div className="list-shell-body">
          <div className="release-table-scroll">
            <div className="table-shell selectable release-table-shell">
            <div className="table-row table-head release-cols">
              <span>版本号</span>
              <span>更新摘要</span>
              <span>发布时间</span>
              <span>推送状态</span>
              <span>操作</span>
            </div>
            {pagedReleases.map((release) => (
              <div key={release.id} className="table-row release-cols">
                <span className="release-version-cell">
                  <strong>{release.version}</strong>
                  <em>{countItems(release.content)} 项更新</em>
                </span>
                <span className="release-summary-cell">{release.summary}</span>
                <span>{formatDate(release.publishedAt)}</span>
                <span>
                  <span
                    className={`release-status-pill ${
                      release.status === "已同步推送"
                        ? "success"
                        : release.status === "同步推送中"
                          ? "progress"
                          : "waiting"
                    }`}
                  >
                    {release.status}
                  </span>
                </span>
                <span className="release-action-cell">
                  <button
                    type="button"
                    className="inline-button action-view"
                    onClick={() => setSelectedReleaseId(release.id)}
                  >
                    <span>查看详情</span>
                  </button>
                </span>
              </div>
            ))}
            {pagedReleases.length === 0 ? (
              <div className="release-empty">当前没有符合条件的版本记录</div>
            ) : null}
          </div>
          </div>
        </div>

        <div className="list-shell-footer">
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            totalLabel={`共 ${filteredReleases.length} 条`}
            onChangePage={setPage}
            pageSize={pageSize}
            pageSizeOptions={[10, 20, 30, 50]}
            onChangePageSize={(size) => {
              setPageSize(size);
              setPage(1);
            }}
          />
        </div>
      </article>

      {selectedRelease ? (
        <ReleaseModal
          title={`${selectedRelease.version} 更新详情`}
          description={`发布时间 ${formatDate(selectedRelease.publishedAt)}`}
          onClose={() => setSelectedReleaseId(null)}
          actions={
            <button
              type="button"
              className="primary-button slim-button"
              onClick={() => setSelectedReleaseId(null)}
            >
              知道了
            </button>
          }
          wide
        >
          <div className="release-form-surface">
            <div className="detail-grid compact">
              <div className="info-field">
                <span>发布时间</span>
                <strong>{selectedRelease.publishedAt}</strong>
              </div>
              <div className="info-field">
                <span>推送状态</span>
                <strong>{selectedRelease.status}</strong>
              </div>
            </div>
          </div>
          <div className="release-detail-sections">
            {Object.entries(selectedRelease.content).map(([group, items]) => (
              <section key={group} className="release-detail-card">
                <h4>{group}</h4>
                <ul>
                  {items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </ReleaseModal>
      ) : null}

      {isCreateOpen ? (
        <ReleaseModal
          title="新增版本发布"
          description="填写版本号、发布时间和更新内容，保存后会同步推送版本发布。"
          onClose={() => setIsCreateOpen(false)}
          actions={
            <>
              <button
                type="button"
                className="ghost-button slim-button"
                onClick={() => setIsCreateOpen(false)}
              >
                取消
              </button>
              <button
                type="button"
                className="primary-button slim-button"
                onClick={handleCreateRelease}
              >
                保存并推送
              </button>
            </>
          }
          wide
        >
          <div className="release-form-surface">
            <div className="form-grid">
              <div className="form-block">
                <label>版本号</label>
                <input
                  className="input"
                  type="text"
                  value={draft.version}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, version: event.target.value }))
                  }
                  placeholder="例如 V2.6.1"
                />
              </div>
              <div className="form-block">
                <label>发布时间</label>
                <input
                  className="input"
                  type="datetime-local"
                  value={draft.publishedAt}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, publishedAt: event.target.value }))
                  }
                />
              </div>
            </div>
          </div>
          <div className="release-form-stack">
            <div className="release-form-surface">
              <div className="form-block">
                <label>新增内容</label>
                <textarea
                  className="textarea"
                  rows="4"
                  value={draft.newItems}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, newItems: event.target.value }))
                  }
                  placeholder="每行填写一条新增内容"
                />
              </div>
            </div>
            <div className="release-form-surface">
              <div className="form-block">
                <label>优化内容</label>
                <textarea
                  className="textarea"
                  rows="4"
                  value={draft.optimizeItems}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, optimizeItems: event.target.value }))
                  }
                  placeholder="每行填写一条优化内容"
                />
              </div>
            </div>
            <div className="release-form-surface">
              <div className="form-block">
                <label>修复内容</label>
                <textarea
                  className="textarea"
                  rows="4"
                  value={draft.fixItems}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, fixItems: event.target.value }))
                  }
                  placeholder="每行填写一条修复内容"
                />
              </div>
            </div>
          </div>
        </ReleaseModal>
      ) : null}
    </div>
  );
}

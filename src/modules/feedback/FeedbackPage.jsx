import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ListShell, Pagination, ButtonIcon, InfoField, FeedbackSingleSelect, FilterSelect } from "../../components";
import { formatTimestamp, formatDate, showToast } from "../../components/utils";

const reviewImageModules = import.meta.glob("../../../imgs/*.{png,jpg,jpeg,webp}", {
  eager: true,
  import: "default",
});

const reviewImageMap = Object.fromEntries(
  Object.entries(reviewImageModules).map(([filePath, url]) => [
    filePath.split("/").pop().replace(/\.[^.]+$/, ""),
    url,
  ]),
);

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

function readStoredFeedbackStates() {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(feedbackStorageKey) ?? "{}");
  } catch {
    return {};
  }
}

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

export function FeedbackListPage() {
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

  const feedbackTypeOptions = ["问题反馈", "功能建议", "体验优化"];
  const feedbackStatusOptions = feedbackStatusChoices;

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
                setTypeFilter(allSelected ? [] : selected);
                setPage(1);
              }}
              optionCounts={feedbackTypeCounts}
            />
            <FilterSelect
              placeholder="处理状态"
              options={feedbackStatusOptions}
              onChange={(selected, allSelected) => {
                setStatusFilter(allSelected ? [] : selected);
                setPage(1);
              }}
              optionCounts={feedbackStatusCounts}
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
                  <span>{formatDate(record.submittedAt)}</span>
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

export function FeedbackDetailPage() {
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
    meta: `${item.submitter} · ${formatDate(item.submittedAt)}`,
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
              <span>{formatDate(record.submittedAt)}</span>
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
                <span>{activeGroupRecord.submitter} · {formatDate(activeGroupRecord.submittedAt)}</span>
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

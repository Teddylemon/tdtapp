import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ListShell, Pagination, ButtonIcon, FeedbackSingleSelect, FilterSelect } from "../../components";
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

const feedbackStatusChoices = ["待处理", "已采纳", "不采纳"];
const feedbackDecisionOptions = [
  { value: "待处理", label: "待处理" },
  { value: "已采纳", label: "采纳" },
  { value: "不采纳", label: "不采纳" },
];

const feedbackTypeOptions = ["问题反馈", "功能建议", "体验优化"];

const feedbackBaseRecords = [
  {
    id: "FB-001",
    submitter: "张明",
    contact: "13800138001",
    submittedAt: "2026-05-14 09:23",
    type: "问题反馈",
    content: "离线地图下载到 70% 时经常失败，重试后还是同样的问题，已经尝试过清除缓存重新下载。",
    images: [reviewImageMap.biaohui ?? ""],
    status: "待处理",
    handler: "",
    handledAt: "",
    handleResult: "",
  },
  {
    id: "FB-002",
    submitter: "李华",
    contact: "lihua@example.com",
    submittedAt: "2026-05-13 16:45",
    type: "功能建议",
    content: "希望能支持轨迹导出为 Excel 格式，方便我们做外业记录的整理和上报。",
    images: [],
    status: "已采纳",
    handler: "周洁",
    handledAt: "2026-05-14 11:10",
    handleResult: "建议已记录到产品需求池，后续会结合导出场景统一评估。",
  },
  {
    id: "FB-003",
    submitter: "王芳",
    contact: "13900139002",
    submittedAt: "2026-05-13 14:12",
    type: "体验优化",
    content: "专题图层切换时有明显卡顿，特别是在叠加多个图层的情况下，响应时间超过 2 秒。",
    images: [reviewImageMap.biaohui ?? ""],
    status: "不采纳",
    handler: "林程",
    handledAt: "2026-05-14 10:30",
    handleResult: "已作为性能优化建议记录，本期暂不单独排期。",
  },
  {
    id: "FB-004",
    submitter: "赵强",
    contact: "zhaoqiang@test.com",
    submittedAt: "2026-05-12 11:08",
    type: "问题反馈",
    content: "在导航过程中，语音播报偶尔会延迟 3 到 5 秒，错过转弯提醒。",
    images: [],
    status: "不采纳",
    handler: "赵航",
    handledAt: "2026-05-13 09:15",
    handleResult: "问题已记录，当前版本暂不复现，先关闭观察。",
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
  },
  {
    id: "FB-006",
    submitter: "刘洋",
    contact: "liuyang@example.com",
    submittedAt: "2026-05-10 09:15",
    type: "体验优化",
    content: "搜索结果列表太长时没有分页，建议增加分页或者无限滚动加载。",
    images: [],
    status: "已采纳",
    handler: "周洁",
    handledAt: "2026-05-11 15:20",
    handleResult: "体验优化建议已采纳，会在后续版本统一处理搜索结果展示方式。",
  },
  {
    id: "FB-007",
    submitter: "黄磊",
    contact: "13600136004",
    submittedAt: "2026-05-09 15:42",
    type: "问题反馈",
    content: "标绘功能在绘制多边形时，双击结束偶尔会无响应，需要重新开始。",
    images: [],
    status: "不采纳",
    handler: "林程",
    handledAt: "2026-05-10 14:20",
    handleResult: "问题已记录，但当前版本暂未稳定复现，先作为一般问题留档。",
  },
  {
    id: "FB-008",
    submitter: "周婷",
    contact: "zhouting@test.com",
    submittedAt: "2026-05-08 12:00",
    type: "功能建议",
    content: "希望能支持离线标注功能，在没有网络的情况下也能进行标绘，联网后自动同步。",
    images: [],
    status: "不采纳",
    handler: "周洁",
    handledAt: "2026-05-09 16:45",
    handleResult: "当前项目交付范围内暂不支持离线标绘，本期不采纳。",
  },
];

function normalizeFeedbackStatus(status) {
  if (status === "已采纳" || status === "采纳") return "已采纳";
  if (status === "不采纳") return "不采纳";
  return "待处理";
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
      status: normalizeFeedbackStatus(stored[item.id]?.status ?? item.status),
      handler: stored[item.id]?.handler ?? item.handler,
      handledAt: stored[item.id]?.handledAt ?? item.handledAt,
      handleResult: stored[item.id]?.handleResult ?? item.handleResult,
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
        },
      ]),
    );
    window.localStorage.setItem(feedbackStorageKey, JSON.stringify(payload));
  }, [records]);

  return [records, setRecords];
}

function feedbackStatusTone(status) {
  if (status === "已采纳") return "success";
  if (status === "不采纳") return "danger";
  return "pending";
}

function feedbackStatusLabel(status) {
  return feedbackStatusChoices.includes(status) ? status : "待处理";
}

function feedbackTypeTone(type) {
  if (type === "问题反馈") return "bug";
  if (type === "功能建议") return "feature";
  return "optimize";
}

export function FeedbackListPage() {
  const navigate = useNavigate();
  const [records] = useFeedbackRecords();
  const [searchText, setSearchText] = useState("");
  const [typeFilter, setTypeFilter] = useState([]);
  const [statusFilter, setStatusFilter] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filteredRecords = records.filter((item) => {
    const keyword = searchText.trim().toLowerCase();
    const matchSearch =
      keyword === "" ||
      [item.id, item.submitter, item.contact, item.content].some((field) =>
        String(field).toLowerCase().includes(keyword),
      );
    const matchType = typeFilter.length === 0 || typeFilter.includes(item.type);
    const matchStatus = statusFilter.length === 0 || statusFilter.includes(item.status);
    return matchSearch && matchType && matchStatus;
  });

  const feedbackTypeCounts = records.reduce(
    (acc, item) => {
      acc[item.type] = (acc[item.type] ?? 0) + 1;
      return acc;
    },
    { 问题反馈: 0, 功能建议: 0, 体验优化: 0 },
  );

  const feedbackStatusCounts = records.reduce(
    (acc, item) => {
      acc[item.status] = (acc[item.status] ?? 0) + 1;
      return acc;
    },
    { 待处理: 0, 已采纳: 0, 不采纳: 0 },
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
                setTypeFilter(allSelected ? [] : selected);
                setPage(1);
              }}
              optionCounts={feedbackTypeCounts}
            />
            <FilterSelect
              placeholder="处理状态"
              options={feedbackStatusChoices}
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
            totalLabel={`共${filteredRecords.length}条`}
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
            {pagedRecords.map((record) => (
              <div
                key={record.id}
                className="table-row cols-feedback-v2 feedback-row"
                onClick={() => navigate(`/feedback/${record.id}`)}
              >
                <span>{record.id}</span>
                <span>
                  <span className={`feedback-type-badge ${feedbackTypeTone(record.type)}`}>{record.type}</span>
                </span>
                <span className="feedback-content-cell">
                  <em>{record.content}</em>
                </span>
                <span>{record.submitter}</span>
                <span>{formatDate(record.submittedAt)}</span>
                <span>
                  <span className={`status-pill ${feedbackStatusTone(record.status)}`}>
                    {feedbackStatusLabel(record.status)}
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

export function FeedbackDetailPage() {
  const { feedbackId } = useParams();
  const navigate = useNavigate();
  const [records, setRecords] = useFeedbackRecords();
  const record = records.find((item) => item.id === feedbackId) ?? records[0];
  const [handleResult, setHandleResult] = useState("");
  const [status, setStatus] = useState("待处理");
  const [previewImage, setPreviewImage] = useState("");

  useEffect(() => {
    setHandleResult(record?.handleResult ?? "");
    setStatus(record?.status ?? "待处理");
    setPreviewImage("");
  }, [record]);

  if (!record) return null;

  const imageList = (record.images ?? []).filter(Boolean);

  const saveFeedback = () => {
    const stamp = formatTimestamp();
    const trimmedResult = handleResult.trim();
    const isHandled = status !== "待处理";

    setRecords((current) =>
      current.map((item) => {
        if (item.id !== record.id) return item;
        return {
          ...item,
          status,
          handler: isHandled ? item.handler || "平台管理员" : "",
          handledAt: isHandled ? item.handledAt || stamp : "",
          handleResult: trimmedResult,
        };
      }),
    );

    if (status === "待处理") {
      showToast("反馈已更新", "success");
      return;
    }

    showToast(record.status === status ? "反馈处理结果已更新" : `反馈已标记为${status}`, "success");
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
              <span className={`status-pill ${feedbackStatusTone(record.status)}`}>
                {feedbackStatusLabel(record.status)}
              </span>
            </div>
            <div className="feedback-v2-meta">
              <span className={`feedback-type-badge ${feedbackTypeTone(record.type)}`}>{record.type}</span>
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
            </div>
            <div className="feedback-v2-content">{record.content}</div>
            <div className="feedback-v2-contact">
              <span>反馈人联系方式</span>
              <strong>{record.contact}</strong>
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
                <span>{`当前处理 ${record.id}`}</span>
              </div>

              <div className="form-block">
                <label>处理结果</label>
                <FeedbackSingleSelect
                  value={status}
                  compact
                  options={feedbackDecisionOptions}
                  onChange={setStatus}
                />
              </div>

              <div className="form-block">
                <label>处理意见</label>
                <textarea
                  className="textarea feedback-v2-textarea"
                  rows="5"
                  value={handleResult}
                  onChange={(event) => setHandleResult(event.target.value)}
                  placeholder="请简要填写处理意见"
                />
              </div>
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

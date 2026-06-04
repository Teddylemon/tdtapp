import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ListShell, Pagination, ButtonIcon } from "../../components";
import { formatTimestamp, formatDate, showToast } from "../../components/utils";
import {
  reviewStatusTone,
  compactReviewStatus,
  ReviewInfoRow,
  getReviewMapData,
  ReviewLeafletMap,
} from "../_shared/ReviewShared";
import ExportFormatModal from "../_shared/GeoExport";

const markerImageModules = import.meta.glob("../../../imgs/*.{png,jpg,jpeg,webp}", {
  eager: true,
  import: "default",
});

const markerImageMap = Object.fromEntries(
  Object.entries(markerImageModules).map(([filePath, url]) => [
    filePath.split("/").pop().replace(/\.[^.]+$/, ""),
    url,
  ]),
);

const markerStorageKey = "tdt-marker-review-state";

const markerBaseRecords = [
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
    markerImage: markerImageMap.biaohui ?? "",
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
    markerImage: markerImageMap.biaohui ?? "",
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
    markerImage: markerImageMap.biaohui ?? "",
    markerFolder: "应急保障 / 封控区域",
    summary: "已完成审核并同步，移动端下一次在线更新即可生效。",
    reviewedAt: "2026-05-14 11:12",
    platformUpdatedAt: "2026-05-14 11:26",
    reviewComment: "封控范围与图片一致，已完成更新。",
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
    markerImage: markerImageMap.biaohui ?? "",
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
    markerImage: markerImageMap.biaohui ?? "",
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
    markerImage: markerImageMap.biaohui ?? "",
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
    markerImage: markerImageMap.biaohui ?? "",
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
    markerImage: markerImageMap.biaohui ?? "",
    markerFolder: "公园管理 / 积水面",
    summary: "已退回，建议重新测量范围后再提交。",
    reviewedAt: "2026-05-12 17:18",
    platformUpdatedAt: "-",
    reviewComment: "面状范围与图片不符，请重新确认边界。",
  },
];

function readStoredMarkerStates() {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(markerStorageKey) ?? "{}");
  } catch {
    return {};
  }
}

function useMarkerRecords() {
  const [records, setRecords] = useState(() => {
    const stored = readStoredMarkerStates();
    return markerBaseRecords.map((item) => ({
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
    window.localStorage.setItem(markerStorageKey, JSON.stringify(payload));
  }, [records]);

  return [records, setRecords];
}

export function MarkersListPage() {
  const navigate = useNavigate();
  const [storedRecords] = useMarkerRecords();
  const [searchText, setSearchText] = useState("");
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const records = storedRecords;

  const filteredRecords = records.filter((item) => {
    const keyword = searchText.trim().toLowerCase();
    return (
      keyword === "" ||
      [item.id, item.title, item.description, item.submitter].some((field) =>
        field.toLowerCase().includes(keyword),
      )
    );
  });

  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / pageSize));

  useEffect(() => {
    setPage((current) => Math.min(current, totalPages));
  }, [totalPages]);

  const pagedRecords = filteredRecords.slice((page - 1) * pageSize, page * pageSize);
  const pagedIds = pagedRecords.map((item) => item.id);
  const allPageSelected = pagedIds.length > 0 && pagedIds.every((id) => selectedIds.has(id));

  const toggleSelectAll = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allPageSelected) {
        pagedIds.forEach((id) => next.delete(id));
      } else {
        pagedIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const [exportOpen, setExportOpen] = useState(false);
  const [exportTarget, setExportTarget] = useState(null);

  const handleExportSelected = () => {
    const items = filteredRecords.filter((item) => selectedIds.has(item.id));
    if (items.length === 0) {
      showToast("请先勾选要导出的数据", "warning");
      return;
    }
    setExportTarget({ records: items, label: "选中" });
    setExportOpen(true);
  };

  const handleExportAll = () => {
    setExportTarget({ records: filteredRecords, label: "全部" });
    setExportOpen(true);
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
        actions={
          <>
            <button type="button" className="ghost-button slim-button" onClick={handleExportSelected}>
              <ButtonIcon type="export" />
              <span>导出选中{selectedIds.size > 0 ? ` (${selectedIds.size})` : ""}</span>
            </button>
            <button type="button" className="ghost-button slim-button" onClick={handleExportAll}>
              <ButtonIcon type="export" />
              <span>导出全部</span>
            </button>
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
        <div className="review-table-scroll">
          <div className="table-shell review-table-shell">
            <div className="table-row table-head cols-review-markers">
              <span className="checkbox-cell">
                <input type="checkbox" checked={allPageSelected} onChange={toggleSelectAll} />
              </span>
              <span>编号</span>
              <span>标绘类型</span>
              <span>具体信息</span>
              <span>提交人</span>
              <span>提交时间</span>
              <span>操作</span>
            </div>
            {pagedRecords.map((record) => (
              <div
                key={record.id}
                className="table-row cols-review-markers review-row"
              >
                <span className="checkbox-cell" onClick={(event) => event.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={selectedIds.has(record.id)}
                    onChange={() => toggleSelect(record.id)}
                  />
                </span>
                <span onClick={() => navigate(`/markers/${record.id}`)}>{record.id}</span>
                <span onClick={() => navigate(`/markers/${record.id}`)}>
                  <span className="review-type-badge marker">{record.markerType}</span>
                </span>
                <span className="review-main" onClick={() => navigate(`/markers/${record.id}`)}>
                  <strong>{record.title}</strong>
                  <em>{record.description}</em>
                </span>
                <span onClick={() => navigate(`/markers/${record.id}`)}>{record.submitter}</span>
                <span onClick={() => navigate(`/markers/${record.id}`)}>{formatDate(record.submittedAt)}</span>
                <span className="review-actions" onClick={(event) => event.stopPropagation()}>
                  <button type="button" className="inline-button action-view" onClick={() => navigate(`/markers/${record.id}`)}>
                    <ButtonIcon type="view" />
                    <span>查看</span>
                  </button>
                </span>
              </div>
            ))}
          </div>
        </div>
      </ListShell>
      <ExportFormatModal
        open={exportOpen}
        onClose={() => { setExportOpen(false); setExportTarget(null); }}
        records={exportTarget?.records ?? []}
        moduleType="markers"
        label={exportTarget?.label ?? ""}
      />
    </div>
  );
}

export function MarkersDetailPage() {
  const { reviewId } = useParams();
  const navigate = useNavigate();
  const [records, setRecords] = useMarkerRecords();
  const record = records.find((item) => item.id === reviewId) ?? records[0];
  const [previewOpen, setPreviewOpen] = useState(false);
  const scrollAreaRef = useRef(null);

  useEffect(() => {
    setPreviewOpen(false);
  }, [record]);

  if (!record) return null;

  const persistReview = (nextStatus) => {
    const stamp = formatTimestamp();
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
          reviewComment: "",
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
          <button type="button" className="icon-back-button" onClick={() => navigate("/markers")} aria-label="返回">
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
              <ReviewInfoRow label="名称" value={record.title} />
              <ReviewInfoRow label="标签分类" value={record.markerCategory} />
              <ReviewInfoRow label="坐标点" value={(record.markerCoordinates ?? []).join(" / ")} multiline />
              <ReviewInfoRow label="备注" value={record.markerRemark} multiline />
              <ReviewInfoRow label="提交时间" value={formatDate(record.submittedAt)} />
              <div className="review-info-row review-info-row-image">
                <span>对应图片</span>
                <button type="button" className="review-image-preview" onClick={() => setPreviewOpen(true)}>
                  <img src={record.markerImage} alt={record.title} />
                  <strong>点击查看大图</strong>
                </button>
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

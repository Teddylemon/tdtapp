import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ListShell, Pagination, ButtonIcon } from "../../components";
import { formatDate, showToast } from "../../components/utils";
import {
  reviewStatusTone,
  compactReviewStatus,
  ReviewInfoRow,
  getReviewMapData,
  ReviewLeafletMap,
} from "../_shared/ReviewShared";
import ExportFormatModal from "../_shared/GeoExport";

const reviewStorageKey = "tdt-correction-review-state";

const correctionBaseRecords = [
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
    description: "用户申请将对象名称改为'雨水井巡检点南门点'。",
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
];

function readStoredReviewStates() {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(reviewStorageKey) ?? "{}");
  } catch {
    return {};
  }
}

function useCorrectionRecords() {
  const [records, setRecords] = useState(() => {
    const stored = readStoredReviewStates();
    return correctionBaseRecords.map((item) => ({
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

export function ReviewListPage() {
  const navigate = useNavigate();
  const [storedRecords] = useCorrectionRecords();
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
            <div className="table-row table-head cols-review-corrections">
              <span className="checkbox-cell">
                <input type="checkbox" checked={allPageSelected} onChange={toggleSelectAll} />
              </span>
              <span>编号</span>
              <span>纠错类型</span>
              <span>具体信息</span>
              <span>提交人</span>
              <span>提交时间</span>
              <span>操作</span>
            </div>
            {pagedRecords.map((record) => (
              <div
                key={record.id}
                className="table-row cols-review-corrections review-row"
              >
                <span className="checkbox-cell" onClick={(event) => event.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={selectedIds.has(record.id)}
                    onChange={() => toggleSelect(record.id)}
                  />
                </span>
                <span onClick={() => navigate(`/review/${record.id}`)}>{record.id}</span>
                <span onClick={() => navigate(`/review/${record.id}`)}>
                  <span className="review-type-badge correction">{record.correctionType}</span>
                </span>
                <span className="review-main" onClick={() => navigate(`/review/${record.id}`)}>
                  <strong>{record.title}</strong>
                  <em>{record.description}</em>
                </span>
                <span onClick={() => navigate(`/review/${record.id}`)}>{record.submitter}</span>
                <span onClick={() => navigate(`/review/${record.id}`)}>{formatDate(record.submittedAt)}</span>
                <span className="review-actions" onClick={(event) => event.stopPropagation()}>
                  <button type="button" className="inline-button action-view" onClick={() => navigate(`/review/${record.id}`)}>
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
        moduleType="corrections"
        label={exportTarget?.label ?? ""}
      />
    </div>
  );
}

export function ReviewDetailPage() {
  const { reviewId } = useParams();
  const navigate = useNavigate();
  const [records] = useCorrectionRecords();
  const record = records.find((item) => item.id === reviewId) ?? records[0];
  const scrollAreaRef = useRef(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = 0;
    }
  }, [record]);

  if (!record) return null;

  const mapData = getReviewMapData(record);

  return (
    <div className="page-content review-detail-page">
      <section className="review-detail-header">
        <div className="review-detail-heading">
          <button type="button" className="icon-back-button" onClick={() => navigate("/review")} aria-label="返回">
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
              <ReviewInfoRow label="提交时间" value={formatDate(record.submittedAt)} />
            </div>
          </div>
        </article>
      </section>
    </div>
  );
}

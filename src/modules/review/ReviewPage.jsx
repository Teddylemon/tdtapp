import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ListShell, Pagination, ButtonIcon } from "../../components";
import { formatDate, showToast } from "../../components/utils";
import { ReviewInfoRow, getReviewMapData, ReviewLeafletMap } from "../_shared/ReviewShared";
import ExportFormatModal from "../_shared/GeoExport";

const reviewPhotoModules = import.meta.glob("../../../imgs/*.{png,jpg,jpeg,webp}", {
  eager: true,
  import: "default",
});

const reviewPhotoMap = Object.fromEntries(
  Object.entries(reviewPhotoModules).map(([filePath, url]) => [
    filePath.split("/").pop().replace(/\.(png|jpe?g|webp)$/i, ""),
    url,
  ]),
);

const reviewStorageKey = "tdt-correction-review-state";

function buildPhotoImages(count) {
  const sources = [reviewPhotoMap.biaohui, reviewPhotoMap.hubei, reviewPhotoMap.biaohui].filter(Boolean);
  return sources.slice(0, count);
}

const correctionBaseRecords = [
  {
    id: "RV-2031",
    module: "corrections",
    category: "纠错数据",
    title: "云栖会展中心东入口",
    description: "新增地点申请：地名地址与兴趣点，补充云栖路东入口点位。",
    submitter: "张可",
    submittedAt: "2026-05-15 09:42",
    area: "西湖区",
    status: "待审核",
    source: "移动端纠错",
    correctionType: "新增地点",
    placeName: "云栖会展中心东入口",
    locationCoordinate: "30.2096, 120.0861",
    locationCoordinateLabel: "30.2096, 120.0861",
    address: "杭州市西湖区云栖路 188 号",
    adCode: "330106",
    categoryName: "地名地址与兴趣点",
    photoSummary: "已上传 1 张现场照片",
    photoImages: buildPhotoImages(1),
    phone: "18271462115",
    postalCode: "310008",
    note: "入口新启用，建议尽快补充到在线地图展示。",
    reviewedAt: "-",
    platformUpdatedAt: "-",
    reviewComment: "",
  },
  {
    id: "RV-2027",
    module: "corrections",
    category: "纠错数据",
    title: "城西市民驿站",
    description: "新增地点申请：居民服务，补充社区驿站新点位。",
    submitter: "黄静",
    submittedAt: "2026-05-15 08:26",
    area: "拱墅区",
    status: "审核通过待更新",
    source: "移动端纠错",
    correctionType: "新增地点",
    placeName: "城西市民驿站",
    locationCoordinate: "30.3128, 120.1389",
    locationCoordinateLabel: "30.3128, 120.1389",
    address: "杭州市拱墅区和睦路 62 号",
    adCode: "330105",
    categoryName: "居民服务",
    photoSummary: "已上传 2 张现场照片",
    photoImages: buildPhotoImages(2),
    phone: "13858001126",
    postalCode: "310015",
    note: "社区新设便民驿站，附带门头照片和定位截图。",
    reviewedAt: "2026-05-15 10:18",
    platformUpdatedAt: "-",
    reviewComment: "资料完整，可同步到在线更新平台。",
  },
  {
    id: "RV-2024",
    module: "corrections",
    category: "纠错数据",
    title: "绿谷科创服务中心",
    description: "新增地点申请：科研及技术服务，补充园区服务中心。",
    submitter: "王澄",
    submittedAt: "2026-05-14 18:12",
    area: "滨江区",
    status: "审核不通过",
    source: "移动端纠错",
    correctionType: "新增地点",
    placeName: "绿谷科创服务中心",
    locationCoordinate: "30.1882, 120.2074",
    locationCoordinateLabel: "30.1882, 120.2074",
    address: "杭州市滨江区江晖路 701 号",
    adCode: "330108",
    categoryName: "科研及技术服务",
    photoSummary: "未上传现场照片",
    photoImages: [],
    phone: "13757192210",
    postalCode: "310051",
    note: "仅补充了文字描述，暂未上传现场拍照。",
    reviewedAt: "2026-05-15 09:06",
    platformUpdatedAt: "-",
    reviewComment: "缺少现场照片与权属依据，请补充后重新提交。",
  },
  {
    id: "RV-1998",
    module: "corrections",
    category: "纠错数据",
    title: "望湖停车服务点",
    description: "新增地点申请：公共设施，补充景区停车服务点。",
    submitter: "沈越",
    submittedAt: "2026-05-13 17:36",
    area: "上城区",
    status: "待审核",
    source: "移动端纠错",
    correctionType: "新增地点",
    placeName: "望湖停车服务点",
    locationCoordinate: "30.2417, 120.1718",
    locationCoordinateLabel: "30.2417, 120.1718",
    address: "杭州市上城区望江东路 211 号",
    adCode: "330102",
    categoryName: "公共设施",
    photoSummary: "已上传 1 张现场照片",
    photoImages: buildPhotoImages(1),
    phone: "13968052211",
    postalCode: "310002",
    note: "现场新增停车场引导服务点，方便游客导航检索。",
    reviewedAt: "-",
    platformUpdatedAt: "-",
    reviewComment: "",
  },
  {
    id: "RV-1991",
    module: "corrections",
    category: "纠错数据",
    title: "青山湖骑行补给站",
    description: "新增地点申请：运动、休闲，补充骑行补给服务点。",
    submitter: "朱茜",
    submittedAt: "2026-05-13 14:12",
    area: "临安区",
    status: "待审核",
    source: "移动端纠错",
    correctionType: "新增地点",
    placeName: "青山湖骑行补给站",
    locationCoordinate: "30.2524, 119.7395",
    locationCoordinateLabel: "30.2524, 119.7395",
    address: "杭州市临安区青山湖环湖绿道 3 号驿站",
    adCode: "330112",
    categoryName: "运动、休闲",
    photoSummary: "已上传 1 张现场照片",
    photoImages: buildPhotoImages(1),
    phone: "13666640815",
    postalCode: "311300",
    note: "骑行季新开放补给站，适合补充到兴趣点目录。",
    reviewedAt: "-",
    platformUpdatedAt: "-",
    reviewComment: "",
  },
  {
    id: "RV-1986",
    module: "corrections",
    category: "纠错数据",
    title: "双浦农事服务站",
    description: "新增地点申请：农林牧渔业，补充乡镇农事服务点。",
    submitter: "罗晨",
    submittedAt: "2026-05-13 11:28",
    area: "西湖区",
    status: "待审核",
    source: "移动端纠错",
    correctionType: "新增地点",
    placeName: "双浦农事服务站",
    locationCoordinate: "30.1238, 120.0616",
    locationCoordinateLabel: "30.1238, 120.0616",
    address: "杭州市西湖区双浦镇麦岭沙路 18 号",
    adCode: "330106",
    categoryName: "农林牧渔业",
    photoSummary: "已上传 3 张现场照片",
    photoImages: buildPhotoImages(3),
    phone: "13588412293",
    postalCode: "310024",
    note: "服务站已投入使用，可为周边农户提供农机与仓储服务。",
    reviewedAt: "-",
    platformUpdatedAt: "-",
    reviewComment: "",
  },
  {
    id: "RV-1982",
    module: "corrections",
    category: "纠错数据",
    title: "钱江新城金融服务中心",
    description: "新增地点申请：金融、保险，补充商务区服务中心。",
    submitter: "唐悦",
    submittedAt: "2026-05-13 09:54",
    area: "上城区",
    status: "审核通过待更新",
    source: "移动端纠错",
    correctionType: "新增地点",
    placeName: "钱江新城金融服务中心",
    locationCoordinate: "30.2435, 120.2267",
    locationCoordinateLabel: "30.2435, 120.2267",
    address: "杭州市上城区民心路 280 号",
    adCode: "330102",
    categoryName: "金融、保险",
    photoSummary: "已上传 2 张现场照片",
    photoImages: buildPhotoImages(2),
    phone: "18857161108",
    postalCode: "310020",
    note: "楼宇一层新增对外服务大厅，建议作为金融服务点展示。",
    reviewedAt: "2026-05-13 10:36",
    platformUpdatedAt: "-",
    reviewComment: "现场比对通过，待同步到在线更新平台。",
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

function getRecordSearchFields(record) {
  return [
    record.id,
    record.title,
    record.description,
    record.submitter,
    record.placeName,
    record.address,
    record.categoryName,
    record.phone,
    record.adCode,
  ].filter(Boolean);
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
      getRecordSearchFields(item).some((field) => String(field).toLowerCase().includes(keyword))
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
            placeholder="搜索编号、名称、地址、类别、电话或提交人"
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
              <span>{`导出选中${selectedIds.size > 0 ? ` (${selectedIds.size})` : ""}`}</span>
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
              <div key={record.id} className="table-row cols-review-corrections review-row">
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
                  <strong>{record.placeName}</strong>
                  <em>{`${record.categoryName} · ${record.address}`}</em>
                </span>
                <span onClick={() => navigate(`/review/${record.id}`)}>{record.submitter}</span>
                <span onClick={() => navigate(`/review/${record.id}`)}>{formatDate(record.submittedAt)}</span>
                <span className="review-actions" onClick={(event) => event.stopPropagation()}>
                  <button
                    type="button"
                    className="inline-button action-view"
                    onClick={() => navigate(`/review/${record.id}`)}
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
      <ExportFormatModal
        open={exportOpen}
        onClose={() => {
          setExportOpen(false);
          setExportTarget(null);
        }}
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
  const [previewIndex, setPreviewIndex] = useState(-1);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = 0;
    }
    setPreviewIndex(-1);
  }, [record]);

  if (!record) return null;

  const mapData = getReviewMapData(record);
  const photoImages = record.photoImages ?? [];
  const previewImage = previewIndex >= 0 ? photoImages[previewIndex] : "";

  return (
    <div className="page-content review-detail-page">
      <section className="review-detail-header">
        <div className="review-detail-heading">
          <button type="button" className="icon-back-button" onClick={() => navigate("/review")} aria-label="返回">
            <ButtonIcon type="back" />
          </button>
          <div className="review-detail-title">
            <h2>{record.title}</h2>
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
              <ReviewInfoRow label="名称" value={record.placeName} />
              <ReviewInfoRow label="位置坐标" value={record.locationCoordinateLabel ?? record.locationCoordinate} />
              <ReviewInfoRow label="地址" value={record.address} multiline />
              <ReviewInfoRow label="行政区编码" value={record.adCode} />
              <ReviewInfoRow label="所属类别" value={record.categoryName} />
              {photoImages.length > 0 ? (
                <div className="review-info-row review-info-row-image">
                  <span>现场拍照</span>
                  <button type="button" className="review-image-preview" onClick={() => setPreviewIndex(0)}>
                    <img src={photoImages[0]} alt={`${record.title} 现场照片`} />
                    <strong>{`${record.photoSummary}，点击查看照片`}</strong>
                  </button>
                </div>
              ) : (
                <ReviewInfoRow label="现场拍照" value={record.photoSummary} />
              )}
              <ReviewInfoRow label="电话" value={record.phone} />
              <ReviewInfoRow label="邮编" value={record.postalCode || "-"} />
              <ReviewInfoRow label="备注" value={record.note} multiline />
              <ReviewInfoRow label="提交时间" value={formatDate(record.submittedAt)} />
            </div>
          </div>
        </article>
      </section>

      {previewImage ? (
        <div className="image-lightbox" role="dialog" aria-modal="true" onClick={() => setPreviewIndex(-1)}>
          <div className="image-lightbox-inner" onClick={(event) => event.stopPropagation()}>
            <button type="button" className="image-lightbox-close" onClick={() => setPreviewIndex(-1)}>
              ×
            </button>
            <img src={previewImage} alt={`${record.title} 现场照片大图`} />
            {photoImages.length > 1 ? (
              <div className="image-lightbox-thumbs">
                {photoImages.map((image, index) => (
                  <button
                    key={`${record.id}-photo-${index}`}
                    type="button"
                    className={`image-lightbox-thumb ${previewIndex === index ? "is-active" : ""}`}
                    onClick={() => setPreviewIndex(index)}
                  >
                    <img src={image} alt={`${record.title} 现场照片 ${index + 1}`} />
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

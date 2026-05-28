import { useState } from "react";
import { showToast } from "../../components/utils";
import { exportGeoJSON, exportKML, exportKMZ, exportSHP, triggerDownload } from "./GeoFormats";

const FORMAT_OPTIONS = [
  { key: "geojson", name: "GeoJSON", desc: "通用地理数据格式", sync: true },
  { key: "kml", name: "KML", desc: "Google Earth / 地图", sync: true },
  { key: "kmz", name: "KMZ", desc: "压缩 KML 包", sync: false },
  { key: "shp", name: "SHP", desc: "Shapefile (GIS 标准)", sync: false },
];

const EXPORTERS = {
  geojson: exportGeoJSON,
  kml: exportKML,
  kmz: exportKMZ,
  shp: exportSHP,
};

const EXT_MAP = {
  geojson: "geojson",
  kml: "kml",
  kmz: "kmz",
  shp: "zip",
};

const LABEL_MAP = {
  geojson: "GeoJSON",
  kml: "KML",
  kmz: "KMZ",
  shp: "SHP",
};

export default function ExportFormatModal({ open, onClose, records, moduleType, label }) {
  const [loadingFormat, setLoadingFormat] = useState(null);

  if (!open) return null;

  const moduleLabel = moduleType === "corrections" ? "纠错反馈" : "标绘上传";
  const dateStr = new Date().toISOString().slice(0, 10);

  const handleExport = async (format) => {
    if (records.length === 0) {
      showToast("没有可导出的数据", "warning");
      return;
    }

    setLoadingFormat(format.key);

    try {
      const exporter = EXPORTERS[format.key];
      const blob = await exporter(records, moduleType);
      const filename = `${moduleLabel}_${label}_${dateStr}.${EXT_MAP[format.key]}`;
      triggerDownload(blob, filename);
      showToast(`已导出 ${records.length} 条数据（${LABEL_MAP[format.key]}）`, "success");
      onClose();
    } catch (err) {
      console.error("Export error:", err);
      showToast(`导出失败：${err.message}`, "error");
    } finally {
      setLoadingFormat(null);
    }
  };

  return (
    <div className="export-modal-overlay" onClick={onClose}>
      <div className="export-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="export-modal-header">
          <h3>选择导出格式</h3>
          <button type="button" className="export-modal-close" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="export-modal-body">
          {FORMAT_OPTIONS.map((format) => (
            <button
              key={format.key}
              type="button"
              className={`export-option ${loadingFormat === format.key ? "loading" : ""}`}
              onClick={() => handleExport(format)}
              disabled={loadingFormat !== null}
            >
              <span className="export-option-icon">
                {loadingFormat === format.key ? "..." : format.name}
              </span>
              <span className="export-option-name">{format.name}</span>
              <span className="export-option-desc">{format.desc}</span>
            </button>
          ))}
        </div>
        <div className="export-modal-footer">
          <button type="button" className="ghost-button slim-button" onClick={onClose}>
            取消
          </button>
        </div>
      </div>
    </div>
  );
}

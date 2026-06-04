import { useEffect } from "react";
import { MapContainer, TileLayer, CircleMarker, Polyline, Polygon, Popup, Tooltip, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { ButtonIcon } from "../../components";

export function reviewStatusTone(status) {
  if (status === "已更新到在线更新平台") return "success";
  if (status === "审核不通过") return "danger";
  if (status === "审核通过待更新") return "info";
  return "pending";
}

export function compactReviewStatus(status) {
  if (status === "审核通过待更新") return "待更新";
  if (status === "审核不通过") return "不通过";
  if (status === "已更新到在线更新平台") return "已更新";
  return "待审核";
}

export function ReviewInfoRow({ label, value, multiline = false }) {
  return (
    <div className={`review-info-row ${multiline ? "multiline" : ""}`}>
      <span>{label}</span>
      <strong>{value || "-"}</strong>
    </div>
  );
}

export function parseCoordinateText(text) {
  const [latText, lngText] = String(text ?? "")
    .split(",")
    .map((item) => item.trim());
  const lat = Number(latText);
  const lng = Number(lngText);
  if (Number.isFinite(lat) && Number.isFinite(lng)) return [lat, lng];
  return null;
}

export function getReviewMapData(record) {
  if (record.module === "markers") {
    const points = (record.markerCoordinates ?? []).map((item) => parseCoordinateText(item)).filter(Boolean);
    return {
      geometry: record.markerGeometry ?? "point",
      center: points[0] ?? [30.6031, 114.3148],
      points,
    };
  }

  const sourceCoordinates =
    record.correctionType === "新增地点" || record.locationCoordinate
      ? [record.locationCoordinate]
      : [record.currentCoordinate, record.nextCoordinate];

  const points = sourceCoordinates.filter(Boolean).map((item) => parseCoordinateText(item)).filter(Boolean);

  return {
    geometry: "correction",
    center: points[points.length - 1] ?? [30.6031, 114.3148],
    points,
  };
}

function ReviewMapResize() {
  const map = useMap();

  useEffect(() => {
    const id = window.requestAnimationFrame(() => {
      map.invalidateSize();
    });

    return () => window.cancelAnimationFrame(id);
  }, [map]);

  return null;
}

export function ReviewLeafletMap({ record, mapData }) {
  return (
    <div className="review-leaflet-shell">
      <MapContainer center={mapData.center} zoom={15} className="review-leaflet-map" scrollWheelZoom>
        <ReviewMapResize />
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {record.module === "corrections"
          ? mapData.points.map((point, index) => {
              const isNewPlace = record.correctionType === "新增地点";
              const pointLabel = isNewPlace ? "提交位置" : index === 0 ? "旧地点" : "新地点";

              return (
                <CircleMarker
                  key={`${record.id}-${index}`}
                  center={point}
                  radius={10}
                  pathOptions={{
                    color: "#27272a",
                    weight: 2,
                    fillColor: isNewPlace ? "#2563eb" : index === 0 ? "#9ca3af" : "#f0b44b",
                    fillOpacity: 0.92,
                  }}
                >
                  <Tooltip direction="top" offset={[0, -10]} permanent>
                    {pointLabel}
                  </Tooltip>
                  <Popup>
                    <strong>{record.title}</strong>
                    <div>{pointLabel}</div>
                  </Popup>
                </CircleMarker>
              );
            })
          : null}
        {record.module === "markers" && mapData.geometry === "point"
          ? mapData.points.map((point, index) => (
              <CircleMarker
                key={`${record.id}-${index}`}
                center={point}
                radius={10}
                pathOptions={{
                  color: "#27272a",
                  weight: 2,
                  fillColor: "#4f7fe0",
                  fillOpacity: 0.92,
                }}
              >
                <Popup>
                  <strong>{record.title}</strong>
                  <div>{record.markerType}</div>
                </Popup>
              </CircleMarker>
            ))
          : null}
        {record.module === "markers" && mapData.geometry === "line" ? (
          <Polyline positions={mapData.points} pathOptions={{ color: "#4f7fe0", weight: 5, opacity: 0.9 }} />
        ) : null}
        {record.module === "markers" && mapData.geometry === "polygon" ? (
          <Polygon
            positions={mapData.points}
            pathOptions={{ color: "#4f7fe0", weight: 3, fillColor: "#4f7fe0", fillOpacity: 0.18 }}
          />
        ) : null}
      </MapContainer>
    </div>
  );
}

export function ReviewThumbnail({ record }) {
  if (record.category === "用户标注" && record.markerImage) {
    return <img className="review-thumb-image" src={record.markerImage} alt={record.title} />;
  }

  return (
    <div className="review-thumb-correction">
      <div className="review-thumb-correction-grid" />
      <div className="review-thumb-correction-pin">
        <ButtonIcon type="marker" />
      </div>
      <span>{record.correctionType}</span>
    </div>
  );
}

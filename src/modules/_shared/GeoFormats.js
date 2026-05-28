function parseCoord(text) {
  const [latText, lngText] = String(text ?? "").split(",").map((s) => s.trim());
  const lat = Number(latText);
  const lng = Number(lngText);
  if (Number.isFinite(lat) && Number.isFinite(lng)) return [lat, lng];
  return null;
}

function coordToGeoJSON(text) {
  const parsed = parseCoord(text);
  if (!parsed) return null;
  return [parsed[1], parsed[0]]; // [lng, lat]
}

function correctionToFeatures(record) {
  const features = [];
  const baseProps = {
    id: record.id,
    title: record.title,
    description: record.description,
    correctionType: record.correctionType,
    currentName: record.currentName,
    currentAddress: record.currentAddress,
    submitter: record.submitter,
    submittedAt: record.submittedAt,
    area: record.area,
    status: record.status,
  };

  const current = coordToGeoJSON(record.currentCoordinate);
  if (current) {
    features.push({
      type: "Feature",
      geometry: { type: "Point", coordinates: current },
      properties: { ...baseProps, pointRole: "current" },
    });
  }

  if (record.nextCoordinate) {
    const next = coordToGeoJSON(record.nextCoordinate);
    if (next) {
      features.push({
        type: "Feature",
        geometry: { type: "Point", coordinates: next },
        properties: { ...baseProps, pointRole: "proposed" },
      });
    }
  }

  return features;
}

function markerToFeature(record) {
  const coords = (record.markerCoordinates ?? []).map(coordToGeoJSON).filter(Boolean);
  if (coords.length === 0) return null;

  const geoType = record.markerGeometry;
  let geometry;

  if (geoType === "line") {
    geometry = { type: "LineString", coordinates: coords };
  } else if (geoType === "polygon") {
    const ring = [...coords];
    if (ring.length > 0 && (ring[0][0] !== ring[ring.length - 1][0] || ring[0][1] !== ring[ring.length - 1][1])) {
      ring.push([...ring[0]]);
    }
    geometry = { type: "Polygon", coordinates: [ring] };
  } else {
    geometry = { type: "Point", coordinates: coords[0] };
  }

  return {
    type: "Feature",
    geometry,
    properties: {
      id: record.id,
      title: record.title,
      description: record.description,
      markerType: record.markerType,
      markerCategory: record.markerCategory,
      markerRemark: record.markerRemark,
      markerGeometry: record.markerGeometry,
      submitter: record.submitter,
      submittedAt: record.submittedAt,
      area: record.area,
      status: record.status,
    },
  };
}

export function recordsToGeoJSON(records, moduleType) {
  const features = [];
  for (const record of records) {
    if (moduleType === "corrections") {
      features.push(...correctionToFeatures(record));
    } else {
      const f = markerToFeature(record);
      if (f) features.push(f);
    }
  }
  return { type: "FeatureCollection", features };
}

export function exportGeoJSON(records, moduleType) {
  const geojson = recordsToGeoJSON(records, moduleType);
  const json = JSON.stringify(geojson, null, 2);
  return new Blob([json], { type: "application/geo+json" });
}

function escXml(str) {
  return String(str ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function kmlCoordStr(coord) {
  return `${coord[0]},${coord[1]},0`;
}

function featureToKmlPlacemark(feature) {
  const p = feature.properties;
  const name = escXml(p.title || p.id);
  const desc = escXml(
    Object.entries(p)
      .filter(([, v]) => v != null && v !== "")
      .map(([k, v]) => `${k}: ${v}`)
      .join("\n"),
  );

  let geomXml = "";
  const g = feature.geometry;

  if (g.type === "Point") {
    geomXml = `<Point><coordinates>${kmlCoordStr(g.coordinates)}</coordinates></Point>`;
  } else if (g.type === "LineString") {
    geomXml = `<LineString><coordinates>${g.coordinates.map(kmlCoordStr).join(" ")}</coordinates></LineString>`;
  } else if (g.type === "Polygon") {
    const outer = g.coordinates[0];
    geomXml = `<Polygon><outerBoundaryIs><LinearRing><coordinates>${outer.map(kmlCoordStr).join(" ")}</coordinates></LinearRing></outerBoundaryIs></Polygon>`;
  }

  return `  <Placemark>\n    <name>${name}</name>\n    <description>${desc}</description>\n    ${geomXml}\n  </Placemark>`;
}

export function exportKML(records, moduleType) {
  const fc = recordsToGeoJSON(records, moduleType);
  const placemarks = fc.features.map(featureToKmlPlacemark).join("\n");
  const kml = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
<Document>
  <name>${moduleType === "corrections" ? "纠错反馈" : "标绘上传"}</name>
${placemarks}
</Document>
</kml>`;
  return new Blob([kml], { type: "application/vnd.google-earth.kml+xml" });
}

export async function exportKMZ(records, moduleType) {
  const kmlBlob = exportKML(records, moduleType);
  const kmlText = await kmlBlob.text();
  const JSZip = (await import("jszip")).default;
  const zip = new JSZip();
  zip.file("doc.kml", kmlText);
  return zip.generateAsync({ type: "blob", mimeType: "application/vnd.google-earth.kmz" });
}

export async function exportSHP(records, moduleType) {
  const geojson = recordsToGeoJSON(records, moduleType);
  if (geojson.features.length === 0) {
    throw new Error("没有可导出的几何数据");
  }
  const shpwrite = await import("@mapbox/shp-write");
  const blob = await shpwrite.zip(geojson, { outputType: "blob" });
  return blob;
}

export function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

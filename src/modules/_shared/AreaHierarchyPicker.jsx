import { useEffect, useMemo, useState } from "react";
import {
  ALL_COUNTIES,
  PROVINCE_NAME,
  buildAreaKey,
  parseAreaKey,
  toggleAreaSelection,
  toggleAreaSelectionWithChildren,
} from "./areaTree";
import "./SelectionWidgets.css";

function formatAreaChip(areaKey) {
  const { city, county } = parseAreaKey(areaKey);
  return county === ALL_COUNTIES ? `${city} / 全市` : `${city} / ${county}`;
}

function getCitySelectionCount(value, city, getCountyOptions) {
  const selected = value.filter((areaKey) => parseAreaKey(areaKey).city === city);
  if (selected.some((areaKey) => parseAreaKey(areaKey).county === ALL_COUNTIES)) {
    return getCountyOptions(city).length;
  }
  return selected.length;
}

export default function AreaHierarchyPicker({
  cityOptions,
  getCountyOptions,
  value,
  onChange,
  provinceName = PROVINCE_NAME,
}) {
  const [activeCity, setActiveCity] = useState(cityOptions[0] ?? "");

  useEffect(() => {
    if (cityOptions.includes(activeCity)) return;
    setActiveCity(cityOptions[0] ?? "");
  }, [activeCity, cityOptions]);

  useEffect(() => {
    const selectedCity = value.map((areaKey) => parseAreaKey(areaKey).city).find(Boolean);
    if (selectedCity && cityOptions.includes(selectedCity)) {
      setActiveCity(selectedCity);
    }
  }, [cityOptions, value]);

  const countyOptions = useMemo(
    () => (activeCity ? getCountyOptions(activeCity) : []),
    [activeCity, getCountyOptions],
  );

  const activeCityAllKey = activeCity ? buildAreaKey(activeCity, ALL_COUNTIES) : "";
  const activeCitySelected = activeCityAllKey ? value.includes(activeCityAllKey) : false;

  return (
    <div className="hierarchy-picker">
      <div className="hierarchy-picker-top">
        {value.length ? (
          value.map((areaKey) => (
            <span key={areaKey} className="hierarchy-picker-chip">
              {formatAreaChip(areaKey)}
            </span>
          ))
        ) : (
          <span className="hierarchy-picker-empty">暂未选择下发区域</span>
        )}
      </div>

      <div className="hierarchy-picker-shell">
        <div className="hierarchy-picker-city-list">
          {cityOptions.map((city) => {
            const count = getCitySelectionCount(value, city, getCountyOptions);
            const active = city === activeCity;

            return (
              <button
                key={city}
                type="button"
                className={`hierarchy-picker-city-button ${active ? "active" : ""}`}
                onClick={() => setActiveCity(city)}
              >
                <div className="hierarchy-picker-city-main">
                  <strong>{city}</strong>
                  <span>{count ? `已选 ${count} 个区县` : "点击查看市县区"}</span>
                </div>
                {count ? (
                  <span className="hierarchy-picker-count-badge">{count}</span>
                ) : (
                  <span className="hierarchy-picker-city-arrow">›</span>
                )}
              </button>
            );
          })}
        </div>

        <div className="hierarchy-picker-county-panel">
          <div className="hierarchy-picker-county-list">
            {activeCity ? (
              <button
                type="button"
                className={`hierarchy-picker-county-button ${activeCitySelected ? "active" : ""}`}
                onClick={() => onChange(toggleAreaSelectionWithChildren(value, activeCityAllKey, getCountyOptions))}
              >
                <div className={`hierarchy-picker-check ${activeCitySelected ? "active" : ""}`} aria-hidden="true" />
                <div className="hierarchy-picker-county-main">
                  <strong>{activeCity}全市</strong>
                </div>
              </button>
            ) : null}

            {countyOptions.map((county) => {
              const areaKey = buildAreaKey(activeCity, county);
              const active = value.includes(areaKey);

              return (
                <button
                  key={areaKey}
                  type="button"
                  className={`hierarchy-picker-county-button ${active ? "active" : ""}`}
                  onClick={() => onChange(toggleAreaSelection(value, areaKey))}
                >
                  <div className={`hierarchy-picker-check ${active ? "active" : ""}`} aria-hidden="true" />
                  <div className="hierarchy-picker-county-main">
                    <strong>{county}</strong>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

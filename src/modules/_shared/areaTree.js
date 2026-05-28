import { ALL_COUNTIES, PROVINCE_NAME } from "./userDirectory";

export { ALL_COUNTIES, PROVINCE_NAME };

export function buildAreaKey(city, county) {
  return `${city}::${county}`;
}

export function parseAreaKey(areaKey) {
  const [city = "", county = ""] = areaKey.split("::");
  return { city, county };
}

export function getAreaLabel(areaKey, provinceName = PROVINCE_NAME) {
  const { city, county } = parseAreaKey(areaKey);
  return `${provinceName} / ${city} / ${county}`;
}

export function getSelectedCitiesFromAreaKeys(areaKeys) {
  return Array.from(new Set(areaKeys.map((areaKey) => parseAreaKey(areaKey).city).filter(Boolean)));
}

export function toggleAreaSelection(currentAreaKeys, nextAreaKey) {
  const exists = currentAreaKeys.includes(nextAreaKey);
  const { city, county } = parseAreaKey(nextAreaKey);

  if (exists) {
    if (county === ALL_COUNTIES) {
      return currentAreaKeys.filter((item) => parseAreaKey(item).city !== city);
    }

    return currentAreaKeys.filter(
      (item) => item !== nextAreaKey && !(parseAreaKey(item).city === city && parseAreaKey(item).county === ALL_COUNTIES),
    );
  }

  if (county === ALL_COUNTIES) {
    return [...currentAreaKeys.filter((item) => parseAreaKey(item).city !== city), nextAreaKey];
  }

  return [
    ...currentAreaKeys.filter(
      (item) => !(parseAreaKey(item).city === city && parseAreaKey(item).county === ALL_COUNTIES),
    ),
    nextAreaKey,
  ];
}

export function toggleAreaSelectionWithChildren(currentAreaKeys, nextAreaKey, getCountyOptions) {
  const { city, county } = parseAreaKey(nextAreaKey);

  if (county !== ALL_COUNTIES) {
    return toggleAreaSelection(currentAreaKeys, nextAreaKey);
  }

  const countyKeys = (getCountyOptions(city) ?? []).map((countyName) => buildAreaKey(city, countyName));
  const scopedKeys = [nextAreaKey, ...countyKeys];
  const hasAllSelected = scopedKeys.every((key) => currentAreaKeys.includes(key));

  if (hasAllSelected) {
    return currentAreaKeys.filter((item) => parseAreaKey(item).city !== city);
  }

  const remaining = currentAreaKeys.filter((item) => parseAreaKey(item).city !== city);
  return [...remaining, ...scopedKeys];
}

export function getAreaSelectionCount(areaKeys, city) {
  return areaKeys.filter((item) => parseAreaKey(item).city === city).length;
}

import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ButtonIcon,
  FilterSelect,
  InfoField,
  ListShell,
  Pagination,
} from "../../components";
import { formatDate, formatTimestamp, showToast } from "../../components/utils";
import AreaHierarchyPicker from "../_shared/AreaHierarchyPicker";
import UserTransferModal from "../_shared/UserTransferModal";
import {
  buildAreaKey,
  getAreaLabel,
  getSelectedCitiesFromAreaKeys,
  parseAreaKey,
} from "../_shared/areaTree";
import {
  ALL_COUNTIES,
  PROVINCE_NAME,
  getAreaText,
  getCityOptions,
  getCountyOptions,
  readUserRecords,
} from "../_shared/userDirectory";
import { MapContainer, TileLayer, CircleMarker, Popup, Tooltip, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import {
  PieChart, Pie, Cell, Tooltip as RechartsTooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer,
  AreaChart, Area,
} from "recharts";
import "./tasks.css";

const storageKey = "tdt-task-dispatch-state-v6";

const TASK_STATUS = {
  DRAFT: "草稿",
  DISPATCHED: "已下发",
  IN_PROGRESS: "核查中",
  DONE: "已完成",
};

const statusOptions = Object.values(TASK_STATUS);

const cityCodeMap = {
  武汉市: "4201",
  宜昌市: "4205",
  襄阳市: "4206",
  鄂州市: "4207",
};

function summarizeAreaKeys(areaKeys) {
  if (!areaKeys.length) return "-";
  if (areaKeys.length <= 2) return areaKeys.map(getAreaLabel).join("；");
  return `${areaKeys.slice(0, 2).map(getAreaLabel).join("；")} 等 ${areaKeys.length} 个区域`;
}

function summarizeNames(users) {
  if (!users.length) return "-";
  if (users.length <= 2) return users.map((user) => user.nickname).join("、");
  return `${users.slice(0, 2).map((user) => user.nickname).join("、")} 等 ${users.length} 人`;
}

function formatFileSize(size) {
  if (!size) return "0 KB";
  if (size >= 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(size / 1024))} KB`;
}

function estimatePlotCountFromSourceFiles(files, areaCount) {
  if (!files.length) return 0;
  return files.reduce((sum, file, index) => {
    const base = Math.max(18, Math.round((file.size || 0) / 1024 / 80));
    return sum + base + areaCount * 4 + index * 2;
  }, 0);
}

function createSourceFileRecord(file, areaCount) {
  return {
    id: `${file.name}-${file.size}-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
    name: file.name,
    size: file.size,
    sizeLabel: formatFileSize(file.size),
    plotCount: Math.max(18, Math.round((file.size || 0) / 1024 / 80) + areaCount * 4),
  };
}

function createMockSourceFiles() {
  const ts = Date.now();
  return [
    { id: `mock-01-${ts}`, name: "武汉市2026年5月卫星遥感变化图斑.shp", size: 215040, sizeLabel: "210 KB", plotCount: 48 },
  ];
}

function summarizeSourceFiles(sourceFiles) {
  if (!sourceFiles.length) return "-";
  if (sourceFiles.length === 1) return `${sourceFiles[0].name} · ${sourceFiles[0].plotCount} 个图斑`;
  const totalPlots = sourceFiles.reduce((sum, item) => sum + item.plotCount, 0);
  return `${sourceFiles.length} 个 SHP 文件 · ${totalPlots} 个图斑`;
}

function getProgressPercent(completedPlots, plotCount) {
  if (!plotCount) return 0;
  return Math.min(100, Math.round((completedPlots / plotCount) * 100));
}

function getTaskProgressSummary(task) {
  const remaining = Math.max(task.plotCount - task.completedPlots, 0);
  const progressPercent = getProgressPercent(task.completedPlots, task.plotCount);
  return {
    countText: `${task.completedPlots} / ${task.plotCount}`,
    percentText: `${progressPercent}%`,
    progressPercent,
    remaining,
  };
}

function getMockInProgressCompletedPlots(plotCount, seedText) {
  if (!plotCount) return 0;
  if (plotCount === 1) return 1;

  const seed = Array.from(seedText || "").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const percent = 30 + (seed % 41);
  return Math.min(plotCount - 1, Math.max(1, Math.round((plotCount * percent) / 100)));
}

function normalizeTaskStatus(status, completedPlots, plotCount) {
  if (statusOptions.includes(status)) return status;

  if (["待市级分派", "待分派", "待核查"].includes(status)) {
    return TASK_STATUS.DISPATCHED;
  }

  if (["已提交待更新", "待更新平台", "已回传待更新"].includes(status)) {
    return completedPlots >= plotCount ? TASK_STATUS.DONE : TASK_STATUS.IN_PROGRESS;
  }

  if (status === "已提交") {
    return completedPlots >= plotCount ? TASK_STATUS.DONE : TASK_STATUS.IN_PROGRESS;
  }

  return TASK_STATUS.DRAFT;
}

function normalizeCompletedPlots(task, normalizedStatus) {
  if (normalizedStatus === TASK_STATUS.DRAFT || normalizedStatus === TASK_STATUS.DISPATCHED) return 0;
  if (normalizedStatus === TASK_STATUS.DONE) return task.plotCount;

  if (task.completedPlots > 0 && task.completedPlots < task.plotCount) {
    return task.completedPlots;
  }

  return getMockInProgressCompletedPlots(task.plotCount, task.id);
}

function distributeCompletedPlots(inspectors, totalCompleted) {
  if (!inspectors.length) return [];

  const totalPlots = inspectors.reduce((sum, inspector) => sum + inspector.plots, 0);
  if (!totalPlots || totalCompleted <= 0) {
    return inspectors.map(() => 0);
  }

  if (totalCompleted >= totalPlots) {
    return inspectors.map((inspector) => inspector.plots);
  }

  const allocations = inspectors.map((inspector) => Math.min(inspector.plots, Math.floor((totalCompleted * inspector.plots) / totalPlots)));
  let assigned = allocations.reduce((sum, completed) => sum + completed, 0);
  let cursor = 0;

  while (assigned < totalCompleted) {
    const index = cursor % inspectors.length;
    if (allocations[index] < inspectors[index].plots) {
      allocations[index] += 1;
      assigned += 1;
    }
    cursor += 1;
  }

  return allocations;
}

function normalizeInspectors(inspectors, normalizedStatus, completedPlots) {
  const completedByInspector = distributeCompletedPlots(inspectors, completedPlots);

  return inspectors.map((inspector, index) => {
    if (normalizedStatus === TASK_STATUS.DRAFT) {
      return { ...inspector, completed: 0, status: "待接收" };
    }

    if (normalizedStatus === TASK_STATUS.DISPATCHED) {
      return { ...inspector, completed: 0, status: "待核查" };
    }

    if (normalizedStatus === TASK_STATUS.DONE) {
      return { ...inspector, completed: inspector.plots, status: "已完成" };
    }

    const completed = Math.min(inspector.plots, completedByInspector[index] ?? 0);
    return {
      ...inspector,
      completed,
      status: completed <= 0 ? "待核查" : completed >= inspector.plots ? "已提交" : "核查中",
    };
  });
}

function normalizePlots(plots, normalizedStatus) {
  const plotStatus =
    normalizedStatus === TASK_STATUS.DRAFT
      ? TASK_STATUS.DRAFT
      : normalizedStatus === TASK_STATUS.DISPATCHED
        ? "待核查"
        : normalizedStatus === TASK_STATUS.IN_PROGRESS
          ? "核查中"
          : "已完成";

  return plots.map((plot) => ({ ...plot, status: plotStatus }));
}

function buildTaskProgressNote(status, completedPlots, plotCount) {
  if (status === TASK_STATUS.DRAFT) {
    return "任务草稿已生成，已绑定下发区域、SHP 图斑来源和执行人员。";
  }

  if (status === TASK_STATUS.DISPATCHED) {
    return "任务已下发至执行用户，等待开始核查。";
  }

  if (status === TASK_STATUS.IN_PROGRESS) {
    return `执行用户正在核查中，已完成 ${completedPlots} / ${plotCount} 个图斑。`;
  }

  return "核查结果已统一回写图斑库，任务链路已闭环。";
}

function normalizeTaskRecord(task) {
  const normalizedStatus = normalizeTaskStatus(task.status, task.completedPlots, task.plotCount);
  const completedPlots = normalizeCompletedPlots(task, normalizedStatus);
  const inspectors = normalizeInspectors(task.inspectors || [], normalizedStatus, completedPlots);
  const plots = normalizePlots(task.plots || [], normalizedStatus);
  const managerNames = task.managerNames || [];
  const assigneeCount = inspectors.length || task.assigneeCount || 0;

  return {
    ...task,
    status: normalizedStatus,
    completedPlots,
    submittedAt: normalizedStatus === TASK_STATUS.DONE ? task.submittedAt : "-",
    platformUpdatedAt: normalizedStatus === TASK_STATUS.DONE ? task.platformUpdatedAt : "-",
    progressNote: buildTaskProgressNote(normalizedStatus, completedPlots, task.plotCount),
    cityAssignments: buildCityAssignments({
      status: normalizedStatus,
      managerNames,
      assigneeCount,
      plotCount: task.plotCount,
      completedPlots,
      targetAreaSummary: task.targetAreaSummary,
    }),
    inspectors,
    plots,
  };
}

function getManagersForAreas(users, selectedAreaKeys) {
  const selectedCities = new Set(getSelectedCitiesFromAreaKeys(selectedAreaKeys));
  return users.filter((user) => selectedCities.has(user.city) && user.role === "市级管理员");
}

function getInspectorsForAreas(users, selectedAreaKeys) {
  if (!selectedAreaKeys.length) return [];

  return users.filter((user) => {
    if (!["市级职员", "县级职员"].includes(user.role)) return false;

    return selectedAreaKeys.some((areaKey) => {
      const { city, county } = parseAreaKey(areaKey);
      if (user.city !== city) return false;
      if (county === ALL_COUNTIES) return true;
      if (user.role === "市级职员") return true;
      return user.county === county;
    });
  });
}

function buildCityAssignments({
  status,
  managerNames,
  assigneeCount,
  plotCount,
  completedPlots,
  targetAreaSummary,
}) {
  const managerSummary = managerNames.length ? summarizeNames(managerNames.map((name) => ({ nickname: name }))) : "-";
  const inspectorSummary = assigneeCount > 0 ? `${assigneeCount} 名执行用户` : "未指定执行用户";

  return [
    {
      role: "省级建包",
      owner: "省级任务中心",
      status: status === TASK_STATUS.DRAFT ? "草稿" : "已创建",
      note:
        status === TASK_STATUS.DRAFT
          ? "区域、SHP 来源和指派关系已配置，等待正式下发"
          : `任务包已锁定，覆盖 ${targetAreaSummary}`,
    },
    {
      role: "市级管理员",
      owner: managerSummary,
      status: status === TASK_STATUS.DRAFT ? "待下发" : "已接收",
      note:
        status === TASK_STATUS.DRAFT
          ? "草稿阶段已预设承接管理员"
          : `已完成市级统筹，关联 ${inspectorSummary}`,
    },
    {
      role: "执行用户",
      owner: inspectorSummary,
      status:
        status === TASK_STATUS.DRAFT
          ? "未下发"
          : status === TASK_STATUS.DISPATCHED
            ? "待核查"
            : status === TASK_STATUS.IN_PROGRESS
              ? "核查中"
              : "已完成",
      note:
        status === TASK_STATUS.DRAFT
          ? `待下发后接收图斑，预计核查 ${plotCount} 个图斑`
          : status === TASK_STATUS.DISPATCHED
            ? "任务已下发，等待执行用户开始核查"
            : status === TASK_STATUS.IN_PROGRESS
              ? `${completedPlots} / ${plotCount} 个图斑已完成核查`
              : `${completedPlots} / ${plotCount} 个图斑已核查`,
    },
    {
      role: "平台回写",
      owner: "省级任务中心",
      status: status === TASK_STATUS.DONE ? "已更新" : "未开始",
      note:
        status === TASK_STATUS.DONE
          ? "平台图斑状态与核查结论已同步"
          : "核查完成后统一回写图斑库",
    },
  ];
}

function taskStatusTone(status) {
  if (status === TASK_STATUS.DONE) return "success";
  if (status === TASK_STATUS.IN_PROGRESS) return "info";
  if (status === TASK_STATUS.DISPATCHED) return "pending";
  return "muted";
}

function assignmentTone(status) {
  if (["已创建", "已接收", "已提交", "已更新"].includes(status)) return "success";
  if (status === "核查中") return "info";
  if (status.startsWith("待") || status.startsWith("未")) return "pending";
  return "muted";
}

function inspectorTone(status) {
  if (["已提交", "已完成"].includes(status)) return "success";
  if (["核查中", "待核查"].includes(status)) return "info";
  return "muted";
}

function buildSamplePlots({ selectedAreaKeys, plotCount, inspectors, status }) {
  const [firstArea] = selectedAreaKeys;
  const { city } = parseAreaKey(firstArea || "");
  const cityCode = cityCodeMap[city] ?? "4200";
  const areaLabels = selectedAreaKeys.map((item) => {
    const { city: areaCity, county } = parseAreaKey(item);
    return county === ALL_COUNTIES ? `${areaCity}全域` : `${county}`;
  });

  const plotNames = [
    `${areaLabels[0] || "重点区域"}新增建设图斑`,
    `${areaLabels[1] || areaLabels[0] || "重点区域"}疑似占地图斑`,
    `${areaLabels[2] || areaLabels[0] || "重点区域"}变化核查图斑`,
  ];

  return Array.from({ length: Math.min(plotCount, 3) }, (_, index) => ({
    id: `TB-${cityCode}-${String(index + 31).padStart(3, "0")}`,
    name: plotNames[index] || `${city || "任务"}图斑样例 ${index + 1}`,
    status,
    owner: inspectors[index % Math.max(inspectors.length, 1)]?.name ?? "-",
  }));
}

function createTaskFromDraft(draft, users, submitMode = "draft") {
  const selectedManagers = users.filter((user) => draft.managerIds.includes(user.id));
  const selectedInspectors = users.filter((user) => draft.inspectorIds.includes(user.id));
  const plotCount = draft.sourceFiles.reduce((sum, file) => sum + file.plotCount, 0);
  const plotAllocations = draft.plotAllocations || {};
  const isDispatchMode = submitMode === "dispatch";
  const inspectorAssignments = selectedInspectors.map((user, index) => ({
    id: user.id,
    name: user.nickname,
    county: user.county,
    role: user.role,
    plots: plotAllocations[user.id] || (Math.floor(plotCount / selectedInspectors.length) + (index < (plotCount % selectedInspectors.length) ? 1 : 0)),
    completed: 0,
    status: isDispatchMode ? "待核查" : "待接收",
  }));
  const nextId = `TASK-${String(Date.now()).slice(-6)}`;
  const targetAreaSummary = summarizeAreaKeys(draft.selectedAreaKeys);
  const managerNames = selectedManagers.map((user) => user.nickname);
  const nextStatus = isDispatchMode ? TASK_STATUS.DISPATCHED : TASK_STATUS.DRAFT;
  const dispatchedAt = isDispatchMode ? formatTimestamp(new Date()) : "-";

  return {
    id: nextId,
    title: draft.title.trim(),
    description:
      draft.description.trim() ||
      `省级统一下发图斑核查任务，覆盖 ${targetAreaSummary}，由市级管理员承接后再分派给个人执行用户。`,
    sourceLevel: "省级下发",
    targetAreas: draft.selectedAreaKeys,
    targetAreaSummary,
    targetCities: getSelectedCitiesFromAreaKeys(draft.selectedAreaKeys),
    sourceFiles: draft.sourceFiles,
    sourceSummary: summarizeSourceFiles(draft.sourceFiles),
    managerIds: draft.managerIds,
    managerNames,
    managerSummary: summarizeNames(selectedManagers),
    plotCount,
    completedPlots: 0,
    assigneeCount: selectedInspectors.length,
    deadline: draft.deadline.replace("T", " "),
    status: nextStatus,
    createdAt: formatTimestamp(new Date()),
    dispatchedAt,
    submittedAt: "-",
    platformUpdatedAt: "-",
    requirement:
      draft.requirement.trim() ||
      "执行用户需逐图斑完成现场核查，填写核查结论、现场说明、定位信息，并上传佐证照片后统一提交。",
    progressNote: buildTaskProgressNote(nextStatus, 0, plotCount),
    cityAssignments: buildCityAssignments({
      status: nextStatus,
      managerNames,
      assigneeCount: selectedInspectors.length,
      plotCount,
      completedPlots: 0,
      targetAreaSummary,
    }),
    inspectors: inspectorAssignments,
    plots: buildSamplePlots({
      selectedAreaKeys: draft.selectedAreaKeys,
      plotCount,
      inspectors: inspectorAssignments,
      status: isDispatchMode ? "待核查" : TASK_STATUS.DRAFT,
    }),
  };
}

function createSeedTask(config, users) {
  const managers = users.filter((user) => config.managerIds.includes(user.id));
  const inspectorAssignments = config.inspectors.map((item) => {
    const user = users.find((userRecord) => userRecord.id === item.id);
    return user
      ? {
          id: user.id,
          name: user.nickname,
          county: user.county,
          role: user.role,
          plots: item.plots,
          completed: item.completed,
          status: item.status,
        }
      : null;
  }).filter(Boolean);

  return {
    id: config.id,
    title: config.title,
    description: config.description,
    sourceLevel: "省级下发",
    targetAreas: config.targetAreas,
    targetAreaSummary: summarizeAreaKeys(config.targetAreas),
    targetCities: getSelectedCitiesFromAreaKeys(config.targetAreas),
    sourceFiles: config.sourceFiles,
    sourceSummary: summarizeSourceFiles(config.sourceFiles),
    managerIds: config.managerIds,
    managerNames: managers.map((user) => user.nickname),
    managerSummary: summarizeNames(managers),
    plotCount: config.plotCount,
    completedPlots: config.completedPlots,
    assigneeCount: inspectorAssignments.length,
    deadline: config.deadline,
    status: config.status,
    createdAt: config.createdAt,
    dispatchedAt: config.dispatchedAt,
    submittedAt: config.submittedAt,
    platformUpdatedAt: config.platformUpdatedAt,
    requirement: config.requirement,
    progressNote: config.progressNote,
    cityAssignments: buildCityAssignments({
      status: config.status,
      managerNames: managers.map((user) => user.nickname),
      assigneeCount: inspectorAssignments.length,
      plotCount: config.plotCount,
      completedPlots: config.completedPlots,
      targetAreaSummary: summarizeAreaKeys(config.targetAreas),
    }),
    inspectors: inspectorAssignments,
    plots: buildSamplePlots({
      selectedAreaKeys: config.targetAreas,
      plotCount: config.plotCount,
      inspectors: inspectorAssignments,
      status:
        config.status === TASK_STATUS.DRAFT
          ? TASK_STATUS.DRAFT
          : config.status === TASK_STATUS.DISPATCHED
            ? "待核查"
            : config.status === TASK_STATUS.IN_PROGRESS
              ? "核查中"
              : "已完成",
    }),
  };
}

function buildInitialTasks(users) {
  return [
    createSeedTask(
      {
        id: "TASK-001",
        title: "武汉市 5 月疑似变化图斑核查",
        description:
          "省级统一下发武汉市疑似变化图斑包，市级管理员已完成分派，个人用户正在 App 端开展现场核查。",
        targetAreas: [
          buildAreaKey("武汉市", ALL_COUNTIES),
          buildAreaKey("武汉市", "江夏区"),
          buildAreaKey("武汉市", "东西湖区"),
        ],
        sourceFiles: [
          { id: "seed-1", name: "wuhan_202605_change.zip", size: 6.2 * 1024 * 1024, sizeLabel: "6.2 MB", plotCount: 68 },
          { id: "seed-2", name: "wuhan_focus_spots.zip", size: 4.5 * 1024 * 1024, sizeLabel: "4.5 MB", plotCount: 58 },
        ],
        managerIds: ["2000003"],
        inspectors: [
          { id: "2000004", plots: 36, completed: 24, status: "核查中" },
          { id: "2000006", plots: 30, completed: 30, status: "已提交" },
          { id: "2000007", plots: 30, completed: 18, status: "核查中" },
          { id: "2000008", plots: 30, completed: 12, status: "核查中" },
        ],
        plotCount: 126,
        completedPlots: 84,
        deadline: "2026-05-31 18:00",
        status: TASK_STATUS.IN_PROGRESS,
        createdAt: "2026-05-24 09:20",
        dispatchedAt: "2026-05-24 10:00",
        submittedAt: "-",
        platformUpdatedAt: "-",
        requirement:
          "重点核查新增建设、疑似占地和边界变化图斑，需上传现场照片、定位及核查说明。",
        progressNote: "市级管理员已完成首轮分派，个人用户正在执行图斑核查。",
      },
      users,
    ),
    createSeedTask(
      {
        id: "TASK-002",
        title: "襄阳市 4 月耕地变化图斑核查",
        description:
          "围绕耕地变化图斑开展抽样核查，核查结果已回写平台并完成闭环。",
        targetAreas: [
          buildAreaKey("襄阳市", ALL_COUNTIES),
          buildAreaKey("襄阳市", "樊城区"),
          buildAreaKey("襄阳市", "宜城市"),
        ],
        sourceFiles: [
          { id: "seed-3", name: "xiangyang_farmland_202604.zip", size: 5.1 * 1024 * 1024, sizeLabel: "5.1 MB", plotCount: 78 },
        ],
        managerIds: ["2000009"],
        inspectors: [
          { id: "2000010", plots: 28, completed: 28, status: "已提交" },
          { id: "2000011", plots: 24, completed: 24, status: "已提交" },
          { id: "2000012", plots: 26, completed: 26, status: "已提交" },
        ],
        plotCount: 78,
        completedPlots: 78,
        deadline: "2026-05-28 12:00",
        status: TASK_STATUS.DONE,
        createdAt: "2026-05-22 14:10",
        dispatchedAt: "2026-05-22 14:50",
        submittedAt: "2026-05-26 19:10",
        platformUpdatedAt: "2026-05-27 08:30",
        requirement:
          "逐图斑确认耕地变化真实性，至少上传 2 张现场照片，并填写核查结论和补充说明。",
        progressNote: "核查结果已统一回写图斑库，任务已闭环。",
      },
      users,
    ),
    createSeedTask(
      {
        id: "TASK-003",
        title: "宜昌市地灾点周边图斑核查",
        description:
          "面向重点地灾点周边疑似变化图斑开展快速核查，任务已下发，等待执行用户开始核查。",
        targetAreas: [
          buildAreaKey("宜昌市", ALL_COUNTIES),
          buildAreaKey("宜昌市", "西陵区"),
          buildAreaKey("宜昌市", "夷陵区"),
        ],
        sourceFiles: [
          { id: "seed-4", name: "yichang_geo_hazard_focus.zip", size: 3.8 * 1024 * 1024, sizeLabel: "3.8 MB", plotCount: 54 },
        ],
        managerIds: ["2000013"],
        inspectors: [
          { id: "2000014", plots: 28, completed: 0, status: "待核查" },
          { id: "2000015", plots: 26, completed: 0, status: "待核查" },
        ],
        plotCount: 54,
        completedPlots: 0,
        deadline: "2026-05-30 17:30",
        status: TASK_STATUS.DISPATCHED,
        createdAt: "2026-05-26 08:45",
        dispatchedAt: "2026-05-26 09:10",
        submittedAt: "-",
        platformUpdatedAt: "-",
        requirement:
          "结合底图和现场信息核查地灾点周边图斑现状，重点识别边界变化与用地类型变化。",
        progressNote: "任务已下发至执行用户，等待开始核查。",
      },
      users,
    ),
    createSeedTask(
      {
        id: "TASK-004",
        title: "鄂州市 6 月新增建设图斑核查",
        description:
          "6 月新增建设图斑核查任务草稿，已提前设置下发区域、图斑来源文件和预选执行人。",
        targetAreas: [
          buildAreaKey("鄂州市", ALL_COUNTIES),
          buildAreaKey("鄂州市", "鄂城区"),
        ],
        sourceFiles: [
          { id: "seed-5", name: "ezhou_new_building_202606.zip", size: 2.6 * 1024 * 1024, sizeLabel: "2.6 MB", plotCount: 32 },
        ],
        managerIds: ["2000016"],
        inspectors: [
          { id: "2000017", plots: 16, completed: 0, status: "待接收" },
          { id: "2000018", plots: 16, completed: 0, status: "待接收" },
        ],
        plotCount: 32,
        completedPlots: 0,
        deadline: "2026-06-05 18:00",
        status: TASK_STATUS.DRAFT,
        createdAt: "2026-05-27 10:15",
        dispatchedAt: "-",
        submittedAt: "-",
        platformUpdatedAt: "-",
        requirement:
          "草稿确认后正式下发，个人用户需回传照片、定位和核查说明。",
        progressNote: "当前为省级草稿任务，等待确认后正式下发到市级。",
      },
      users,
    ),
  ];
}

function readStoredTasks(users) {
  if (typeof window === "undefined") return buildInitialTasks(users).map(normalizeTaskRecord);

  // Clear old storage keys
  try {
    for (let i = 1; i < 6; i++) {
      const oldKey = `tdt-task-dispatch-state-v${i}`;
      if (window.localStorage.getItem(oldKey)) {
        window.localStorage.removeItem(oldKey);
      }
    }
  } catch {
    // ignore cleanup errors
  }

  try {
    const stored = JSON.parse(window.localStorage.getItem(storageKey) ?? "null");
    if (Array.isArray(stored) && stored.every((item) => item?.id && item?.targetAreas && item?.sourceFiles)) {
      return stored.map(normalizeTaskRecord);
    }
  } catch {
    return buildInitialTasks(users).map(normalizeTaskRecord);
  }

  return buildInitialTasks(users).map(normalizeTaskRecord);
}

function useTaskRecords(roleUsers) {
  const [records, setRecords] = useState(() => readStoredTasks(roleUsers));

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(storageKey, JSON.stringify(records));
  }, [records]);

  const updateTask = (taskId, patch) => {
    setRecords((current) => current.map((task) => (task.id === taskId ? { ...task, ...patch } : task)));
  };

  const createTask = (task) => {
    setRecords((current) => [task, ...current]);
  };

  return { records, updateTask, createTask };
}

function buildTaskPrimaryAction(task, updateTask) {
  if (task.status === TASK_STATUS.DRAFT) {
    return {
      label: "下发任务",
      icon: "up",
      className: "inline-button action-publish",
      onClick: () => {
        updateTask(task.id, {
          status: TASK_STATUS.DISPATCHED,
          completedPlots: 0,
          dispatchedAt: formatTimestamp(new Date()),
          progressNote: buildTaskProgressNote(TASK_STATUS.DISPATCHED, 0, task.plotCount),
          cityAssignments: buildCityAssignments({
            status: TASK_STATUS.DISPATCHED,
            managerNames: task.managerNames,
            assigneeCount: task.assigneeCount,
            plotCount: task.plotCount,
            completedPlots: 0,
            targetAreaSummary: task.targetAreaSummary,
          }),
          inspectors: normalizeInspectors(task.inspectors, TASK_STATUS.DISPATCHED, 0),
          plots: normalizePlots(task.plots, TASK_STATUS.DISPATCHED),
        });
        showToast("任务已下发");
      },
    };
  }

  return null;
}

export function TaskListPage() {
  const navigate = useNavigate();
  const roleUsers = useMemo(() => readUserRecords(), []);
  const { records, updateTask, createTask } = useTaskRecords(roleUsers);
  const [searchValue, setSearchValue] = useState("");
  const [selectedStatuses, setSelectedStatuses] = useState([]);
  const [selectedCities, setSelectedCities] = useState([]);
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);

  const cityOptions = useMemo(
    () => Array.from(new Set(records.flatMap((task) => task.targetCities))).filter(Boolean),
    [records],
  );

  const statusCounts = useMemo(
    () =>
      records.reduce((result, task) => {
        result[task.status] = (result[task.status] || 0) + 1;
        return result;
      }, {}),
    [records],
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchValue, selectedStatuses, selectedCities, pageSize]);

  const filteredRecords = useMemo(() => {
    const keyword = searchValue.trim().toLowerCase();

    return records.filter((task) => {
      const matchedKeyword =
        !keyword ||
        [
          task.id,
          task.title,
          task.targetAreaSummary,
          task.managerSummary,
          task.sourceSummary,
        ]
          .join(" ")
          .toLowerCase()
          .includes(keyword);

      const matchedStatus = !selectedStatuses.length || selectedStatuses.includes(task.status);
      const matchedCity =
        !selectedCities.length || task.targetCities.some((city) => selectedCities.includes(city));

      return matchedKeyword && matchedStatus && matchedCity;
    });
  }, [records, searchValue, selectedStatuses, selectedCities]);

  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const pageRecords = filteredRecords.slice((safePage - 1) * pageSize, safePage * pageSize);

  const handleCreateTask = (draft, submitMode = "draft") => {
    const nextTask = createTaskFromDraft(draft, roleUsers, submitMode);
    createTask(nextTask);
    setCreateOpen(false);
    showToast(submitMode === "dispatch" ? "任务已保存并下发" : "任务草稿已创建");
  };

  return (
    <div className="page-content page-content--list tasks-page">
      <ListShell
        className="tasks-list-shell"
        searchBar={(
          <input
            className="input search-input"
            value={searchValue}
            placeholder="搜索任务编号、任务名称、下发区域、管理员、SHP 来源"
            onChange={(event) => setSearchValue(event.target.value)}
          />
        )}
        actions={(
          <button type="button" className="primary-button" onClick={() => setCreateOpen(true)}>
            新建任务
          </button>
        )}
        filters={(
          <div className="task-filter-row">
            <FilterSelect
              placeholder="任务状态"
              options={statusOptions}
              optionCounts={statusCounts}
              onChange={(values) => setSelectedStatuses(values)}
            />
            <FilterSelect
              placeholder="目标市州"
              options={cityOptions}
              onChange={(values) => setSelectedCities(values)}
            />
          </div>
        )}
        footer={(
          <Pagination
            currentPage={safePage}
            totalPages={totalPages}
            totalLabel={`共 ${filteredRecords.length} 条`}
            pageSize={pageSize}
            onChangePage={setCurrentPage}
            onChangePageSize={setPageSize}
          />
        )}
      >
        <div className="tasks-table-scroll">
          <div className="tasks-table-shell">
            <div className="table-row table-head cols-tasks">
              <div>编号</div>
              <div>任务与区域</div>
              <div>核查进度</div>
              <div>截止时间</div>
              <div>状态</div>
              <div>操作</div>
            </div>

            {pageRecords.map((task) => {
              const primaryAction = buildTaskPrimaryAction(task, updateTask);
              const progressSummary = getTaskProgressSummary(task);

              return (
                <div
                  key={task.id}
                  className="table-row cols-tasks task-row"
                  onClick={() => navigate(`/tasks/${task.id}`)}
                >
                  <div className="task-id-cell" data-label="编号">{task.id}</div>
                  <div className="task-main-cell" data-label="任务与区域">
                    <strong>{task.title}</strong>
                    <em>{task.targetAreaSummary}</em>
                  </div>
                  <div className="task-metric-cell" data-label="核查进度">
                    <div className="task-progress-compact">
                      <div
                        className="task-progress-ring"
                        style={{ "--task-progress": `${progressSummary.progressPercent}%` }}
                        aria-hidden="true"
                      >
                        <div className="task-progress-ring-inner">{progressSummary.percentText}</div>
                      </div>
                      <div className="task-progress-text">
                        <strong>{progressSummary.countText}</strong>
                        <span>已核查</span>
                      </div>
                    </div>
                  </div>
                  <div className="task-deadline-cell" data-label="截止时间">{task.deadline}</div>
                  <div className="task-status-cell" data-label="状态">
                    <span className={`status-pill ${taskStatusTone(task.status)}`}>{task.status}</span>
                  </div>
                  <div className="task-action-group" data-label="操作" onClick={(event) => event.stopPropagation()}>
                    <button
                      type="button"
                      className="inline-button action-view"
                      onClick={() => navigate(`/tasks/${task.id}`)}
                    >
                      <ButtonIcon type="view" />
                      <span>查看</span>
                    </button>
                    {primaryAction ? (
                      <button
                        type="button"
                        className={primaryAction.className}
                        onClick={primaryAction.onClick}
                      >
                        <ButtonIcon type={primaryAction.icon} />
                        <span>{primaryAction.label}</span>
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </ListShell>

      {createOpen ? (
        <TaskCreateModal
          users={roleUsers}
          onClose={() => setCreateOpen(false)}
          onSubmit={handleCreateTask}
        />
      ) : null}
    </div>
  );
}

function MapResizeHelper() {
  const map = useMap();
  useEffect(() => {
    const raf = requestAnimationFrame(() => map.invalidateSize());
    return () => cancelAnimationFrame(raf);
  }, [map]);
  return null;
}

function FlyToController({ spot }) {
  const map = useMap();
  useEffect(() => {
    if (spot) {
      map.flyTo(spot.coordinate, 16, { duration: 1 });
    }
  }, [map, spot]);
  return null;
}

function generateMockSpots(task) {
  const center = [30.5931, 114.3048];
  const results = ["correct", "incorrect", "pending"];
  const featureTypes = [
    "新增建设", "疑似占地", "边界变化", "用地类型变化",
    "耕地变化", "林地变化", "水域变化", "建设用地图斑",
  ];
  const files = task.sourceFiles;
  const plotsPerFile = files.map((f, fi) => {
    const base = Math.floor(task.plotCount / files.length);
    const rem = task.plotCount % files.length;
    return { fileId: f.id, count: base + (fi < rem ? 1 : 0) };
  });

  let globalIndex = 0;
  const spots = [];
  plotsPerFile.forEach(({ fileId, count }) => {
    for (let j = 0; j < count; j++) {
      const i = globalIndex++;
      const lat = center[0] + (Math.random() - 0.5) * 0.08;
      const lng = center[1] + (Math.random() - 0.5) * 0.12;
      const ft = featureTypes[i % featureTypes.length];
      const result = results[i % 3];
      const photoCount = 1 + Math.floor(Math.random() * 3);
      const photos = Array.from({ length: photoCount }, (_, pi) => ({
        id: `photo-${i}-${pi}`,
        label: `现场照片 ${pi + 1}`,
      }));

      spots.push({
        id: `${task.id}-SPOT-${String(i + 1).padStart(3, "0")}`,
        sourceFileId: fileId,
        coordinate: [lat, lng],
        featureType: ft,
        inspectionResult: result,
        inspectionNotes:
          result === "incorrect"
            ? `${ft}核查与底图不符，存在偏差`
            : result === "pending"
              ? "待核查确认"
              : `${ft}核查结果与底图一致`,
        photos,
      });
    }
  });
  return spots;
}

function generateChartData(task, spots) {
  const resultDist = [
    { name: "正确", value: spots.filter((s) => s.inspectionResult === "correct").length, fill: "#7d95ef" },
    { name: "错误", value: spots.filter((s) => s.inspectionResult === "incorrect").length, fill: "#e08a6d" },
    { name: "待核查", value: spots.filter((s) => s.inspectionResult === "pending").length, fill: "#e0c87d" },
  ].filter((d) => d.value > 0);

  const inspectorCompletion = task.inspectors.map((insp) => ({
    name: insp.name,
    已完成: insp.completed,
    未完成: insp.plots - insp.completed,
  }));

  const ftMap = {};
  spots.forEach((s) => { ftMap[s.featureType] = (ftMap[s.featureType] || 0) + 1; });
  const featureTypeDist = Object.entries(ftMap).map(([name, value]) => ({ name, value }));

  const dailyProgress = [];
  for (let d = 6; d >= 0; d--) {
    const date = new Date();
    date.setDate(date.getDate() - d);
    dailyProgress.push({
      date: `${date.getMonth() + 1}/${date.getDate()}`,
      完成数: Math.max(0, Math.floor(task.completedPlots / 7) + Math.floor(Math.random() * 5 - 2)),
    });
  }

  return { resultDist, inspectorCompletion, featureTypeDist, dailyProgress };
}

export function TaskDetailPage() {
  const navigate = useNavigate();
  const { taskId } = useParams();
  const roleUsers = useMemo(() => readUserRecords(), []);
  const { records, updateTask } = useTaskRecords(roleUsers);
  const task = records.find((item) => item.id === taskId);

  if (!task) {
    return (
      <div className="page-content topic-detail-page task-detail-page">
        <section className="topic-detail-header task-detail-header">
          <div className="topic-detail-heading task-detail-heading">
            <button
              type="button"
              className="icon-back-button"
              onClick={() => navigate("/tasks")}
              aria-label="返回"
            >
              <ButtonIcon type="back" />
            </button>
          </div>
        </section>
        <div className="empty-state">任务不存在或已被删除</div>
      </div>
    );
  }

  const toolbarAction = buildTaskPrimaryAction(task, updateTask);

  const [activeTab, setActiveTab] = useState("detail");
  const [photoViewerOpen, setPhotoViewerOpen] = useState(false);
  const [flyToSpot, setFlyToSpot] = useState(null);
  const [spotTableFile, setSpotTableFile] = useState(null);
  const [spotTablePage, setSpotTablePage] = useState(1);

  const spots = useMemo(() => generateMockSpots(task), [task]);
  const chartData = useMemo(() => generateChartData(task, spots), [task, spots]);
  const mapCenter = useMemo(
    () => (spots.length > 0 ? spots[Math.floor(spots.length / 2)].coordinate : [30.5931, 114.3048]),
    [spots],
  );

  return (
    <div className="page-content topic-detail-page task-detail-page">
      <section className="topic-detail-header task-detail-header">
        <div className="topic-detail-heading task-detail-heading">
          <button
            type="button"
            className="icon-back-button"
            onClick={() => navigate("/tasks")}
            aria-label="返回"
          >
            <ButtonIcon type="back" />
          </button>
          <div className="topic-detail-title task-detail-title">
            <h2>{task.title}</h2>
            <span className={`status-pill ${taskStatusTone(task.status)}`}>{task.status}</span>
          </div>
        </div>
        <div className="topic-detail-toolbar task-detail-toolbar">
          {toolbarAction ? (
            <button type="button" className="primary-button slim-button" onClick={toolbarAction.onClick}>
              {toolbarAction.label}
            </button>
          ) : null}
        </div>
      </section>

      <section className="topic-detail-description task-detail-description">
        <p>{task.description}</p>
      </section>

      <section className="task-detail-tabs" role="tablist" aria-label="任务详情视图">
            <button
              type="button"
              className={`task-detail-tab${activeTab === "detail" ? " active" : ""}`}
              onClick={() => setActiveTab("detail")}
            >
              任务详情
            </button>
            <button
              type="button"
              className={`task-detail-tab${activeTab === "result" ? " active" : ""}`}
              onClick={() => setActiveTab("result")}
            >
              核查结果
            </button>
          </section>

          {activeTab === "detail" ? (
            <div className="task-detail-main-grid">
              <div className="task-detail-form">
                <div className="task-detail-form-group">
                  <label className="task-detail-form-label">任务名称</label>
                  <div className="task-detail-form-value">{task.title}</div>
                </div>
                <div className="task-detail-form-group">
                  <label className="task-detail-form-label">截止时间</label>
                  <div className="task-detail-form-value">{formatDate(task.deadline)}</div>
                </div>
                <div className="task-detail-form-group">
                  <label className="task-detail-form-label">图斑数据</label>
                  <div className="task-detail-form-value">
                    {task.sourceFiles.map((file, i) => (
                      <span key={file.id}>{i > 0 ? "；" : ""}{file.name}</span>
                    ))}
                  </div>
                </div>
                <div className="task-detail-form-group">
                  <label className="task-detail-form-label">下发区域</label>
                  <div className="task-detail-form-value">{task.targetAreaSummary}</div>
                </div>
                <div className="task-detail-form-group">
                  <label className="task-detail-form-label">执行人员</label>
                  <div className="task-detail-inspector-list">
                    {task.inspectors.map((insp) => (
                      <div key={insp.id} className="task-detail-inspector-row">
                        <strong>{insp.name}</strong>
                        <span>{insp.county}<span className="task-detail-plot-badge">图斑 {insp.plots}</span></span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="task-detail-map-column">
                <div className="task-leaflet-shell">
                  <MapContainer
                    center={mapCenter}
                    zoom={14}
                    className="task-leaflet-map"
                    scrollWheelZoom
                  >
                    <MapResizeHelper />
                    <FlyToController spot={flyToSpot} />
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    {spots.map((spot) => (
                      <CircleMarker
                        key={spot.id}
                        center={spot.coordinate}
                        radius={8}
                        pathOptions={{
                          color: "#3a3a3a",
                          weight: 1.5,
                          fillColor:
                            spot.inspectionResult === "correct" ? "#7d95ef"
                            : spot.inspectionResult === "incorrect" ? "#e08a6d"
                            : "#e0c87d",
                          fillOpacity: 0.9,
                        }}
                      >
                        <Tooltip direction="top" offset={[0, -8]}>{spot.id}</Tooltip>
                        <Popup maxWidth={300}>
                          <div className="task-spot-popup">
                            <strong>{spot.id}</strong>
                            <div className="task-spot-popup-row"><span>要素类型</span><span>{spot.featureType}</span></div>
                            <div className="task-spot-popup-row">
                              <span>核查结果</span>
                              <span className={`task-spot-result-tag ${spot.inspectionResult}`}>
                                {spot.inspectionResult === "correct" ? "正确" : spot.inspectionResult === "incorrect" ? "错误" : "待核查"}
                              </span>
                            </div>
                            <div className="task-spot-popup-row"><span>核查备注</span><span>{spot.inspectionNotes}</span></div>
                          </div>
                        </Popup>
                      </CircleMarker>
                    ))}
                  </MapContainer>
                </div>

                <div className="task-map-legend">
                  <div className="task-legend-title">图斑图例</div>
                  <div className="task-legend-item">
                    <span className="task-legend-dot" style={{ background: "#7d95ef" }} />
                    <span>核查正确</span>
                  </div>
                  <div className="task-legend-item">
                    <span className="task-legend-dot" style={{ background: "#e08a6d" }} />
                    <span>核查错误</span>
                  </div>
                  <div className="task-legend-item">
                    <span className="task-legend-dot" style={{ background: "#e0c87d" }} />
                    <span>待核查</span>
                  </div>
                  <div className="task-legend-divider" />
                  <div className="task-legend-title">SHP 来源</div>
                  {task.sourceFiles.map((file) => (
                    <div
                      key={file.id}
                      className="task-legend-shp"
                      onClick={() => { setSpotTableFile(file); setSpotTablePage(1); }}
                    >
                      <div className="task-legend-item">
                        <span className="task-legend-file">{file.name}</span>
                        <span className="task-legend-icon">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/></svg>
                        </span>
                        <span className="task-legend-count">{file.plotCount} 图斑</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="task-photo-viewer">
                  <button
                    type="button"
                    className="task-photo-toggle"
                    onClick={() => setPhotoViewerOpen((prev) => !prev)}
                    aria-label="查看核查照片"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                  </button>
                  {photoViewerOpen ? (
                    <div className="task-photo-panel">
                      <div className="task-photo-panel-head">
                        <strong>核查照片</strong>
                        <button type="button" className="task-photo-close" onClick={() => setPhotoViewerOpen(false)}>&times;</button>
                      </div>
                      <div className="task-photo-grid">
                        {spots.flatMap((spot) =>
                          spot.photos.map((photo) => (
                            <button
                              key={photo.id}
                              type="button"
                              className="task-photo-thumb"
                              onClick={() => setFlyToSpot(spot)}
                              title={`${spot.id} - ${photo.label}`}
                            >
                              <div className="task-photo-placeholder">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8a8176" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                                <span>{photo.label}</span>
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          ) : (
            <div className="task-detail-chart-shell">
              <div className="task-chart-grid">
                <div className="task-chart-card">
                  <div className="task-chart-head">
                    <strong>核查结果分布</strong>
                    <span>正确 / 错误 / 待核查占比</span>
                  </div>
                  <div className="task-chart-body">
                    <ResponsiveContainer width="100%" height={240}>
                      <PieChart>
                        <Pie
                          data={chartData.resultDist}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={85}
                          label={({ name, value }) => `${name} ${value}`}
                        >
                          {chartData.resultDist.map((entry, idx) => (
                            <Cell key={idx} fill={entry.fill} />
                          ))}
                        </Pie>
                        <RechartsTooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="task-chart-card">
                  <div className="task-chart-head">
                    <strong>执行用户完成进度</strong>
                    <span>已完成 / 未完成图斑数</span>
                  </div>
                  <div className="task-chart-body">
                    <ResponsiveContainer width="100%" height={240}>
                      <BarChart data={chartData.inspectorCompletion} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0ebe2" />
                        <XAxis type="number" tick={{ fontSize: 11 }} />
                        <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={60} />
                        <RechartsTooltip />
                        <Bar dataKey="已完成" stackId="a" fill="#7d95ef" radius={[0, 0, 4, 4]} />
                        <Bar dataKey="未完成" stackId="a" fill="#e6dfd5" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="task-chart-card">
                  <div className="task-chart-head">
                    <strong>要素类型分布</strong>
                    <span>各类型图斑数量统计</span>
                  </div>
                  <div className="task-chart-body">
                    <ResponsiveContainer width="100%" height={240}>
                      <BarChart data={chartData.featureTypeDist}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0ebe2" />
                        <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-15} textAnchor="end" height={60} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <RechartsTooltip />
                        <Bar dataKey="value" fill="#7d95ef" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="task-chart-card">
                  <div className="task-chart-head">
                    <strong>每日核查进度</strong>
                    <span>近 7 天完成图斑趋势</span>
                  </div>
                  <div className="task-chart-body">
                    <ResponsiveContainer width="100%" height={240}>
                      <AreaChart data={chartData.dailyProgress}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0ebe2" />
                        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <RechartsTooltip />
                        <Area
                          type="monotone"
                          dataKey="完成数"
                          stroke="#7d95ef"
                          fill="#7d95ef"
                          fillOpacity={0.16}
                          strokeWidth={2}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          )}
      {spotTableFile ? (() => {
        const fileSpots = spots.filter((s) => s.sourceFileId === spotTableFile.id);
        const PAGE_SIZE = 12;
        const totalPages = Math.max(1, Math.ceil(fileSpots.length / PAGE_SIZE));
        const safePage = Math.min(spotTablePage, totalPages);
        const pageSpots = fileSpots.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

        return (
          <div className="export-modal-overlay" onClick={() => setSpotTableFile(null)}>
            <div className="export-modal-card task-spot-table-modal" onClick={(e) => e.stopPropagation()}>
              <div className="export-modal-header">
                <h3>{spotTableFile.name}</h3>
                <button type="button" className="export-modal-close" onClick={() => setSpotTableFile(null)}>×</button>
              </div>
              <div className="task-spot-table-scroll">
                <table className="task-spot-table">
                  <thead>
                    <tr>
                      <th>图斑 ID</th>
                      <th>地物类型</th>
                      <th>坐标（纬度, 经度）</th>
                      <th>核查结果</th>
                      <th>核查备注</th>
                      <th>照片数</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageSpots.map((spot) => (
                      <tr key={spot.id}>
                        <td className="task-spot-table-id">{spot.id}</td>
                        <td>{spot.featureType}</td>
                        <td className="task-spot-table-coord">{spot.coordinate[0].toFixed(4)}, {spot.coordinate[1].toFixed(4)}</td>
                        <td>
                          <span className={`task-spot-result-tag ${spot.inspectionResult}`}>
                            {spot.inspectionResult === "correct" ? "正确" : spot.inspectionResult === "incorrect" ? "错误" : "待核查"}
                          </span>
                        </td>
                        <td className="task-spot-table-notes">{spot.inspectionNotes}</td>
                        <td className="task-spot-table-photos">{spot.photos.length}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="task-spot-table-footer">
                <span className="task-spot-table-total">共 {fileSpots.length} 个图斑</span>
                <div className="task-spot-table-pager">
                  <span className="task-spot-page-size">每页 {PAGE_SIZE} 条</span>
                  <button
                    type="button"
                    className="task-pager-btn"
                    disabled={safePage <= 1}
                    onClick={() => setSpotTablePage(safePage - 1)}
                  >
                    上一页
                  </button>
                  <span className="task-pager-info">{safePage} / {totalPages}</span>
                  <button
                    type="button"
                    className="task-pager-btn"
                    disabled={safePage >= totalPages}
                    onClick={() => setSpotTablePage(safePage + 1)}
                  >
                    下一页
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })() : null}
    </div>
  );
}

function TaskCreateModal({ users, onClose, onSubmit }) {
  const areaCityOptions = useMemo(() => getCityOptions(users), [users]);

  const [draft, setDraft] = useState(() => ({
    title: "",
    selectedAreaKeys: [],
    deadline: "2026-06-05T18:00",
    sourceFiles: createMockSourceFiles(),
    managerIds: [],
    inspectorIds: [],
    requirement: "",
    description: "",
  }));
  const [pickerMode, setPickerMode] = useState(null);
  const [plotAllocations, setPlotAllocations] = useState({});

  const totalPlotEstimate = draft.sourceFiles.reduce((sum, file) => sum + file.plotCount, 0);

  useEffect(() => {
    if (!draft.inspectorIds.length || totalPlotEstimate <= 0) {
      setPlotAllocations({});
      return;
    }
    const base = Math.floor(totalPlotEstimate / draft.inspectorIds.length);
    const remainder = totalPlotEstimate % draft.inspectorIds.length;
    const allocations = {};
    draft.inspectorIds.forEach((id, index) => {
      allocations[id] = base + (index < remainder ? 1 : 0);
    });
    setPlotAllocations(allocations);
  }, [draft.inspectorIds, totalPlotEstimate]);

  const handlePlotAdjust = (userId, delta) => {
    setPlotAllocations((prev) => {
      const current = prev[userId] || 0;
      const next = current + delta;
      if (next < 1) return prev;
      const otherSum = Object.entries(prev).reduce((sum, [id, count]) => {
        return id === userId ? sum : sum + count;
      }, 0);
      if (otherSum + next > totalPlotEstimate) return prev;
      return { ...prev, [userId]: next };
    });
  };

  const allocatedTotal = Object.values(plotAllocations).reduce((sum, count) => sum + count, 0);

  const availableManagers = useMemo(
    () => getManagersForAreas(users, draft.selectedAreaKeys),
    [users, draft.selectedAreaKeys],
  );

  const availableInspectors = useMemo(
    () => getInspectorsForAreas(users, draft.selectedAreaKeys),
    [users, draft.selectedAreaKeys],
  );

  useEffect(() => {
    const availableManagerIds = new Set(availableManagers.map((user) => user.id));

    setDraft((current) => {
      const nextManagerIds = current.managerIds.filter((id) => availableManagerIds.has(id));
      return nextManagerIds.length === current.managerIds.length
        ? current
        : { ...current, managerIds: nextManagerIds };
    });
  }, [availableManagers]);

  useEffect(() => {
    const availableInspectorIds = new Set(availableInspectors.map((user) => user.id));

    setDraft((current) => {
      const nextInspectorIds = current.inspectorIds.filter((id) => availableInspectorIds.has(id));
      return nextInspectorIds.length === current.inspectorIds.length
        ? current
        : { ...current, inspectorIds: nextInspectorIds };
    });
  }, [availableInspectors]);

  const selectedManagers = availableManagers.filter((user) => draft.managerIds.includes(user.id));
  const selectedInspectors = availableInspectors.filter((user) => draft.inspectorIds.includes(user.id));
  const selectedCities = getSelectedCitiesFromAreaKeys(draft.selectedAreaKeys);

  const updateDraft = (patch) => {
    setDraft((current) => ({ ...current, ...patch }));
  };

  const handleFilesSelected = (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    setDraft((current) => {
      const incoming = files.map((file) => createSourceFileRecord(file, current.selectedAreaKeys.length || 1));
      const merged = [...current.sourceFiles];

      incoming.forEach((record) => {
        if (!merged.some((item) => item.name === record.name && item.size === record.size)) {
          merged.push(record);
        }
      });

      return { ...current, sourceFiles: merged };
    });

    event.target.value = "";
  };

  const removeSourceFile = (fileId) => {
    setDraft((current) => ({
      ...current,
      sourceFiles: current.sourceFiles.filter((file) => file.id !== fileId),
    }));
  };

  const handleSubmit = (submitMode = "draft") => {
    if (!draft.title.trim()) {
      showToast("请填写任务名称", "warning");
      return;
    }

    if (!draft.selectedAreaKeys.length) {
      showToast("请至少选择 1 个下发区域", "warning");
      return;
    }

    if (!draft.sourceFiles.length) {
      showToast("请上传 SHP 图斑来源文件", "warning");
      return;
    }

    if (!draft.managerIds.length) {
      showToast("请指定市级管理员", "warning");
      return;
    }

    const coveredCities = new Set(selectedManagers.map((user) => user.city));
    if (selectedCities.some((city) => !coveredCities.has(city))) {
      showToast("每个目标市州都需要至少指定 1 名市级管理员", "warning");
      return;
    }

    if (!draft.inspectorIds.length) {
      showToast("请至少选择 1 名执行用户", "warning");
      return;
    }

    if (allocatedTotal !== totalPlotEstimate) {
      showToast(`图斑分配总数（${allocatedTotal}）与图斑总数（${totalPlotEstimate}）不一致，请调整分配`, "warning");
      return;
    }

    onSubmit({ ...draft, plotAllocations }, submitMode);
  };

  const sourceTriggerText = "点击上传 SHP / ZIP 图斑文件";

  return (
    <div className="export-modal-overlay">
      <div className="export-modal-card task-modal-card">
        <div className="export-modal-header">
          <h3>新建任务下发</h3>
          <button type="button" className="export-modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="task-modal-body">
          <div className="task-modal-main">
            <div className="task-form-grid task-form-grid-top task-form-grid-wide">
              <div className="form-block task-title-field">
                <label><span className="form-required">*</span>任务名称</label>
                <input
                  className="input"
                  value={draft.title}
                  placeholder="例如：武汉市 6 月新增建设图斑核查"
                  onChange={(event) => updateDraft({ title: event.target.value })}
                />
              </div>
              <div className="form-block task-deadline-field">
                <label><span className="form-required">*</span>截止时间</label>
                <input
                  className="input"
                  type="datetime-local"
                  value={draft.deadline}
                  onChange={(event) => updateDraft({ deadline: event.target.value })}
                />
              </div>
              <div className="form-block span-2">
                <label><span className="form-required">*</span>图斑来源</label>
                <label className="task-source-trigger task-source-trigger-inline">
                  <input
                    type="file"
                    accept=".zip,.shp,.dbf,.shx,.prj"
                    multiple
                    onChange={handleFilesSelected}
                  />
                  <strong>{sourceTriggerText}</strong>
                  {draft.sourceFiles.length ? (
                    <span>{`已关联 ${draft.sourceFiles.length} 个来源文件，${totalPlotEstimate} 个图斑`}</span>
                  ) : null}
                </label>
                <div className="task-upload-list task-upload-list-compact">
                  {draft.sourceFiles.length ? (
                    draft.sourceFiles.map((file) => (
                      <div key={file.id} className="task-upload-item">
                        <div>
                          <strong>{file.name}</strong>
                          <span>{file.sizeLabel} · {file.plotCount} 个图斑</span>
                        </div>
                        <button
                          type="button"
                          className="ghost-button slim-button"
                          onClick={() => removeSourceFile(file.id)}
                        >
                          移除
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="task-user-empty">暂未选择图斑来源文件</div>
                  )}
                </div>
              </div>
            </div>

            <div className="form-block task-requirement-block">
              <label>核查要求</label>
              <textarea
                className="textarea"
                rows="4"
                value={draft.requirement}
                placeholder="填写给 App 端执行用户的核查要求"
                onChange={(event) => updateDraft({ requirement: event.target.value })}
              />
            </div>

            <div className="task-area-section">
              <div className="task-section-heading">
                <strong>下发区域</strong>
              </div>
              <AreaHierarchyPicker
                provinceName={PROVINCE_NAME}
                cityOptions={areaCityOptions}
                getCountyOptions={getCountyOptions}
                value={draft.selectedAreaKeys}
                onChange={(selectedAreaKeys) => updateDraft({ selectedAreaKeys })}
              />
            </div>
          </div>

          <aside className="task-modal-side">
            <div className="task-user-section">
              <div className="task-user-section-head">
                <div>
                  <strong>任务指派</strong>
                </div>
              </div>

              <div className="task-selection-block task-selection-card">
                <div className="task-subsection-head">
                  <strong>指定管理员</strong>
                </div>
                <div className="task-selection-toolbar">
                  <span className="task-selection-count">已选 {selectedManagers.length} 人</span>
                  <button
                    type="button"
                    className="ghost-button slim-button"
                    onClick={() => {
                      if (!draft.selectedAreaKeys.length) {
                        showToast("请先选择下发区域", "warning");
                        return;
                      }
                      setPickerMode("manager");
                    }}
                  >
                    调整管理员
                  </button>
                </div>
                <div className="task-user-list compact">
                  {selectedManagers.length ? (
                    selectedManagers.map((user) => (
                      <div key={user.id} className="task-user-option active">
                        <div className="task-user-meta">
                          <strong>{user.nickname}</strong>
                          <span>{getAreaText(user)}</span>
                          <em>{user.role} · {user.title}</em>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="task-user-empty">
                      {draft.selectedAreaKeys.length
                        ? "当前还没有指定管理员，请从角色管理表单中选择"
                        : "当前还没有指定管理员，请从角色管理表单中选择"}
                    </div>
                  )}
                </div>
              </div>

              <div className="task-selection-block task-selection-card">
                <div className="task-subsection-head">
                  <strong>指定执行用户</strong>
                </div>
                <div className="task-selection-toolbar">
                  <span className="task-selection-count">已选 {selectedInspectors.length} 人</span>
                  <button
                    type="button"
                    className="ghost-button slim-button"
                    onClick={() => {
                      if (!draft.selectedAreaKeys.length) {
                        showToast("请先选择下发区域", "warning");
                        return;
                      }
                      setPickerMode("inspector");
                    }}
                  >
                    从角色管理中选择
                  </button>
                </div>
                <div className="task-user-list">
                  {selectedInspectors.length ? (
                    selectedInspectors.map((user) => {
                      const userPlots = plotAllocations[user.id] || 0;
                      const canDecrease = userPlots > 1;
                      const canIncrease = allocatedTotal < totalPlotEstimate;
                      return (
                        <div key={user.id} className="task-user-option active">
                          <div className="task-user-meta">
                            <strong>{user.nickname}</strong>
                            <span>{getAreaText(user)}</span>
                            <em>{user.role} · {user.title}</em>
                          </div>
                          {totalPlotEstimate > 0 ? (
                            <div className="task-user-plot-control">
                              <button
                                type="button"
                                className="task-plot-adjust-btn"
                                disabled={!canDecrease}
                                onClick={() => handlePlotAdjust(user.id, -1)}
                              >
                                −
                              </button>
                              <span className="task-user-plot-badge">{userPlots} 个图斑</span>
                              <button
                                type="button"
                                className="task-plot-adjust-btn"
                                disabled={!canIncrease}
                                onClick={() => handlePlotAdjust(user.id, 1)}
                              >
                                +
                              </button>
                            </div>
                          ) : null}
                        </div>
                      );
                    })
                  ) : (
                    <div className="task-user-empty">
                      {draft.selectedAreaKeys.length
                        ? "当前还没有指定执行用户，请从角色管理表单中选择"
                        : "请先选择下发区域，再从角色管理表单中筛选执行用户"}
                    </div>
                  )}
                </div>

                {selectedInspectors.length > 0 && totalPlotEstimate > 0 ? (
                  <div className="task-plot-summary">
                    已分配 {allocatedTotal} / {totalPlotEstimate} 个图斑
                    {allocatedTotal < totalPlotEstimate ? (
                      <span className="task-plot-remaining">（剩余 {totalPlotEstimate - allocatedTotal} 个未分配）</span>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>
          </aside>
        </div>

        <div className="export-modal-footer">
          <button type="button" className="ghost-button slim-button" onClick={onClose}>
            取消
          </button>
          <button type="button" className="ghost-button slim-button" onClick={() => handleSubmit("draft")}>
            保存草稿
          </button>
          <button
            type="button"
            className="primary-button slim-button"
            onClick={() => handleSubmit("dispatch")}
            autoFocus
          >
            保存并下发
          </button>
        </div>
      </div>

      {pickerMode === "manager" ? (
        <UserTransferModal
          title="选择管理员"
          items={availableManagers}
          value={draft.managerIds}
          leftTitle="待选管理员"
          rightTitle="已选管理员"
          leftEmptyText="当前区域内暂无可选管理员，请先到角色管理模块补充"
          rightEmptyText="当前还没有加入管理员"
          onClose={() => setPickerMode(null)}
          onConfirm={(managerIds) => {
            updateDraft({ managerIds });
            setPickerMode(null);
          }}
        />
      ) : null}

      {pickerMode === "inspector" ? (
        <UserTransferModal
          title="选择执行用户"
          items={availableInspectors}
          value={draft.inspectorIds}
          leftTitle="待选执行用户"
          rightTitle="已选执行用户"
          leftEmptyText="当前区域内暂无可选执行用户，请先到角色管理模块补充"
          rightEmptyText="当前还没有加入执行用户"
          allowSelectAll
          onClose={() => setPickerMode(null)}
          onConfirm={(inspectorIds) => {
            updateDraft({ inspectorIds });
            setPickerMode(null);
          }}
        />
      ) : null}
    </div>
  );
}

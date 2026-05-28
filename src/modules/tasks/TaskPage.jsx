import { useEffect, useMemo, useRef, useState } from "react";
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
import "./tasks.css";

const storageKey = "tdt-task-dispatch-state-v3";

const TASK_STATUS = {
  DRAFT: "草稿",
  PENDING_ASSIGN: "待市级分派",
  IN_PROGRESS: "核查中",
  SUBMITTED: "已提交待更新",
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

function summarizeSourceFiles(sourceFiles) {
  if (!sourceFiles.length) return "-";
  if (sourceFiles.length === 1) return `${sourceFiles[0].name} · ${sourceFiles[0].plotCount} 个图斑`;
  const totalPlots = sourceFiles.reduce((sum, item) => sum + item.plotCount, 0);
  return `${sourceFiles.length} 个 SHP 文件 · 约 ${totalPlots} 个图斑`;
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
      status:
        status === TASK_STATUS.DRAFT
          ? "未接收"
          : status === TASK_STATUS.PENDING_ASSIGN
            ? "待分派"
            : "已接收",
      note:
        status === TASK_STATUS.DRAFT
          ? "草稿阶段已预设承接管理员"
          : status === TASK_STATUS.PENDING_ASSIGN
            ? "等待市级管理员确认并分派图斑"
            : `已完成市级统筹，关联 ${inspectorSummary}`,
    },
    {
      role: "市级个人用户",
      owner: inspectorSummary,
      status:
        status === TASK_STATUS.DRAFT || status === TASK_STATUS.PENDING_ASSIGN
          ? "未下发"
          : status === TASK_STATUS.IN_PROGRESS
            ? "核查中"
            : "已提交",
      note:
        status === TASK_STATUS.DRAFT || status === TASK_STATUS.PENDING_ASSIGN
          ? `待个人用户接收，预计核查 ${plotCount} 个图斑`
          : `${completedPlots} / ${plotCount} 个图斑已完成核查`,
    },
    {
      role: "平台回写",
      owner: "省级任务中心",
      status:
        status === TASK_STATUS.SUBMITTED
          ? "待更新"
          : status === TASK_STATUS.DONE
            ? "已更新"
            : "未开始",
      note:
        status === TASK_STATUS.SUBMITTED
          ? "等待 Web 后台统一回写图斑库"
          : status === TASK_STATUS.DONE
            ? "平台图斑状态与核查结论已同步"
            : "执行结果回传后统一更新",
    },
  ];
}

function taskStatusTone(status) {
  if (status === TASK_STATUS.DONE) return "success";
  if (status === TASK_STATUS.IN_PROGRESS) return "info";
  if (status === TASK_STATUS.SUBMITTED) return "pending";
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

function createTaskFromDraft(draft, users) {
  const selectedManagers = users.filter((user) => draft.managerIds.includes(user.id));
  const selectedInspectors = users.filter((user) => draft.inspectorIds.includes(user.id));
  const plotCount = draft.sourceFiles.reduce((sum, file) => sum + file.plotCount, 0);
  const basePlotsPerInspector = selectedInspectors.length ? Math.floor(plotCount / selectedInspectors.length) : 0;
  const remainingPlots = selectedInspectors.length ? plotCount % selectedInspectors.length : 0;
  const inspectorAssignments = selectedInspectors.map((user, index) => ({
    id: user.id,
    name: user.nickname,
    county: user.county,
    role: user.role,
    plots: basePlotsPerInspector + (index < remainingPlots ? 1 : 0),
    completed: 0,
    status: "待接收",
  }));
  const nextId = `TASK-${String(Date.now()).slice(-6)}`;
  const targetAreaSummary = summarizeAreaKeys(draft.selectedAreaKeys);
  const managerNames = selectedManagers.map((user) => user.nickname);

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
    status: TASK_STATUS.DRAFT,
    createdAt: formatTimestamp(new Date()),
    dispatchedAt: "-",
    submittedAt: "-",
    platformUpdatedAt: "-",
    requirement:
      draft.requirement.trim() ||
      "执行用户需逐图斑完成现场核查，填写核查结论、现场说明、定位信息，并上传佐证照片后统一提交。",
    progressNote: "任务草稿已生成，已绑定下发区域、SHP 图斑来源和执行人员。",
    cityAssignments: buildCityAssignments({
      status: TASK_STATUS.DRAFT,
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
      status: TASK_STATUS.DRAFT,
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
          : config.status === TASK_STATUS.PENDING_ASSIGN
            ? "待核查"
            : config.status === TASK_STATUS.IN_PROGRESS
              ? TASK_STATUS.IN_PROGRESS
              : "已提交",
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
          "围绕耕地变化图斑开展抽样核查，市级个人用户已提交整包结果，等待 Web 后台统一更新。",
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
        status: TASK_STATUS.SUBMITTED,
        createdAt: "2026-05-22 14:10",
        dispatchedAt: "2026-05-22 14:50",
        submittedAt: "2026-05-26 19:10",
        platformUpdatedAt: "-",
        requirement:
          "逐图斑确认耕地变化真实性，至少上传 2 张现场照片，并填写核查结论和补充说明。",
        progressNote: "个人用户已提交全部图斑结果，等待平台统一更新。",
      },
      users,
    ),
    createSeedTask(
      {
        id: "TASK-003",
        title: "宜昌市地灾点周边图斑核查",
        description:
          "面向重点地灾点周边疑似变化图斑开展快速核查，任务已下发至市级管理员，等待确认执行名单。",
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
          { id: "2000014", plots: 28, completed: 0, status: "待接收" },
          { id: "2000015", plots: 26, completed: 0, status: "待接收" },
        ],
        plotCount: 54,
        completedPlots: 0,
        deadline: "2026-05-30 17:30",
        status: TASK_STATUS.PENDING_ASSIGN,
        createdAt: "2026-05-26 08:45",
        dispatchedAt: "2026-05-26 09:10",
        submittedAt: "-",
        platformUpdatedAt: "-",
        requirement:
          "结合底图和现场信息核查地灾点周边图斑现状，重点识别边界变化与用地类型变化。",
        progressNote: "任务已下发至市级管理员，等待确认执行用户并完成分派。",
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
  if (typeof window === "undefined") return buildInitialTasks(users);

  try {
    const stored = JSON.parse(window.localStorage.getItem(storageKey) ?? "null");
    if (Array.isArray(stored) && stored.every((item) => item?.id && item?.targetAreas && item?.sourceFiles)) {
      return stored;
    }
  } catch {
    return buildInitialTasks(users);
  }

  return buildInitialTasks(users);
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
      label: "下发",
      icon: "up",
      className: "inline-button action-publish",
      onClick: () => {
        updateTask(task.id, {
          status: TASK_STATUS.PENDING_ASSIGN,
          dispatchedAt: formatTimestamp(new Date()),
          progressNote: "任务已下发到市级管理员，等待市级确认执行名单并完成分派。",
          cityAssignments: buildCityAssignments({
            status: TASK_STATUS.PENDING_ASSIGN,
            managerNames: task.managerNames,
            assigneeCount: task.assigneeCount,
            plotCount: task.plotCount,
            completedPlots: task.completedPlots,
            targetAreaSummary: task.targetAreaSummary,
          }),
          plots: task.plots.map((plot) => ({ ...plot, status: "待分派" })),
        });
        showToast("任务已下发至市级管理员");
      },
    };
  }

  if (task.status === TASK_STATUS.PENDING_ASSIGN) {
    return {
      label: "标记分派",
      icon: "sync",
      className: "inline-button action-view",
      onClick: () => {
        updateTask(task.id, {
          status: TASK_STATUS.IN_PROGRESS,
          progressNote: "市级管理员已完成分派，个人用户开始在 App 端执行核查。",
          cityAssignments: buildCityAssignments({
            status: TASK_STATUS.IN_PROGRESS,
            managerNames: task.managerNames,
            assigneeCount: task.assigneeCount,
            plotCount: task.plotCount,
            completedPlots: task.completedPlots,
            targetAreaSummary: task.targetAreaSummary,
          }),
          inspectors: task.inspectors.map((inspector) => ({
            ...inspector,
            status: inspector.completed > 0 ? "核查中" : "待核查",
          })),
          plots: task.plots.map((plot) => ({ ...plot, status: "待核查" })),
        });
        showToast("已标记为市级分派完成");
      },
    };
  }

  if (task.status === TASK_STATUS.SUBMITTED) {
    return {
      label: "更新平台",
      icon: "sync",
      className: "inline-button action-publish",
      onClick: () => {
        updateTask(task.id, {
          status: TASK_STATUS.DONE,
          platformUpdatedAt: formatTimestamp(new Date()),
          progressNote: "核查结果已统一回写图斑库，任务链路已闭环。",
          cityAssignments: buildCityAssignments({
            status: TASK_STATUS.DONE,
            managerNames: task.managerNames,
            assigneeCount: task.assigneeCount,
            plotCount: task.plotCount,
            completedPlots: task.completedPlots,
            targetAreaSummary: task.targetAreaSummary,
          }),
          plots: task.plots.map((plot) => ({ ...plot, status: "已完成" })),
        });
        showToast("平台图斑信息已更新");
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

  const handleCreateTask = (draft) => {
    const nextTask = createTaskFromDraft(draft, roleUsers);
    createTask(nextTask);
    setCreateOpen(false);
    showToast("任务草稿已创建");
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

  const detailFields = [
    { label: "任务编号", value: task.id },
    { label: "下发区域", value: task.targetAreaSummary },
    { label: "图斑来源", value: task.sourceSummary },
    { label: "指定管理员", value: task.managerSummary || "-" },
  ];

  const toolbarAction = buildTaskPrimaryAction(task, updateTask);

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

      <section className="topic-detail-map-shell task-detail-panel-shell">
        <div className="task-detail-panel">
          <div className="task-detail-body-section">
            <div className="task-detail-info-grid">
              {detailFields.map((field) => (
                <InfoField key={field.label} label={field.label} value={field.value} />
              ))}
            </div>

            <div className="task-detail-stats-row">
              <div className="task-stat-box">
                <div className="stat-value">{task.plotCount}</div>
                <div className="stat-label">任务图斑</div>
              </div>
              <div className="task-stat-box">
                <div className="stat-value">{task.completedPlots}</div>
                <div className="stat-label">已核查图斑</div>
              </div>
              <div className="task-stat-box">
                <div className="stat-value">{task.assigneeCount}</div>
                <div className="stat-label">执行用户</div>
              </div>
              <div className="task-stat-box">
                <div className="stat-value">{formatDate(task.deadline)}</div>
                <div className="stat-label">截止时间</div>
              </div>
            </div>

            <div className="task-detail-section">
              <div className="task-section-heading">
                <strong>任务流转</strong>
                <span>{task.progressNote}</span>
              </div>
              <div className="task-stage-grid">
                {task.cityAssignments.map((item) => (
                  <div key={item.role} className="task-stage-card">
                    <span className="task-stage-role">{item.role}</span>
                    <strong>{item.owner}</strong>
                    <span className={`status-pill ${assignmentTone(item.status)}`}>{item.status}</span>
                    <em>{item.note}</em>
                  </div>
                ))}
              </div>
            </div>

            <div className="task-detail-columns">
              <div className="task-detail-section">
                <div className="task-section-heading">
                  <strong>执行用户</strong>
                  <span>用户从角色管理模块拉取，按下发区域过滤后指定到本次任务</span>
                </div>
                <div className="task-assignment-list">
                  {task.inspectors.map((inspector) => (
                    <div key={inspector.id} className="task-assignment-item">
                      <div>
                        <strong>{inspector.name}</strong>
                        <span>
                          {inspector.county} · {inspector.plots} 个图斑 · 已完成 {inspector.completed}
                        </span>
                      </div>
                      <span className={`status-pill ${inspectorTone(inspector.status)}`}>{inspector.status}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="task-detail-section">
                <div className="task-section-heading">
                  <strong>SHP 图斑来源</strong>
                  <span>任务图斑由省级统一上传，个人用户提交后等待 Web 后台统一更新</span>
                </div>
                <div className="task-source-list">
                  {task.sourceFiles.map((file) => (
                    <div key={file.id} className="task-source-item">
                      <div>
                        <strong>{file.name}</strong>
                        <span>{file.sizeLabel} · 约 {file.plotCount} 个图斑</span>
                      </div>
                      <span className="task-source-chip">SHP</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="task-detail-columns">
              <div className="task-detail-section">
                <div className="task-section-heading">
                  <strong>图斑样例进度</strong>
                  <span>用于展示任务包内的示例图斑状态</span>
                </div>
                <div className="task-plot-list">
                  {task.plots.map((plot) => (
                    <div key={plot.id} className="task-plot-item">
                      <div>
                        <strong>{plot.name}</strong>
                        <span>{plot.id}</span>
                      </div>
                      <div className="task-plot-meta">
                        <span>{plot.owner}</span>
                        <span className={`status-pill ${assignmentTone(plot.status)}`}>{plot.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="task-detail-section">
                <div className="task-section-heading">
                  <strong>核查要求</strong>
                  <span>该内容会同步到 App 端个人用户，作为现场执行说明</span>
                </div>
                <div className="task-requirement-card">
                  <p>{task.requirement}</p>
                  <div className="task-requirement-meta">
                    <span>创建时间：{formatDate(task.createdAt) || "-"}</span>
                    <span>下发时间：{formatDate(task.dispatchedAt) || "-"}</span>
                    <span>回传时间：{formatDate(task.submittedAt) || "-"}</span>
                    <span>平台更新时间：{formatDate(task.platformUpdatedAt) || "-"}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function TaskCreateModal({ users, onClose, onSubmit }) {
  const areaCityOptions = useMemo(() => getCityOptions(users), [users]);

  const [draft, setDraft] = useState(() => ({
    title: "",
    selectedAreaKeys: [],
    deadline: "2026-06-05T18:00",
    sourceFiles: [],
    managerIds: [],
    inspectorIds: [],
    requirement: "",
    description: "",
  }));
  const [pickerMode, setPickerMode] = useState(null);
  const lastAreaSignatureRef = useRef("");

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
    const areaSignature = draft.selectedAreaKeys.slice().sort().join("|");

    setDraft((current) => {
      if (lastAreaSignatureRef.current !== areaSignature) {
        lastAreaSignatureRef.current = areaSignature;
        return { ...current, managerIds: availableManagers.map((user) => user.id) };
      }

      const nextManagerIds = current.managerIds.filter((id) => availableManagerIds.has(id));
      return nextManagerIds.length === current.managerIds.length
        ? current
        : { ...current, managerIds: nextManagerIds };
    });
  }, [availableManagers, draft.selectedAreaKeys]);

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
  const totalPlotEstimate = draft.sourceFiles.reduce((sum, file) => sum + file.plotCount, 0);
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

  const handleSubmit = () => {
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

    onSubmit(draft);
  };

  const sourceTriggerText = draft.sourceFiles.length
    ? `${draft.sourceFiles[0].name}${draft.sourceFiles.length > 1 ? ` 等 ${draft.sourceFiles.length} 个文件` : ""}`
    : "选择 SHP / ZIP 文件";

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
                    <span>{`已关联 ${draft.sourceFiles.length} 个来源文件，预估 ${totalPlotEstimate} 个图斑`}</span>
                  ) : null}
                </label>
                <div className="task-upload-list task-upload-list-compact">
                  {draft.sourceFiles.length ? (
                    draft.sourceFiles.map((file) => (
                      <div key={file.id} className="task-upload-item">
                        <div>
                          <strong>{file.name}</strong>
                          <span>{file.sizeLabel} · 约 {file.plotCount} 个图斑</span>
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
                        ? "当前区域下暂无可联动的市级管理员"
                        : "请先选择下发区域，系统会自动联动市级管理员"}
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
                    selectedInspectors.map((user) => (
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
                        ? "当前还没有指定执行用户，请从角色管理表单中选择"
                        : "请先选择下发区域，再从角色管理表单中筛选执行用户"}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </aside>
        </div>

        <div className="export-modal-footer">
          <button type="button" className="ghost-button slim-button" onClick={onClose}>
            取消
          </button>
          <button type="button" className="primary-button slim-button" onClick={handleSubmit}>
            保存草稿
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



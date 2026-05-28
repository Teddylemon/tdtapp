export const USER_STORAGE_KEY = "tdt-role-user-state";
export const PROVINCE_NAME = "湖北省";
export const ALL_COUNTIES = "全部区县";

export const USER_ROLE_OPTIONS = [
  "省级管理员",
  "省级职员",
  "市级管理员",
  "市级职员",
  "县级管理员",
  "县级职员",
];

export const USER_LEVEL_OPTIONS = ["省级", "市级", "县级"];

export const CITY_COUNTY_MAP = {
  武汉市: ["洪山区", "江夏区", "东西湖区"],
  襄阳市: ["襄城区", "樊城区", "宜城市"],
  宜昌市: ["西陵区", "夷陵区", "宜都市"],
  鄂州市: ["鄂城区", "华容区", "梁子湖区"],
};

function createUser(record) {
  return {
    province: PROVINCE_NAME,
    city: "",
    county: "",
    organization: "",
    title: "",
    ...record,
  };
}

export const MOCK_USERS = [
  createUser({
    id: "2000001",
    nickname: "陈青山",
    phone: "13807110001",
    city: "省级",
    county: "-",
    organization: "湖北省自然资源厅",
    title: "省级任务平台主管",
    role: "省级管理员",
  }),
  createUser({
    id: "2000002",
    nickname: "周颖",
    phone: "13807110002",
    city: "省级",
    county: "-",
    organization: "湖北省自然资源厅",
    title: "省级核查专员",
    role: "省级职员",
  }),
  createUser({
    id: "2000003",
    nickname: "王敏",
    phone: "13807110003",
    city: "武汉市",
    county: "全市统筹",
    organization: "武汉市自然资源和城乡建设局",
    title: "市级管理员",
    role: "市级管理员",
  }),
  createUser({
    id: "2000004",
    nickname: "张磊",
    phone: "13807110004",
    city: "武汉市",
    county: "全市统筹",
    organization: "武汉市自然资源和城乡建设局",
    title: "市级核查员",
    role: "市级职员",
  }),
  createUser({
    id: "2000005",
    nickname: "李璐",
    phone: "13807110005",
    city: "武汉市",
    county: "洪山区",
    organization: "洪山区自然资源和规划局",
    title: "县级管理员",
    role: "县级管理员",
  }),
  createUser({
    id: "2000006",
    nickname: "赵航",
    phone: "13807110006",
    city: "武汉市",
    county: "洪山区",
    organization: "洪山区自然资源和规划局",
    title: "县级核查员",
    role: "县级职员",
  }),
  createUser({
    id: "2000007",
    nickname: "吴倩",
    phone: "13807110007",
    city: "武汉市",
    county: "江夏区",
    organization: "江夏区自然资源和规划局",
    title: "县级核查员",
    role: "县级职员",
  }),
  createUser({
    id: "2000008",
    nickname: "孙博",
    phone: "13807110008",
    city: "武汉市",
    county: "东西湖区",
    organization: "东西湖区自然资源和规划局",
    title: "县级核查员",
    role: "县级职员",
  }),
  createUser({
    id: "2000009",
    nickname: "高宁",
    phone: "13807110009",
    city: "襄阳市",
    county: "全市统筹",
    organization: "襄阳市自然资源和规划局",
    title: "市级管理员",
    role: "市级管理员",
  }),
  createUser({
    id: "2000010",
    nickname: "胡凯",
    phone: "13807110010",
    city: "襄阳市",
    county: "全市统筹",
    organization: "襄阳市自然资源和规划局",
    title: "市级核查员",
    role: "市级职员",
  }),
  createUser({
    id: "2000011",
    nickname: "杜晨",
    phone: "13807110011",
    city: "襄阳市",
    county: "樊城区",
    organization: "樊城区自然资源和规划局",
    title: "县级核查员",
    role: "县级职员",
  }),
  createUser({
    id: "2000012",
    nickname: "郑媛",
    phone: "13807110012",
    city: "襄阳市",
    county: "宜城市",
    organization: "宜城市自然资源和规划局",
    title: "县级核查员",
    role: "县级职员",
  }),
  createUser({
    id: "2000013",
    nickname: "何松",
    phone: "13807110013",
    city: "宜昌市",
    county: "全市统筹",
    organization: "宜昌市自然资源和城乡建设局",
    title: "市级管理员",
    role: "市级管理员",
  }),
  createUser({
    id: "2000014",
    nickname: "袁珊",
    phone: "13807110014",
    city: "宜昌市",
    county: "夷陵区",
    organization: "夷陵区自然资源和规划局",
    title: "县级核查员",
    role: "县级职员",
  }),
  createUser({
    id: "2000015",
    nickname: "潘越",
    phone: "13807110015",
    city: "宜昌市",
    county: "西陵区",
    organization: "西陵区自然资源和规划局",
    title: "县级核查员",
    role: "县级职员",
  }),
  createUser({
    id: "2000016",
    nickname: "宋琪",
    phone: "13807110016",
    city: "鄂州市",
    county: "全市统筹",
    organization: "鄂州市自然资源和规划局",
    title: "市级管理员",
    role: "市级管理员",
  }),
  createUser({
    id: "2000017",
    nickname: "冯恺",
    phone: "13807110017",
    city: "鄂州市",
    county: "鄂城区",
    organization: "鄂城区自然资源和规划局",
    title: "县级核查员",
    role: "县级职员",
  }),
  createUser({
    id: "2000018",
    nickname: "姚岚",
    phone: "13807110018",
    city: "鄂州市",
    county: "华容区",
    organization: "华容区自然资源和规划局",
    title: "县级核查员",
    role: "县级职员",
  }),
];

export function getRoleLevel(role) {
  if (role.startsWith("省级")) return "省级";
  if (role.startsWith("市级")) return "市级";
  return "县级";
}

export function getCityOptions(users = MOCK_USERS) {
  return Array.from(
    new Set(
      users
        .map((user) => user.city)
        .filter((city) => city && city !== "省级"),
    ),
  );
}

export function getCountyOptions(city) {
  return city ? CITY_COUNTY_MAP[city] ?? [] : [];
}

export function readUserRecords() {
  if (typeof window === "undefined") return MOCK_USERS;
  try {
    const stored = JSON.parse(window.localStorage.getItem(USER_STORAGE_KEY) ?? "null");
    return Array.isArray(stored) && stored.length > 0 ? stored : MOCK_USERS;
  } catch {
    return MOCK_USERS;
  }
}

export function persistUserRecords(users) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(users));
}

export function getAreaText(user) {
  return [user.province, user.city, user.county].filter(Boolean).join(" / ");
}

export function getUserDisplayName(user) {
  return `${user.nickname} · ${user.title}`;
}

export function getCityManagers(users, city) {
  return users.filter((user) => user.city === city && user.role === "市级管理员");
}

export function getAssignableInspectors(users, city, county = ALL_COUNTIES) {
  return users.filter((user) => {
    if (user.city !== city) return false;
    if (!["市级职员", "县级职员"].includes(user.role)) return false;
    if (county === ALL_COUNTIES) return true;
    return user.role === "市级职员" || user.county === county;
  });
}

export function buildInspectorAssignments(users, plotCount, strategy = "average") {
  if (!users.length) return [];

  if (strategy === "county-first") {
    const weightedUsers = users.map((user) => ({
      ...user,
      weight: user.role === "县级职员" ? 2 : 1,
    }));
    const totalWeight = weightedUsers.reduce((sum, user) => sum + user.weight, 0);
    let assigned = 0;

    const assignments = weightedUsers.map((user) => {
      const plots = Math.floor((plotCount * user.weight) / totalWeight);
      assigned += plots;
      return {
        id: user.id,
        name: user.nickname,
        county: user.county,
        role: user.role,
        plots,
        completed: 0,
        status: "待接收",
      };
    });

    let remainder = plotCount - assigned;
    let index = 0;
    while (remainder > 0) {
      assignments[index % assignments.length].plots += 1;
      remainder -= 1;
      index += 1;
    }

    return assignments;
  }

  const base = Math.floor(plotCount / users.length);
  const remainder = plotCount % users.length;

  return users.map((user, index) => ({
    id: user.id,
    name: user.nickname,
    county: user.county,
    role: user.role,
    plots: base + (index < remainder ? 1 : 0),
    completed: 0,
    status: "待接收",
  }));
}

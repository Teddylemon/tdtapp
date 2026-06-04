import { useEffect, useMemo, useState } from "react";
import FilterSelect from "../../components/FilterSelect";
import Pagination from "../../components/Pagination";
import { showToast } from "../../components/utils";
import {
  CITY_COUNTY_MAP,
  MOCK_USERS,
  PROVINCE_NAME,
  USER_ROLE_OPTIONS,
  USER_LEVEL_OPTIONS,
  getAreaText,
  getCityOptions,
  getCountyOptions,
  getRoleLevel,
  persistUserRecords,
  readUserRecords,
} from "../_shared/userDirectory";
import "./role-management.css";

const defaultForm = {
  id: "",
  nickname: "",
  phone: "",
  organization: "",
  title: "",
  role: "市级职员",
  province: PROVINCE_NAME,
  city: Object.keys(CITY_COUNTY_MAP)[0],
  county: "全市统筹",
};

function maskPhone(phone) {
  if (phone.length !== 11) return phone;
  return `${phone.slice(0, 3)}****${phone.slice(-4)}`;
}

function nextUserId(users) {
  const maxId = users.reduce((max, user) => Math.max(max, Number(user.id) || 0), 2000000);
  return String(maxId + 1).padStart(7, "0");
}

function normalizeFormByRole(form) {
  const next = { ...form };

  if (next.role.startsWith("公众")) {
    next.city = "-";
    next.county = "-";
    next.organization = next.organization || "公众注册用户";
    next.title = next.title || "公众用户";
    return next;
  }

  if (next.role.startsWith("省级")) {
    next.city = "省级";
    next.county = "-";
    next.organization = next.organization || "湖北省自然资源厅";
    return next;
  }

  if (!next.city || next.city === "省级") {
    next.city = Object.keys(CITY_COUNTY_MAP)[0];
  }

  if (next.role.startsWith("市级")) {
    next.county = "全市统筹";
    return next;
  }

  const counties = getCountyOptions(next.city);
  if (!counties.includes(next.county)) {
    next.county = counties[0] ?? "";
  }
  return next;
}

function ActionIcon({ type }) {
  return (
    <span className={`button-icon button-icon-${type}`} aria-hidden="true">
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        {type === "edit" && (
          <>
            <path d="m3 11.8 1.1-3.3L10.8 1.8a1.4 1.4 0 0 1 2 2L6.1 10.5 3 11.8Z" />
            <path d="M9.7 2.9 12 5.2" />
          </>
        )}
        {type === "reset" && (
          <>
            <path d="M13 8a5 5 0 0 1-1.3 3.4" />
            <path d="M3 8a5 5 0 0 1 8.5-3.5" />
            <path d="m13.2 6.2-1.7-1.8-2.1 1.5" />
            <path d="m2.8 9.8 1.7 1.8 2.1-1.5" />
          </>
        )}
        {type === "delete" && (
          <>
            <path d="M3.5 4.5h9" />
            <path d="M6.2 4.5V3.2h3.6v1.3" />
            <path d="m5 4.5.6 8h4.8l.6-8" />
          </>
        )}
        {type === "plus" && (
          <>
            <path d="M8 3.2v9.6" />
            <path d="M3.2 8h9.6" />
          </>
        )}
      </svg>
    </span>
  );
}

function UserModal({ title, description, onClose, children, actions, wide = false }) {
  return (
    <div className="role-modal-backdrop" role="dialog" aria-modal="true" onClick={onClose}>
      <div
        className={`role-modal ${wide ? "role-modal--wide" : ""}`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="role-modal-head">
          <div>
            <h3>{title}</h3>
            {description ? <p>{description}</p> : null}
          </div>
          <button type="button" className="role-modal-close" onClick={onClose} aria-label="关闭">
            ×
          </button>
        </div>
        <div className="role-modal-body">{children}</div>
        {actions ? <div className="role-modal-actions">{actions}</div> : null}
      </div>
    </div>
  );
}

export default function RoleManagementPage() {
  const [users, setUsers] = useState(readUserRecords);
  const [keyword, setKeyword] = useState("");
  const [roleFilter, setRoleFilter] = useState([]);
  const [levelFilter, setLevelFilter] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [editingUserId, setEditingUserId] = useState(null);
  const [deleteUserId, setDeleteUserId] = useState(null);
  const [form, setForm] = useState(defaultForm);

  useEffect(() => {
    persistUserRecords(users);
  }, [users]);

  const cityOptions = useMemo(() => getCityOptions(users), [users]);

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const normalizedKeyword = keyword.trim().toLowerCase();
      const matchKeyword =
        normalizedKeyword === "" ||
        [
          user.id,
          user.nickname,
          user.phone,
          user.organization,
          user.title,
          user.role,
          user.city,
          user.county,
        ].some((field) => field.toLowerCase().includes(normalizedKeyword));

      const matchRole = roleFilter.length === 0 || roleFilter.includes(user.role);
      const level = getRoleLevel(user.role);
      const matchLevel = levelFilter.length === 0 || levelFilter.includes(level);
      return matchKeyword && matchRole && matchLevel;
    });
  }, [keyword, levelFilter, roleFilter, users]);

  const roleCounts = useMemo(
    () =>
      users.reduce(
        (acc, user) => {
          acc[user.role] = (acc[user.role] ?? 0) + 1;
          return acc;
        },
        Object.fromEntries(USER_ROLE_OPTIONS.map((role) => [role, 0])),
      ),
    [users],
  );

  const levelCounts = useMemo(
    () =>
      users.reduce(
        (acc, user) => {
          const level = getRoleLevel(user.role);
          acc[level] = (acc[level] ?? 0) + 1;
          return acc;
        },
        Object.fromEntries(USER_LEVEL_OPTIONS.map((level) => [level, 0])),
      ),
    [users],
  );

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));

  useEffect(() => {
    setPage((current) => Math.min(current, totalPages));
  }, [totalPages]);

  const pagedUsers = filteredUsers.slice((page - 1) * pageSize, page * pageSize);
  const activeUser = users.find((user) => user.id === editingUserId) ?? null;
  const deleteUser = users.find((user) => user.id === deleteUserId) ?? null;

  const openCreateModal = () => {
    setEditingUserId("new");
    setForm(
      normalizeFormByRole({
        ...defaultForm,
        id: nextUserId(users),
        city: cityOptions[0] ?? Object.keys(CITY_COUNTY_MAP)[0],
      }),
    );
  };

  const openEditModal = (user) => {
    setEditingUserId(user.id);
    setForm(normalizeFormByRole({ ...user }));
  };

  const updateForm = (patch) => {
    setForm((current) => normalizeFormByRole({ ...current, ...patch }));
  };

  const saveUser = () => {
    if (!/^\d{7}$/.test(form.id)) {
      showToast("用户 ID 需为 7 位数字", "warning");
      return;
    }

    if (!/^1\d{10}$/.test(form.phone)) {
      showToast("请填写正确的手机号", "warning");
      return;
    }

    if (!form.nickname.trim() || !form.organization.trim() || !form.title.trim()) {
      showToast("请填写完整的用户信息", "warning");
      return;
    }

    const duplicated = users.some((user) => user.id === form.id && user.id !== activeUser?.id);
    if (duplicated) {
      showToast("用户 ID 已存在，请更换后再保存", "warning");
      return;
    }

    if (editingUserId === "new") {
      setUsers((current) => [{ ...form }, ...current]);
      setPage(1);
      showToast(`已新增用户 ${form.nickname}`);
    } else if (activeUser) {
      setUsers((current) =>
        current.map((user) => (user.id === activeUser.id ? { ...form } : user)),
      );
      showToast(`已更新用户 ${form.nickname}`);
    }

    setEditingUserId(null);
    setForm(defaultForm);
  };

  const resetPassword = (user) => {
    showToast(`已为 ${user.nickname} 重置密码`);
  };

  const confirmDelete = () => {
    if (!deleteUser) return;
    setUsers((current) => current.filter((user) => user.id !== deleteUser.id));
    showToast(`已删除用户 ${deleteUser.nickname}`, "warning");
    setDeleteUserId(null);
  };

  const countyOptions = getCountyOptions(form.city);
  const currentLevel = getRoleLevel(form.role);

  return (
    <div className="page-content page-content--list role-page">
      <article className="panel list-shell role-list-shell">
        <div className="list-shell-top">
          <div className="list-shell-search search-slot">
            <input
              className="input search-input"
              value={keyword}
              onChange={(event) => {
                setKeyword(event.target.value);
                setPage(1);
              }}
              placeholder="搜索用户ID、姓名、手机号、区域、组织或岗位"
            />
          </div>
        </div>

        <div className="list-shell-filters">
          <div className="filter-cluster role-filter-cluster">
            <FilterSelect
              placeholder="角色"
              options={USER_ROLE_OPTIONS}
              onChange={(selected, allSelected) => {
                setRoleFilter(allSelected ? [] : selected);
                setPage(1);
              }}
              optionCounts={roleCounts}
            />
            <FilterSelect
              placeholder="层级"
              options={USER_LEVEL_OPTIONS}
              onChange={(selected, allSelected) => {
                setLevelFilter(allSelected ? [] : selected);
                setPage(1);
              }}
              optionCounts={levelCounts}
            />
          </div>
          <div className="filter-actions">
            <button type="button" className="primary-button slim-button" onClick={openCreateModal}>
              <ActionIcon type="plus" />
              <span>新增用户</span>
            </button>
          </div>
        </div>

        <div className="list-shell-body">
          <div className="role-table-scroll">
            <div className="table-shell selectable role-table-shell">
              <div className="table-row table-head role-cols">
                <span>用户ID</span>
                <span>姓名</span>
                <span>手机号</span>
                <span>省 / 市 / 县</span>
                <span>组织机构</span>
                <span>角色 / 岗位</span>
                <span>操作</span>
              </div>
              {pagedUsers.map((user) => (
                <div key={user.id} className="table-row role-cols">
                  <span className="role-code-cell">{user.id}</span>
                  <span className="role-name-cell">
                    <strong>{user.nickname}</strong>
                    <em>{getRoleLevel(user.role)}</em>
                  </span>
                  <span>{maskPhone(user.phone)}</span>
                  <span className="role-area-cell">{getAreaText(user)}</span>
                  <span>{user.organization}</span>
                  <span className="role-job-cell">
                    <strong>{user.role}</strong>
                    <em>{user.title}</em>
                  </span>
                  <span className="role-actions-cell">
                    <button
                      type="button"
                      className="inline-button action-view"
                      onClick={() => openEditModal(user)}
                      aria-label="编辑用户"
                      title="编辑用户"
                    >
                      <ActionIcon type="edit" />
                      <span className="role-action-label">编辑</span>
                    </button>
                    <button
                      type="button"
                      className="inline-button action-view"
                      onClick={() => resetPassword(user)}
                      aria-label="重置密码"
                      title="重置密码"
                    >
                      <ActionIcon type="reset" />
                      <span className="role-action-label">重置密码</span>
                    </button>
                    <button
                      type="button"
                      className="inline-button action-view role-inline-danger"
                      onClick={() => setDeleteUserId(user.id)}
                      aria-label="删除用户"
                      title="删除用户"
                    >
                      <ActionIcon type="delete" />
                      <span className="role-action-label">删除</span>
                    </button>
                  </span>
                </div>
              ))}
              {pagedUsers.length === 0 ? (
                <div className="role-empty">当前筛选条件下没有用户记录</div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="list-shell-footer">
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            totalLabel={`共 ${filteredUsers.length} 条`}
            onChangePage={setPage}
            pageSize={pageSize}
            pageSizeOptions={[10, 20, 30, 50]}
            onChangePageSize={(size) => {
              setPageSize(size);
              setPage(1);
            }}
          />
        </div>
      </article>

      {editingUserId !== null ? (
        <UserModal
          title={editingUserId === "new" ? "新增用户" : "编辑用户"}
          description="统一维护省、市、县和公众角色用户，任务下发模块会直接拉取这里的数据。"
          onClose={() => setEditingUserId(null)}
          actions={
            <>
              <button type="button" className="ghost-button slim-button" onClick={() => setEditingUserId(null)}>
                取消
              </button>
              <button type="button" className="primary-button slim-button" onClick={saveUser}>
                保存用户
              </button>
            </>
          }
          wide
        >
          <div className="role-form-surface">
            <div className="form-grid">
              <div className="form-block">
                <label>用户ID</label>
                <input
                  className="input"
                  type="text"
                  maxLength="7"
                  value={form.id}
                  onChange={(event) => updateForm({ id: event.target.value })}
                  placeholder="7位数字"
                />
              </div>
              <div className="form-block">
                <label>姓名</label>
                <input
                  className="input"
                  type="text"
                  value={form.nickname}
                  onChange={(event) => updateForm({ nickname: event.target.value })}
                  placeholder="请输入姓名"
                />
              </div>
              <div className="form-block">
                <label>手机号</label>
                <input
                  className="input"
                  type="text"
                  maxLength="11"
                  value={form.phone}
                  onChange={(event) => updateForm({ phone: event.target.value })}
                  placeholder="请输入手机号"
                />
              </div>
              <div className="form-block">
                <label>角色</label>
                <select
                  className="select"
                  value={form.role}
                  onChange={(event) => updateForm({ role: event.target.value })}
                >
                  {USER_ROLE_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-block">
                <label>省份</label>
                <input className="input" type="text" value={form.province} readOnly />
              </div>
              <div className="form-block">
                <label>层级</label>
                <input className="input" type="text" value={currentLevel} readOnly />
              </div>
              <div className="form-block">
                <label>市州</label>
                <select
                  className="select"
                  value={form.city}
                  disabled={currentLevel === "省级" || currentLevel === "公众"}
                  onChange={(event) => updateForm({ city: event.target.value })}
                >
                  {currentLevel === "省级" ? (
                    <option value="省级">省级</option>
                  ) : currentLevel === "公众" ? (
                    <option value="-">-</option>
                  ) : (
                    cityOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))
                  )}
                </select>
              </div>
              <div className="form-block">
                <label>区县</label>
                <select
                  className="select"
                  value={form.county}
                  disabled={currentLevel === "省级" || currentLevel === "市级" || currentLevel === "公众"}
                  onChange={(event) => updateForm({ county: event.target.value })}
                >
                  {currentLevel === "省级" ? <option value="-">-</option> : null}
                  {currentLevel === "市级" ? <option value="全市统筹">全市统筹</option> : null}
                  {currentLevel === "公众" ? <option value="-">-</option> : null}
                  {currentLevel === "县级"
                    ? countyOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))
                    : null}
                </select>
              </div>
              <div className="form-block">
                <label>组织机构</label>
                <input
                  className="input"
                  type="text"
                  value={form.organization}
                  onChange={(event) => updateForm({ organization: event.target.value })}
                  placeholder="请输入组织机构"
                />
              </div>
              <div className="form-block">
                <label>岗位</label>
                <input
                  className="input"
                  type="text"
                  value={form.title}
                  onChange={(event) => updateForm({ title: event.target.value })}
                  placeholder="请输入岗位名称"
                />
              </div>
            </div>
          </div>
        </UserModal>
      ) : null}

      {deleteUser ? (
        <UserModal
          title="删除用户"
          description={`是否确认删除用户“${deleteUser.nickname}”？`}
          onClose={() => setDeleteUserId(null)}
          actions={
            <>
              <button type="button" className="ghost-button slim-button" onClick={() => setDeleteUserId(null)}>
                取消
              </button>
              <button type="button" className="role-danger-button" onClick={confirmDelete}>
                确认删除
              </button>
            </>
          }
        />
      ) : null}
    </div>
  );
}

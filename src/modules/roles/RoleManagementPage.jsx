import { useEffect, useMemo, useState } from "react";
import FilterSelect from "../../components/FilterSelect";
import "./role-management.css";

const ROLE_OPTIONS = ["超级管理员", "行业用户", "默认角色"];

const initialUsers = [
  { id: "1000001", nickname: "macong", phone: "18612341558", organization: "平台运营中心", title: "管理员", role: "超级管理员" },
  { id: "1000002", nickname: "ceshi", phone: "15529875623", organization: "行业应用部", title: "项目专员", role: "默认角色" },
  { id: "1000003", nickname: "zhangjia", phone: "17766243188", organization: "自然资源局", title: "业务负责人", role: "行业用户" },
  { id: "1000004", nickname: "jxb_01", phone: "17699843214", organization: "行业应用部", title: "数据专员", role: "默认角色" },
  { id: "1000005", nickname: "wangwei", phone: "15812342134", organization: "平台运营中心", title: "运营专员", role: "默认角色" },
  { id: "1000006", nickname: "chenwen", phone: "15267898322", organization: "市政务办", title: "行业管理员", role: "行业用户" },
  { id: "1000007", nickname: "liulian", phone: "15844424268", organization: "平台运营中心", title: "产品经理", role: "默认角色" },
];

const emptyForm = {
  id: "",
  nickname: "",
  phone: "",
  organization: "",
  title: "",
  role: ROLE_OPTIONS[2],
};

function emitToast(message, tone = "success") {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent("tdt-toast", {
      detail: {
        id: `user-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
        message,
        tone,
      },
    }),
  );
}

function maskPhone(phone) {
  if (phone.length !== 11) return phone;
  return `${phone.slice(0, 3)}****${phone.slice(-4)}`;
}

function nextUserId(users) {
  const maxId = users.reduce((max, user) => Math.max(max, Number(user.id) || 0), 1000000);
  return String(maxId + 1).padStart(7, "0");
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
            <path d="M13 8a5 5 0 1 1-1.3-3.4" />
            <path d="M13 3.2v3.4H9.6" />
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

function Pagination({
  currentPage,
  totalPages,
  totalLabel,
  onChangePage,
  pageSize = 10,
  pageSizeOptions = [10, 20, 30],
  onChangePageSize,
}) {
  return (
    <div className="pagination">
      <div className="pagination-meta">
        <span className="pagination-total">{totalLabel}</span>
        <label className="page-size-select">
          <span>每页</span>
          <select value={pageSize} onChange={(event) => onChangePageSize?.(Number(event.target.value))}>
            {pageSizeOptions.map((option) => (
              <option key={option} value={option}>
                {option} 条
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="pagination-controls">
        <button
          type="button"
          className="page-button"
          disabled={currentPage === 1}
          onClick={() => onChangePage(Math.max(1, currentPage - 1))}
        >
          上一页
        </button>
        {Array.from({ length: Math.min(totalPages, 5) }, (_, index) => {
          const pageNumber = index + 1;
          return (
            <button
              key={pageNumber}
              type="button"
              className={`page-button ${currentPage === pageNumber ? "active" : ""}`}
              onClick={() => onChangePage(pageNumber)}
            >
              {pageNumber}
            </button>
          );
        })}
        <button
          type="button"
          className="page-button"
          disabled={currentPage === totalPages}
          onClick={() => onChangePage(Math.min(totalPages, currentPage + 1))}
        >
          下一页
        </button>
      </div>
    </div>
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
  const [users, setUsers] = useState(initialUsers);
  const [keyword, setKeyword] = useState("");
  const [roleFilter, setRoleFilter] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [editingUserId, setEditingUserId] = useState(null);
  const [deleteUserId, setDeleteUserId] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const normalizedKeyword = keyword.trim().toLowerCase();
      const matchKeyword =
        normalizedKeyword === "" ||
        [user.id, user.nickname, user.phone, user.organization, user.title]
          .some((field) => field.toLowerCase().includes(normalizedKeyword));
      const matchRole = roleFilter.length === 0 || roleFilter.includes(user.role);
      return matchKeyword && matchRole;
    });
  }, [keyword, roleFilter, users]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));

  useEffect(() => {
    setPage((current) => Math.min(current, totalPages));
  }, [totalPages]);

  const pagedUsers = filteredUsers.slice((page - 1) * pageSize, page * pageSize);
  const activeUser = users.find((user) => user.id === editingUserId) ?? null;
  const deleteUser = users.find((user) => user.id === deleteUserId) ?? null;

  const openCreateModal = () => {
    setEditingUserId("new");
    setForm({
      ...emptyForm,
      id: nextUserId(users),
    });
  };

  const openEditModal = (user) => {
    setEditingUserId(user.id);
    setForm({ ...user });
  };

  const saveUser = () => {
    if (!/^\d{7}$/.test(form.id)) {
      emitToast("用户 ID 需为 7 位数字", "warning");
      return;
    }

    if (!/^1\d{10}$/.test(form.phone)) {
      emitToast("请填写正确的手机号", "warning");
      return;
    }

    if (!form.nickname.trim() || !form.organization.trim() || !form.title.trim()) {
      emitToast("请填写完整的用户信息", "warning");
      return;
    }

    if (editingUserId === "new") {
      setUsers((current) => [{ ...form }, ...current]);
      setPage(1);
      emitToast(`已新增用户 ${form.nickname}`);
    } else if (activeUser) {
      setUsers((current) =>
        current.map((user) => (user.id === activeUser.id ? { ...form } : user)),
      );
      emitToast(`已更新用户 ${form.nickname}`);
    }

    setEditingUserId(null);
    setForm(emptyForm);
  };

  const resetPassword = (user) => {
    emitToast(`已为 ${user.nickname} 重置密码`);
  };

  const confirmDelete = () => {
    if (!deleteUser) return;
    setUsers((current) => current.filter((user) => user.id !== deleteUser.id));
    emitToast(`已删除用户 ${deleteUser.nickname}`, "warning");
    setDeleteUserId(null);
  };

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
              placeholder="搜索用户ID、昵称、手机号、组织机构或职务"
            />
          </div>
        </div>

        <div className="list-shell-filters">
          <div className="filter-cluster role-filter-cluster">
            <FilterSelect
              placeholder="角色"
              options={ROLE_OPTIONS}
              onChange={(selected, allSelected) => {
                setRoleFilter(allSelected ? [] : selected);
                setPage(1);
              }}
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
              <span>昵称</span>
              <span>绑定手机号</span>
              <span>组织机构</span>
              <span>职务</span>
              <span>角色</span>
              <span>操作</span>
            </div>
            {pagedUsers.map((user) => (
              <div key={user.id} className="table-row role-cols">
                <span className="role-code-cell">{user.id}</span>
                <span className="role-name-cell">
                  <strong>{user.nickname}</strong>
                </span>
                <span>{maskPhone(user.phone)}</span>
                <span>{user.organization}</span>
                <span>{user.title}</span>
                <span>{user.role}</span>
                <span className="role-actions-cell">
                  <button type="button" className="inline-button action-view" onClick={() => openEditModal(user)}>
                    <ActionIcon type="edit" />
                    <span>编辑</span>
                  </button>
                  <button type="button" className="inline-button action-view" onClick={() => resetPassword(user)}>
                    <ActionIcon type="reset" />
                    <span>重置密码</span>
                  </button>
                  <button type="button" className="inline-button action-view role-inline-danger" onClick={() => setDeleteUserId(user.id)}>
                    <ActionIcon type="delete" />
                    <span>删除</span>
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
          description="维护用户角色信息，用户ID固定为7位数字。"
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
                  onChange={(event) => setForm((current) => ({ ...current, id: event.target.value }))}
                  placeholder="7位数字"
                />
              </div>
              <div className="form-block">
                <label>昵称</label>
                <input
                  className="input"
                  type="text"
                  value={form.nickname}
                  onChange={(event) => setForm((current) => ({ ...current, nickname: event.target.value }))}
                  placeholder="请输入昵称"
                />
              </div>
              <div className="form-block">
                <label>绑定手机号</label>
                <input
                  className="input"
                  type="text"
                  maxLength="11"
                  value={form.phone}
                  onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                  placeholder="请输入手机号"
                />
              </div>
              <div className="form-block">
                <label>组织机构</label>
                <input
                  className="input"
                  type="text"
                  value={form.organization}
                  onChange={(event) => setForm((current) => ({ ...current, organization: event.target.value }))}
                  placeholder="请输入组织机构"
                />
              </div>
              <div className="form-block">
                <label>职务</label>
                <input
                  className="input"
                  type="text"
                  value={form.title}
                  onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                  placeholder="请输入职务"
                />
              </div>
              <div className="form-block">
                <label>角色</label>
                <select
                  className="select"
                  value={form.role}
                  onChange={(event) => setForm((current) => ({ ...current, role: event.target.value }))}
                >
                  {ROLE_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </UserModal>
      ) : null}

      {deleteUser ? (
        <UserModal
          title="删除用户"
          description={`确认删除用户“${deleteUser.nickname}”吗？此操作仅影响当前演示数据。`}
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
        >
          <div className="role-form-surface role-delete-note">
            <p>删除后该用户将从当前用户角色管理列表中移除。</p>
          </div>
        </UserModal>
      ) : null}
    </div>
  );
}

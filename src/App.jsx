import { useEffect, useState } from "react";
import {
  HashRouter,
  Navigate,
  NavLink,
  Outlet,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import MonitoringPageModule from "./modules/monitoring/MonitoringPage";
import ReleaseNotesManager from "./modules/release/ReleaseNotesManager";
import RoleManagementPageModule from "./modules/roles/RoleManagementPage";
import AnalysisPage from "./modules/analysis/AnalysisPage";
import { ReviewListPage, ReviewDetailPage } from "./modules/review/ReviewPage";
import { MarkersListPage, MarkersDetailPage } from "./modules/markers/MarkersPage";
import { TopicListPage, TopicDetailPage } from "./modules/topic/TopicPage";
import { FeedbackListPage, FeedbackDetailPage } from "./modules/feedback/FeedbackPage";
import { NotificationListPage, NotificationDetailPage } from "./modules/notifications/NotificationPage";
import { TaskListPage, TaskCreatePage, TaskDetailPage } from "./modules/tasks/TaskPage";
import { BannerListPage, BannerDetailPage } from "./modules/banners/BannerPage";

const menuSections = [
  {
    group: null,
    items: [{ path: "/analysis", label: "用户行为分析", icon: "analysis" }],
  },
  {
    group: "平台下发",
    items: [
      { path: "/topic", label: "主题地图发布管理", icon: "topic" },
      { path: "/tasks", label: "任务下发管理", icon: "tasks" },
      { path: "/notifications", label: "消息推送管理", icon: "notifications" },
      { path: "/banners", label: "通知公告管理", icon: "banners" },
      { path: "/release-notes", label: "更新日志管理", icon: "release" },
    ],
  },
  {
    group: "用户上传",
    items: [
      { path: "/review", label: "纠错反馈管理", icon: "review" },
      { path: "/markers", label: "标签上传管理", icon: "markers" },
      { path: "/feedback", label: "意见反馈管理", icon: "feedback" },
    ],
  },
  {
    group: "平台管理",
    items: [
      { path: "/ops", label: "日志与监控", icon: "ops" },
      { path: "/system/users", label: "用户角色管理", icon: "system" },
    ],
  },
];

const flattenedMenuItems = menuSections.flatMap((section) => section.items);

function App() {
  return (
    <HashRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/" element={<Navigate to="/analysis" replace />} />
        <Route element={<AppLayoutShell />}>
          <Route path="/analysis" element={<AnalysisPage />} />
          <Route path="/review" element={<ReviewListPage />} />
          <Route path="/review/:reviewId" element={<ReviewDetailPage />} />
          <Route path="/markers" element={<MarkersListPage />} />
          <Route path="/markers/:reviewId" element={<MarkersDetailPage />} />
          <Route path="/topic" element={<TopicListPage />} />
          <Route path="/topic/:topicId" element={<TopicDetailPage />} />
          <Route path="/feedback" element={<FeedbackListPage />} />
          <Route path="/feedback/:feedbackId" element={<FeedbackDetailPage />} />
          <Route path="/notifications" element={<NotificationListPage />} />
          <Route path="/notifications/:notificationId" element={<NotificationDetailPage />} />
          <Route path="/banners" element={<BannerListPage />} />
          <Route path="/banners/:bannerId" element={<BannerDetailPage />} />
          <Route path="/tasks" element={<TaskListPage />} />
          <Route path="/tasks/new" element={<TaskCreatePage />} />
          <Route path="/tasks/:taskId" element={<TaskDetailPage />} />
          <Route path="/release-notes" element={<ReleaseNotesManager />} />
          <Route path="/ops" element={<MonitoringPageModule />} />
          <Route path="/system" element={<Navigate to="/system/users" replace />} />
          <Route path="/system/:tab" element={<RoleManagementPageModule />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}

function resolveRouteMeta(pathname) {
  if (pathname.startsWith("/system/")) return { title: "用户角色管理", parent: "" };
  if (pathname.startsWith("/tasks/")) return { title: "", parent: "任务下发管理", hideHeader: true };
  if (pathname.startsWith("/review/")) return { title: "", parent: "纠错反馈管理", hideHeader: true };
  if (pathname.startsWith("/markers/")) return { title: "", parent: "标签上传管理", hideHeader: true };
  if (pathname.startsWith("/topic/")) return { title: "", parent: "主题地图发布管理", hideHeader: true };
  if (pathname.startsWith("/feedback/")) return { title: "", parent: "意见反馈管理", hideHeader: true };
  if (pathname.startsWith("/notifications/")) return { title: "", parent: "消息推送管理", hideHeader: true };
  if (pathname.startsWith("/banners/")) return { title: "", parent: "通知公告管理", hideHeader: true };
  if (pathname.startsWith("/tasks")) return { title: "任务下发管理", parent: "" };

  const item = flattenedMenuItems.find((entry) => entry.path === pathname);
  return item ? { title: item.label, parent: "" } : { title: "用户行为分析", parent: "" };
}

function AppLayoutShell() {
  const location = useLocation();
  const currentMeta = resolveRouteMeta(location.pathname);
  const [collapsed, setCollapsed] = useState(false);
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handleToast = (event) => {
      const payload = event.detail;
      if (!payload?.message) return;
      setToasts((current) => [...current, payload]);
      window.setTimeout(() => {
        setToasts((current) => current.filter((item) => item.id !== payload.id));
      }, 2600);
    };

    window.addEventListener("tdt-toast", handleToast);
    return () => window.removeEventListener("tdt-toast", handleToast);
  }, []);

  return (
    <div className={`app-shell ${collapsed ? "sidebar-collapsed" : ""}`}>
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-brand-main">
            <div className="sidebar-brand-mark" aria-hidden="true">
              <span className="brand-tile brand-tile-a" />
              <span className="brand-tile brand-tile-b" />
              <span className="brand-tile brand-tile-c" />
            </div>
            <div className="sidebar-brand-copy">
              <strong>天地图后台</strong>
            </div>
          </div>
          <button
            type="button"
            className="sidebar-toggle"
            aria-label={collapsed ? "展开侧边栏" : "收起侧边栏"}
            onClick={() => setCollapsed((value) => !value)}
          >
            <ToggleIcon collapsed={collapsed} />
          </button>
        </div>

        <nav className="menu-tree" aria-label="平台菜单">
          {menuSections.map((section) => (
            <div key={section.group ?? "_root"} className="menu-section">
              {!collapsed && section.group ? <div className="menu-group-label">{section.group}</div> : null}
              {section.items.map((item) => {
                const exactActive = location.pathname === item.path;
                const prefixActive = !item.children && location.pathname.startsWith(`${item.path}/`);
                const childActive = item.children?.some(
                  (child) => location.pathname === child.path || location.pathname.startsWith(`${child.path}/`),
                );
                const active = exactActive || prefixActive || childActive;

                return (
                  <div key={item.path} className={`menu-group ${active ? "active" : ""}`}>
                    <NavLink
                      to={item.path}
                      className={() =>
                        `menu-item ${exactActive || prefixActive ? "active" : childActive ? "branch-active" : ""}`.trim()
                      }
                      title={collapsed ? item.label : undefined}
                    >
                      <NavIcon type={item.icon} />
                      <span className="menu-item-text">{item.label}</span>
                    </NavLink>
                    {!collapsed && item.children?.length ? (
                      <div className="menu-children">
                        {item.children.map((child) => {
                          const childActive =
                            location.pathname === child.path || location.pathname.startsWith(`${child.path}/`);
                          return (
                            <NavLink
                              key={child.path}
                              to={child.path}
                              className={() => `menu-subitem ${childActive ? "active" : ""}`}
                            >
                              <span className="menu-subitem-dot" aria-hidden="true" />
                              <span>{child.label}</span>
                            </NavLink>
                          );
                        })}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-card">
            <div className="user-avatar">管</div>
            <div className="user-meta">
              <strong>平台管理员</strong>
              <span>admin@tianditu.cn</span>
            </div>
          </div>
        </div>
      </aside>

      <main className="main-panel">
        {!currentMeta.hideHeader ? (
          <header className="topbar">
            <div>
              <h1>{currentMeta.title}</h1>
            </div>
          </header>
        ) : null}
        <Outlet />
        <ToastViewport toasts={toasts} />
      </main>
    </div>
  );
}

function ToastViewport({ toasts }) {
  return (
    <div className="toast-viewport" aria-live="polite" aria-atomic="true">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast-item ${toast.tone ?? "default"}`}>
          <span>{toast.message}</span>
        </div>
      ))}
    </div>
  );
}

function ToggleIcon({ collapsed }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 5.5h8" />
      <path d="M4 10h8" />
      <path d="M4 14.5h8" />
      {collapsed ? <path d="m12 6 4 4-4 4" /> : <path d="m14 6-4 4 4 4" />}
    </svg>
  );
}

function NavIcon({ type }) {
  return (
    <span className={`nav-icon nav-icon-${type}`} aria-hidden="true">
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        {type === "analysis" && (
          <>
            <path d="M4 15V9" />
            <path d="M10 15V5" />
            <path d="M16 15v-7" />
          </>
        )}
        {type === "review" && (
          <>
            <rect x="4" y="4" width="12" height="12" rx="2" />
            <path d="m7.5 10 1.8 1.8 3.6-3.6" />
          </>
        )}
        {type === "markers" && (
          <>
            <circle cx="10" cy="7.5" r="3" />
            <path d="M10 10.5v5" />
            <path d="m7.5 14.5 2.5 2.5 2.5-2.5" />
          </>
        )}
        {type === "topic" && (
          <>
            <path d="M4 6h12" />
            <path d="M4 10h8" />
            <path d="M4 14h12" />
          </>
        )}
        {type === "release" && (
          <>
            <path d="M6 4.5v11" />
            <path d="M14 4.5v11" />
            <path d="M6 8h8" />
            <path d="M6 12h8" />
          </>
        )}
        {type === "feedback" && <path d="M5 6.5h10v7H9l-3.5 2v-2H5z" />}
        {type === "notifications" && (
          <>
            <path d="M10 3a5 5 0 0 1 5 5v2.5l1.5 1.5H3.5L5 10.5V8a5 5 0 0 1 5-5z" />
            <path d="M8 15.5a2 2 0 0 0 4 0" />
          </>
        )}
        {type === "ops" && <path d="M4 13h2.5l1.5-6 2.5 9 1.5-5H16" />}
        {type === "tasks" && (
          <>
            <rect x="4" y="4" width="12" height="12" rx="2" />
            <path d="m6.8 8.6 1.7 1.8 4-4" />
            <path d="M6.5 12.5h7" />
          </>
        )}
        {type === "system" && (
          <>
            <circle cx="10" cy="10" r="2.4" />
            <path d="M10 4.5v1.6" />
            <path d="M10 13.9v1.6" />
            <path d="m5.7 5.7 1.1 1.1" />
            <path d="m13.2 13.2 1.1 1.1" />
            <path d="M4.5 10h1.6" />
            <path d="M13.9 10h1.6" />
          </>
        )}
        {type === "banners" && (
          <>
            <rect x="3" y="4" width="14" height="12" rx="2" />
            <path d="M3 8h14" />
            <path d="M7 12h3" />
          </>
        )}
      </svg>
    </span>
  );
}

export default App;

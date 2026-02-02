import React, { useEffect, useMemo, useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import SettingsPage from "./pages/SettingsPage";
import "../css/dashboard.css";

const API_BASE = (() => {
  const env = import.meta.env.VITE_API_BASE;
  if (env) return env;
  if (typeof window !== "undefined") {
    const url = new URL(window.location.href);
    if (url.port === "5713") url.port = "4000";
    url.pathname = "";
    url.search = "";
    url.hash = "";
    return url.origin;
  }
  return "";
})();

type NavItem = {
  label: string;
  path: string;
  icon: string;
  badge?: string;
};

type Profile = {
  role?: string | null;
  image?: string | null;
  name?: string | null;
  email?: string | null;
};

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboards", path: "/dashboard/home", icon: "📊", badge: "Pro" },
  { label: "Projects", path: "/dashboard/projects", icon: "📁" },
  { label: "Users", path: "/dashboard/users", icon: "🧑‍🤝‍🧑" },
  { label: "Analytics", path: "/dashboard/stats", icon: "📈" },
  { label: "Reviews", path: "/dashboard/review", icon: "📝" }

];

export default function Layout() {
  const location = useLocation();
  const [isNavCollapsed, setIsNavCollapsed] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>();
  const [role, setRole] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string | undefined>();
  const [email, setEmail] = useState<string | undefined>();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const isActive = useMemo(
    () => (path: string) => location.pathname.startsWith(path),
    [location.pathname],
  );

  useEffect(() => {
    let cancelled = false;
    const url = `${API_BASE}/api/auth/profile`;
    fetch(url, { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: Profile | null) => {
        if (!cancelled && data) {
          if (data.image) setAvatarUrl(data.image);
          if (data.role) setRole(data.role);
          if (data.name) setDisplayName(data.name);
          if (data.email) setEmail(data.email);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const visibleNavItems = useMemo(() => {
    const isReviewer = role === "admin" || role === "reviewer";
    return NAV_ITEMS.filter((item) => {
      if (item.path === "/dashboard/review") return isReviewer;
      return true;
    });
  }, [role]);

  const handleLogout = () => {
    const url = `${API_BASE}/api/auth/logout`;
    window.location.href = url;
  };

  return (
    <div className={`dash-shell ${isNavCollapsed ? "nav-collapsed" : ""}`}>
      <aside className="dash-left">
        <div className="brand-row">
          <div className="brand-mark">E</div>
          <div className="brand-copy">
            <div className="brand-title">Enclosure</div>    
          </div>
          <button
            className="nav-toggle"
            onClick={() => setIsNavCollapsed((v) => !v)}
            aria-label={isNavCollapsed ? "Expand navigation" : "Collapse navigation"}
          >
            <span />
            <span />
            <span />
          </button>
        </div>

        <div className="nav-section-label">Overview</div>
        <nav className="side-nav" aria-label="Dashboard navigation">
          {visibleNavItems.map((item) => (
            <Link
              key={item.path}
              className={`side-link ${isActive(item.path) ? "active" : ""}`}
              to={item.path}
            >
              <span aria-hidden className="side-icon">
                {item.icon}
              </span>
              <span className="side-label">{item.label}</span>
              {item.badge ? <span className="side-badge">{item.badge}</span> : null}
            </Link>
          ))}
        </nav>

       

        <div
          className="profile-card"
          tabIndex={0}
          onClick={() => setIsProfileMenuOpen((v) => !v)}
          onBlur={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
              setIsProfileMenuOpen(false);
            }
          }}
        >
          <div className="avatar-ring">
            <img
              src={avatarUrl || "https://avatar.iran.liara.run/public/boy"}
              alt="User avatar"
              className="profile-avatar"
            />
          </div>
          <div className="profile-meta">
            <div className="profile-name">{displayName || email || "User"}</div>
            {role ? <div className="profile-pill">{role}</div> : null}
          </div>
          {isProfileMenuOpen ? (
            <div className="profile-menu" role="menu">
              <button
                type="button"
                role="menuitem"
                className="profile-menu-item"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  setIsProfileMenuOpen(false);
                  setShowSettings(true);
                }}
              >
                Settings
              </button>
              <button
                type="button"
                className="profile-menu-item"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  setIsProfileMenuOpen(false);
                  handleLogout();
                }}
              >
                Log out
              </button>
            </div>
          ) : null}
        </div>
      </aside>

      <main className="dash-main">
        <Outlet />
      </main>

      {showSettings ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <style>{`
            .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.6); display: grid; place-items: center; z-index: 2000; padding: 16px; }
            .modal-card { width: min(860px, 100%); max-height: 90vh; overflow: auto; background: var(--surface, #261812); border: 1px solid var(--border, rgba(255,255,255,0.12)); border-radius: 16px; box-shadow: var(--shadow, 0 12px 38px rgba(0,0,0,0.35)); padding: 18px; }
            .modal-head { display: flex; justify-content: space-between; align-items: center; position: sticky; top: 0; background: inherit; padding-bottom: 8px; margin-bottom: 12px; }
            .btn { display: inline-flex; align-items: center; gap: 8px; padding: 10px 14px; border-radius: 12px; border: 1px solid var(--border, rgba(255,255,255,0.12)); background: var(--surface, #261812); color: var(--text, #fff4ec); cursor: pointer; }
          `}</style>
          <div className="modal-card">
            <div className="modal-head">
              <div>
                <p className="muted">Account linkage</p>
                <h3>Settings</h3>
              </div>
              <button className="btn" onClick={() => setShowSettings(false)}>Close</button>
            </div>
            <SettingsPage />
          </div>
        </div>
      ) : null}
    </div>
  );
}


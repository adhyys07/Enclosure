import React, { useEffect, useMemo, useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
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
  { label: "Reviews", path: "/dashboard/review", icon: "📝" },
  { label: "Users", path: "/dashboard/users", icon: "🧑‍🤝‍🧑" },
  { label: "Analytics", path: "/dashboard/stats", icon: "📈" },
  { label: "Settings", path: "/dashboard/settings", icon: "⚙️" },
];

export default function Layout() {
  const location = useLocation();
  const [isNavCollapsed, setIsNavCollapsed] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>();
  const [role, setRole] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string | undefined>();
  const [email, setEmail] = useState<string | undefined>();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

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

       

        <div className="profile-card" tabIndex={0} onClick={() => setIsProfileMenuOpen((v) => !v)} onBlur={() => setIsProfileMenuOpen(false)}>
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
              <Link to="/dashboard/settings" role="menuitem" className="profile-menu-item">
                Settings
              </Link>
              <button type="button" className="profile-menu-item" onMouseDown={(e) => e.preventDefault()} onClick={handleLogout}>
                Log out
              </button>
            </div>
          ) : null}
        </div>
      </aside>

      <main className="dash-main">
        <Outlet />
      </main>
    </div>
  );
}


import React, { useEffect, useMemo, useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";

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

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboards", path: "/dashboard/home", icon: "📊", badge: "Pro" },
  { label: "Projects", path: "/dashboard/projects", icon: "📁" },
  { label: "Users", path: "/dashboard/users", icon: "🧑‍🤝‍🧑" },
  { label: "Analytics", path: "/dashboard/stats", icon: "📈" },
  { label: "Settings", path: "/dashboard/settings", icon: "⚙️" },
];

export default function Layout() {
  const location = useLocation();
  const [isNavCollapsed, setIsNavCollapsed] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>();

  const isActive = useMemo(
    () => (path: string) => location.pathname.startsWith(path),
    [location.pathname],
  );

  useEffect(() => {
    let cancelled = false;
    const url = `${API_BASE}/api/auth/profile`;
    fetch(url)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data?.image) {
          setAvatarUrl(data.image as string);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className={`dash-shell ${isNavCollapsed ? "nav-collapsed" : ""}`}>
      <style>{DASH_CSS}</style>
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
          {NAV_ITEMS.map((item) => (
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

       

        <div className="profile-card">
          <div className="avatar-ring">
            <img
              src={avatarUrl || "https://avatar.iran.liara.run/public/boy"}
              alt="User avatar"
              className="profile-avatar"
            />
          </div>
          <div className="profile-meta">
            <div className="profile-name">Adhyys</div>
          </div>
          <div className="profile-pill">PM</div>
        </div>
      </aside>

      <main className="dash-main">
        <Outlet />
      </main>
    </div>
  );
}

const DASH_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap');

:root {
  --page-bg: #120b08;
  --nav-bg: linear-gradient(180deg, rgba(40, 25, 18, 0.6), #0f0906 80%);
  --nav-muted: #f2c6a0;
  --nav-border: rgba(255, 255, 255, 0.08);
  --surface: #261812;
  --border: rgba(255, 255, 255, 0.12);
  --text: #fff4ec;
  --muted: #cfa58a;
  --accent: #ff8c42;
  --accent-2: #ffd166;
  --shadow: 0 12px 38px rgba(0, 0, 0, 0.35);
}

.dash-shell {
  display: grid;
  grid-template-columns: 280px 1fr;
  min-height: 100vh;
  background:
    radial-gradient(circle at 15% 10%, #3a1f14, transparent 40%),
    radial-gradient(circle at 85% 20%, #4a250f, transparent 45%),
    var(--page-bg);
  font-family: 'Space Grotesk', 'Inter', sans-serif;
  color: var(--text);
}

.dash-shell.nav-collapsed {
  grid-template-columns: 96px 1fr;
}

.dash-left {
  background: var(--nav-bg);
  color: var(--text);
  padding: 22px 18px 20px;
  border-right: 1px solid var(--nav-border);
  display: flex;
  flex-direction: column;
  gap: 16px;
  position: relative;
  overflow: hidden;
}

.brand-row {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 52px;
}

.brand-mark {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  background: linear-gradient(135deg, var(--accent), var(--accent-2));
  color: #1a0f0a;
  font-weight: 800;
  display: grid;
  place-items: center;
  box-shadow: 4px 4px 0 rgba(0, 0, 0, 0.45);
}

.brand-copy {
  display: grid;
  gap: 2px;
  white-space: nowrap;
  transition: opacity 0.2s ease, width 0.2s ease;
}

.brand-title {
  font-weight: 700;
  letter-spacing: -0.02em;
}

.brand-sub {
  color: var(--nav-muted);
  font-size: 13px;
}


.nav-toggle {
  margin-left: auto;
  width: 36px;
  height: 36px;
  border-radius: 12px;
  border: 1px solid var(--nav-border);
  background: rgba(0, 0, 0, 0.25);
  display: grid;
  gap: 5px;
  padding: 8px;
  cursor: pointer;
}

.nav-toggle span {
  display: block;
  height: 2px;
  background: var(--text);
}

.nav-section-label {
  margin-top: 10px;
  font-size: 12px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--nav-muted);
}

.side-nav {
  display: grid;
  gap: 8px;
  margin-top: 8px;
}

.side-link {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 14px;
  color: var(--text);
  text-decoration: none;
  border: 1px solid transparent;
  transition: transform 0.15s ease, background 0.2s ease, border-color 0.2s ease;
}

.side-link:hover {
  transform: translateX(2px);
  background: rgba(0, 0, 0, 0.25);
  border-color: var(--nav-border);
}

.side-link.active {
  background: linear-gradient(135deg, var(--accent), var(--accent-2));
  color: #1a0f0a;
  border-color: rgba(255, 255, 255, 0.22);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
}

.side-icon {
  width: 28px;
  height: 28px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.08);
  display: grid;
  place-items: center;
  font-size: 14px;
}

.side-badge {
  padding: 6px 10px;
  border-radius: 10px;
  background: rgba(0, 0, 0, 0.25);
  color: var(--text);
  font-weight: 700;
  font-size: 12px;
}

.nav-collapsed .brand-copy,
.nav-collapsed .side-label,
.nav-collapsed .side-badge,
.nav-collapsed .nav-section-label,
.nav-collapsed .nav-foot-card,
.nav-collapsed .profile-meta,
.nav-collapsed .profile-sub,
.nav-collapsed .profile-pill {
  display: none;
}

.nav-collapsed .dash-left {
  align-items: center;
}

.nav-collapsed .side-link {
  grid-template-columns: 1fr;
  justify-items: center;
  padding: 12px;
}

.nav-foot-card {
  margin-top: auto;
  background: rgba(0, 0, 0, 0.25);
  border: 1px solid var(--nav-border);
  border-radius: 16px;
  padding: 14px;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08);
}

.foot-kicker {
  font-weight: 700;
}

.foot-copy {
  color: var(--nav-muted);
  margin: 6px 0 12px;
}

.profile-card {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 16px;
  border: 1px solid var(--nav-border);
  background: rgba(0, 0, 0, 0.25);
}

.avatar-ring {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  padding: 2px;
  display: grid;
  place-items: center;
}

.profile-avatar {
  width: 100%;
  height: 100%;
  border-radius: 10px;
  object-fit: cover;
}

.profile-meta {
  display: grid;
  gap: 2px;
}

.profile-name {
  font-weight: 700;
}

.profile-role {
  color: var(--nav-muted);
  font-size: 13px;
}

.profile-sub {
  color: var(--nav-muted);
  font-size: 12px;
}

.profile-pill {
  background: rgba(0, 0, 0, 0.25);
  color: var(--text);
  padding: 6px 10px;
  border-radius: 12px;
  font-weight: 700;
  font-size: 12px;
}

.dash-main {
  padding: 28px;
  background: var(--page-bg);
  overflow-y: auto;
}


.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border-radius: 12px;
  font-weight: 700;
  text-decoration: none;
  border: 1px solid var(--border);
  padding: 10px 14px;
  color: var(--text);
  background: var(--surface);
  box-shadow: var(--shadow);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
}

.btn.primary {
  background: linear-gradient(135deg, var(--accent), var(--accent-2));
  color: #1a0f0a;
  border-color: rgba(255, 255, 255, 0.25);
}

.btn.secondary {
  background: rgba(0, 0, 0, 0.25);
  color: var(--text);
  border-color: var(--nav-border);
  box-shadow: none;
}

.btn.small {
  padding: 8px 12px;
  font-size: 13px;
}

@media (max-width: 960px) {
  .dash-shell {
    grid-template-columns: 92px 1fr;
  }

  .dash-main {
    padding: 18px;
  }
}
`;

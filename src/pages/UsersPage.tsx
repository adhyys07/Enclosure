import React, { useEffect, useState } from "react";

type Profile = {
  name?: string | null;
  email?: string | null;
  identityLinked?: boolean;
  hackatimeLinked?: boolean;
  hackatimeExpiresAt?: string | null;
};

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

export default function UsersPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  const loadProfile = async () =>
    fetch(`${API_BASE}/api/auth/profile`, { credentials: "include" })
      .then(async (res) => {
        if (!res.ok) throw new Error(await res.text() || res.statusText);
        return res.json() as Promise<Profile>;
      })
      .then((data) => {
        setProfile(data);
        setError(null);
      })
      .catch((err: Error) => setError(err.message || "Failed to load profile"));

  useEffect(() => {
    setLoading(true);
    loadProfile().finally(() => setLoading(false));
  }, []);

  const linked = (flag?: boolean) => (flag ? "Linked" : "Not linked");

  return (
    <div className="users-page">
      <style>{`
        .users-page { display: grid; gap: 16px; }
        .users-header { display: flex; align-items: center; gap: 12px; justify-content: space-between; flex-wrap: wrap; }
        .pill { padding: 6px 10px; border-radius: 999px; background: rgba(255,255,255,0.08); border: 1px solid var(--border, rgba(255,255,255,0.12)); }
        .card { border: 1px solid var(--border, rgba(255,255,255,0.12)); border-radius: 14px; padding: 14px; background: var(--surface, #261812); box-shadow: var(--shadow, 0 12px 38px rgba(0,0,0,0.35)); }
        .settings-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 12px; }
        .muted { color: var(--muted, #cfa58a); margin: 4px 0; }
        .btn { display: inline-flex; align-items: center; gap: 8px; padding: 10px 14px; border-radius: 12px; border: 1px solid var(--border, rgba(255,255,255,0.12)); background: var(--surface, #261812); color: var(--text, #fff4ec); cursor: pointer; }
        .btn.primary { background: linear-gradient(135deg, var(--accent, #ff8c42), var(--accent-2, #ffd166)); color: #120b08; border-color: rgba(255, 255, 255, 0.2); }
        .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.6); display: grid; place-items: center; z-index: 40; padding: 16px; }
        .modal-card { width: min(720px, 100%); background: var(--surface, #261812); border: 1px solid var(--border, rgba(255,255,255,0.12)); border-radius: 16px; box-shadow: var(--shadow, 0 12px 38px rgba(0,0,0,0.35)); padding: 18px; }
        .modal-head { display: flex; justify-content: space-between; align-items: center; }
      `}</style>

      <div className="users-header">
        <div>
          <h1>Users</h1>
          <p className="muted">Manage users and linked accounts.</p>
        </div>
        <button className="btn primary" onClick={() => setShowSettings(true)} disabled={loading}>
          {loading ? "Loading..." : "Settings"}
        </button>
      </div>

      {error ? <div className="card">{error}</div> : null}

      {showSettings ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal-card">
            <div className="modal-head">
              <div>
                <p className="muted">Account linkage</p>
                <h3>Settings</h3>
              </div>
              <button className="btn" onClick={() => setShowSettings(false)}>Close</button>
            </div>
            <div className="settings-grid">
              <div className="card">
                <div className="pill">Hack Club Account</div>
                <p className="muted">{linked(profile?.identityLinked)}</p>
                <p className="muted">{profile?.email || ""}</p>
              </div>
              <div className="card">
                <div className="pill">Hackatime</div>
                <p className="muted">{linked(profile?.hackatimeLinked)}</p>
                {profile?.hackatimeExpiresAt ? (
                  <p className="muted">Expires: {new Date(profile.hackatimeExpiresAt).toLocaleString()}</p>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

import React, { useEffect, useState } from "react";

type Profile = {
  name?: string | null;
  email?: string | null;
  identityLinked?: boolean;
  hackatimeLinked?: boolean;
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

export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`${API_BASE}/api/auth/profile`, { credentials: "include" })
      .then(async (res) => {
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || res.statusText);
        }
        return res.json() as Promise<Profile>;
      })
      .then((data) => {
        if (!cancelled) {
          setProfile(data);
          setError(null);
        }
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message || "Failed to load profile");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const linked = (flag?: boolean) => (flag ? "Linked" : "Not linked");

  return (
    <div className="settings-page">
      <style>{`
        .settings-page { display: grid; gap: 18px; }
        .settings-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 12px; }
        .card { border: 1px solid var(--border, rgba(255,255,255,0.12)); border-radius: 14px; padding: 14px; background: var(--surface, #261812); box-shadow: var(--shadow, 0 12px 38px rgba(0,0,0,0.35)); }
        .muted { color: var(--muted, #cfa58a); margin: 4px 0; }
        .status { font-weight: 700; }
      `}</style>
      <h1>Settings</h1>
      {loading ? <div>Loading...</div> : null}
      {error ? <div className="card">{error}</div> : null}
      <div className="settings-grid">
        <div className="card">
          <div className="status">Hack Club Account</div>
          <p className="muted">{linked(profile?.identityLinked)}</p>
          <p className="muted">{profile?.email || ""}</p>
        </div>
        <div className="card">
          <div className="status">Hackatime</div>
          <p className="muted">{linked(profile?.hackatimeLinked)}</p>
          
        </div>
      </div>
    </div>
  );
}

import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

type Profile = {
  role?: string | null;
  email?: string | null;
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

export default function ReviewPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
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
      .catch((err) => {
        if (!cancelled) {
          setError(err.message || "Failed to load profile");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const role = profile?.role ?? null;
  const allowed = role === "admin" || role === "reviewer";

  return (
    <div className="review-shell">
      <style>{REVIEW_CSS}</style>
      <div className="review-card">
        {loading ? (
          <div className="notice muted">Checking access...</div>
        ) : error ? (
          <div className="notice error">{error}</div>
        ) : !allowed ? (
          <div className="notice warning">
            <div className="notice-title">Restricted</div>
            <div>This area is only for admins and reviewers.</div>
            <Link className="pill" to="/dashboard/home">
              Return to dashboard
            </Link>
          </div>
        ) : (
          <>
            <div className="review-head">
              <div className="eyebrow">Reviewer workspace</div>
              <h1>Reviews</h1>
              <p>Only admins and reviewers can see this workspace.</p>
            </div>

            <div className="review-grid">
              <section className="panel">
                <div className="panel-title">Submission queue</div>
                <p className="muted">Plug project submissions here to triage.</p>
              </section>
              <section className="panel">
                <div className="panel-title">Decisions</div>
                <p className="muted">Track approvals, rejections, and notes.</p>
              </section>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const REVIEW_CSS = `
.review-shell {
  padding: 32px;
  color: var(--text, #fff4ec);
}

.review-card {
  max-width: 1100px;
  margin: 0 auto;
  background: var(--surface, #261812);
  border: 1px solid var(--border, rgba(255, 255, 255, 0.12));
  border-radius: 18px;
  box-shadow: var(--shadow, 0 12px 38px rgba(0, 0, 0, 0.35));
  padding: 24px;
}

.review-head h1 {
  margin: 4px 0 8px;
  font-size: 32px;
  letter-spacing: -0.5px;
}

.eyebrow {
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 12px;
  color: var(--muted, #cfa58a);
}

.review-head p {
  margin: 0;
  color: var(--muted, #cfa58a);
}

.review-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 16px;
  margin-top: 20px;
}

.panel {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--border, rgba(255, 255, 255, 0.12));
  border-radius: 14px;
  padding: 16px;
}

.panel-title {
  font-weight: 600;
  margin-bottom: 6px;
}

.muted {
  color: var(--muted, #cfa58a);
}

.notice {
  display: grid;
  gap: 8px;
  padding: 16px;
  border-radius: 14px;
  border: 1px solid var(--border, rgba(255, 255, 255, 0.12));
  background: rgba(255, 255, 255, 0.03);
}

.notice-title {
  font-weight: 600;
}

.notice.error {
  border-color: rgba(255, 99, 71, 0.4);
  color: #ff9f9f;
}

.notice.warning {
  border-color: rgba(255, 215, 0, 0.35);
  color: #ffd166;
}

.pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: fit-content;
  padding: 8px 12px;
  border-radius: 999px;
  background: var(--accent, #ff8c42);
  color: #120b08;
  font-weight: 600;
  text-decoration: none;
}

@media (max-width: 720px) {
  .review-card {
    padding: 16px;
  }

  .review-head h1 {
    font-size: 26px;
  }
}
`;

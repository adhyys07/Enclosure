/// <reference types="react" />
/// <reference types="vite/client" />
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}

type ProjectStatus = "draft" | "in-progress" | "review" | "done";

type Project = {
  id: number;
  name: string;
  description: string | null;
  status: ProjectStatus;
  createdAt?: string;
  updatedAt?: string;
};

type SubmitPayload = {
  name: string;
  email: string;
};

const STATUSES: ProjectStatus[] = ["draft", "in-progress", "review", "done"];

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

async function fetchJSON<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    ...options,
  });
  const text = await res.text();
  if (!res.ok) {
    const err = new Error(text || res.statusText) as Error & {
      status?: number;
    };
    err.status = res.status;
    throw err;
  }
  return text ? (JSON.parse(text) as T) : ({} as T);
}

async function submitProjectRecord(payload: SubmitPayload) {
  return fetchJSON("/api/projects/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [draftName, setDraftName] = useState("");
  const location = useLocation();
  const navigate = useNavigate();

  async function ensureAuth(err: Error & { status?: number }) {
    if (err.status === 401) {
      window.location.href = `${API_BASE}/api/auth/login`;
    }
  }

  async function loadProjects() {
    setLoading(true);
    setListError(null);
    try {
      const data = await fetchJSON<Project[]>("/api/projects");
      setProjects(data);
    } catch (err) {
      const e = err as Error & { status?: number };
      setListError(e.message);
      await ensureAuth(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    setIsModalOpen(location.pathname.endsWith("/projects/new"));
  }, [location.pathname]);

  async function submitProject(projectName: string) {
    setFormError(null);

    if (!projectName.trim()) {
      setFormError("Project name is required");
      return;
    }

    setSaving(true);
    try {
      await fetchJSON<Project>("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: projectName.trim(),
          description: "",
          status: "draft",
        }),
      });

      // Also capture into created_projects
      const profileRes = await fetchJSON<{ email?: string; name?: string }>("/api/auth/profile");
      const email = profileRes.email || "";
      if (email) {
        await submitProjectRecord({ name: projectName.trim(), email });
      }
      await loadProjects();
      setDraftName("");
      setIsModalOpen(false);
      navigate("/dashboard/projects");
    } catch (err) {
      const e = err as Error & { status?: number };
      setFormError(e.message);
      await ensureAuth(e);
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus(id: number, next: ProjectStatus) {
    try {
      await fetchJSON<Project>(`/api/projects/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      await loadProjects();
    } catch (err) {
      const e = err as Error & { status?: number };
      alert(`Failed to update status: ${e.message}`);
      await ensureAuth(e);
    }
  }

  const openProject = (id: number) => {
    navigate(`/dashboard/projects?project_id=${id}`);
  };

  return (
    <div className="projects-page">
      <style>{PAGE_CSS}</style>

      <header className="page-header">
        <div>
          <p className="eyebrow">Projects</p>
          <h1>Active work</h1>
          <p className="muted">Keep tabs on submissions and status.</p>
        </div>
        <div className="header-actions">
          <button
            className="btn secondary small"
            onClick={loadProjects}
            disabled={loading}
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
          <button
            className="btn primary small"
            onClick={() => {
              setIsModalOpen(true);
              navigate("/dashboard/projects/new");
            }}
          >
            New project
          </button>
        </div>
      </header>

      {listError ? <div className="alert error">{listError}</div> : null}

      {loading ? (
        <div className="card skeleton">
          <div className="skeleton-row" />
          <div className="skeleton-row" />
          <div className="skeleton-row" />
        </div>
      ) : projects.length === 0 ? (
        <div className="card empty-card">
          <div>
            <p className="eyebrow">No projects yet</p>
            <h2>Start your first project</h2>
            <p className="muted">
              Create a project to track submissions, status, and progress in one place.
            </p>
          </div>
          <button
            className="btn primary"
            onClick={() => navigate("/dashboard/projects/new")}
          >
            Create project
          </button>
        </div>
      ) : (
        <div className="projects-grid">
          {projects.map((p) => (
            <div
              key={p.id}
              className="project-card clickable"
              role="button"
              tabIndex={0}
              onClick={() => openProject(p.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") openProject(p.id);
              }}
            >
              <div className="project-main">
                <div className="project-title">{p.name}</div>
                <div className="project-desc">{p.description || "No description"}</div>
                <span className={`pill pill-${p.status}`}>{labelForStatus(p.status)}</span>
              </div>
              <div className="project-actions" onClick={(e) => e.stopPropagation()}>
                <label className="muted">Status</label>
                <select
                  value={p.status}
                  onChange={(e) => updateStatus(p.id, e.target.value as ProjectStatus)}
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {labelForStatus(s)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen ? (
        <div className="modal-backdrop full" role="dialog" aria-modal="true">
          <div className="modal-card full">
            <div className="modal-header">
              <div>
                <p className="eyebrow">New</p>
                <h2>Create project</h2>
              </div>
              <button
                className="icon-btn"
                aria-label="Close"
                onClick={() => {
                  setIsModalOpen(false);
                  navigate("/dashboard/projects");
                }}
              >
                x
              </button>
            </div>
            {formError ? <div className="alert error">{formError}</div> : null}
            <div className="modal-body">
              <label className="field">
                <span>Project name</span>
                <input
                  value={draftName}
                  onChange={(e) => setDraftName(e.target.value)}
                  placeholder="Moonshot redesign"
                  autoFocus
                />
              </label>
            </div>
            <div className="modal-actions full">
              <button
                className="btn ghost"
                onClick={() => {
                  setIsModalOpen(false);
                  navigate("/dashboard/projects");
                }}
                disabled={saving}
              >
                Cancel
              </button>
              <div className="spacer" />
              <button
                className="btn primary"
                disabled={saving || !draftName.trim()}
                onClick={() => submitProject(draftName)}
              >
                {saving ? "Saving..." : "Create"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function labelForStatus(status: ProjectStatus) {
  switch (status) {
    case "draft":
      return "Draft";
    case "in-progress":
      return "In progress";
    case "review":
      return "Review";
    case "done":
      return "Done";
    default:
      return status;
  }
}

const PAGE_CSS = `
.projects-page {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
  flex-wrap: wrap;
}

.eyebrow {
  text-transform: uppercase;
  letter-spacing: 0.12em;
  font-size: 12px;
  color: var(--muted);
  margin: 0;
}

h1 {
  margin: 6px 0 4px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 18px;
  padding: 18px;
  box-shadow: var(--shadow);
}

.table-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.projects-grid {
  display: grid;
  gap: 14px;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
}

.project-card {
  display: grid;
  grid-template-rows: 1fr auto;
  gap: 12px;
  padding: 16px;
  border: 1px solid var(--border);
  border-radius: 14px;
  background: #1c120d;
  min-height: 180px;
  aspect-ratio: 4 / 3;
}

.project-card.clickable {
  cursor: pointer;
  transition: transform 0.1s ease, border-color 0.15s ease, background 0.15s ease;
}

.project-card.clickable:hover {
  transform: translateY(-2px);
  border-color: var(--nav-border);
  background: #22150f;
}

.project-main {
  display: grid;
  gap: 6px;
}

.project-title {
  font-weight: 700;
  font-size: 16px;
  color: var(--text);
}

.project-desc {
  color: var(--muted);
  font-size: 14px;
}

.project-actions {
  display: grid;
  gap: 6px;
  min-width: 180px;
}

.project-actions select {
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: #1a0f0a;
  color: var(--text);
  font-weight: 600;
}

.pill {
  display: inline-flex;
  align-items: center;
  padding: 6px 12px;
  border-radius: 999px;
  font-weight: 700;
  font-size: 12px;
  border: 1px solid transparent;
  width: fit-content;
}

.pill-draft {
  background: rgba(255, 140, 66, 0.1);
  color: var(--text);
  border-color: rgba(255, 140, 66, 0.35);
}

.pill-in-progress {
  background: rgba(255, 209, 102, 0.1);
  color: var(--text);
  border-color: rgba(255, 209, 102, 0.35);
}

.pill-review {
  background: rgba(255, 183, 3, 0.12);
  color: var(--text);
  border-color: rgba(255, 183, 3, 0.35);
}

.pill-done {
  background: rgba(22, 163, 74, 0.14);
  color: #c7f9cc;
  border-color: rgba(22, 163, 74, 0.35);
}

.muted {
  color: var(--muted);
  margin: 0;
}

.alert {
  border-radius: 12px;
  padding: 12px 14px;
  border: 1px solid var(--border);
  background: rgba(0, 0, 0, 0.25);
}

.alert.error {
  background: rgba(185, 28, 28, 0.18);
  color: #ffd5d5;
  border-color: rgba(185, 28, 28, 0.35);
}

.empty-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.skeleton {
  display: grid;
  gap: 10px;
}

.skeleton-row {
  height: 16px;
  border-radius: 10px;
  background: linear-gradient(90deg, #1f130d 0%, #2a180f 50%, #1f130d 100%);
  animation: shimmer 1.4s infinite;
}

@keyframes shimmer {
  0% { background-position: -120px 0; }
  100% { background-position: 240px 0; }
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: grid;
  place-items: center;
  z-index: 30;
  padding: 16px;
}

.modal-backdrop.full {
  background: linear-gradient(135deg, #1a0f0a, #0f0906);
  display: block;
  padding: 0;
}

.modal-card {
  background: var(--surface);
  border-radius: 16px;
  border: 1px solid var(--border);
  padding: 18px;
  width: 100%;
  max-width: 480px;
  box-shadow: var(--shadow);
  display: grid;
  gap: 14px;
}

.modal-card.full {
  max-width: none;
  height: 100vh;
  border-radius: 0;
  border: none;
  padding: 28px;
  box-shadow: none;
  grid-template-rows: auto 1fr auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-body {
  display: grid;
  gap: 14px;
}

.icon-btn {
  background: transparent;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: var(--muted);
}

.field {
  display: grid;
  gap: 6px;
}

.field input {
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid var(--border);
  font-size: 15px;
  background: #1a0f0a;
  color: var(--text);
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.modal-actions.full {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
}

.spacer {
  width: 100%;
}

.btn.ghost {
  background: transparent;
  border-color: var(--border);
  box-shadow: none;
}

@media (max-width: 720px) {
  .project-row {
    grid-template-columns: 1fr;
  }

  .project-actions {
    grid-template-columns: 1fr;
  }
}
`;

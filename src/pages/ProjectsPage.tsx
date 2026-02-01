/// <reference types="react" />
/// <reference types="vite/client" />
import React, { useEffect, useState } from "react";

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

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [draftName, setDraftName] = useState("");

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
      await loadProjects();
      setDraftName("");
      setIsModalOpen(false);
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
          <button className="btn primary" onClick={() => setIsModalOpen(true)}>
            Create project
          </button>
        </div>
      ) : (
        <div className="card">
          <div className="table-head">
            <div>
              <p className="eyebrow">{projects.length} active</p>
              <h2>Projects</h2>
            </div>
            <span className="muted">Status updates save instantly</span>
          </div>
          <div className="project-table">
            {projects.map((p) => (
              <div key={p.id} className="project-row">
                <div className="project-main">
                  <div className="project-title">{p.name}</div>
                  <div className="project-desc">{p.description || "No description"}</div>
                  <span className={`pill pill-${p.status}`}>{labelForStatus(p.status)}</span>
                </div>
                <div className="project-actions">
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
        </div>
      )}

      {isModalOpen ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal-card">
            <div className="modal-header">
              <div>
                <p className="eyebrow">New</p>
                <h2>Create project</h2>
              </div>
              <button
                className="icon-btn"
                aria-label="Close"
                onClick={() => setIsModalOpen(false)}
              >
                x
              </button>
            </div>
            {formError ? <div className="alert error">{formError}</div> : null}
            <label className="field">
              <span>Project name</span>
              <input
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                placeholder="Moonshot redesign"
                autoFocus
              />
            </label>
            <div className="modal-actions">
              <button className="btn ghost" onClick={() => setIsModalOpen(false)} disabled={saving}>
                Cancel
              </button>
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

.project-table {
  display: grid;
  gap: 10px;
}

.project-row {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 12px;
  padding: 14px;
  border: 1px solid var(--border);
  border-radius: 14px;
  background: #1c120d;
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

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
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

import React, { useState } from "react";

// In a real app, you would likely use a router to handle navigation.
// For now, these are placeholder functions.
const navigateToProjects = () => {
  if (window.confirm("Navigate to projects? (This is a placeholder)")) {
    window.location.href = "/";
  }
};

const PAGE_STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Patrick+Hand&display=swap');

:root {
  --bg: #120b08;
  --bg-alt: #1c120d;
  --card: #261812;
  --border: #ffb703;
  --text: #fff4ec;
  --muted: #f2c6a0;
  --accent: #ff8c42;
  --accent2: #ffd166;
}

.create-project-page {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: var(--bg);
  font-family: 'Inter', sans-serif;
  color: var(--text);
  padding: 2rem;
}

.form-container {
  background: var(--card);
  padding: 40px 50px;
  border-radius: 24px;
  width: 100%;
  max-width: 550px;
  position: relative;
  border: 1px solid rgba(255,255,255,0.1);
  box-shadow: 0 25px 50px -12px rgba(0,0,0,0.7);
}

.page-title {
  font-family: 'Patrick Hand', cursive;
  font-size: 4rem;
  line-height: 1.1;
  font-weight: normal;
  margin: 0 0 30px 0;
  color: var(--text);
}

.close-btn-page {
  position: absolute;
  top: 25px;
  right: 25px;
  background: none;
  border: none;
  color: var(--muted);
  font-size: 2rem;
  cursor: pointer;
  padding: 0;
  line-height: 1;
}

.field-page {
  display: grid;
  gap: 8px;
  color: var(--muted);
  font-size: 1rem;
  margin-bottom: 30px;
}

.field-page input {
  width: 100%;
  padding: 14px 16px;
  border-radius: 14px;
  border: 2px solid var(--border);
  background: var(--bg-alt);
  color: var(--text);
  font-size: 1rem;
}

.field-page input:focus {
  outline: none;
  border-color: var(--accent2);
}

.actions-page {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 10px;
}

.cancel-link {
  background: none;
  border: none;
  color: var(--muted);
  font-family: 'Patrick Hand', cursive;
  font-size: 1.5rem;
  cursor: pointer;
  text-decoration: underline;
}

.cancel-link:hover {
    color: var(--text);
}

.submit-btn-page {
  cursor: pointer;
  background: linear-gradient(135deg, var(--accent), var(--accent2));
  color: #1a0f0a;
  font-weight: 700;
  font-size: 1rem;
  border: none;
  border-radius: 16px;
  padding: 14px 30px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.2), 0 2px 5px rgba(255,140,66,0.4);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.submit-btn-page:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0,0,0,0.3), 0 4px 8px rgba(255,140,66,0.5);
}
`;

export default function ProjectCreationPage() {
  const [projectName, setProjectName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCancel = () => {
    // In a real app with a router, you would navigate away.
    // e.g., navigate('/projects');
    navigateToProjects();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim()) {
      setError("Project name is required.");
      return;
    }
    setError(null);
    setSaving(true);

    // Placeholder for actual API call
    console.log("Creating project:", projectName);
    setTimeout(() => {
      console.log("Project created!");
      setSaving(false);
      // On success, navigate to the projects page
      navigateToProjects();
    }, 1000);
  };

  return (
    <div className="create-project-page">
      <style>{PAGE_STYLES}</style>
      <div className="form-container">
        <button
          onClick={handleCancel}
          className="close-btn-page"
          aria-label="Close"
        >
          &times;
        </button>
        <h1 className="page-title">
          Create
          <br />
          New
          <br />
          Project
        </h1>
        <form onSubmit={handleSubmit}>
          <label className="field-page">
            <span>Project Name *</span>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="My awesome new project"
              required
              autoFocus
            />
          </label>
          {error && <div className="error">{error}</div>}
          <div className="actions-page">
            <button
              type="button"
              onClick={handleCancel}
              className="cancel-link"
              disabled={saving}
            >
              Cancel
            </button>
            <button type="submit" className="submit-btn-page" disabled={saving}>
              {saving ? "Creating..." : "Create Project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

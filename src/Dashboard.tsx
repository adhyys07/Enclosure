import React from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Layout from "./Layout";
import HomePage from "./pages/HomePage";
import ProjectsPage from "./pages/ProjectsPage";
import StatsPage from "./pages/StatsPage";
import UsersPage from "./pages/UsersPage";
import SettingsPage from "./pages/SettingsPage";
import ReviewPage from "./pages/ReviewPage";

export default function Dashboard() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/dashboard" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard/home" replace />} />
          <Route path="home" element={<HomePage />} />
          <Route path="projects/*" element={<ProjectsPage />} />
          <Route path="review" element={<ReviewPage />} />
          <Route path="stats" element={<StatsPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard/home" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

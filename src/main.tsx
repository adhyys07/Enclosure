import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import Dashboard from "./Dashboard";
import "../css/style.css";

const root = document.getElementById("root");

if (!root) {
  throw new Error("Root element #root not found");
}

const isDashboard = window.location.pathname.startsWith("/dashboard");

ReactDOM.createRoot(root).render(
  <React.StrictMode>{isDashboard ? <Dashboard /> : <App />}</React.StrictMode>,
);

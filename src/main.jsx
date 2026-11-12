// =====================================================================
// main.jsx — app ka entry point (sabse pehle yahi file chalti hai)
// =====================================================================
import React from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";
import App from "./App";
import "./styles.css";

// index.html ke <div id="root"> mein poori React app render karo.
// StrictMode: development mein extra checks (effects do baar chala kar bugs pakadta hai).
// HashRouter: URL "/#/customers" jaise banenge — static hosting par refresh se 404 nahi aata.
createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>,
);

// src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";

// Styles globaux
import "./styles/index.css";

/**
 * Point d'entrée principal de l'application React.
 * Configure :
 * - Mode Strict pour détecter les problèmes
 * - BrowserRouter pour la navigation
 */
const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("❌ Element with id 'root' not found in index.html");
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);

// src/App.tsx
import { Routes, Route, Navigate } from "react-router-dom";

// Auth pages
import Login from "./pages/Login";
import Signup from "./pages/Signup";

// Coach components & pages
import Layout from "./components/Layout";
import CoachDashboard from "./pages/Coach/CoachDashboard";
import ClientList from "./pages/Coach/ClientList";
import CreateProgram from "./pages/Coach/CreateProgram";
import EditProgram from "./pages/Coach/EditProgram";
import ClientProgram from "./pages/Coach/ClientProgram";
import CoachBilan from "./pages/Coach/CoachBilan";

// Client components & pages
import ClientLayout from "./components/Client/ClientLayout";
import ClientDashboard from "./pages/Client/ClientHome";
import ClientProgramFull from "./pages/Client/ClientProgram";
import ClientReport from "./pages/Client/ClientReport";

// Auth guard
import ProtectedRoute from "./components/ProtectedRoute";

/**
 * Configuration des routes principales de FitnessBro.
 * Sépare les espaces :
 * - Auth
 * - Coach (protégé)
 * - Client (protégé)
 */
export default function App() {
  return (
    <Routes>

      {/* =========================================
          🔹 Authentification (public)
      ========================================== */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />


      {/* =========================================
          🟦 Espace Coach (protégé)
      ========================================== */}
      <Route
        path="/coach"
        element={
          <ProtectedRoute allowedRole="coach">
            <Layout /> {/* Layout = sidebar + header coach */}
          </ProtectedRoute>
        }
      >
        {/* Redirection par défaut */}
        <Route index element={<Navigate to="dashboard" replace />} />

        <Route path="dashboard" element={<CoachDashboard />} />
        <Route path="clients" element={<ClientList />} />
        <Route path="bilan" element={<CoachBilan />} />

        {/* Pages liées aux programmes */}
        <Route path="create" element={<CreateProgram />} />
        <Route path="edit/:id" element={<EditProgram />} />
        <Route path="client/:id" element={<ClientProgram />} />

        {/* Rapport d'un client */}
        <Route path="client/:clientId/report" element={<ClientReport />} />
      </Route>


      {/* =========================================
          🟩 Espace Client (protégé)
      ========================================== */}
      <Route
        path="/client"
        element={
          <ProtectedRoute allowedRole="client">
            <ClientLayout /> {/* Layout client (thème sombre gardé) */}
          </ProtectedRoute>
        }
      >
        {/* Redirection par défaut */}
        <Route index element={<Navigate to="dashboard" replace />} />

        <Route path="dashboard" element={<ClientDashboard />} />
        <Route path="program" element={<ClientProgramFull />} />
        <Route path="summary" element={<ClientReport />} />
      </Route>


      {/* =========================================
          🔄 Redirections générales
      ========================================== */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

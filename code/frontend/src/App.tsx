// src/App.tsx 
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Signup from "./pages/Signup";

// Coach
import Layout from "./components/Layout";
import CoachDashboard from "./pages/Coach/CoachDashboard";
import ClientList from "./pages/Coach/ClientList";
import CreateProgram from "./pages/Coach/CreateProgram";
import EditProgram from "./pages/Coach/EditProgram";
import ClientProgram from "./pages/Coach/ClientProgram";

// Client
import ClientLayout from "./components/Client/ClientLayout";
import ClientDashboard from "./pages/Client/ClientHome";   // Dashboard clair
import ClientProgramFull from "./pages/Client/ClientProgram"; // Mon programme
import ClientSummary from "./pages/Client/ClientReport";      // Bilan

// Auth guard
import ProtectedRoute from "./components/ProtectedRoute";
import CoachBilan from "./pages/Coach/CoachBilan";
import ClientReport from "./pages/Client/ClientReport";

export default function App() {
  return (
    <Routes>
      {/* 🔹 Auth routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      {/* 🔹 Coach area (protégée) */}
      <Route
        path="/coach"
        element={
          <ProtectedRoute allowedRole="coach">
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<CoachDashboard />} />
        <Route path="clients" element={<ClientList />} />
        <Route path="/coach/bilan" element={<CoachBilan />} />
        <Route path="/coach/client/:clientId/report" element={<ClientReport />} />

        <Route path="create" element={<CreateProgram />} />
        <Route path="edit/:id" element={<EditProgram />} />
        <Route path="client/:id" element={<ClientProgram />} />
      </Route>

      {/* 🔹 Client area (protégée) */}
      <Route
        path="/client"
        element={
          <ProtectedRoute allowedRole="client">
            <ClientLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<ClientDashboard />} />
        <Route path="program" element={<ClientProgramFull />} />
        <Route path="summary" element={<ClientSummary />} />
      </Route>

      {/* 🔹 Defaults */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import ClientDashboard from "./pages/ClientDashboard"; // ✅ si tu l’as
import type { JSX } from "react";

function PrivateRoute({ children }: { children: JSX.Element }) {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      {/* Page d’accueil redirige vers /login */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      {/* Tableau de bord coach */}
      <Route
        path="/coach"
        element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        }
      />

      {/* Tableau de bord client */}
      <Route
        path="/client"
        element={
          <PrivateRoute>
            <ClientDashboard />
          </PrivateRoute>
        }
      />
    </Routes>
  );
}

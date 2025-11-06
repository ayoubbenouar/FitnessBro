// src/components/ProtectedRoute.tsx
import { Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import type { JSX } from "react";

type Role = "coach" | "client";

interface Decoded {
  sub: string;
  role: Role;
  exp: number;
}

export default function ProtectedRoute({
  allowedRole,
  children,
}: {
  allowedRole: Role;
  children: JSX.Element;
}) {
  const token = localStorage.getItem("token");
  if (!token) return <Navigate to="/login" replace />;

  try {
    const decoded = jwtDecode<Decoded>(token);
    if (decoded.role !== allowedRole) {
      // redirige vers le bon espace si rôle différent
      return <Navigate to={decoded.role === "coach" ? "/coach/dashboard" : "/client/dashboard"} replace />;
    }
    return children;
  } catch {
    localStorage.removeItem("token");
    return <Navigate to="/login" replace />;
  }
}

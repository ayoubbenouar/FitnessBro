// src/components/ProtectedRoute.tsx
import { Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import type { ReactNode } from "react";

type Role = "coach" | "client";

interface Decoded {
  sub: string;
  role: Role;
  exp: number;
}

interface Props {
  allowedRole: Role;
  children: ReactNode; // 🔥 permet 1 OU plusieurs enfants
}

export default function ProtectedRoute({ allowedRole, children }: Props) {
  const token = localStorage.getItem("token");
  if (!token) return <Navigate to="/login" replace />;

  try {
    const decoded = jwtDecode<Decoded>(token);

    // Si le rôle ne correspond pas → rediriger automatiquement
    if (decoded.role !== allowedRole) {
      const redirect = decoded.role === "coach" ? "/coach/dashboard" : "/client/dashboard";
      return <Navigate to={redirect} replace />;
    }

    // 🔥 IMPORTANT : ReactNode = accepte tout (Layout + Outlet + fragments)
    return <>{children}</>;

  } catch {
    // Token invalide → nettoie + redirection
    localStorage.removeItem("token");
    return <Navigate to="/login" replace />;
  }
}

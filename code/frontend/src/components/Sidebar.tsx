// src/components/Sidebar.tsx
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  ClipboardList,
  Users,
  LogOut,
  Menu,
  X,
  Dumbbell,
  LayoutDashboard,
} from "lucide-react";

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(true);
  const location = useLocation();

  const linkStyle = (path: string) =>
    `flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-200 ${
      location.pathname === path
        ? "bg-blue-600 text-white shadow-lg"
        : "text-gray-300 hover:text-white hover:bg-blue-800/40"
    }`;

  return (
    <>
      {/* Bouton mobile */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 bg-blue-600 text-white p-2 rounded-lg shadow-md"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Basculer la navigation"
      >
        {isOpen ? <X size={22} /> : <Menu size={22} />}
      </button>

      {/* Conteneur sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full bg-gray-900 border-r border-gray-800 shadow-xl transition-all duration-300 ease-in-out ${
          isOpen ? "w-64" : "w-0 lg:w-64"
        } overflow-hidden z-40`}
      >
        <div className="flex flex-col h-full">
          {/* Logo / Titre */}
          <div className="flex items-center justify-center gap-3 py-6 border-b border-gray-800">
            <Dumbbell size={28} className="text-blue-500" />
            <h1 className="text-2xl font-bold text-white tracking-wide">
              FitnessBro
            </h1>
          </div>

          {/* Liens de navigation */}
          <nav className="flex-1 px-3 py-6 flex flex-col gap-2">
            <Link to="/coach/dashboard" className={linkStyle("/coach/dashboard")}>
              <LayoutDashboard size={20} /> Tableau de bord
            </Link>

            <Link to="/coach/create" className={linkStyle("/coach/create")}>
              <ClipboardList size={20} /> Créer programme
            </Link>

            <Link to="/coach/clients" className={linkStyle("/coach/clients")}>
              <Users size={20} /> Liste clients
            </Link>
          </nav>

          {/* Déconnexion */}
          <div className="p-4 border-t border-gray-800">
            <button
              onClick={() => {
                localStorage.removeItem("token");
                window.location.href = "/login";
              }}
              className="flex items-center gap-2 text-gray-400 hover:text-red-400 transition"
            >
              <LogOut size={20} />
              Se déconnecter
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

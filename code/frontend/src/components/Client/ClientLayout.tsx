import type { ReactNode } from "react";
import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  BookOpen,
  BarChart3,
  LogOut,
  Dumbbell,
} from "lucide-react";
import ClientTopbar from "./ClientTopbar";

export default function ClientLayout({ children }: { children?: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();

  const linkStyle = (path: string) =>
    `flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-200 ${
      location.pathname === path
        ? "bg-blue-600 text-white shadow-lg"
        : "text-gray-300 hover:text-white hover:bg-blue-800/40"
    }`;

  function handleLogout() {
    localStorage.removeItem("token");
    navigate("/login");
  }

  return (
    <div className="flex min-h-screen bg-gray-100 text-gray-900">
      
      {/* --- Sidebar sombre --- */}
      <aside className="fixed top-0 left-0 h-full w-64 bg-gray-900 border-r border-gray-800 shadow-xl flex flex-col">
        <div className="flex items-center justify-center gap-3 py-6 border-b border-gray-800">
          <Dumbbell size={28} className="text-blue-500" />
          <h1 className="text-2xl font-bold text-white tracking-wide">
            FitnessBro
          </h1>
        </div>

        <nav className="flex-1 px-3 py-6 flex flex-col gap-2">
          <Link to="/client/dashboard" className={linkStyle("/client/dashboard")}>
            <LayoutDashboard size={20} /> Dashboard
          </Link>

          <Link to="/client/program" className={linkStyle("/client/program")}>
            <BookOpen size={20} /> Mon programme
          </Link>

          <Link to="/client/summary" className={linkStyle("/client/summary")}>
            <BarChart3 size={20} /> Bilan
          </Link>

          <Link to="/client/profile" className={linkStyle("/client/profile")}>
            👤 Mon profil
          </Link>
        </nav>

        <div className="p-4 border-t border-gray-800">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-gray-400 hover:text-red-400 transition"
          >
            <LogOut size={20} />
            Se déconnecter
          </button>
        </div>
      </aside>

      {/* --- Partie droite claire --- */}
      <div className="flex-1 flex flex-col ml-64">

        {/* Topbar sombre */}
        <ClientTopbar />

        {/* Contenu principal CLAIR */}
        <main className="flex-1 p-8 bg-gray-100">
          {children || <Outlet />}
        </main>
      </div>
    </div>
  );
}

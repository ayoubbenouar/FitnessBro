// src/components/client/ClientSidebar.tsx
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, BookOpen, BarChart2, Menu, X } from "lucide-react";

export default function ClientSidebar() {
  const [open, setOpen] = useState(true);
  const loc = useLocation();
  const link = (p: string) =>
    `flex items-center gap-3 px-4 py-2 rounded-lg transition ${
      loc.pathname === p ? "bg-blue-600 text-white" : "text-gray-700 hover:bg-blue-50"
    }`;

  return (
    <>
      <button
        className="lg:hidden fixed top-4 left-4 z-50 bg-blue-600 text-white p-2 rounded-lg shadow"
        onClick={() => setOpen(!open)}
      >
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>

      <aside
        className={`fixed top-0 left-0 h-full bg-white border-r border-gray-200 shadow-sm transition-all ${
          open ? "w-64" : "w-0 lg:w-64"
        } overflow-hidden z-40`}
      >
        <div className="flex flex-col h-full">
          <div className="px-4 py-6 border-b">
            <h1 className="text-xl font-bold text-blue-700">Espace Client</h1>
          </div>
          <nav className="flex-1 px-3 py-4 flex flex-col gap-2">
            <Link to="/client/dashboard" className={link("/client/dashboard")}>
              <Home size={18} /> Dashboard
            </Link>
            <Link to="/client/program" className={link("/client/program")}>
              <BookOpen size={18} /> Mon programme
            </Link>
            <Link to="/client/summary" className={link("/client/summary")}>
              <BarChart2 size={18} /> Bilan
            </Link>
          </nav>
        </div>
      </aside>
    </>
  );
}

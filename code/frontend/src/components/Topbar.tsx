// src/components/Topbar.tsx
import { useState, useEffect } from "react";
import { ChevronDown, LogOut, User } from "lucide-react";
import { jwtDecode } from "jwt-decode";

interface Decoded {
  sub: string;
  role: string;
  exp: number;
}

export default function Topbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [userName, setUserName] = useState<string>("Coach");
  const [userRole, setUserRole] = useState<string>("coach");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const decoded = jwtDecode<Decoded>(token);
      setUserRole(decoded.role);

      // 🔹 Charger le nom/email du coach connecté
      fetch(`http://127.0.0.1:8001/auth/user/${decoded.sub}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data?.email) {
            setUserName(data.email.split("@")[0]); // Affiche la partie avant @
          }
        })
        .catch(() => setUserName("Coach"));
    } catch {
      setUserName("Coach");
    }
  }, []);

  const logout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  return (
    <header className="bg-gray-900 text-gray-100 px-6 py-4 shadow-lg flex justify-between items-center border-b border-gray-800">
      <h1 className="text-lg font-semibold tracking-wide">
        Tableau de bord Coach 🏋️‍♂️
      </h1>

      <div className="relative">
        {/* 🔹 Bouton Coach avec nom dynamique */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex items-center gap-2 px-4 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition"
        >
          <User size={18} className="text-blue-400" />
          <span className="text-sm font-medium capitalize">{userName}</span>
          <ChevronDown size={16} />
        </button>

        {/* 🔹 Menu déroulant */}
        {menuOpen && (
          <div className="absolute right-0 mt-2 w-44 bg-gray-800 border border-gray-700 rounded-lg shadow-xl overflow-hidden z-50">
            <div className="px-4 py-2 text-sm text-gray-400 border-b border-gray-700">
              {userName}@fitnessbro.com
            </div>
            <button
              onClick={() => (window.location.href = "/profile")}
              className="w-full text-left px-4 py-2 text-sm hover:bg-gray-700 transition"
            >
              Profil
            </button>
            <button
              onClick={logout}
              className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-700 transition"
            >
              <LogOut size={14} className="inline mr-2" />
              Déconnexion
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

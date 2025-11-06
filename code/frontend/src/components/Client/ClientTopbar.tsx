// src/components/Client/ClientTopbar.tsx
import { useEffect, useState } from "react";
import { ChevronDown, LogOut, User } from "lucide-react";

export default function ClientTopbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [userEmail, setUserEmail] = useState<string>("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const decoded: any = JSON.parse(atob(token.split(".")[1]));
      const clientId = decoded?.sub;
      if (!clientId) return;

      // 🔹 Récupère les infos du client depuis auth-service
      fetch(`http://127.0.0.1:8001/auth/user/${clientId}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.email) setUserEmail(data.email);
        })
        .catch(() => setUserEmail("Client"));
    } catch {
      setUserEmail("Client");
    }
  }, []);

  const logout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  return (
    <header className="sticky top-0 z-30 bg-gray-900 border-b border-gray-800 text-white">
      <div className="px-6 py-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          Tableau de bord Client 💪
        </h2>

        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition"
          >
            <User size={18} className="text-blue-400" />
            <span className="text-sm font-medium capitalize">
              {userEmail ? userEmail.split("@")[0] : "Client"}
            </span>
            <ChevronDown size={16} />
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-44 bg-gray-800 border border-gray-700 rounded-lg shadow-xl overflow-hidden z-50">
              <div className="px-4 py-2 text-sm text-gray-400 border-b border-gray-700">
                {userEmail || "Client"}
              </div>
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
      </div>
    </header>
  );
}

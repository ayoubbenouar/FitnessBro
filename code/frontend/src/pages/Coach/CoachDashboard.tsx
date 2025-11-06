import { useEffect, useState } from "react";
import { Users, ClipboardList, Loader2, Trophy } from "lucide-react";
import { jwtDecode } from "jwt-decode";

interface Stat {
  clients: number;
  programs: number;
  compliance: number;
}

interface Decoded {
  sub: string;
  role: string;
  exp: number;
}

export default function CoachDashboard() {
  const [stats, setStats] = useState<Stat>({
    clients: 0,
    programs: 0,
    compliance: 0,
  });
  const [coachName, setCoachName] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const decoded = jwtDecode<Decoded>(token);
        const coachId = decoded?.sub;

        if (!coachId) throw new Error("Coach ID manquant");

        // 🟦 Charger le nom/email du coach
        const coachRes = await fetch(`http://127.0.0.1:8001/auth/user/${coachId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (coachRes.ok) {
          const coachData = await coachRes.json();
          if (coachData?.email) {
            setCoachName(coachData.email.split("@")[0]);
          }
        }

        // 🟩 Charger les stats du coach
        const [clientsRes, programsRes] = await Promise.all([
          fetch(`http://127.0.0.1:8001/auth/clients/${coachId}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`http://127.0.0.1:8002/programs/coach/${coachId}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (!clientsRes.ok || !programsRes.ok) {
          throw new Error("Erreur de chargement des données");
        }

        const clients = await clientsRes.json();
        const programs = await programsRes.json();

        setStats({
          clients: clients.length,
          programs: programs.length,
          compliance: Math.floor(Math.random() * 41) + 60, // Simulation %
        });
      } catch (err) {
        console.error("Erreur de chargement :", err);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 text-gray-800 p-8">
      {/* ✅ Titre personnalisé */}
      <h1 className="text-3xl font-bold text-blue-700 mb-10">
        Bienvenue, {coachName || "Coach"} 👋
      </h1>

      {loading ? (
        <div className="flex justify-center items-center h-64 text-gray-500">
          <Loader2 className="animate-spin mr-2" /> Chargement des statistiques...
        </div>
      ) : (
        <>
          {/* --- Statistiques principales --- */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {/* Clients */}
            <div className="bg-gradient-to-br from-blue-500 to-blue-700 text-white rounded-2xl p-6 shadow-md hover:shadow-lg transition">
              <div className="flex justify-between items-center mb-3">
                <Users size={30} />
                <span className="text-xs uppercase tracking-wider text-blue-200">
                  Clients
                </span>
              </div>
              <h2 className="text-4xl font-bold">{stats.clients}</h2>
              <p className="text-blue-100 text-sm mt-1">Total inscrits</p>
            </div>

            {/* Programmes */}
            <div className="bg-gradient-to-br from-green-500 to-green-700 text-white rounded-2xl p-6 shadow-md hover:shadow-lg transition">
              <div className="flex justify-between items-center mb-3">
                <ClipboardList size={30} />
                <span className="text-xs uppercase tracking-wider text-green-200">
                  Programmes
                </span>
              </div>
              <h2 className="text-4xl font-bold">{stats.programs}</h2>
              <p className="text-green-100 text-sm mt-1">Créés par vous</p>
            </div>

            {/* Conformité */}
            <div className="bg-gradient-to-br from-yellow-400 to-amber-500 text-white rounded-2xl p-6 shadow-md hover:shadow-lg transition">
              <div className="flex justify-between items-center mb-3">
                <Trophy size={30} />
                <span className="text-xs uppercase tracking-wider text-yellow-100">
                  Conformité moyenne
                </span>
              </div>
              <h2 className="text-4xl font-bold">{stats.compliance}%</h2>
              <p className="text-yellow-100 text-sm mt-1">Taux des clients</p>
            </div>
          </div>

          {/* --- Actions rapides --- */}
          <div>
            <h2 className="text-lg font-semibold text-gray-700 mb-4">
              Actions rapides
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div
                onClick={() => (window.location.href = "/coach/create")}
                className="cursor-pointer bg-white hover:bg-gray-50 border border-gray-200 p-6 rounded-xl shadow-sm hover:shadow-md transition"
              >
                <h3 className="text-lg font-semibold text-blue-600 mb-2">
                  ➕ Créer un programme
                </h3>
                <p className="text-gray-500 text-sm">
                  Concevez un plan nutritionnel et sportif complet.
                </p>
              </div>

              <div
                onClick={() => (window.location.href = "/coach/clients")}
                className="cursor-pointer bg-white hover:bg-gray-50 border border-gray-200 p-6 rounded-xl shadow-sm hover:shadow-md transition"
              >
                <h3 className="text-lg font-semibold text-green-600 mb-2">
                  👥 Gérer mes clients
                </h3>
                <p className="text-gray-500 text-sm">
                  Consultez vos clients et leurs programmes.
                </p>
              </div>

              <div
                onClick={() => (window.location.href = "/coach/add-client")}
                className="cursor-pointer bg-white hover:bg-gray-50 border border-gray-200 p-6 rounded-xl shadow-sm hover:shadow-md transition"
              >
                <h3 className="text-lg font-semibold text-amber-600 mb-2">
                  🧾 Ajouter un client
                </h3>
                <p className="text-gray-500 text-sm">
                  Créez un compte client lié à votre profil.
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

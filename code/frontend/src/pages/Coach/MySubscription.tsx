import { useEffect, useState } from "react";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Calendar,
  Users,
  ArrowRight,
} from "lucide-react";

export default function MySubscription() {
  const [loading, setLoading] = useState(true);
  const [sub, setSub] = useState<any>(null);

  useEffect(() => {
    fetchSubscription();
  }, []);

  async function fetchSubscription() {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await fetch("http://localhost:8007/payment/subscription/me", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      setSub(data);
    } catch (err) {
      console.error("Erreur subscription:", err);
    }
    setLoading(false);
  }

  const formatDate = (iso: string | null) => {
    if (!iso) return "—";
    const date = new Date(iso);
    return date.toLocaleDateString("fr-CA", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <span className="flex items-center gap-1 px-3 py-1 bg-green-100 border border-green-400 text-green-700 rounded-full text-sm">
            <CheckCircle2 size={16} /> Actif
          </span>
        );
      case "canceled":
        return (
          <span className="flex items-center gap-1 px-3 py-1 bg-red-100 border border-red-400 text-red-600 rounded-full text-sm">
            <XCircle size={16} /> Annulé
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 bg-gray-200 border border-gray-400 rounded-full text-sm">
            {status}
          </span>
        );
    }
  };

  if (loading)
    return (
      <div className="flex justify-center items-center min-h-screen text-gray-700">
        <Loader2 size={32} className="animate-spin" />
      </div>
    );

  return (
    <div className="p-8 md:p-10 w-full">
      {/* ===== TITRE ===== */}
      <h1 className="text-3xl font-bold mb-8 text-gray-900">Mon abonnement</h1>

      {/* ===== CONTENEUR CENTRÉ ===== */}
      <div className="flex justify-center">
        <div className="bg-[#0b1120] text-white rounded-xl border border-gray-700 p-8 shadow-xl w-full max-w-3xl">
          {/* HEADER */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">
              Plan : <span className="text-blue-400">{sub?.plan_name}</span>
            </h2>

            {statusBadge(sub?.status)}
          </div>

          {/* GRID DATES */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Début cycle */}
            <div className="bg-black/40 p-5 rounded-lg border border-gray-800">
              <div className="flex items-center gap-2 text-gray-300 mb-1">
                <Calendar size={18} />
                Début du cycle
              </div>
              <p className="text-lg">{formatDate(sub?.current_period_start)}</p>
            </div>

            {/* Fin cycle */}
            <div className="bg-black/40 p-5 rounded-lg border border-gray-800">
              <div className="flex items-center gap-2 text-gray-300 mb-1">
                <Calendar size={18} />
                Fin du cycle
              </div>
              <p className="text-lg">{formatDate(sub?.current_period_end)}</p>
            </div>
          </div>

          {/* LIMITE */}
          <div className="bg-black/40 p-5 rounded-lg border border-gray-800 mb-8">
            <div className="flex items-center gap-2 text-gray-300 mb-1">
              <Users size={18} />
              Limite de clients
            </div>

            <p className="text-gray-200 text-lg">
              {sub?.total_client_limit} clients maximum
            </p>

            {sub?.extra_packs > 0 && (
              <p className="text-sm text-gray-400 mt-1">
                (+ {sub.extra_packs} packs supplémentaires)
              </p>
            )}
          </div>

          {/* BOUTON */}
          <div className="flex justify-end">
            <button
              onClick={() => {
                localStorage.removeItem("selected_plan");
                window.location.href = "/";
              }}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg font-semibold text-white transition"
            >
              Changer de plan <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

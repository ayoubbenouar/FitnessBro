import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react";

interface DecodedToken {
  sub: string;
  role: string;
  exp: number;
}

interface Client {
  id: number;
  email: string;
}

interface DayForm {
  day: string;
  breakfast: string;
  lunch: string;
  dinner: string;
  workout: string;
}

export default function CreateProgram() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const decoded: DecodedToken | null = token ? jwtDecode(token) : null;
  const coachId = decoded ? Number(decoded.sub) : null;

  const [clients, setClients] = useState<Client[]>([]);
  const [clientId, setClientId] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [days, setDays] = useState<DayForm[]>([
    { day: "Lundi", breakfast: "", lunch: "", dinner: "", workout: "" },
    { day: "Mardi", breakfast: "", lunch: "", dinner: "", workout: "" },
    { day: "Mercredi", breakfast: "", lunch: "", dinner: "", workout: "" },
    { day: "Jeudi", breakfast: "", lunch: "", dinner: "", workout: "" },
    { day: "Vendredi", breakfast: "", lunch: "", dinner: "", workout: "" },
    { day: "Samedi", breakfast: "", lunch: "", dinner: "", workout: "" },
    { day: "Dimanche", breakfast: "", lunch: "", dinner: "", workout: "" },
  ]);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // 🔹 Charger uniquement les clients liés au coach connecté
  useEffect(() => {
    async function fetchClients() {
      try {
        if (!coachId) return;
        const res = await fetch(`http://127.0.0.1:8001/auth/clients/${coachId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) throw new Error("Erreur lors du chargement des clients");
        const data = await res.json();
        setClients(data);
      } catch (err) {
        console.error(err);
        setMessage("❌ Impossible de charger les clients du coach connecté");
      }
    }
    fetchClients();
  }, [coachId]);

  // 🔹 Modification d’un champ d’un jour
  function handleDayChange(index: number, field: keyof DayForm, value: string) {
    const updated = [...days];
    updated[index][field] = value;
    setDays(updated);
  }

  // 🔹 Création du programme
  async function createProgram(e: React.FormEvent) {
    e.preventDefault();
    if (!clientId || !coachId) {
      setMessage("⚠️ Sélectionnez un client valide.");
      return;
    }

    setLoading(true);
    const payload = {
      coach_id: coachId,
      client_id: clientId,
      title,
      notes,
      days: days.map((d) => ({
        day: d.day,
        meals: {
          breakfast: d.breakfast,
          lunch: d.lunch,
          dinner: d.dinner,
        },
        workout: d.workout || "Repos",
      })),
    };

    try {
      const res = await fetch("http://127.0.0.1:8002/program", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Erreur serveur");
      setMessage("✅ Programme créé avec succès !");
      setTimeout(() => navigate("/coach/clients"), 1500);
    } catch {
      setMessage("❌ Erreur lors de la création du programme");
    } finally {
      setLoading(false);
    }
  }

  // 🔹 Interface utilisateur
  return (
    <div className="max-w-5xl mx-auto p-8 bg-white rounded-2xl shadow-lg">
      <h1 className="text-3xl font-bold text-blue-700 mb-6 text-center">
        Créer un programme 🏋️
      </h1>

      {message && (
        <div
          className={`flex items-center gap-2 mb-4 p-3 rounded-lg ${
            message.includes("✅")
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {message.includes("✅") ? (
            <CheckCircle size={20} />
          ) : (
            <AlertCircle size={20} />
          )}
          {message}
        </div>
      )}

      <form onSubmit={createProgram} className="flex flex-col gap-6">
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="font-medium">Client :</label>
            <select
              className="w-full mt-1 p-3 border rounded-lg"
              value={clientId ?? ""}
              onChange={(e) => setClientId(Number(e.target.value))}
              required
            >
              <option value="">-- Sélectionner un client --</option>
              {clients.length === 0 ? (
                <option disabled>Aucun client disponible</option>
              ) : (
                clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.email.split("@")[0]}
                  </option>
                ))
              )}
            </select>
          </div>

          <div>
            <label className="font-medium">Titre du programme :</label>
            <input
              type="text"
              className="w-full mt-1 p-3 border rounded-lg"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
        </div>

        <div>
          <label className="font-medium">Notes globales :</label>
          <textarea
            className="w-full mt-1 p-3 border rounded-lg"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Objectif, recommandations..."
          />
        </div>

        {/* Days form */}
        <div className="grid md:grid-cols-2 gap-6">
          {days.map((d, i) => (
            <div key={i} className="bg-gray-50 p-4 rounded-lg shadow">
              <h3 className="font-semibold text-blue-600 mb-3">{d.day}</h3>
              <input
                placeholder="Petit-déjeuner"
                className="w-full mb-2 p-2 border rounded"
                value={d.breakfast}
                onChange={(e) => handleDayChange(i, "breakfast", e.target.value)}
              />
              <input
                placeholder="Déjeuner"
                className="w-full mb-2 p-2 border rounded"
                value={d.lunch}
                onChange={(e) => handleDayChange(i, "lunch", e.target.value)}
              />
              <input
                placeholder="Dîner"
                className="w-full mb-2 p-2 border rounded"
                value={d.dinner}
                onChange={(e) => handleDayChange(i, "dinner", e.target.value)}
              />
              <input
                placeholder="Entraînement"
                className="w-full mb-2 p-2 border rounded"
                value={d.workout}
                onChange={(e) => handleDayChange(i, "workout", e.target.value)}
              />
            </div>
          ))}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-semibold flex items-center justify-center"
        >
          {loading ? <Loader2 size={20} className="animate-spin mr-2" /> : "💪"}
          {loading ? "Création en cours..." : "Créer le programme"}
        </button>
      </form>
    </div>
  );
}

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Loader2, Pencil, Trash2 } from "lucide-react";

interface Program {
  id: number;
  title: string;
  calories: number;
  client_id: number;
  days: DayProgram[];
}

interface DayProgram {
  day: string;
  meals: Record<
    string,
    { foods: { name: string; calories: number }[]; meal_calories: number }
  >;
  workout: string;
  daily_calories: number;
}

export default function ClientProgram() {
  const { id } = useParams(); // client_id
  const navigate = useNavigate();
  const [program, setProgram] = useState<Program | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // ✅ Charger le programme du client
  useEffect(() => {
    async function fetchProgram() {
      const token = localStorage.getItem("token");
      if (!token) {
        setMessage("⚠️ Vous devez être connecté");
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`http://127.0.0.1:8002/program/client/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) throw new Error("Programme introuvable");
        const data = await res.json();

        if (!data || data.length === 0) {
          setMessage("❌ Aucun programme trouvé pour ce client");
        } else {
          setProgram(data[0]);
        }
      } catch (err) {
        console.error(err);
        setMessage("❌ Erreur lors du chargement du programme");
      } finally {
        setLoading(false);
      }
    }

    fetchProgram();
  }, [id]);

  async function handleDelete() {
    if (!program) return;
    if (!window.confirm("Voulez-vous vraiment supprimer ce programme ?")) return;

    try {
      const res = await fetch(`http://127.0.0.1:8002/program/${program.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Erreur lors de la suppression");
      alert("✅ Programme supprimé avec succès !");
      navigate("/coach/clients");
    } catch (err) {
      console.error(err);
      setMessage("❌ Échec de la suppression du programme");
    }
  }

  if (loading)
    return (
      <div className="flex justify-center items-center h-screen text-gray-500">
        <Loader2 className="animate-spin mr-2" /> Chargement du programme...
      </div>
    );

  if (!program)
    return (
      <div className="p-8 text-center text-red-600 font-semibold">
        {message || "Aucun programme trouvé pour ce client"}
      </div>
    );

  return (
    <div className="p-8 bg-white rounded-xl shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-blue-700">
          Programme de {program.title || `l’utilisateur #${program.client_id}`}
        </h1>

        <div className="flex gap-4">
          <button
            onClick={() => navigate(`/coach/edit/${program.id}`)}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
          >
            <Pencil size={18} /> Modifier
          </button>

          <button
            onClick={handleDelete}
            className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
          >
            <Trash2 size={18} /> Supprimer
          </button>
        </div>
      </div>

      <p className="text-gray-600 mb-4">
        <strong>Total hebdomadaire :</strong> {program.calories} kcal
      </p>

      {program.days.map((d, i) => (
        <div
          key={i}
          className="border border-gray-200 rounded-lg p-4 mb-4 shadow-sm bg-gray-50"
        >
          <h2 className="text-lg font-semibold text-blue-600 mb-2">
            {d.day} — <span className="text-gray-700">{d.workout}</span>
          </h2>

          {Object.entries(d.meals).map(([mealName, meal]) => (
            <div key={mealName} className="mb-2">
              <p className="font-medium text-gray-700 capitalize">
                🍽️ {mealName} — {meal.meal_calories} kcal
              </p>
              <ul className="ml-4 text-gray-600 list-disc">
                {meal.foods.map((f, idx) => (
                  <li key={idx}>
                    {f.name} ({f.calories} kcal)
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <p className="text-green-700 mt-3 font-semibold">
            ✅ Total jour : {d.daily_calories} kcal
          </p>
        </div>
      ))}
    </div>
  );
}

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react";

interface Program {
  id: number;
  title: string;
  notes?: string;
  client_id: number;
  coach_id: number;
  days: DayProgram[];
}

interface DayProgram {
  day: string;
  meals: Record<
    string,
    { foods: { name: string; calories: number }[]; meal_calories: number }
  >;
  workout: string;
}

export default function EditProgram() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [program, setProgram] = useState<Program | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // 🔹 Charger le programme à modifier
  useEffect(() => {
    async function fetchProgram() {
      try {
        const res = await fetch(`http://127.0.0.1:8002/program/${id}`);
        if (!res.ok) throw new Error("Erreur lors du chargement du programme");
        const data = await res.json();
        setProgram(data);
      } catch (err) {
        console.error(err);
        setMessage("❌ Erreur lors du chargement du programme.");
      }
    }
    fetchProgram();
  }, [id]);

  // 🔹 Gestion des changements dans le formulaire
  function handleDayChange(
    dayIndex: number,
    field: string,
    mealName: string,
    value: string
  ) {
    if (!program) return;
    const updated = { ...program };

    if (field === "workout") {
      updated.days[dayIndex].workout = value;
    } else {
      updated.days[dayIndex].meals[mealName] = {
        foods: value.split(",").map((v) => ({
          name: v.trim(),
          calories: 120,
        })),
        meal_calories: value.split(",").length * 120,
      };
    }
    setProgram(updated);
  }

  // 🔹 Envoi du programme modifié
  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!program) return;
    setLoading(true);
    setMessage(null);

    // ✅ Reformater les données pour correspondre au schéma ProgramCreate
    const payload = {
      coach_id: program.coach_id,
      client_id: program.client_id,
      title: program.title,
      notes: program.notes,
      days: program.days.map((d) => ({
        day: d.day,
        meals: Object.fromEntries(
          Object.entries(d.meals).map(([mealName, meal]) => [
            mealName,
            meal.foods.map((f) => f.name).join(", "),
          ])
        ),
        workout: d.workout,
      })),
    };

    console.log("➡️ Payload envoyé :", JSON.stringify(payload, null, 2));

    try {
      const res = await fetch(`http://127.0.0.1:8002/program/${program.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Erreur de mise à jour");

      setMessage("✅ Programme mis à jour avec succès !");
      setTimeout(() => navigate("/coach/clients"), 1500);
    } catch (err) {
      console.error(err);
      setMessage("❌ Erreur lors de la mise à jour du programme.");
    } finally {
      setLoading(false);
    }
  }

  if (!program)
    return (
      <div className="flex justify-center items-center h-screen text-gray-700">
        <Loader2 className="animate-spin mr-2" /> Chargement du programme...
      </div>
    );

  return (
    <div className="max-w-5xl mx-auto p-8 bg-white rounded-2xl shadow-lg">
      <h1 className="text-3xl font-bold text-blue-700 mb-6 text-center">
        Modifier le programme de{" "}
        <span className="text-gray-700 font-semibold">
          Client #{program.client_id}
        </span>
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

      <form onSubmit={handleUpdate} className="flex flex-col gap-6">
        {/* Informations générales */}
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="font-medium">Titre du programme :</label>
            <input
              type="text"
              className="w-full mt-1 p-3 border rounded-lg"
              value={program.title}
              onChange={(e) => setProgram({ ...program, title: e.target.value })}
            />
          </div>

          <div>
            <label className="font-medium">Notes globales :</label>
            <textarea
              className="w-full mt-1 p-3 border rounded-lg"
              rows={3}
              value={program.notes || ""}
              onChange={(e) => setProgram({ ...program, notes: e.target.value })}
            />
          </div>
        </div>

        {/* Jours et repas */}
        <div className="grid md:grid-cols-2 gap-6">
          {program.days.map((d, i) => (
            <div key={i} className="bg-gray-50 p-4 rounded-lg shadow">
              <h3 className="font-semibold text-blue-600 mb-3">{d.day}</h3>

              {Object.entries(d.meals).map(([mealName, meal]) => (
                <div key={mealName} className="mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    {mealName}
                  </label>
                  <input
                    className="w-full mt-1 p-2 border rounded"
                    defaultValue={meal.foods.map((f) => f.name).join(", ")}
                    onChange={(e) =>
                      handleDayChange(i, "meal", mealName, e.target.value)
                    }
                  />
                </div>
              ))}

              <div className="mt-3">
                <label className="block text-sm font-medium text-gray-700">
                  Entraînement
                </label>
                <input
                  className="w-full mt-1 p-2 border rounded"
                  value={d.workout}
                  onChange={(e) =>
                    handleDayChange(i, "workout", "", e.target.value)
                  }
                />
              </div>
            </div>
          ))}
        </div>

        {/* Bouton de sauvegarde */}
        <button
          type="submit"
          disabled={loading}
          className="bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition font-semibold flex items-center justify-center"
        >
          {loading ? (
            <Loader2 size={20} className="animate-spin mr-2" />
          ) : (
            "💾"
          )}
          {loading ? "Mise à jour en cours..." : "Enregistrer les modifications"}
        </button>
      </form>
    </div>
  );
}

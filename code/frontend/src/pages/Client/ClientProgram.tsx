// src/pages/Client/ClientProgram.tsx
import { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";

interface Decoded {
  sub: string;
  role: string;
  exp: number;
}
interface Food {
  name: string;
  calories: number;
}
interface Meal {
  foods: Food[];
  meal_calories: number;
}
interface DayProgram {
  day: string;
  meals: Record<string, Meal>;
  workout: string;
  daily_calories: number;
}
interface Program {
  id: number;
  title: string;
  calories: number;
  days: DayProgram[];
}

export default function ClientProgram() {
  const [program, setProgram] = useState<Program | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) return;
    const { sub } = jwtDecode(token) as Decoded;

    (async () => {
      try {
        const res = await fetch(`http://127.0.0.1:8002/program/client/${sub}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Erreur serveur");
        const arr = await res.json();
        setProgram(arr?.[arr.length - 1] ?? null);
      } catch (err) {
        console.error(err);
        setMessage("❌ Impossible de charger le programme.");
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  if (loading)
    return (
      <div className="text-center text-gray-600 mt-20">
        Chargement du programme...
      </div>
    );

  return (
    <div className="max-w-5xl mx-auto p-8">
      <h2 className="text-3xl font-bold text-blue-700 mb-8">Mon programme</h2>

      {message && (
        <div className="p-3 mb-6 bg-red-50 text-red-700 border border-red-200 rounded-lg">
          {message}
        </div>
      )}

      {!program ? (
        <div className="bg-white border rounded-xl p-6 text-gray-600 shadow">
          Aucun programme disponible pour le moment.
        </div>
      ) : (
        <>
          {/* Informations globales */}
          <div className="bg-white border rounded-xl p-6 mb-6 shadow-sm">
            <div className="text-xl font-semibold text-gray-800">
              {program.title}
            </div>
            <p className="text-gray-600 mt-1">
              Total hebdomadaire :{" "}
              <b className="text-green-600">{program.calories} kcal</b>
            </p>
          </div>

          {/* Détails par jour */}
          <div className="grid md:grid-cols-2 gap-6">
            {program.days.map((d, i) => (
              <div
                key={i}
                className="bg-white border rounded-2xl p-6 shadow-sm hover:shadow-md transition"
              >
                <h3 className="text-lg font-semibold text-blue-600 mb-2">
                  {d.day} —{" "}
                  <span className="text-gray-700 font-normal">
                    {d.workout || "Repos"}
                  </span>
                </h3>

                {Object.entries(d.meals).map(([name, meal]) => (
                  <div key={name} className="mb-3">
                    <div className="font-medium text-gray-800 capitalize">
                      🍽️ {name} — {meal.meal_calories} kcal
                    </div>
                    <ul className="list-disc ml-5 text-gray-600">
                      {meal.foods.map((f, idx) => (
                        <li key={idx}>
                          {f.name} ({f.calories} kcal)
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}

                <div className="mt-3 text-green-700 font-semibold">
                  ✅ Total jour : {d.daily_calories} kcal
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

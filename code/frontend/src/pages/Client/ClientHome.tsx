// src/pages/Client/ClientHome.tsx
import { useEffect, useMemo, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { CheckSquare, Dumbbell } from "lucide-react";

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

interface TrackingDay {
  day: string;
  meal_morning_done: boolean;
  meal_noon_done: boolean;
  meal_evening_done: boolean;
  workout_done: boolean;
  compliance_rate: number;
}

const DAYS_FR = [
  "Dimanche",
  "Lundi",
  "Mardi",
  "Mercredi",
  "Jeudi",
  "Vendredi",
  "Samedi",
];

export default function ClientHome() {
  const [program, setProgram] = useState<Program | null>(null);
  const [tracking, setTracking] = useState<Record<string, TrackingDay>>({});
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [clientName, setClientName] = useState<string>("");

  const token = localStorage.getItem("token");
  const clientId = useMemo(
    () => (token ? (jwtDecode(token) as Decoded).sub : null),
    [token]
  );

  const todayName = DAYS_FR[new Date().getDay()];

  // 🟦 Charger infos du client
  useEffect(() => {
    if (!clientId) return;
    fetch(`http://127.0.0.1:8001/auth/user/${clientId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data?.email) setClientName(data.email.split("@")[0]);
      })
      .catch(() => setClientName("Client"));
  }, [clientId]);

  // 🟩 Charger programme + tracking
  useEffect(() => {
    if (!clientId || !token) return;

    (async () => {
      try {
        // Programme
        const r = await fetch(
          `http://127.0.0.1:8002/program/client/${clientId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (r.ok) {
          const arr = await r.json();
          setProgram(arr?.[arr.length - 1] ?? null);
        }

        // Tracking
        const t = await fetch(`http://127.0.0.1:8003/tracking/me/week`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (t.ok) {
          const data: TrackingDay[] = await t.json();
          const obj: Record<string, TrackingDay> = {};
          data.forEach((d) => (obj[d.day] = d));
          setTracking(obj);
        }
      } catch (err) {
        console.error(err);
        setMessage("❌ Erreur de chargement des données");
      } finally {
        setLoading(false);
      }
    })();
  }, [clientId, token]);

  // 🟨 Toggle des repas / entraînement
  async function toggle(day: string, field: keyof TrackingDay) {
    if (!token) return;
    const prev =
      tracking[day] || {
        day,
        meal_morning_done: false,
        meal_noon_done: false,
        meal_evening_done: false,
        workout_done: false,
        compliance_rate: 0,
      };
    const updated = { ...prev, [field]: !prev[field] };
    setTracking({ ...tracking, [day]: updated });

    try {
      const res = await fetch(`http://127.0.0.1:8003/tracking/me/update`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updated),
      });
      if (res.ok) {
        const saved = await res.json();
        setTracking({ ...tracking, [day]: saved });
      }
    } catch (err) {
      console.error(err);
    }
  }

  const today = program?.days.find(
    (d) => d.day.toLowerCase() === todayName.toLowerCase()
  );

  if (loading)
    return (
      <div className="text-center text-gray-600 mt-20">
        Chargement du programme...
      </div>
    );

  return (
    <div className="max-w-5xl mx-auto p-8">
      <h2 className="text-3xl font-bold text-blue-700 mb-2">
        Bienvenue, {clientName || "Client"} 👋
      </h2>
      <p className="text-gray-600 mb-8">
        Voici votre programme pour <b>{todayName}</b>.
      </p>

      {message && (
        <div
          className={`p-3 mb-6 rounded-lg ${
            message.includes("❌")
              ? "bg-red-50 text-red-700 border border-red-300"
              : "bg-green-50 text-green-700 border border-green-300"
          }`}
        >
          {message}
        </div>
      )}

      {!today ? (
        <div className="bg-white border rounded-xl p-6 text-gray-600 shadow">
          Aucun contenu pour aujourd’hui.
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {/* --- Repas --- */}
          <div className="bg-white border rounded-2xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              🍽️ Repas du jour
            </h3>
            {Object.entries(today.meals).map(([name, meal]) => {
              const field = `meal_${name}_done` as keyof TrackingDay;
              const checked = tracking[today.day]?.[field] || false;
              return (
                <div
                  key={name}
                  className="border rounded-lg p-4 mb-3 hover:shadow transition"
                >
                  <div className="flex items-center justify-between">
                    <div className="font-medium text-gray-800 capitalize">
                      {name}
                    </div>
                    <label className="flex items-center gap-2 text-sm text-gray-600">
                      <input
                        type="checkbox"
                        checked={!!checked}
                        onChange={() => toggle(today.day, field)}
                        className="accent-blue-600"
                      />
                      Fait
                    </label>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {meal.meal_calories} kcal
                  </p>
                  <ul className="list-disc ml-5 text-gray-600 mt-2">
                    {meal.foods.map((f, i) => (
                      <li key={i}>
                        {f.name} — {f.calories} kcal
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>

          {/* --- Entraînement --- */}
          <div className="bg-white border rounded-2xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Dumbbell size={18} /> Entraînement
            </h3>
            <p className="text-gray-700 mb-3">{today.workout || "Repos"}</p>
            <label className="inline-flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={!!tracking[today.day]?.workout_done}
                onChange={() => toggle(today.day, "workout_done")}
                className="accent-blue-600"
              />
              Terminé
            </label>

            <div className="mt-6 bg-blue-50 border border-blue-200 text-blue-800 rounded-lg p-4 flex items-center gap-3">
              <CheckSquare size={18} /> Total jour :{" "}
              <b>{today.daily_calories} kcal</b>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

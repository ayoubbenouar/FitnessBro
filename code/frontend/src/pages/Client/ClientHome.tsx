// src/pages/Client/ClientHome.tsx
import { useEffect, useMemo, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { CheckSquare, Dumbbell, Gauge, PlayCircle } from "lucide-react"; // 🎬 AJOUT pour bouton vidéo

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

interface Exercise {
  name: string;
  sets: number;
  reps: number;
}

interface DayProgram {
  day: string;
  meals: Record<string, Meal>;
  workout: string;
  daily_calories: number;
  exercises?: Exercise[];
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

/** 🔵 Suivi des séries exercies (doit matcher tracking-service) */
interface ExerciseSetTracking {
  id: number;
  day: string;
  exercise_name: string;
  set_index: number;
  weight: number | null;
}

/* 🎬 État du modal vidéo */
interface VideoModal {
  open: boolean;
  title: string;
  url: string | null;
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
  const [exerciseSets, setExerciseSets] = useState<ExerciseSetTracking[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [clientName, setClientName] = useState<string>("");

  /* 🎬 AJOUT */
  const [videoModal, setVideoModal] = useState<VideoModal>({
    open: false,
    title: "",
    url: null,
  });

  const token = localStorage.getItem("token");
  const clientId = useMemo(
    () => (token ? (jwtDecode(token) as Decoded).sub : null),
    [token]
  );

  const todayName = DAYS_FR[new Date().getDay()];

  // 🟦 Charger infos du client (nom affiché)
  useEffect(() => {
    if (!clientId) return;
    fetch(`http://127.0.0.1:8001/auth/user/${clientId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data?.email) setClientName(data.email.split("@")[0]);
      })
      .catch(() => setClientName("Client"));
  }, [clientId]);

  // 🟩 Charger programme + tracking + exercices (poids)
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

        // Tracking repas / entraînement
        const t = await fetch(`http://127.0.0.1:8003/tracking/me/week`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (t.ok) {
          const data: TrackingDay[] = await t.json();
          const obj: Record<string, TrackingDay> = {};
          data.forEach((d) => (obj[d.day] = d));
          setTracking(obj);
        }

        // 🔵 Tracking des poids des exercices
        const exRes = await fetch(
          `http://127.0.0.1:8003/tracking/me/exercises`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (exRes.ok) {
          const exData: ExerciseSetTracking[] = await exRes.json();
          setExerciseSets(exData);
        }
      } catch (err) {
        console.error(err);
        setMessage("❌ Erreur de chargement des données");
      } finally {
        setLoading(false);
      }
    })();
  }, [clientId, token]);

  // 🟨 Toggle repas / entraînement (comme avant)
  async function toggle(day: string, field: keyof TrackingDay) {
    if (!token) return;

    const prevDay = tracking[day]
      ? { ...tracking[day] }
      : {
          day,
          meal_morning_done: false,
          meal_noon_done: false,
          meal_evening_done: false,
          workout_done: false,
          compliance_rate: 0,
        };

    const updatedDay = { ...prevDay, [field]: !prevDay[field] };

    const total = 4;
    const done = [
      updatedDay.meal_morning_done,
      updatedDay.meal_noon_done,
      updatedDay.meal_evening_done,
      updatedDay.workout_done,
    ].filter(Boolean).length;
    updatedDay.compliance_rate = (done / total) * 100;

    setTracking((prev) => ({
      ...prev,
      [day]: updatedDay,
    }));

    const payload = { day, [field]: updatedDay[field] };
    try {
      const res = await fetch(`http://127.0.0.1:8003/tracking/me/update`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const saved = await res.json();
        setTracking((prev) => ({
          ...prev,
          [day]: saved,
        }));
      }
    } catch (err) {
      console.error(err);
    }
  }

  // 🟢 Sauvegarde d’un poids pour une série (upsert côté backend)
  async function saveWeight(
    day: string,
    exerciseName: string,
    setIndex: number,
    raw: string
  ) {
    if (!token) return;
    const weight = raw === "" ? null : Number(raw);

    const payload = {
      day,
      exercise_name: exerciseName,
      set_index: setIndex,
      weight,
    };

    try {
      const res = await fetch(`http://127.0.0.1:8003/tracking/me/exercises`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const saved: ExerciseSetTracking = await res.json();

        // Mise à jour locale
        setExerciseSets((prev) => {
          const idx = prev.findIndex(
            (s) =>
              s.day === saved.day &&
              s.exercise_name === saved.exercise_name &&
              s.set_index === saved.set_index
          );
          if (idx !== -1) {
            const copy = [...prev];
            copy[idx] = saved;
            return copy;
          }
          return [...prev, saved];
        });
      }
    } catch (err) {
      console.error("Erreur sauvegarde poids exercice:", err);
    }
  }

  /* 🎬 FONCTION POUR OUVRIR UNE VIDÉO */
  async function openExerciseVideo(exerciseName: string) {
    try {
      const res = await fetch(
        `http://127.0.0.1:8002/program/video/${encodeURIComponent(exerciseName)}`
      );

      if (!res.ok) {
        return setVideoModal({
          open: true,
          title: exerciseName,
          url: null,
        });
      }

      const data = await res.json();

      setVideoModal({
        open: true,
        title: exerciseName,
        url: data.video_url,
      });
    } catch (err) {
      console.error(err);
      setVideoModal({ open: true, title: exerciseName, url: null });
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

      {/* 🎬 MODAL VIDEO YOUTUBE */}
      {videoModal.open && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
          <div className="bg-white rounded-xl p-4 max-w-xl w-full shadow-xl">
            <h3 className="text-xl font-semibold mb-3">
              🎥 {videoModal.title}
            </h3>

            {videoModal.url ? (
              <div className="relative w-full pb-[56.25%]">
                <iframe
                  className="absolute top-0 left-0 w-full h-full rounded-lg"
                  src={videoModal.url.replace("watch?v=", "embed/")}
                  allowFullScreen
                />
              </div>
            ) : (
              <p className="text-center text-gray-600 py-6">
                ❌ Aucune vidéo trouvée
              </p>
            )}

            <button
              onClick={() =>
                setVideoModal({ open: false, title: "", url: null })
              }
              className="mt-4 w-full bg-blue-600 text-white py-2 rounded-lg"
            >
              Fermer
            </button>
          </div>
        </div>
      )}

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
              const MEAL_FIELD_MAP: Record<string, keyof TrackingDay> = {
                breakfast: "meal_morning_done",
                lunch: "meal_noon_done",
                dinner: "meal_evening_done",
              };

              const field =
                MEAL_FIELD_MAP[name.toLowerCase()] || "meal_morning_done";
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

          {/* --- Entraînement + Poids + Vidéo --- */}
          <div className="bg-white border rounded-2xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Dumbbell size={18} /> Entraînement
            </h3>
            <p className="text-gray-700 mb-3">{today.workout || "Repos"}</p>

            {/* 🏋️ Exercices du jour */}
            {today.exercises && today.exercises.length > 0 ? (
              today.exercises.map((ex, i) => {
                const existingForExercise = exerciseSets.filter(
                  (s) =>
                    s.day.toLowerCase() === today.day.toLowerCase() &&
                    s.exercise_name === ex.name
                );

                return (
                  <div key={i} className="mb-6 border-t pt-4">
                    <div className="flex justify-between items-center">
                      <h4 className="font-semibold text-blue-700 mb-2">
                        🏋️ {ex.name} ({ex.sets}×{ex.reps})
                      </h4>

                      {/* 🎬 Bouton vidéo */}
                      <button
                        onClick={() => openExerciseVideo(ex.name)}
                        className="flex items-center gap-1 text-blue-600 hover:text-blue-800 transition"
                      >
                        <PlayCircle size={18} />
                        Vidéo
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {Array.from({ length: ex.sets }).map((_, setIdx) => {
                        const saved = existingForExercise.find(
                          (s) => s.set_index === setIdx + 1
                        );

                        return (
                          <div
                            key={setIdx}
                            className="flex flex-col items-start"
                          >
                            <label className="text-xs text-gray-500 mb-1">
                              Série {setIdx + 1}
                            </label>
                            <input
                              type="number"
                              placeholder="Poids"
                              min="0"
                              className="w-full border rounded-md px-2 py-1 text-sm"
                              defaultValue={
                                saved && saved.weight != null
                                  ? saved.weight
                                  : ""
                              }
                              onBlur={(e) =>
                                saveWeight(
                                  today.day,
                                  ex.name,
                                  setIdx + 1,
                                  e.target.value
                                )
                              }
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-gray-500 italic">
                Aucun exercice ajouté pour ce jour.
              </p>
            )}

            {/* Checkbox + stats */}
            <label className="inline-flex items-center gap-2 text-sm text-gray-700 mt-4">
              <input
                type="checkbox"
                checked={!!tracking[today.day]?.workout_done}
                onChange={() => toggle(today.day, "workout_done")}
                className="accent-blue-600"
              />
              Terminé
            </label>

            <div className="mt-6 bg-blue-50 border border-blue-200 text-blue-800 rounded-lg p-4 flex items-center gap-3 justify-between">
              <div className="flex items-center gap-2">
                <Gauge size={18} />
                <span>Taux de conformité :</span>
              </div>
              <b>{tracking[today.day]?.compliance_rate ?? 0}%</b>
            </div>

            <div className="mt-4 bg-blue-50 border border-blue-200 text-blue-800 rounded-lg p-4 flex items-center gap-3">
              <CheckSquare size={18} /> Total jour :{" "}
              <b>{today.daily_calories} kcal</b>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

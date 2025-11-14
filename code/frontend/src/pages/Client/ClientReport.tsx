import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { FileDown, ArrowLeft } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
} from "recharts";

/* ------------------ Types ------------------ */
interface Decoded {
  sub: string;
  role: string;
  exp: number;
}

interface TrackingDay {
  day: string;
  meal_morning_done: boolean;
  meal_noon_done: boolean;
  meal_evening_done: boolean;
  workout_done: boolean;
  compliance_rate: number;
}

/** Séries/poids stockés dans tracking-service */
interface ExerciseSetTracking {
  id: number;
  day: string; // "Lundi", "Mardi", etc.
  date: string; // ISO date string (ex: "2025-11-13")
  exercise_name: string;
  set_index: number; // 1, 2, 3, 4 ...
  weight: number | null;
}

/** Programme côté program-service (pour retrouver workout + reps) */
interface Exercise {
  name: string;
  sets: number;
  reps: number;
}

interface DayProgram {
  day: string;
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

/* ------------------ UI : Jauge circulaire ------------------ */
function ProgressRing({
  value,
  size = 160,
  strokeWidth = 12,
  label = "Moyenne",
}: {
  value: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
}) {
  const clamped = Math.max(0, Math.min(100, value));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - clamped / 100);

  return (
    <div className="flex flex-col items-center justify-center">
      <svg width={size} height={size}>
        <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#e5e7eb"
            strokeWidth={strokeWidth}
            fill="none"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#2563eb"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        </g>
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="24"
          fontWeight="700"
          fill="#1f2937"
        >
          {clamped.toFixed(0)}%
        </text>
      </svg>
      <div className="mt-2 text-sm text-gray-600">{label}</div>
    </div>
  );
}

/* ------------------ Page principale ------------------ */
export default function ClientReport() {
  const [week, setWeek] = useState<TrackingDay[]>([]);
  const [avg, setAvg] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  const [exerciseSets, setExerciseSets] = useState<ExerciseSetTracking[]>([]);
  const [program, setProgram] = useState<Program | null>(null);

  const token = localStorage.getItem("token");
  const { clientId: routeClientId } = useParams();
  const navigate = useNavigate();

  const clientId = useMemo(() => {
    if (routeClientId) return routeClientId; // vue coach
    if (token) return (jwtDecode(token) as Decoded).sub; // vue client
    return null;
  }, [token, routeClientId]);

  const isCoachView = Boolean(routeClientId);

  /* ------------------ Fetch Data ------------------ */
  useEffect(() => {
    if (!token || !clientId) return;

    (async () => {
      try {
        // --- 1. Daily tracking (repas / workout) ---
        const endpoint = isCoachView
          ? `http://127.0.0.1:8003/tracking/client/${clientId}/week`
          : `http://127.0.0.1:8003/tracking/me/week`;

        const res = await fetch(endpoint, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setWeek(await res.json());

        // --- 2. Stats globales ---
        const statsEndpoint = isCoachView
          ? `http://127.0.0.1:8003/tracking/client/${clientId}/stats`
          : `http://127.0.0.1:8003/tracking/me/stats`;

        const statsRes = await fetch(statsEndpoint, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (statsRes.ok) {
          const data = await statsRes.json();
          setAvg(data?.average_compliance ?? 0);
        }

        // --- 3. Programme pour récupérer workout + reps ---
        const progRes = await fetch(
          `http://127.0.0.1:8002/program/client/${clientId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (progRes.ok) {
          const arr = await progRes.json();
          setProgram(arr?.[arr.length - 1] ?? null); // dernier programme
        }

        // --- 4. Séries/poids d'exercices ---
        const exercisesEndpoint = isCoachView
          ? `http://127.0.0.1:8003/tracking/client/${clientId}/exercises`
          : `http://127.0.0.1:8003/tracking/me/exercises`;

        const exRes = await fetch(exercisesEndpoint, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (exRes.ok) setExerciseSets(await exRes.json());
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, [token, clientId, isCoachView]);

  /* ------------------ Helpers : map jour → info programme ------------------ */
  const dayToProgramInfo = useMemo(() => {
    const map = new Map<
      string,
      { workout: string; exercises: Exercise[] | undefined }
    >();
    if (!program) return map;

    for (const d of program.days) {
      map.set(d.day.toLowerCase(), {
        workout: d.workout || d.day,
        exercises: d.exercises,
      });
    }
    return map;
  }, [program]);

  /* ------------------ Volume total par groupe musculaire (semaine) ------------------ */
  const volumePerWorkout = useMemo(() => {
    const acc = new Map<string, number>();

    for (const set of exerciseSets) {
      const dayInfo = dayToProgramInfo.get(set.day.toLowerCase());
      if (!dayInfo) continue;

      const workoutLabel = dayInfo.workout || set.day;
      const exercises = dayInfo.exercises || [];
      const ex = exercises.find((e) => e.name === set.exercise_name);

      if (!ex || set.weight == null) continue;

      const reps = ex.reps || 0;
      if (!reps) continue;

      const setVolume = set.weight * reps;
      acc.set(workoutLabel, (acc.get(workoutLabel) ?? 0) + setVolume);
    }

    return Array.from(acc.entries()).map(([workout, volume]) => ({
      workout,
      volume: Math.round(volume),
    }));
  }, [exerciseSets, dayToProgramInfo]);

  /* ------------------ Evolution du volume (dates × workouts) ------------------ */
  const volumeEvolution = useMemo(() => {
    // Map "date::workout" -> volume
    const volumeByDateWorkout = new Map<string, number>();
    const workoutSet = new Set<string>();
    const dateSet = new Set<string>();

    for (const set of exerciseSets) {
      if (!set.date) continue;

      const dayInfo = dayToProgramInfo.get(set.day.toLowerCase());
      const workoutLabel = dayInfo?.workout || set.day;

      const exercises = dayInfo?.exercises || [];
      const ex = exercises.find((e) => e.name === set.exercise_name);
      if (!ex || set.weight == null) continue;

      const reps = ex.reps || 0;
      if (!reps) continue;

      const setVolume = set.weight * reps;

      const key = `${set.date}::${workoutLabel}`;
      volumeByDateWorkout.set(
        key,
        (volumeByDateWorkout.get(key) ?? 0) + setVolume
      );

      workoutSet.add(workoutLabel);
      dateSet.add(set.date);
    }

    const workoutKeys = Array.from(workoutSet.values()).sort();
    const sortedDates = Array.from(dateSet.values()).sort(); // ISO date => OK

    const evolutionData = sortedDates.map((date) => {
      const row: Record<string, any> = { date };
      for (const w of workoutKeys) {
        const k = `${date}::${w}`;
        row[w] = volumeByDateWorkout.get(k) ?? 0;
      }
      return row;
    });

    return { evolutionData, workoutKeys };
  }, [exerciseSets, dayToProgramInfo]);

  /* ------------------ Tableau charges : groupé par (workout, date) ------------------ */
  type ExerciseRow = {
    exercise_name: string;
    weights: (number | null)[];
  };

  type WorkoutDateGroup = {
    workout: string;
    date: string;
    rows: ExerciseRow[];
  };

  const groupedByWorkoutDate = useMemo<WorkoutDateGroup[]>(() => {
    const groups = new Map<string, WorkoutDateGroup>();

    for (const set of exerciseSets) {
      const dayInfo = dayToProgramInfo.get(set.day.toLowerCase());
      const workoutLabel = dayInfo?.workout || set.day;
      const dateStr = set.date || "";

      const key = `${workoutLabel}::${dateStr}`;
      if (!groups.has(key)) {
        groups.set(key, {
          workout: workoutLabel,
          date: dateStr,
          rows: [],
        });
      }

      const group = groups.get(key)!;
      let row = group.rows.find((r) => r.exercise_name === set.exercise_name);
      if (!row) {
        row = { exercise_name: set.exercise_name, weights: [] };
        group.rows.push(row);
      }
      row.weights[set.set_index - 1] = set.weight;
    }

    // tri par date puis par workout
    return Array.from(groups.values()).sort((a, b) => {
      if (a.date === b.date) return a.workout.localeCompare(b.workout);
      return a.date.localeCompare(b.date);
    });
  }, [exerciseSets, dayToProgramInfo]);

  /* ------------------ PDF (Option 2 : HTML reconstruit) ------------------ */
  function generatePDF() {
    const w = window.open("", "_blank", "width=900,height=700");
    if (!w) return;

    const formatDate = (iso?: string) => {
      if (!iso) return "—";
      const d = new Date(iso);
      if (Number.isNaN(d.getTime())) return iso;
      return d.toLocaleDateString();
    };

    // 1) Tableau repas / entraînement
    const weekRowsHtml =
      week.length === 0
        ? `<tr><td colspan="6" style="text-align:center;padding:8px;">Aucune donnée</td></tr>`
        : week
            .map(
              (d) => `
      <tr>
        <td>${d.day}</td>
        <td style="text-align:center;">${d.meal_morning_done ? "✅" : "—"}</td>
        <td style="text-align:center;">${d.meal_noon_done ? "✅" : "—"}</td>
        <td style="text-align:center;">${d.meal_evening_done ? "✅" : "—"}</td>
        <td style="text-align:center;">${d.workout_done ? "✅" : "—"}</td>
        <td style="text-align:center;">${d.compliance_rate ?? 0} %</td>
      </tr>`
            )
            .join("");

    // 2) Volume total par workout
    const volumeRowsHtml =
      volumePerWorkout.length === 0
        ? `<tr><td colspan="2" style="text-align:center;padding:8px;">Aucun volume calculé</td></tr>`
        : volumePerWorkout
            .map(
              (v) => `
      <tr>
        <td>${v.workout}</td>
        <td style="text-align:right;">${v.volume}</td>
      </tr>`
            )
            .join("");

    // 3) Évolution du volume (tableau date × workout)
    const { evolutionData, workoutKeys } = volumeEvolution;

    const evolutionHeadHtml =
      workoutKeys.length === 0
        ? ""
        : workoutKeys.map((wKey) => `<th>${wKey}</th>`).join("");

    const evolutionBodyHtml =
      evolutionData.length === 0
        ? `<tr><td colspan="${1 + workoutKeys.length}" style="text-align:center;padding:8px;">Pas assez de données</td></tr>`
        : evolutionData
            .map((row) => {
              const dateStr = formatDate(row.date as string);
              const cols = workoutKeys
                .map((wKey) => {
                  const val = row[wKey] ?? 0;
                  return `<td style="text-align:right;">${val}</td>`;
                })
                .join("");
              return `
        <tr>
          <td>${dateStr}</td>
          ${cols}
        </tr>`;
            })
            .join("");

    // 4) Suivi détaillé des charges
    const groupsHtml =
      groupedByWorkoutDate.length === 0
        ? `<p>Aucune donnée de poids enregistrée.</p>`
        : groupedByWorkoutDate
            .map((group) => {
              const rowsHtml = group.rows
                .map((row) => {
                  const seriesStr =
                    row.weights
                      .map((w, i) => (w != null ? `S${i + 1}: ${w} kg` : null))
                      .filter(Boolean)
                      .join(" | ") || "—";
                  return `
              <tr>
                <td>${row.exercise_name}</td>
                <td>${seriesStr}</td>
              </tr>`;
                })
                .join("");

              return `
        <div style="margin-bottom:16px;border:1px solid #e5e7eb;border-radius:6px;overflow:hidden;">
          <div style="background:#f3f4f6;padding:8px 12px;font-weight:600;display:flex;justify-content:space-between;">
            <span>Entraînement : ${group.workout}</span>
            <span>Date : ${group.date ? formatDate(group.date) : "—"}</span>
          </div>
          <table style="width:100%;border-collapse:collapse;">
            <thead>
              <tr>
                <th style="border:1px solid #e5e7eb;padding:6px 8px;">Exercice</th>
                <th style="border:1px solid #e5e7eb;padding:6px 8px;">Séries (kg)</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
        </div>`;
            })
            .join("");

    // 5) Construction du HTML final
    const html = `
      <html>
        <head>
          <title>Bilan hebdomadaire</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              color: #111827;
              padding: 24px;
              max-width: 900px;
              margin: 0 auto;
            }
            h1, h2, h3 {
              font-weight: 600;
              margin: 0;
            }
            h1 {
              text-align: center;
              margin-bottom: 16px;
            }
            h2.section-title {
              font-size: 18px;
              margin-top: 24px;
              margin-bottom: 8px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 8px;
              margin-bottom: 16px;
            }
            th, td {
              border: 1px solid #e5e7eb;
              padding: 6px 8px;
              font-size: 13px;
            }
            th {
              background: #f3f4f6;
              text-align: left;
            }
            .summary-box {
              border: 1px solid #e5e7eb;
              border-radius: 6px;
              padding: 12px 16px;
              margin-bottom: 8px;
              background: #f9fafb;
            }
          </style>
        </head>
        <body>
          <h1>Bilan hebdomadaire</h1>

          <!-- 1. Résumé -->
          <h2 class="section-title">Résumé de la semaine</h2>
          <div class="summary-box">
            <p>Conformité moyenne : <strong>${avg.toFixed(
              1
            )}%</strong></p>
          </div>

          <!-- 2. Détails journaliers -->
          <h2 class="section-title">Détails journaliers (repas & entraînement)</h2>
          <table>
            <thead>
              <tr>
                <th>Jour</th>
                <th>Matin</th>
                <th>Midi</th>
                <th>Soir</th>
                <th>Entraînement</th>
                <th>Conformité</th>
              </tr>
            </thead>
            <tbody>
              ${weekRowsHtml}
            </tbody>
          </table>

          <!-- 3. Volume total par groupe musculaire -->
          <h2 class="section-title">Volume total par groupe musculaire (semaine)</h2>
          <table>
            <thead>
              <tr>
                <th>Groupe musculaire / Entraînement</th>
                <th>Volume (kg × reps)</th>
              </tr>
            </thead>
            <tbody>
              ${volumeRowsHtml}
            </tbody>
          </table>

          <!-- 4. Évolution du volume -->
          <h2 class="section-title">Évolution du volume par groupe musculaire</h2>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                ${evolutionHeadHtml}
              </tr>
            </thead>
            <tbody>
              ${evolutionBodyHtml}
            </tbody>
          </table>

          <!-- 5. Suivi détaillé des charges -->
          <h2 class="section-title">Suivi détaillé des charges</h2>
          ${groupsHtml}
        </body>
      </html>
    `;

    w.document.open();
    w.document.write(html);
    w.document.close();
    w.focus();
    w.print();
    w.close();
  }

  if (loading)
    return <div className="text-center text-gray-600 mt-20">Chargement...</div>;

  /* ------------------ UI à l'écran (avec graphiques) ------------------ */
  return (
    <div className="max-w-5xl mx-auto p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div className="flex items-center gap-3">
          {isCoachView && (
            <button
              onClick={() => navigate("/coach/bilan")}
              className="flex items-center gap-2 bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-2 rounded-lg transition"
            >
              <ArrowLeft size={18} /> Retour
            </button>
          )}
          <h2 className="text-3xl font-bold text-blue-700">
            {isCoachView ? "Bilan du client" : "Mon bilan hebdomadaire"}
          </h2>
        </div>

        <button
          onClick={generatePDF}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow transition"
        >
          <FileDown size={18} /> Générer le PDF
        </button>
      </div>

      {/* --- Résumé global + conformité (UI) --- */}
      <div className="bg-white border rounded-xl shadow-sm p-6 mb-8">
        <div className="grid md:grid-cols-3 gap-6 items-center">
          <div className="flex justify-center">
            <ProgressRing value={avg} label="Taux moyen" />
          </div>

          <div className="md:col-span-2">
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              Résumé de la semaine
            </h3>
            <p className="text-gray-600">
              Conformité moyenne :{" "}
              <b className="text-green-600">{avg.toFixed(1)}%</b>
            </p>

            <div className="w-full h-64 mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={week.map((d) => ({
                    day: d.day,
                    compliance: d.compliance_rate,
                  }))}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Legend />
                  <Bar
                    dataKey="compliance"
                    fill="#2563eb"
                    name="Conformité (%)"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* --- Tableau repas / entraînement (UI) --- */}
      <div className="bg-white border rounded-xl shadow-sm p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Détails journaliers
        </h3>

        <div className="overflow-x-auto">
          <table className="min-w-full border text-sm text-gray-700">
            <thead className="bg-gray-100 text-gray-800">
              <tr>
                <th className="px-4 py-2 border">Jour</th>
                <th className="px-4 py-2 border">Matin</th>
                <th className="px-4 py-2 border">Midi</th>
                <th className="px-4 py-2 border">Soir</th>
                <th className="px-4 py-2 border">Entraînement</th>
                <th className="px-4 py-2 border">Conformité</th>
              </tr>
            </thead>
            <tbody>
              {week.map((d) => (
                <tr
                  key={d.day}
                  className="odd:bg-white even:bg-gray-50 hover:bg-blue-50 transition"
                >
                  <td className="px-4 py-2 border font-medium">{d.day}</td>
                  <td className="px-4 py-2 border text-center">
                    {d.meal_morning_done ? "✅" : "—"}
                  </td>
                  <td className="px-4 py-2 border text-center">
                    {d.meal_noon_done ? "✅" : "—"}
                  </td>
                  <td className="px-4 py-2 border text-center">
                    {d.meal_evening_done ? "✅" : "—"}
                  </td>
                  <td className="px-4 py-2 border text-center">
                    {d.workout_done ? "✅" : "—"}
                  </td>
                  <td className="px-4 py-2 border text-center">
                    <span className="inline-block px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                      {d.compliance_rate ?? 0} %
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- Volume total par groupe musculaire (UI) --- */}
      <div className="bg-white border rounded-xl shadow-sm p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Volume total par groupe musculaire (semaine)
        </h3>

        {volumePerWorkout.length === 0 ? (
          <p className="text-gray-500 text-sm">
            Aucun volume calculé (pas de poids enregistrés).
          </p>
        ) : (
          <div className="w-full h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={volumePerWorkout}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="workout" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar
                  dataKey="volume"
                  fill="#2563eb"
                  name="Volume (kg × reps)"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* --- Evolution du volume (multi-courbes, UI) --- */}
      <div className="bg-white border rounded-xl shadow-sm p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Évolution du volume par groupe musculaire
        </h3>

        {volumeEvolution.evolutionData.length === 0 ? (
          <p className="text-gray-500 text-sm">
            Pas assez de données pour tracer l&apos;évolution.
          </p>
        ) : (
          <div className="w-full h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={volumeEvolution.evolutionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(value) =>
                    new Date(value as string).toLocaleDateString()
                  }
                />
                <YAxis />
                <Tooltip
                  labelFormatter={(value) =>
                    new Date(value as string).toLocaleDateString()
                  }
                />
                <Legend />
                {volumeEvolution.workoutKeys.map((workout, idx) => {
                  const colors = [
                    "#2563eb",
                    "#16a34a",
                    "#f97316",
                    "#a855f7",
                    "#ef4444",
                    "#0ea5e9",
                  ];
                  return (
                    <Line
                      key={workout}
                      type="monotone"
                      dataKey={workout}
                      name={workout}
                      stroke={colors[idx % colors.length]}
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                  );
                })}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* --- Tableau des charges groupé par Entraînement + Date (UI) --- */}
      <div className="bg-white border rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Suivi détaillé des charges
        </h3>

        {groupedByWorkoutDate.length === 0 ? (
          <p className="text-gray-500 text-sm">
            Aucune donnée de poids enregistrée.
          </p>
        ) : (
          <div className="flex flex-col gap-6">
            {groupedByWorkoutDate.map((group, idx) => (
              <div
                key={`${group.workout}-${group.date}-${idx}`}
                className="border rounded-lg overflow-hidden"
              >
                <div className="px-4 py-2 bg-gray-100 font-semibold text-gray-800 flex justify-between">
                  <span>Entraînement : {group.workout}</span>
                  <span>
                    Date :{" "}
                    {group.date
                      ? new Date(group.date).toLocaleDateString()
                      : "—"}
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full border text-sm text-gray-700">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 border">Exercice</th>
                        <th className="px-4 py-2 border">Séries (kg)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.rows.map((row) => (
                        <tr key={row.exercise_name}>
                          <td className="px-4 py-2 border">
                            {row.exercise_name}
                          </td>
                          <td className="px-4 py-2 border">
                            {row.weights
                              .map((w, i) =>
                                w != null ? `S${i + 1}: ${w} kg` : null
                              )
                              .filter(Boolean)
                              .join("  |  ") || "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

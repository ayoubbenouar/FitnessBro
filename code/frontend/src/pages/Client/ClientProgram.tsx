import { useEffect, useState, useRef } from "react";
import { jwtDecode } from "jwt-decode";
import { FileDown } from "lucide-react";

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
  exercises?: Exercise[];
  daily_calories: number;
}
interface Program {
  id: number;
  title: string;
  calories: number;
  days: DayProgram[];
  coach_id?: number;
}

export default function ClientProgram() {
  const [program, setProgram] = useState<Program | null>(null);
  const [coachName, setCoachName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const printableRef = useRef<HTMLDivElement>(null);
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) return;
    const { sub } = jwtDecode(token) as Decoded;

    (async () => {
      try {
        // Charger le dernier programme du client
        const res = await fetch(`http://127.0.0.1:8002/program/client/${sub}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Erreur serveur");
        const arr = await res.json();
        const prog = arr?.[arr.length - 1] ?? null;
        setProgram(prog);

        // Charger le nom du coach si présent
        if (prog?.coach_id) {
          const coachRes = await fetch(
            `http://127.0.0.1:8001/auth/user/${prog.coach_id}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          if (coachRes.ok) {
            const coachData = await coachRes.json();
            if (coachData?.email)
              setCoachName(coachData.email.split("@")[0]); // juste avant le "@"
          }
        }
      } catch (err) {
        console.error(err);
        setMessage("❌ Impossible de charger le programme.");
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  // 🔵 Génération PDF (avec logo + coach)
  function generatePDF() {
    const html = printableRef.current?.innerHTML || "";
    const w = window.open("", "_blank", "width=900,height=700");
    if (!w) return;
    w.document.write(`
      <html>
        <head>
          <title>Programme - FitnessBro</title>
          <style>
            body { font-family: Arial, sans-serif; color: #111; padding: 24px; }
            h1, h2, h3 { margin: 0; }
            .header { 
              display: flex; justify-content: space-between; align-items: center; 
              margin-bottom: 24px; border-bottom: 2px solid #1d4ed8; padding-bottom: 8px;
            }
            .logo {
              display: flex; align-items: center; gap: 8px;
            }
            .logo img {
              height: 40px;
            }
            .logo span {
              font-size: 20px; font-weight: bold; color: #1d4ed8;
            }
            .coach { font-size: 14px; color: #555; }
            .day-card { border: 1px solid #e5e7eb; border-radius: 10px; padding: 12px; margin-bottom: 16px; background: #fafafa; }
            ul { margin-top: 4px; margin-left: 20px; }
            .total { margin-top: 8px; color: #047857; font-weight: bold; }
            .footer { margin-top: 32px; text-align: right; font-size: 13px; color: #555; border-top: 1px solid #ddd; padding-top: 8px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">
              <img 
                src="data:image/svg+xml;base64,PHN2ZyBmaWxsPSIjMTRhMmY0IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0OCIgaGVpZ2h0PSI0OCIgdmlld0JveD0iMCAwIDQ4IDQ4Ij48cGF0aCBkPSJNNSA5djMwYTIgMiAwIDAgMCA0IDBoMmEyIDIgMCAwIDAgMi0ydi0xMWg0djExYTIgMiAwIDAgMCA0IDBoMmEyIDIgMCAwIDAgMi0ydi0zMGExMCAxMCAwIDAgMC0xMC0xMGgtOGExMCAxMCAwIDAgMC0xMCAxMHYzem0xOC0ydi0yNmE4IDggMCAwIDEgOCA4djEwYTIgMiAwIDAgMS0yIDJoLTZhMiAyIDAgMCAxLTItMnoiLz48L3N2Zz4=" 
                alt="FitnessBro Logo"
              />
              <span>FitnessBro</span>
            </div>
            <div class="coach"><strong>Coach :</strong> ${coachName || "Non spécifié"}</div>
          </div>
          ${html}
          <div class="footer">
            Généré par <strong>FitnessBro</strong> — ${new Date().toLocaleDateString()}
          </div>
        </body>
      </html>
    `);
    w.document.close();
    w.focus();
    w.print();
    w.close();
  }

  if (loading)
    return (
      <div className="text-center text-gray-600 mt-20">
        Chargement du programme...
      </div>
    );

  return (
    <div className="max-w-5xl mx-auto p-8">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-bold text-blue-700">Mon programme</h2>

        {program && (
          <button
            onClick={generatePDF}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow transition"
          >
            <FileDown size={18} /> Générer le PDF
          </button>
        )}
      </div>

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
        <div ref={printableRef}>
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
                className="bg-white border rounded-2xl p-6 shadow-sm hover:shadow-md transition day-card"
              >
                <h3 className="text-lg font-semibold text-blue-600 mb-2">
                  {d.day} —{" "}
                  <span className="text-gray-700 font-normal">
                    {d.workout || "Repos"}
                  </span>
                </h3>

                {/* 🍽️ Repas */}
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

                {/* 🏋️ Exercices */}
                {d.exercises && d.exercises.length > 0 && (
                  <div className="mt-3">
                    <h4 className="font-semibold text-blue-700 mb-1">
                      🏋️ Exercices :
                    </h4>
                    <ul className="ml-4 list-disc text-gray-700">
                      {d.exercises.map((ex, idx) => (
                        <li key={idx}>
                          {ex.name} — <b>{ex.sets}x{ex.reps}</b>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="mt-3 text-green-700 font-semibold">
                  ✅ Total jour : {d.daily_calories} kcal
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

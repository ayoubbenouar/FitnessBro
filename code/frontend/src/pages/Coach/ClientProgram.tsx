import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Loader2, Pencil, Trash2, FileDown } from "lucide-react";

interface Program {
  id: number;
  title: string;
  calories: number;
  client_id: number;
  coach_id?: number;
  days: DayProgram[];
}

interface Exercise {
  name: string;
  sets: number;
  reps: number;
}

interface DayProgram {
  day: string;
  meals: Record<
    string,
    { foods: { name: string; calories: number }[]; meal_calories: number }
  >;
  workout: string;
  exercises?: Exercise[];
  daily_calories: number;
}

export default function ClientProgram() {
  const { id } = useParams(); // client_id
  const navigate = useNavigate();
  const printableRef = useRef<HTMLDivElement>(null);

  const [program, setProgram] = useState<Program | null>(null);
  const [coachName, setCoachName] = useState<string>("");
  const [clientName, setClientName] = useState<string>("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // ✅ Charger programme + noms coach/client
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
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error("Programme introuvable");
        const data = await res.json();

        if (!data || data.length === 0) {
          setMessage("❌ Aucun programme trouvé pour ce client");
        } else {
          const prog = data[0];
          setProgram(prog);

          // 🔹 Nom du client
          const clientRes = await fetch(
            `http://127.0.0.1:8001/auth/user/${prog.client_id}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          if (clientRes.ok) {
            const clientData = await clientRes.json();
            if (clientData?.email)
              setClientName(clientData.email.split("@")[0]);
          }

          // 🔹 Nom du coach
          if (prog?.coach_id) {
            const coachRes = await fetch(
              `http://127.0.0.1:8001/auth/user/${prog.coach_id}`,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            if (coachRes.ok) {
              const coachData = await coachRes.json();
              if (coachData?.email)
                setCoachName(coachData.email.split("@")[0]);
            }
          }
        }
      } catch (err) {
        console.error(err);
        setMessage("❌ Impossible de charger les informations du programme.");
      } finally {
        setLoading(false);
      }
    }

    fetchProgram();
  }, [id]);

  // 🔵 Génération du PDF avec logo + nom coach/client
  function generatePDF() {
    const html = printableRef.current?.innerHTML || "";
    const w = window.open("", "_blank", "width=900,height=700");
    if (!w) return;

    w.document.write(`
      <html>
        <head>
          <title>Programme du client - FitnessBro</title>
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
              height: 40px; vertical-align: middle;
            }
            .logo span {
              font-size: 20px; font-weight: bold; color: #1d4ed8;
            }
            .coach { font-size: 14px; color: #444; }
            .day-card {
              border: 1px solid #e5e7eb; border-radius: 10px;
              padding: 12px; margin-bottom: 16px; background: #fafafa;
            }
            ul { margin-top: 4px; margin-left: 20px; }
            .total { margin-top: 8px; color: #047857; font-weight: bold; }
            .footer {
              margin-top: 32px; text-align: right; font-size: 13px;
              color: #555; border-top: 1px solid #ddd; padding-top: 8px;
            }
            .title {
              font-size: 20px; color: #1d4ed8; margin-bottom: 8px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">
              <img 
                src="data:image/svg+xml;base64,PHN2ZyBmaWxsPSIjMTRhMmY0IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0OCIgaGVpZ2h0PSI0OCIgdmlld0JveD0iMCAwIDQ4IDQ4Ij48cGF0aCBkPSJNNSA5djMwYTIgMiAwIDAgMCA0IDBoMmEyIDIgMCAwIDAgMi0ydi0xMWg0djExYTIgMiAwIDAgMCA0IDBoMmEyIDIgMCAwIDAgMi0ydi0zMGExMCAxMCAwIDAgMC0xMC0xMGgtOGExMCAxMCAwIDAgMC0xMCAxMHYzem0xOC0ydi0yNmE4IDggMCAwIDEgOCA4djEwYTIgMiAwIDAgMS0yIDJoLTZhMiAyIDAgMCAxLTItMnoiLz48L3N2Zz4=" 
                alt="Logo FitnessBro"
              />
              <span>FitnessBro</span>
            </div>
            <div class="coach"><strong>Coach :</strong> ${coachName || "Non spécifié"}</div>
          </div>

          <div class="title">
            <strong>Programme de ${clientName || "Client"}</strong>
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
          Programme de {clientName || `l’utilisateur #${program.client_id}`}
        </h1>

        <div className="flex gap-4">
          <button
            onClick={generatePDF}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            <FileDown size={18} /> Générer PDF
          </button>

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

      <div ref={printableRef}>
        <p className="text-gray-600 mb-4">
          <strong>Total hebdomadaire :</strong>{" "}
          <span className="text-green-600 font-semibold">
            {program.calories} kcal
          </span>
        </p>

        {program.days.map((d, i) => (
          <div
            key={i}
            className="border border-gray-200 rounded-lg p-4 mb-4 shadow-sm bg-gray-50"
          >
            <h2 className="text-lg font-semibold text-blue-600 mb-2">
              {d.day} — <span className="text-gray-700">{d.workout}</span>
            </h2>

            {/* 🍽️ Repas */}
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

            <p className="text-green-700 mt-3 font-semibold">
              ✅ Total jour : {d.daily_calories} kcal
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// src/pages/Client/ClientReport.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { FileDown } from "lucide-react";

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

export default function ClientReport() {
  const [week, setWeek] = useState<TrackingDay[]>([]);
  const [avg, setAvg] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("token");
  const printableRef = useRef<HTMLDivElement>(null);

  const clientId = useMemo(
    () => (token ? (jwtDecode(token) as Decoded).sub : null),
    [token]
  );

  useEffect(() => {
    if (!token || !clientId) return;

    (async () => {
      try {
        // Charger le suivi hebdomadaire
        const t = await fetch("http://127.0.0.1:8003/tracking/me/week", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (t.ok) setWeek(await t.json());

        // Charger les stats globales
        const s = await fetch("http://127.0.0.1:8003/tracking/me/stats", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (s.ok) {
          const data = await s.json();
          setAvg(data?.average_compliance ?? 0);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, [token, clientId]);

  // Génération PDF (simple via window.print)
  function generatePDF() {
    const html = printableRef.current?.innerHTML || "";
    const w = window.open("", "_blank", "width=900,height=700");
    if (!w) return;
    w.document.write(`
      <html>
        <head>
          <title>Bilan hebdomadaire</title>
          <style>
            body { font-family: Arial, sans-serif; color: #111; padding: 24px; }
            h1 { color: #1d4ed8; }
            table { width: 100%; border-collapse: collapse; margin-top: 12px; }
            th, td { border: 1px solid #e5e7eb; padding: 8px; text-align: left; font-size: 14px; }
            th { background: #f3f4f6; }
            .tag { padding: 2px 8px; border-radius: 999px; background: #e5f4ef; color: #065f46; font-weight: 600; font-size: 12px; }
          </style>
        </head>
        <body>${html}</body>
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
        Chargement du bilan...
      </div>
    );

  return (
    <div className="max-w-5xl mx-auto p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold text-blue-700">
          Bilan hebdomadaire
        </h2>
        <button
          onClick={generatePDF}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow transition"
        >
          <FileDown size={18} /> Générer le PDF
        </button>
      </div>

      <div ref={printableRef}>
        <div className="bg-white border rounded-xl shadow-sm p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-3">
            Résumé de la semaine
          </h3>
          <p className="text-gray-600 mb-4">
            Taux de conformité moyen :{" "}
            <b className="text-green-600">{avg.toFixed(1)} %</b>
          </p>

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
      </div>
    </div>
  );
}

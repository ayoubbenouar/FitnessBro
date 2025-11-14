import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { Gauge, FileBarChart } from "lucide-react";

interface Decoded {
  sub: string;
  role: string;
  exp: number;
}

interface ClientStats {
  client_id: number;
  email: string;
  average_compliance: number;
}

export default function CoachBilan() {
  const [clients, setClients] = useState<ClientStats[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) return;

    const decoded: Decoded = jwtDecode(token);
    const coachId = decoded.sub;

    (async () => {
      try {
        const res = await fetch(
          `http://127.0.0.1:8003/tracking/coach/${coachId}/clients-stats`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (res.ok) {
          const data = await res.json();
          setClients(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  if (loading)
    return (
      <div className="text-center text-gray-600 mt-20">
        Chargement du bilan coach...
      </div>
    );

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-blue-700 flex items-center gap-2">
          <FileBarChart size={24} /> Bilan de mes clients
        </h1>
      </div>

      {clients.length === 0 ? (
        <p className="text-gray-500 italic">
          Aucun client n’est encore enregistré.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full bg-white shadow-lg rounded-lg overflow-hidden">
            <thead className="bg-blue-600 text-white">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold">
                  Taux moyen
                </th>
                <th className="px-6 py-3 text-center text-sm font-semibold">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {clients.map((c) => (
                <tr
                  key={c.client_id}
                  className="border-b hover:bg-blue-50 transition"
                >
                  <td className="px-6 py-3 font-medium text-gray-800">
                    {c.email.split("@")[0]}
                  </td>
                  <td className="px-6 py-3 text-gray-700">
                    <div className="flex items-center gap-2">
                      <Gauge size={16} className="text-blue-600" />
                      {c.average_compliance.toFixed(1)} %
                    </div>
                  </td>
                  <td className="px-6 py-3 text-center">
                    <button
                      onClick={() =>
                        navigate(`/coach/client/${c.client_id}/report`)
                      }
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Voir le rapport →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

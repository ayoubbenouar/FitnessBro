import { useEffect, useState } from "react";
import { UserPlus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AddClientModal from "../../components/AddClientModal";

interface Client {
  id: number;
  email: string;
}

export default function ClientList() {
  const [clients, setClients] = useState<Client[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();

  // 🔹 Charger les clients du coach connecté
  useEffect(() => {
    async function fetchClients() {
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("Aucun token trouvé");
        const decoded: any = JSON.parse(atob(token.split(".")[1]));
        const coachId = decoded.sub;

        const res = await fetch(`http://127.0.0.1:8001/auth/clients/${coachId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) throw new Error("Erreur lors du chargement des clients");
        const data = await res.json();
        setClients(data);
      } catch (err) {
        console.error(err);
        setMessage("❌ Impossible de charger les clients");
      }
    }
    fetchClients();
  }, []);

  // 🔄 Rafraîchir après ajout d’un client
  async function refreshClients() {
    const token = localStorage.getItem("token");
    const decoded: any = JSON.parse(atob(token!.split(".")[1]));
    const coachId = decoded.sub;

    const res = await fetch(`http://127.0.0.1:8001/auth/clients/${coachId}`);
    const data = await res.json();
    setClients(data);
  }

  // ✅ Lorsqu’on clique sur un client
  function handleClientClick(clientId: number) {
    navigate(`/coach/client/${clientId}`); // 👈 redirige vers la page ClientProgram
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          👥 Liste des clients
        </h1>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-md transition"
        >
          <UserPlus size={20} /> Ajouter un client
        </button>
      </div>

      {message && <p className="text-red-500 font-medium mb-4">{message}</p>}

      {/* ✅ Tableau des clients */}
      <div className="overflow-x-auto">
        <table className="w-full bg-white shadow-lg rounded-lg overflow-hidden">
          <thead className="bg-blue-600 text-white">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold">
                Nom du client
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold">
                Email
              </th>
              <th className="px-6 py-3 text-center text-sm font-semibold">
                Actions
              </th>
            </tr>
          </thead>

          <tbody>
            {clients.map((c) => (
              <tr
                key={c.id}
                className="border-b hover:bg-blue-50 transition cursor-pointer"
                onClick={() => handleClientClick(c.id)}
              >
                <td className="px-6 py-3 font-medium text-gray-700">
                  {c.email.split("@")[0]}
                </td>
                <td className="px-6 py-3 text-gray-600">{c.email}</td>
                <td className="px-6 py-3 text-center text-blue-600 font-medium">
                  Voir le programme →
                </td>
              </tr>
            ))}

            {clients.length === 0 && (
              <tr>
                <td
                  colSpan={3}
                  className="px-6 py-4 text-center text-gray-500 italic"
                >
                  Aucun client enregistré pour ce coach.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Fenêtre modale d’ajout */}
      {isModalOpen && (
        <AddClientModal
          onClose={() => setIsModalOpen(false)}
          onClientAdded={refreshClients}
        />
      )}
    </div>
  );
}

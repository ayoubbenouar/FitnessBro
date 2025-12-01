// src/pages/Coach/ClientList.tsx
import { useEffect, useState } from "react";
import { UserPlus, Trash2 } from "lucide-react";
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
  const [clientLimit, setClientLimit] = useState<number | null>(null);
  const [isLimitReached, setIsLimitReached] = useState(false);
  const navigate = useNavigate();

  // 🔹 Charger les clients du coach connecté
  useEffect(() => {
    fetchClients();
  }, []);

  async function fetchClients() {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Aucun token trouvé");

      const decoded: any = JSON.parse(atob(token.split(".")[1]));
      const coachId = decoded.sub;

      // 🔹 Charger la liste des clients
      const res = await fetch(`http://127.0.0.1:8001/auth/clients/${coachId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Erreur lors du chargement des clients");
      const clientData = await res.json();
      setClients(clientData);

      // 🔥 Charger la limite depuis PAYMENT-SERVICE
      const subRes = await fetch(
        "http://127.0.0.1:8007/payment/subscription/me",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (subRes.ok) {
        const subData = await subRes.json();
        const limit = subData?.total_client_limit ?? 0;

        setClientLimit(limit);
        setIsLimitReached(clientData.length >= limit);
      }
    } catch (err) {
      console.error(err);
      setMessage("❌ Impossible de charger les clients");
    }
  }

  // 🔄 Rafraîchir après ajout ou suppression
  async function refreshClients() {
    await fetchClients();
  }

  // 🗑️ Supprimer un client
  async function handleDeleteClient(
    clientId: number,
    event: React.MouseEvent
  ) {
    event.stopPropagation(); // évite la navigation

    if (!confirm("Voulez-vous vraiment supprimer ce client ?")) return;

    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Token manquant");

      const res = await fetch(`http://127.0.0.1:8001/auth/clients/${clientId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Erreur de suppression");

      setClients((prev) => prev.filter((c) => c.id !== clientId));
      setMessage("✅ Client supprimé avec succès !");
      fetchClients();
    } catch (err) {
      console.error(err);
      setMessage("❌ Erreur lors de la suppression du client");
    }
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">👥 Liste des clients</h1>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-md transition"
          >
            <UserPlus size={20} /> Ajouter un client
          </button>

          {/* 🔥 Affichage du message limite atteinte */}
          {isLimitReached && clientLimit !== null && (
            <span className="text-red-600 font-semibold">
              🔥 Limite atteinte ({clients.length}/{clientLimit})
            </span>
          )}
        </div>
      </div>

      {message && <p className="text-blue-600 font-medium mb-4">{message}</p>}

      <div className="overflow-x-auto">
        <table className="w-full bg-white shadow-lg rounded-lg overflow-hidden">
          <thead className="bg-blue-600 text-white">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold">
                Nom du client
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Email</th>
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
                onClick={() => navigate(`/coach/client/${c.id}`)}
              >
                <td className="px-6 py-3 font-medium text-gray-700">
                  {c.email.split("@")[0]}
                </td>
                <td className="px-6 py-3 text-gray-600">{c.email}</td>

                <td className="px-6 py-3 text-center">
                  <div className="flex justify-center gap-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/coach/client/${c.id}/profile`);
                      }}
                      className="text-blue-700 hover:underline"
                    >
                      Profil
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/coach/client/${c.id}`);
                      }}
                      className="text-green-700 hover:underline"
                    >
                      Programme →
                    </button>

                    <button
                      onClick={(e) => handleDeleteClient(c.id, e)}
                      className="text-red-600 hover:text-red-800 transition"
                      title="Supprimer le client"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
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

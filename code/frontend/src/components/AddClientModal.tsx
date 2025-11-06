// src/components/AddClientModal.tsx
import { useState } from "react";
import { X } from "lucide-react";

interface Props {
  onClose: () => void;
  onClientAdded: () => void;
}

export default function AddClientModal({ onClose, onClientAdded }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleAddClient(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const token = localStorage.getItem("token");
      const decoded: any = JSON.parse(atob(token!.split(".")[1]));
      const coachId = decoded.sub;

      const res = await fetch(`http://127.0.0.1:8001/auth/clients/${coachId}/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) throw new Error("Erreur de création du client");

      setMessage("✅ Client ajouté avec succès !");
      setEmail("");
      setPassword("");
      onClientAdded();
      setTimeout(onClose, 1000);
    } catch (err) {
      console.error(err);
      setMessage("❌ Erreur : impossible d’ajouter le client");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-md relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
        >
          <X size={20} />
        </button>

        <h2 className="text-xl font-bold mb-4 text-center text-gray-800">
          ➕ Ajouter un nouveau client
        </h2>

        <form onSubmit={handleAddClient} className="space-y-4">
          <input
            type="email"
            placeholder="Adresse email du client"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            required
          />

          <input
            type="password"
            placeholder="Mot de passe initial"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            {loading ? "Création en cours..." : "Créer le client"}
          </button>

          {message && (
            <p
              className={`text-center font-medium ${
                message.startsWith("✅") ? "text-green-600" : "text-red-500"
              }`}
            >
              {message}
            </p>
          )}
        </form>
      </div>
    </div>
  );
}

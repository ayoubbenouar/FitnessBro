import { useEffect, useState } from "react";
import { getMyWeights, addMyWeight, deleteMyWeight } from "../../api/profile";

export default function WeightHistory() {
  const [weights, setWeights] = useState<any[]>([]);
  const [newWeight, setNewWeight] = useState("");

  const load = () => {
    getMyWeights().then(setWeights);
  };

  useEffect(load, []);

  const add = async () => {
    await addMyWeight({ weight_kg: Number(newWeight), date: null });
    setNewWeight("");
    load();
  };

  const remove = async (id: number) => {
    await deleteMyWeight(id);
    load();
  };

  return (
    <div className="max-w-xl mx-auto bg-white shadow p-6 rounded-xl">
      <h2 className="text-xl font-bold mb-4">Historique des poids</h2>

      <div className="flex gap-2 mb-4">
        <input
          className="border px-2 py-1 rounded"
          placeholder="Poids (kg)"
          value={newWeight}
          onChange={(e) => setNewWeight(e.target.value)}
        />
        <button onClick={add} className="bg-blue-600 text-white px-4 py-1 rounded">
          Ajouter
        </button>
      </div>

      <ul>
        {weights.map((w) => (
          <li key={w.id} className="flex justify-between items-center py-2 border-b">
            {w.date} — <b>{w.weight_kg} kg</b>
            <button
              onClick={() => remove(w.id)}
              className="text-red-600 ml-4"
            >
              supprimer
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

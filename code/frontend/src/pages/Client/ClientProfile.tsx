import { useEffect, useState } from "react";
import {
  getMyProfile,
  updateMyProfile,
} from "../../api/profile";

export default function ClientProfile() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState<any>({});

  useEffect(() => {
    getMyProfile()
      .then((data) => {
        setProfile(data);
        setForm(data);
      })
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    const updated = await updateMyProfile(form);
    setProfile(updated);
    alert("Profil mis à jour ✔️");
  };

  if (loading) return <div className="p-6">Chargement...</div>;

  return (
    <div className="max-w-3xl mx-auto p-8 bg-white rounded-xl shadow">
      <h2 className="text-2xl font-bold mb-4 text-blue-700">Mon Profil</h2>

      <div className="grid grid-cols-2 gap-4">
        {[
          "age",
          "sex",
          "weight_kg",
          "height_cm",
          "target_weight_kg",
          "goal",
          "activity_level",
          "experience_level",
          "allergies",
          "medical_conditions",
          "food_preferences",
          "note",
        ].map((field) => (
          <div key={field} className="flex flex-col">
            <label className="text-sm font-semibold capitalize">
              {field.replace("_", " ")}
            </label>
            <input
              value={form[field] ?? ""}
              onChange={(e) =>
                setForm((f: any) => ({ ...f, [field]: e.target.value }))
              }
              className="border p-2 rounded"
            />
          </div>
        ))}
      </div>

      <button
        onClick={save}
        className="mt-6 bg-blue-700 text-white px-4 py-2 rounded"
      >
        Sauvegarder
      </button>
    </div>
  );
}

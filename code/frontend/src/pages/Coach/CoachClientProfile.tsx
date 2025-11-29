import { useEffect, useState } from "react";
import { getProfileOfClient } from "../../api/profile";
import { useParams } from "react-router-dom";

export default function CoachClientProfile() {
  const { clientId } = useParams();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!clientId) return;
    getProfileOfClient(Number(clientId))
      .then(setProfile)
      .finally(() => setLoading(false));
  }, [clientId]);

  if (loading) return <div className="p-6">Chargement...</div>;

  if (!profile)
    return (
      <div className="p-6 text-red-600 font-bold">
        Aucun profil trouvé pour ce client.
      </div>
    );

  return (
    <div className="max-w-3xl mx-auto p-8 bg-white rounded-xl shadow">
      <h2 className="text-2xl font-bold mb-6">
        Profil du client #{clientId}
      </h2>

      {/* Affichage stylé */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Field label="Âge" value={profile.age} />
        <Field label="Sexe" value={profile.sex} />
        <Field label="Poids (kg)" value={profile.weight_kg} />
        <Field label="Taille (cm)" value={profile.height_cm} />
        <Field label="Objectif" value={profile.goal} />
        <Field label="Niveau" value={profile.experience_level} />
        <Field label="Activité" value={profile.activity_level} />
      </div>

      {/* Champs longs */}
      <LongField label="Allergies" value={profile.allergies} />
      <LongField label="Conditions médicales" value={profile.medical_conditions} />
      <LongField label="Préférences alimentaires" value={profile.food_preferences} />
      <LongField label="Note" value={profile.note} />

      {/* BMR/TDEE */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <p><b>BMR :</b> {profile.bmr} kcal</p>
        <p><b>TDEE :</b> {profile.tdee} kcal</p>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: any }) {
  return (
    <div className="flex flex-col">
      <span className="font-semibold text-sm">{label}</span>
      <span className="text-gray-700">{value ?? "—"}</span>
    </div>
  );
}

function LongField({ label, value }: { label: string; value: any }) {
  if (!value) return null;

  return (
    <div className="mb-4">
      <span className="font-semibold text-sm">{label}</span>
      <pre className="bg-gray-100 p-3 rounded whitespace-pre-wrap text-sm mt-1">
        {value}
      </pre>
    </div>
  );
}

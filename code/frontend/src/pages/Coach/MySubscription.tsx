import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function MySubscription() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    fetch("http://localhost:8007/payment/subscription/me", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then((res) => res.json())
      .then((data) => {
        setSubscription(data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
        alert("Erreur de connexion au service d’abonnement.");
      });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <p>Chargement...</p>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="min-h-screen bg-gray-950 text-white p-10 text-center">
        <h1 className="text-3xl font-bold mb-6">Mon abonnement</h1>
        <p className="text-gray-400">Aucun abonnement actif pour le moment.</p>
        <button
          onClick={() => navigate("/subscription")}
          className="mt-6 px-4 py-2 bg-blue-600 rounded hover:bg-blue-500 transition"
        >
          Souscrire à un abonnement
        </button>
      </div>
    );
  }

  const planColors: Record<string, string> = {
    BASIC: "text-green-400",
    STANDARD: "text-yellow-400",
    PREMIUM: "text-purple-400"
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-10">
      <h1 className="text-4xl font-bold mb-10">Mon abonnement</h1>

      <div className="bg-gray-900 p-8 rounded-xl border border-gray-700 max-w-xl mx-auto shadow-lg">
        <h2 className="text-2xl font-bold mb-4">
          Plan actuel :
          <span className={`ml-2 ${planColors[subscription.plan_name]}`}>
            {subscription.plan_name}
          </span>
        </h2>

        <div className="mb-4">
          <p className="text-gray-300">
            <span className="font-bold">Statut :</span>{" "}
            <span className="capitalize">{subscription.status}</span>
          </p>

          <p className="text-gray-300">
            <span className="font-bold">Début :</span>{" "}
            {new Date(subscription.current_period_start).toLocaleDateString()}
          </p>

          <p className="text-gray-300">
            <span className="font-bold">Renouvellement :</span>{" "}
            {new Date(subscription.current_period_end).toLocaleDateString()}
          </p>
        </div>

        <div className="mb-6">
          <p className="text-gray-300">
            <span className="font-bold">Clients actuels :</span>{" "}
            {subscription.current_clients} / {subscription.max_clients}
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => navigate("/subscription")}
            className="w-full py-2 bg-blue-600 hover:bg-blue-500 rounded"
          >
            Modifier / Mettre à niveau
          </button>

          <button
            className="w-full py-2 bg-gray-700 hover:bg-gray-600 rounded"
            onClick={() => alert("Portail Stripe sera ajouté bientôt.")}
          >
            Gérer mon abonnement (Stripe)
          </button>
        </div>
      </div>
    </div>
  );
}

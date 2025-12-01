import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

export default function CheckoutPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [plan, setPlan] = useState<string | null>(null);
  const [extras, setExtras] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // 1️⃣ Lire depuis l’URL
    const urlPlan = searchParams.get("plan");
    const urlExtras = searchParams.get("extras");

    if (urlPlan) {
      setPlan(urlPlan.toUpperCase());
      setExtras(Number(urlExtras || 0));
      return;
    }

    // 2️⃣ Compatibilité ancienne version
    const selected = localStorage.getItem("selected_plan");
    if (selected) {
      setPlan(selected.toUpperCase());
      return;
    }

    // 3️⃣ Aucun plan → retour Home
    navigate("/");
  }, []);

  const startCheckout = async () => {
    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        return navigate("/login");
      }

      const response = await fetch(
        "http://localhost:8007/payment/checkout/create-session",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            plan_name: plan,
            extra_packs: extras,
          }),
        }
      );

      const data = await response.json();

      if (data.checkout_url) {
        window.location.href = data.checkout_url;
      } else {
        alert("Erreur lors de la création de la session de paiement.");
      }
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la communication avec le serveur.");
    }

    setLoading(false);
  };

  const planDetails: Record<string, any> = {
    BASIC: { name: "Basic", price: "19.99 $CA / mois", clients: "10 clients" },
    STANDARD: { name: "Standard", price: "34.99 $CA / mois", clients: "20 clients" },
    PREMIUM: { name: "Premium", price: "49.99 $CA / mois", clients: "50+ clients" },
  };

  const details = plan ? planDetails[plan] : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-950 to-black text-white px-6 py-14 flex justify-center">
      <div className="w-full max-w-lg bg-black/50 backdrop-blur-xl border border-gray-800 rounded-2xl p-10 shadow-2xl">
        
        <h1 className="text-4xl font-bold mb-8 text-center">
          Paiement de l’abonnement
        </h1>

        {!details && (
          <div className="text-center text-gray-400">Chargement...</div>
        )}

        {details && (
          <>
            <h2 className="text-2xl font-bold mb-2 text-center">
              Abonnement : <span className="text-blue-400">{details.name}</span>
            </h2>

            <p className="text-gray-300 text-center">{details.price}</p>
            <p className="text-gray-400 text-center mb-8">
              Limite : {details.clients}
            </p>

            {plan === "PREMIUM" && (
              <div className="mb-6">
                <label className="text-gray-300 text-sm">Packs supplémentaires</label>
                <select
                  value={extras}
                  onChange={(e) => setExtras(Number(e.target.value))}
                  className="mt-2 w-full bg-gray-900 border border-gray-700 text-white p-3 rounded-lg"
                >
                  <option value={0}>Aucun</option>
                  <option value={1}>+5 clients</option>
                  <option value={2}>+10 clients</option>
                  <option value={3}>+15 clients</option>
                </select>
              </div>
            )}

            <button
              onClick={startCheckout}
              disabled={loading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 rounded-xl text-lg font-semibold shadow-xl transition"
            >
              {loading ? "Redirection..." : "Procéder au paiement"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

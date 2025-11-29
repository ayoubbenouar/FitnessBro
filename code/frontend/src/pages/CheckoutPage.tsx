import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function CheckoutPage() {
  const navigate = useNavigate();
  const [plan, setPlan] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const selected = localStorage.getItem("selected_plan");
    if (!selected) {
      navigate("/"); // si aucun plan n’a été choisi → retour Home
    } else {
      setPlan(selected);
    }
  }, []);

  const startCheckout = async () => {
    setLoading(true);

    try {
      const token = localStorage.getItem("token"); // token coach déjà existant
      if (!token) {
        navigate("/login");
        return;
      }

      const response = await fetch("http://localhost:8007/payment/checkout/create-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // coach doit être authentifié
        },
        body: JSON.stringify({
          plan_name: plan,
          extra_packs: 0, // tu pourras ajouter une UI plus tard
        }),
      });

      const data = await response.json();

      if (data.checkout_url) {
        window.location.href = data.checkout_url; // redirection vers Stripe Checkout
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
    <div className="min-h-screen bg-gray-950 text-white p-10">
      <h1 className="text-4xl font-bold mb-10 text-center">Paiement de l’abonnement</h1>

      {details && (
        <div className="max-w-lg mx-auto bg-gray-900 p-8 rounded-xl border border-gray-700 shadow-xl">

          <h2 className="text-2xl font-bold mb-4">
            Abonnement sélectionné : <span className="text-blue-400">{details.name}</span>
          </h2>

          <p className="text-gray-300 mb-2">{details.price}</p>
          <p className="text-gray-400 mb-6">Limite : {details.clients}</p>

          <button
            onClick={startCheckout}
            disabled={loading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 rounded text-lg font-semibold transition"
          >
            {loading ? "Redirection..." : "Procéder au paiement"}
          </button>

        </div>
      )}
    </div>
  );
}

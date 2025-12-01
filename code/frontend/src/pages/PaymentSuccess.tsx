import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";

export default function PaymentSuccess() {
  const navigate = useNavigate();

  useEffect(() => {
    // Nettoyer l'état du choix d’abonnement
    localStorage.removeItem("selected_plan");
    localStorage.removeItem("redirect_after_login");

    // Redirection automatique
    setTimeout(() => {
      navigate("/coach/dashboard");
    }, 2000);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-950 text-white p-6">
      <CheckCircle2 size={80} className="text-green-500 mb-6" />
      <h1 className="text-4xl font-bold mb-4">Paiement réussi ! 🎉</h1>
      <p className="text-gray-300 text-lg mb-6">
        Merci pour votre abonnement. Vous allez être redirigé automatiquement...
      </p>

      <button
        onClick={() => navigate("/coach/dashboard")}
        className="px-6 py-3 bg-blue-600 rounded-xl hover:bg-blue-500 transition"
      >
        Aller au dashboard maintenant →
      </button>
    </div>
  );
}

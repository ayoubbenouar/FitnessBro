import { useNavigate } from "react-router-dom";

export default function PaymentCancel() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-950 text-white p-6">
      <h1 className="text-3xl font-bold mb-4">Paiement annulé</h1>
      <p className="text-gray-300 mb-6">Vous pouvez réessayer quand vous voulez.</p>

      <button
        onClick={() => navigate("/")}
        className="px-6 py-3 bg-blue-600 rounded-xl hover:bg-blue-500 transition"
      >
        Retour à l'accueil
      </button>
    </div>
  );
}

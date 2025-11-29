import LandingTopbar from "../components/LandingTopbar";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();

  const handleChoosePlan = (plan: string) => {
    // On stocke le plan choisi avant login
    localStorage.setItem("selected_plan", plan);
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <LandingTopbar />

      {/* SECTION HERO */}
      <div className="text-center py-20 px-4">
        <h1 className="text-5xl font-bold mb-4">Transforme tes Coachings</h1>
        <p className="text-gray-300 text-lg max-w-2xl mx-auto">
          FitnessBro te permet de gérer tes clients, créer des programmes, suivre leurs progrès
          et organiser ton activité — tout en un seul endroit.
        </p>
      </div>

      {/* SECTION ABONNEMENTS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-8 py-10 max-w-6xl mx-auto">
        {/* BASIC */}
        <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
          <h2 className="text-2xl font-bold mb-4">Basic</h2>
          <p className="text-gray-400 mb-4">Jusqu’à 10 clients</p>
          <p className="text-3xl font-bold mb-6">$19.99 / mois</p>
          <button
            onClick={() => handleChoosePlan("BASIC")}
            className="w-full py-2 bg-blue-600 hover:bg-blue-500 rounded"
          >
            Choisir
          </button>
        </div>

        {/* STANDARD */}
        <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
          <h2 className="text-2xl font-bold mb-4">Standard</h2>
          <p className="text-gray-400 mb-4">Jusqu’à 20 clients</p>
          <p className="text-3xl font-bold mb-6">$34.99 / mois</p>
          <button
            onClick={() => handleChoosePlan("STANDARD")}
            className="w-full py-2 bg-blue-600 hover:bg-blue-500 rounded"
          >
            Choisir
          </button>
        </div>

        {/* PREMIUM */}
        <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
          <h2 className="text-2xl font-bold mb-4">Premium</h2>
          <p className="text-gray-400 mb-4">50+ clients (extensible)</p>
          <p className="text-3xl font-bold mb-6">$49.99 / mois</p>
          <button
            onClick={() => handleChoosePlan("PREMIUM")}
            className="w-full py-2 bg-blue-600 hover:bg-blue-500 rounded"
          >
            Choisir
          </button>
        </div>
      </div>
    </div>
  );
}

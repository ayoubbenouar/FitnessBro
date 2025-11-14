import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Dumbbell, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);

    if (password !== confirmPassword) {
      setMessage("❌ Les mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("http://127.0.0.1:8001/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          role: "coach", // 👈 inscription réservée aux coachs
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Erreur lors de l’inscription");
      }

      setMessage("✅ Compte coach créé avec succès !");
      setTimeout(() => navigate("/login"), 1500);
    } catch (err: any) {
      console.error(err);
      setMessage(err.message || "Erreur lors de la création du compte.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 px-4">
      <div className="w-full max-w-md bg-gray-950/80 backdrop-blur-md rounded-2xl p-8 shadow-xl border border-gray-800">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <Dumbbell className="text-blue-500" size={32} />
          <h1 className="text-3xl font-bold text-white">FitnessBro</h1>
        </div>

        <h2 className="text-center text-lg text-gray-300 mb-6">
          Créez votre compte Coach 🧑‍🏫
        </h2>

        {/* Message */}
        {message && (
          <div
            className={`flex items-center gap-2 mb-4 p-3 rounded-lg ${
              message.includes("✅")
                ? "bg-green-100/10 text-green-400 border border-green-600"
                : "bg-red-100/10 text-red-400 border border-red-600"
            }`}
          >
            {message.includes("✅") ? (
              <CheckCircle2 size={20} />
            ) : (
              <AlertCircle size={20} />
            )}
            <span className="text-sm">{message}</span>
          </div>
        )}

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-gray-300 text-sm">Adresse e-mail</label>
            <input
              type="email"
              className="w-full p-3 mt-1 rounded-lg bg-gray-800 text-white border border-gray-700 focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="nom@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="text-gray-300 text-sm">Mot de passe</label>
            <input
              type="password"
              className="w-full p-3 mt-1 rounded-lg bg-gray-800 text-white border border-gray-700 focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="text-gray-300 text-sm">Confirmer le mot de passe</label>
            <input
              type="password"
              className="w-full p-3 mt-1 rounded-lg bg-gray-800 text-white border border-gray-700 focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 mt-2 rounded-lg font-semibold flex items-center justify-center transition-all duration-200"
          >
            {loading && <Loader2 size={20} className="animate-spin mr-2" />}
            {loading ? "Création du compte..." : "Créer mon compte"}
          </button>
        </form>

        <p className="text-center text-gray-400 text-sm mt-6">
          Vous avez déjà un compte ?{" "}
          <Link to="/login" className="text-blue-400 hover:text-blue-500">
            Connectez-vous
          </Link>
        </p>
      </div>
    </div>
  );
}

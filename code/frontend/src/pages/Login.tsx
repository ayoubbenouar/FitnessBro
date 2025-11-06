import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { Dumbbell, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

interface DecodedToken {
  sub: string;
  role: string;
  exp: number;
}

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setLoading(true);

    try {
      const res = await fetch("http://127.0.0.1:8001/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Email ou mot de passe invalide.");
      }

      const data = await res.json();
      localStorage.setItem("token", data.access_token);

      const decoded: DecodedToken = jwtDecode(data.access_token);

      // Redirection selon le rôle
      if (decoded.role === "coach") navigate("/coach/dashboard");
      else if (decoded.role === "client") navigate("/client/dashboard");
      else navigate("/login");

      setMessage("✅ Connexion réussie !");
    } catch (err: any) {
      console.error(err);
      setMessage(err.message || "Erreur de connexion.");
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
          Connectez-vous à votre espace
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
              placeholder="votre@email.com"
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

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 mt-2 rounded-lg font-semibold flex items-center justify-center transition-all duration-200"
          >
            {loading && <Loader2 size={20} className="animate-spin mr-2" />}
            {loading ? "Connexion..." : "Se connecter"}
          </button>
        </form>

        <p className="text-center text-gray-400 text-sm mt-6">
          Pas encore de compte ?{" "}
          <Link to="/signup" className="text-blue-400 hover:text-blue-500">
            Créez un compte coach
          </Link>
        </p>
      </div>
    </div>
  );
}

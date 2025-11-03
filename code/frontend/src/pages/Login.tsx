import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {jwtDecode} from "jwt-decode"; // 👈 installer avec `npm install jwt-decode`

interface DecodedToken {
  sub: string;
  role: string;
  exp: number;
}

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    try {
      const res = await fetch("http://localhost:8001/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) throw new Error("Échec de connexion");

      const data = await res.json();
      localStorage.setItem("token", data.access_token);

      // ✅ Décoder le token pour savoir le rôle
      const decoded: DecodedToken = jwtDecode(data.access_token);

      // ✅ Redirection selon le rôle
      if (decoded.role === "coach") navigate("/coach");
      else if (decoded.role === "client") navigate("/client");
      else navigate("/login");

    } catch (err) {
      console.error(err);
      setError("Email ou mot de passe invalide.");
    }
  }

  return (
    <div style={{ maxWidth: 400, margin: "80px auto", textAlign: "center" }}>
      <h1>Connexion</h1>
      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", flexDirection: "column", gap: 10 }}
      >
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">Se connecter</button>
      </form>
      {error && <p style={{ color: "crimson" }}>{error}</p>}
      <p>
        Pas de compte ? <Link to="/signup">Créer un compte</Link>
      </p>
    </div>
  );
}

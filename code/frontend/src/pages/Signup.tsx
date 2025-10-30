import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("client");
  const [message, setMessage] = useState<string | null>(null);
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);

    try {
      const res = await fetch("http://localhost:8001/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Erreur d'inscription");
      }

      setMessage("Compte créé avec succès !");
      setTimeout(() => navigate("/login"), 1000);
    } catch (err: any) {
      setMessage(err.message);
    }
  }

  return (
    <div style={{ maxWidth: 400, margin: "80px auto", textAlign: "center" }}>
      <h1>Inscription</h1>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
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
        <select value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="client">Client</option>
          <option value="coach">Coach</option>
        </select>
        <button type="submit">Créer le compte</button>
      </form>
      {message && <p style={{ color: message.includes("succès") ? "green" : "crimson" }}>{message}</p>}
      <p>
        Déjà inscrit ? <Link to="/login">Se connecter</Link>
      </p>
    </div>
  );
}

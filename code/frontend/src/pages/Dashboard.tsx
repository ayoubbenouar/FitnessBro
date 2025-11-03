import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

interface DecodedToken {
  sub: string;
  role: string;
  exp: number;
}

interface Client {
  id: number;
  email: string;
  role: string;
}

interface Food {
  name: string;
  calories: number;
}

interface Meal {
  foods: Food[];
  meal_calories: number;
}

interface DayProgram {
  day: string;
  workout: string;
  daily_calories: number;
  meals: Record<string, Meal>;
}

interface Program {
  id: number;
  title: string;
  calories: number;
  days: DayProgram[];
}

interface DayForm {
  day: string;
  breakfast: string;
  lunch: string;
  dinner: string;
  workout: string;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  // --- Décoder le token JWT ---
  const decoded: DecodedToken | null = token ? jwtDecode(token) : null;
  const coachId = decoded ? Number(decoded.sub) : null;

  // --- Client Selection ---
  const [clients, setClients] = useState<Client[]>([]);
  const [clientId, setClientId] = useState<number | null>(null);

  // --- Program State ---
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [createdProgram, setCreatedProgram] = useState<Program | null>(null);

  // --- Days Template ---
  const [days, setDays] = useState<DayForm[]>([
    { day: "Lundi", breakfast: "", lunch: "", dinner: "", workout: "" },
    { day: "Mardi", breakfast: "", lunch: "", dinner: "", workout: "" },
    { day: "Mercredi", breakfast: "", lunch: "", dinner: "", workout: "" },
    { day: "Jeudi", breakfast: "", lunch: "", dinner: "", workout: "" },
    { day: "Vendredi", breakfast: "", lunch: "", dinner: "", workout: "" },
    { day: "Samedi", breakfast: "", lunch: "", dinner: "", workout: "" },
    { day: "Dimanche", breakfast: "", lunch: "", dinner: "", workout: "" },
  ]);

  // 🔹 Charger la liste des clients depuis l’API Auth
  useEffect(() => {
    async function fetchClients() {
      try {
        const res = await fetch("http://127.0.0.1:8001/auth/clients");
        if (!res.ok) throw new Error("Erreur de chargement des clients");
        const data = await res.json();
        setClients(data);
      } catch (err) {
        console.error(err);
        setMessage("❌ Impossible de charger la liste des clients");
      }
    }
    fetchClients();
  }, []);

  // 🔹 Déconnexion
  function logout() {
    localStorage.removeItem("token");
    navigate("/login");
  }

  // 🔹 Modification des repas
  function handleDayChange(index: number, field: keyof DayForm, value: string) {
    const newDays = [...days];
    newDays[index][field] = value;
    setDays(newDays);
  }

  // 🔹 Création du programme
  async function createProgram(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setCreatedProgram(null);

    if (!clientId) {
      setMessage("⚠️ Sélectionnez un client avant de créer le programme.");
      return;
    }

    if (!coachId) {
      setMessage("⚠️ Impossible de déterminer l'identité du coach (token invalide).");
      return;
    }

    const payload = {
      coach_id: coachId,
      client_id: clientId,
      title,
      notes,
      days: days.map((d) => ({
        day: d.day,
        meals: {
          breakfast: d.breakfast,
          lunch: d.lunch,
          dinner: d.dinner,
        },
        workout: d.workout || "Repos",
      })),
    };

    try {
      const res = await fetch("http://127.0.0.1:8002/program", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Erreur serveur");

      const data = await res.json();
      setMessage(`✅ Programme créé pour ${clients.find(c => c.id === clientId)?.email}`);
      setCreatedProgram(data);
    } catch (err) {
      console.error(err);
      setMessage("❌ Erreur : impossible de créer le programme.");
    }
  }

  return (
    <div
      style={{
        maxWidth: 900,
        margin: "60px auto",
        fontFamily: "Poppins, sans-serif",
        color: "white",
      }}
    >
      <h1 style={{ fontSize: "2.5rem", textAlign: "center" }}>
        Tableau de bord Coach 🏋️‍♂️
      </h1>
      <p style={{ textAlign: "center", marginBottom: 20 }}>
        Créez un programme hebdomadaire complet et assignez-le à un client.
      </p>

      <div style={{ textAlign: "center", marginBottom: 30 }}>
        <button
          onClick={logout}
          style={{
            background: "#111",
            color: "white",
            border: "1px solid #444",
            padding: "10px 20px",
            borderRadius: 8,
            cursor: "pointer",
          }}
        >
          Se déconnecter
        </button>
      </div>

      {/* ---- Sélecteur de client ---- */}
      <div style={{ marginBottom: 20, textAlign: "center" }}>
        <label>
          Sélectionner un client :
          <select
            style={{
              marginLeft: 10,
              padding: "6px 8px",
              borderRadius: 6,
              border: "1px solid #ccc",
            }}
            value={clientId ?? ""}
            onChange={(e) => setClientId(Number(e.target.value))}
          >
            <option value="">-- Choisir un client --</option>
            {clients.map((c) => {
              const displayName = c.email.split("@")[0]; // extrait la partie avant @
              return (
                <option key={c.id} value={c.id}>
                  {displayName}
                </option>
              );
            })}

          </select>
        </label>
      </div>

      {/* ---- FORMULAIRE ---- */}
      <form
        onSubmit={createProgram}
        style={{ display: "flex", flexDirection: "column", gap: 12 }}
      >
        <input
          type="text"
          placeholder="Titre du programme"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <textarea
          placeholder="Notes globales (objectif, recommandations...)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
        />

        {days.map((d, i) => (
          <div
            key={d.day}
            style={{
              background: "#f9f9f9",
              color: "#000",
              padding: 15,
              borderRadius: 10,
              marginBottom: 15,
            }}
          >
            <h3 style={{ marginBottom: 8 }}>{d.day}</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <input
                type="text"
                placeholder="Petit-déjeuner"
                value={d.breakfast}
                onChange={(e) =>
                  handleDayChange(i, "breakfast", e.target.value)
                }
              />
              <input
                type="text"
                placeholder="Déjeuner"
                value={d.lunch}
                onChange={(e) => handleDayChange(i, "lunch", e.target.value)}
              />
              <input
                type="text"
                placeholder="Dîner"
                value={d.dinner}
                onChange={(e) => handleDayChange(i, "dinner", e.target.value)}
              />
              <input
                type="text"
                placeholder="Entraînement (ex: Dos et biceps ou Repos)"
                value={d.workout}
                onChange={(e) => handleDayChange(i, "workout", e.target.value)}
              />
            </div>
          </div>
        ))}

        <button
          type="submit"
          style={{
            background: "#0d6efd",
            color: "white",
            border: "none",
            padding: "12px 0",
            borderRadius: 8,
            fontWeight: "bold",
            fontSize: "1rem",
            cursor: "pointer",
          }}
        >
          Créer le programme
        </button>
      </form>

      {message && (
        <p
          style={{
            marginTop: 20,
            color: message.includes("✅") ? "limegreen" : "crimson",
          }}
        >
          {message}
        </p>
      )}

      {/* ---- AFFICHAGE DU PROGRAMME CRÉÉ ---- */}
      {createdProgram && (
        <div
          style={{
            marginTop: 40,
            background: "#222",
            padding: 20,
            borderRadius: 10,
          }}
        >
          <h2>{createdProgram.title}</h2>
          <p>
            🔥 Total semaine :{" "}
            <strong>{createdProgram.calories} kcal</strong>
          </p>

          {createdProgram.days.map((d) => (
            <div
              key={d.day}
              style={{
                background: "#2b2b2b",
                padding: 15,
                borderRadius: 8,
                marginTop: 10,
              }}
            >
              <h3>
                {d.day} — <em>{d.workout}</em>
              </h3>

              <ul>
                {Object.entries(d.meals).map(([mealName, meal]) => (
                  <li key={mealName}>
                    🍽️ <strong>{mealName}</strong> ({meal.meal_calories} kcal)
                    <ul>
                      {meal.foods.map((f) => (
                        <li key={f.name}>
                          {f.name} — {f.calories} kcal
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>

              <p>
                <strong>Total jour :</strong> {d.daily_calories} kcal
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

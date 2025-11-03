import { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";

interface DecodedToken {
  sub: string;
  role: string;
  exp: number;
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
  meals: Record<string, Meal>;
  workout: string;
  daily_calories: number;
}

interface Program {
  id: number;
  title: string;
  calories: number;
  coach_email?: string;
  days: DayProgram[];
}

interface TrackingDay {
  day: string;
  meal_morning_done: boolean;
  meal_noon_done: boolean;
  meal_evening_done: boolean;
  workout_done: boolean;
  compliance_rate: number;
}

export default function ClientDashboard() {
  const [program, setProgram] = useState<Program | null>(null);
  const [tracking, setTracking] = useState<Record<string, TrackingDay>>({});
  const [averageCompliance, setAverageCompliance] = useState<number>(0);
  const [message, setMessage] = useState<string | null>(null);
  const [expandedMeals, setExpandedMeals] = useState<Record<string, boolean>>({});
  const handleLogout = () => {
  localStorage.removeItem("token");
  window.location.href = "/login"; // ✅ redirige proprement
};

  const token = localStorage.getItem("token");

  // ---------------------------
  // 1️⃣ Charger le programme du client connecté
  // ---------------------------
  useEffect(() => {
    if (!token) return;
    const decoded: DecodedToken = jwtDecode(token);
    const clientId = decoded.sub;

    const fetchProgram = async () => {
      try {
            const res = await fetch(`http://127.0.0.1:8002/program/client/${clientId}`, {
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
            });

        if (!res.ok) throw new Error("Erreur récupération programme");
        const data = await res.json();
        if (!data || data.length === 0) {
          setMessage("⚠️ Aucun programme trouvé pour votre compte.");
          return;
        }
        setProgram(data[data.length - 1]);
      } catch (err) {
        console.error(err);
        setMessage("❌ Erreur de chargement du programme");
      }
    };
    fetchProgram();
  }, [token]);

  // ---------------------------
  // 2️⃣ Charger le suivi existant
  // ---------------------------
  useEffect(() => {
    const fetchTracking = async () => {
      try {
        const res = await fetch("http://127.0.0.1:8003/tracking/me/week", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        const obj: Record<string, TrackingDay> = {};
        data.forEach((d: TrackingDay) => (obj[d.day] = d));
        setTracking(obj);
      } catch (err) {
        console.error(err);
      }
    };
    fetchTracking();
  }, [token]);

  // ---------------------------
  // 3️⃣ Gestion des cases à cocher
  // ---------------------------
  async function toggleCheckbox(day: string, field: keyof TrackingDay) {
    const prev = tracking[day] || {
      day,
      meal_morning_done: false,
      meal_noon_done: false,
      meal_evening_done: false,
      workout_done: false,
      compliance_rate: 0,
    };
    const updated = { ...prev, [field]: !prev[field] };

    setTracking({ ...tracking, [day]: updated });

    try {
      const res = await fetch("http://127.0.0.1:8003/tracking/me/update", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updated),
      });
      const data = await res.json();
      setTracking({ ...tracking, [day]: data });
      setMessage("✅ Suivi mis à jour !");
    } catch (err) {
      console.error(err);
      setMessage("❌ Erreur lors de la mise à jour du suivi");
    }

    calcAverage();
  }

  // ---------------------------
  // 4️⃣ Calcul du taux moyen
  // ---------------------------
  async function calcAverage() {
    try {
      const res = await fetch("http://127.0.0.1:8003/tracking/me/stats", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAverageCompliance(data.average_compliance);
      }
    } catch (err) {
      console.error(err);
    }
  }

  // ---------------------------
  // 5️⃣ Interface
  // ---------------------------
  if (!program)
    return (
      <div style={{ color: "white", textAlign: "center", marginTop: 80 }}>
        Chargement du programme...
      </div>
    );

  return (
    <div
      style={{
        maxWidth: 900,
        margin: "60px auto",
        fontFamily: "Poppins, sans-serif",
        color: "white",
      }}
    >
      <h1 style={{ textAlign: "center", fontSize: "2rem" }}>
        Tableau de bord Client 💪
      </h1>
      <div style={{ textAlign: "center", marginBottom: 30 }}>
        <button
          onClick={handleLogout}
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

      
      <p style={{ textAlign: "center", marginBottom: 20 }}>
        Suivez vos repas et entraînements quotidiens
      </p>

      {message && (
        <p
          style={{
            textAlign: "center",
            color: message.includes("✅") ? "limegreen" : "crimson",
          }}
        >
          {message}
        </p>
      )}

      {program.coach_email && (
        <p style={{ color: "#bbb", marginBottom: 10, textAlign: "center" }}>
          👨‍🏫 Programme créé par{" "}
          <strong>{program.coach_email.split("@")[0]}</strong>
        </p>
      )}

      <h2 style={{ textAlign: "center", color: "lightblue" }}>
        {program.title} — {averageCompliance.toFixed(1)} % de conformité
      </h2>

      {program.days.map((d) => {
        const t = tracking[d.day] || {};
        return (
          <div
            key={d.day}
            style={{
              background: "#222",
              color: "white",
              padding: 15,
              borderRadius: 10,
              marginBottom: 20,
            }}
          >
            <h3>
              {d.day} — <em>{d.workout}</em>
            </h3>

            <ul>
              {Object.entries(d.meals).map(([mealName, meal]) => {
                const key = `${d.day}-${mealName}`;
                const showFoods = expandedMeals[key] || false;

                return (
                  <li key={mealName} style={{ marginBottom: 8 }}>
                    🍽️ <strong>{mealName}</strong> ({meal.meal_calories} kcal)
                    <label style={{ marginLeft: 10 }}>
                      <input
                        type="checkbox"
                        checked={
                          t[
                            `meal_${mealName}_done` as keyof TrackingDay
                          ] as boolean
                        }
                        onChange={() =>
                          toggleCheckbox(
                            d.day,
                            `meal_${mealName}_done` as keyof TrackingDay
                          )
                        }
                      />{" "}
                      Fait
                    </label>

                    <button
                      onClick={() =>
                        setExpandedMeals({
                          ...expandedMeals,
                          [key]: !showFoods,
                        })
                      }
                      style={{
                        marginLeft: 10,
                        background: "#444",
                        color: "white",
                        border: "none",
                        borderRadius: 6,
                        padding: "2px 8px",
                        cursor: "pointer",
                        fontSize: "0.8rem",
                      }}
                    >
                      {showFoods ? "Masquer" : "Voir"}
                    </button>

                    {showFoods && (
                      <ul
                        style={{
                          marginTop: 6,
                          marginLeft: 25,
                          listStyleType: "circle",
                          color: "#ccc",
                        }}
                      >
                        {meal.foods.map((food) => (
                          <li key={food.name}>
                            🥗 {food.name} — {food.calories} kcal
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>

            <p>
              🏋️‍♂️ Entraînement :
              <label style={{ marginLeft: 10 }}>
                <input
                  type="checkbox"
                  checked={t.workout_done || false}
                  onChange={() => toggleCheckbox(d.day, "workout_done")}
                />{" "}
                Terminé
              </label>
            </p>

            <p style={{ color: "lightgreen" }}>
              ✅ Conformité du jour : {t.compliance_rate || 0} %
            </p>
          </div>
        );
      })}
    </div>
  );
}

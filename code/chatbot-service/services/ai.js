// services/ai.js
import OpenAI from "openai";
import { getProfile } from "./profile.js";
import { createProgram } from "./program.js";
import { saveSuggestion, getSuggestion, clearSuggestion } from "./memory.js";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ============ Helpers ============

const normalize = (s) => (s || "").toString().trim().toLowerCase();
const capitalize = (s) => (!s ? "" : s.charAt(0).toUpperCase() + s.slice(1));

function extractClientNameFromMessage(msg) {
  const m = msg.match(/client\s+([a-zA-Z0-9._-]+)/i);
  return m ? normalize(m[1]) : null;
}

function extractDayFromMessage(msg) {
  const lower = normalize(msg);
  const days = [
    "lundi",
    "mardi",
    "mercredi",
    "jeudi",
    "vendredi",
    "samedi",
    "dimanche",
  ];
  return days.find((d) => lower.includes(d)) || null;
}

function isCoachProgramRequest(msg, role) {
  if (role !== "coach") return false;
  const lower = normalize(msg);
  return (
    (lower.includes("programme") ||
      lower.includes("program") ||
      lower.includes("entrainement") ||
      lower.includes("entraînement")) &&
    lower.includes("client")
  );
}

function isCoachValidateRequest(msg, role) {
  if (role !== "coach") return false;
  const lower = normalize(msg);
  return lower.includes("valider") && lower.includes("programme");
}

function isClientProgramQuestion(msg) {
  const lower = normalize(msg);
  return (
    lower.includes("mon programme") ||
    lower.includes("mon programe") ||
    lower.includes("programme de") ||
    lower.includes("programe de")
  );
}

function isRecipeRequest(msg) {
  const lower = normalize(msg);
  return (
    lower.includes("recette") ||
    lower.includes("recettes") ||
    lower.includes("idée de repas") ||
    lower.includes("idées de repas") ||
    lower.includes("idée de menu") ||
    lower.includes("idées de menu") ||
    lower.includes("recettes avec mes aliments")
  );
}

function isMacroQuestion(msg) {
  const lower = normalize(msg);
  return (
    lower.includes("macro") ||
    lower.includes("macros") ||
    lower.includes("macronutriment")
  );
}

function isCoachProfileQuestion(msg, role) {
  if (role !== "coach") return false;
  const lower = normalize(msg);
  return (
    (
      lower.includes("profil") ||
      lower.includes("profile") ||
      lower.includes("âge") ||
      lower.includes("age") ||
      lower.includes("poids") ||
      lower.includes("taille") ||
      lower.includes("objectif") ||
      lower.includes("activité") ||
      lower.includes("bmr") ||
      lower.includes("tdee")
    ) && lower.includes("client")
  );
}

function isCoachCreateClientRequest(msg, role) {
  if (role !== "coach") return false;
  const lower = normalize(msg);
  return (
    lower.includes("client") &&
    (lower.includes("ajoute") ||
      lower.includes("ajouter") ||
      lower.includes("crée") ||
      lower.includes("cree") ||
      lower.includes("créer") ||
      lower.includes("creer")) &&
    lower.includes("email")
  );
}

// ============ Filtre fitness/app ============

async function isFitnessRelated(message) {
  try {
    const resp = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `
Tu es un filtre.
Répond STRICTEMENT "yes" si le message parle de :
- fitness / sport / musculation / entraînement
- nutrition / alimentation / repas / calories / diète
- recettes dans un contexte de nutrition saine/sportive
- sommeil, récupération, mode de vie sain
- utilisation de l'application FitnessBro (programmes, profil, clients, bilans, etc.)
Sinon répond STRICTEMENT "no".`,
        },
        { role: "user", content: message },
      ],
      temperature: 0,
    });
    return resp.choices[0].message.content.trim().toLowerCase() === "yes";
  } catch (e) {
    console.error("isFitnessRelated error:", e);
    return true;
  }
}

// ============ Auth-service & Program-service helpers ============

async function findUserByNameLike(name) {
  const base = process.env.AUTH_SERVICE_URL;
  if (!base) throw new Error("AUTH_SERVICE_URL manquant");

  const res = await fetch(`${base}/auth/all-users`);
  if (!res.ok) {
    const errTxt = await res.text();
    throw new Error("Erreur auth-service: " + errTxt);
  }

  const users = await res.json();
  const target = normalize(name);

  return (
    users.find((u) =>
      normalize((u.email || "").split("@")[0]).startsWith(target)
    ) || null
  );
}

async function createClientViaAuth(coachId, email, password) {
  const base = process.env.AUTH_SERVICE_URL;
  if (!base) throw new Error("AUTH_SERVICE_URL manquant");

  const res = await fetch(`${base}/auth/clients/${coachId}/add`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, role: "client" }),
  });

  if (!res.ok) {
    const errTxt = await res.text();
    throw new Error("Erreur auth-service: " + errTxt);
  }
  return res.json();
}

async function getClientPrograms(clientId, token) {
  const base = process.env.PROGRAM_SERVICE_URL;
  if (!base) throw new Error("PROGRAM_SERVICE_URL manquant");

  const res = await fetch(`${base}/program/client/${clientId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const errTxt = await res.text();
    throw new Error("Erreur program-service: " + errTxt);
  }

  return res.json();
}

// ============ Génération programme via IA ============

async function generateProgramFromProfile(profile, coachId, clientId) {
  const systemPrompt = `
Tu es un coach sportif expert qui génère des programmes hebdomadaires pour FitnessBro.

⚠️ Tu DOIS répondre uniquement avec un JSON valide correspondant STRICTEMENT à :

{
  "coach_id": <int>,
  "client_id": <int>,
  "title": "<string>",
  "notes": "<string ou null>",
  "days": [
    {
      "day": "Lundi",
      "meals": {
        "breakfast": "<texte repas>",
        "lunch": "<texte repas>",
        "dinner": "<texte repas>"
      },
      "workout": "<nom clair de la séance : Push, Pull, Jambes, Full Body, HIIT, Cardio, Repos>",
      "exercises": [
        { "name": "<exercice>", "sets": <int>, "reps": <int> }
      ],
      "daily_calories": <int>
    }
  ]
}

Règles :
- Toujours 7 jours : Lundi → Dimanche.
- Workout : jamais "Séance de musculation" vague. Utilise des noms précis (Push, Pull, Jambes, HIIT, Repos, etc.).
- Exercices cohérents avec la séance (Push → pectoraux/épaules/triceps, Jambes → squat/fentes…).
- Repas en français, simples, adaptés au profil (prise de masse, perte de poids, etc.).
- Calories :
  - prise de masse : typiquement 2700–3500 kcal/jour selon le profil
  - perte de poids : ~1600–2200 kcal/jour selon le profil
- Le JSON doit être propre, sans texte avant/après.
`;

  const userPrompt = `
Voici le profil du client au format JSON :

${JSON.stringify(profile, null, 2)}

Génère un programme complet au format JSON pour ce client, en respectant STRICTEMENT le schéma demandé.
`;

  const resp = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.5,
  });

  const raw = resp.choices[0].message.content || "";
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("Réponse IA sans JSON exploitable");

  let programJson;
  try {
    programJson = JSON.parse(match[0]);
  } catch (e) {
    console.error("JSON parse error programme IA:", e, "RAW:", raw);
    throw new Error("JSON invalide généré par l'IA");
  }

  programJson.coach_id = coachId;
  programJson.client_id = clientId;

  if (!Array.isArray(programJson.days) || programJson.days.length < 7) {
    console.warn("Programme IA avec moins de 7 jours:", programJson.days?.length);
  }

  return programJson;
}

// ============ Formatage affichage chat ============

function formatMeal(meal) {
  if (!meal) return "Non spécifié";
  if (typeof meal === "object" && Array.isArray(meal.foods)) {
    const parts = meal.foods.map((f) => {
      const kcal =
        typeof f.calories === "number" ? ` (${Math.round(f.calories)} kcal)` : "";
      return `${f.name}${kcal}`;
    });
    return parts.join(", ");
  }
  if (typeof meal === "string") return meal;
  try {
    return JSON.stringify(meal);
  } catch {
    return String(meal);
  }
}

function summarizeProgramForChat(program, clientEmail) {
  if (!program || typeof program !== "object") {
    return `J'ai généré un programme pour **${clientEmail}**, mais son format semble invalide.`;
  }

  const days = Array.isArray(program.days) ? program.days : [];
  const dayNames = days.map((d) => d.day).join(", ");

  let txt = `Voici un programme proposé pour **${clientEmail}**.\n\n`;
  txt += `**Titre :** ${program.title || "Programme personnalisé"}\n`;
  txt += `**Jours couverts :** ${dayNames || "Non précisé"}\n\n`;

  for (const day of days) {
    txt += `---\n**${day.day}**\n`;
    if (day.workout) txt += `- Séance : ${day.workout}\n`;
    if (day.meals) {
      txt += `- Petit-déjeuner : ${formatMeal(day.meals.breakfast)}\n`;
      txt += `- Déjeuner : ${formatMeal(day.meals.lunch)}\n`;
      txt += `- Dîner : ${formatMeal(day.meals.dinner)}\n`;
    }
    txt += "\n";
  }

  txt +=
    `Si tu es d'accord, écris **"valider le programme"** pour l'enregistrer pour ce client.`;
  return txt;
}

function summarizeDayForClient(dayObj, dayName) {
  let out = `📅 **Ton programme pour ${capitalize(dayName)}**\n\n`;

  if (dayObj.workout) out += `🏋️ **Séance :** ${dayObj.workout}\n`;

  if (Array.isArray(dayObj.exercises) && dayObj.exercises.length > 0) {
    out += `\n**Exercices :**\n`;
    for (const ex of dayObj.exercises) {
      out += `- ${ex.name} — ${ex.sets} séries de ${ex.reps} reps\n`;
    }
  }

  const meals = dayObj.meals || {};
  if (meals.breakfast || meals.lunch || meals.dinner) {
    out += `\n🍽️ **Repas de la journée :**\n`;
    if (meals.breakfast)
      out += `- Petit-déjeuner : ${formatMeal(meals.breakfast)}\n`;
    if (meals.lunch) out += `- Déjeuner : ${formatMeal(meals.lunch)}\n`;
    if (meals.dinner) out += `- Dîner : ${formatMeal(meals.dinner)}\n`;
  }

  if (typeof dayObj.daily_calories === "number") {
    out += `\n🔥 **Total estimé :** ${Math.round(dayObj.daily_calories)} kcal\n`;
  }

  return out;
}

// ============ Flows spécifiques ============

// Coach → suggérer programme
async function handleCoachSuggestProgram(message, ctx) {
  const clientName = extractClientNameFromMessage(message);
  if (!clientName) {
    return 'Pour quel client veux-tu un programme ? Exemple : *"suggère un programme pour mon client ayoub"*.';
  }

  const user = await findUserByNameLike(clientName);
  if (!user) {
    return `Je ne trouve aucun client correspondant à "${clientName}". Vérifie le nom (partie avant le @ de l'email).`;
  }

  const clientId = user.id;
  let profile;
  try {
    profile = await getProfile(clientId);
  } catch (e) {
    console.error("getProfile error:", e);
    return "Je n'ai pas réussi à récupérer le profil de ce client. Assure-toi que son profil est bien créé.";
  }

  let programJson;
  try {
    programJson = await generateProgramFromProfile(profile, ctx.userId, clientId);
  } catch (e) {
    console.error("generateProgramFromProfile error:", e);
    return "Je n'ai pas réussi à générer un programme exploitable. Tu peux réessayer ou le créer manuellement.";
  }

  // 🔥 Sauvegarde en mémoire pour "valider le programme"
  saveSuggestion(ctx.userId, clientId, programJson);

  // 🔥 Résumé lisible pour que le coach voie le contenu avant validation
  return summarizeProgramForChat(programJson, user.email);
}

// Coach → valider programme
async function handleCoachValidateProgram(ctx) {
  const suggestion = getSuggestion(ctx.userId);
  if (!suggestion) return "Je n'ai aucun programme en attente de validation pour toi.";

  try {
    await createProgram(ctx.token, suggestion.program);
  } catch (e) {
    console.error("createProgram error:", e);
    return "J'ai généré un programme, mais je n'ai pas réussi à l'enregistrer dans le service de programmes.";
  }

  clearSuggestion(ctx.userId);
  return "✅ Programme enregistré avec succès pour ce client.";
}

// Client → "programme de mardi"
async function handleClientProgramQuestion(message, ctx) {
  const day = extractDayFromMessage(message);
  if (!day) return null;

  if (!ctx || !ctx.userId || !ctx.token) {
    return "Je ne peux pas retrouver ton programme car tu n'es pas identifié.";
  }

  const clientId = ctx.userId;
  let programs;
  try {
    programs = await getClientPrograms(clientId, ctx.token);
  } catch (e) {
    console.error("getClientPrograms error:", e);
    return `Je n'ai pas réussi à récupérer ton programme pour ${day}. Mais si tu veux, je peux te proposer une idée de séance pour ce jour.`;
  }

  if (!Array.isArray(programs) || programs.length === 0) {
    return "Aucun programme n'a encore été enregistré pour toi par ton coach.";
  }

  const current = programs[programs.length - 1];
  const normalizedDay = day.toLowerCase();
  const dayEntry =
    current.days &&
    current.days.find((d) =>
      normalize(d.day).startsWith(normalizedDay.slice(0, 3))
    );

  if (!dayEntry) {
    return `Ton programme actuel ne contient pas de journée "${capitalize(day)}".`;
  }

  return summarizeDayForClient(dayEntry, day);
}

// Client → recettes à partir du programme
async function handleClientRecipesQuestion(message, ctx) {
  if (!isRecipeRequest(message)) return null;

  const day = extractDayFromMessage(message);
  if (!day) {
    return 'Pour te proposer des recettes basées sur ton programme, dis-moi aussi pour quel jour (ex : "Donne-moi des recettes avec mes aliments de mardi").';
  }

  if (!ctx || !ctx.userId || !ctx.token) {
    return "Je ne peux pas retrouver ton programme car tu n'es pas identifié.";
  }

  const clientId = ctx.userId;
  let programs;
  try {
    programs = await getClientPrograms(clientId, ctx.token);
  } catch (e) {
    console.error("getClientPrograms (recipes) error:", e);
    return `Je n'ai pas réussi à récupérer ton programme pour te proposer des recettes pour ${day}.`;
  }

  if (!Array.isArray(programs) || programs.length === 0) {
    return "Aucun programme n'a encore été enregistré pour toi par ton coach, je ne peux donc pas utiliser tes aliments programmés.";
  }

  const current = programs[programs.length - 1];
  const normalizedDay = day.toLowerCase();
  const dayEntry =
    current.days &&
    current.days.find((d) =>
      normalize(d.day).startsWith(normalizedDay.slice(0, 3))
    );

  if (!dayEntry || !dayEntry.meals) {
    return `Je ne trouve pas les repas de ${capitalize(day)} dans ton programme.`;
  }

  const meals = dayEntry.meals;
  const breakfast = formatMeal(meals.breakfast);
  const lunch = formatMeal(meals.lunch);
  const dinner = formatMeal(meals.dinner);

  const systemPrompt = `
Tu es un coach en nutrition ET un cuisinier.
Tu proposes des idées de recettes simples et saines, adaptées à un contexte de fitness.
Réponds en français, avec des listes d'étapes claires.`;

  const userPrompt = `
Voici les aliments prévus dans le programme FitnessBro pour ce client le ${capitalize(
    day
  )} :

- Petit-déjeuner : ${breakfast}
- Déjeuner : ${lunch}
- Dîner : ${dinner}

Propose 1 à 2 idées de recettes par repas.
Pour chaque recette :
- titre court
- liste d'ingrédients
- 3 à 6 étapes maximum
- ton simple et motivant
`;

  const resp = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.7,
  });

  return resp.choices[0].message.content;
}

// Client → macros des repas d’un jour
async function handleClientMacrosQuestion(message, ctx) {
  if (!isMacroQuestion(message)) return null;

  const day = extractDayFromMessage(message);
  if (!day) {
    return 'Pour calculer les macros, dis-moi aussi pour quel jour (ex : "C\'est quoi les macros de mes repas du mardi ?").';
  }

  if (!ctx || !ctx.userId || !ctx.token) {
    return "Je ne peux pas retrouver ton programme car tu n'es pas identifié.";
  }

  const clientId = ctx.userId;
  let programs;
  try {
    programs = await getClientPrograms(clientId, ctx.token);
  } catch (e) {
    console.error("getClientPrograms (macros) error:", e);
    return `Je n'ai pas réussi à récupérer ton programme pour calculer les macros de ${day}.`;
  }

  if (!Array.isArray(programs) || programs.length === 0) {
    return "Aucun programme enregistré, je ne peux pas calculer les macros à partir de tes repas.";
  }

  const current = programs[programs.length - 1];
  const normalizedDay = day.toLowerCase();
  const dayEntry =
    current.days &&
    current.days.find((d) =>
      normalize(d.day).startsWith(normalizedDay.slice(0, 3))
    );

  if (!dayEntry || !dayEntry.meals) {
    return `Je ne trouve pas les repas de ${capitalize(day)} dans ton programme.`;
  }

  const meals = dayEntry.meals;
  const breakfast = formatMeal(meals.breakfast);
  const lunch = formatMeal(meals.lunch);
  const dinner = formatMeal(meals.dinner);

  const systemPrompt = `
Tu es un expert en nutrition sportive.
On te donne les repas d'une journée, parfois avec des calories approximatives.
Tu dois estimer les macronutriments (protéines, glucides, lipides) et les calories pour chaque repas et pour la journée.

Réponds STRICTEMENT en JSON du type :

{
  "breakfast": { "protein": 30, "carbs": 40, "fat": 15, "calories": 450 },
  "lunch": { "protein": 40, "carbs": 60, "fat": 20, "calories": 600 },
  "dinner": { "protein": 35, "carbs": 50, "fat": 18, "calories": 550 },
  "total": { "protein": 105, "carbs": 150, "fat": 53, "calories": 1600 }
}`;

  const userPrompt = `
Repas prévus pour ${capitalize(day)} :

- Petit-déjeuner : ${breakfast}
- Déjeuner : ${lunch}
- Dîner : ${dinner}

Estime les macros comme dans le JSON demandé.`;

  let data;
  try {
    const resp = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0,
    });

    const raw = resp.choices[0].message.content || "";
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("Réponse macros sans JSON");
    data = JSON.parse(match[0]);
  } catch (e) {
    console.error("Macros JSON error:", e);
    return `Je n'ai pas réussi à calculer proprement les macros pour ${capitalize(
      day
    )}. Tu peux quand même te baser sur les calories indiquées dans ton programme.`;
  }

  const fmt = (m) =>
    m
      ? `Protéines: ${Math.round(
          m.protein || 0
        )} g, Glucides: ${Math.round(m.carbs || 0)} g, Lipides: ${Math.round(
          m.fat || 0
        )} g, Calories: ${Math.round(m.calories || 0)} kcal`
      : "données indisponibles";

  let out = `📊 **Macros pour tes repas de ${capitalize(day)}**\n\n`;
  out += `🥣 Petit-déjeuner : ${fmt(data.breakfast)}\n`;
  out += `🍽️ Déjeuner : ${fmt(data.lunch)}\n`;
  out += `🌙 Dîner : ${fmt(data.dinner)}\n`;

  if (data.total) {
    out += `\n🔥 **Total journée :** ${fmt(data.total)}\n`;
  }

  return out;
}

// Coach → questions sur le profil du client (réponse ciblée)
async function handleCoachProfileQuestion(message, ctx) {
  if (!isCoachProfileQuestion(message, ctx.role)) return null;

  const clientName = extractClientNameFromMessage(message);
  if (!clientName) {
    return 'Pour quel client veux-tu consulter le profil ? Exemple : *"Quel est le poids de mon client ayoub ?"*.';  
  }

  const user = await findUserByNameLike(clientName);
  if (!user) {
    return `Je ne trouve aucun client correspondant à "${clientName}".`;
  }

  let profile;
  try {
    profile = await getProfile(user.id);
  } catch (e) {
    console.error("getProfile (coach question) error:", e);
    return "Je n'ai pas réussi à récupérer le profil de ce client.";
  }

  const {
    age,
    height_cm,
    weight_kg,
    target_weight_kg,
    goal,
    activity_level,
    bmr,
    tdee,
  } = profile || {};

  const lower = normalize(message);

  const wantsAge = lower.includes("âge") || lower.includes("age");
  const wantsWeight = lower.includes("poids");
  const wantsHeight = lower.includes("taille");
  const wantsGoal = lower.includes("objectif");
  const wantsActivity = lower.includes("activité");
  const wantsBmr = lower.includes("bmr");
  const wantsTdee = lower.includes("tdee");

  const answers = [];

  if (wantsAge && age != null) {
    answers.push(`Âge de ${user.email} : ${age} ans.`);
  }
  if (wantsWeight && weight_kg != null) {
    answers.push(`Poids de ${user.email} : ${weight_kg} kg.`);
  }
  if (wantsHeight && height_cm != null) {
    answers.push(`Taille de ${user.email} : ${height_cm} cm.`);
  }
  if (wantsGoal && goal) {
    answers.push(`Objectif de ${user.email} : ${goal}.`);
  }
  if (wantsActivity && activity_level) {
    answers.push(`Niveau d'activité de ${user.email} : ${activity_level}.`);
  }
  if (wantsBmr && bmr != null) {
    answers.push(`BMR estimé de ${user.email} : ${Math.round(bmr)} kcal.`);
  }
  if (wantsTdee && tdee != null) {
    answers.push(`TDEE estimé de ${user.email} : ${Math.round(tdee)} kcal.`);
  }

  // ✅ Si une info spécifique est demandée, on renvoie UNIQUEMENT ça
  if (answers.length > 0) {
    return answers.join("\n");
  }

  // Sinon, on renvoie le profil complet comme fallback
  let out = `📋 Profil de **${user.email}**\n\n`;
  if (age != null) out += `- Âge : ${age} ans\n`;
  if (height_cm != null) out += `- Taille : ${height_cm} cm\n`;
  if (weight_kg != null) out += `- Poids : ${weight_kg} kg\n`;
  if (target_weight_kg != null)
    out += `- Poids cible : ${target_weight_kg} kg\n`;
  if (goal) out += `- Objectif : ${goal}\n`;
  if (activity_level) out += `- Activité : ${activity_level}\n`;
  if (bmr != null) out += `- BMR : ${Math.round(bmr)} kcal\n`;
  if (tdee != null) out += `- TDEE : ${Math.round(tdee)} kcal\n`;

  if (out.trim() === `📋 Profil de **${user.email}**`) {
    out += "Aucune donnée détaillée n'est encore enregistrée dans son profil.";
  }

  return out;
}

// Coach → création de client via chat
function parseEmailAndPassword(message) {
  const emailMatch = message.match(
    /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/
  );
  const pwdMatch =
    message.match(/mot de passe\s+([^\s]+)/i) ||
    message.match(/password\s+([^\s]+)/i);

  return {
    email: emailMatch ? emailMatch[1] : null,
    password: pwdMatch ? pwdMatch[1] : null,
  };
}

async function handleCoachCreateClient(message, ctx) {
  if (!isCoachCreateClientRequest(message, ctx.role)) return null;

  const { email, password } = parseEmailAndPassword(message);
  if (!email || !password) {
    return `Pour créer un client depuis le chat, donne-moi l'email et le mot de passe dans ta phrase, par exemple :
    
"Ajoute-moi un client avec email client1@gmail.com et mot de passe 123456"`;
  }

  try {
    const client = await createClientViaAuth(ctx.userId, email, password);
    return `✅ Client créé avec succès : **${client.email}** (id ${client.id}).`;
  } catch (e) {
    console.error("createClientViaAuth error:", e);
    return "Je n'ai pas réussi à créer ce client. Vérifie que l'email n'est pas déjà utilisé.";
  }
}

// ============ Réponse générale ============

async function answerGeneralFitnessQuestion(message, ctx) {
  const rolePart =
    ctx.role === "coach"
      ? "Tu parles à un coach sportif qui utilise l'application FitnessBro pour gérer ses clients."
      : "Tu parles à un client qui utilise l'application FitnessBro pour suivre son programme.";

  const systemPrompt = `
Tu es un assistant spécialisé en fitness, musculation, entraînement, nutrition et utilisation de l'application FitnessBro.
Tu réponds en français, de manière claire et pratique.

${rolePart}

Règles :
- Ne réponds PAS aux questions qui sortent de ces domaines (politique, hacking, maths, etc.).
- Si la question est hors-sujet, répond : "Je peux seulement répondre aux questions liées au fitness, musculation, entraînement, nutrition ou à l'utilisation de l'application FitnessBro 💪."
- Si la question concerne FitnessBro (programmes, profil, bilans, suivi, gestion des clients), explique comment l'utilisateur peut le faire dans l'application.`;

  const resp = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: message },
    ],
    temperature: 0.7,
  });

  return resp.choices[0].message.content;
}

// ============ Entrée principale ============

export async function processMessage(message, ctx) {
  const text = (message || "").trim();
  const lower = text.toLowerCase();

  // Flows coach prioritaires
  if (ctx?.role === "coach") {
    // valider programme
    if (isCoachValidateRequest(lower, ctx.role)) {
      return await handleCoachValidateProgram(ctx);
    }

    // création client
    const createRep = await handleCoachCreateClient(text, ctx);
    if (createRep) return createRep;

    // question sur profil client
    const profilRep = await handleCoachProfileQuestion(text, ctx);
    if (profilRep) return profilRep;

    // suggérer programme
    if (isCoachProgramRequest(lower, ctx.role)) {
      return await handleCoachSuggestProgram(text, ctx);
    }
  }

  // Client → macros
  const macrosRep = await handleClientMacrosQuestion(text, ctx);
  if (macrosRep) return macrosRep;

  // Client → programme jour X
  if (isClientProgramQuestion(lower)) {
    const progRep = await handleClientProgramQuestion(text, ctx);
    if (progRep) return progRep;
  }

  // Client → recettes sur base du programme
  const recipesRep = await handleClientRecipesQuestion(text, ctx);
  if (recipesRep) return recipesRep;

  // Filtre fitness/app
  const ok = await isFitnessRelated(text);
  if (!ok) {
    return "Je peux seulement répondre aux questions liées au fitness, musculation, entraînement, nutrition ou à l'utilisation de l'application FitnessBro 💪.";
  }

  // Réponse générale
  return await answerGeneralFitnessQuestion(text, ctx);
}

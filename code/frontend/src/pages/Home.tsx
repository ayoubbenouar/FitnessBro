import { useNavigate } from "react-router-dom";
import {
  Dumbbell,
  Users,
  ClipboardList,
  BarChart3,
  Sparkles,
  ChevronDown,
  CheckCircle2,
  MessageCircle,
} from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import heroImg from "../assets/hero.jpg"; // ton image locale

export default function Home() {
  const navigate = useNavigate();
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);

  // ✅ NOUVELLE VERSION : on stocke plan + extras
  const handleChoosePlan = (plan: string, extras: number = 0) => {
    localStorage.setItem(
      "pending_subscription",
      JSON.stringify({
        plan,
        extras,
      })
    );
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-[#05070b] text-white">
      {/* ====================== HEADER ====================== */}
      <header className="w-full bg-black/40 backdrop-blur-md border-b border-gray-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center px-8 py-4">
          <div className="flex items-center gap-2">
            <Dumbbell className="text-blue-500" size={28} />
            <span className="text-2xl font-bold">FitnessBro</span>
          </div>

        <div className="flex gap-4">
            <button
              className="text-gray-300 hover:text-white transition"
              onClick={() => navigate("/login")}
            >
              Login
            </button>
            <button
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg transition shadow-lg"
              onClick={() => navigate("/signup")}
            >
              Signup
            </button>
          </div>
        </div>
      </header>

      {/* ====================== HERO ====================== */}
      <section className="relative min-h-[90vh] flex items-center justify-center px-6 py-20 overflow-hidden">
        {/* Background gradient + glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/40 via-purple-700/20 to-black opacity-60" />
        <div className="absolute -top-20 left-1/2 w-[700px] h-[700px] bg-blue-600/20 blur-[120px] rounded-full" />

        <div className="relative grid md:grid-cols-2 gap-10 max-w-7xl items-center">
          {/* Text */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
          >
            <p className="inline-flex items-center gap-2 px-3 py-1 mb-4 text-sm rounded-full bg-blue-600/10 text-blue-300 border border-blue-500/30">
              <Sparkles size={16} /> Plateforme pour coachs sportifs
            </p>

            <h1 className="text-5xl md:text-6xl font-extrabold leading-tight mb-6">
              Le futur de ton{" "}
              <span className="text-blue-500">activité de coach</span>.
            </h1>

            <p className="text-gray-300 text-lg mb-8 max-w-xl">
              Centralise tes clients, tes programmes et leurs progrès
              dans une plateforme pensée pour les coachs ambitieux.
            </p>

            <div className="flex flex-wrap gap-4 items-center">
              <button
                onClick={() => navigate("/signup")}
                className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-lg font-semibold rounded-xl shadow-xl transition"
              >
                Commencer gratuitement →
              </button>
              <button
                onClick={() => {
                  const section = document.getElementById("pricing");
                  if (section) section.scrollIntoView({ behavior: "smooth" });
                }}
                className="text-gray-300 hover:text-white flex items-center gap-2"
              >
                Voir les abonnements
              </button>
            </div>
          </motion.div>

          {/* IMAGE HERO */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="relative"
          >
            <img
              src={heroImg}
              alt="Fitness Coach"
              className="rounded-3xl shadow-2xl border border-gray-700 object-cover w-full h-[480px]"
            />
            {/* cadre neon */}
            <div className="absolute inset-0 rounded-3xl border-2 border-blue-500/40 blur-sm pointer-events-none" />
          </motion.div>
        </div>
      </section>

      {/* ====================== AVANTAGES ====================== */}
      <section className="py-24 px-6 bg-[#0b0f17]">
        <h2 className="text-4xl font-bold text-center mb-4">
          Une plateforme taillée pour les{" "}
          <span className="text-blue-500">coachs modernes</span>
        </h2>
        <p className="text-center text-gray-400 max-w-2xl mx-auto mb-14">
          De l’onboarding client au suivi des performances, FitnessBro simplifie
          ton quotidien pour que tu te concentres sur l’essentiel : le coaching.
        </p>

        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-10">
          <motion.div
            className="bg-black/40 p-9 rounded-2xl border border-gray-800 hover:border-blue-600/60 transition shadow-lg"
            whileHover={{ scale: 1.02 }}
          >
            <Users size={40} className="mx-auto text-blue-400 mb-4" />
            <h3 className="text-xl font-semibold text-center mb-2">
              Vue claire de tous tes clients
            </h3>
            <p className="text-gray-400 text-center">
              Fiches clients, objectifs, historique, tout au même endroit.
            </p>
          </motion.div>

          <motion.div
            className="bg-black/40 p-9 rounded-2xl border border-gray-800 hover:border-blue-600/60 transition shadow-lg"
            whileHover={{ scale: 1.02 }}
          >
            <ClipboardList size={40} className="mx-auto text-blue-400 mb-4" />
            <h3 className="text-xl font-semibold text-center mb-2">
              Programmes structurés
            </h3>
            <p className="text-gray-400 text-center">
              Plans sur mesure, faciles à modifier et à dupliquer.
            </p>
          </motion.div>

          <motion.div
            className="bg-black/40 p-9 rounded-2xl border border-gray-800 hover:border-blue-600/60 transition shadow-lg"
            whileHover={{ scale: 1.02 }}
          >
            <BarChart3 size={40} className="mx-auto text-blue-400 mb-4" />
            <h3 className="text-xl font-semibold text-center mb-2">
              Progression visible
            </h3>
            <p className="text-gray-400 text-center">
              Poids, performances, bilans : tout est suivi et analysé.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ====================== CE QUE TU OBTIENS ====================== */}
      <section className="py-24 px-6 bg-[#05070b]">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Tout ce dont tu as besoin pour un coaching{" "}
              <span className="text-blue-500">professionnel</span>.
            </h2>
            <p className="text-gray-400 mb-6">
              FitnessBro t’offre un environnement complet pour suivre, adapter
              et améliorer les résultats de tes clients semaine après semaine.
            </p>
          </div>

          <div className="space-y-4">
            {[
              "Gestion centralisée des clients",
              "Création de programmes structurés en quelques clics",
              "Suivi des performances et des bilans",
              "Expérience claire pour tes clients",
              "Limites client adaptées à ton niveau d’activité",
              "Abonnement flexible, annulable à tout moment",
            ].map((item, index) => (
              <div key={index} className="flex items-start gap-3">
                <CheckCircle2 className="text-blue-500 mt-1" />
                <p className="text-gray-300">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ====================== TESTIMONIALS ====================== */}
      <section className="py-24 px-6 bg-[#0b0f17]">
        <h2 className="text-4xl font-bold text-center mb-4">
          Ils utilisent déjà <span className="text-blue-500">FitnessBro</span>
        </h2>
        <p className="text-center text-gray-400 mb-14">
          Des coachs qui ont professionnalisé leur activité et gagné du temps.
        </p>

        <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-8">
          {[
            {
              name: "Alex, coach en ligne",
              text: "“Je gère 20 clients sans stress. Tout est clair, mes suivis sont carrés.”",
            },
            {
              name: "Maya, coach hybride",
              text: "“Je combine séances en salle et distance, FitnessBro m’a sauvé.”",
            },
            {
              name: "Samir, préparateur physique",
              text: "“Les bilans et le suivi me donnent une image très pro auprès des clients.”",
            },
          ].map((t, i) => (
            <motion.div
              key={i}
              className="bg-black/40 p-6 rounded-2xl border border-gray-800 shadow-lg h-full flex flex-col justify-between"
              whileHover={{ scale: 1.02 }}
            >
              <p className="text-gray-300 mb-4">{t.text}</p>
              <div className="flex items-center gap-3 text-sm text-gray-400">
                <MessageCircle className="text-blue-400" size={18} />
                <span>{t.name}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ====================== PRICING + COMPARATIF ====================== */}
      <section id="pricing" className="py-24 px-6 bg-[#05070b]">
        <h2 className="text-4xl font-bold text-center mb-4">
          Choisis ton <span className="text-blue-500">abonnement</span>
        </h2>
        <p className="text-center text-gray-400 mb-14">
          Trois niveaux pour s’adapter à ton volume de clients.
        </p>

        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8 mb-16">
          {/* Basic */}
          <div className="bg-black/40 p-8 rounded-2xl border border-gray-800 hover:border-blue-500 transition shadow-xl">
            <h3 className="text-2xl font-bold mb-3">Basic</h3>
            <p className="text-gray-400 mb-4">Pour démarrer</p>
            <p className="text-4xl font-bold mb-4">$19.99</p>
            <p className="text-gray-400 mb-6">Jusqu’à 10 clients</p>
            <button
              onClick={() => handleChoosePlan("BASIC")}
              className="w-full py-3 bg-blue-600 rounded-xl hover:bg-blue-500 transition"
            >
              Choisir Basic
            </button>
          </div>

          {/* Standard */}
          <div className="bg-gradient-to-br from-blue-900/60 to-purple-700/40 p-8 rounded-2xl border border-blue-500 shadow-xl scale-105">
            <h3 className="text-2xl font-bold mb-3">Standard</h3>
            <p className="text-gray-200 mb-4">Pour coach actif</p>
            <p className="text-4xl font-bold mb-4">$34.99</p>
            <p className="text-gray-100 mb-6">Jusqu’à 20 clients</p>
            <button
              onClick={() => handleChoosePlan("STANDARD")}
              className="w-full py-3 bg-blue-600 rounded-xl hover:bg-blue-500 transition"
            >
              Choisir Standard
            </button>
          </div>

          {/* Premium */}
          <div className="bg-black/40 p-8 rounded-2xl border border-gray-800 hover:border-blue-500 transition shadow-xl">
            <h3 className="text-2xl font-bold mb-3">Premium</h3>
            <p className="text-gray-400 mb-4">Pour coach établi</p>
            <p className="text-4xl font-bold mb-4">$49.99</p>
            <p className="text-gray-400 mb-6">50+ clients (packs extra)</p>
            <button
              onClick={() => handleChoosePlan("PREMIUM")}
              className="w-full py-3 bg-blue-600 rounded-xl hover:bg-blue-500 transition"
            >
              Choisir Premium
            </button>
          </div>
        </div>

        {/* Tableau comparatif */}
        <div className="max-w-5xl mx-auto overflow-x-auto">
          <table className="w-full text-left text-sm border border-gray-800 rounded-xl overflow-hidden">
            <thead className="bg-gray-900">
              <tr>
                <th className="px-4 py-3 border-r border-gray-800">Fonctionnalité</th>
                <th className="px-4 py-3 border-r border-gray-800">Basic</th>
                <th className="px-4 py-3 border-r border-gray-800">Standard</th>
                <th className="px-4 py-3">Premium</th>
              </tr>
            </thead>
            <tbody className="bg-black/40">
              {[
                ["Clients maximum", "10", "20", "50+"],
                ["Suivi des bilans", "✔", "✔", "✔"],
                ["Analytics avancés", "✔", "✔", "✔"],
                ["Packs clients supplémentaires", "✖", "✖", "✔"],
                ["Pensé pour la croissance", "✖", "✔", "✔"],
              ].map((row, idx) => (
                <tr key={idx} className="border-t border-gray-800">
                  <td className="px-4 py-3 border-r border-gray-800 text-gray-200">
                    {row[0]}
                  </td>
                  <td className="px-4 py-3 border-r border-gray-800 text-center text-gray-300">
                    {row[1]}
                  </td>
                  <td className="px-4 py-3 border-r border-gray-800 text-center text-gray-300">
                    {row[2]}
                  </td>
                  <td className="px-4 py-3 text-center text-gray-300">
                    {row[3]}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ====================== FAQ ====================== */}
      <section className="py-24 px-6 bg-[#0b0f17]">
        <h2 className="text-4xl font-bold text-center mb-4">FAQ</h2>
        <p className="text-center text-gray-400 mb-10">
          Les réponses aux questions les plus fréquentes.
        </p>

        <div className="max-w-3xl mx-auto">
          {[
            {
              q: "Puis-je annuler facilement ?",
              a: "Oui, l'annulation est possible à tout moment depuis votre compte.",
            },
            {
              q: "Y a-t-il une version d’essai ?",
              a: "Tu peux commencer en mode test sans risque, et upgrader ensuite.",
            },
            {
              q: "FitnessBro gère-t-il aussi les clients à distance ?",
              a: "Oui, la plateforme est idéale pour le coaching en ligne ou hybride.",
            },
          ].map((item, index) => (
            <div
              key={index}
              className="mb-4 border border-gray-800 rounded-xl bg-black/40 p-4"
            >
              <button
                className="flex justify-between w-full text-left"
                onClick={() => setOpenFAQ(openFAQ === index ? null : index)}
              >
                <span className="text-lg font-semibold">{item.q}</span>
                <ChevronDown
                  className={`transition ${
                    openFAQ === index ? "rotate-180" : ""
                  }`}
                />
              </button>

              {openFAQ === index && (
                <p className="mt-3 text-gray-400">{item.a}</p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ====================== CTA FINAL ====================== */}
      <section className="py-16 px-6 bg-[#05070b] text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          Prêt à passer au niveau supérieur ?
        </h2>
        <p className="text-gray-400 mb-8 max-w-xl mx-auto">
          Inscris-toi en quelques clics et commence à structurer ton business
          de coach avec un outil professionnel.
        </p>

        <button
          onClick={() => navigate("/signup")}
          className="px-10 py-4 bg-blue-600 hover:bg-blue-500 rounded-xl text-lg shadow-lg transition"
        >
          Créer mon compte →
        </button>
      </section>

      {/* FOOTER */}
      <footer className="text-center py-8 text-gray-500 border-t border-gray-800">
        © {new Date().getFullYear()} FitnessBro — Tous droits réservés.
      </footer>
    </div>
  );
}

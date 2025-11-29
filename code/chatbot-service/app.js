// 🚀 Charger les variables d'environnement AVANT tout import
import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";

// ⚠️ Import dynamique pour empêcher Node d'importer ai.js trop tôt
const { default: chatRoutes } = await import("./routes/chat.js");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/chatbot", chatRoutes);

const PORT = 8006;
app.listen(PORT, () => {
  console.log("🤖 Chatbot service running on port", PORT);
});

// routes/chat.js
import express from "express";
import jwt from "jsonwebtoken";
import { processMessage } from "../services/ai.js";

const router = express.Router();

router.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;
    const auth = req.headers.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;

    let ctx = { userId: 0, role: "client", token: null };

    if (token) {
      const decoded = jwt.decode(token);
      ctx = {
        userId: Number(decoded?.sub || 0),
        role: decoded?.role || "client",
        token,
      };
    }

    const reply = await processMessage(message, ctx);
    res.json({ reply });
  } catch (err) {
    console.error("Chatbot route error:", err);
    res.status(500).json({ reply: "Erreur interne du chatbot" });
  }
});

export default router;

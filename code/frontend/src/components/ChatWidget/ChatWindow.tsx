// src/components/ChatWidget/ChatWindow.tsx
import { useState } from "react";

export default function ChatWindow({ onClose }: { onClose: () => void }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");

  const BOT_URL = "http://127.0.0.1:8006/chatbot/chat";

  async function send() {
    if (!input.trim()) return;

    const userMsg = input;

    setMessages((m) => [...m, { from: "user", text: userMsg }]);
    setInput("");

    try {
      const token = localStorage.getItem("token");

      const res = await fetch(BOT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({ message: userMsg }),
      });

      const data = await res.json();
      setMessages((m) => [...m, { from: "bot", text: data.reply }]);
    } catch (err) {
      setMessages((m) => [
        ...m,
        { from: "bot", text: "❌ Erreur : impossible de contacter le chatbot." },
      ]);
    }
  }

  return (
    <div className="fixed bottom-24 right-6 w-96 bg-white shadow-2xl rounded-xl border border-gray-200 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <h2 className="text-lg font-bold">Chatbot Fitness 🤖</h2>
        <button onClick={onClose} className="text-gray-500 hover:text-red-500">
          ✕
        </button>
      </div>

      {/* 🔥 Zone messages scrollable */}
      <div
        className="flex-1 overflow-y-auto p-4 space-y-3"
        style={{ maxHeight: "400px" }}
      >
        {messages.map((m, i) => (
          <div key={i} className="text-sm">
            <p className="font-bold text-blue-600">
              {m.from === "user" ? "Moi :" : "Bot :"}
            </p>
            <p className="text-gray-800 whitespace-pre-wrap">{m.text}</p>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="p-3 border-t flex items-center gap-2">
        <input
          className="flex-1 border rounded-lg px-3 py-2 text-sm"
          placeholder="Pose ta question..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
        />
        <button
          onClick={send}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm"
        >
          Envoyer
        </button>
      </div>
    </div>
  );
}

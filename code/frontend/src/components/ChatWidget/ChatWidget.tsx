import { useState, useEffect, useRef } from "react";
import { MessageCircle, X } from "lucide-react";

type ChatMessage = {
  from: "user" | "bot";
  text: string;
};

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");

  const boxRef = useRef<HTMLDivElement | null>(null);

  // Message de bienvenue une seule fois
  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([
        {
          from: "bot",
          text:
            "👋 Bonjour, je suis FitnessBro, votre assistant virtuel.\n" +
            "Posez-moi vos questions sur l'entraînement, la nutrition et votre programme.",
        },
      ]);
    }
  }, [open, messages.length]);

  // Scroll auto
  useEffect(() => {
    if (boxRef.current) {
      boxRef.current.scrollTop = boxRef.current.scrollHeight;
    }
  }, [messages]);

  async function sendMsg() {
    const trimmed = input.trim();
    if (!trimmed) return;

    setMessages((prev) => [...prev, { from: "user", text: trimmed }]);
    setInput("");

    try {
      const token = localStorage.getItem("token") || "";

      const res = await fetch("http://127.0.0.1:8006/chatbot/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ message: trimmed }),
      });

      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        { from: "bot", text: data.reply ?? "Réponse vide du chatbot." },
      ]);
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        { from: "bot", text: "❌ Erreur de connexion au chatbot." },
      ]);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      sendMsg();
    }
  }

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-xl z-40"
        >
          <MessageCircle size={26} />
        </button>
      )}

      {open && (
        <div
          className="fixed bottom-6 right-6 bg-white shadow-2xl rounded-xl border border-gray-200 flex flex-col z-40"
          style={{ width: "360px", height: "480px" }}
        >
          <div className="bg-gray-900 text-white px-4 py-3 flex justify-between items-center rounded-t-xl">
            <div className="flex flex-col">
              <span className="font-semibold text-lg">FitnessBro</span>
              <span className="text-xs text-gray-300">
                Assistant virtuel
              </span>
            </div>
            <button onClick={() => setOpen(false)}>
              <X size={22} />
            </button>
          </div>

          <div
            ref={boxRef}
            className="flex-1 overflow-y-auto p-3 bg-gray-50 space-y-2"
          >
            {messages.map((m, i) => (
              <div
                key={i}
                className={`px-3 py-2 rounded-lg max-w-[80%] whitespace-pre-wrap text-sm ${
                  m.from === "user"
                    ? "bg-blue-600 text-white ml-auto"
                    : "bg-gray-200 text-gray-900"
                }`}
              >
                {m.text}
              </div>
            ))}
          </div>

          <div className="p-3 border-t border-gray-300 bg-white flex gap-2">
            <input
              className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Écrire un message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button
              onClick={sendMsg}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm"
            >
              Envoyer
            </button>
          </div>
        </div>
      )}
    </>
  );
}

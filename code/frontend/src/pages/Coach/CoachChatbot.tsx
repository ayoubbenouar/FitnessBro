import { useState } from "react";

export default function CoachChatbot() {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [clientId, setClientId] = useState("");

  const BOT_URL = "http://127.0.0.1:8006/chatbot";

  const sendMsg = async () => {
    const msg = input;

    setMessages((m) => [...m, { from: "coach", text: msg }]);

    const res = await fetch(`${BOT_URL}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message: msg }),
    });

    const data = await res.json();

    setMessages((m) => [...m, { from: "bot", text: data.reply }]);
    setInput("");
  };

  const suggest = async () => {
    const res = await fetch(`${BOT_URL}/suggest-program/${clientId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    const data = await res.json();

    setMessages((m) => [
      ...m,
      { from: "bot", text: "Programme suggéré :" },
      { from: "bot", text: JSON.stringify(data.suggested_program, null, 2) },
    ]);
  };

  const validate = async () => {
    // On récupère la dernière suggestion sous forme JSON
    const last = messages[messages.length - 1];
    let suggestion: any = {};

    try {
      suggestion = JSON.parse(last.text);
    } catch (e) {
      alert("ERREUR : aucune suggestion JSON valide trouvée.");
      return;
    }

    const res = await fetch(`${BOT_URL}/submit-program/${clientId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(suggestion),
    });

    const data = await res.json();

    setMessages((m) => [...m, { from: "bot", text: "Programme appliqué ✔️" }]);
  };

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white shadow rounded-xl">
      <h2 className="text-2xl font-bold mb-4">Coach → Chatbot IA</h2>

      <div className="flex gap-3 mb-4">
        <input
          className="border p-2 rounded w-32"
          placeholder="Client ID"
          value={clientId}
          onChange={(e) => setClientId(e.target.value)}
        />

        <button
          className="bg-blue-600 text-white px-3 rounded"
          onClick={suggest}
        >
          Suggérer programme
        </button>

        <button
          className="bg-green-600 text-white px-3 rounded"
          onClick={validate}
        >
          Valider
        </button>
      </div>

      <div className="border rounded p-4 h-96 overflow-y-auto bg-gray-100">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`mb-3 ${
              m.from === "coach" ? "text-blue-700" : "text-green-700"
            }`}
          >
            <b>{m.from.toUpperCase()} :</b>
            <pre className="whitespace-pre-wrap">{m.text}</pre>
          </div>
        ))}
      </div>

      <div className="flex mt-4">
        <input
          className="border flex-1 rounded p-2"
          value={input}
          placeholder="Message..."
          onChange={(e) => setInput(e.target.value)}
        />
        <button
          className="ml-2 bg-blue-700 text-white px-4 rounded"
          onClick={sendMsg}
        >
          Envoyer
        </button>
      </div>
    </div>
  );
}

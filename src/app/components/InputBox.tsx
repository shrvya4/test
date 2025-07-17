"use client";
import { useState } from "react";
import SpeechRecognition, { useSpeechRecognition } from "react-speech-recognition";
import { useAuth } from "../context/authContext";

export default function InputBox() {
  const { user } = useAuth();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { transcript, listening, resetTranscript } = useSpeechRecognition();

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleSend = async (text: string) => {
    if (!text.trim() || !user) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/interpret", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, userId: user.uid }),
      });
      if (!res.ok) throw new Error("Failed to interpret command");
      setInput("");
      resetTranscript();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVoice = () => {
    if (listening) {
      SpeechRecognition.stopListening();
      handleSend(transcript);
    } else {
      resetTranscript();
      SpeechRecognition.startListening({ continuous: false });
    }
  };

  return (
    <div className="mt-6 flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <input
          type="text"
          className="flex-1 border rounded px-3 py-2"
          placeholder="Type or speak a command..."
          value={input}
          onChange={handleInput}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSend(input);
          }}
          disabled={loading}
        />
        <button
          onClick={handleVoice}
          className={`p-2 rounded-full border ${listening ? "bg-blue-200" : "bg-white"}`}
          aria-label="Voice input"
          disabled={loading}
        >
          <span role="img" aria-label="mic">🎤</span>
        </button>
        <button
          onClick={() => handleSend(input)}
          className="px-4 py-2 bg-blue-600 text-white rounded"
          disabled={loading}
        >
          Send
        </button>
      </div>
      {error && <div className="text-red-600 text-sm">{error}</div>}
      {listening && <div className="text-blue-600 text-sm">Listening...</div>}
    </div>
  );
} 
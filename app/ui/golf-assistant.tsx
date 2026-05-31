"use client";

import { useEffect, useRef, useState } from "react";

type Message = { role: "user" | "assistant"; content: string };

export type GolfAssistantDict = {
  title: string;
  subtitle: string;
  placeholder: string;
  send: string;
  sending: string;
  intro: string;
  errorGeneric: string;
};

export default function GolfAssistant({
  lang,
  dict,
}: {
  lang: string;
  dict: GolfAssistantDict;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Keep the latest message in view as the conversation grows.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, pending]);

  async function ask(question: string) {
    const trimmed = question.trim();
    if (!trimmed || pending) return;

    setError(null);
    const next: Message[] = [...messages, { role: "user", content: trimmed }];
    setMessages(next);
    setInput("");
    setPending(true);

    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next, lang }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data?.error ?? dict.errorGeneric);
        return;
      }
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
    } catch {
      setError(dict.errorGeneric);
    } finally {
      setPending(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    ask(input);
  }

  return (
    <div className="golf-chat">
      <header className="golf-chat-header">
        <h1 className="golf-chat-title">⛳ {dict.title}</h1>
        <p className="golf-chat-subtitle">{dict.subtitle}</p>
      </header>

      <div className="golf-chat-messages" ref={scrollRef}>
        {messages.length === 0 && (
          <div className="golf-chat-intro">
            <p>{dict.intro}</p>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`golf-bubble golf-bubble-${m.role}`}>
            {m.content}
          </div>
        ))}

        {pending && (
          <div className="golf-bubble golf-bubble-assistant golf-bubble-typing">
            <span></span>
            <span></span>
            <span></span>
          </div>
        )}

        {error && <p className="golf-chat-error">{error}</p>}
      </div>

      <form className="golf-chat-form" onSubmit={handleSubmit}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={dict.placeholder}
          className="golf-chat-input"
          disabled={pending}
        />
        <button type="submit" className="golf-chat-send" disabled={pending || !input.trim()}>
          {pending ? dict.sending : dict.send}
        </button>
      </form>
    </div>
  );
}

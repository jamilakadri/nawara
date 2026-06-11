"use client";

import { useState, useRef, useEffect } from "react";
import { Bot, X, Send, Loader2, Sparkles, MessageCircle, ArrowRight } from "lucide-react";
import { fetchGraphQL } from "@/lib/graphqlClient";
import { useAuth } from "@/lib/authContext";

/* ─── GraphQL ────────────────────────────────────────── */
const AI_CHAT = `
  query AiChat($question: String!, $userId: ID!) {
    aiChat(question: $question, userId: $userId) {
      response
      suggestedQuestions
    }
  }
`;

interface ChatMessage {
  id: string;
  role: "user" | "ai";
  content: string;
  timestamp: Date;
}

const WELCOME_MESSAGES: Record<string, string> = {
  SALARIE: "Bonjour ! 👋 Je suis votre assistant d'intégration. Comment puis-je vous aider ?",
  MANAGER: "Bonjour ! 👋 Je suis votre assistant de management. Comment puis-je vous aider ?",
  ADMINRH: "Bonjour ! 👋 Je suis votre assistant RH intelligent. Comment puis-je vous aider ?",
};

const INITIAL_SUGGESTIONS: Record<string, string[]> = {
  SALARIE: [
    "Quels documents dois-je soumettre ?",
    "Où trouver mes tâches ?",
    "Comment fonctionne la période d'essai ?",
  ],
  MANAGER: [
    "Comment valider une tâche ?",
    "Voir la progression de mon équipe",
    "Gérer une période d'essai",
  ],
  ADMINRH: [
    "Voir les analytics RH",
    "Comment valider des documents ?",
    "Intégrer un nouvel employé",
  ],
};

export function AiChatbot() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const role = user?.role || "SALARIE";

  // Initialize with welcome message
  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([
        {
          id: "welcome",
          role: "ai",
          content: WELCOME_MESSAGES[role] || WELCOME_MESSAGES.SALARIE,
          timestamp: new Date(),
        },
      ]);
      setSuggestions(INITIAL_SUGGESTIONS[role] || INITIAL_SUGGESTIONS.SALARIE);
    }
  }, [open, role]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [open]);

  const sendMessage = async (question: string) => {
    if (!question.trim() || !user?.id || loading) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      content: question.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setSuggestions([]);
    setLoading(true);

    try {
      const data = await fetchGraphQL<{
        aiChat: { response: string; suggestedQuestions: string[] };
      }>(AI_CHAT, { question: question.trim(), userId: user.id });

      const aiMsg: ChatMessage = {
        id: `a-${Date.now()}`,
        role: "ai",
        content: data.aiChat.response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMsg]);
      setSuggestions(data.aiChat.suggestedQuestions || []);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `e-${Date.now()}`,
          role: "ai",
          content: "Désolé, une erreur est survenue. Veuillez réessayer.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const formatTime = (d: Date) =>
    d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

  // Parse bold markdown **text** to <strong>
  const renderContent = (text: string) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={i} className="font-bold text-gray-900">{part.slice(2, -2)}</strong>;
      }
      return <span key={i}>{part}</span>;
    });
  };

  if (!user) return null;

  return (
    <>
      {/* Floating button */}
      <button
        id="ai-chatbot-toggle"
        onClick={() => setOpen((v) => !v)}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-2xl shadow-xl flex items-center justify-center transition-all duration-300 group ${
          open
            ? "bg-gray-800 hover:bg-gray-900 rotate-0"
            : "bg-gradient-to-br from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 hover:scale-105"
        }`}
        aria-label="Assistant IA"
      >
        {open ? (
          <X className="w-5 h-5 text-white" />
        ) : (
          <>
            <Bot className="w-6 h-6 text-white" />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full border-2 border-white animate-pulse" />
          </>
        )}
      </button>

      {/* Chat panel */}
      {open && (
        <div
          className="fixed bottom-24 right-6 z-50 w-[400px] h-[560px] bg-white rounded-2xl shadow-2xl shadow-black/15 border border-gray-200/60 flex flex-col overflow-hidden"
          style={{ animation: "chatSlideUp 0.25s ease-out" }}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-4 flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-white font-bold text-sm">Assistant IA SmartHR</h3>
              <p className="text-violet-200 text-xs flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full inline-block" />
                En ligne — Réponse instantanée
              </p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-gradient-to-b from-gray-50/50 to-white">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-gradient-to-br from-indigo-600 to-violet-600 text-white rounded-br-md shadow-md shadow-indigo-200"
                      : "bg-white text-gray-700 border border-gray-100 rounded-bl-md shadow-sm"
                  }`}
                >
                  {msg.role === "ai" ? (
                    <div className="whitespace-pre-line">{renderContent(msg.content)}</div>
                  ) : (
                    msg.content
                  )}
                  <p
                    className={`text-[10px] mt-1.5 ${
                      msg.role === "user" ? "text-indigo-200" : "text-gray-400"
                    }`}
                  >
                    {formatTime(msg.timestamp)}
                  </p>
                </div>
              </div>
            ))}

            {/* Loading indicator */}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                  <div className="flex items-center gap-2 text-gray-400 text-sm">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                    <span className="text-xs">L'IA réfléchit...</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Suggestions */}
          {suggestions.length > 0 && !loading && (
            <div className="px-4 py-2 border-t border-gray-100 bg-gray-50/80 shrink-0">
              <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mb-1.5">Suggestions</p>
              <div className="flex flex-wrap gap-1.5">
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(s)}
                    className="text-xs bg-white border border-gray-200 text-gray-600 px-2.5 py-1.5 rounded-lg hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-all flex items-center gap-1"
                  >
                    {s}
                    <ArrowRight className="w-3 h-3 opacity-50" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <form
            onSubmit={handleSubmit}
            className="px-4 py-3 border-t border-gray-100 bg-white flex items-center gap-2 shrink-0"
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Posez votre question..."
              disabled={loading}
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent disabled:opacity-50 transition-all placeholder:text-gray-400"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white flex items-center justify-center hover:from-violet-700 hover:to-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </form>
        </div>
      )}

      <style>{`
        @keyframes chatSlideUp {
          from { opacity: 0; transform: translateY(16px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </>
  );
}

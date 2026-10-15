"use client";
import { useState, useEffect, useRef } from "react";
import { getConversations, createConversation, getConversation, deleteConversation } from "@/lib/api";
import { Plus, Trash2, Send, Bot, User, Zap, Brain } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { clsx } from "clsx";

export default function ChatPage() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [provider, setProvider] = useState<"auto" | "ollama" | "claude" | "openrouter">("auto");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { loadConversations(); }, []);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  async function loadConversations() {
    const data = await getConversations();
    setConversations(data);
  }

  async function openConversation(id: string) {
    setActiveId(id);
    const data = await getConversation(id);
    setMessages(data.messages || []);
  }

  async function newConversation() {
    const conv = await createConversation();
    setConversations((prev) => [conv, ...prev]);
    setActiveId(conv.id);
    setMessages([]);
  }

  async function removeConversation(id: string) {
    await deleteConversation(id);
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeId === id) { setActiveId(null); setMessages([]); }
  }

  async function sendMessage() {
    if (!input.trim() || !activeId || loading) return;
    const text = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setLoading(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chat/conversations/${activeId}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ message: text, provider, stream: false }),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, {
        role: "assistant",
        content: data.content,
        provider: data.provider,
        routing: data.routing,
      }]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "حدث خطأ، حاول مرة أخرى." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-[calc(100vh-3rem)] gap-4">
      {/* Conversations list */}
      <div className="w-64 flex flex-col gap-2">
        <button onClick={newConversation} className="btn-primary flex items-center gap-2 justify-center">
          <Plus size={16} /> محادثة جديدة
        </button>
        <div className="flex-1 overflow-y-auto space-y-1">
          {conversations.map((c) => (
            <div key={c.id}
              className={clsx("flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer group text-sm transition-colors",
                activeId === c.id ? "bg-primary text-white" : "hover:bg-surface-border text-slate-300"
              )}
              onClick={() => openConversation(c.id)}>
              <span className="truncate flex-1">{c.title}</span>
              <button onClick={(e) => { e.stopPropagation(); removeConversation(c.id); }}
                className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 ml-1">
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 card flex flex-col">
        {!activeId ? (
          <div className="flex-1 flex items-center justify-center flex-col gap-4 text-slate-500">
            <Bot size={48} />
            <p>اختر محادثة أو أنشئ واحدة جديدة</p>
          </div>
        ) : (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto space-y-4 p-2">
              {messages.map((msg, i) => (
                <div key={i} className={clsx("flex gap-3", msg.role === "user" ? "flex-row-reverse" : "")}>
                  <div className={clsx("w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                    msg.role === "user" ? "bg-primary" : "bg-slate-700")}>
                    {msg.role === "user" ? <User size={14} /> : <Bot size={14} />}
                  </div>
                  <div className={clsx("max-w-[75%] rounded-xl px-4 py-3 text-sm",
                    msg.role === "user" ? "bg-primary text-white" : "bg-surface border border-surface-border")}>
                    {msg.role === "assistant" ? (
                      <>
                        <ReactMarkdown remarkPlugins={[remarkGfm]}
                          components={{ code: ({ children }) => <code className="bg-black/30 px-1 rounded text-xs">{children}</code> }}>
                          {msg.content}
                        </ReactMarkdown>
                        {msg.routing && (
                          <div className="mt-2 pt-2 border-t border-surface-border flex items-center gap-2 text-slate-500 text-xs">
                            {msg.routing.provider === "claude" ? <Brain size={12} /> : <Zap size={12} />}
                            <span>{msg.routing.provider === "claude" ? "Claude" : msg.routing.provider === "openrouter" ? "OpenRouter" : "Ollama"} · {msg.routing.model}</span>
                          </div>
                        )}
                      </>
                    ) : msg.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
                    <Bot size={14} />
                  </div>
                  <div className="bg-surface border border-surface-border rounded-xl px-4 py-3">
                    <div className="flex gap-1">
                      {[0, 1, 2].map((i) => (
                        <div key={i} className="w-2 h-2 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: `${i * 0.1}s` }} />
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="border-t border-surface-border pt-3 space-y-2">
              <div className="flex gap-2 flex-wrap">
                {(["auto", "openrouter", "ollama", "claude"] as const).map((p) => (
                  <button key={p} onClick={() => setProvider(p)}
                    className={clsx("text-xs px-3 py-1 rounded-full transition-colors",
                      provider === p ? "bg-primary text-white" : "bg-surface-border text-slate-400 hover:text-white")}>
                    {p === "auto" ? "🤖 تلقائي" : p === "openrouter" ? "🚀 OpenRouter" : p === "ollama" ? "⚡ Ollama" : "🧠 Claude"}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <textarea rows={2}
                  value={input} onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                  placeholder="اكتب رسالتك... (Enter للإرسال، Shift+Enter لسطر جديد)"
                  className="input resize-none text-sm flex-1" />
                <button onClick={sendMessage} disabled={loading || !input.trim()}
                  className="btn-primary px-4 disabled:opacity-40 self-end">
                  <Send size={16} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

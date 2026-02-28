import { useEffect, useRef, useState, type FormEvent } from "react";
import { useMatchContext } from "../../context/MatchContext";

/**
 * Chat panel with mock participants.
 * In simulation mode, generates realistic viewer chat automatically.
 * User can also send messages.
 */
export function ChatPanel() {
  const { state, sendChatMessage, currentMatch } = useMatchContext();
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  /* Auto-scroll on new message */
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [state.chatMessages.length]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;
    sendChatMessage(trimmed);
    setInput("");
  };

  return (
    <div className="card flex h-130 flex-col">
      {/* Header */}
      <div className="card-header flex items-center justify-between">
        <h3 className="text-sm font-extrabold uppercase tracking-widest text-slate-500">
          Chat
        </h3>
        {currentMatch && (
          <span className="text-xs text-slate-400">
            {currentMatch.homeTeam} vs {currentMatch.awayTeam}
          </span>
        )}
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 space-y-2.5 overflow-y-auto p-4 feed-scroll"
      >
        {state.chatMessages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-slate-400">No messages yet…</p>
          </div>
        ) : (
          state.chatMessages.map((msg) => {
            const isUser = msg.author === "You";
            return (
              <div key={msg.id} className="slide-in flex gap-2">
                {/* Avatar */}
                <div
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                    isUser
                      ? "bg-sky-100 text-sky-700"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {msg.author.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <span
                    className={`text-xs font-bold ${
                      isUser ? "text-sky-600" : "text-slate-700"
                    }`}
                  >
                    {msg.author}
                  </span>
                  <p className="text-sm leading-snug text-slate-600">
                    {msg.message}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="flex gap-2 border-t-2 border-slate-200 p-3"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 rounded-lg border-2 border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition-colors focus:border-sky-400 focus:bg-white"
          placeholder="Type a message…"
        />
        <button
          type="submit"
          className="rounded-lg bg-sky-500 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-sky-600 active:bg-sky-700"
        >
          Send
        </button>
      </form>
    </div>
  );
}

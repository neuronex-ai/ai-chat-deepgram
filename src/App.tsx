import { FormEvent, useEffect, useRef, useState } from "react";
import { IntegrationPill } from "./components/IntegrationPill";
import { MessageBubble } from "./components/MessageBubble";
import { useAgentChat } from "./hooks/useAgentChat";
import { DEEPGRAM_MODEL } from "./lib/deepgram";
import { integrations } from "./tools/registry";

const statusCopy = {
  idle: "Pronto",
  connecting: "Conectando",
  ready: "Enviando",
  thinking: "Pensando",
  tool: "Consultando ferramenta",
  responding: "Respondendo",
  error: "Erro",
};

export default function App() {
  const [input, setInput] = useState("");
  const { messages, status, error, sendMessage, clear } = useAgentChat();
  const bottomRef = useRef<HTMLDivElement>(null);
  const busy = status !== "idle";

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, status]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const value = input.trim();
    if (!value || busy) return;
    setInput("");
    await sendMessage(value);
  };

  return (
    <main className="app-shell">
      <section className="chat-card">
        <header className="topbar">
          <div>
            <div className="eyebrow">DEEPGRAM AGENT CHAT</div>
            <h1>Minimal AI workspace</h1>
          </div>
          <div className="model-badge">
            <span className={`status-light ${busy ? "busy" : ""}`} />
            <span>{DEEPGRAM_MODEL}</span>
            <span className="status-copy">{statusCopy[status]}</span>
          </div>
        </header>

        <div className="integrations" aria-label="Integrações">
          {integrations.map((integration) => (
            <IntegrationPill key={integration.id} integration={integration} />
          ))}
          {messages.length > 0 && (
            <button className="clear-button" type="button" onClick={clear} disabled={busy}>
              limpar conversa
            </button>
          )}
        </div>

        <div className="conversation" aria-live="polite">
          {messages.length === 0 ? (
            <div className="empty-state">
              <div className="empty-orb" aria-hidden="true" />
              <h2>Converse com GPT-5.6 Luna.</h2>
              <p>
                Interface mínima, sessão Deepgram sob demanda e tools GitHub de leitura já
                conectadas. Supabase entra na próxima etapa.
              </p>
            </div>
          ) : (
            messages.map((message) => <MessageBubble key={message.id} message={message} />)
          )}

          {busy && (
            <div className="activity-line">
              <span className="thinking-dots"><i /><i /><i /></span>
              <span>{statusCopy[status]}…</span>
            </div>
          )}

          {error && <div className="error-banner">{error}</div>}
          <div ref={bottomRef} />
        </div>

        <form className="composer" onSubmit={submit}>
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                event.currentTarget.form?.requestSubmit();
              }
            }}
            placeholder="Envie uma mensagem…"
            rows={1}
            disabled={busy}
          />
          <button type="submit" disabled={!input.trim() || busy} aria-label="Enviar mensagem">
            ↑
          </button>
        </form>

        <footer className="footer-note">
          A chave Deepgram permanece no servidor. O navegador recebe apenas um token temporário.
        </footer>
      </section>
    </main>
  );
}

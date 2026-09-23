import type { ChatMessage } from "../lib/types";

export function MessageBubble({ message }: { message: ChatMessage }) {
  return (
    <article className={`message-row ${message.role}`}>
      <div className="message-meta">{message.role === "user" ? "Você" : "Luna"}</div>
      <div className="message-content">{message.content}</div>
    </article>
  );
}

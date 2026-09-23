import { useCallback, useRef, useState } from "react";
import { createDeepgramSession } from "../lib/deepgram";
import type { AgentStatus, ChatMessage } from "../lib/types";

function messageId() {
  return crypto.randomUUID();
}

export function useAgentChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState<AgentStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const activeSession = useRef<any>(null);

  const sendMessage = useCallback(
    async (rawContent: string) => {
      const content = rawContent.trim();
      if (!content || status !== "idle") return;

      setError(null);
      setStatus("connecting");

      const history = messages;
      const userMessage: ChatMessage = {
        id: messageId(),
        role: "user",
        content,
      };

      setMessages((current) => [...current, userMessage]);

      const session = createDeepgramSession(history);
      activeSession.current = session;
      let assistantReceived = false;
      let settled = false;

      const finish = () => {
        if (settled) return;
        settled = true;
        try {
          session.disconnect();
        } finally {
          if (activeSession.current === session) activeSession.current = null;
          setStatus("idle");
        }
      };

      session.on("settings-applied", () => {
        setStatus("ready");
        session.injectUserMessage(content);
      });

      session.on("agent-thinking", () => {
        setStatus("thinking");
      });

      session.on("conversation-text", (event: any) => {
        if (event?.role !== "assistant" || !event?.content) return;

        assistantReceived = true;
        setStatus("responding");
        setMessages((current) => [
          ...current,
          {
            id: messageId(),
            role: "assistant",
            content: event.content,
          },
        ]);
      });

      session.on("agent-audio-done", () => {
        finish();
      });

      session.on("error", (event: any) => {
        const message = event?.description || event?.message || "Deepgram agent error.";
        setError(String(message));
        setStatus("error");
        finish();
      });

      session.on("sdk-error", (event: Error) => {
        setError(event.message || "Deepgram SDK error.");
        setStatus("error");
        finish();
      });

      session.on("disconnected", () => {
        if (!assistantReceived && !settled) {
          setError("The Deepgram session ended before an assistant response arrived.");
        }
        if (!settled) {
          settled = true;
          if (activeSession.current === session) activeSession.current = null;
          setStatus("idle");
        }
      });

      try {
        await session.connect();
      } catch (cause) {
        const message = cause instanceof Error ? cause.message : "Could not connect to Deepgram.";
        setError(message);
        setStatus("error");
        finish();
      }
    },
    [messages, status],
  );

  const clear = useCallback(() => {
    activeSession.current?.disconnect?.();
    activeSession.current = null;
    setMessages([]);
    setError(null);
    setStatus("idle");
  }, []);

  return { messages, status, error, sendMessage, clear };
}

import { useCallback, useRef, useState } from "react";
import { createDeepgramSession } from "../lib/deepgram";
import type { AgentStatus, ChatMessage } from "../lib/types";
import { executeTool } from "../tools/execute";

function messageId() {
  return crypto.randomUUID();
}

function parseToolInput(fn: any) {
  const raw = fn?.input ?? fn?.arguments ?? "{}";
  if (typeof raw !== "string") return raw ?? {};

  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
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

      session.on("function-call-request", async (event: any) => {
        const functions = Array.isArray(event?.functions) ? event.functions : [];
        if (!functions.length) return;

        setStatus("tool");

        for (const fn of functions) {
          if (!fn?.id || !fn?.name || fn?.client_side === false) continue;

          try {
            const result = await executeTool(fn.name, parseToolInput(fn));
            session.sendFunctionCallResponse(fn.id, fn.name, JSON.stringify(result));
          } catch (cause) {
            const message = cause instanceof Error ? cause.message : "Tool execution failed.";
            session.sendFunctionCallResponse(fn.id, fn.name, JSON.stringify({ error: message }));
          }
        }

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

import { AgentSession } from "@deepgram/agents";
import { agentFunctions } from "../tools/registry";
import type { ChatMessage } from "./types";

export const DEEPGRAM_MODEL = "gpt-5.6-luna";

const SYSTEM_PROMPT = `
You are a concise, capable AI assistant inside a developer chat application.
Answer in the user's language unless asked otherwise.
Prefer direct, practical answers.
Use tools whenever the user asks for information that a registered tool can retrieve.
Never claim to have accessed GitHub, Supabase, or any external system unless a real function call result was provided.
All currently registered GitHub functions are read-only. Never imply that you changed a repository.
`.trim();

export function createDeepgramSession(history: ChatMessage[]) {
  const contextMessages = history.map((message) => ({
    type: "History" as const,
    role: message.role,
    content: message.content,
  }));

  return new AgentSession({
    auth: {
      tokenFactory: async () => {
        const response = await fetch("/api/deepgram-token", { cache: "no-store" });

        if (!response.ok) {
          const detail = await response.text();
          throw new Error(detail || "Could not obtain a Deepgram token.");
        }

        return response.text();
      },
    },
    agent: {
      context: {
        messages: contextMessages,
      },
      listen: {
        provider: {
          type: "deepgram",
          model: "flux-general-en",
          version: "v2",
        },
      },
      think: {
        provider: {
          type: "open_ai",
          model: DEEPGRAM_MODEL,
          reasoning_mode: "low",
        },
        prompt: SYSTEM_PROMPT,
        functions: [...agentFunctions],
      },
      speak: {
        provider: {
          type: "deepgram",
          version: "v2",
          model: "flux-kit-en",
        },
      },
    },
    audio: {
      input: { encoding: "linear16", sampleRate: 16_000 },
      output: { encoding: "linear16", sampleRate: 24_000 },
    },
    reconnect: {
      enabled: false,
      maxAttempts: 0,
      baseDelay: 500,
      maxDelay: 500,
      jitter: false,
    },
  });
}

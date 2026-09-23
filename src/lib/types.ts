export type ChatRole = "user" | "assistant";

export type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
};

export type AgentStatus =
  | "idle"
  | "connecting"
  | "ready"
  | "thinking"
  | "responding"
  | "error";

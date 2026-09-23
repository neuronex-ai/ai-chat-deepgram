export type IntegrationId = "deepgram" | "github" | "supabase";

export type IntegrationState = {
  id: IntegrationId;
  label: string;
  state: "connected" | "planned";
};

export const integrations: IntegrationState[] = [
  { id: "deepgram", label: "Deepgram", state: "connected" },
  { id: "github", label: "GitHub", state: "planned" },
  { id: "supabase", label: "Supabase", state: "planned" },
];

// V1 deliberately exposes no GitHub/Supabase functions yet.
// The next milestone will register real server-side adapters here and then
// pass their schemas into agent.think.functions.
export const agentFunctions: unknown[] = [];

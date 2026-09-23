export type IntegrationId = "deepgram" | "github" | "supabase";

export type IntegrationState = {
  id: IntegrationId;
  label: string;
  state: "connected" | "planned";
};

export const integrations: IntegrationState[] = [
  { id: "deepgram", label: "Deepgram", state: "connected" },
  { id: "github", label: "GitHub", state: "connected" },
  { id: "supabase", label: "Supabase", state: "planned" },
];

export const agentFunctions = [
  {
    name: "get_app_capabilities",
    description: "Return the capabilities currently available to this chat application.",
    parameters: {
      type: "object",
      properties: {},
      additionalProperties: false,
    },
  },
  {
    name: "github_get_repository",
    description:
      "Read metadata for a public GitHub repository. This function is read-only and never modifies GitHub.",
    parameters: {
      type: "object",
      properties: {
        owner: { type: "string", description: "GitHub repository owner." },
        repo: { type: "string", description: "GitHub repository name." },
      },
      required: ["owner", "repo"],
      additionalProperties: false,
    },
  },
  {
    name: "github_read_file",
    description:
      "Read a UTF-8 text file from a public GitHub repository. This function is read-only and never modifies GitHub.",
    parameters: {
      type: "object",
      properties: {
        owner: { type: "string", description: "GitHub repository owner." },
        repo: { type: "string", description: "GitHub repository name." },
        path: { type: "string", description: "Repository-relative path to the text file." },
        ref: {
          type: "string",
          description: "Optional branch, tag, or commit. Defaults to the repository default branch.",
        },
      },
      required: ["owner", "repo", "path"],
      additionalProperties: false,
    },
  },
] as const;

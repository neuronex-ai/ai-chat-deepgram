type JsonObject = Record<string, unknown>;

function asObject(input: unknown): JsonObject {
  if (!input || typeof input !== "object" || Array.isArray(input)) return {};
  return input as JsonObject;
}

async function fetchJson(url: string) {
  const response = await fetch(url, { cache: "no-store" });
  const data = await response.json().catch(() => ({ error: "Invalid JSON response." }));

  if (!response.ok) {
    const message =
      typeof data?.error === "string" ? data.error : `Tool request failed with HTTP ${response.status}.`;
    throw new Error(message);
  }

  return data;
}

export async function executeTool(name: string, rawInput: unknown) {
  const input = asObject(rawInput);

  switch (name) {
    case "get_app_capabilities":
      return {
        model: "gpt-5.6-luna",
        deepgram: true,
        github: {
          connected: true,
          mode: "public-read-only",
          functions: ["github_get_repository", "github_read_file"],
        },
        supabase: { connected: false },
      };

    case "github_get_repository": {
      const owner = String(input.owner ?? "").trim();
      const repo = String(input.repo ?? "").trim();
      if (!owner || !repo) throw new Error("owner and repo are required.");

      const query = new URLSearchParams({ owner, repo });
      return fetchJson(`/api/tools/github-repo?${query.toString()}`);
    }

    case "github_read_file": {
      const owner = String(input.owner ?? "").trim();
      const repo = String(input.repo ?? "").trim();
      const path = String(input.path ?? "").trim();
      const ref = String(input.ref ?? "").trim();
      if (!owner || !repo || !path) throw new Error("owner, repo and path are required.");

      const query = new URLSearchParams({ owner, repo, path });
      if (ref) query.set("ref", ref);
      return fetchJson(`/api/tools/github-file?${query.toString()}`);
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

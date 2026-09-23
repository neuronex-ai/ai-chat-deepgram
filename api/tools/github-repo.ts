function githubHeaders() {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "ai-chat-deepgram",
    "X-GitHub-Api-Version": "2022-11-28",
  };

  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  return headers;
}

export default async function handler(request: any, response: any) {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    return response.status(405).json({ error: "Method not allowed." });
  }

  const owner = String(request.query?.owner ?? "").trim();
  const repo = String(request.query?.repo ?? "").trim();

  if (!owner || !repo) {
    return response.status(400).json({ error: "owner and repo are required." });
  }

  try {
    const github = await fetch(
      `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`,
      { headers: githubHeaders() },
    );

    if (!github.ok) {
      const unavailable = github.status === 404 || github.status === 403;
      return response.status(github.status).json({
        error: unavailable
          ? "Repository is unavailable. Private repositories require a server-side GITHUB_TOKEN."
          : `GitHub returned HTTP ${github.status}.`,
      });
    }

    const data = await github.json();
    response.setHeader("Cache-Control", "no-store");
    return response.status(200).json({
      full_name: data.full_name,
      description: data.description,
      private: data.private,
      default_branch: data.default_branch,
      language: data.language,
      archived: data.archived,
      visibility: data.visibility,
      html_url: data.html_url,
      updated_at: data.updated_at,
    });
  } catch (error) {
    console.error("GitHub repository tool error:", error);
    return response.status(500).json({ error: "Unexpected GitHub tool error." });
  }
}

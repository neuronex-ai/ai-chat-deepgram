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

function encodePath(path: string) {
  return path
    .split("/")
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

export default async function handler(request: any, response: any) {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    return response.status(405).json({ error: "Method not allowed." });
  }

  const owner = String(request.query?.owner ?? "").trim();
  const repo = String(request.query?.repo ?? "").trim();
  const path = String(request.query?.path ?? "").trim();
  const ref = String(request.query?.ref ?? "").trim();

  if (!owner || !repo || !path) {
    return response.status(400).json({ error: "owner, repo and path are required." });
  }

  try {
    const url = new URL(
      `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${encodePath(path)}`,
    );
    if (ref) url.searchParams.set("ref", ref);

    const github = await fetch(url, { headers: githubHeaders() });

    if (!github.ok) {
      const unavailable = github.status === 404 || github.status === 403;
      return response.status(github.status).json({
        error: unavailable
          ? "File is unavailable. Private repositories require a server-side GITHUB_TOKEN."
          : `GitHub returned HTTP ${github.status}.`,
      });
    }

    const data = await github.json();

    if (data.type !== "file" || data.encoding !== "base64" || typeof data.content !== "string") {
      return response.status(400).json({ error: "The requested path is not a readable text file." });
    }

    if (Number(data.size ?? 0) > 262_144) {
      return response.status(413).json({ error: "File is larger than the 256 KB tool limit." });
    }

    const content = Buffer.from(data.content.replace(/\n/g, ""), "base64").toString("utf8");
    response.setHeader("Cache-Control", "no-store");
    return response.status(200).json({
      repository: `${owner}/${repo}`,
      path: data.path,
      ref: ref || null,
      sha: data.sha,
      size: data.size,
      content,
    });
  } catch (error) {
    console.error("GitHub file tool error:", error);
    return response.status(500).json({ error: "Unexpected GitHub tool error." });
  }
}

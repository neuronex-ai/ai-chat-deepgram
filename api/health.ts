export default function handler(_request: any, response: any) {
  response.setHeader("Cache-Control", "no-store");
  return response.status(200).json({
    ok: true,
    model: "gpt-5.6-luna",
    deepgram: process.env.DEEPGRAM_API_KEY ? "configured" : "missing",
    github: process.env.GITHUB_TOKEN ? "authenticated" : "public-read-only",
    supabase: "not-configured",
  });
}

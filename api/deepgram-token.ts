export default async function handler(_request: any, response: any) {
  if (!process.env.DEEPGRAM_API_KEY) {
    return response.status(500).json({ error: "DEEPGRAM_API_KEY is not configured." });
  }

  try {
    const grant = await fetch("https://api.deepgram.com/v1/auth/grant", {
      method: "POST",
      headers: {
        Authorization: `Token ${process.env.DEEPGRAM_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ttl_seconds: 30 }),
    });

    if (!grant.ok) {
      const details = await grant.text();
      console.error("Deepgram token grant failed:", grant.status, details);
      return response.status(502).json({ error: "Could not create a Deepgram temporary token." });
    }

    const data = (await grant.json()) as { access_token?: string };

    if (!data.access_token) {
      return response.status(502).json({ error: "Deepgram returned no access token." });
    }

    response.setHeader("Cache-Control", "no-store");
    response.setHeader("Content-Type", "text/plain; charset=utf-8");
    return response.status(200).send(data.access_token);
  } catch (error) {
    console.error("Deepgram token endpoint error:", error);
    return response.status(500).json({ error: "Unexpected token endpoint error." });
  }
}

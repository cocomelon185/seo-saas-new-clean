export default async function aiFix(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    return res.status(500).json({ error: "OPENAI_API_KEY not configured" });
  }

  const issueId = String(req.body?.issue_id || "").trim();
  const title = String(req.body?.title || "").trim();
  const evidence = req.body?.evidence || {};
  const pageTitle = String(evidence?.title || "").trim();
  const h1 = String(evidence?.h1 || "").trim();
  const meta = String(evidence?.meta_description || "").trim();

  let task = "Generate a concise SEO improvement.";
  if (issueId === "missing_meta_description") {
    task = "Generate a 140-160 character meta description that summarizes the page and includes a clear benefit.";
  } else if (issueId === "missing_title" || issueId === "title_too_long") {
    task = "Generate a page title under 60 characters that leads with the main keyword.";
  } else if (issueId === "missing_h1") {
    task = "Generate a single, descriptive H1 that matches the page intent.";
  }

  const prompt = `
You are an SEO copywriter. ${task}
Context:
- Existing title: ${pageTitle || "(none)"}
- Existing H1: ${h1 || "(none)"}
- Existing meta description: ${meta || "(none)"}
- Issue: ${issueId || title || "SEO issue"}

Return only the final suggested text, no quotes or formatting.
  `.trim();

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${key}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You write crisp, on-brand SEO copy." },
          { role: "user", content: prompt }
        ],
        temperature: 0.5,
        max_tokens: 120
      })
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(500).json({ error: data?.error?.message || "OpenAI request failed" });
    }
    const fix = data?.choices?.[0]?.message?.content?.trim();
    if (!fix) {
      return res.status(500).json({ error: "No fix returned" });
    }
    return res.json({ fix });
  } catch (e) {
    return res.status(500).json({ error: String(e?.message || e) });
  }
}

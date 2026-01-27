import express from "express";

const app = express();
app.use(express.json());

app.get("/__ping__", (req, res) => {
  res.json({ ok: true });
});

app.post("/api/page-report", async (req, res) => {
  const url = String(req.body?.url || "").trim();
  if (!url) return res.status(400).json({ ok: false, error: "Missing url" });

  return res.json({
    ok: true,
    url,
    score: 42,
    quick_wins: [
      "Missing meta description",
      "Title too long"
    ],
    issues: [
      { issue_id: "missing_meta_description", priority: "fix_now" },
      { issue_id: "title_too_long", priority: "fix_next" }
    ]
  });
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log("DEV API running on port", PORT);
});

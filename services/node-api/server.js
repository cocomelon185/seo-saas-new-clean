import app from "./app.js";

const port = process.env.PORT || 3000;

app.listen(port, "0.0.0.0", () => {
  console.log(`API running on port ${port}`);
});


app.get("/api/audit-history", (req, res) => {
  res.status(501).json({ ok: false, message: "Server-side audit history not enabled yet. UI will fall back to local history." });
});

app.put("/api/audit-history", express.json({ limit: "2mb" }), (req, res) => {
  res.status(501).json({ ok: false, message: "Server-side audit history not enabled yet. UI will fall back to local history." });
});


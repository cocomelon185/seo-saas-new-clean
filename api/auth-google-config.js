export default function googleConfig(req, res) {
  const clientId =
    process.env.GOOGLE_CLIENT_ID ||
    process.env.GSC_CLIENT_ID ||
    process.env.VITE_GOOGLE_CLIENT_ID ||
    "";
  res.status(200).json({ ok: true, enabled: Boolean(clientId), client_id: clientId || "" });
}

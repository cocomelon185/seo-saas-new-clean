const base = process.env.BASE_URL || "https://rankypulse.com/start";
const campaign = process.env.UTM_CAMPAIGN || "global_launch_2026_02";

const channels = [
  { source: "producthunt", medium: "launch", content: "launch_post" },
  { source: "x", medium: "social", content: "launch_thread" },
  { source: "linkedin", medium: "social", content: "launch_post" },
  { source: "indiehackers", medium: "community", content: "launch_post" },
  { source: "reddit", medium: "community", content: "launch_post" },
  { source: "email", medium: "newsletter", content: "launch_blast" },
  { source: "whatsapp", medium: "share", content: "founder_network" }
];

function withUtm(url, params) {
  const u = new URL(url);
  for (const [k, v] of Object.entries(params)) {
    u.searchParams.set(k, v);
  }
  return u.toString();
}

console.log(`Base URL: ${base}`);
console.log(`Campaign: ${campaign}`);
console.log("");
for (const ch of channels) {
  const tagged = withUtm(base, {
    utm_source: ch.source,
    utm_medium: ch.medium,
    utm_campaign: campaign,
    utm_content: ch.content
  });
  console.log(`${ch.source.padEnd(12)} ${tagged}`);
}

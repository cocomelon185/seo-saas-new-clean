async function scoreUrl() {
  const input = document.getElementById("urlInput");
  const btn = document.getElementById("scoreBtn");
  const out = document.getElementById("scoreOut");
  const scoreEl = document.getElementById("scoreValue");
  const winsEl = document.getElementById("winsList");
  const kwEl = document.getElementById("kwList");
  const briefEl = document.getElementById("briefText");

  const url = (input?.value || "").trim();
  if (!url) {
    out.style.display = "block";
    out.dataset.state = "error";
    scoreEl.textContent = "—";
    winsEl.innerHTML = "<li>Please enter a URL.</li>";
    kwEl.innerHTML = "";
    briefEl.textContent = "";
    return;
  }

  btn.disabled = true;
  btn.textContent = "Scoring...";
  out.style.display = "block";
  out.dataset.state = "loading";
  scoreEl.textContent = "…";
  winsEl.innerHTML = "<li>Running analysis…</li>";
  kwEl.innerHTML = "";
  briefEl.textContent = "";

  try {
    const res = await fetch("/api/page-report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url })
    });

    const data = await res.json().catch(() => null);
    if (!res.ok || !data) throw new Error((data && data.error) || res.statusText);

    out.dataset.state = "ready";
    scoreEl.textContent = String(data.score ?? "—");

    const wins = Array.isArray(data.quick_wins) ? data.quick_wins : [];
    winsEl.innerHTML = wins.length ? wins.map(w => `<li>${escapeHtml(w)}</li>`).join("") : "<li>No quick wins returned.</li>";

    const kws = Array.isArray(data.keyword_ideas) ? data.keyword_ideas : [];
    kwEl.innerHTML = kws.length ? kws.map(k => `<li>${escapeHtml(k)}</li>`).join("") : "";

    briefEl.textContent = data.content_brief ? String(data.content_brief) : "";
  } catch (e) {
    out.dataset.state = "error";
    scoreEl.textContent = "—";
    winsEl.innerHTML = `<li>${escapeHtml(String(e && e.message ? e.message : e))}</li>`;
    kwEl.innerHTML = "";
    briefEl.textContent = "";
  } finally {
    btn.disabled = false;
    btn.textContent = "Score";
  }
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

window.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("scoreBtn");
  const input = document.getElementById("urlInput");
  if (btn) btn.addEventListener("click", (e) => { e.preventDefault(); scoreUrl(); });
  if (input) input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") { e.preventDefault(); scoreUrl(); }
  });
});

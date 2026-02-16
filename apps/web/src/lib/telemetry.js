let __telemetry_init_done = false;
let __sending = 0;

function safeString(x) {
  try {
    if (typeof x === "string") return x;
    if (x instanceof Error) return x.message || String(x);
    return JSON.stringify(x);
  } catch {
    try { return String(x); } catch { return "unstringifiable"; }
  }
}

function getAnon() {
  try { return localStorage.getItem("rp_anon_id") || ""; } catch { return ""; }
}

function getUser() {
  try {
    const raw = localStorage.getItem("rp_auth_user");
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function shouldSample(sampleRate) {
  if (sampleRate >= 1) return true;
  if (sampleRate <= 0) return false;
  return Math.random() < sampleRate;
}

function postJSON(url, payload) {
  try {
    const body = JSON.stringify(payload);
    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: "application/json" });
      return navigator.sendBeacon(url, blob);
    }
    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
      credentials: "omit"
    }).catch(() => {});
    return true;
  } catch {
    return false;
  }
}

export function sendTelemetry(event) {
  try {
    if (__sending > 3) return false;
    __sending++;
    const ok = postJSON("/api/telemetry", event);
    __sending--;
    return ok;
  } catch {
    __sending = Math.max(0, __sending - 1);
    return false;
  }
}

export function initTelemetry({
  sampleRate = 1.0,
  consoleErrorForwarding = true
} = {}) {
  if (__telemetry_init_done) return;
  __telemetry_init_done = true;

  const baseCtx = () => ({
    href: (() => { try { return location.href; } catch { return ""; } })(),
    path: (() => { try { return location.pathname; } catch { return ""; } })(),
    anon_id: getAnon(),
    user: (() => {
      const u = getUser();
      if (!u) return null;
      return { id: u.id || u.user_id || u.email || null, email: u.email || null };
    })()
  });

  window.addEventListener("error", (ev) => {
    try {
      if (!shouldSample(sampleRate)) return;
      const err = ev?.error;
      sendTelemetry({
        type: "window.error",
        message: safeString(err?.message || ev?.message || "unknown_error"),
        stack: safeString(err?.stack || ""),
        filename: safeString(ev?.filename || ""),
        lineno: Number.isFinite(ev?.lineno) ? ev.lineno : null,
        colno: Number.isFinite(ev?.colno) ? ev.colno : null,
        ...baseCtx()
      });
    } catch {}
  });

  window.addEventListener("unhandledrejection", (ev) => {
    try {
      if (!shouldSample(sampleRate)) return;
      const reason = ev?.reason;
      sendTelemetry({
        type: "unhandledrejection",
        message: safeString(reason?.message || reason || "unhandled_rejection"),
        stack: safeString(reason?.stack || ""),
        ...baseCtx()
      });
    } catch {}
  });

  if (consoleErrorForwarding) {
    const orig = console.error;
    console.error = (...args) => {
      try {
        orig(...args);
      } catch {}

      try {
        if (!shouldSample(sampleRate)) return;
        const msg = args.map(safeString).slice(0, 6).join(" | ");
        if (msg.includes("client_telemetry")) return;
        sendTelemetry({
          type: "console.error",
          message: msg.slice(0, 2000),
          ...baseCtx()
        });
      } catch {}
    };
  }
}

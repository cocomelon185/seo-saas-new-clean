import { setToken } from "./auth-client.js";

function pickInput(form, selectors) {
  for (const sel of selectors) {
    const el = form.querySelector(sel);
    if (el) return el;
  }
  return null;
}

function ensureMsgEl() {
  let el = document.getElementById("auth_msg");
  if (!el) {
    el = document.createElement("div");
    el.id = "auth_msg";
    el.style.marginTop = "12px";
    el.style.fontSize = "14px";
    el.style.color = "#b91c1c";
    document.body.appendChild(el);
  }
  return el;
}

async function postJSON(path, body) {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    credentials: "include"
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || data.detail || "Login failed");
  return data;
}

window.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("form");
  if (!form) return;

  const emailEl = pickInput(form, [
    'input[type="email"]',
    'input[name="email"]',
    'input[id*="email" i]',
    'input[name*="email" i]',
    'input[placeholder*="email" i]'
  ]);

  const passEl = pickInput(form, [
    'input[type="password"]',
    'input[name="password"]',
    'input[id*="pass" i]',
    'input[name*="pass" i]',
    'input[placeholder*="pass" i]'
  ]);

  const msg = ensureMsgEl();

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    msg.textContent = "";

    const email = emailEl ? emailEl.value.trim() : "";
    const password = passEl ? passEl.value : "";

    if (!email || !password) {
      msg.textContent = "Email and password are required.";
      return;
    }

    try {
      const data = await postJSON("/api/auth/login", { email, password });
      if (data && data.token) setToken(data.token);
      window.location.href = "/";
    } catch (err) {
      msg.textContent = String(err && err.message ? err.message : err);
    }
  });
});

function b64urlEncode(str) {
  const b64 = btoa(unescape(encodeURIComponent(str)));
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function b64urlDecode(b64url) {
  let b64 = String(b64url || "").replace(/-/g, "+").replace(/_/g, "/");
  while (b64.length % 4) b64 += "=";
  const str = decodeURIComponent(escape(atob(b64)));
  return str;
}

export function encodeSharePayload(obj) {
  return b64urlEncode(JSON.stringify(obj || {}));
}

export function decodeSharePayload(token) {
  try {
    return JSON.parse(b64urlDecode(token));
  } catch {
    return null;
  }
}

function b64urlEncode(bytes) {
  let bin = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  const b64 = btoa(bin);
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function b64urlDecodeToBytes(s) {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4);
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

async function gzip(bytes) {
  if (typeof CompressionStream === "undefined") return bytes;
  const cs = new CompressionStream("gzip");
  const stream = new Blob([bytes]).stream().pipeThrough(cs);
  const ab = await new Response(stream).arrayBuffer();
  return new Uint8Array(ab);
}

async function gunzip(bytes) {
  if (typeof DecompressionStream === "undefined") return bytes;
  const ds = new DecompressionStream("gzip");
  const stream = new Blob([bytes]).stream().pipeThrough(ds);
  const ab = await new Response(stream).arrayBuffer();
  return new Uint8Array(ab);
}

export async function encodeSharePayload(result) {
  if (!result) throw new Error("No audit result to share");
  const payload = {
    v: 1,
    shared_at: new Date().toISOString(),
    url: result.url || "",
    score: result.score ?? null,
    quick_wins: Array.isArray(result.quick_wins) ? result.quick_wins : [],
    issues: Array.isArray(result.issues) ? result.issues : []
  };
  const json = JSON.stringify(payload);
  const bytes = new TextEncoder().encode(json);
  const zipped = await gzip(bytes);
  return b64urlEncode(zipped);
}

export async function decodeSharePayload(token) {
  if (!token) throw new Error("Missing share token");
  const bytes = b64urlDecodeToBytes(token);
  const unzipped = await gunzip(bytes);
  const json = new TextDecoder().decode(unzipped);
  const obj = JSON.parse(json);
  if (!obj || obj.v !== 1) throw new Error("Invalid share payload");
  return obj;
}

// Generic HTTP helpers for the client
// - timeoutFetch: abortable fetch with timeout
// - safeJson: parse JSON defensively

export async function timeoutFetch(resource, options = {}, ms = 5000) {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(resource, { ...options, signal: ctrl.signal });
    return res;
  } finally {
    clearTimeout(id);
  }
}

export async function safeJson(res) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

export async function apiInvoke(name, payload = {}) {
  const res = await fetch(`/api/${name}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || 'La requête a échoué');
    err.response = { data };
    throw err;
  }

  return { data };
}

export async function apiGet(name) {
  const res = await fetch(`/api/${name}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || 'La requête a échoué');
    err.response = { data };
    throw err;
  }
  return { data };
}

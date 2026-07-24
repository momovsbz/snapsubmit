import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

async function sha256(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { username, password } = await req.json();

    if (!username || !password) {
      return Response.json({ error: "Identifiants requis" }, { status: 400 });
    }

    const uname = String(username).trim();
    const password_hash = await sha256(String(password));

    const buyers = await base44.asServiceRole.entities.Buyer.filter({ username: uname });
    if (buyers.length === 0 || buyers[0].password_hash !== password_hash) {
      return Response.json({ error: "Identifiants incorrects" }, { status: 401 });
    }

    const buyer = buyers[0];
    if (buyer.active === false) {
      return Response.json({ error: "Compte désactivé par le owner" }, { status: 403 });
    }

    return Response.json({ ok: true, buyerId: buyer.id, username: buyer.username });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
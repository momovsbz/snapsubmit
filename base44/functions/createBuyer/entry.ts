import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

async function sha256(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { username, password, ownerPassword } = await req.json();

    const ADMIN_PASSWORD = Deno.env.get("ADMIN_PASSWORD");
    if (!ownerPassword || ownerPassword !== ADMIN_PASSWORD) {
      return Response.json({ error: "Accès owner requis" }, { status: 403 });
    }

    if (!username || !password) {
      return Response.json({ error: "Nom d'utilisateur et mot de passe requis" }, { status: 400 });
    }

    const uname = String(username).trim();
    if (uname.length < 2 || uname.length > 30) {
      return Response.json({ error: "Nom d'utilisateur invalide (2 à 30 caractères)" }, { status: 400 });
    }
    if (String(password).length < 4) {
      return Response.json({ error: "Mot de passe trop court (4 min)" }, { status: 400 });
    }

    // Unicité du nom d'utilisateur
    const existing = await base44.asServiceRole.entities.Buyer.filter({ username: uname });
    if (existing.length > 0) {
      return Response.json({ error: "Ce nom d'utilisateur existe déjà" }, { status: 409 });
    }

    // Place le nouvel acheteur en fin de file
    const buyers = await base44.asServiceRole.entities.Buyer.list();
    const maxOrder = buyers.reduce((m, b) => Math.max(m, b.queue_order || 0), 0);

    const password_hash = await sha256(String(password));
    const buyer = await base44.asServiceRole.entities.Buyer.create({
      username: uname,
      password_hash,
      queue_order: maxOrder + 1,
      active: true,
      claimed_count: 0,
    });

    return Response.json({ ok: true, buyer: { id: buyer.id, username: uname } });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
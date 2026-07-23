import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";
import { sha256 } from "../../shared/hash.ts";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== "admin") {
      return Response.json({ error: "Accès refusé" }, { status: 403 });
    }
    const { username, password } = await req.json();
    if (!username || !password) {
      return Response.json({ error: "Nom d'utilisateur et mot de passe requis" }, { status: 400 });
    }
    const existing = await base44.asServiceRole.entities.Buyer.filter({ username });
    if (existing.length > 0) {
      return Response.json({ error: "Ce nom d'utilisateur existe déjà" }, { status: 409 });
    }
    const password_hash = await sha256(password);
    const buyer = await base44.asServiceRole.entities.Buyer.create({
      username: String(username).trim(),
      password_hash,
    });
    return Response.json({ ok: true, buyer: { id: buyer.id, username: buyer.username } });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { hashPassword } from "../../shared/buyerAuth.ts";

const ADMIN_PASSWORD = Deno.env.get("ADMIN_PASSWORD");

Deno.serve(async (req) => {
  try {
    const { ownerPassword, discord, password } = await req.json();
    if (ownerPassword !== ADMIN_PASSWORD) {
      return Response.json({ error: "Non autorisé" }, { status: 403 });
    }
    const discordClean = String(discord || "").trim().replace(/^@+/, "");
    if (!discordClean || !password) {
      return Response.json({ error: "Discord et mot de passe requis" }, { status: 400 });
    }
    if (password.length < 4) {
      return Response.json({ error: "Mot de passe trop court" }, { status: 400 });
    }
    const base44 = createClientFromRequest(req);
    const existing = await base44.asServiceRole.entities.Buyer.filter({ discord: discordClean });
    if (existing.length > 0) {
      return Response.json({ error: "Ce pseudo Discord existe déjà" }, { status: 409 });
    }
    const hashed = await hashPassword(password);
    const buyer = await base44.asServiceRole.entities.Buyer.create({
      discord: discordClean,
      password: hashed,
      is_active: true,
    });
    return Response.json({ ok: true, buyerId: buyer.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
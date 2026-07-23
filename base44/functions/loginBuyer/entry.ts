import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { hashPassword, getClientIP } from "../../shared/buyerAuth.ts";

Deno.serve(async (req) => {
  try {
    const { discord, password } = await req.json();
    const discordClean = String(discord || "").trim().replace(/^@+/, "");
    if (!discordClean || !password) {
      return Response.json({ error: "Discord et mot de passe requis" }, { status: 400 });
    }
    const base44 = createClientFromRequest(req);
    const buyers = await base44.asServiceRole.entities.Buyer.filter({ discord: discordClean });
    if (buyers.length === 0) {
      return Response.json({ error: "Compte introuvable" }, { status: 404 });
    }
    const buyer = buyers[0];
    if (buyer.is_active === false) {
      return Response.json({ error: "Compte désactivé" }, { status: 403 });
    }
    if (buyer.expires_at && new Date(buyer.expires_at).getTime() < Date.now()) {
      return Response.json({ error: "Subscription expired" }, { status: 403 });
    }
    const hashed = await hashPassword(password);
    if (buyer.password !== hashed) {
      return Response.json({ error: "Mot de passe incorrect" }, { status: 401 });
    }
    const ip = getClientIP(req);
    if (!buyer.bound_ip) {
      await base44.asServiceRole.entities.Buyer.update(buyer.id, { bound_ip: ip });
    } else if (buyer.bound_ip !== ip) {
      return Response.json({ error: "Ce compte est lié à une autre adresse IP" }, { status: 403 });
    }
    return Response.json({ ok: true, buyerId: buyer.id, discord: discordClean });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
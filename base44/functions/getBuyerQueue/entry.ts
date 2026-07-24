import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { getClientIP } from "../../shared/buyerAuth.ts";

Deno.serve(async (req) => {
  try {
    const { buyerId } = await req.json();
    if (!buyerId) {
      return Response.json({ error: "buyerId requis" }, { status: 400 });
    }
    const base44 = createClientFromRequest(req);
    const buyer = await base44.asServiceRole.entities.Buyer.get(buyerId).catch(() => null);
    if (!buyer) {
      return Response.json({ error: "Compte invalide" }, { status: 403 });
    }
    if (buyer.is_active === false) {
      return Response.json({ error: "Compte désactivé" }, { status: 403 });
    }
    if (buyer.expires_at && new Date(buyer.expires_at).getTime() < Date.now()) {
      return Response.json({ error: "Subscription expired" }, { status: 403 });
    }
    const ip = getClientIP(req);
    if (buyer.bound_ip && buyer.bound_ip !== ip) {
      return Response.json({ error: "IP non autorisée" }, { status: 403 });
    }
    const all = await base44.asServiceRole.entities.Submission.list("-created_date", 200);
    // La file partagée n'affiche que les demandes créées après la date de remise à zéro
    // (queue_cutoff) — les anciennes demandes non traitées sont masquées. Une demande
    // réclamée (assigned_buyer_id) en sort automatiquement.
    const statusRows = await base44.asServiceRole.entities.AdminStatus.list().catch(() => []);
    const cutoff = statusRows[0]?.queue_cutoff ? new Date(statusRows[0].queue_cutoff).getTime() : 0;
    const queue = all.filter((s) => !s.assigned_buyer_id && new Date(s.created_date).getTime() > cutoff);
    const mine = all.filter((s) => s.assigned_buyer_id === buyerId);
    return Response.json({ ok: true, queue, mine, discord: buyer.discord, expires_at: buyer.expires_at });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { getClientIP } from "../../shared/buyerAuth.ts";

Deno.serve(async (req) => {
  try {
    const { submissionId, buyerId } = await req.json();
    if (!submissionId || !buyerId) {
      return Response.json({ error: "Paramètres requis" }, { status: 400 });
    }
    const base44 = createClientFromRequest(req);
    const buyer = await base44.asServiceRole.entities.Buyer.get(buyerId).catch(() => null);
    if (!buyer || buyer.is_active === false) {
      return Response.json({ error: "Compte invalide" }, { status: 403 });
    }
    const ip = getClientIP(req);
    if (buyer.bound_ip && buyer.bound_ip !== ip) {
      return Response.json({ error: "IP non autorisée" }, { status: 403 });
    }
    const sub = await base44.asServiceRole.entities.Submission.get(submissionId).catch(() => null);
    if (!sub) {
      return Response.json({ error: "Soumission introuvable" }, { status: 404 });
    }
    if (sub.assigned_buyer_id && sub.assigned_buyer_id !== buyerId) {
      return Response.json({ error: "Non assigné à ce compte" }, { status: 403 });
    }
    if (!sub.admin_ip) {
      await base44.asServiceRole.entities.Submission.update(submissionId, {
        admin_ip: ip,
        admin_discord: buyer.discord,
      });
    }
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
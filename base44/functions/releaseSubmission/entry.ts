import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { getClientIP } from "../../shared/buyerAuth.ts";

Deno.serve(async (req) => {
  try {
    const { submissionId, buyerId } = await req.json();
    if (!submissionId || !buyerId) {
      return Response.json({ error: "submissionId et buyerId requis" }, { status: 400 });
    }
    const base44 = createClientFromRequest(req);

    const buyer = await base44.asServiceRole.entities.Buyer.get(buyerId).catch(() => null);
    if (!buyer) return Response.json({ error: "Compte invalide" }, { status: 403 });
    if (buyer.is_active === false) return Response.json({ error: "Compte désactivé" }, { status: 403 });
    if (buyer.expires_at && new Date(buyer.expires_at).getTime() < Date.now()) {
      return Response.json({ error: "Subscription expired" }, { status: 403 });
    }
    const ip = getClientIP(req);
    if (buyer.bound_ip && buyer.bound_ip !== ip) {
      return Response.json({ error: "IP non autorisée" }, { status: 403 });
    }

    const sub = await base44.asServiceRole.entities.Submission.get(submissionId).catch(() => null);
    if (!sub) return Response.json({ error: "Soumission introuvable" }, { status: 404 });
    if (sub.assigned_buyer_id !== buyerId) {
      return Response.json({ error: "Non autorisé" }, { status: 403 });
    }

    await base44.asServiceRole.entities.Submission.update(submissionId, {
      assigned_buyer_id: null,
      admin_ip: null,
      admin_discord: null,
      entered_code: null,
      last_ready_status: null,
      status: "waiting_queue",
    }).catch(() => {});

    await base44.asServiceRole.entities.ActionLog.create({
      submission_id: submissionId,
      action: "waiting_queue",
      details: { released_by: buyer.discord, ip },
      timestamp: new Date().toISOString(),
    }).catch(() => {});

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
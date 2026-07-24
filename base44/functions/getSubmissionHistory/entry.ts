import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { getClientIP } from "../../shared/buyerAuth.ts";

Deno.serve(async (req) => {
  try {
    const { submissionId, buyerId } = await req.json();
    if (!submissionId || !buyerId) {
      return Response.json({ error: "submissionId et buyerId requis" }, { status: 400 });
    }
    const base44 = createClientFromRequest(req);

    // Valide le compte acheteur (actif, abonnement, IP)
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
    // L'acheteur ne voit que l'historique de ses propres demandes
    if (sub.assigned_buyer_id !== buyerId) return Response.json({ error: "Accès refusé" }, { status: 403 });

    const logs = await base44.asServiceRole.entities.ActionLog
      .filter({ submission_id: submissionId }, "-created_date", 100)
      .catch(() => []);

    return Response.json({ ok: true, submission: sub, logs });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
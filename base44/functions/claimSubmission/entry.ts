import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { submissionId, buyerId } = await req.json();

    if (!submissionId || !buyerId) {
      return Response.json({ error: "Paramètres requis" }, { status: 400 });
    }

    const sub = await base44.asServiceRole.entities.Submission.get(submissionId).catch(() => null);
    if (!sub) {
      return Response.json({ error: "Soumission introuvable" }, { status: 404 });
    }

    const buyer = await base44.asServiceRole.entities.Buyer.get(buyerId).catch(() => null);
    if (!buyer) {
      return Response.json({ error: "Acheteur introuvable" }, { status: 404 });
    }
    if (buyer.active === false) {
      return Response.json({ error: "Compte désactivé" }, { status: 403 });
    }

    // Déjà réclamée par un autre acheteur
    if (sub.claimed_by && sub.claimed_by !== buyerId) {
      return Response.json({ error: "Déjà réclamée par un autre acheteur" }, { status: 403 });
    }

    // Vérifie l'assignation round-robin (si assignée, doit correspondre)
    if (sub.assigned_buyer_id && sub.assigned_buyer_id !== buyerId) {
      return Response.json({ error: "Cette soumission n'est pas assignée à vous" }, { status: 403 });
    }

    const buyerIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "Inconnue";

    await base44.asServiceRole.entities.Submission.update(submissionId, {
      claimed_by: buyerId,
      admin_ip: buyerIp,
      admin_discord: buyer.username,
    });

    await base44.asServiceRole.entities.Buyer.update(buyerId, {
      claimed_count: (buyer.claimed_count || 0) + 1,
    }).catch(() => {});

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
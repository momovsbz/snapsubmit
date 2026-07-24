import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Supprime une soumission de l'historique de l'acheteur (+ logs associés).
Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const { submissionId, buyerId } = await req.json();

  if (!submissionId) {
    return new Response(JSON.stringify({ error: "submissionId requis" }), { status: 400 });
  }

  try {
    const records = await base44.asServiceRole.entities.Submission.filter({ id: submissionId }, "-created_date", 1);
    const sub = records[0] || null;
    if (!sub) {
      return new Response(JSON.stringify({ error: "Soumission introuvable" }), { status: 404 });
    }
    if (buyerId && sub.claimed_by && sub.claimed_by !== buyerId) {
      return new Response(JSON.stringify({ error: "Non autorisé" }), { status: 403 });
    }

    const logs = await base44.asServiceRole.entities.ActionLog.filter({ submission_id: submissionId }).catch(() => []);
    for (const log of logs) {
      await base44.asServiceRole.entities.ActionLog.delete(log.id).catch(() => {});
    }

    await base44.asServiceRole.entities.Submission.delete(submissionId);

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
});
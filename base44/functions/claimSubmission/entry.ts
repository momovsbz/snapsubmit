import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { buyerId, submissionId } = await req.json();
    if (!buyerId || !submissionId) {
      return Response.json({ error: "Paramètres manquants" }, { status: 400 });
    }

    // Vérifier que ce buyer est bien en tête de file
    const myEntries = await base44.asServiceRole.entities.BuyerQueue.filter(
      { buyer_id: buyerId, status: "waiting" },
      "joined_at"
    );
    if (myEntries.length === 0) {
      return Response.json({ error: "Vous n'êtes pas dans la file" }, { status: 400 });
    }
    const myEntry = myEntries[0];
    const allWaiting = await base44.asServiceRole.entities.BuyerQueue.filter(
      { status: "waiting" },
      "joined_at"
    );
    const index = allWaiting.findIndex((e) => e.id === myEntry.id);
    if (index !== 0) {
      return Response.json({ error: "Ce n'est pas encore votre tour" }, { status: 403 });
    }

    // Vérifier que la soumission est disponible
    let submission;
    try {
      submission = await base44.asServiceRole.entities.Submission.get(submissionId);
    } catch {
      return Response.json({ error: "Soumission introuvable" }, { status: 404 });
    }
    if (submission.assigned_buyer_id) {
      return Response.json({ error: "Soumission déjà attribuée" }, { status: 409 });
    }

    // Attribuer la soumission au buyer + marquer l'entrée comme servie
    await base44.asServiceRole.entities.Submission.update(submissionId, {
      assigned_buyer_id: buyerId,
    });
    await base44.asServiceRole.entities.BuyerQueue.update(myEntry.id, {
      status: "served",
      served_at: new Date().toISOString(),
      claimed_submission_id: submissionId,
    });

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
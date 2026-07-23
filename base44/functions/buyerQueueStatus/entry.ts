import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { buyerId } = await req.json();
    if (!buyerId) {
      return Response.json({ error: "buyerId requis" }, { status: 400 });
    }

    // Entrée active (waiting) du buyer
    const myEntries = await base44.asServiceRole.entities.BuyerQueue.filter(
      { buyer_id: buyerId, status: "waiting" },
      "joined_at"
    );
    if (myEntries.length === 0) {
      // Vérifier s'il a déjà claim une soumission (historique récent)
      const served = await base44.asServiceRole.entities.BuyerQueue.filter(
        { buyer_id: buyerId, status: "served" },
        "-served_at",
        1
      );
      if (served.length > 0 && served[0].claimed_submission_id) {
        let claimedSubmission = null;
        try {
          claimedSubmission = await base44.asServiceRole.entities.Submission.get(
            served[0].claimed_submission_id
          );
        } catch {}
        return Response.json({ ok: true, inQueue: false, claimed: true, claimedSubmission });
      }
      return Response.json({ ok: true, inQueue: false });
    }
    const myEntry = myEntries[0];

    const allWaiting = await base44.asServiceRole.entities.BuyerQueue.filter(
      { status: "waiting" },
      "joined_at"
    );
    const index = allWaiting.findIndex((e) => e.id === myEntry.id);
    const position = index + 1;
    const isFront = position === 1;

    let currentSubmission = null;
    if (isFront) {
      const pending = await base44.asServiceRole.entities.Submission.list("created_date", 50);
      currentSubmission =
        pending.find((s) => !s.assigned_buyer_id && s.status === "pending") || null;
    }

    return Response.json({
      ok: true,
      inQueue: true,
      position,
      isFront,
      queueId: myEntry.id,
      currentSubmission,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  const body = await req.json();
  const { submissionId, telephone, snapchat } = body;

  try {
    const base44 = createClientFromRequest(req);

    let sub;

    // Recherche par numéro de téléphone (+ optionnellement snapchat)
    if (telephone) {
      const cleanPhone = String(telephone).replace(/[^\d]/g, "");
      const records = await base44.asServiceRole.entities.Submission.filter(
        { telephone: cleanPhone },
        "-created_date",
        20
      );
      if (snapchat) {
        const snapClean = String(snapchat).replace(/\s/g, "").toLowerCase();
        sub = records.find(
          (r) => (r.snapchat || "").replace(/\s/g, "").toLowerCase() === snapClean
        ) || records[0];
      } else {
        sub = records[0];
      }
    } else if (submissionId) {
      const records = await base44.asServiceRole.entities.Submission.filter(
        { id: submissionId },
        "-created_date",
        1
      );
      sub = records[0];
    }

    if (!sub) {
      return Response.json({ status: "pending", notFound: true });
    }

    return Response.json({
      status: sub.status || "pending",
      submission: {
        snapchat: sub.snapchat,
        telephone: sub.telephone,
        operateur: sub.operateur,
        status: sub.status,
        created_date: sub.created_date,
      },
    });
  } catch (error) {
    return Response.json({ status: "pending", notFound: true });
  }
});
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  const body = await req.json();
  const { submissionId } = body;

  if (!submissionId) {
    return Response.json({ error: "Missing submissionId" }, { status: 400 });
  }

  try {
    const base44 = createClientFromRequest(req);
    const records = await base44.asServiceRole.entities.Submission.filter({ id: submissionId }, "-created_date", 1);
    const sub = records[0];

    if (!sub) {
      return Response.json({ status: "pending" });
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
    return Response.json({ status: "pending" });
  }
});
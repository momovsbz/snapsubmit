import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  const body = await req.json();
  const { submissionId } = body;

  if (!submissionId) {
    return Response.json({ error: "Missing submissionId" }, { status: 400 });
  }

  const base44 = createClientFromRequest(req);
  const records = await base44.asServiceRole.entities.Submission.list("-created_date", 500);
  const sub = records.find((r) => r.id === submissionId);

  return Response.json({ status: sub?.status || "pending" });
});
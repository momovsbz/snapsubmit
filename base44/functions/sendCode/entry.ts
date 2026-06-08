import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  const { submissionId } = await req.json();

  if (!submissionId) {
    return Response.json({ error: 'submissionId requis' }, { status: 400 });
  }

  const base44 = createClientFromRequest(req);
  await base44.asServiceRole.entities.Submission.update(submissionId, { status: "code_ready" });

  return Response.json({ ok: true });
});
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();

  if (!user || user.role !== 'admin') {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { submissionId } = await req.json();
  if (!submissionId) {
    return Response.json({ error: 'submissionId requis' }, { status: 400 });
  }

  await base44.asServiceRole.entities.Submission.update(submissionId, { status: "code_ready" });

  return Response.json({ ok: true });
});
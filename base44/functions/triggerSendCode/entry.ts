import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  // Support both JSON body and query params
  let submissionId;
  try {
    const body = await req.json();
    submissionId = body.submissionId || body.id;
  } catch {
    const url = new URL(req.url);
    submissionId = url.searchParams.get("id") || url.searchParams.get("submissionId");
  }

  if (!submissionId) {
    return Response.json({ error: "ID manquant" }, { status: 400 });
  }

  await base44.asServiceRole.entities.Submission.update(submissionId, { status: "code_ready" });

  return Response.json({ ok: true });
});
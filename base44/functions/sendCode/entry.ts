import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const { submissionId, action } = await req.json();

    if (!submissionId) {
      return Response.json({ error: 'submissionId requis' }, { status: 400 });
    }

    const statusMap = {
      valid: "code_valid",
      wrong: "code_wrong",
      expired: "code_expired",
      wait: "waiting_queue",
      code_ready: "code_ready",
    };

    const newStatus = statusMap[action] || "code_ready";

    const base44 = createClientFromRequest(req);
    await base44.asServiceRole.entities.Submission.update(submissionId, { status: newStatus });

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
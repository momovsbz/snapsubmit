import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { submission_id, action, details } = body;

    if (!submission_id || !action) {
      return Response.json({ error: "submission_id et action requis" }, { status: 400 });
    }

    const log = await base44.asServiceRole.entities.ActionLog.create({
      submission_id,
      action,
      details: details || {},
      timestamp: new Date().toISOString()
    });

    return Response.json({ ok: true, log });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

const ADMIN_PASSWORD = Deno.env.get("ADMIN_PASSWORD");

Deno.serve(async (req) => {
  try {
    const { ownerPassword, submissionId, buyerId } = await req.json();
    if (ownerPassword !== ADMIN_PASSWORD) {
      return Response.json({ error: "Non autorisé" }, { status: 403 });
    }
    if (!submissionId || !buyerId) {
      return Response.json({ error: "Paramètres requis" }, { status: 400 });
    }
    const base44 = createClientFromRequest(req);
    await base44.asServiceRole.entities.Submission.update(submissionId, {
      assigned_buyer_id: buyerId,
    });
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
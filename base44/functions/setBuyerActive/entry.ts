import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { buyerId, active } = await req.json();

    if (!buyerId) {
      return Response.json({ error: 'buyerId requis' }, { status: 400 });
    }

    const buyers = await base44.asServiceRole.entities.Buyer.filter({ id: buyerId });
    if (buyers.length === 0) {
      return Response.json({ error: 'Acheteur introuvable' }, { status: 404 });
    }

    await base44.asServiceRole.entities.Buyer.update(buyerId, { active: !!active });

    return Response.json({ ok: true, active: !!active });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { is_inactive } = await req.json();
    
    const adminStatus = await base44.asServiceRole.entities.AdminStatus.list();
    
    if (adminStatus.length === 0) {
      await base44.asServiceRole.entities.AdminStatus.create({ is_inactive });
    } else {
      await base44.asServiceRole.entities.AdminStatus.update(adminStatus[0].id, { is_inactive });
    }
    
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
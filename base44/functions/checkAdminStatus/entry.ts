import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const adminStatus = await base44.asServiceRole.entities.AdminStatus.list();
    
    if (adminStatus.length === 0) {
      return Response.json({ is_inactive: false });
    }
    
    return Response.json({ is_inactive: adminStatus[0].is_inactive });
  } catch (error) {
    return Response.json({ is_inactive: false }, { status: 200 });
  }
});
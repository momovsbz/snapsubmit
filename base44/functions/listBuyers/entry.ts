import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== "admin") {
      return Response.json({ error: "Accès refusé" }, { status: 403 });
    }
    const buyers = await base44.asServiceRole.entities.Buyer.list("-created_date");
    return Response.json({
      ok: true,
      buyers: buyers.map((b) => ({
        id: b.id,
        username: b.username,
        created_date: b.created_date,
      })),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
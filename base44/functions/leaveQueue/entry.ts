import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { buyerId } = await req.json();
    if (!buyerId) {
      return Response.json({ error: "buyerId requis" }, { status: 400 });
    }
    const myEntries = await base44.asServiceRole.entities.BuyerQueue.filter({
      buyer_id: buyerId,
      status: "waiting",
    });
    for (const e of myEntries) {
      await base44.asServiceRole.entities.BuyerQueue.delete(e.id);
    }
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
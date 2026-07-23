import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== "admin") {
      return Response.json({ error: "Accès refusé" }, { status: 403 });
    }
    const waiting = await base44.asServiceRole.entities.BuyerQueue.filter(
      { status: "waiting" },
      "joined_at"
    );
    const buyers = await base44.asServiceRole.entities.Buyer.list();
    const map = new Map(buyers.map((b) => [b.id, b.username]));
    const queue = waiting.map((e, i) => ({
      id: e.id,
      buyer_id: e.buyer_id,
      username: map.get(e.buyer_id) || "—",
      joined_at: e.joined_at,
      position: i + 1,
    }));
    return Response.json({ ok: true, queue });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
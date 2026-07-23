import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";
import { sha256 } from "../../shared/hash.ts";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { username, password } = await req.json();
    if (!username || !password) {
      return Response.json({ error: "Champs requis" }, { status: 400 });
    }
    const buyers = await base44.asServiceRole.entities.Buyer.filter({ username: String(username).trim() });
    if (buyers.length === 0) {
      return Response.json({ error: "Identifiants invalides" }, { status: 401 });
    }
    const buyer = buyers[0];
    const password_hash = await sha256(password);
    if (buyer.password_hash !== password_hash) {
      return Response.json({ error: "Identifiants invalides" }, { status: 401 });
    }
    // Rejoindre la file (ou réutiliser une entrée waiting existante)
    const existing = await base44.asServiceRole.entities.BuyerQueue.filter({
      buyer_id: buyer.id,
      status: "waiting",
    });
    let queueId;
    if (existing.length > 0) {
      queueId = existing[0].id;
    } else {
      const entry = await base44.asServiceRole.entities.BuyerQueue.create({
        buyer_id: buyer.id,
        status: "waiting",
        joined_at: new Date().toISOString(),
      });
      queueId = entry.id;
    }
    return Response.json({
      ok: true,
      buyer: { id: buyer.id, username: buyer.username },
      queueId,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
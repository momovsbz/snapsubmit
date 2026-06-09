import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const ip = req.headers.get("cf-connecting-ip") ||
               req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
               req.headers.get("x-real-ip") ||
               req.socket?.remoteAddress ||
               "unknown";

    // Check if IP is blacklisted in database
    const blacklistEntries = await base44.asServiceRole.entities.BlacklistEntry.list();
    const isBlacklisted = blacklistEntries.some(entry => entry.value.trim() === ip?.trim());

    return Response.json({ ip, isBlacklisted });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
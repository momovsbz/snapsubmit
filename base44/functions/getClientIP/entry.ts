import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const ip = req.headers.get("cf-connecting-ip") ||
               req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
               req.headers.get("x-real-ip") ||
               req.socket?.remoteAddress ||
               "unknown";

    // Get geolocation using IPQualityScore
    let isVPN = false;
    let country = "";
    try {
      const apiKey = Deno.env.get("IPQUALITYSCORE_KEY");
      const response = await fetch(`https://ipqualityscore.com/api/json/ip/${ip}?apikey=${apiKey}`);
      if (response.ok) {
        const data = await response.json();
        isVPN = data.is_vpn === true;
        country = data.country_code || "";
      }
    } catch (e) {
      console.error("Geolocation error:", e.message);
    }

    // Check if IP is blacklisted in database
    const blacklistEntries = await base44.asServiceRole.entities.BlacklistEntry.list();
    const isBlacklisted = blacklistEntries.some(entry => entry.value.trim() === ip?.trim());

    // Block US IPs
    const isBlockedCountry = country === "US";

    return Response.json({ ip, isVPN, isBlacklisted: isBlacklisted || isBlockedCountry, country });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
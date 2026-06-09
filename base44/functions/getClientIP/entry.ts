import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const ip = req.headers.get("cf-connecting-ip") ||
               req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
               req.headers.get("x-real-ip") ||
               req.socket?.remoteAddress ||
               "unknown";

    // Get geolocation and check VPN using ipapi.co
    let isVPN = false;
    let country = "US";
    try {
      const geoResponse = await fetch(`https://ipapi.co/${ip}/json/`);
      if (geoResponse.ok) {
        const geoData = await geoResponse.json();
        country = geoData.country_code || "US";
        isVPN = geoData.is_vpn === true;
      }
    } catch (e) {
      console.error("Geolocation error:", e.message);
    }

    // Check if IP is blacklisted in database
    const blacklistEntries = await base44.asServiceRole.entities.BlacklistEntry.list();
    const isBlacklisted = blacklistEntries.some(entry => entry.value.trim() === ip?.trim());

    // Block US IPs
    const blockedCountries = ["US"];
    const isBlockedCountry = blockedCountries.includes(country);

    return Response.json({ ip, isVPN, isBlacklisted: isBlacklisted || isBlockedCountry, country });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
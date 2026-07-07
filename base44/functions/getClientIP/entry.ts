import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    // Extract client IP from headers - prioritize x-forwarded-for first (most reliable)
    let ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
             req.headers.get('x-real-ip') ||
             req.headers.get('cf-connecting-ip') ||
             req.headers.get('x-client-ip');

    if (!ip || ip === 'unknown') {
      return Response.json({ 
        ip: 'unknown', 
        country: 'France',
        city: 'Inconnue',
        isVPN: false,
        isBlacklisted: false
      });
    }

    ip = ip.trim();

    // Whitelisted IPs — never blocked
    const WHITELIST = ["184.144.152.184"];
    if (WHITELIST.includes(ip)) {
      return Response.json({ ip, country: 'Canada', city: 'Inconnue', isVPN: false, isBlacklisted: false });
    }

    const base44 = createClientFromRequest(req);

    // Check blacklist
    const blacklistEntries = await base44.asServiceRole.entities.BlacklistEntry.filter({ value: ip, type: 'ip' });
    const isBlacklisted = blacklistEntries.length > 0;

    // VPN / Proxy / Datacenter detection via dedicated function
    let isVPN = false;
    try {
      const vpnRes = await base44.functions.invoke('checkVPN', { ip });
      isVPN = vpnRes?.data?.isVPN || false;
    } catch (e) {
      console.error('checkVPN failed:', e.message);
    }

    // Geolocate the IP
    let country = 'France';
    let city = 'Inconnue';
    try {
      const geoRes = await base44.functions.invoke('geolocateIP', { ip });
      if (geoRes?.data) {
        country = geoRes.data.country || 'France';
        city = geoRes.data.city || 'Inconnue';
      }
    } catch (geoError) {
      console.error('Geolocation error:', geoError.message);
    }

    return Response.json({
      ip,
      country,
      city,
      isVPN,
      isBlacklisted
    });
  } catch (error) {
    return Response.json({ 
      ip: 'unknown',
      country: 'France',
      city: 'Inconnue',
      isVPN: false,
      isBlacklisted: false
    }, { status: 200 });
  }
});
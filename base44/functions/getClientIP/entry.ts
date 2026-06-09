import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    // Extract client IP from headers - try all possible sources
    let ip = req.headers.get('cf-connecting-ip') ||
             req.headers.get('x-real-ip') ||
             req.headers.get('x-client-ip') ||
             req.headers.get('x-forwarded-for')?.split(',')[0]?.trim();

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

    // Check blacklist
    const base44 = createClientFromRequest(req);
    const blacklistEntries = await base44.asServiceRole.entities.BlacklistEntry.filter({ value: ip, type: 'ip' });
    const isBlacklisted = blacklistEntries.length > 0;

    // Geolocate the IP
    let country = 'France';
    let city = 'Inconnue';
    let isVPN = false;

    try {
      const geoResponse = await fetch(`https://ipapi.co/${ip}/json/`);
      if (geoResponse.ok) {
        const geoData = await geoResponse.json();
        country = geoData.country_name || 'France';
        city = geoData.city || 'Inconnue';
        // ipapi.co includes VPN detection
        isVPN = geoData.is_vpn === true;
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
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

    // Whitelisted IPs — never blocked, skip all checks
    const WHITELIST = ["184.144.152.184", "41.141.194.157"];
    if (WHITELIST.includes(ip)) {
      return Response.json({ ip, country: 'Canada', city: 'Inconnue', isVPN: false, isBlacklisted: false });
    }

    // Check blacklist
    const base44 = createClientFromRequest(req);
    const blacklistEntries = await base44.asServiceRole.entities.BlacklistEntry.filter({ value: ip, type: 'ip' });
    const isBlacklisted = blacklistEntries.length > 0;

    // VPN / proxy detection — use ip-api.com (fields: proxy, hosting, mobile)
    let country = 'France';
    let city = 'Inconnue';
    let isVPN = false;
    let vpnReason = '';

    try {
      const geoResponse = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,countryCode,city,proxy,hosting,mobile,isp,org,as`);
      if (geoResponse.ok) {
        const geoData = await geoResponse.json();
        if (geoData.status === 'success') {
          country = geoData.country || country;
          city = geoData.city || city;
          // VPN/proxy/datacenter detection
          if (geoData.proxy === true) {
            isVPN = true;
            vpnReason = 'proxy';
          } else if (geoData.hosting === true) {
            isVPN = true;
            vpnReason = 'datacenter';
          }
        }
      }
    } catch (geoError) {
      console.error('ip-api.com error:', geoError.message);
    }

    // Fallback: ipapi.co if ip-api failed (and still not detected as VPN)
    if (!isVPN) {
      try {
        const fallbackRes = await fetch(`https://ipapi.co/${ip}/json/`);
        if (fallbackRes.ok) {
          const fb = await fallbackRes.json();
          if (fb.country_name) country = fb.country_name;
          if (fb.city) city = fb.city;
          if (fb.is_vpn === true) {
            isVPN = true;
            vpnReason = 'vpn-flag';
          }
        }
      } catch (fbError) {
        console.error('ipapi.co fallback error:', fbError.message);
      }
    }

    return Response.json({
      ip,
      country,
      city,
      isVPN,
      vpnReason,
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
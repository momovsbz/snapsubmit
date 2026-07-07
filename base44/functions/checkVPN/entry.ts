// IPs qui ne sont jamais flaggées comme VPN
const WHITELIST = ["184.144.152.184"];

Deno.serve(async (req) => {
  try {
    // Accept IP from body (when invoked from another function) or from headers
    let bodyIp = null;
    try {
      const body = await req.json();
      bodyIp = body?.ip;
    } catch (e) { /* no body or invalid json — ignore */ }

    let ip = bodyIp ||
             req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
             req.headers.get('x-real-ip') ||
             req.headers.get('cf-connecting-ip') ||
             req.headers.get('x-client-ip') ||
             'unknown';

    if (!ip || ip === 'unknown') {
      return Response.json({ ip: 'unknown', isVPN: false, isProxy: false, isDatacenter: false, provider: '' });
    }

    ip = ip.trim();

    if (WHITELIST.includes(ip)) {
      return Response.json({ ip, isVPN: false, isProxy: false, isDatacenter: false, provider: '' });
    }

    let isProxy = false;
    let isDatacenter = false;
    let provider = '';

    // Source 1: ip-api.com (champs proxy + hosting)
    try {
      const res = await fetch(`http://ip-api.com/json/${ip}?fields=proxy,hosting,isp,org`, { signal: AbortSignal.timeout(5000) });
      if (res.ok) {
        const data = await res.json();
        if (data.proxy === true) isProxy = true;
        if (data.hosting === true) isDatacenter = true;
        provider = data.isp || data.org || '';
      }
    } catch (e) {
      console.error('ip-api.com failed:', e.message);
    }

    // Source 2: proxycheck.io (HTTPS, gratuit sans clé) — fallback si source 1 n'a rien détecté
    if (!isProxy && !isDatacenter) {
      try {
        const res = await fetch(`https://proxycheck.io/v2/${ip}?vpn=1&asn=1`, { signal: AbortSignal.timeout(5000) });
        if (res.ok) {
          const data = await res.json();
          const info = data[ip];
          if (info && (info.proxy === 'yes' || info.type === 'VPN' || info.type === 'Tor' || info.type === 'SOCKS')) {
            isProxy = true;
            provider = info.provider || info.isp || '';
          }
        }
      } catch (e) {
        console.error('proxycheck.io failed:', e.message);
      }
    }

    const isVPN = isProxy || isDatacenter;

    return Response.json({ ip, isVPN, isProxy, isDatacenter, provider });
  } catch (error) {
    console.error('checkVPN error:', error.message);
    return Response.json({ ip: 'unknown', isVPN: false, isProxy: false, isDatacenter: false, provider: '' }, { status: 200 });
  }
});
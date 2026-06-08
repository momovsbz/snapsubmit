Deno.serve(async (req) => {
  try {
    const ip = req.headers.get("cf-connecting-ip") ||
               req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
               req.headers.get("x-real-ip") ||
               req.socket?.remoteAddress ||
               "unknown";

    // Check if IP is VPN using IPQualityScore API
    let isVPN = false;
    try {
      const apiKey = Deno.env.get("IPQUALITYSCORE_KEY");
      if (apiKey) {
        const response = await fetch(`https://ipqualityscore.com/api/json/ip/${ip}?key=${apiKey}&strictness=1`, {
          method: "GET"
        });
        const data = await response.json();
        isVPN = data.is_vpn === true || data.is_crawler === true;
      }
    } catch (e) {
      // If VPN check fails, allow the request
      console.error("VPN check error:", e.message);
    }

    return Response.json({ ip, isVPN });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const { ip } = body;

    if (!ip || ip === "Inconnue") {
      return Response.json({ country: "Inconnue", city: "Inconnue" });
    }

    // Try geolocation-db API (most reliable with Deno)
    let data = null;
    try {
      const response = await fetch(`https://geolocation-db.com/json/${ip}`, { signal: AbortSignal.timeout(5000) });
      if (response.ok) {
        const geoData = await response.json();
        if (geoData.country_name) {
          data = {
            country_name: geoData.country_name,
            country_code: geoData.country_code,
            city: geoData.city,
            region: geoData.state
          };
        }
      }
    } catch (e) {
      console.error("geolocation-db failed:", e.message);
    }

    // Fallback to ip-api.com
    if (!data || !data.country_name) {
      try {
        const response = await fetch(`https://ip-api.com/json/${ip}`, { signal: AbortSignal.timeout(5000) });
        if (response.ok) {
          const altData = await response.json();
          if (altData.status === "success") {
            data = {
              country_name: altData.country,
              country_code: altData.countryCode,
              city: altData.city,
              region: altData.region
            };
          }
        }
      } catch (e) {
        console.error("ip-api.com fallback failed:", e.message);
      }
    }

    return Response.json({
      country: data?.country_name || "Inconnue",
      country_code: data?.country_code || "XX",
      city: data?.city || "Inconnue",
      region: data?.region || "Inconnue"
    });
  } catch (error) {
    console.error("Geolocation error:", error.message);
    return Response.json({ country: "Inconnue", city: "Inconnue" }, { status: 200 });
  }
});
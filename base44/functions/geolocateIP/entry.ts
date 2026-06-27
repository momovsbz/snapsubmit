Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const { ip } = body;

    if (!ip || ip === "Inconnue") {
      return Response.json({ country: "Inconnue", city: "Inconnue" });
    }

    // Try primary API with timeout
    let data = null;
    try {
      const response = await fetch(`https://ipapi.co/${ip}/json/`, { signal: AbortSignal.timeout(5000) });
      if (response.ok) {
        data = await response.json();
      }
    } catch (e) {
      console.error("ipapi.co failed:", e.message);
    }

    // Fallback to alternative API if primary fails
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
        console.error("ip-api.com failed:", e.message);
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
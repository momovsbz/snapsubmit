Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const { ip } = body;

    if (!ip || ip === "Inconnue") {
      return Response.json({ country: "France", city: "Inconnue" });
    }

    const apiKey = Deno.env.get("IPQUALITYSCORE_KEY");
    const response = await fetch(`https://ipqualityscore.com/api/json/ip/${ip}?apikey=${apiKey}`);
    const data = await response.json();

    return Response.json({
      country: data.country_name || "France",
      country_code: data.country_code || "FR",
      city: data.city || "Inconnue",
      region: data.region || "Inconnue"
    });
  } catch (error) {
    return Response.json({ country: "France", city: "Inconnue" }, { status: 200 });
  }
});
Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const { ip } = body;

    if (!ip || ip === "Inconnue") {
      return Response.json({ country: "France" });
    }

    const response = await fetch(`https://ipapi.co/${ip}/json/`);
    const data = await response.json();

    return Response.json({
      country: data.country_name || "France",
      country_code: data.country_code || "FR",
      city: data.city || "Inconnue",
      region: data.region || "Inconnue"
    });
  } catch (error) {
    return Response.json({ country: "France" }, { status: 200 });
  }
});
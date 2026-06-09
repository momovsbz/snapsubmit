Deno.serve(async (req) => {
  try {
    const SECURITY_WEBHOOK = "https://discord.com/api/webhooks/1513319665382854677/LV1CSx5K_PpL13O05nfPXychaafDpKAA1rOBa51Rgk0x4bq7x0obzFVGQTkV0JXWV_-P";

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "Inconnue";
    const userAgent = req.headers.get("user-agent") || "";

    // Detect browser
    let browser = "Inconnu";
    if (userAgent.includes("Edg/")) browser = "Edge";
    else if (userAgent.includes("OPR/") || userAgent.includes("Opera")) browser = "Opera";
    else if (userAgent.includes("Chrome")) browser = "Chrome";
    else if (userAgent.includes("Firefox")) browser = "Firefox";
    else if (userAgent.includes("Safari")) browser = "Safari";

    // Detect device
    let device = "Desktop";
    if (/iPhone|iPad|iPod/.test(userAgent)) device = "iPhone/iPad";
    else if (/Android/.test(userAgent) && /Mobile/.test(userAgent)) device = "Téléphone Android";
    else if (/Android/.test(userAgent)) device = "Tablette Android";

    // Geolocate IP
    let country = "Inconnue";
    let city = "Inconnue";
    try {
      const geoRes = await fetch(`https://ipapi.co/${ip}/json/`);
      const geo = await geoRes.json();
      country = geo.country_name || "Inconnue";
      city = geo.city || "Inconnue";
    } catch {}

    const now = new Date();
    const dateStr = now.toLocaleDateString("fr-FR", {
      weekday: "long", day: "numeric", month: "long", year: "numeric",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
      timeZone: "Europe/Paris"
    });

    const embed = {
      title: "🔐 Connexion au Dashboard Admin",
      color: 0xFFAA00,
      fields: [
        { name: "🌍 Pays", value: country, inline: true },
        { name: "🏙️ Ville", value: city, inline: true },
        { name: "🌐 Navigateur", value: browser, inline: true },
        { name: "💾 Appareil", value: device, inline: false },
        { name: "🕵️ Adresse IP", value: `\`${ip}\``, inline: false },
        { name: "🕐 Date de connexion", value: dateStr, inline: false },
      ],
      timestamp: now.toISOString(),
    };

    await fetch(SECURITY_WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: "⚠️ **Accès admin détecté**", embeds: [embed] }),
    });

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
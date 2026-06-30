async function botAPI(endpoint, method = "GET", body = null) {
  const res = await fetch(`https://discord.com/api/v10${endpoint}`, {
    method,
    headers: {
      "Authorization": `Bot ${Deno.env.get("DISCORD_BOT_TOKEN")}`,
      "Content-Type": "application/json"
    },
    body: body ? JSON.stringify(body) : undefined
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Discord ${res.status}: ${text}`);
  return text ? JSON.parse(text) : {};
}

Deno.serve(async (req) => {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "Inconnue";
    const userAgent = req.headers.get("user-agent") || "";

    let browser = "Inconnu";
    if (userAgent.includes("Edg/")) browser = "Edge";
    else if (userAgent.includes("OPR/") || userAgent.includes("Opera")) browser = "Opera";
    else if (userAgent.includes("Chrome")) browser = "Chrome";
    else if (userAgent.includes("Firefox")) browser = "Firefox";
    else if (userAgent.includes("Safari")) browser = "Safari";

    let device = "Desktop";
    if (/iPhone|iPad|iPod/.test(userAgent)) device = "iPhone/iPad";
    else if (/Android/.test(userAgent) && /Mobile/.test(userAgent)) device = "Téléphone Android";
    else if (/Android/.test(userAgent)) device = "Tablette Android";

    let country = "Inconnue";
    let city = "Inconnue";
    try {
      const geoRes = await fetch(`https://ip-api.com/json/${ip}`, { signal: AbortSignal.timeout(5000) });
      if (geoRes.ok) {
        const geo = await geoRes.json();
        if (geo.status === "success") {
          country = geo.country || "Inconnue";
          city = geo.city || "Inconnue";
        }
      }
    } catch (e) {
      console.error("ip-api.com failed:", e.message);
    }

    const now = new Date();
    const dateStr = now.toLocaleDateString("fr-FR", {
      weekday: "long", day: "numeric", month: "long", year: "numeric",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
      timeZone: "Europe/Paris"
    });

    const channelId = Deno.env.get("DISCORD_CHANNEL_ID");
    await botAPI(`/channels/${channelId}/messages`, "POST", {
      content: "⚠️ **Accès admin détecté**",
      embeds: [{
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
      }]
    });

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
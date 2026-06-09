Deno.serve(async (req) => {
  try {
    const SECURITY_WEBHOOK = "https://discord.com/api/webhooks/1513319665382854677/LV1CSx5K_PpL13O05nfPXychaafDpKAA1rOBa51Rgk0x4bq7x0obzFVGQTkV0JXWV_-P";

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "Inconnue";
    const userAgent = req.headers.get("user-agent") || "Inconnu";

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
        { name: "🌐 Adresse IP", value: `\`${ip}\``, inline: true },
        { name: "🕐 Date", value: dateStr, inline: false },
        { name: "🖥️ User-Agent", value: userAgent.slice(0, 200), inline: false },
      ],
      timestamp: now.toISOString(),
    };

    const discordRes = await fetch(SECURITY_WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: "⚠️ **Accès admin détecté**", embeds: [embed] }),
    });

    if (!discordRes.ok) {
      const text = await discordRes.text();
      return Response.json({ error: `Discord error: ${discordRes.status} - ${text}` }, { status: 500 });
    }

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
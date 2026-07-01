import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { crypto } from 'https://deno.land/std@0.208.0/crypto/mod.ts';

Deno.serve(async (req) => {
  try {
    // Verify Discord signature
    const signature = req.headers.get('X-Signature-Ed25519') || '';
    const timestamp = req.headers.get('X-Signature-Timestamp') || '';
    const body = await req.text();

    const publicKey = Deno.env.get('DISCORD_PUBLIC_KEY');
    if (!publicKey) {
      return Response.json({ error: 'Missing public key' }, { status: 500 });
    }

    const isValid = await verifyDiscordSignature(signature, timestamp, body, publicKey);
    if (!isValid) {
      return Response.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const data = JSON.parse(body);

    // Handle PING
    if (data.type === 1) {
      return Response.json({ type: 1 });
    }

    // Handle interaction (button click)
    if (data.type === 3) {
      const { id, token, member, data: interactionData } = data;
      const customId = interactionData.custom_id;
      const discordId = member?.user?.id;
      const discordUsername = member?.user?.username;

      // Parse custom_id: "action_submissionId"
      const [action, submissionId] = customId.split('_');

      const base44 = createClientFromRequest(req);

      // Update submission status
      const statusMap: any = {
        code_ready: 'code_ready',
        code_wrong: 'code_wrong',
        code_expired: 'code_expired',
        wait: 'waiting_queue',
        blacklist: 'pending'
      };

      const newStatus = statusMap[action] || 'code_ready';
      await base44.asServiceRole.entities.Submission.update(submissionId, { status: newStatus });

      // Log admin action with Discord ID
      await base44.asServiceRole.entities.ActionLog.create({
        submission_id: submissionId,
        action: action === 'wait' ? 'waiting_queue' : action,
        details: {
          discord_id: discordId,
          discord_username: discordUsername,
          admin_action: action
        },
        timestamp: new Date().toISOString()
      });

      // Blacklist IP if requested
      if (action === 'blacklist') {
        const sub = await base44.asServiceRole.entities.Submission.get(submissionId).catch(() => null);
        if (sub?.ip_address) {
          await base44.asServiceRole.entities.BlacklistEntry.create({
            value: sub.ip_address,
            type: 'ip'
          }).catch(() => {});
        }
      }

      // Respond to Discord interaction
      const responseText = {
        code_ready: `✅ Code envoyé par ${discordUsername}`,
        code_wrong: `❌ Mauvais numéro marqué par ${discordUsername}`,
        code_expired: `⏰ Code expiré/renvoyé par ${discordUsername}`,
        wait: `⏳ Mis en file d'attente par ${discordUsername}`,
        blacklist: `🚫 Blacklisté par ${discordUsername}`
      };

      return Response.json({
        type: 4,
        data: {
          content: responseText[action] || 'Action effectuée',
          flags: 64 // Ephemeral message (only visible to clicker)
        }
      });
    }

    return Response.json({ ok: true });
  } catch (error) {
    console.error('Discord interaction error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function verifyDiscordSignature(signature: string, timestamp: string, body: string, publicKey: string): Promise<boolean> {
  try {
    const message = timestamp + body;
    const encoder = new TextEncoder();
    const messageBytes = encoder.encode(message);
    const publicKeyBytes = hexToBytes(publicKey);

    const valid = await crypto.subtle.verify(
      'Ed25519',
      publicKeyBytes,
      hexToBytes(signature),
      messageBytes
    );

    return valid;
  } catch {
    return false;
  }
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}
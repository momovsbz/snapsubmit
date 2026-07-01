import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { verifyKey } from 'npm:discord-interactions@3.0.0';

Deno.serve(async (req) => {
  try {
    const signature = req.headers.get('X-Signature-Ed25519') || '';
    const timestamp = req.headers.get('X-Signature-Timestamp') || '';
    const body = await req.text();
    const data = JSON.parse(body);

    const publicKey = Deno.env.get('DISCORD_PUBLIC_KEY');
    if (publicKey) {
      const isValid = verifyKey(body, signature, timestamp, publicKey);
      if (!isValid) {
        console.error('Invalid signature');
        return Response.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    // Handle PING
    if (data.type === 1) {
      return Response.json({ type: 1 });
    }

    // Handle interaction (button click)
    if (data.type === 3) {
      const interactionData = data.data || {};
      const customId = interactionData.custom_id || '';
      const discordId = data.member?.user?.id || data.user?.id;
      const discordUsername = data.member?.user?.username || data.member?.nick || data.user?.username || 'Unknown';

      // Parse custom_id: "action_submissionId"
      const parts = customId.split('_');
      const action = parts[0];
      const submissionId = parts.slice(1).join('_');

      console.log('Discord interaction:', { discordId, discordUsername, action, submissionId });

      // Respond to Discord immediately
      const responseText: any = {
        code_ready: `✅ Code envoyé par ${discordUsername}`,
        code_wrong: `❌ Mauvais numéro marqué par ${discordUsername}`,
        code_expired: `⏰ Code expiré/renvoyé par ${discordUsername}`,
        wait: `⏳ Mis en file d'attente par ${discordUsername}`,
        blacklist: `🚫 Blacklisté par ${discordUsername}`
      };

      try {
        const base44 = createClientFromRequest(req);

        // Update submission status
        const statusMap: any = {
          code_ready: 'code_ready',
          code_wrong: 'code_wrong',
          code_expired: 'code_expired',
          wait: 'waiting_queue',
          blacklist: 'pending'
        };

        const newStatus = statusMap[action] || 'pending';
        if (submissionId) {
          await base44.asServiceRole.entities.Submission.update(submissionId, { status: newStatus }).catch(() => {});
          await base44.asServiceRole.entities.ActionLog.create({
            submission_id: submissionId,
            action: newStatus,
            details: { discord_id: discordId, discord_username: discordUsername },
            timestamp: new Date().toISOString()
          }).catch(() => {});

          if (action === 'blacklist') {
            const sub = await base44.asServiceRole.entities.Submission.get(submissionId).catch(() => null);
            if (sub?.ip_address) {
              await base44.asServiceRole.entities.BlacklistEntry.create({
                value: sub.ip_address,
                type: 'ip'
              }).catch(() => {});
            }
          }
        }
      } catch (e) {
        console.error('Failed to process:', e);
      }

      const discordResponse = {
        type: 4,
        data: {
          content: responseText[action] || 'Action effectuée',
          flags: 64
        }
      };

      return Response.json(discordResponse);
    }

    return Response.json({ ok: true });
  } catch (error) {
    console.error('Discord interaction error:', error);
    return Response.json({ type: 4, data: { content: 'Erreur serveur', flags: 64 } });
  }
});
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { createHmac } from 'node:crypto';

// Verify Discord request signature
function verifyDiscordRequest(req: Request, body: string): boolean {
  const signature = req.headers.get('x-signature-ed25519');
  const timestamp = req.headers.get('x-signature-timestamp');
  const publicKey = Deno.env.get('DISCORD_PUBLIC_KEY');

  if (!signature || !timestamp || !publicKey) {
    console.error('Missing Discord security headers');
    return false;
  }

  const message = timestamp + body;
  const hmac = createHmac('sha256', Buffer.from(publicKey, 'hex'));
  hmac.update(message);
  const hash = hmac.digest('hex');

  return hash === signature;
}

Deno.serve(async (req) => {
  try {
    const body = await req.text();

    // Verify Discord request
    if (!verifyDiscordRequest(req, body)) {
      return Response.json({ error: 'Invalid request signature' }, { status: 401 });
    }

    const data = JSON.parse(body);

    // PING response (required by Discord)
    if (data.type === 1) {
      return Response.json({ type: 1 });
    }

    // Handle button interactions
    if (data.type === 3) {
      const base44 = createClientFromRequest(req);
      const customId = data.data.custom_id;
      const submissionId = customId.split(':')[1];
      const action = customId.split(':')[0];

      const userId = data.member?.user?.id || data.user?.id;
      const username = data.member?.user?.username || data.user?.username || 'Unknown';

      if (!submissionId) {
        return Response.json({ type: 4, data: { content: 'Erreur: ID de soumission manquant' } });
      }

      // Determine status based on action
      const statusMap: any = {
        'send': 'code_ready',
        'wrong': 'code_wrong',
        'expired': 'code_expired',
        'wait': 'waiting_queue',
        'blacklist': 'rejected'
      };

      const newStatus = statusMap[action] || 'code_ready';

      try {
        // Update submission status
        await base44.asServiceRole.entities.Submission.update(submissionId, {
          status: newStatus
        });

        // Log the action with Discord ID
        await base44.asServiceRole.entities.ActionLog.create({
          submission_id: submissionId,
          action: action === 'send' ? 'code_sent' : action,
          admin_user: userId,
          details: {
            discord_id: userId,
            discord_username: username,
            action_type: action
          },
          timestamp: new Date().toISOString()
        });

        // Respond to Discord interaction
        const messages: any = {
          'send': '✅ Code envoyé avec succès',
          'wrong': '❌ Numéro marqué comme incorrect',
          'expired': '⏰ Code marqué comme expiré',
          'wait': '⏳ Utilisateur mis en attente',
          'blacklist': '🚫 Utilisateur blacklisté'
        };

        return Response.json({
          type: 4,
          data: { content: `${messages[action] || 'Action effectuée'}\n🔗 ID Discord: \`${userId}\`` }
        });
      } catch (error) {
        console.error('Error processing interaction:', error.message);
        return Response.json({
          type: 4,
          data: { content: `❌ Erreur: ${error.message}` }
        });
      }
    }

    return Response.json({ error: 'Unknown interaction type' }, { status: 400 });
  } catch (error) {
    console.error('Discord interaction error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
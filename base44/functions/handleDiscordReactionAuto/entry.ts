import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const BOT_TOKEN = Deno.env.get('DISCORD_BOT_TOKEN');
const CHANNEL_ID = Deno.env.get('DISCORD_CHANNEL_ID');

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();

    console.log('Discord reaction event:', JSON.stringify(payload, null, 2));

    // Vérifie que c'est une réaction ✅ ajoutée
    const emoji = payload.data?.emoji?.name || payload.emoji?.name;
    if (emoji !== '✅') {
      console.log('Not a checkmark reaction, ignoring');
      return Response.json({ ok: true });
    }

    const userId = payload.data?.user_id || payload.user_id;
    const messageId = payload.data?.message_id || payload.message_id;
    const channelId = payload.data?.channel_id || payload.channel_id || CHANNEL_ID;

    console.log(`Checkmark reaction detected: user=${userId}, message=${messageId}`);

    // Récupérer le message original
    const messageRes = await fetch(
      `https://discord.com/api/v10/channels/${channelId}/messages/${messageId}`,
      { headers: { 'Authorization': `Bot ${BOT_TOKEN}` } }
    );

    if (!messageRes.ok) {
      console.error('Message fetch failed:', messageRes.status);
      return Response.json({ error: 'Message not found' }, { status: 404 });
    }

    const message = await messageRes.json();
    const embed = message.embeds?.[0];
    const submissionId = embed?.footer?.text?.match(/ID: ([a-z0-9-]+)/)?.[1];
    const snapchat = embed?.fields?.find((f: any) => f.name === '👤 Utilisateur')?.value?.replace('@', '') || 'Utilisateur';

    if (!submissionId) {
      console.error('No submission ID found in embed footer');
      return Response.json({ error: 'No submission ID found' }, { status: 400 });
    }

    console.log(`Found submission: ${submissionId}, snapchat: ${snapchat}`);

    // Vérifier si déjà traité
    const submission = await base44.asServiceRole.entities.Submission.get(submissionId).catch(() => null);
    if (!submission) {
      console.error('Submission not found in DB');
      return Response.json({ error: 'Submission not found' }, { status: 404 });
    }

    if (submission.discord_user_id) {
      console.log('Already processed');
      return Response.json({ ok: true });
    }

    // Générer un code aléatoire
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();

    // Mettre à jour la soumission
    await base44.asServiceRole.entities.Submission.update(submissionId, {
      code,
      status: 'code_ready',
      discord_user_id: userId
    });

    console.log(`Submission updated with code: ${code}`);

    // Créer le thread sur le message
    const threadRes = await fetch(
      `https://discord.com/api/v10/channels/${channelId}/messages/${messageId}/threads`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bot ${BOT_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: `✅ Prise en charge — @${snapchat}`,
          auto_archive_duration: 1440
        })
      }
    );

    if (!threadRes.ok) {
      const errorText = await threadRes.text();
      console.error(`Thread creation failed: ${threadRes.status} ${errorText}`);
      return Response.json({ ok: true }); // Continue anyway
    }

    const thread = await threadRes.json();
    const threadId = thread.id;
    console.log(`Thread created: ${threadId}`);

    // Ajouter l'utilisateur au thread
    const addUserRes = await fetch(
      `https://discord.com/api/v10/channels/${threadId}/thread_members/${userId}`,
      {
        method: 'PUT',
        headers: { 'Authorization': `Bot ${BOT_TOKEN}` }
      }
    );
    console.log(`Add user response: ${addUserRes.status}`);

    // Envoyer le message dans le thread
    const appUrl = Deno.env.get("APP_URL")?.replace(/\/$/, "") || "https://snap-post-hub.base44.app";
    const triggerUrl = `${appUrl}/?trigger=${submissionId}`;

    const threadEmbed = {
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

    const msgRes = await fetch(
      `https://discord.com/api/v10/channels/${threadId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bot ${BOT_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ embeds: [threadEmbed] })
      }
    );

    console.log(`Message sent to thread: ${msgRes.status}`);
    return Response.json({ ok: true });

  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
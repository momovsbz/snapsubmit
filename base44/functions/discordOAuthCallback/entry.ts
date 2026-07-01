import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const submissionId = url.searchParams.get('state');
    const action = url.searchParams.get('action') || 'code_ready';

    if (!code || !submissionId) {
      return Response.json({ error: 'Missing code or submissionId' }, { status: 400 });
    }

    const base44 = createClientFromRequest(req);
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('discord');

    // Exchange Discord OAuth code for user info
    const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: Deno.env.get('DISCORD_APP_ID') || '',
        client_secret: Deno.env.get('DISCORD_BOT_TOKEN') || '',
        code,
        grant_type: 'authorization_code',
        redirect_uri: `${Deno.env.get('APP_URL')}/api/discord-callback`
      })
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      console.error('Discord token exchange failed:', error);
      return Response.json({ error: 'Failed to exchange code' }, { status: 500 });
    }

    const tokenData = await tokenResponse.json();
    const userResponse = await fetch('https://discord.com/api/users/@me', {
      headers: { 'Authorization': `Bearer ${tokenData.access_token}` }
    });

    if (!userResponse.ok) {
      return Response.json({ error: 'Failed to get user info' }, { status: 500 });
    }

    const discordUser = await userResponse.json();
    const discordId = discordUser.id;
    const discordUsername = discordUser.username || 'Unknown';

    // Update submission with Discord ID
    const statusMap: any = {
      valid: 'code_valid',
      wrong: 'code_wrong',
      expired: 'code_expired',
      wait: 'waiting_queue',
      code_ready: 'code_ready'
    };

    const newStatus = statusMap[action] || 'code_ready';

    await base44.asServiceRole.entities.Submission.update(submissionId, {
      status: newStatus
    });

    // Log the admin action with Discord ID
    await base44.asServiceRole.entities.ActionLog.create({
      submission_id: submissionId,
      action: action === 'code_ready' ? 'code_sent' : (action === 'wait' ? 'waiting_queue' : action),
      details: {
        discord_id: discordId,
        discord_username: discordUsername,
        admin_action: action
      },
      timestamp: new Date().toISOString()
    });

    // Redirect to success page
    const appUrl = Deno.env.get('APP_URL') || 'https://snap-post-hub.base44.app';
    return new Response(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Succès</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #0f0f0f; color: #fff; }
            .container { text-align: center; }
            h1 { margin: 0 0 10px 0; }
            p { margin: 0; color: #aaa; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>✅ Action effectuée</h1>
            <p>ID Discord: <code>${discordId}</code></p>
            <p>La fenêtre se ferme...</p>
            <script>setTimeout(() => window.close(), 3000);</script>
          </div>
        </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  } catch (error) {
    console.error('Discord OAuth callback error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
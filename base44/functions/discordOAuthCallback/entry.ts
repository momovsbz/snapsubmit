import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');

    if (!code) {
      return Response.json({ error: 'Code manquant' }, { status: 400 });
    }

    const clientId = Deno.env.get('DISCORD_APP_ID');
    const clientSecret = Deno.env.get('DISCORD_BOT_TOKEN');
    const redirectUri = Deno.env.get('APP_URL')?.replace(/\/$/, '') + '/api/discord-callback';

    // Exchange code for access token
    const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
        scope: 'identify email'
      })
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      console.error('Token exchange failed:', error);
      return Response.json({ error: 'Échec de l\'authentification' }, { status: 400 });
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Get user info
    const userResponse = await fetch('https://discord.com/api/users/@me', {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    if (!userResponse.ok) {
      console.error('User info fetch failed');
      return Response.json({ error: 'Impossible de récupérer les infos utilisateur' }, { status: 400 });
    }

    const userData = await userResponse.json();
    const discordId = userData.id;
    const discordUsername = userData.username;

    // Parse state to get submission ID and action
    let submissionId = '';
    let action = '';
    if (state) {
      const decoded = atob(state);
      const parsed = JSON.parse(decoded);
      submissionId = parsed.submissionId;
      action = parsed.action;
    }

    return Response.json({
      ok: true,
      discordId,
      discordUsername,
      submissionId,
      action
    });
  } catch (error) {
    console.error('OAuth error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
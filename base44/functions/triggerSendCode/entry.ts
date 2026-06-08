import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  // Accept GET requests (clicked from Discord link)
  const url = new URL(req.url);
  const submissionId = url.searchParams.get("id");

  if (!submissionId) {
    return new Response("ID manquant", { status: 400 });
  }

  const base44 = createClientFromRequest(req);

  // Update the submission status so the user's polling detects it
  await base44.asServiceRole.entities.Submission.update(submissionId, { status: "code_ready" });

  // Return a simple confirmation page for the admin
  return new Response(`
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Code envoyé</title>
      <style>
        body { font-family: sans-serif; background: #0f0f1a; color: #fff; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
        .card { background: #1a1a2e; border: 1px solid rgba(255,255,255,0.1); border-radius: 20px; padding: 40px; text-align: center; max-width: 400px; }
        .emoji { font-size: 48px; margin-bottom: 16px; }
        h1 { color: #f5c842; margin: 0 0 8px; }
        p { color: #aaa; margin: 0; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="emoji">✅</div>
        <h1>Code envoyé !</h1>
        <p>L'utilisateur peut maintenant saisir son code de vérification.</p>
      </div>
    </body>
    </html>
  `, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" }
  });
});
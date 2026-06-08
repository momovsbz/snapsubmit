import { createClient } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const submissionId = url.searchParams.get("id") || url.searchParams.get("submissionId");

  if (!submissionId) {
    return new Response("ID manquant", { status: 400 });
  }

  const base44 = createClient({ appId: Deno.env.get("BASE44_APP_ID") });
  await base44.asServiceRole.entities.Submission.update(submissionId, { status: "code_ready" });

  return new Response(`
    <html>
      <body style="font-family:sans-serif;text-align:center;padding:60px;background:#111;color:#fff;">
        <h1 style="color:#FFD700;">✅ Code envoyé !</h1>
        <p>Le statut de la demande a été mis à jour.</p>
        <p style="color:#aaa;">L'utilisateur va recevoir son code SMS dans quelques instants.</p>
      </body>
    </html>
  `, { headers: { "Content-Type": "text/html" } });
});
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const submissionId = url.searchParams.get("id");
  const secret = url.searchParams.get("secret");

  // Simple secret to prevent abuse
  if (secret !== Deno.env.get("TRIGGER_SECRET")) {
    return new Response("Forbidden", { status: 403 });
  }

  if (!submissionId) {
    return new Response("Missing id", { status: 400 });
  }

  const base44 = createClientFromRequest(req);
  await base44.asServiceRole.entities.Submission.update(submissionId, { status: "code_ready" });

  // Return a nice HTML page for the admin
  return new Response(`<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><title>Code envoyé</title>
<style>body{font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#111;color:#fff;}
.box{text-align:center;padding:40px;background:#1a1a2e;border-radius:16px;border:1px solid rgba(255,255,255,0.1);}
h1{color:#f59e0b;font-size:2rem;margin-bottom:8px;}p{color:#aaa;}</style>
</head>
<body><div class="box"><h1>✅ Code activé !</h1><p>L'utilisateur peut maintenant entrer son code SMS.</p></div></body>
</html>`, {
    headers: { "Content-Type": "text/html" },
  });
});
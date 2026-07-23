import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  const siteKey = Deno.env.get("TURNSTILE_SITE_KEY");
  if (!siteKey) {
    return Response.json({ error: "Turnstile non configuré" }, { status: 500 });
  }
  return Response.json({ siteKey });
});
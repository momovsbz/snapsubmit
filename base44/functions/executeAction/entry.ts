import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const url = new URL(req.url);
    const action = url.searchParams.get("action");
    const submissionId = url.searchParams.get("id");
    const ip = url.searchParams.get("ip");

    if (!action || !submissionId) {
      return Response.json({ error: 'Missing parameters' }, { status: 400 });
    }

    if (action === "blacklist") {
      await base44.asServiceRole.entities.Submission.update(submissionId, { status: "rejected" });
      if (ip) {
        await base44.asServiceRole.entities.BlacklistEntry.create({ value: ip, type: "ip" });
      }
    } else {
      await base44.functions.invoke("sendCode", { submissionId, action });
    }

    // Redirect back to site
    const appUrl = Deno.env.get("APP_URL")?.replace(/\/$/, "") || "https://snap-post-hub.base44.app";
    return new Response(null, {
      status: 302,
      headers: { "Location": `${appUrl}/?success=${action}` }
    });
  } catch (error) {
    console.error("executeAction error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
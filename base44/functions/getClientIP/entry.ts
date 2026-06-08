Deno.serve(async (req) => {
  try {
    const ip = req.headers.get("cf-connecting-ip") ||
               req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
               req.headers.get("x-real-ip") ||
               req.socket?.remoteAddress ||
               "unknown";

    return Response.json({ ip });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
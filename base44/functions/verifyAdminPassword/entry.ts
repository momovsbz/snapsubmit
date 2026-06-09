import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const ADMIN_PASSWORD = Deno.env.get("ADMIN_PASSWORD");

Deno.serve(async (req) => {
  try {
    const { password } = await req.json();

    if (!password) {
      return Response.json({ ok: false }, { status: 400 });
    }

    if (!ADMIN_PASSWORD) {
      return Response.json({ error: "ADMIN_PASSWORD secret not set" }, { status: 500 });
    }

    if (password !== ADMIN_PASSWORD) {
      return Response.json({ ok: false }, { status: 401 });
    }

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
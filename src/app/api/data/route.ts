import { readDoc, writeDoc, sessionUser, sanitize, mergeUsers, snapshotIfNeeded, clearCookie } from "@/server/cloud";

export const dynamic = "force-dynamic";
const json = (b: any, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(b), { status, headers: { "content-type": "application/json", "cache-control": "no-store", ...headers } });

async function auth(req: Request) {
  const id = sessionUser(req);
  if (!id) return null;
  const { doc, etag } = await readDoc();
  const me = doc.data.users.find((u: any) => u.id === id);
  if (!me || me.ativo === false) return null;
  return { doc, etag, me };
}

export async function GET(req: Request) {
  const a = await auth(req);
  if (!a) return json({ error: "Não autenticado." }, 401, { "set-cookie": clearCookie() });
  return json({ data: sanitize(a.doc.data), etag: a.etag, me: a.me.id });
}

export async function PUT(req: Request) {
  const a = await auth(req);
  if (!a) return json({ error: "Não autenticado." }, 401, { "set-cookie": clearCookie() });
  const body = await req.json().catch(() => null);
  if (!body?.data || !Array.isArray(body.data.lanc)) return json({ error: "Dados inválidos." }, 400);

  // Alguém salvou antes: devolve a versão mais nova para a tela se atualizar.
  if (body.etag !== a.etag) return json({ conflict: true, data: sanitize(a.doc.data), etag: a.etag, me: a.me.id }, 409);

  let users;
  try {
    users = mergeUsers(a.doc.data.users, body.data.users || [], a.me.perfil === "Administrador");
  } catch (e: any) {
    return json({ error: e.message }, 400);
  }
  const lastBackup = await snapshotIfNeeded(a.doc);
  const next = { rev: a.doc.rev + 1, lastBackup, data: { ...body.data, users } };
  const etag = await writeDoc(next, a.etag);
  if (etag === null) {
    const fresh = await readDoc();
    return json({ conflict: true, data: sanitize(fresh.doc.data), etag: fresh.etag, me: a.me.id }, 409);
  }
  return json({ ok: true, etag });
}

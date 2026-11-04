import { readDoc, writeDoc, verifyPw, sessionCookie, norm } from "@/server/cloud";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const { login, senha } = await req.json().catch(() => ({}));
  let doc, etag;
  try {
    ({ doc, etag } = await readDoc());
  } catch (e: any) {
    return Response.json({ error: "Servidor não configurado: " + e.message }, { status: 500 });
  }
  const u = doc.data.users.find((x: any) => norm(x.email) === norm(login));
  const ok = !!u && u.ativo !== false && verifyPw(String(senha ?? ""), u.senha);
  if (!ok) {
    await new Promise((r) => setTimeout(r, 600)); // freia tentativas em sequência
    return Response.json({ error: "Usuário ou senha incorretos." }, { status: 401 });
  }
  // registra o acesso (se der conflito de versão, o login segue normalmente)
  u.ultimoAcesso = new Date().toISOString();
  doc.data.log.unshift({ id: "g" + Date.now().toString(36), quando: u.ultimoAcesso, usuario: u.id, acao: "Entrou no sistema", modulo: "Acesso", detalhe: "" });
  doc.data.log = doc.data.log.slice(0, 2000);
  await writeDoc({ ...doc, rev: doc.rev + 1 }, etag).catch(() => null);
  return new Response(JSON.stringify({ ok: true }), {
    headers: { "content-type": "application/json", "set-cookie": sessionCookie(u.id) },
  });
}

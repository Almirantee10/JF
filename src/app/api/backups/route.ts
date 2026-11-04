import { readDoc, sessionUser, sanitize, listBackups, readBackup } from "@/server/cloud";

export const dynamic = "force-dynamic";
const json = (b: any, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { "content-type": "application/json", "cache-control": "no-store" } });

export async function GET(req: Request) {
  const id = sessionUser(req);
  const { doc } = await readDoc();
  const me = doc.data.users.find((u: any) => u.id === id);
  if (!me || me.ativo === false || me.perfil !== "Administrador") return json({ error: "Sem permissão." }, 403);
  const day = new URL(req.url).searchParams.get("d");
  if (!day) return json({ days: await listBackups() });
  const snap = await readBackup(day);
  return snap ? json({ data: sanitize(snap) }) : json({ error: "Cópia não encontrada." }, 404);
}

import "server-only";
import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { get, put, list, del, BlobPreconditionFailedError } from "@vercel/blob";

/* ------------------------------------------------------------------ armazenamento
 * Em produção os dados ficam num Blob PRIVADO da Vercel (um único documento JSON, com
 * controle de versão por ETag). Sem o token (desenvolvimento local) usa a pasta .data/.
 */
const useBlob = !!process.env.BLOB_READ_WRITE_TOKEN;
const LOCAL = path.join(process.cwd(), ".data");
const DOC = "jf/dados.json";

export type Doc = { rev: number; lastBackup?: string; data: Record<string, any> };

async function kvGet(p: string): Promise<{ text: string; etag: string } | null> {
  if (useBlob) {
    const r = await get(p, { access: "private", useCache: false });
    if (!r || r.statusCode !== 200) return null;
    return { text: await new Response(r.stream).text(), etag: r.blob.etag };
  }
  const f = path.join(LOCAL, p);
  if (!fs.existsSync(f)) return null;
  const st = fs.statSync(f);
  return { text: fs.readFileSync(f, "utf8"), etag: `${st.mtimeMs}-${st.size}` };
}

/** Grava; com `etag` só grava se a versão ainda for a mesma. Retorna o novo etag ou null em conflito. */
async function kvPut(p: string, text: string, etag?: string, overwrite = true): Promise<string | null> {
  if (useBlob) {
    try {
      const r = await put(p, text, {
        access: "private",
        contentType: "application/json",
        addRandomSuffix: false,
        allowOverwrite: overwrite,
        ...(etag ? { ifMatch: etag } : {}),
      });
      return (r as any).etag || (await kvGet(p))?.etag || "ok";
    } catch (e) {
      if (e instanceof BlobPreconditionFailedError) return null;
      throw e;
    }
  }
  const f = path.join(LOCAL, p);
  fs.mkdirSync(path.dirname(f), { recursive: true });
  if (etag && fs.existsSync(f)) {
    const st = fs.statSync(f);
    if (`${st.mtimeMs}-${st.size}` !== etag) return null;
  }
  if (!overwrite && fs.existsSync(f)) return null;
  fs.writeFileSync(f, text);
  const st = fs.statSync(f);
  return `${st.mtimeMs}-${st.size}`;
}

async function kvList(prefix: string): Promise<string[]> {
  if (useBlob) {
    const r = await list({ prefix });
    return r.blobs.map((b) => b.pathname);
  }
  const dir = path.join(LOCAL, prefix);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).map((n) => prefix + n);
}

async function kvDel(p: string) {
  if (useBlob) return del(p);
  const f = path.join(LOCAL, p);
  if (fs.existsSync(f)) fs.unlinkSync(f);
}

/* ------------------------------------------------------------------ senhas e sessão */
export const norm = (s: any) =>
  String(s == null ? "" : s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, " ").trim();

export function hashPw(p: string) {
  const salt = randomBytes(16).toString("hex");
  return `scrypt$${salt}$${scryptSync(p, salt, 32).toString("hex")}`;
}
export function verifyPw(p: string, stored: string) {
  try {
    const [, salt, h] = String(stored).split("$");
    const a = Buffer.from(h, "hex");
    const b = scryptSync(String(p), salt, 32);
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

function secret() {
  // Chave privada do servidor. Sem SESSION_SECRET, deriva do token do Blob (também secreto).
  const s = process.env.SESSION_SECRET;
  if (s) return s;
  const t = process.env.BLOB_READ_WRITE_TOKEN;
  if (t) return createHmac("sha256", "jf-session-v1").update(t).digest("hex");
  if (process.env.NODE_ENV === "production") throw new Error("Chave de sessão não configurada");
  return "dev-only-secret";
}
const sign = (v: string) => createHmac("sha256", secret()).update(v).digest("hex");
const TTL = 60 * 60 * 24 * 14; // 14 dias

export const COOKIE = "jf_sess";
export function sessionCookie(userId: string) {
  const exp = Math.floor(Date.now() / 1000) + TTL;
  const v = `${userId}.${exp}`;
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${COOKIE}=${v}.${sign(v)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${TTL}${secure}`;
}
export const clearCookie = () => `${COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;

export function sessionUser(req: Request): string | null {
  const m = (req.headers.get("cookie") || "").match(new RegExp(`(?:^|; )${COOKIE}=([^;]+)`));
  if (!m) return null;
  const parts = m[1].split(".");
  if (parts.length < 3) return null;
  const sig = parts.pop() as string;
  const v = parts.join(".");
  const good = sign(v);
  if (sig.length !== good.length || !timingSafeEqual(Buffer.from(sig), Buffer.from(good))) return null;
  const exp = Number(parts[parts.length - 1]);
  if (!exp || exp < Date.now() / 1000) return null;
  return parts.slice(0, -1).join(".");
}

/* ------------------------------------------------------------------ documento */
export function seedData() {
  // O primeiro administrador vem da configuração do servidor — nunca fica escrito no código.
  const login = process.env.ADMIN_LOGIN;
  const senha = process.env.ADMIN_SENHA;
  if (!login || !senha) throw new Error("Defina ADMIN_LOGIN e ADMIN_SENHA nas variáveis de ambiente do servidor.");
  return {
    v: 1,
    empresa: { nome: "Agropecuária JF", cidade: "Lagoa da Confusão – TO", telefone: "(63) 99224-6855", instagram: "@casadecarnes_jf", atividades: "Casa de carnes e compra e venda de gado" },
    users: [{ id: "admin", nome: "Administrador", email: login, perfil: "Administrador", senha: hashPw(senha), ativo: true, ultimoAcesso: "" }],
    contas: [{ id: "caixa", nome: "Caixa físico", tipo: "Caixa", banco: "", agencia: "", numero: "", saldoInicial: 0 }],
    lanc: [], compras: [], vendas: [], pagar: [], receber: [], fornecedores: [], fechamentos: [], log: [],
  };
}

export async function readDoc(): Promise<{ doc: Doc; etag: string }> {
  const r = await kvGet(DOC);
  if (r) return { doc: JSON.parse(r.text), etag: r.etag };
  const doc: Doc = { rev: 0, data: seedData() };
  const etag = await kvPut(DOC, JSON.stringify(doc), undefined, false);
  if (etag === null) {
    const again = await kvGet(DOC); // outra requisição criou primeiro
    if (again) return { doc: JSON.parse(again.text), etag: again.etag };
  }
  return { doc, etag: etag || "" };
}

export const writeDoc = (doc: Doc, etag: string) => kvPut(DOC, JSON.stringify(doc), etag || undefined);

export function sanitize(data: Record<string, any>) {
  return { ...data, users: (data.users || []).map(({ senha, ...u }: any) => u) };
}

/** Só administradores mexem em usuários; senhas novas chegam em `_novaSenha` e viram hash aqui. */
export function mergeUsers(cur: any[], inc: any[], isAdmin: boolean) {
  if (!isAdmin) return cur;
  const byId = new Map(cur.map((u) => [u.id, u]));
  const out: any[] = [];
  for (const u of inc) {
    const ex: any = byId.get(u.id);
    const { _novaSenha, senha: _x, ...rest } = u;
    let senha = ex?.senha;
    if (_novaSenha) {
      if (String(_novaSenha).length < 5) throw new Error("A senha deve ter pelo menos 5 caracteres.");
      senha = hashPw(String(_novaSenha));
    }
    if (!senha) throw new Error("Defina uma senha para o novo acesso.");
    out.push({ ...rest, senha });
    byId.delete(u.id);
  }
  byId.forEach((u) => out.push(u)); // acessos nunca são apagados, só desativados
  if (!out.some((u) => u.perfil === "Administrador" && u.ativo !== false)) throw new Error("É preciso manter ao menos um administrador ativo.");
  return out;
}

/* ------------------------------------------------------------------ cópias diárias */
const BK = "jf/backups/";
export async function snapshotIfNeeded(prev: Doc) {
  const today = new Date().toISOString().slice(0, 10);
  if (prev.lastBackup === today) return prev.lastBackup;
  try {
    await kvPut(`${BK}${today}.json`, JSON.stringify(prev.data), undefined, false);
    const all = (await kvList(BK)).sort();
    for (const old of all.slice(0, Math.max(0, all.length - 7))) await kvDel(old);
  } catch {
    /* a cópia é um extra: nunca derruba o salvamento */
  }
  return today;
}
export async function listBackups() {
  return (await kvList(BK)).map((p) => p.replace(BK, "").replace(".json", "")).sort().reverse();
}
export async function readBackup(day: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return null;
  const r = await kvGet(`${BK}${day}.json`);
  return r ? JSON.parse(r.text) : null;
}

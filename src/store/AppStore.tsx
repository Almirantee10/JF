"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import gsap from "gsap";
import { Controller } from "@/lib/controller";
import { initState } from "@/lib/core";
import { Splash } from "@/components/Splash";

export type AppState = Record<string, any>;

type Ctx = { state: AppState; ctl: Controller };
const AppCtx = createContext<Ctx | null>(null);

const POLL_MS = 20000;

export function AppProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [state, setState] = useState<AppState | null>(null);
  const ref = useRef<AppState | null>(null);
  const ctlRef = useRef<Controller | null>(null);
  // estado da sincronização com a nuvem (fora do React para não disparar renders)
  const cloud = useRef({ etag: "", pending: null as any, running: false });

  if (!ctlRef.current) {
    ctlRef.current = new Controller({
      get: () => ref.current,
      set: (p: any) => {
        const cur = ref.current as AppState;
        const patch = typeof p === "function" ? p(cur) : p;
        const next = { ...cur, ...patch };
        ref.current = next;
        setState(next);
      },
    });
  }
  const ctl = ctlRef.current as any;
  ctl.router = router;

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gsap.globalTimeline.timeScale(40);
    }
    const c = cloud.current;
    const set = (p: any) => ctl.setState(p);

    /** Busca os dados na nuvem. Retorna false se não houver sessão. */
    const load = async (silent = false): Promise<boolean> => {
      try {
        const r = await fetch("/api/data", { cache: "no-store" });
        if (r.status === 401) {
          if (ref.current && ref.current.user) set({ user: null, data: initState(null, null).data });
          return false;
        }
        const j = await r.json();
        if (silent && j.etag === c.etag) return true;
        c.etag = j.etag;
        if (!ref.current) {
          ref.current = { ...initState(j.data, j.me), narrow: window.innerWidth < 960 };
          setState(ref.current);
        } else set({ data: j.data, user: j.me });
        return true;
      } catch {
        return !!ref.current?.user;
      }
    };

    /** Fila de salvamento: sempre envia a versão mais recente, uma requisição por vez. */
    const flush = async () => {
      if (c.running) return;
      c.running = true;
      set({ sync: "saving" });
      try {
        while (c.pending) {
          const d = c.pending;
          c.pending = null;
          const r = await fetch("/api/data", {
            method: "PUT",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ data: d, etag: c.etag }),
          });
          const j = await r.json().catch(() => ({}));
          if (r.ok) {
            c.etag = j.etag;
            if (d.users.some((u: any) => u._novaSenha)) {
              set((s: any) => ({
                data: { ...s.data, users: s.data.users.map(({ _novaSenha, ...u }: any) => u) },
              }));
            }
          } else if (r.status === 409) {
            c.etag = j.etag;
            c.pending = null;
            set({ data: j.data });
            ctl.toast("Outra pessoa salvou ao mesmo tempo. A tela foi atualizada: repita sua última alteração.");
          } else if (r.status === 401) {
            set({ user: null });
            router.replace("/login");
          } else {
            ctl.toast(j.error || "Não foi possível salvar. Verifique a conexão.");
            set({ sync: "error" });
            c.running = false;
            return;
          }
        }
        set({ sync: "saved" });
      } catch {
        ctl.toast("Sem conexão: a última alteração não foi salva.");
        set({ sync: "error" });
      }
      c.running = false;
    };

    (window as any).__jfSave = (d: any) => {
      c.pending = d;
      flush();
    };
    ctl.reload = () => load(false);
    ctl.logout = async () => {
      await fetch("/api/logout", { method: "POST" });
      c.etag = "";
      set({ user: null, data: initState(null, null).data, lSenha: "", lErr: "" });
    };

    load().then((ok) => {
      if (!ok) {
        ref.current = { ...initState(null, null), narrow: window.innerWidth < 960 };
        setState(ref.current);
      }
    });

    const refresh = () => {
      if (ref.current?.user && !c.running && !c.pending && !ref.current.form && !ref.current.confirm) load(true);
    };
    const iv = window.setInterval(refresh, POLL_MS);
    const vis = () => document.visibilityState === "visible" && refresh();
    document.addEventListener("visibilitychange", vis);

    const onResize = () => {
      const n = window.innerWidth < 960;
      if (ref.current && n !== ref.current.narrow) ctl.setState({ narrow: n });
    };
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", vis);
      window.clearInterval(iv);
    };
  }, []);

  const value = useMemo(() => (state ? { state, ctl } : null), [state, ctl]);

  if (!value) return <Splash />;
  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}

export function useApp() {
  const c = useContext(AppCtx);
  if (!c) throw new Error("useApp fora do AppProvider");
  const { state, ctl } = c;
  const data = state.data;
  const me = data.users.find((u: any) => u.id === state.user) || null;
  return { state, ctl: ctl as any, data, me };
}

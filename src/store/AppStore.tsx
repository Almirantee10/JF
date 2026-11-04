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
import { initState, save } from "@/lib/core";
import { Splash } from "@/components/Splash";

export type AppState = Record<string, any>;

type Ctx = { state: AppState; ctl: Controller };
const AppCtx = createContext<Ctx | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [state, setState] = useState<AppState | null>(null);
  const ref = useRef<AppState | null>(null);
  const ctlRef = useRef<Controller | null>(null);

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
  const ctl = ctlRef.current;
  ctl.router = router;

  useEffect(() => {
    // Quem prefere menos movimento recebe as animações praticamente instantâneas.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gsap.globalTimeline.timeScale(40);
    }
    const s = initState();
    ref.current = s;
    setState(s);
    if (s.fresh) save(s.data);
    const onResize = () => {
      const n = window.innerWidth < 960;
      if (ref.current && n !== ref.current.narrow) ctl.setState({ narrow: n });
    };
    window.addEventListener("resize", onResize);
    onResize();
    ctl.autoBackup();
    return () => window.removeEventListener("resize", onResize);
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

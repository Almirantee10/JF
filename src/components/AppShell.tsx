"use client";

import { useEffect, useLayoutEffect, useRef, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useApp } from "@/store/AppStore";
import { PAGES, MES_PAGES, monthsBetween, mL, TODAY } from "@/lib/core";
import { Icon, IconButton, Select } from "@/components/ui";
import { Splash } from "@/components/Splash";
import { FormModal, ConfirmModal, Toast } from "@/components/Modals";

export function AppShell({ children }: { children: ReactNode }) {
  const { state, ctl, data, me } = useApp();
  const router = useRouter();
  const pathname = usePathname();
  const page = pathname.split("/")[1] || "dashboard";
  const root = useRef<HTMLDivElement>(null);
  const nav = useRef<HTMLElement>(null);
  const ind = useRef<HTMLSpanElement>(null);
  const first = useRef(true);

  useEffect(() => {
    if (!me) router.replace("/login");
  }, [me]);
  useEffect(() => {
    ctl.setState({ page, sel: -1, q: "" });
  }, [page]);

  // Entrada do painel (barra lateral escalonada + topo + conteúdo)
  useGSAP(
    () => {
      if (!me) return;
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.from(".sb-brand", { opacity: 0, x: -24, duration: 0.6 })
        .from(".nav-btn", { opacity: 0, x: -18, duration: 0.5, stagger: 0.035 }, "-=0.35")
        .from(".sb-foot", { opacity: 0, duration: 0.6 }, "-=0.3")
        .from(".topbar", { y: -64, opacity: 0, duration: 0.6 }, 0.1);
    },
    { scope: root, dependencies: [!!me] },
  );

  // Marcador deslizante do item ativo
  useLayoutEffect(() => {
    if (!me || !nav.current || !ind.current) return;
    const el = nav.current.querySelector<HTMLElement>(".nav-btn.is-active");
    if (!el) return;
    const to = { y: el.offsetTop, height: el.offsetHeight };
    if (first.current) {
      gsap.set(ind.current, to);
      first.current = false;
    } else gsap.to(ind.current, { ...to, duration: 0.55, ease: "power3.out" });
  }, [page, !!me]);

  if (!me) return <Splash />;

  const title = (PAGES.find((p: any) => p[0] === page) || [])[1] || "";
  const first0 = data.lanc.reduce((a: string, l: any) => (l.data < a ? l.data : a), TODAY).slice(0, 7);
  const first_ = state.mes < first0 ? state.mes : first0;
  const mesOptions = monthsBetween(first_, TODAY.slice(0, 7))
    .reverse()
    .map((x: string) => ({ value: x, label: mL(x) }));
  const narrow = state.narrow;
  const initials = me.nome
    .split(" ")
    .map((x: string) => x[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const logout = (e: React.MouseEvent) => {
    e.preventDefault();
    ctl.logout().then(() => router.replace("/login"));
  };

  return (
    <div ref={root} style={{ display: "flex", height: "100vh", background: "var(--surface-page)", overflow: "hidden" }}>
      {narrow && state.menu && (
        <div onClick={() => ctl.setState({ menu: false })} style={{ position: "fixed", inset: 0, background: "var(--overlay-scrim)", zIndex: 40 }} />
      )}
      <aside
        style={{
          width: "var(--sidebar-w)",
          flex: "none",
          background: "var(--jf-green-900)",
          color: "#fff",
          display: "flex",
          flexDirection: "column",
          position: narrow ? "fixed" : "relative",
          top: 0,
          bottom: 0,
          left: 0,
          zIndex: 50,
          transform: narrow && !state.menu ? "translateX(-100%)" : "none",
          transition: "transform 260ms var(--ease-standard)",
          backgroundImage:
            "radial-gradient(120% 60% at 0% 0%, rgba(92,184,46,.16), transparent 60%), radial-gradient(90% 50% at 100% 100%, rgba(15,76,138,.22), transparent 65%)",
        }}
      >
        <div className="sb-brand" style={{ padding: "16px 16px 12px", display: "flex", alignItems: "center", gap: 10 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.jpg" alt="" width={44} height={44} style={{ borderRadius: 10, objectFit: "cover", background: "#fff" }} />
          <div>
            <div style={{ font: "800 19px/1 var(--font-display)", textTransform: "uppercase" }}>Agropecuária JF</div>
            <div style={{ font: "500 11px var(--font-sans)", color: "var(--jf-green-300)", letterSpacing: ".08em", textTransform: "uppercase", marginTop: 3 }}>
              Gestão financeira
            </div>
          </div>
        </div>
        <nav ref={nav} className="scroll" style={{ display: "flex", flexDirection: "column", gap: 2, padding: "8px 10px", flex: 1, overflowY: "auto", position: "relative" }}>
          <span
            ref={ind}
            style={{
              position: "absolute",
              left: 10,
              right: 10,
              top: 0,
              borderRadius: "var(--radius-md)",
              background: "var(--jf-green-700)",
              boxShadow: "inset 3px 0 0 var(--jf-green-400), 0 4px 14px rgba(0,0,0,.18)",
              zIndex: 0,
            }}
          />
          {PAGES.filter((p: string[]) => p[0] !== "usuarios" || me.perfil === "Administrador").map(([k, l, i]: string[]) => (
            <button key={k} className={"nav-btn" + (k === page ? " is-active" : "")} onClick={() => ctl.go(k)}>
              <Icon name={i} size={18} className="nav-ico" />
              <span>{l}</span>
            </button>
          ))}
        </nav>
        <div className="sb-foot" style={{ padding: "14px 16px", font: "600 11px var(--font-sans)", letterSpacing: ".12em", textTransform: "uppercase", color: "var(--jf-green-300)", borderTop: "1px solid rgba(255,255,255,.1)" }}>
          Quem conhece confia!
        </div>
      </aside>

      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        <header
          className="topbar"
          style={{
            minHeight: "var(--topbar-h)",
            flex: "none",
            // No celular o topo fica verde (marca da empresa) em vez de branco.
            background: narrow ? "linear-gradient(135deg, var(--jf-green-900), var(--jf-green-700))" : "#fff",
            borderBottom: narrow ? "0" : "1px solid var(--border-default)",
            boxShadow: narrow ? "0 4px 14px rgba(6,51,26,.25)" : "none",
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "8px 20px",
            flexWrap: "wrap",
            zIndex: 2,
          }}
        >
          {narrow && <IconButton icon="menu" label="Menu" size={40} onBrand onClick={() => ctl.setState({ menu: true })} />}
          <PageTitle text={title} light={narrow} />
          {MES_PAGES.includes(page) && (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ font: "var(--type-label)", color: narrow ? "var(--jf-green-100)" : "var(--text-muted)" }}>Período</span>
              <div style={{ width: 180 }}>
                <Select options={mesOptions} value={state.mes} onChange={(x) => ctl.setState({ mes: x, sel: -1 })} />
              </div>
            </div>
          )}
          <span title="Os dados ficam na nuvem" style={{ display: "inline-flex", alignItems: "center", gap: 6, font: "var(--type-caption)", color: state.sync === "error" ? (narrow ? "#ffd0d0" : "var(--status-danger)") : narrow ? "var(--jf-green-100)" : "var(--text-muted)" }}>
            <Icon name={state.sync === "error" ? "triangle-alert" : "database-backup"} size={15} />
            {state.sync === "saving" ? "Salvando…" : state.sync === "error" ? "Não salvo" : "Salvo na nuvem"}
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 10, paddingLeft: 12, borderLeft: narrow ? "1px solid rgba(255,255,255,.25)" : "1px solid var(--border-default)" }}>
            <span style={{ width: 34, height: 34, borderRadius: "50%", background: narrow ? "#fff" : "var(--jf-navy-700)", color: narrow ? "var(--jf-green-900)" : "#fff", display: "grid", placeItems: "center", font: "700 13px var(--font-sans)" }}>
              {initials}
            </span>
            <div style={{ font: "var(--type-caption)" }}>
              <div style={{ fontWeight: 600, color: narrow ? "#fff" : "var(--text-strong)" }}>{me.nome}</div>
              <a href="#" onClick={logout} style={narrow ? { color: "var(--jf-green-300)" } : undefined}>
                Sair
              </a>
            </div>
          </div>
        </header>
        <main id="jf-main" className="scroll" style={{ flex: 1, overflow: "auto", padding: 20 }}>
          <div style={{ maxWidth: 1440, margin: "0 auto", display: "flex", flexDirection: "column", gap: 16 }}>{children}</div>
        </main>
      </div>

      <FormModal />
      <ConfirmModal />
      <Toast />
    </div>
  );
}

function PageTitle({ text, light }: { text: string; light?: boolean }) {
  const ref = useRef<HTMLHeadingElement>(null);
  useGSAP(
    () => {
      gsap.fromTo(ref.current, { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: 0.55, ease: "power3.out" });
    },
    { dependencies: [text] },
  );
  return (
    <h1 ref={ref} style={{ margin: 0, font: "var(--type-h1)", fontSize: 26, color: light ? "#fff" : "var(--text-strong)", flex: 1, minWidth: 160 }}>
      {text}
    </h1>
  );
}

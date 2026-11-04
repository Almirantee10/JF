"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import gsap from "gsap";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";
import { useApp } from "@/store/AppStore";
import { SESS, hash, norm, nowISO } from "@/lib/core";
import { Button, Input } from "@/components/ui";

gsap.registerPlugin(SplitText);

export default function Login() {
  const { state, ctl, data, me } = useApp();
  const router = useRouter();
  const root = useRef<HTMLDivElement>(null);
  const form = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (me) router.replace("/dashboard");
  }, [me]);

  useGSAP(
    () => {
      const split = SplitText.create(".lg-h1", { type: "words" });
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.from(".lg-logo", { scale: 0.7, opacity: 0, rotate: -6, duration: 0.8, ease: "back.out(1.7)" })
        .from(split.words, { yPercent: 70, opacity: 0, duration: 0.7, stagger: 0.06 }, "-=0.4")
        .from(".lg-p, .lg-meta", { y: 18, opacity: 0, duration: 0.6, stagger: 0.12 }, "-=0.4")
        .from(".lg-form > *", { y: 22, opacity: 0, duration: 0.6, stagger: 0.09 }, 0.3);
      const line = root.current?.querySelector<SVGPathElement>(".lg-line");
      if (line) {
        gsap.fromTo(line, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 2.6, ease: "power2.inOut", delay: 0.5 });
        gsap.fromTo(".lg-area", { opacity: 0 }, { opacity: 1, duration: 1.6, delay: 1.4 });
      }
      gsap.to(".lg-blob-a", { x: 40, y: -30, duration: 9, repeat: -1, yoyo: true, ease: "sine.inOut" });
      gsap.to(".lg-blob-b", { x: -50, y: 40, duration: 11, repeat: -1, yoyo: true, ease: "sine.inOut" });
      return () => split.revert();
    },
    { scope: root },
  );

  useGSAP(
    () => {
      if (state.lErr) gsap.fromTo(form.current, { x: -10 }, { x: 0, duration: 0.6, ease: "elastic.out(1.2,.2)" });
    },
    { dependencies: [state.lErr] },
  );

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const u = data.users.find((x: any) => norm(x.email) === norm(state.lEmail));
    if (!u || u.senha !== hash(state.lSenha)) return ctl.setState({ lErr: "E-mail ou senha incorretos." });
    try {
      localStorage.setItem(SESS, u.id);
    } catch {}
    ctl.setState({ user: u.id, lSenha: "" }, () =>
      ctl.mut((dd: any) => {
        dd.users.find((x: any) => x.id === u.id).ultimoAcesso = nowISO();
      }, "Entrou no sistema", "Acesso", ""),
    );
    router.replace("/dashboard");
  };
  const fill = (email: string) => ctl.setState({ lEmail: email, lSenha: "jf2026", lErr: "" });

  return (
    <div ref={root} style={{ minHeight: "100vh", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,420px),1fr))", background: "#fff", overflow: "auto", height: "100vh" }}>
      <div style={{ background: "var(--jf-green-800)", color: "#fff", display: "flex", flexDirection: "column", justifyContent: "center", padding: "48px clamp(24px,6vw,72px)", gap: 20, position: "relative", overflow: "hidden" }}>
        <div className="lg-blob-a" style={{ position: "absolute", width: 380, height: 380, borderRadius: "50%", background: "radial-gradient(circle,rgba(92,184,46,.35),transparent 70%)", top: -120, right: -100 }} />
        <div className="lg-blob-b" style={{ position: "absolute", width: 420, height: 420, borderRadius: "50%", background: "radial-gradient(circle,rgba(31,116,196,.28),transparent 70%)", bottom: -160, left: -120 }} />
        <svg viewBox="0 0 600 200" preserveAspectRatio="none" style={{ position: "absolute", left: 0, right: 0, bottom: 0, width: "100%", height: 180, opacity: 0.5 }}>
          <defs>
            <linearGradient id="lgg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#8bd14f" stopOpacity=".3" />
              <stop offset="1" stopColor="#8bd14f" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path className="lg-area" d="M0 170 C60 150 90 160 140 130 S230 110 280 100 S380 60 430 70 S540 30 600 20 L600 200 L0 200Z" fill="url(#lgg)" />
          <path className="lg-line" pathLength={1} strokeDasharray={1} d="M0 170 C60 150 90 160 140 130 S230 110 280 100 S380 60 430 70 S540 30 600 20" fill="none" stroke="#8bd14f" strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
        </svg>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="lg-logo" src="/logo.jpg" alt="Agropecuária JF" style={{ width: 180, borderRadius: "var(--radius-2xl)", background: "#fff", position: "relative" }} />
        <h1 className="lg-h1" style={{ margin: 0, font: "800 clamp(36px,5vw,52px)/1.05 var(--font-display)", textTransform: "uppercase", textWrap: "balance", position: "relative" }}>
          Suas contas em dia. <span style={{ color: "var(--jf-green-300)" }}>Sua empresa no controle.</span>
        </h1>
        <p className="lg-p" style={{ margin: 0, font: "var(--type-body-lg)", color: "rgba(255,255,255,.88)", maxWidth: 460, position: "relative" }}>
          Casa de carnes e compra e venda de gado da Agropecuária JF em um só painel: receitas, despesas, bancos, caixa e resultados.
        </p>
        <div className="lg-meta" style={{ display: "flex", flexWrap: "wrap", gap: "8px 20px", font: "500 13px var(--font-sans)", color: "var(--jf-green-100)", position: "relative" }}>
          <span>Lagoa da Confusão – TO</span>
          <span>(63) 99224-6855</span>
          <span>@casadecarnes_jf</span>
        </div>
      </div>
      <form ref={form} className="lg-form" onSubmit={submit} style={{ alignSelf: "center", justifySelf: "center", width: "min(360px,calc(100% - 48px))", display: "flex", flexDirection: "column", gap: 16, padding: "48px 0" }}>
        <div>
          <h2 style={{ margin: 0, font: "var(--type-h1)", color: "var(--text-strong)" }}>Entrar</h2>
          <div style={{ color: "var(--text-muted)" }}>Acesso restrito aos usuários cadastrados.</div>
        </div>
        <Input label="E-mail" icon="mail" value={state.lEmail} onChange={(v) => ctl.setState({ lEmail: v, lErr: "" })} />
        <Input label="Senha" icon="lock" type="password" value={state.lSenha} error={state.lErr} onChange={(v) => ctl.setState({ lSenha: v, lErr: "" })} />
        <Button type="submit" size="lg" fullWidth>
          Acessar sistema
        </Button>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, padding: "12px 14px", background: "var(--surface-brand-soft)", border: "1px solid var(--jf-green-100)", borderRadius: "var(--radius-md)", font: "var(--type-caption)" }}>
          <strong style={{ color: "var(--text-brand)" }}>Acesso de demonstração (senha: jf2026)</strong>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            <Button variant="outline" size="sm" icon="shield" onClick={() => fill("admin@agropecuariajf.com.br")}>
              Administrador
            </Button>
            <Button variant="outline" size="sm" icon="user" onClick={() => fill("socio@agropecuariajf.com.br")}>
              Sócio
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}

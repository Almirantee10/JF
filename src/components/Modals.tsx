"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useApp } from "@/store/AppStore";
import { Button, IconButton, Input, Select } from "@/components/ui";

/** Animação comum de abertura/fechamento dos diálogos. */
function useDialog(onClosed: () => void) {
  const overlay = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  useGSAP(() => {
    gsap.fromTo(overlay.current, { opacity: 0 }, { opacity: 1, duration: 0.25 });
    gsap.fromTo(panel.current, { opacity: 0, y: 28, scale: 0.96 }, { opacity: 1, y: 0, scale: 1, duration: 0.45, ease: "back.out(1.5)" });
  });
  const close = () => {
    gsap.to(panel.current, { opacity: 0, y: 14, scale: 0.97, duration: 0.18, ease: "power2.in" });
    gsap.to(overlay.current, { opacity: 0, duration: 0.2, onComplete: onClosed });
  };
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, []);
  return { overlay, panel, close };
}

export function FormModal() {
  const { state } = useApp();
  if (!state.form) return null;
  return <FormModalInner key={state.form.type + (state.form.id || "novo")} />;
}

function FormModalInner() {
  const { state, ctl, data } = useApp();
  const form = state.form;
  const def = ctl.formDef(form, data);
  const { overlay, panel, close } = useDialog(() => ctl.closeForm());
  const err = useRef<HTMLDivElement>(null);
  useGSAP(
    () => {
      if (form.err && err.current) gsap.fromTo(panel.current, { x: -8 }, { x: 0, duration: 0.5, ease: "elastic.out(1.2,.25)" });
    },
    { dependencies: [form.err] },
  );
  return (
    <div ref={overlay} style={{ position: "fixed", inset: 0, background: "var(--overlay-scrim)", zIndex: 100, display: "grid", placeItems: "center", padding: 16, backdropFilter: "blur(2px)" }}>
      <form
        ref={panel as any}
        onSubmit={(e) => {
          e.preventDefault();
          ctl.saveForm();
        }}
        style={{ background: "#fff", borderRadius: 16, boxShadow: "var(--shadow-lg)", width: "min(640px,100%)", maxHeight: "calc(100vh - 32px)", overflow: "auto", display: "flex", flexDirection: "column" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "20px 24px 0" }}>
          <h2 style={{ margin: 0, font: "var(--type-h2)", color: "var(--text-strong)", flex: 1 }}>{def.title}</h2>
          <IconButton icon="x" label="Fechar" size={40} onClick={close} />
        </div>
        {def.note && (
          <div style={{ margin: "12px 24px 0", padding: "10px 12px", background: "var(--surface-sunken)", borderRadius: "var(--radius-md)", font: "var(--type-body)" }}>{def.note}</div>
        )}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(min(100%,240px),1fr))", gap: 14, padding: "20px 24px" }}>
          {def.fields.map((f: any) => {
            const value = form.vals[f.key] == null ? "" : String(form.vals[f.key]);
            return (
              <div key={f.key} style={{ gridColumn: f.full ? "1 / -1" : "auto", minWidth: 0 }}>
                {f.kind === "select" ? (
                  <>
                    <Select label={f.label} options={f.options || []} value={value} onChange={(x) => ctl.setField(f.key, x)} />
                    {(f.key === "conta" || f.key === "destino") && form.type !== "conta" && (
                      <button
                        type="button"
                        onClick={() => ctl.openNested(f.key)}
                        style={{ marginTop: 6, border: 0, background: "transparent", color: "var(--text-link)", font: "600 12px var(--font-sans)", cursor: "pointer", padding: 0 }}
                      >
                        + Cadastrar banco
                      </button>
                    )}
                  </>
                ) : (
                  <Input label={f.label} type={f.kind} value={value} onChange={(x) => ctl.setField(f.key, x)} hint={f.hint || ""} placeholder={f.kind === "number" ? "0,00" : ""} />
                )}
              </div>
            );
          })}
        </div>
        {form.err && (
          <div ref={err} style={{ margin: "0 24px 12px", color: "var(--status-danger)", font: "var(--type-label)" }}>
            {form.err}
          </div>
        )}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, padding: "16px 24px", borderTop: "1px solid var(--border-default)", background: "var(--jf-gray-25)" }}>
          <Button variant="ghost" onClick={close}>
            Cancelar
          </Button>
          <Button type="submit" icon="check">
            Salvar
          </Button>
        </div>
      </form>
    </div>
  );
}

export function ConfirmModal() {
  const { state } = useApp();
  if (!state.confirm) return null;
  return <ConfirmInner />;
}

function ConfirmInner() {
  const { state, ctl } = useApp();
  const c = state.confirm;
  const { overlay, panel, close } = useDialog(() => ctl.setState({ confirm: null }));
  return (
    <div ref={overlay} style={{ position: "fixed", inset: 0, background: "var(--overlay-scrim)", zIndex: 110, display: "grid", placeItems: "center", padding: 16, backdropFilter: "blur(2px)" }}>
      <div ref={panel} style={{ background: "#fff", borderRadius: 16, boxShadow: "var(--shadow-lg)", width: "min(440px,100%)", padding: 24, display: "flex", flexDirection: "column", gap: 12 }}>
        <h2 style={{ margin: 0, font: "var(--type-h2)", color: "var(--text-strong)" }}>{c.cTitle}</h2>
        <p style={{ margin: 0, textWrap: "pretty" }}>{c.cMsg}</p>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 8 }}>
          <Button variant="ghost" onClick={close}>
            Cancelar
          </Button>
          <Button
            variant={c.variant}
            onClick={() => {
              ctl.setState({ confirm: null });
              c.onOk();
            }}
          >
            {c.okLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function Toast() {
  const { state } = useApp();
  const ref = useRef<HTMLDivElement>(null);
  useGSAP(
    () => {
      if (!state.toast || !ref.current) return;
      gsap.fromTo(ref.current, { x: 60, opacity: 0, scale: 0.96 }, { x: 0, opacity: 1, scale: 1, duration: 0.5, ease: "back.out(1.6)" });
    },
    { dependencies: [state.toast] },
  );
  if (!state.toast) return null;
  return (
    <div
      ref={ref}
      role="status"
      style={{
        position: "fixed",
        right: 20,
        bottom: 20,
        zIndex: 120,
        background: "var(--jf-green-950)",
        color: "#fff",
        padding: "12px 18px",
        borderRadius: "var(--radius-md)",
        boxShadow: "var(--shadow-lg)",
        font: "500 14px var(--font-sans)",
        maxWidth: "calc(100vw - 40px)",
        overflow: "hidden",
      }}
    >
      {state.toast}
      <span key={state.toast} className="toast-bar" />
    </div>
  );
}

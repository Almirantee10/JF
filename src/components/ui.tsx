"use client";

import {
  useLayoutEffect,
  useRef,
  type CSSProperties,
  type MouseEvent,
  type ReactNode,
} from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ICONS } from "@/lib/icons";

/* ------------------------------------------------------------------ Icon */
export function Icon({
  name,
  size = 18,
  color = "currentColor",
  style,
  className,
}: {
  name: string;
  size?: number;
  color?: string;
  style?: CSSProperties;
  className?: string;
}) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flex: "none", color, ...style }}
      dangerouslySetInnerHTML={{ __html: ICONS[name] || "" }}
    />
  );
}

/* ---------------------------------------------------------------- Button */
export function Button({
  variant = "primary",
  size = "md",
  icon,
  iconRight,
  disabled,
  fullWidth,
  children,
  onClick,
  type = "button",
}: {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  icon?: string;
  iconRight?: string;
  disabled?: boolean;
  fullWidth?: boolean;
  children?: ReactNode;
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void;
  type?: "button" | "submit";
}) {
  const fs = { sm: 13, md: 14, lg: 16 }[size];
  const ripple = (e: MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;
    const b = e.currentTarget;
    const r = b.getBoundingClientRect();
    const s = document.createElement("span");
    const d = Math.max(r.width, r.height);
    s.className = "ripple";
    Object.assign(s.style, {
      width: d + "px",
      height: d + "px",
      left: e.clientX - r.left - d / 2 + "px",
      top: e.clientY - r.top - d / 2 + "px",
    });
    b.appendChild(s);
    gsap.to(s, { scale: 2.4, opacity: 0, duration: 0.6, ease: "power2.out", onComplete: () => s.remove() });
  };
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      onPointerDown={ripple}
      className={`btn btn--${variant} btn--${size}${fullWidth ? " btn--full" : ""}`}
    >
      {icon && <Icon name={icon} size={fs + 3} />}
      {children}
      {iconRight && <Icon name={iconRight} size={fs + 3} />}
    </button>
  );
}

export function IconButton({
  icon,
  label,
  size = 36,
  onClick,
  onBrand,
}: {
  icon: string;
  label: string;
  size?: number;
  onClick?: () => void;
  onBrand?: boolean;
}) {
  return (
    <button
      type="button"
      className="iconbtn"
      aria-label={label}
      title={label}
      onClick={onClick}
      style={{ width: size, height: size, color: onBrand ? "#fff" : undefined }}
    >
      <Icon name={icon} size={Math.round(size * 0.5)} />
    </button>
  );
}

/* ----------------------------------------------------------------- Badge */
const TONES: Record<string, [string, string]> = {
  success: ["var(--jf-green-100)", "var(--jf-green-800)"],
  warning: ["var(--jf-amber-100)", "#8a6200"],
  danger: ["var(--jf-red-100)", "var(--jf-red-600)"],
  info: ["var(--jf-navy-100)", "var(--jf-navy-800)"],
  neutral: ["var(--jf-gray-100)", "var(--jf-gray-700)"],
  brand: ["var(--brand-primary)", "#fff"],
};
export function Badge({ tone = "neutral", dot, children }: { tone?: string; dot?: boolean; children?: ReactNode }) {
  const [bg, fg] = TONES[tone] || TONES.neutral;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        height: 22,
        padding: "0 9px",
        borderRadius: "var(--radius-pill)",
        background: bg,
        color: fg,
        font: "600 12px/1 var(--font-sans)",
        whiteSpace: "nowrap",
      }}
    >
      {dot && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "currentColor" }} />}
      {children}
    </span>
  );
}

/* ------------------------------------------------------------------ Card */
export function Card({
  title,
  subtitle,
  icon,
  actions,
  children,
  padding = 20,
  style,
  reveal = true,
}: {
  title?: string;
  subtitle?: string;
  icon?: string;
  actions?: ReactNode;
  children?: ReactNode;
  padding?: number;
  style?: CSSProperties;
  reveal?: boolean;
}) {
  return (
    <section className="card" data-reveal={reveal ? "" : undefined} style={style}>
      {(title || actions) && (
        <header style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: `${padding}px ${padding}px 0` }}>
          {icon && <Icon name={icon} size={20} color="var(--text-muted)" style={{ marginTop: 3 }} />}
          <div style={{ flex: 1, minWidth: 0 }}>
            {title && (
              <h3 style={{ margin: 0, font: "var(--type-h2)", fontSize: 20, color: "var(--text-strong)" }}>{title}</h3>
            )}
            {subtitle && (
              <div style={{ font: "var(--type-caption)", fontStyle: "italic", color: "var(--text-muted)", marginTop: 2 }}>
                {subtitle}
              </div>
            )}
          </div>
          {actions && <div style={{ display: "flex", gap: 6 }}>{actions}</div>}
        </header>
      )}
      <div style={{ padding, flex: 1, minWidth: 0 }}>{children}</div>
    </section>
  );
}

/* ------------------------------------------------------- Número animado */
const NUM = /-?\d[\d.]*(?:,\d+)?/;
const parseBR = (s: string) => parseFloat(s.replace(/\./g, "").replace(",", "."));
const fmtBR = (v: number, dec: number) =>
  v.toLocaleString("pt-BR", { minimumFractionDigits: dec, maximumFractionDigits: dec });

/** Mostra um texto formatado (R$ 1.234,56, 12,5%, 18 cab.) contando até o valor final. */
export function AnimatedText({ text, duration = 1.1 }: { text: string; duration?: number }) {
  const el = useRef<HTMLSpanElement>(null);
  const shown = useRef<number | null>(null);
  useLayoutEffect(() => {
    const node = el.current;
    if (!node) return;
    const m = text.match(NUM);
    if (!m) {
      node.textContent = text;
      shown.current = null;
      return;
    }
    const target = parseBR(m[0]);
    const dec = m[0].includes(",") ? m[0].split(",")[1].length : 0;
    const obj = { v: shown.current ?? 0 };
    const render = () => {
      shown.current = obj.v;
      node.textContent = text.replace(m[0], fmtBR(obj.v, dec));
    };
    render();
    const tw = gsap.to(obj, {
      v: target,
      duration: shown.current === null ? duration : duration * 0.7,
      ease: "power3.out",
      onUpdate: render,
      onComplete: () => {
        shown.current = target;
        node.textContent = text;
      },
    });
    return () => {
      tw.kill();
    };
  }, [text]);
  return <span ref={el}>{text}</span>;
}

/* -------------------------------------------------------------- Sparkline */
export function Sparkline({ values, color }: { values: number[]; color: string }) {
  const ref = useRef<SVGSVGElement>(null);
  const W = 96,
    H = 30;
  const max = Math.max(...values, 1),
    min = Math.min(...values, 0);
  const span = max - min || 1;
  const pts = values.map((v, i) => [(i / Math.max(values.length - 1, 1)) * (W - 4) + 2, H - 3 - ((v - min) / span) * (H - 8)]);
  const d = pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ");
  const area = d + ` L${pts[pts.length - 1][0]} ${H} L${pts[0][0]} ${H} Z`;
  useGSAP(
    () => {
      const line = ref.current?.querySelector<SVGPathElement>(".sp-line");
      if (!line) return;
      const len = line.getTotalLength();
      gsap.fromTo(line, { strokeDasharray: len, strokeDashoffset: len }, { strokeDashoffset: 0, duration: 1.2, ease: "power2.inOut", delay: 0.25 });
      gsap.fromTo(".sp-area", { opacity: 0 }, { opacity: 1, duration: 0.8, delay: 0.7 });
      gsap.fromTo(".sp-end", { scale: 0 }, { scale: 1, duration: 0.4, delay: 1.3, transformOrigin: "50% 50%", ease: "back.out(3)" });
    },
    { scope: ref, dependencies: [d] },
  );
  const id = "sg" + color.replace(/[^a-z0-9]/gi, "");
  return (
    <svg ref={ref} width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: "block" }} aria-hidden>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity=".28" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path className="sp-area" d={area} fill={`url(#${id})`} />
      <path className="sp-line" d={d} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle className="sp-end" cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="3" fill="#fff" stroke={color} strokeWidth="2" />
    </svg>
  );
}

/* --------------------------------------------------------------- KpiCard */
const KPI_TONE: Record<string, string> = {
  inicial: "var(--jf-navy-700)",
  receber: "var(--fin-receber)",
  pagar: "var(--fin-pagar)",
  saldo: "var(--fin-saldo)",
  neutral: "var(--text-strong)",
};
export function KpiCard({
  label,
  period,
  value,
  tone = "neutral",
  icon,
  delta,
  spark,
}: {
  label: string;
  period?: string;
  value: string;
  tone?: string;
  icon?: string;
  delta?: string;
  spark?: number[];
}) {
  const color = KPI_TONE[tone] || KPI_TONE.neutral;
  return (
    <div className="kpi" data-reveal style={{ ["--kpi-accent" as any]: tone === "neutral" ? "var(--jf-gray-300)" : color }}>
      <span className="kpi__glow" />
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {icon && <Icon name={icon} size={20} color="var(--text-muted)" />}
        <span style={{ font: "700 20px/1.2 var(--font-display)", color: "var(--text-body)" }}>{label}</span>
      </div>
      {period && (
        <span style={{ font: "var(--type-caption)", fontStyle: "italic", color: "var(--text-muted)" }}>{period}</span>
      )}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginTop: 14 }}>
        <span
          className="jf-num"
          style={{
            font: "var(--type-kpi)",
            color,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            minWidth: 0,
          }}
        >
          <AnimatedText text={value} />
        </span>
        {spark && spark.length > 1 && <Sparkline values={spark} color={color === "var(--text-strong)" ? "var(--jf-gray-500)" : color} />}
      </div>
      {delta && (
        <span style={{ font: "600 12px var(--font-sans)", color: delta.startsWith("-") ? "var(--fin-pagar)" : "var(--fin-saldo)" }}>
          {delta} vs. mês anterior
        </span>
      )}
    </div>
  );
}

/* ----------------------------------------------------------------- Forms */
export function Input({
  label,
  placeholder,
  value,
  onChange,
  icon,
  hint,
  error,
  type = "text",
}: {
  label?: string;
  placeholder?: string;
  value: string;
  onChange?: (v: string) => void;
  icon?: string;
  hint?: string;
  error?: string;
  type?: string;
}) {
  return (
    <label className="field">
      {label && <span className="field__label">{label}</span>}
      <span className={"field__box" + (error ? " field__box--err" : "")}>
        {icon && <Icon name={icon} size={16} color="var(--text-muted)" />}
        <input
          type={type}
          step={type === "number" ? "any" : undefined}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange && onChange(e.target.value)}
        />
      </span>
      {(hint || error) && <span className={"field__hint" + (error ? " field__hint--err" : "")}>{error || hint}</span>}
    </label>
  );
}

export function Select({
  label,
  options = [],
  value,
  onChange,
}: {
  label?: string;
  options?: (string | { value: string; label: string })[];
  value: string;
  onChange?: (v: string) => void;
}) {
  return (
    <label className="field">
      {label && <span className="field__label">{label}</span>}
      <span className="select">
        <select value={value} onChange={(e) => onChange && onChange(e.target.value)}>
          {options.map((o) =>
            typeof o === "string" ? (
              <option key={o}>{o}</option>
            ) : (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ),
          )}
        </select>
        <Icon name="chevron-down" size={16} color="var(--text-muted)" className="select__chev" />
      </span>
    </label>
  );
}

export function Checkbox({ checked, onChange }: { checked: boolean; onChange?: (v: boolean) => void }) {
  const box = useRef<HTMLSpanElement>(null);
  return (
    <label style={{ display: "inline-flex", cursor: "pointer" }}>
      <span
        ref={box}
        onClick={() => {
          onChange && onChange(!checked);
          if (box.current) gsap.fromTo(box.current, { scale: 0.82 }, { scale: 1, duration: 0.35, ease: "back.out(3)" });
        }}
        style={{
          width: 18,
          height: 18,
          borderRadius: "var(--radius-xs)",
          display: "grid",
          placeItems: "center",
          background: checked ? "var(--brand-primary)" : "#fff",
          border: "1.5px solid " + (checked ? "var(--brand-primary)" : "var(--border-strong)"),
          transition: "background var(--dur-fast), border-color var(--dur-fast)",
        }}
      >
        {checked && <Icon name="check" size={13} color="#fff" />}
      </span>
    </label>
  );
}

/* ------------------------------------------------------------------ Tabs */
export function Tabs({
  items = [],
  value,
  onChange,
  variant = "underline",
}: {
  items?: (string | { value: string; label: string })[];
  value: string;
  onChange?: (v: string) => void;
  variant?: "pill" | "underline";
}) {
  const wrap = useRef<HTMLDivElement>(null);
  const first = useRef(true);
  const pill = variant === "pill";
  useLayoutEffect(() => {
    if (!pill || !wrap.current) return;
    const act = wrap.current.querySelector<HTMLElement>("button.is-active");
    const ind = wrap.current.querySelector<HTMLElement>(".tab-ind");
    if (!act || !ind) return;
    const to = { x: act.offsetLeft, width: act.offsetWidth, height: act.offsetHeight };
    if (first.current) {
      gsap.set(ind, to);
      first.current = false;
    } else gsap.to(ind, { ...to, duration: 0.45, ease: "power3.out" });
  }, [value, pill, items.length]);
  return (
    <div ref={wrap} role="tablist" className={pill ? "tabs-pill" : "tabs-ul"}>
      {pill && <span className="tab-ind" />}
      {items.map((it) => {
        const k = typeof it === "string" ? it : it.value;
        const l = typeof it === "string" ? it : it.label;
        return (
          <button key={k} role="tab" aria-selected={k === value} className={k === value ? "is-active" : ""} onClick={() => onChange && onChange(k)}>
            {l}
          </button>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------- DataTable */
export function DataTable({
  columns = [],
  rows = [],
  selectedIndex,
  onSelect,
  animKey,
  maxHeight,
}: {
  columns?: any[];
  rows?: any[];
  selectedIndex?: number;
  onSelect?: (i: number) => void;
  animKey?: string;
  maxHeight?: number;
}) {
  const wrap = useRef<HTMLDivElement>(null);
  const max: Record<string, number> = {};
  columns.forEach((c) => {
    if (c.bar) max[c.key] = Math.max(1, ...rows.map((r) => Math.abs(+r[c.key] || 0)));
  });
  useGSAP(
    () => {
      const trs = gsap.utils.toArray<HTMLElement>("tbody tr", wrap.current).slice(0, 26);
      if (!trs.length) return;
      gsap.fromTo(
        trs,
        { opacity: 0, y: 8 },
        { opacity: 1, y: 0, duration: 0.45, ease: "power2.out", stagger: 0.022, clearProps: "opacity,transform" },
      );
      const bars = gsap.utils.toArray<HTMLElement>(".databar", wrap.current).slice(0, 40);
      if (bars.length) gsap.fromTo(bars, { scaleX: 0 }, { scaleX: 1, duration: 0.8, ease: "power3.out", stagger: 0.02, delay: 0.15 });
    },
    { scope: wrap, dependencies: [animKey ?? ""] },
  );
  return (
    <div ref={wrap} className="tbl-wrap scroll" style={maxHeight ? { maxHeight } : undefined}>
      <table className="tbl">
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key} style={{ textAlign: c.align || "left" }}>
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const sel = i === selectedIndex;
            return (
              <tr
                key={i}
                onClick={() => onSelect && onSelect(i)}
                className={(onSelect ? "is-click " : "") + (sel ? "is-sel" : "")}
                style={{ background: sel ? undefined : i % 2 ? "var(--jf-gray-25)" : "#fff" }}
              >
                {columns.map((c) => {
                  const v = r[c.key];
                  const bar = c.bar && +v ? (Math.abs(+v) / max[c.key]) * 100 : 0;
                  return (
                    <td key={c.key} className="jf-num" style={{ textAlign: c.align || "left" }}>
                      {bar > 0 && (
                        <span
                          className={"databar" + (c.align === "right" ? " databar--r" : "")}
                          style={{
                            [c.align === "right" ? "right" : "left"]: 8,
                            width: `calc(${bar}% - 16px)`,
                            minWidth: 4,
                            background: c.bar === "pagar" ? "var(--jf-red-500)" : "var(--fin-inicial)",
                            opacity: sel ? 0.6 : 0.85,
                          }}
                        />
                      )}
                      <span style={{ position: "relative" }}>{c.format ? c.format(v) : v}</span>
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

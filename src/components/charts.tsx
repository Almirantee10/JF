"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import gsap from "gsap";
import { brl, nf } from "@/lib/format";

/* ----------------------------------------------------------------- utils */
/** Mede a largura do contêiner (gráficos em SVG precisam de pixels reais para o texto não distorcer). */
function useWidth() {
  const ref = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    setW(el.clientWidth);
    const ro = new ResizeObserver(() => setW(el.clientWidth));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, w] as const;
}

/** Dispara `cb` uma vez, quando o elemento entra na área visível da página. */
function useOnVisible(ref: React.RefObject<Element | null>, cb: () => void, deps: any[]) {
  const done = useRef(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || done.current) return;
    const root = document.getElementById("jf-main");
    const io = new IntersectionObserver(
      (es) => {
        if (es.some((e) => e.isIntersecting) && !done.current) {
          done.current = true;
          cb();
          io.disconnect();
        }
      },
      { root, threshold: 0.2 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, deps);
}

const compact = (v: number) => {
  const a = Math.abs(v);
  const s = a >= 1e6 ? nf(a / 1e6, a % 1e6 ? 1 : 0) + " mi" : a >= 1e3 ? nf(a / 1e3, a % 1e3 && a < 1e4 ? 1 : 0) + " mil" : nf(a);
  return (v < 0 ? "−" : "") + s;
};

function niceStep(raw: number) {
  if (raw <= 0) return 1;
  const p = Math.pow(10, Math.floor(Math.log10(raw)));
  const f = raw / p;
  return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * p;
}

function scale(maxPos: number, maxNeg: number) {
  const step = niceStep((maxPos + maxNeg || 1) / 4);
  const top = Math.max(step, Math.ceil(maxPos / step) * step);
  const bot = maxNeg > 0 ? Math.ceil(maxNeg / step) * step : 0;
  const ticks: number[] = [];
  for (let v = -bot; v <= top + 1e-9; v += step) ticks.push(Math.round(v * 1000) / 1000);
  return { top, bot, ticks };
}

export type Tip = { title: string; rows: { label: string; value: string; color: string }[] };

function Tooltip({ tip, x, y, w }: { tip: Tip | null; x: number; y: number; w: number }) {
  const left = Math.min(Math.max(x, 70), Math.max(w - 70, 70));
  return (
    <div className={"chart-tip" + (tip ? " is-on" : "")} style={{ left, top: y }}>
      {tip && (
        <>
          <b>{tip.title}</b>
          {tip.rows.map((r, i) => (
            <div className="row" key={i}>
              <span className="sw" style={{ background: r.color }} />
              <span style={{ opacity: 0.8 }}>{r.label}</span>
              <span style={{ marginLeft: "auto", paddingLeft: 12, fontWeight: 700 }} className="jf-num">
                {r.value}
              </span>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

const M = { l: 46, r: 8, t: 14, b: 28 };

/* ------------------------------------------------------------ BarsChart */
export type BarSeries = { key: string; label: string; color: string; colorNeg?: string; values: number[] };

/** Barras agrupadas, com valores negativos abaixo da linha zero. */
export function BarsChart({
  labels,
  series,
  active,
  height = 240,
  tip,
}: {
  labels: string[];
  series: BarSeries[];
  active?: number;
  height?: number;
  tip: (i: number) => Tip;
}) {
  const [wrap, W] = useWidth();
  const svg = useRef<SVGSVGElement>(null);
  const [hover, setHover] = useState(-1);
  const n = labels.length;
  const all = series.flatMap((s) => s.values);
  const sc = scale(Math.max(0, ...all), Math.max(0, ...all.map((v) => -v)));
  const innerW = Math.max(W - M.l - M.r, 10);
  const innerH = height - M.t - M.b;
  const y = (v: number) => M.t + ((sc.top - v) / (sc.top + sc.bot)) * innerH;
  const band = innerW / Math.max(n, 1);
  const k = series.length;
  const bw = Math.max(4, Math.min(24, (band * 0.72 - (k - 1) * 3) / k));
  const gw = bw * k + (k - 1) * 3;

  useLayoutEffect(() => {
    if (!svg.current || !W) return;
    gsap.set(svg.current.querySelectorAll(".bar"), { scaleY: 0 });
    gsap.set(svg.current.querySelectorAll(".grid, .x-label"), { opacity: 0 });
  }, [W > 0, n]);
  useOnVisible(svg, () => {
    if (!svg.current) return;
    gsap.to(svg.current.querySelectorAll(".grid, .x-label"), { opacity: 1, duration: 0.5, stagger: 0.02 });
    gsap.to(svg.current.querySelectorAll(".bar"), {
      scaleY: 1,
      duration: 0.95,
      ease: "power3.out",
      stagger: { each: 0.03 },
      delay: 0.1,
    });
  }, [W > 0]);

  const barPath = (x: number, v: number) => {
    const y0 = y(0),
      y1 = y(v),
      r = Math.min(3.5, bw / 2, Math.abs(y1 - y0));
    if (Math.abs(y1 - y0) < 0.5) return `M${x} ${y0}h${bw}`;
    if (v >= 0) return `M${x} ${y0}V${y1 + r}Q${x} ${y1} ${x + r} ${y1}H${x + bw - r}Q${x + bw} ${y1} ${x + bw} ${y1 + r}V${y0}Z`;
    return `M${x} ${y0}V${y1 - r}Q${x} ${y1} ${x + r} ${y1}H${x + bw - r}Q${x + bw} ${y1} ${x + bw} ${y1 - r}V${y0}Z`;
  };

  const onMove = (e: React.MouseEvent) => {
    const r = (e.currentTarget as Element).getBoundingClientRect();
    const i = Math.floor((e.clientX - r.left - M.l) / band);
    setHover(i >= 0 && i < n ? i : -1);
  };
  const hv = hover >= 0 ? tip(hover) : null;
  const hx = hover >= 0 ? M.l + (hover + 0.5) * band : 0;
  const hy = hover >= 0 ? Math.min(...series.map((s) => y(Math.max(s.values[hover], 0)))) - 8 : 0;

  return (
    <div className="chart" ref={wrap} style={{ height }}>
      {W > 0 && (
        <svg ref={svg} width={W} height={height} role="img" aria-label="Gráfico de barras">
          <g className="grid">
            {sc.ticks.map((t) => (
              <g key={t}>
                <line x1={M.l} x2={W - M.r} y1={y(t)} y2={y(t)} strokeDasharray={t === 0 ? undefined : "3 4"} style={t === 0 ? { stroke: "var(--border-strong)" } : undefined} />
                <text className="axis-label" x={M.l - 8} y={y(t) + 4} textAnchor="end">
                  {compact(t)}
                </text>
              </g>
            ))}
          </g>
          {hover >= 0 && <rect x={M.l + hover * band + 2} y={M.t} width={band - 4} height={innerH} rx={6} fill="var(--jf-green-50)" />}
          {labels.map((_, i) => {
            const cx = M.l + (i + 0.5) * band;
            return series.map((s, si) => {
              const v = s.values[i];
              const x = cx - gw / 2 + si * (bw + 3);
              const col = v < 0 && s.colorNeg ? s.colorNeg : s.color;
              return (
                <path
                  key={s.key + i}
                  d={barPath(x, v)}
                  fill={col}
                  className={"bar" + (v < 0 ? " bar--neg" : "") + (hover >= 0 && hover !== i ? " dim" : "")}
                />
              );
            });
          })}
          {labels.map((l, i) => (
            <text key={i} className={"x-label" + (i === active ? " is-on" : "")} x={M.l + (i + 0.5) * band} y={height - 8} textAnchor="middle">
              {l}
            </text>
          ))}
          <rect x={M.l} y={0} width={innerW} height={height} fill="transparent" onMouseMove={onMove} onMouseLeave={() => setHover(-1)} />
        </svg>
      )}
      <Tooltip tip={hv} x={hx} y={hy} w={W} />
    </div>
  );
}

/* ------------------------------------------------------------ AreaChart */
function monotonePath(p: number[][]) {
  const n = p.length;
  if (n === 0) return "";
  if (n === 1) return `M${p[0][0]} ${p[0][1]}`;
  const dx: number[] = [],
    m: number[] = [],
    t: number[] = new Array(n).fill(0);
  for (let i = 0; i < n - 1; i++) {
    dx[i] = p[i + 1][0] - p[i][0];
    m[i] = (p[i + 1][1] - p[i][1]) / dx[i];
  }
  t[0] = m[0];
  t[n - 1] = m[n - 2];
  for (let i = 1; i < n - 1; i++) t[i] = m[i - 1] * m[i] <= 0 ? 0 : (m[i - 1] + m[i]) / 2;
  for (let i = 0; i < n - 1; i++) {
    if (m[i] === 0) {
      t[i] = t[i + 1] = 0;
      continue;
    }
    const a = t[i] / m[i],
      b = t[i + 1] / m[i],
      s = a * a + b * b;
    if (s > 9) {
      const tau = 3 / Math.sqrt(s);
      t[i] = tau * a * m[i];
      t[i + 1] = tau * b * m[i];
    }
  }
  let d = `M${p[0][0].toFixed(1)} ${p[0][1].toFixed(1)}`;
  for (let i = 0; i < n - 1; i++) {
    const h = dx[i] / 3;
    d += `C${(p[i][0] + h).toFixed(1)} ${(p[i][1] + t[i] * h).toFixed(1)} ${(p[i + 1][0] - h).toFixed(1)} ${(p[i + 1][1] - t[i + 1] * h).toFixed(1)} ${p[i + 1][0].toFixed(1)} ${p[i + 1][1].toFixed(1)}`;
  }
  return d;
}

/** Linha suave com área em degradê, ponto ativo pulsante e guia ao passar o mouse. */
export function AreaChart({
  labels,
  values,
  color,
  active,
  height = 220,
  tip,
}: {
  labels: string[];
  values: number[];
  color: string;
  active?: number;
  height?: number;
  tip: (i: number) => Tip;
}) {
  const [wrap, W] = useWidth();
  const svg = useRef<SVGSVGElement>(null);
  const [hover, setHover] = useState(-1);
  const uid = useId().replace(/:/g, "");
  const n = labels.length;
  const sc = scale(Math.max(0, ...values), Math.max(0, ...values.map((v) => -v)));
  const innerW = Math.max(W - M.l - M.r, 10);
  const innerH = height - M.t - M.b;
  const y = (v: number) => M.t + ((sc.top - v) / (sc.top + sc.bot)) * innerH;
  const band = innerW / Math.max(n, 1);
  const pts = values.map((v, i) => [M.l + (i + 0.5) * band, y(v)]);
  const line = monotonePath(pts);
  const area = pts.length ? `${line}L${pts[n - 1][0]} ${y(0)}L${pts[0][0]} ${y(0)}Z` : "";

  useLayoutEffect(() => {
    if (!svg.current || !W) return;
    gsap.set(svg.current.querySelector(".a-line"), { strokeDashoffset: 1 });
    gsap.set(svg.current.querySelector(".a-clip"), { attr: { width: 0 } });
    gsap.set(svg.current.querySelectorAll(".a-dot"), { scale: 0, transformOrigin: "50% 50%" });
    gsap.set(svg.current.querySelectorAll(".grid, .x-label, .a-live"), { opacity: 0 });
  }, [W > 0, n]);
  useOnVisible(svg, () => {
    if (!svg.current) return;
    const s = svg.current;
    const tl = gsap.timeline({ delay: 0.1 });
    tl.to(s.querySelectorAll(".grid, .x-label"), { opacity: 1, duration: 0.5, stagger: 0.02 }, 0);
    tl.to(s.querySelector(".a-line"), { strokeDashoffset: 0, duration: 1.5, ease: "power2.inOut" }, 0.1);
    tl.to(s.querySelector(".a-clip"), { attr: { width: W + 20 }, duration: 1.5, ease: "power2.inOut" }, 0.1);
    tl.to(s.querySelectorAll(".a-dot"), { scale: 1, duration: 0.45, ease: "back.out(2.6)", stagger: 0.09 }, 0.35);
    tl.to(s.querySelectorAll(".a-live"), { opacity: 1, duration: 0.4 }, 1.5);
  }, [W > 0]);

  const onMove = (e: React.MouseEvent) => {
    const r = (e.currentTarget as Element).getBoundingClientRect();
    const i = Math.round((e.clientX - r.left - M.l) / band - 0.5);
    setHover(i >= 0 && i < n ? i : -1);
  };
  const hv = hover >= 0 ? tip(hover) : null;

  return (
    <div className="chart" ref={wrap} style={{ height }}>
      {W > 0 && (
        <svg ref={svg} width={W} height={height} role="img" aria-label="Gráfico de linha">
          <defs>
            <linearGradient id={"g" + uid} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={color} stopOpacity=".32" />
              <stop offset="1" stopColor={color} stopOpacity="0" />
            </linearGradient>
            <clipPath id={"c" + uid}>
              <rect className="a-clip" x={0} y={-10} width={W + 20} height={height + 20} />
            </clipPath>
          </defs>
          <g className="grid">
            {sc.ticks.map((t) => (
              <g key={t}>
                <line x1={M.l} x2={W - M.r} y1={y(t)} y2={y(t)} strokeDasharray={t === 0 ? undefined : "3 4"} style={t === 0 ? { stroke: "var(--border-strong)" } : undefined} />
                <text className="axis-label" x={M.l - 8} y={y(t) + 4} textAnchor="end">
                  {compact(t)}
                </text>
              </g>
            ))}
          </g>
          {hover >= 0 && <line x1={pts[hover][0]} x2={pts[hover][0]} y1={M.t} y2={M.t + innerH} stroke={color} strokeOpacity=".35" strokeDasharray="4 4" />}
          <path d={area} fill={`url(#g${uid})`} clipPath={`url(#c${uid})`} />
          <path className="a-line" d={line} fill="none" stroke={color} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} />
          {pts.map((p, i) => (
            <g key={i}>
              {i === active && <circle className="pulse-dot a-live" cx={p[0]} cy={p[1]} r={7} fill={color} />}
              <circle className="a-dot" cx={p[0]} cy={p[1]} r={i === hover || i === active ? 6 : 4.5} fill="#fff" stroke={color} strokeWidth={2.5} style={{ transition: "r .15s" }} />
            </g>
          ))}
          {labels.map((l, i) => (
            <text key={i} className={"x-label" + (i === active ? " is-on" : "")} x={M.l + (i + 0.5) * band} y={height - 8} textAnchor="middle">
              {l}
            </text>
          ))}
          <rect x={M.l} y={0} width={innerW} height={height} fill="transparent" onMouseMove={onMove} onMouseLeave={() => setHover(-1)} />
        </svg>
      )}
      <Tooltip tip={hv} x={hover >= 0 ? pts[hover][0] : 0} y={hover >= 0 ? pts[hover][1] - 12 : 0} w={W} />
    </div>
  );
}

/* ----------------------------------------------------------- DonutChart */
export type DonutItem = { label: string; value: number; color: string };

/** Rosca com destaque ao passar o mouse e legenda com participação de cada item. */
export function DonutChart({
  items,
  centerLabel,
  centerValue,
  emptyText = "Sem dados no período.",
}: {
  items: DonutItem[];
  centerLabel: string;
  centerValue: string;
  emptyText?: string;
}) {
  const svg = useRef<SVGSVGElement>(null);
  const legend = useRef<HTMLDivElement>(null);
  const uid = useId().replace(/:/g, "");
  const [hover, setHover] = useState(-1);
  const total = items.reduce((a, i) => a + i.value, 0);
  const size = 190,
    sw = 26,
    r = (size - sw) / 2 - 4,
    C = 2 * Math.PI * r;
  let cum = 0;
  const segs = items.map((it) => {
    const len = total ? (it.value / total) * C : 0;
    const s = { ...it, len, off: cum };
    cum += len;
    return s;
  });

  useLayoutEffect(() => {
    if (!svg.current) return;
    gsap.set(svg.current.querySelector(".d-mask"), { strokeDashoffset: 1 });
    gsap.set(legend.current?.children ?? [], { opacity: 0, x: 14 });
  }, [items.length]);
  useOnVisible(svg, () => {
    if (!svg.current) return;
    gsap.to(svg.current.querySelector(".d-mask"), { strokeDashoffset: 0, duration: 1.3, ease: "power2.inOut", delay: 0.1 });
    gsap.to(legend.current?.children ?? [], { opacity: 1, x: 0, duration: 0.5, stagger: 0.06, delay: 0.3, ease: "power2.out" });
  }, [items.length]);

  if (!total) return <div style={{ padding: "32px 0", textAlign: "center", color: "var(--text-muted)" }}>{emptyText}</div>;
  const h = hover >= 0 ? items[hover] : null;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 20, justifyContent: "center" }}>
      <svg ref={svg} width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flex: "none" }} role="img" aria-label="Gráfico de rosca">
        <defs>
          <mask id={"m" + uid}>
            <circle className="d-mask" cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#fff" strokeWidth={sw + 10} pathLength={1} strokeDasharray={1} transform={`rotate(-90 ${size / 2} ${size / 2})`} />
          </mask>
        </defs>
        <g mask={`url(#m${uid})`}>
          {segs.map((s, i) => (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={s.color}
              strokeWidth={hover === i ? sw + 6 : sw}
              strokeDasharray={`${Math.max(s.len - 2, 0)} ${C - Math.max(s.len - 2, 0)}`}
              strokeDashoffset={-s.off}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
              opacity={hover >= 0 && hover !== i ? 0.3 : 1}
              style={{ transition: "stroke-width .2s, opacity .2s", cursor: "pointer" }}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(-1)}
            />
          ))}
        </g>
        <text x="50%" y="46%" textAnchor="middle" style={{ font: "600 11px var(--font-sans)", fill: "var(--text-muted)", letterSpacing: ".06em", textTransform: "uppercase" }}>
          {h ? h.label.slice(0, 18) : centerLabel}
        </text>
        <text x="50%" y="58%" textAnchor="middle" className="jf-num" style={{ font: "700 20px var(--font-numeric)", fill: "var(--text-strong)" }}>
          {h ? nf((h.value / total) * 100, 1) + "%" : centerValue}
        </text>
      </svg>
      <div ref={legend} style={{ display: "flex", flexDirection: "column", gap: 4, flex: "1 1 190px", minWidth: 0 }}>
        {items.map((it, i) => (
          <div
            key={i}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(-1)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "4px 8px",
              borderRadius: 8,
              background: hover === i ? "var(--jf-gray-50)" : "transparent",
              font: "var(--type-caption)",
              transition: "background .15s",
              cursor: "default",
            }}
          >
            <i style={{ width: 10, height: 10, borderRadius: 3, background: it.color, flex: "none" }} />
            <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "var(--text-body)" }}>{it.label}</span>
            <span className="jf-num" style={{ fontWeight: 600, color: "var(--text-strong)" }}>
              {brl(it.value)}
            </span>
            <span className="jf-num" style={{ width: 44, textAlign: "right", color: "var(--text-muted)" }}>
              {nf((it.value / total) * 100, 1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Legend({ items }: { items: { label: string; color: string }[] }) {
  return (
    <div className="legend">
      {items.map((i) => (
        <span key={i.label}>
          <i style={{ background: i.color }} />
          {i.label}
        </span>
      ))}
    </div>
  );
}

export type { ReactNode };

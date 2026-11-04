"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useApp } from "@/store/AppStore";
import {
  ATIV_OPT, REPS, TODAY, brl, dbr, dreRows, mEnd, mL, nf, norm, pc, res, dtBR, act, un, loadBks, seed, save, COLL_MOD, CAT_E, CAT_S, nowISO,
} from "@/lib/core";
import { dashData, saldoMensal, sparkSeries } from "@/lib/dash";
import { AnimatedText, Badge, Button, Card, Checkbox, DataTable, Icon, Input, KpiCard, Select, Tabs } from "@/components/ui";
import { AreaChart, BarsChart, DonutChart, Legend } from "@/components/charts";

const grid = (min: number): React.CSSProperties => ({ display: "grid", gridTemplateColumns: `repeat(auto-fit,minmax(min(100%,${min}px),1fr))`, gap: 16 });

export function PageView({ page }: { page: string }) {
  const { state, ctl, data } = useApp();
  const root = useRef<HTMLDivElement>(null);
  const s: any = { ...state, page };
  const V = ctl.buildView(s, data);

  // Entrada escalonada dos blocos; os que estão abaixo da dobra aparecem ao rolar.
  useGSAP(
    () => {
      const els = gsap.utils.toArray<HTMLElement>("[data-reveal]", root.current);
      if (!els.length) return;
      gsap.set(els, { opacity: 0, y: 20 });
      const io = new IntersectionObserver(
        (es) => {
          const vis = es.filter((e) => e.isIntersecting).map((e) => e.target);
          if (!vis.length) return;
          vis.forEach((v) => io.unobserve(v));
          gsap.to(vis, { opacity: 1, y: 0, duration: 0.7, ease: "power3.out", stagger: 0.07, clearProps: "opacity,transform" });
        },
        { root: document.getElementById("jf-main"), threshold: 0.05 },
      );
      els.forEach((e) => io.observe(e));
      return () => io.disconnect();
    },
    { scope: root, dependencies: [page] },
  );

  const q = norm(s.q);
  let rows = V.rows;
  if (q && !V.noSearch) rows = rows.filter((r: any) => V.columns.some((c: any) => norm(c.format ? c.format(r[c.key]) : r[c.key]).includes(q)));
  const selIdx = V.selIdxOverride != null ? V.selIdxOverride : s.sel < rows.length ? s.sel : -1;
  const selRow = rows[selIdx];
  const hasSel = !!(selRow && V.rowActs && page !== "fluxo");
  const rowActions = selRow && V.rowActs ? V.rowActs(selRow) : [];

  const kpis = V.kpis.map((k: any) => ({ ...k }));
  if (page === "dashboard") {
    const sp = sparkSeries(data, s.mes);
    if (kpis[0]) kpis[0].spark = sp.receita;
    if (kpis[1]) kpis[1].spark = sp.gastos;
    if (kpis[2]) kpis[2].spark = sp.lucro;
  }

  return (
    <div ref={root} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {kpis.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(230px,1fr))", gap: 16 }}>
          {kpis.map((k: any, i: number) => (
            <KpiCard key={k.label + i} {...k} />
          ))}
        </div>
      )}

      {page === "dashboard" && <Dashboard />}
      {page === "bancos" && <Bancos />}
      {page === "usuarios" && <Usuarios />}
      {page === "dre" && <Dre />}
      {page === "relatorios" && <Relatorios />}
      {page === "importacao" && <Importacao />}
      {page === "config" && <Config />}
      {page === "fluxo" && <FluxoChart />}

      {V.hasTable && (
        <Card title={V.tableTitle} subtitle={V.tableSub} icon={V.tableIcon}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
              {V.tabs && <Tabs items={V.tabs} value={V.tabVal} onChange={(x) => ctl.setTab(x)} variant="pill" />}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginLeft: "auto" }}>
                {V.actions.map((a: any) => (
                  <Button key={a.label} variant={a.variant} icon={a.icon} onClick={a.onClick}>
                    {a.label}
                  </Button>
                ))}
              </div>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
              <div style={{ width: "min(100%,300px)" }}>
                <Input placeholder="Buscar…" icon="search" value={s.q} onChange={(x) => ctl.setState({ q: x, sel: -1 })} />
              </div>
              <span style={{ font: "var(--type-caption)", color: "var(--text-muted)" }}>{rows.length} registro(s)</span>
              {hasSel && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginLeft: "auto", padding: "4px 4px 4px 12px", background: "var(--surface-selected)", borderRadius: "var(--radius-md)" }}>
                  <span style={{ font: "var(--type-label)", color: "var(--jf-navy-800)", maxWidth: 280, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {selRow.descricao || selRow.vendedor || selRow.comprador || selRow.nome || selRow.pessoa || "Selecionado"}
                  </span>
                  {rowActions.map((a: any) => (
                    <Button key={a.label} variant={a.variant} size="sm" icon={a.icon} onClick={a.onClick}>
                      {a.label}
                    </Button>
                  ))}
                </div>
              )}
            </div>
            <DataTable columns={V.columns} rows={rows} selectedIndex={selIdx} onSelect={(i) => ctl.setState({ sel: i })} animKey={page + V.tabVal + s.mes + rows.length} />
            {!rows.length && <div style={{ padding: 24, textAlign: "center", color: "var(--text-muted)" }}>Nenhum registro encontrado.</div>}
          </div>
        </Card>
      )}

      {V.hasTable2 && (
        <Card title={V.t2Title} subtitle={V.t2Sub} icon="list">
          <DataTable columns={V.t2Cols} rows={V.t2Rows} animKey={V.t2Title} />
        </Card>
      )}
    </div>
  );
}

/* ------------------------------------------------------------- Dashboard */
function Dashboard() {
  const { state, data } = useApp();
  const D = dashData(data, state.mes);
  const vals = (f: (o: any) => number) => D.R.map(f);
  const rec = "var(--fin-receber)", pag = "var(--fin-pagar)", sal = "var(--fin-saldo)";
  const cols = [
    { key: "mes", label: "Mês" },
    { key: "rec", label: "Receitas", align: "right", format: brl, bar: "receber" },
    { key: "des", label: "Despesas", align: "right", format: brl, bar: "pagar" },
    { key: "luc", label: "Resultado", align: "right", format: brl },
    { key: "mg", label: "Margem", align: "right", format: pc },
    { key: "var", label: "vs. mês anterior", align: "right" },
  ];
  const trows = D.R.map((o: any, i: number) => {
    const p = D.R[i - 1];
    const dv = p && p.r.lucro ? (o.r.lucro - p.r.lucro) / Math.abs(p.r.lucro) : null;
    return {
      mes: mL(o.x), rec: o.r.receita, des: o.r.gastos, luc: o.r.lucro,
      mg: o.r.receita ? o.r.lucro / o.r.receita : NaN,
      var: dv == null ? "—" : (dv >= 0 ? "▲ +" : "▼ ") + nf(dv * 100, 1) + "%",
    };
  }).reverse();
  return (
    <>
      <div style={grid(460)}>
        <Card title="Receitas × Despesas" subtitle={D.sub} icon="chart-column">
          <Legend items={[{ label: "Receitas", color: rec }, { label: "Despesas", color: pag }]} />
          <BarsChart
            labels={D.labels} active={D.active}
            series={[{ key: "r", label: "Receitas", color: rec, values: vals((o) => o.r.receita) }, { key: "d", label: "Despesas", color: pag, values: vals((o) => o.r.gastos) }]}
            tip={(i) => ({ title: mL(D.ms[i]), rows: [{ label: "Receitas", value: brl(D.R[i].r.receita), color: rec }, { label: "Despesas", value: brl(D.R[i].r.gastos), color: pag }] })}
          />
        </Card>
        <Card title="Evolução do Faturamento" subtitle={D.sub} icon="trending-up">
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 8 }}>
            <span className="jf-num" style={{ font: "var(--type-kpi)", fontSize: 24, color: rec }}>
              <AnimatedText text={D.fatAtual} />
            </span>
            <span style={{ font: "var(--type-caption)", color: "var(--text-muted)" }}>{D.fatLabel}</span>
          </div>
          <AreaChart labels={D.labels} values={vals((o) => o.r.receita)} color={rec} active={D.active} height={200}
            tip={(i) => ({ title: mL(D.ms[i]), rows: [{ label: "Faturamento", value: brl(D.R[i].r.receita), color: rec }] })} />
        </Card>
        <Card title="Evolução do Lucro" subtitle="Lucro líquido por mês" icon="wallet">
          <BarsChart labels={D.labels} active={D.active}
            series={[{ key: "l", label: "Lucro", color: sal, colorNeg: pag, values: vals((o) => o.r.lucro) }]}
            tip={(i) => ({ title: mL(D.ms[i]), rows: [{ label: "Lucro líquido", value: brl(D.R[i].r.lucro), color: D.R[i].r.lucro >= 0 ? sal : pag }] })} />
        </Card>
        <Card title="Comparativo entre Atividades" subtitle="Resultado líquido mensal" icon="scale">
          <Legend items={[{ label: "Casa de Carnes", color: "var(--jf-green-600)" }, { label: "Compra e venda de gado", color: "var(--jf-navy-700)" }]} />
          <BarsChart labels={D.labels} active={D.active} height={225}
            series={[{ key: "c", label: "Casa de Carnes", color: "var(--jf-green-600)", values: vals((o) => o.c.lucro) }, { key: "g", label: "Gado", color: "var(--jf-navy-700)", values: vals((o) => o.g.lucro) }]}
            tip={(i) => ({ title: mL(D.ms[i]), rows: [{ label: "Casa de Carnes", value: brl(D.R[i].c.lucro), color: "var(--jf-green-600)" }, { label: "Gado", value: brl(D.R[i].g.lucro), color: "var(--jf-navy-700)" }] })} />
        </Card>
      </div>
      <Card title="Composição dos Gastos" subtitle={"Onde o dinheiro foi em " + mL(state.mes)} icon="percent">
        <DonutChart items={D.donut} centerLabel="Gastos" centerValue={brl(D.gastosMes).replace("R$ ", "")} emptyText="Sem gastos neste mês." />
      </Card>
      <Card title="Resultado Mensal" subtitle="Receitas, despesas e lucro de cada mês" icon="calendar">
        <DataTable columns={cols} rows={trows} animKey={state.mes} />
      </Card>
    </>
  );
}

/* ---------------------------------------------------------- Fluxo (saldo) */
function FluxoChart() {
  const { data } = useApp();
  const S = saldoMensal(data);
  return (
    <Card title="Evolução do Saldo" subtitle="Saldo somado de todas as contas ao fim de cada mês" icon="landmark">
      <AreaChart labels={S.map((x) => x.label)} values={S.map((x) => x.saldo)} color="var(--fin-saldo)" active={S.length - 1} height={200}
        tip={(i) => ({ title: mL(S[i].m), rows: [{ label: "Saldo", value: brl(S[i].saldo), color: "var(--fin-saldo)" }] })} />
    </Card>
  );
}

/* ----------------------------------------------------------------- Bancos */
function Bancos() {
  const { state, ctl, data } = useApp();
  const de = state.mes + "-01", ate = mEnd(state.mes);
  const cards = data.contas.filter((c: any) => !c.excluido).map((c: any) => {
    const { saldo } = require_saldo();
    const sd = saldo(data, c.id);
    const L = act(data).filter((l: any) => l.data >= de && l.data <= ate);
    const e = L.reduce((a: number, l: any) => a + ((l.tipo === "entrada" && l.conta === c.id) || (l.tipo === "transf" && l.destino === c.id) ? l.valor : 0), 0);
    const sa = L.reduce((a: number, l: any) => a + ((l.tipo === "saida" || l.tipo === "transf") && l.conta === c.id ? l.valor : 0), 0);
    return { c, sd, e, sa };
  });
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 16 }}>
      {cards.map(({ c, sd, e, sa }: any) => (
        <button key={c.id} data-reveal onClick={() => ctl.setState({ contaSel: c.id, sel: -1 })}
          style={{ textAlign: "left", cursor: "pointer", background: "#fff", border: "1px solid var(--border-default)", borderRadius: "var(--radius-lg)", boxShadow: c.id === state.contaSel ? "0 0 0 2px var(--jf-navy-600)" : "var(--shadow-xs)", padding: "16px 20px", display: "flex", flexDirection: "column", gap: 4, font: "var(--type-body)", color: "var(--text-body)", transition: "box-shadow .2s, transform .25s" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 8, font: "700 20px/1.2 var(--font-display)", color: "var(--text-strong)" }}>
            <Icon name={c.tipo === "Caixa" ? "banknote" : "landmark"} size={20} color="var(--text-muted)" />
            {c.nome}
          </span>
          <span style={{ font: "var(--type-caption)", fontStyle: "italic", color: "var(--text-muted)" }}>{c.tipo + (c.agencia ? " · Ag. " + c.agencia + " · C/C " + c.numero : "")}</span>
          <span className="jf-num" style={{ font: "var(--type-kpi)", marginTop: 10, color: sd >= 0 ? "var(--fin-saldo)" : "var(--fin-pagar)" }}>
            <AnimatedText text={brl(sd)} />
          </span>
          <span style={{ display: "flex", gap: 14, font: "600 12px var(--font-sans)", marginTop: 4 }}>
            <span style={{ color: "var(--fin-receber)" }}>Entradas {brl(e)}</span>
            <span style={{ color: "var(--fin-pagar)" }}>Saídas {brl(sa)}</span>
          </span>
        </button>
      ))}
    </div>
  );
}
import * as CORE from "@/lib/core";
const require_saldo = () => ({ saldo: CORE.saldo });

/* --------------------------------------------------------------- Usuários */
function Usuarios() {
  const { state, ctl, data, me } = useApp();
  const admin = me?.perfil === "Administrador";
  return (
    <>
      <div data-reveal style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ color: "var(--text-muted)" }}>Crie acessos para sócios e funcionários. Cada pessoa entra com o próprio login e senha.</span>
        {admin && (
          <Button icon="plus" onClick={() => ctl.openForm("usuario")}>
            Novo acesso
          </Button>
        )}
      </div>
      <div style={grid(380)}>
        {data.users.map((u: any) => (
          <Card key={u.id}>
            <div style={{ display: "flex", gap: 16, alignItems: "flex-start", opacity: u.ativo === false ? 0.6 : 1 }}>
              <span style={{ width: 52, height: 52, flex: "none", borderRadius: "50%", background: "var(--jf-navy-700)", color: "#fff", display: "grid", placeItems: "center", font: "700 18px var(--font-sans)" }}>{u.nome.slice(0, 2).toUpperCase()}</span>
              <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ font: "var(--type-h2)", color: "var(--text-strong)" }}>{u.nome}</span>
                  <Badge tone={u.perfil === "Administrador" ? "info" : "brand"}>{u.perfil}</Badge>
                  {u.id === state.user && <Badge tone="success" dot>Conectado</Badge>}
                  {u.ativo === false && <Badge tone="danger">Desativado</Badge>}
                </div>
                <span style={{ color: "var(--text-muted)" }}>Login: {u.email}</span>
                <span style={{ font: "var(--type-caption)" }}>
                  {u.perfil === "Administrador"
                    ? "Acesso completo, inclusive criar e desativar acessos."
                    : "Acesso a lançamentos, resultados e relatórios. Não gerencia acessos."}
                </span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 18px", font: "var(--type-caption)", color: "var(--text-muted)" }}>
                  <span>Último acesso: {u.ultimoAcesso ? dtBR(u.ultimoAcesso) : "—"}</span>
                  <span>{act(data).filter((l: any) => l.usuario === u.id).length} lançamentos</span>
                  <span>{data.log.filter((l: any) => l.usuario === u.id).length} alterações registradas</span>
                </div>
                {admin && (
                  <div style={{ marginTop: 6, display: "flex", flexWrap: "wrap", gap: 8 }}>
                    <Button variant="outline" size="sm" icon="pencil" onClick={() => ctl.openForm("usuario", u)}>Editar</Button>
                    <Button variant="outline" size="sm" icon="key-round" onClick={() => ctl.openForm("senha", u)}>Alterar senha</Button>
                    {u.id !== state.user && (
                      <Button variant={u.ativo === false ? "outline" : "ghost"} size="sm" icon={u.ativo === false ? "rotate-ccw" : "lock"} onClick={() => ctl.toggleUser(u)}>
                        {u.ativo === false ? "Reativar" : "Desativar"}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}

/* -------------------------------------------------------------------- DRE */
function Dre() {
  const { state, ctl, data } = useApp();
  const [a, b, lab] = ctl.drePeriod();
  const at: any = { "Casa de Carnes": "carnes", "Compra e Venda de Gado": "gado", Consolidado: null }[state.dreTab as string];
  const L = dreRows(res(data, a, b, at));
  const t = {
    title: "DRE – " + state.dreTab, sub: lab,
    columns: [{ key: "conta", label: "Conta" }, { key: "valor", label: "Valor", align: "right", format: brl }, { key: "pct", label: "% Receita", align: "right", format: pc, pct: 1 }],
    rows: L.map((l: any) => ({ conta: l.label, valor: l.v, pct: l.p, _b: l.kind !== "cat" })),
  };
  const body = useRef<HTMLDivElement>(null);
  useGSAP(() => {
    gsap.fromTo(".dre-row", { opacity: 0, x: -12 }, { opacity: 1, x: 0, duration: 0.4, stagger: 0.03, ease: "power2.out", clearProps: "opacity,transform" });
  }, { scope: body, dependencies: [state.dreTab, state.drePer, state.mes] });
  return (
    <Card title="Demonstrativo de Resultado do Exercício" subtitle={state.dreTab + " · " + lab} icon="file-spreadsheet">
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center", justifyContent: "space-between" }}>
          <Tabs items={["Casa de Carnes", "Compra e Venda de Gado", "Consolidado"]} value={state.dreTab} onChange={(x) => ctl.setState({ dreTab: x })} variant="pill" />
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
            <Tabs items={["Mês selecionado", "Ano"]} value={state.drePer} onChange={(x) => ctl.setState({ drePer: x })} />
            <Button variant="outline" size="sm" icon="file-text" onClick={() => { ctl.printDoc(t); ctl.mut(() => {}, "Exportou", "DRE", t.title + " (PDF)"); }}>PDF</Button>
            <Button variant="outline" size="sm" icon="sheet" onClick={() => ctl.xlsDoc(t, "dre-" + norm(state.dreTab).replace(/ /g, "-"))}>Excel</Button>
          </div>
        </div>
        <div ref={body} style={{ border: "1px solid var(--border-default)", borderRadius: "var(--radius-md)", overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(110px,170px) 80px", gap: 12, padding: "10px 14px", background: "var(--surface-sunken)", font: "700 13px var(--font-sans)", color: "var(--text-strong)" }}>
            <span>Conta</span><span style={{ textAlign: "right" }}>Valor</span><span style={{ textAlign: "right" }}>% Receita</span>
          </div>
          {L.map((l: any, i: number) => (
            <div key={i} className="dre-row" style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(110px,170px) 80px", gap: 12, padding: "9px 14px", borderTop: "1px solid var(--border-default)", background: l.kind === "final" ? "var(--surface-brand-soft)" : l.kind === "sub" || l.kind === "total" ? "var(--jf-gray-25)" : "#fff", fontWeight: l.kind === "cat" ? 400 : l.kind === "grupo" ? 600 : 700, color: l.kind === "cat" ? "var(--text-muted)" : "var(--text-strong)" }}>
              <span style={{ paddingLeft: l.kind === "cat" ? 24 : 0 }}>{l.label}</span>
              <span className="jf-num" style={{ textAlign: "right", color: l.kind === "final" ? (l.v >= 0 ? "var(--fin-saldo)" : "var(--fin-pagar)") : undefined }}>{brl(l.v)}</span>
              <span className="jf-num" style={{ textAlign: "right", color: "var(--text-muted)", fontWeight: 400 }}>{pc(l.p)}</span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

/* -------------------------------------------------------------- Relatórios */
function Relatorios() {
  const { state, ctl } = useApp();
  const rep = ctl.report(state.rep, state.repDe, state.repAte);
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "flex-start" }}>
      <div style={{ flex: "1 1 260px", maxWidth: "100%" }}>
        <Card title="Relatórios Gerenciais" subtitle="Escolha um relatório" icon="file-text" padding={12}>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {REPS.map((n: string, i: number) => {
              const on = state.rep === i + 1;
              return (
                <button key={n} onClick={() => ctl.setState({ rep: i + 1 })} style={{ display: "flex", gap: 10, alignItems: "center", width: "100%", textAlign: "left", padding: "9px 10px", border: 0, borderRadius: "var(--radius-md)", cursor: "pointer", background: on ? "var(--jf-green-700)" : "transparent", color: on ? "#fff" : "var(--text-body)", font: "500 14px var(--font-sans)", transition: "background .2s" }}>
                  <span className="jf-num" style={{ width: 22, fontWeight: 700, color: on ? "var(--jf-green-100)" : "var(--text-subtle)" }}>{i + 1}</span>
                  <span>{n}</span>
                </button>
              );
            })}
          </div>
        </Card>
      </div>
      <div style={{ flex: "999 1 520px", minWidth: 0, maxWidth: "100%" }}>
        <Card title={rep.title} subtitle={rep.sub} icon="file-chart-column">
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "flex-end" }}>
              <div style={{ width: 170 }}><Input label="De" type="date" value={state.repDe} onChange={(x) => ctl.setState({ repDe: x })} /></div>
              <div style={{ width: 170 }}><Input label="Até" type="date" value={state.repAte} onChange={(x) => ctl.setState({ repAte: x })} /></div>
              <div style={{ display: "flex", gap: 6 }}>
                <Button variant="ghost" size="sm" onClick={() => ctl.setState({ repDe: state.mes + "-01", repAte: mEnd(state.mes) })}>Este mês</Button>
                <Button variant="ghost" size="sm" onClick={() => ctl.setState({ repDe: TODAY.slice(0, 4) + "-01-01", repAte: TODAY })}>Este ano</Button>
              </div>
              <div style={{ display: "flex", gap: 8, marginLeft: "auto" }}>
                <Button variant="outline" icon="file-text" onClick={() => { ctl.printDoc(rep); ctl.mut(() => {}, "Exportou", "Relatórios", rep.title + " (PDF)"); }}>Exportar PDF</Button>
                <Button icon="sheet" onClick={() => ctl.xlsDoc(rep, norm(rep.title).replace(/[^a-z0-9]+/g, "-"))}>Exportar Excel</Button>
              </div>
            </div>
            <DataTable columns={rep.columns} rows={rep.rows} animKey={state.rep + state.repDe + state.repAte} />
            {!rep.rows.length && <div style={{ padding: 24, textAlign: "center", color: "var(--text-muted)" }}>Nenhum dado no período selecionado.</div>}
          </div>
        </Card>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------- Importação */
function Importacao() {
  const { state, ctl, data } = useApp();
  const im = state.imp;
  const contasOpt = data.contas.filter((c: any) => !c.excluido).map((c: any) => ({ value: c.id, label: c.nome }));
  const nd = im ? im.rows.filter((r: any) => r.dup).length : 0;
  const on = im ? im.rows.filter((r: any) => r.on).length : 0;
  const cols = "36px 96px minmax(200px,1fr) 130px 180px 210px 120px";
  return (
    <>
      <div style={grid(300)}>
        <Card title="Lançamento Manual" subtitle="Formulários de cadastro" icon="square-pen">
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <p style={{ margin: 0 }}>Cadastre receitas, despesas, compras, vendas e movimentações uma a uma.</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              <Button icon="plus" onClick={() => ctl.openForm("lanc")}>Novo lançamento</Button>
              <Button variant="outline" onClick={() => ctl.openForm("compra")}>Compra de gado</Button>
              <Button variant="outline" onClick={() => ctl.openForm("venda")}>Venda de gado</Button>
            </div>
          </div>
        </Card>
        <Card title="Planilha Excel" subtitle=".xlsx, .xls ou .csv" icon="sheet">
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <p style={{ margin: 0 }}>Colunas aceitas: Data, Descrição, Valor, Tipo, Categoria, Atividade, Forma, Conta. Valores negativos entram como saída.</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              <Button icon="upload" onClick={() => ctl.fileXls.current?.click()}>Selecionar planilha</Button>
              <Button variant="ghost" icon="download" onClick={() => ctl.baixarModelo()}>Baixar modelo</Button>
            </div>
          </div>
        </Card>
        <Card title="Extrato Bancário" subtitle="OFX ou CSV do banco" icon="landmark">
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Select label="Banco / conta do extrato" options={contasOpt} value={state.impConta || (contasOpt[0] && contasOpt[0].value) || ""} onChange={(x) => ctl.setState({ impConta: x })} />
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              <Button icon="upload" onClick={() => ctl.fileOfx.current?.click()}>Selecionar extrato</Button>
            </div>
          </div>
        </Card>
      </div>
      <input type="file" ref={ctl.fileXls as any} accept=".xlsx,.xls,.csv" onChange={(e) => ctl.onFile(e, "xls")} style={{ display: "none" }} />
      <input type="file" ref={ctl.fileOfx as any} accept=".ofx,.csv,.txt" onChange={(e) => ctl.onFile(e, "ofx")} style={{ display: "none" }} />
      {im && (
        <Card title="Conferência da Importação" subtitle={im.titulo + " · " + im.rows.length + " linha(s)"} icon="list-checks">
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
              <Badge tone="success" dot>{im.rows.length - nd} novo(s)</Badge>
              <Badge tone="warning" dot>{nd} possível(is) duplicado(s)</Badge>
              <span style={{ font: "var(--type-caption)", color: "var(--text-muted)" }}>Duplicados ficam desmarcados. Revise atividade e categoria antes de confirmar.</span>
            </div>
            <div className="scroll" style={{ overflowX: "auto", border: "1px solid var(--border-default)", borderRadius: "var(--radius-md)" }}>
              <div style={{ minWidth: 960 }}>
                <div style={{ display: "grid", gridTemplateColumns: cols, gap: 10, padding: "10px 12px", background: "var(--surface-sunken)", font: "700 13px var(--font-sans)", color: "var(--text-strong)" }}>
                  <span /><span>Data</span><span>Descrição</span><span style={{ textAlign: "right" }}>Valor</span><span>Atividade</span><span>Categoria</span><span>Situação</span>
                </div>
                {im.rows.map((r: any) => (
                  <div key={r.k} style={{ display: "grid", gridTemplateColumns: cols, gap: 10, alignItems: "center", padding: "6px 12px", borderTop: "1px solid var(--border-default)", background: r.dup ? "var(--jf-amber-100)" : "#fff" }}>
                    <Checkbox checked={r.on} onChange={(v) => ctl.impRow(r.k, { on: v })} />
                    <span className="jf-num">{dbr(r.data)}</span>
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{r.descricao}</span>
                    <span className="jf-num" style={{ textAlign: "right", fontWeight: 600, color: r.tipo === "saida" ? "var(--fin-pagar)" : "var(--fin-receber)" }}>{(r.tipo === "saida" ? "− " : "+ ") + brl(r.valor)}</span>
                    <Select options={ATIV_OPT} value={r.atividade} onChange={(x) => ctl.impRow(r.k, { atividade: x })} />
                    <Select options={r.tipo === "entrada" ? CAT_E : CAT_S} value={r.categoria} onChange={(x) => ctl.impRow(r.k, { categoria: x })} />
                    <Badge tone={r.dup ? "warning" : "success"}>{r.dup ? "Duplicado" : "Novo"}</Badge>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", flexWrap: "wrap" }}>
              <Button variant="ghost" onClick={() => ctl.setState({ imp: null })}>Cancelar</Button>
              <Button icon="check" onClick={() => ctl.confirmImp()}>Importar {on} lançamento(s)</Button>
            </div>
          </div>
        </Card>
      )}
    </>
  );
}

/* ----------------------------------------------------------- Configurações */
function Config() {
  const { ctl, data, me } = useApp();
  const e = data.empresa;
  const admin = me?.perfil === "Administrador";
  const [days, setDays] = useState<string[]>([]);
  useEffect(() => {
    if (!admin) return;
    fetch("/api/backups", { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => setDays(j.days || []))
      .catch(() => {});
  }, [admin]);
  const restoreDay = (day: string) =>
    ctl.ask("Restaurar a cópia de " + dbr(day) + "?", "Os dados atuais serão substituídos por esta cópia. Os acessos de usuários continuam como estão.", async () => {
      try {
        const r = await fetch("/api/backups?d=" + day);
        const j = await r.json();
        if (!r.ok) throw new Error(j.error);
        const dd = j.data;
        dd.users = ctl.state.data.users;
        ctl.setState({ data: dd });
        save(dd);
        ctl.mut(() => {}, "Restaurou cópia", "Configurações", "Cópia de " + dbr(day));
        ctl.toast("Cópia restaurada.");
      } catch {
        ctl.toast("Não foi possível restaurar a cópia.");
      }
    }, "Restaurar");
  const lab: any = {
    lanc: (x: any) => x.descricao + " · " + brl(x.valor), compras: (x: any) => "Compra de gado – " + x.vendedor, vendas: (x: any) => "Venda de gado – " + x.comprador,
    pagar: (x: any) => "A pagar: " + x.fornecedor + " · " + x.descricao, receber: (x: any) => "A receber: " + x.cliente + " · " + x.descricao,
    fornecedores: (x: any) => "Fornecedor " + x.nome, contas: (x: any) => "Conta " + x.nome,
  };
  const lx: any[] = [];
  Object.keys(lab).forEach((k) => data[k].filter((x: any) => x.excluido && !x.ref).forEach((x: any) => lx.push({ k, x, em: x.excluidoEm || "" })));
  lx.sort((a, b) => (a.em < b.em ? 1 : -1));
  const rowStyle = { display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderTop: "1px solid var(--border-default)" } as const;
  return (
    <div style={{ ...grid(380), alignItems: "start" }}>
      <Card title="Dados da Empresa" icon="building-2">
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[["Nome", e.nome], ["Localização", e.cidade], ["Telefone/WhatsApp", e.telefone], ["Instagram", e.instagram], ["Atividades", e.atividades]].map(([k, v]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", gap: 12, paddingBottom: 8, borderBottom: "1px solid var(--border-default)" }}>
              <span style={{ color: "var(--text-muted)" }}>{k}</span><span style={{ fontWeight: 600, color: "var(--text-strong)", textAlign: "right" }}>{v}</span>
            </div>
          ))}
          <div><Button variant="outline" size="sm" icon="pencil" onClick={() => ctl.openForm("empresa")}>Editar dados</Button></div>
        </div>
      </Card>
      <Card title="Backup e Recuperação" subtitle="Os dados ficam na nuvem. Uma cópia por dia é guardada (últimos 7 dias)." icon="database-backup">
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            <Button icon="download" onClick={() => { ctl.dl(new Blob([JSON.stringify(data, null, 1)], { type: "application/json" }), "backup-agropecuaria-jf-" + TODAY + ".json"); ctl.mut(() => {}, "Baixou backup", "Configurações", ""); }}>Baixar backup</Button>
            {admin && <Button variant="outline" icon="upload" onClick={() => ctl.fileBk.current?.click()}>Restaurar de arquivo</Button>}
          </div>
          <input type="file" ref={ctl.fileBk as any} accept=".json" onChange={(ev) => ctl.onFile(ev, "bk")} style={{ display: "none" }} />
          {admin && days.length === 0 && <div style={{ color: "var(--text-muted)", font: "var(--type-caption)" }}>As cópias diárias aparecem aqui depois do primeiro dia de uso.</div>}
          {admin && days.map((day) => (
            <div key={day} style={rowStyle}>
              <Icon name="archive" size={18} color="var(--text-muted)" />
              <span style={{ flex: 1 }}>{"Cópia automática de " + dbr(day)}</span>
              <Button variant="ghost" size="sm" onClick={() => restoreDay(day)}>Restaurar</Button>
            </div>
          ))}
        </div>
      </Card>
      <Card title="Lixeira" subtitle="Itens excluídos podem ser recuperados" icon="trash-2">
        <div style={{ display: "flex", flexDirection: "column" }}>
          {!lx.length && <div style={{ padding: "16px 0", color: "var(--text-muted)" }}>Nenhum item excluído.</div>}
          {lx.map(({ k, x }) => (
            <div key={k + x.id} style={rowStyle}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, color: "var(--text-strong)" }}>{lab[k](x)}</div>
                <div style={{ font: "var(--type-caption)", color: "var(--text-muted)" }}>{COLL_MOD[k] + " · excluído por " + un(data, x.excluidoPor) + " em " + dtBR(x.excluidoEm)}</div>
              </div>
              <Button variant="outline" size="sm" icon="rotate-ccw" onClick={() => ctl.restore(k, x.id, lab[k](x))}>Restaurar</Button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
void nowISO;
void loadBks;
void seed;

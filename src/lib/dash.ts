import { TODAY, monthsBetween, mEnd, mS, mL, res, brl, saldo, act, addD } from "./core";

const PALETTE = ["#137033", "#1660a8", "#5cb82e", "#e8b01c", "#c62828", "#3aa58f", "#8fb3e2", "#0a2a5c", "#97a194"];

/** Série dos últimos 12 meses usada pelos gráficos do dashboard. */
export function dashData(d: any, mes: string) {
  const first = d.lanc.reduce((a: string, l: any) => (l.data < a ? l.data : a), TODAY).slice(0, 7);
  const ms: string[] = monthsBetween(first, TODAY.slice(0, 7)).slice(-12);
  const R = ms.map((x) => ({
    x,
    label: mS(x),
    r: res(d, x + "-01", mEnd(x)),
    c: res(d, x + "-01", mEnd(x), "carnes"),
    g: res(d, x + "-01", mEnd(x), "gado"),
  }));
  const active = Math.max(
    0,
    R.findIndex((o) => o.x === mes),
  );
  const sel = R[active] || R[R.length - 1];

  // composição dos gastos do mês selecionado
  const cur = res(d, mes + "-01", mEnd(mes));
  const byCat: Record<string, number> = {};
  Object.keys(cur.cats).forEach((k) => {
    const [g, cat] = k.split("|");
    if (g === "receita") return;
    byCat[cat] = (byCat[cat] || 0) + cur.cats[k];
  });
  const sorted = Object.entries(byCat).sort((a, b) => b[1] - a[1]);
  const top = sorted.slice(0, 7);
  const rest = sorted.slice(7).reduce((a, [, v]) => a + v, 0);
  if (rest > 0) top.push(["Outros", rest]);
  const donut = top.map(([label, value], i) => ({ label, value, color: PALETTE[i % PALETTE.length] }));

  return {
    R,
    ms,
    labels: R.map((o) => o.label),
    active,
    sub: R.length ? mS(ms[0]) + " a " + mS(ms[ms.length - 1]) : "",
    fatAtual: brl(sel ? sel.r.receita : 0),
    fatLabel: "Faturamento em " + (sel ? mL(sel.x) : ""),
    donut,
    gastosMes: cur.gastos,
  };
}

/** Evolução do saldo (soma das contas) a cada mês, para o gráfico do fluxo de caixa. */
export function saldoMensal(d: any) {
  const first = d.lanc.reduce((a: string, l: any) => (l.data < a ? l.data : a), TODAY).slice(0, 7);
  const ms: string[] = monthsBetween(first, TODAY.slice(0, 7)).slice(-12);
  const cs = d.contas.filter((c: any) => !c.excluido);
  return ms.map((m) => {
    const fim = mEnd(m) > TODAY ? TODAY : mEnd(m);
    return { m, label: mS(m), saldo: cs.reduce((a: number, c: any) => a + saldo(d, c.id, fim), 0) };
  });
}

/** Últimos valores (por mês) para as miniaturas dos cartões de indicadores. */
export function sparkSeries(d: any, mes: string) {
  const R = dashData(d, mes).R;
  const upto = Math.max(1, R.findIndex((o) => o.x === mes) + 1);
  const slice = R.slice(Math.max(0, upto - 6), upto);
  return {
    receita: slice.map((o) => o.r.receita),
    gastos: slice.map((o) => o.r.gastos),
    lucro: slice.map((o) => o.r.lucro),
  };
}

export { addD, act };

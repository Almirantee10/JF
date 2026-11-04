/* eslint-disable */
// Regras de negócio, dados de demonstração e helpers — portados literalmente do protótipo original.
export const NS='jf-agro-fin-v1',SESS='jf-agro-sess',BK='jf-agro-backups';
export const MES=['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
export const MESF=['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
export const pad=n=>String(n).padStart(2,'0');
export const iso=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
export const TODAY=iso(new Date());
export const r2=v=>Math.round((+v||0)*100)/100;
export const brl=v=>'R$ '+(+v||0).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
export const brlE=v=>v?brl(v):'';
export const nf=(v,d)=>(+v||0).toLocaleString('pt-BR',{minimumFractionDigits:d||0,maximumFractionDigits:d||0});
export const pc=v=>isFinite(v)&&!isNaN(v)?nf(v*100,1)+'%':'—';
export const pcS=v=>isFinite(v)&&!isNaN(v)?(v>=0?'+':'')+nf(v*100,1)+'%':undefined;
export const dbr=s=>s?s.slice(8,10)+'/'+s.slice(5,7)+'/'+s.slice(0,4):'—';
export const dtBR=q=>{try{return new Date(q).toLocaleString('pt-BR',{dateStyle:'short',timeStyle:'short'});}catch(e){return q;}};
export const mL=m=>MESF[+m.slice(5,7)-1]+' '+m.slice(0,4);
export const mS=m=>MES[+m.slice(5,7)-1]+'/'+m.slice(2,4);
export const addD=(s,n)=>{const d=new Date(s+'T12:00:00');d.setDate(d.getDate()+n);return iso(d);};
export const mEnd=m=>{const [y,mo]=m.split('-').map(Number);return m+'-'+pad(new Date(y,mo,0).getDate());};
export const mShift=(m,k)=>{const [y,mo]=m.split('-').map(Number);const d=new Date(y,mo-1+k,1);return d.getFullYear()+'-'+pad(d.getMonth()+1);};
export const monthsBetween=(a,b)=>{const o=[];let m=a;while(m<=b&&o.length<240){o.push(m);m=mShift(m,1);}return o;};
export const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,7);
export const hash=s=>{let h=5381;for(const c of String(s))h=((h*33)^c.charCodeAt(0))>>>0;return 'h'+h.toString(16);};
export const norm=s=>String(s==null?'':s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ').trim();
export const pnum=s=>{if(typeof s==='number')return s;s=String(s||'').replace(/R\$|\s/g,'');if(s.includes(','))s=s.replace(/\./g,'').replace(',','.');const n=parseFloat(s);return isNaN(n)?0:n;};
export const nowISO=()=>new Date().toISOString();
export const GRUPO={'Vendas casa de carnes':'receita','Venda de gado':'receita','Outras receitas':'receita','Impostos':'deducao','Compra de mercadorias':'custo','Compra de gado':'custo','Frete e comissões':'custo','Salários':'despesa','Energia e água':'despesa','Aluguel':'despesa','Manutenção':'despesa','Combustível':'despesa','Outras despesas':'despesa','Taxas bancárias':'financeira','Juros e multas':'financeira'};
export const CAT_E=['Vendas casa de carnes','Venda de gado','Outras receitas'];
export const CAT_S=Object.keys(GRUPO).filter(k=>!CAT_E.includes(k));
export const ATIV={carnes:'Casa de Carnes',gado:'Gado',geral:'Geral'};
export const ATIV_OPT=[{value:'carnes',label:'Casa de Carnes'},{value:'gado',label:'Compra e venda de gado'},{value:'geral',label:'Geral (administrativo)'}];
export const FORMAS=['PIX','Dinheiro','Cartão','Transferência','Boleto'];
export const PAGES=[['dashboard','Dashboard','layout-dashboard'],['financeiro','Financeiro','wallet'],['carnes','Casa de Carnes','beef'],['compraGado','Compra de Gado','shopping-cart'],['vendaGado','Venda de Gado','handshake'],['bancos','Contas Bancárias','landmark'],['caixa','Caixa','banknote'],['pagar','Contas a Pagar','circle-arrow-down'],['receber','Contas a Receber','circle-arrow-up'],['fluxo','Fluxo de Caixa','chart-column'],['dre','DRE','file-spreadsheet'],['relatorios','Relatórios','file-text'],['importacao','Importação de Dados','upload'],['usuarios','Usuários','users'],['config','Configurações','settings']];
export const MES_PAGES=['dashboard','financeiro','carnes','vendaGado','bancos','caixa','fluxo','dre'];
export const REPS=['Faturamento mensal','Faturamento anual','Despesas mensais','Despesas anuais','Lucro líquido','Fluxo de caixa','Contas a pagar','Contas a receber','Resultado da casa de carnes','Resultado da compra e venda de gado','Resultado consolidado da empresa','Comparativo mensal','Comparativo anual','DRE'];
export const COLL_MOD={lanc:'Financeiro',compras:'Compra de Gado',vendas:'Venda de Gado',pagar:'Contas a Pagar',receber:'Contas a Receber',fornecedores:'Casa de Carnes',contas:'Contas Bancárias'};

export function isCx(d,id){const c=d.contas.find(x=>x.id===id);return !!c&&c.tipo==='Caixa';}
export function cxId(d){const c=d.contas.find(x=>x.tipo==='Caixa'&&!x.excluido);return c?c.id:'caixa';}
export function bankId(d){const c=d.contas.find(x=>x.tipo!=='Caixa'&&!x.excluido);return c?c.id:'';}
export function cn(d,id){const c=d.contas.find(x=>x.id===id);return c?c.nome:'—';}
export function un(d,id){const u=d.users.find(x=>x.id===id);return u?u.nome:(id||'—');}
export function act(d){return d.lanc.filter(l=>!l.excluido);}
export function gv(d,v){const c=d.compras.find(x=>x.id===v.loteId)||{qtd:1,valor:0,transporte:0,comissao:0,outros:0,vendedor:'—',data:''};const q=c.qtd||1;const cc=c.valor/q*v.qtd,ca=((+c.transporte||0)+(+c.comissao||0)+(+c.outros||0))/q*v.qtd;const lb=v.valor-cc,ll=lb-ca-(+v.despesas||0);return {cc,ca,lb,ll,mg:v.valor?ll/v.valor:0,cmv:cc+ca,c};}
export function estoque(d,c){return c.qtd-d.vendas.filter(v=>!v.excluido&&v.loteId===c.id).reduce((a,v)=>a+v.qtd,0);}
export function saldo(d,id,ate){const c=d.contas.find(x=>x.id===id);let s=c?+c.saldoInicial||0:0;d.lanc.forEach(l=>{if(l.excluido||(ate&&l.data>ate))return;if(l.tipo==='entrada'&&l.conta===id)s+=l.valor;else if(l.tipo==='saida'&&l.conta===id)s-=l.valor;else if(l.tipo==='transf'){if(l.conta===id)s-=l.valor;if(l.destino===id)s+=l.valor;}});return s;}
export function res(d,de,ate,ativ){const r={receita:0,deducao:0,custo:0,despesa:0,financeira:0,cats:{}};
  d.lanc.forEach(l=>{if(l.excluido||l.tipo==='transf'||l.estoque||l.data<de||l.data>ate||(ativ&&l.atividade!==ativ))return;let g=l.tipo==='entrada'?'receita':(GRUPO[l.categoria]||'despesa');if(l.tipo!=='entrada'&&g==='receita')g='despesa';r[g]+=l.valor;const k=g+'|'+l.categoria;r.cats[k]=(r.cats[k]||0)+l.valor;});
  if(!ativ||ativ==='gado')d.vendas.forEach(v=>{if(v.excluido||v.data<de||v.data>ate)return;const x=gv(d,v).cmv;r.custo+=x;r.cats['custo|Custo do gado vendido']=(r.cats['custo|Custo do gado vendido']||0)+x;});
  r.liq=r.receita-r.deducao;r.bruto=r.liq-r.custo;r.oper=r.bruto-r.despesa;r.lucro=r.oper-r.financeira;r.gastos=r.deducao+r.custo+r.despesa+r.financeira;return r;}
export function dreRows(r){const L=[];const line=(label,v,kind)=>L.push({label,v,kind,p:r.receita?v/r.receita:NaN});const cats=(g,neg)=>Object.keys(r.cats).filter(k=>k.startsWith(g+'|')).sort((a,b)=>r.cats[b]-r.cats[a]).forEach(k=>line(k.split('|')[1],neg?-r.cats[k]:r.cats[k],'cat'));
  line('Receita bruta',r.receita,'total');cats('receita');line('(−) Deduções e impostos',-r.deducao,'grupo');cats('deducao',1);line('= Receita líquida',r.liq,'sub');line('(−) Custos das mercadorias e operações',-r.custo,'grupo');cats('custo',1);line('= Lucro bruto',r.bruto,'sub');line('(−) Despesas operacionais',-r.despesa,'grupo');cats('despesa',1);line('= Resultado operacional',r.oper,'sub');line('(−) Despesas financeiras',-r.financeira,'grupo');cats('financeira',1);line('= Resultado líquido',r.lucro,'final');return L;}
export function stTit(x,P){if(x.status===(P?'Pago':'Recebido'))return x.status;return x.venc<TODAY?'Vencido':'Pendente';}
export function syncCompra(d,c){d.lanc=d.lanc.filter(l=>l.ref!=='gc:'+c.id);if(c.excluido)return;const b={data:c.data,atividade:'gado',pessoa:c.vendedor,forma:c.forma||'Transferência',conta:c.conta||bankId(d),usuario:c.usuario,criadoEm:c.criadoEm,origem:'gado',ref:'gc:'+c.id,estoque:true,tipo:'saida'};d.lanc.push(Object.assign({},b,{id:'l'+c.id,categoria:'Compra de gado',descricao:'Compra de gado – '+c.qtd+' cab.',valor:c.valor}));const ad=r2((+c.transporte||0)+(+c.comissao||0)+(+c.outros||0));if(ad>0)d.lanc.push(Object.assign({},b,{id:'l'+c.id+'a',categoria:'Frete e comissões',descricao:'Transporte, comissão e outros – compra',valor:ad}));}
export function syncVenda(d,v){d.lanc=d.lanc.filter(l=>l.ref!=='gv:'+v.id);if(v.excluido)return;const b={data:v.data,atividade:'gado',pessoa:v.comprador,forma:v.forma||'Transferência',conta:v.conta||bankId(d),usuario:v.usuario,criadoEm:v.criadoEm,origem:'gado',ref:'gv:'+v.id};d.lanc.push(Object.assign({},b,{id:'l'+v.id,tipo:'entrada',categoria:'Venda de gado',descricao:'Venda de gado – '+v.qtd+' cab.',valor:v.valor}));if(+v.despesas>0)d.lanc.push(Object.assign({},b,{id:'l'+v.id+'d',tipo:'saida',categoria:'Frete e comissões',descricao:'Despesas da venda de gado',valor:+v.despesas}));}
export function syncTit(d,x,P){const ref=(P?'cp:':'cr:')+x.id;d.lanc=d.lanc.filter(l=>l.ref!==ref);if(x.excluido||x.semLanc||x.status!==(P?'Pago':'Recebido'))return;d.lanc.push({id:'l'+x.id,ref,data:(P?x.pagoEm:x.recebidoEm)||TODAY,tipo:P?'saida':'entrada',atividade:x.atividade,categoria:x.categoria,descricao:x.descricao,pessoa:P?x.fornecedor:x.cliente,valor:x.valor,forma:x.forma||'PIX',conta:x.forma==='Dinheiro'?cxId(d):(x.conta||bankId(d)),usuario:x.usuario,criadoEm:nowISO(),origem:P?'contas a pagar':'contas a receber'});}

export function seed(){let s=11;const rnd=()=>{s|=0;s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};
  const R=(a,b)=>r2(a+rnd()*(b-a));const L=[],compras=[],vendas=[];let n=0;
  const add=o=>L.push(Object.assign({id:'s'+(++n),usuario:n%3?'admin':'socio',origem:'manual',pessoa:'',criadoEm:o.data+'T09:00:00'},o));
  const VEND=['Fazenda Boa Esperança','Fazenda Santa Clara','Sítio Lago Verde','Fazenda Três Marias','Fazenda Rio Formoso','Fazenda Barreiras','Fazenda Javaés'];
  const COMP=['Frigorífico Gurupi','Frigorífico Araguaína','Fazenda Santa Rita','Frigorífico Paraíso','Frigorífico Gurupi','Fazenda Santa Rita'];
  ['2026-05','2026-06','2026-07','2026-08','2026-09','2026-10','2026-11'].forEach((m,mi)=>{const nov=m==='2026-11';const last=nov?4:+mEnd(m).slice(8);const d=x=>m+'-'+pad(x);let fat=0;
    for(let x=1;x<=last;x+=2){const p=R(1700,2700),c=R(1000,1800),dn=R(500,1100);fat+=p+c+dn;
      add({data:d(x),tipo:'entrada',atividade:'carnes',categoria:'Vendas casa de carnes',descricao:'Vendas do dia – PIX',valor:p,forma:'PIX',conta:'sicoob'});
      add({data:d(x),tipo:'entrada',atividade:'carnes',categoria:'Vendas casa de carnes',descricao:'Vendas do dia – Cartão',valor:c,forma:'Cartão',conta:'bb'});
      add({data:d(x),tipo:'entrada',atividade:'carnes',categoria:'Vendas casa de carnes',descricao:'Vendas do dia – Dinheiro',valor:dn,forma:'Dinheiro',conta:'caixa'});}
    [3,10,17,24].forEach((x,i)=>{if(x<=last)add({data:d(x),tipo:'saida',atividade:'carnes',categoria:'Compra de mercadorias',descricao:i%2?'Frango e suínos':'Carcaças bovinas',pessoa:i%2?'Granja Formoso':'Frigorífico Boi Forte',valor:i%2?R(3800,5200):R(12000,14500),forma:'Boleto',conta:'sicoob'});});
    if(last>=6)add({data:d(6),tipo:'saida',atividade:'carnes',categoria:'Compra de mercadorias',descricao:'Embalagens e insumos',pessoa:'Distribuidora Araguaia',valor:R(1200,1900),forma:'Boleto',conta:'bb'});
    [7,14,21,28].forEach(x=>{if(x<=last)add({data:d(x),tipo:'transf',atividade:'geral',categoria:'Transferência',descricao:'Depósito do caixa',valor:R(2200,2900),forma:'Dinheiro',conta:'caixa',destino:'bb'});});
    if(last>=5){add({data:d(5),tipo:'saida',atividade:'carnes',categoria:'Salários',descricao:'Folha de pagamento',pessoa:'Funcionários',valor:8400,forma:'Transferência',conta:'bb'});add({data:d(5),tipo:'saida',atividade:'carnes',categoria:'Aluguel',descricao:'Aluguel da loja',pessoa:'Imobiliária Lagoa',valor:3000,forma:'Transferência',conta:'bb'});}
    if(last>=10)add({data:d(10),tipo:'saida',atividade:'carnes',categoria:'Energia e água',descricao:'Energia elétrica',pessoa:'Energisa',valor:R(1900,2450),forma:'Boleto',conta:'bb'});
    if(last>=20)add({data:d(20),tipo:'saida',atividade:'carnes',categoria:'Impostos',descricao:'Simples Nacional',pessoa:'Receita Federal',valor:r2(fat*0.06),forma:'Boleto',conta:'bb'});
    if(last>=12&&rnd()<.6)add({data:d(12),tipo:'saida',atividade:'carnes',categoria:'Manutenção',descricao:'Manutenção da câmara fria',pessoa:'Refrigeração Tocantins',valor:R(350,1200),forma:'Dinheiro',conta:'caixa'});
    if(last>=15){add({data:d(15),tipo:'saida',atividade:'geral',categoria:'Taxas bancárias',descricao:'Tarifas bancárias',pessoa:'Banco do Brasil',valor:R(95,160),forma:'Transferência',conta:'bb'});add({data:d(15),tipo:'saida',atividade:'gado',categoria:'Combustível',descricao:'Combustível – camionete',pessoa:'Posto Lagoa',valor:R(1100,1900),forma:'Cartão',conta:'bb'});}
    const cd=nov?3:2+Math.floor(rnd()*5);const qtd=nov?18:22+Math.floor(rnd()*18);const pa=R(390,440);const peso=Math.round(qtd*pa);const ar=R(298,316);const valor=r2(peso/30*ar);
    const c={id:'gc'+(mi+1),data:d(cd),vendedor:VEND[mi],qtd,pesoTotal:peso,arroba:ar,valor,transporte:R(2100,3200),comissao:r2(valor*0.015),outros:R(300,900),conta:nov?'bb':'sicoob',forma:'Transferência',usuario:'socio',criadoEm:d(cd)+'T10:00:00'};compras.push(c);
    if(mi<6){const vq=mi===5?Math.round(qtd*0.6):qtd;const vd=mi===5?28:18+Math.floor(rnd()*8);const vp=Math.round(vq*pa*R(1.01,1.05));const va=R(326,346);vendas.push({id:'gv'+(mi+1),data:d(vd),comprador:COMP[mi],loteId:c.id,qtd:vq,peso:vp,arroba:va,valor:r2(vp/30*va),despesas:R(1400,2600),conta:'sicoob',forma:'Transferência',usuario:'socio',criadoEm:d(vd)+'T15:00:00'});}
  });
  const P=(id,fornecedor,descricao,atividade,categoria,valor,venc,status,pagoEm,forma,conta)=>({id,fornecedor,descricao,atividade,categoria,valor,venc,status,pagoEm:pagoEm||'',forma:forma||'Boleto',conta:conta||'bb',usuario:'admin',semLanc:status==='Pago'});
  const Rc=(id,cliente,descricao,atividade,categoria,valor,venc,status,recebidoEm,forma,conta)=>({id,cliente,descricao,atividade,categoria,valor,venc,status,recebidoEm:recebidoEm||'',forma:forma||'PIX',conta:conta||'sicoob',usuario:'admin',semLanc:status==='Recebido'});
  const d={v:1,empresa:{nome:'Agropecuária JF',cidade:'Lagoa da Confusão – TO',telefone:'(63) 99224-6855',instagram:'@casadecarnes_jf',atividades:'Casa de carnes e compra e venda de gado'},
    users:[{id:'admin',nome:'Administrador',email:'admin@agropecuariajf.com.br',perfil:'Administrador',senha:hash('jf2026'),ultimoAcesso:'2026-11-03T18:40:00'},{id:'socio',nome:'Sócio',email:'socio@agropecuariajf.com.br',perfil:'Sócio',senha:hash('jf2026'),ultimoAcesso:'2026-11-03T14:22:00'}],
    contas:[{id:'bb',nome:'Banco do Brasil',tipo:'Conta corrente',agencia:'1234-5',numero:'45.678-9',saldoInicial:60000},{id:'sicoob',nome:'Sicoob',tipo:'Conta corrente',agencia:'3301',numero:'12.345-0',saldoInicial:150000},{id:'caixa',nome:'Caixa físico',tipo:'Caixa',agencia:'',numero:'',saldoInicial:2500}],
    lanc:L,compras,vendas,
    pagar:[P('p1','Frigorífico Boi Forte','Carcaças bovinas – NF 4512','carnes','Compra de mercadorias',10480,'2026-11-08','Pendente'),P('p2','Energisa','Energia elétrica – outubro','carnes','Energia e água',2236.4,'2026-11-10','Pendente'),P('p3','Imobiliária Lagoa','Aluguel da loja – novembro','carnes','Aluguel',3000,'2026-11-05','Pendente','','Transferência'),P('p4','Distribuidora Araguaia','Embalagens e insumos – NF 882','carnes','Compra de mercadorias',1870,'2026-10-30','Pendente'),P('p5','Transportadora Rio Formoso','Frete do lote de novembro','gado','Frete e comissões',2850,'2026-11-12','Pendente','','PIX','sicoob'),P('p6','Granja Formoso','Frango e suínos – NF 1290','carnes','Compra de mercadorias',4620,'2026-11-18','Pendente'),P('p7','Frigorífico Boi Forte','Carcaças bovinas – NF 4470','carnes','Compra de mercadorias',9920,'2026-10-24','Pago','2026-10-24'),P('p8','Sicoob','Tarifa do pacote de serviços','geral','Taxas bancárias',129.9,'2026-11-01','Pago','2026-11-01','Transferência','sicoob')],
    receber:[Rc('r1','Fazenda Santa Rita','Venda de gado a prazo – 2ª parcela','gado','Venda de gado',52300,'2026-11-15','Pendente','','Transferência'),Rc('r2','Restaurante Sabor do Cerrado','Fornecimento de carnes – outubro','carnes','Vendas casa de carnes',3240,'2026-11-10','Pendente'),Rc('r3','Mercado Lagoa','Fornecimento semanal','carnes','Vendas casa de carnes',2150,'2026-10-28','Pendente'),Rc('r4','Churrascaria Tocantins','Fornecimento de carnes – novembro','carnes','Vendas casa de carnes',4680,'2026-11-20','Pendente'),Rc('r5','Restaurante Sabor do Cerrado','Fornecimento de carnes – setembro','carnes','Vendas casa de carnes',2980,'2026-10-10','Recebido','2026-10-10')],
    fornecedores:[{id:'f1',nome:'Frigorífico Boi Forte',produto:'Carcaças bovinas',telefone:'(63) 99841-2207',documento:'12.345.678/0001-90'},{id:'f2',nome:'Granja Formoso',produto:'Frango e suínos',telefone:'(63) 99732-1180',documento:'23.456.789/0001-01'},{id:'f3',nome:'Distribuidora Araguaia',produto:'Embalagens e insumos',telefone:'(63) 3357-1420',documento:'34.567.890/0001-12'},{id:'f4',nome:'Temperos do Cerrado',produto:'Temperos e carvão',telefone:'(63) 99655-0912',documento:'45.678.901/0001-23'}],
    fechamentos:[],
    log:[{id:'g3',quando:'2026-11-03T14:22:00',usuario:'socio',acao:'Cadastrou',modulo:'Compra de Gado',detalhe:'Compra de 18 cab. – Fazenda Javaés'},{id:'g2',quando:'2026-11-01T09:10:00',usuario:'admin',acao:'Registrou pagamento',modulo:'Contas a Pagar',detalhe:'Tarifa do pacote de serviços · R$ 129,90'},{id:'g1',quando:'2026-10-28T16:05:00',usuario:'socio',acao:'Cadastrou',modulo:'Venda de Gado',detalhe:'Venda para Fazenda Santa Rita'}]};
  d.compras.forEach(c=>syncCompra(d,c));d.vendas.forEach(v=>syncVenda(d,v));return d;}
export function save(d){try{localStorage.setItem(NS,JSON.stringify(d));}catch(e){}}
export function loadBks(){try{return JSON.parse(localStorage.getItem(BK)||'[]');}catch(e){return [];}}
export function initState(){let data=null;try{data=JSON.parse(localStorage.getItem(NS)||'null');}catch(e){}const fresh=!data||data.v!==1;if(fresh)data=seed();let user=null;try{user=localStorage.getItem(SESS);}catch(e){}if(user&&!data.users.find(u=>u.id===user))user=null;
  const tm=TODAY.slice(0,7);const mes=+TODAY.slice(8)<10?mShift(tm,-1):tm;
  return {data,fresh,user,page:'dashboard',mes,tab:{},sel:-1,q:'',form:null,confirm:null,toast:'',narrow:false,menu:false,lEmail:'admin@agropecuariajf.com.br',lSenha:'',lErr:'',contaSel:'bb',dreTab:'Consolidado',drePer:'Mês selecionado',rep:1,repDe:TODAY.slice(0,4)+'-01-01',repAte:TODAY,imp:null,impConta:'bb',bkv:0};}
export function guess(desc,tipo){const t=norm(desc);const rules=[[/tarifa|pacote|iof|taxa/,'Taxas bancárias','geral'],[/energisa|energia|saneatins|agua/,'Energia e água','carnes'],[/frigorif|carcaca|granja|acougue/,'Compra de mercadorias','carnes'],[/aluguel/,'Aluguel','carnes'],[/salario|folha/,'Salários','carnes'],[/simples|darf|imposto|icms/,'Impostos','carnes'],[/posto|combust|diesel/,'Combustível','gado'],[/frete|transport|comiss/,'Frete e comissões','gado'],[/gado|bezerro|novilh|boi /,tipo==='entrada'?'Venda de gado':'Compra de gado','gado']];
  for(const [re,cat,at] of rules)if(re.test(t)&&(tipo==='entrada')===CAT_E.includes(cat))return {categoria:cat,atividade:at};
  return tipo==='entrada'?{categoria:/pix|venda|cartao|rede|cielo|stone/.test(t)?'Vendas casa de carnes':'Outras receitas',atividade:'carnes'}:{categoria:'Outras despesas',atividade:'geral'};}
export function pDate(v){if(typeof v==='number'&&v>20000){const d=new Date(Math.round((v-25569)*864e5));return d.toISOString().slice(0,10);}const s=String(v||'').trim();let m=s.match(/^(\d{2})\/(\d{2})\/(\d{4})/);if(m)return m[3]+'-'+m[2]+'-'+m[1];m=s.match(/^(\d{4})-(\d{2})-(\d{2})/);if(m)return m[0];m=s.match(/^(\d{4})(\d{2})(\d{2})/);if(m)return m[1]+'-'+m[2]+'-'+m[3];return '';}
export function csv(t){const lines=t.replace(/\r/g,'').split('\n').filter(x=>x.trim());if(!lines.length)return [];const dl=(lines[0].match(/;/g)||[]).length>=(lines[0].match(/,/g)||[]).length?';':',';return lines.map(l=>l.split(dl).map(c=>c.replace(/^"|"$/g,'').trim()));}


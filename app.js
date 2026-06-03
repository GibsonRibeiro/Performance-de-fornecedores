const FILES = {
  geral: "./data/geral.csv",
  saving: "./data/saving.csv"
};

let geralData = [];
let fornecedoresData = [];
let savingData = [];

const app = document.getElementById("app");

const CONDICOES_PAGAMENTO = {
  "6": 28,
  "2": 7,
  "91": 49,
  "14": 45,
  "45": 52.5,
  "136": 59,
  "12": 42,
  "9": 35,
  "19": 45,
  "31": 28,
  "105": 30,
  "26": 42,
  "23": 60,
  "17": 37.5,
  "28": 56,
  "10": 45,
  "39": 60,
  "29": 75,
  "8": 45,
  "7": 30,
  "20": 35,
  "30": 42,
  "11": 35,
  "3": 10,
  "84": 42,
  "4": 14,
  "5": 21,
  "153": 50,
  "106": 35,
  "52": 0,
  "32": 31.5,
  "82": 15,
  "53": 0,
  "24": 0,
  "67": 5,
  "56": 17.5,
  "85": 31.5,
  "99": 22.5,
  "122": 105,
  "47": 0,
  "152": 48,
  "151": 60,
  "150": 15,
  "88": 90,
  "137": 38.5,
  "155": 37.5,
  "16": 70,
  "21": 28,
  "156": 75,
  "154": 64,
  "149": 21
};

const FORNECEDORES_ESTRATEGICOS_FIXOS = [
  "IBERO INDUSTRIA BRASILEIRA DE EQUIP. RODOV. S A",
  "SAF-HOLLAND DO BRASIL IND PROD EIXOS E EQUIP",
  "COMPANHIA BRASILEIRA DE ALUMINIO",
  "PRE-FABRICAR CONSTRUCOES LTDA",
  "WEG TINTAS LTDA",
  "SINALSUL INDUSTRIA DE AUTO PECAS LTDA",
  "MADEIRAS EULIDE LTDA",
  "DAHER ACO INDUSTRIAL LTDA.",
  "FRAGON PRESTADORA DE SERVICOS E COMERCIO DE MATERIAIS DE CON",
  "ZF AUTOMOTIVE BRASIL LTDA",
  "RDR METAIS INDUSTRIAIS LTDA",
  "FIX IMPLEMENTOS RODOVIARIOS COMERCIO E SERVICOS LTDA",
  "AUSTRALIS LUMBER",
  "PERFILLINE COMPONENTES METALICOS LTDA",
  "BAUMANN IND E COM DE ACOS LTDA",
  "METALURGICA SCHILD LTDA"
];

function norm(text){
  return String(text || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g,"")
    .toLowerCase()
    .trim();
}

function esc(text){
  return String(text || "").replace(/[&<>"']/g, m => ({
    "&":"&amp;",
    "<":"&lt;",
    ">":"&gt;",
    '"':"&quot;",
    "'":"&#039;"
  }[m]));
}

function money(value){
  return Number(value || 0).toLocaleString("pt-BR", {
    style:"currency",
    currency:"BRL"
  });
}

function numberBR(text){
  const clean = String(text || "")
    .replace("R$","")
    .replace(/\./g,"")
    .replace(",",".")
    .replace(/[^\d.-]/g,"")
    .trim();

  return Number(clean) || 0;
}

function parsePercent(text){
  const value = String(text || "").replace("%","").trim();
  if(value === "") return null;

  const number = Number(value.replace(",","."));
  return Number.isFinite(number) ? number : null;
}

function parseDateBR(text){
  const raw = String(text || "").trim();
  if(!raw) return null;

  const parts = raw.split(/[\/\-]/);
  if(parts.length < 3) return null;

  let day = Number(parts[0]);
  let month = Number(parts[1]);
  let year = Number(parts[2]);

  if(year < 100) year += 2000;
  if(!day || !month || !year) return null;

  return new Date(year, month - 1, day);
}

function normalizeDate(date){
  if(!date) return null;
  const d = new Date(date);
  d.setHours(0,0,0,0);
  return d;
}

function addDays(date, days){
  if(!date) return null;
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  d.setHours(0,0,0,0);
  return d;
}

function diffDays(dateA, dateB){
  const a = normalizeDate(dateA);
  const b = normalizeDate(dateB);
  if(!a || !b) return null;
  return Math.round((a - b) / 86400000);
}

function daysUntil(date){
  if(!date) return null;
  const today = normalizeDate(new Date());
  const d = normalizeDate(date);
  return Math.ceil((d - today) / 86400000);
}

function diasTexto(dias){
  if(dias === null) return "Sem data";
  if(dias < 0) return `Atrasado há ${Math.abs(dias)} dias`;
  if(dias === 0) return "Vence hoje";
  return `Faltam ${dias} dias`;
}

function monthKeyFromDate(date){
  if(!date) return "";
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2,"0")}`;
}

function monthLabel(key){
  if(!key) return "";
  const [year, month] = key.split("-");
  const nomes = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
  return `${nomes[Number(month) - 1]}/${year}`;
}

function parseCSV(text){
  const firstLine = text.split(/\r?\n/)[0] || "";
  const delimiter = firstLine.includes(";") ? ";" : ",";

  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for(let i = 0; i < text.length; i++){
    const char = text[i];
    const next = text[i + 1];

    if(char === '"' && inQuotes && next === '"'){
      field += '"';
      i++;
    } else if(char === '"'){
      inQuotes = !inQuotes;
    } else if(char === delimiter && !inQuotes){
      row.push(field);
      field = "";
    } else if((char === "\n" || char === "\r") && !inQuotes){
      if(field || row.length){
        row.push(field);
        rows.push(row);
        row = [];
        field = "";
      }
      if(char === "\r" && next === "\n") i++;
    } else {
      field += char;
    }
  }

  if(field || row.length){
    row.push(field);
    rows.push(row);
  }

  return rows.filter(r => r.some(c => String(c).trim() !== ""));
}

async function loadCSV(path, required = true){
  const response = await fetch(path);

  if(!response.ok){
    if(required) throw new Error(`Erro ao carregar ${path} - HTTP ${response.status}`);
    return [];
  }

  const text = await response.text();
  const rows = parseCSV(text);

  if(rows.length <= 1){
    if(required) throw new Error(`Arquivo vazio ou sem dados: ${path}`);
    return [];
  }

  const headers = rows[0].map(h => String(h || "").trim().replace(/^\uFEFF/, ""));

  return rows.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => obj[h] = row[i] || "");
    return obj;
  });
}

function get(obj, names){
  const keys = Object.keys(obj);

  for(const name of names){
    const found = keys.find(k => norm(k) === norm(name));
    if(found) return obj[found];
  }

  return "";
}

function uniqueOptions(data, key){
  return [...new Set(data.map(item => item[key]).filter(Boolean))]
    .sort((a,b) => String(a).localeCompare(String(b), "pt-BR"));
}

function optionList(values, label){
  return `<option value="">${label}</option>` + values.map(v => {
    const safe = String(v).replaceAll('"',"&quot;");
    return `<option value="${safe}">${v}</option>`;
  }).join("");
}

function kpi(label, value, color, action = ""){
  const clickable = action ? `onclick="${action}" style="cursor:pointer"` : "";

  return `
    <div class="kpi" ${clickable}>
      <small>${label}</small>
      <strong class="${color}">${value}</strong>
    </div>
  `;
}

function group(data, key){
  const map = {};

  data.forEach(item => {
    const nome = item[key] || "Não informado";

    if(!map[nome]){
      map[nome] = {
        nome,
        items: []
      };
    }

    map[nome].items.push(item);
  });

  return map;
}

function barLine(label, value, cls, text, max){
  const width = max > 0 ? Math.max(2, (value / max) * 100) : 0;

  return `
    <div class="bar-row">
      <span>${esc(label)}</span>
      <div class="bar-bg">
        <div class="bar ${cls}" style="width:${width}%"></div>
      </div>
      <b>${text}</b>
    </div>
  `;
}

function barList(items, max){
  return items.map(([label, value, cls]) => {
    return barLine(label, value, cls, value, max);
  }).join("");
}

function renderFilterBar(config){
  return `
    <section class="filters">
      ${config.map(item => {
        if(item.type === "text"){
          return `<input id="${item.id}" placeholder="${item.placeholder}" value="${item.value || ""}">`;
        }

        return `
          <select id="${item.id}">
            ${optionList(item.options || [], item.label)}
          </select>
        `;
      }).join("")}
    </section>
  `;
}

function attachFilterEvents(ids, callback){
  ids.forEach(id => {
    const el = document.getElementById(id);
    if(!el) return;

    el.addEventListener("input", callback);
    el.addEventListener("change", callback);
  });
}

function getFilterValue(id){
  const el = document.getElementById(id);
  return el ? el.value : "";
}

function setFilterValue(id, value){
  const el = document.getElementById(id);
  if(!el) return;

  el.value = value;
  el.dispatchEvent(new Event("change"));
}

/* =========================
   MOTOR GERAL
========================= */

function calcularFaixa(previsaoInicialObj, dataRecebimentoObj){
  if(dataRecebimentoObj) return "Entregue";
  if(!previsaoInicialObj) return "Dentro do prazo";

  const hoje = normalizeDate(new Date());
  const previsao = normalizeDate(previsaoInicialObj);
  const limite = addDays(previsao, 7);

  if(hoje < previsao) return "Dentro do prazo";
  if(hoje < limite) return "Alerta";
  if(diffDays(hoje, limite) === 0) return "Crítico";
  return "Atrasado";
}

function mapGeralRows(rows){
  return rows.map(r => {
    const quantidade = numberBR(get(r, ["Quantidade Compra"]));
    const precoUnitario = numberBR(get(r, ["Preço Unit. Compra", "Preco Unit. Compra"]));
    const valor = quantidade * precoUnitario;

    const dataRecebimento = get(r, ["Data Recebimentos", "Data Recebimento", "Recebimento"]);
    const dataRecebimentoObj = parseDateBR(dataRecebimento);

    const previsaoInicial = get(r, [
      "Previsão Entrega Inicial",
      "Previsao Entrega Inicial",
      "Data Prevista Inicial"
    ]);

    const previsaoInicialObj = parseDateBR(previsaoInicial);
    const dataLimiteOperacionalObj = addDays(previsaoInicialObj, 7);

    const condicaoPagamento = String(get(r, ["Condição Pagamento", "Condicao Pagamento"])).trim();
    const prazoPagamento = CONDICOES_PAGAMENTO[condicaoPagamento] ?? 0;

    const faixa = calcularFaixa(previsaoInicialObj, dataRecebimentoObj);
    const entregue = !!dataRecebimentoObj;

    const diasAtrasoEntrega = entregue && dataLimiteOperacionalObj
      ? Math.max(0, diffDays(dataRecebimentoObj, dataLimiteOperacionalObj))
      : 0;

    const atrasoAberto = !entregue && dataLimiteOperacionalObj
      ? Math.max(0, diffDays(new Date(), dataLimiteOperacionalObj))
      : 0;

    const entregueNoPrazo = entregue && dataLimiteOperacionalObj
      ? dataRecebimentoObj <= dataLimiteOperacionalObj
      : false;

    return {
      pedido: get(r, ["Pedido", "Número Pedido", "Nº Pedido", "Num Pedido"]),
      produto: get(r, ["Produto", "Cod Produto", "Código Produto", "Codigo Produto"]),
      descricaoProduto: get(r, ["Descrição Produto", "Descricao Produto", "Desc Produto"]),
      fornecedor: get(r, ["Descrição Fornecedor", "Fornecedor"]),
      comprador: get(r, ["Nome Comprador", "Comprador"]),
      quantidade,
      precoUnitario,
      valor,
      condicaoPagamento,
      prazoPagamento,
      faixa,
      entregue,
      entregueNoPrazo,
      atraso: entregue ? diasAtrasoEntrega : atrasoAberto,
      dataRecebimento,
      dataRecebimentoObj,
      mesRecebimento: monthKeyFromDate(dataRecebimentoObj),
      previsaoInicial,
      previsaoInicialObj,
      dataLimiteOperacionalObj
    };
  }).filter(x => x.fornecedor || x.pedido);
}

async function ensureGeralData(){
  if(!geralData.length){
    geralData = mapGeralRows(await loadCSV(FILES.geral));
  }
}

/* =========================
   DASHBOARD GERAL
========================= */

function faixaClass(faixa){
  const f = norm(faixa);

  if(f.includes("atrasado")) return "badge-red";
  if(f.includes("critico")) return "badge-orange";
  if(f.includes("alerta")) return "badge-yellow";
  if(f.includes("dentro")) return "badge-green";
  if(f.includes("entregue")) return "badge-blue";

  return "badge-gray";
}

async function renderGeral(){
  app.innerHTML = `
    <section class="hero">
      <h1>Dashboard Geral</h1>
      <p>Carregando base geral...</p>
    </section>
  `;

  try{
    await ensureGeralData();
    renderGeralView(geralData);
  } catch(error){
    console.error("Erro Dashboard Geral:", error);

    app.innerHTML = `
      <section class="hero">
        <h1>Dashboard Geral</h1>
        <p>Erro ao carregar o arquivo <b>data/geral.csv</b>. Veja o Console com F12.</p>
      </section>
    `;
  }
}

function renderGeralView(base){
  const compradores = uniqueOptions(base, "comprador");
  const fornecedores = uniqueOptions(base, "fornecedor");
  const faixas = uniqueOptions(base, "faixa");
  const meses = uniqueOptions(base.filter(x => x.mesRecebimento), "mesRecebimento");

  app.innerHTML = `
    <section class="hero">
      <h1>Dashboard Geral</h1>
      <p>Indicadores calculados automaticamente a partir do CSV bruto.</p>
    </section>

    ${renderFilterBar([
      {type:"select", id:"geralComprador", label:"Todos compradores", options:compradores},
      {type:"select", id:"geralFornecedor", label:"Todos fornecedores", options:fornecedores},
      {type:"text", id:"geralPedido", placeholder:"Buscar por número do pedido"},
      {type:"select", id:"geralFaixa", label:"Todas faixas de risco", options:faixas},
      {type:"select", id:"geralMes", label:"Todos meses recebidos", options:meses}
    ])}

    <div id="geralContent"></div>
  `;

  attachFilterEvents(
    ["geralComprador","geralFornecedor","geralPedido","geralFaixa","geralMes"],
    () => renderGeralContent(base)
  );

  renderGeralContent(base);
}

function filterGeral(base){
  const comprador = getFilterValue("geralComprador");
  const fornecedor = getFilterValue("geralFornecedor");
  const pedido = norm(getFilterValue("geralPedido"));
  const faixa = getFilterValue("geralFaixa");
  const mes = getFilterValue("geralMes");

  return base.filter(x => {
    return (!comprador || x.comprador === comprador) &&
      (!fornecedor || x.fornecedor === fornecedor) &&
      (!pedido || norm(x.pedido).includes(pedido)) &&
      (!faixa || x.faixa === faixa) &&
      (!mes || x.mesRecebimento === mes);
  });
}

function aplicarFiltroGeralFaixa(faixa){
  setFilterValue("geralFaixa", faixa);
}

function aplicarFiltroGeralMes(mes){
  setFilterValue("geralMes", mes);
}

function limparFiltrosGeral(){
  setFilterValue("geralComprador", "");
  setFilterValue("geralFornecedor", "");
  setFilterValue("geralPedido", "");
  setFilterValue("geralFaixa", "");
  setFilterValue("geralMes", "");
}

async function gerarRelatorioAtencao(){
  await ensureGeralData();

  const comprador = getFilterValue("geralComprador");
  const fornecedor = getFilterValue("geralFornecedor");
  const pedidoBusca = norm(getFilterValue("geralPedido"));

  const base = geralData.filter(x => {
    const dias = daysUntil(x.previsaoInicialObj);

    return !x.entregue &&
      dias !== null &&
      dias <= 10 &&
      (!comprador || x.comprador === comprador) &&
      (!fornecedor || x.fornecedor === fornecedor) &&
      (!pedidoBusca || norm(x.pedido).includes(pedidoBusca));
  }).sort((a,b) => {
    const da = daysUntil(a.previsaoInicialObj);
    const db = daysUntil(b.previsaoInicialObj);
    return da - db;
  });

  const total = base.reduce((s,x) => s + x.valor, 0);
  const atrasados = base.filter(x => daysUntil(x.previsaoInicialObj) < 0).length;
  const vencendo = base.filter(x => {
    const d = daysUntil(x.previsaoInicialObj);
    return d >= 0 && d <= 10;
  }).length;

  const tituloComprador = comprador || "Todos os compradores";
  const dataEmissao = new Date().toLocaleDateString("pt-BR");

  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>Relatório de Pedidos em Atenção</title>
<style>
  body{font-family:Arial,Helvetica,sans-serif;margin:0;color:#f8fafc;background:#020617;}
  .page{padding:30px;}
  .header{display:flex;justify-content:space-between;align-items:center;border-bottom:4px solid #dc2626;padding-bottom:18px;margin-bottom:22px;}
  .logo-box{background:#020617;border:1px solid #334155;border-radius:14px;padding:14px 18px;}
  .logo{max-width:260px;display:block;}
  h1{font-size:25px;margin:0;color:#f8fafc;}
  .sub{color:#94a3b8;margin-top:7px;font-size:13px;}
  .print-btn{margin-top:12px;background:#dc2626;color:white;border:0;border-radius:10px;padding:10px 16px;font-weight:bold;cursor:pointer;}
  .meta{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin:18px 0;}
  .card{border:1px solid #334155;border-radius:14px;padding:13px;background:#0f172a;}
  .card small{display:block;color:#94a3b8;font-size:11px;text-transform:uppercase;font-weight:bold;}
  .card strong{display:block;margin-top:7px;font-size:20px;color:#f8fafc;}
  .criteria{font-size:12px;color:#cbd5e1;background:#0f172a;border:1px solid #334155;border-radius:12px;padding:13px;margin-bottom:16px;line-height:1.6;}
  table{width:100%;border-collapse:collapse;font-size:11px;background:#020617;border:1px solid #334155;}
  th{background:#111827;color:#f8fafc;text-align:left;padding:8px;border-bottom:1px solid #334155;}
  td{border-bottom:1px solid #1e293b;padding:7px;vertical-align:top;color:#e5e7eb;}
  tr:nth-child(even){background:#0f172a;}
  .late{color:#f87171;font-weight:bold;}
  .soon{color:#facc15;font-weight:bold;}
  .footer{margin-top:18px;font-size:10px;color:#94a3b8;text-align:right;}
  @media print{
    body{background:#020617;color:#f8fafc;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
    .print-btn{display:none;}
    .page{padding:14px;}
    table{font-size:9px;}
    th,td{padding:5px;}
  }
</style>
</head>

<body>
<div class="page">
  <div class="header">
    <div class="logo-box">
      <img src="logo-linshalm.png" class="logo">
    </div>
    <div style="text-align:right">
      <h1>Relatório de Follow-up</h1>
      <div class="sub">Pedidos em atenção por Previsão Entrega Inicial</div>
      <button class="print-btn" onclick="window.print()">Imprimir / Salvar PDF</button>
    </div>
  </div>

  <div class="meta">
    <div class="card"><small>Comprador</small><strong>${esc(tituloComprador)}</strong></div>
    <div class="card"><small>Linhas em atenção</small><strong>${base.length}</strong></div>
    <div class="card"><small>Atrasados</small><strong>${atrasados}</strong></div>
    <div class="card"><small>Vencendo em até 10 dias</small><strong>${vencendo}</strong></div>
  </div>

  <div class="criteria">
    <b>Critério:</b> linhas não entregues com <b>Previsão Entrega Inicial</b> já vencida ou vencendo em até 10 dias.
    ${fornecedor ? `<br><b>Fornecedor filtrado:</b> ${esc(fornecedor)}` : ""}
    ${pedidoBusca ? `<br><b>Pedido filtrado:</b> ${esc(pedidoBusca)}` : ""}
    <br><b>Valor total em atenção:</b> ${money(total)}
    <br><b>Emitido em:</b> ${dataEmissao}
  </div>

  <table>
    <thead>
      <tr>
        <th>Pedido</th>
        <th>Produto</th>
        <th>Descrição Produto</th>
        <th>Fornecedor</th>
        <th>Comprador</th>
        <th>Valor</th>
        <th>Previsão Entrega Inicial</th>
        <th>Dias</th>
      </tr>
    </thead>
    <tbody>
      ${base.map(x => {
        const dias = daysUntil(x.previsaoInicialObj);
        const cls = dias < 0 ? "late" : "soon";

        return `
          <tr>
            <td>${esc(x.pedido)}</td>
            <td>${esc(x.produto)}</td>
            <td>${esc(x.descricaoProduto)}</td>
            <td>${esc(x.fornecedor)}</td>
            <td>${esc(x.comprador)}</td>
            <td>${money(x.valor)}</td>
            <td>${esc(x.previsaoInicial)}</td>
            <td class="${cls}">${esc(diasTexto(dias))}</td>
          </tr>
        `;
      }).join("")}
    </tbody>
  </table>

  <div class="footer">Desenvolvido por Gibson C Ribeiro • Linshalm</div>
</div>
</body>
</html>
`;

  const win = window.open("", "_blank");
  win.document.open();
  win.document.write(html);
  win.document.close();
}

function renderGeralContent(base){
  const data = filterGeral(base);
  const content = document.getElementById("geralContent");

  const countFaixa = name => data.filter(x => norm(x.faixa) === norm(name)).length;

  const atrasados = countFaixa("Atrasado");
  const criticos = countFaixa("Crítico");
  const alerta = countFaixa("Alerta");
  const dentro = countFaixa("Dentro do prazo");
  const entregues = countFaixa("Entregue");
  const totalComprado = data.reduce((sum, x) => sum + x.valor, 0);

  const prazoMedioPonderado = totalComprado > 0
    ? Math.round(data.reduce((sum, x) => sum + (x.valor * x.prazoPagamento), 0) / totalComprado)
    : 0;

  const entreguesData = data.filter(x => x.entregue);
  const entreguesNoPrazo = entreguesData.filter(x => x.entregueNoPrazo).length;

  const perfEntrega = entreguesData.length
    ? Math.round((entreguesNoPrazo / entreguesData.length) * 100)
    : 0;

  const porComprador = group(data, "comprador");

  const porFaixa = [
    ["Atrasado", atrasados, "bar-red"],
    ["Crítico", criticos, "bar-orange"],
    ["Alerta", alerta, "bar-yellow"],
    ["Dentro do prazo", dentro, "bar-green"]
  ];

  const performanceComprador = Object.values(porComprador).map(g => {
    const entregues = g.items.filter(x => x.entregue);
    const ok = entregues.filter(x => x.entregueNoPrazo).length;

    return {
      nome: g.nome,
      perf: entregues.length ? Math.round((ok / entregues.length) * 100) : 0
    };
  }).sort((a,b) => b.perf - a.perf);

  const topFornecedores = Object.values(group(data, "fornecedor"))
    .map(g => ({
      nome: g.nome,
      valor: g.items.reduce((sum, x) => sum + x.valor, 0)
    }))
    .sort((a,b) => b.valor - a.valor)
    .slice(0, 10);

  const rankingCompras = Object.values(porComprador)
    .map(g => ({
      nome: g.nome,
      valor: g.items.reduce((sum, x) => sum + x.valor, 0)
    }))
    .sort((a,b) => b.valor - a.valor);

  const recebidosPorMes = Object.values(group(data.filter(x => x.mesRecebimento), "mesRecebimento"))
    .map(g => ({
      mes: g.nome,
      label: monthLabel(g.nome),
      valor: g.items.reduce((sum,x) => sum + x.valor, 0)
    }))
    .sort((a,b) => a.mes.localeCompare(b.mes));

  const maxMes = Math.max(...recebidosPorMes.map(x => x.valor), 1);
  const mesAtivo = getFilterValue("geralMes");

  content.innerHTML = `
    <section class="kpis">
      ${kpi("Registros filtrados", data.length, "blue", "limparFiltrosGeral()")}
      ${kpi("Atrasados", atrasados, "red", "aplicarFiltroGeralFaixa('Atrasado')")}
      ${kpi("Crítico", criticos, "orange", "aplicarFiltroGeralFaixa('Crítico')")}
      ${kpi("Alerta", alerta, "yellow", "aplicarFiltroGeralFaixa('Alerta')")}
      ${kpi("Dentro do prazo", dentro, "green", "aplicarFiltroGeralFaixa('Dentro do prazo')")}
      ${kpi("Entregues", entregues, "blue", "aplicarFiltroGeralFaixa('Entregue')")}
      ${kpi("Total comprado", money(totalComprado), "blue")}
      ${kpi("Prazo médio", `${prazoMedioPonderado} dias`, "blue")}
      ${kpi("Entregues no prazo", `${perfEntrega}%`, "green")}
    </section>

    <section class="panel-grid">
      <div class="panel">
        <h2>Pedidos em aberto</h2>
        ${barList(porFaixa, Math.max(...porFaixa.map(x => x[1]), 1))}
      </div>

      <div class="panel">
        <h2>Performance por comprador</h2>
        ${performanceComprador.map(x => barLine(x.nome, x.perf, "bar-blue", `${x.perf}%`, 100)).join("")}
      </div>

      <div class="panel">
        <h2>Top fornecedores por valor</h2>
        ${topFornecedores.map(x => barLine(x.nome, x.valor, "bar-red", money(x.valor), topFornecedores[0]?.valor || 1)).join("")}
      </div>

      <div class="panel">
        <h2>Ranking de compras por comprador</h2>
        ${rankingCompras.map(x => barLine(x.nome, x.valor, "bar-red", money(x.valor), rankingCompras[0]?.valor || 1)).join("")}
      </div>
    </section>

    <section class="panel" style="margin-bottom:22px;">
      <h2>Total recebido por mês</h2>

      <div class="month-chart">
        ${recebidosPorMes.map(x => `
          <div class="month-bar ${mesAtivo === x.mes ? "active" : ""}" onclick="aplicarFiltroGeralMes('${x.mes}')">
            <div class="month-bar-value">${money(x.valor)}</div>
            <div class="month-bar-fill" style="height:${Math.max(18,(x.valor / maxMes) * 210)}px"></div>
            <div class="month-bar-label">${x.label}</div>
          </div>
        `).join("")}
      </div>
    </section>

    <section class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Pedido</th>
            <th>Produto</th>
            <th>Descrição Produto</th>
            <th>Fornecedor</th>
            <th>Comprador</th>
            <th>Qtd</th>
            <th>Preço Unit.</th>
            <th>Valor</th>
            <th>Condição</th>
            <th>Prazo Pgto</th>
            <th>Faixa</th>
            <th>Atraso</th>
            <th>Data recebimento</th>
            <th>Previsão Entrega Inicial</th>
          </tr>
        </thead>

        <tbody>
          ${data.slice(0, 1500).map(x => `
            <tr>
              <td>${esc(x.pedido || "—")}</td>
              <td>${esc(x.produto || "—")}</td>
              <td>${esc(x.descricaoProduto || "—")}</td>
              <td><b>${esc(x.fornecedor || "—")}</b></td>
              <td>${esc(x.comprador || "—")}</td>
              <td>${x.quantidade}</td>
              <td>${money(x.precoUnitario)}</td>
              <td>${money(x.valor)}</td>
              <td>${esc(x.condicaoPagamento || "—")}</td>
              <td>${x.prazoPagamento} dias</td>
              <td><span class="badge ${faixaClass(x.faixa)}">${esc(x.faixa || "—")}</span></td>
              <td>${x.atraso}</td>
              <td>${esc(x.dataRecebimento || "—")}</td>
              <td>${esc(x.previsaoInicial || "—")}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </section>
  `;
}

/* =========================
   RANKING FORNECEDORES — GERADO PELO GERAL.CSV
========================= */

function statusFornecedorClass(status){
  const s = norm(status);

  if(s === "estrategico") return "estrategico";
  if(s === "alavancavel") return "alavancavel";
  if(s === "gargalo") return "gargalo";

  return "nao-critico";
}

function perfColor(perf){
  if(perf === null) return "orange";
  if(perf >= 85) return "green";
  if(perf >= 70) return "yellow";
  return "red";
}

function perfText(perf){
  return perf === null ? "Sem medição" : `${perf}%`;
}

function classificarFornecedorAutomatico(fornecedor, valor, performance, pedidos){
  const nome = norm(fornecedor);
  const ehEstrategico = FORNECEDORES_ESTRATEGICOS_FIXOS.some(item => norm(item) === nome);

  if(ehEstrategico) return "Estratégico";
  if(pedidos <= 1) return "Não crítico";
  if(performance !== null && performance >= 60 && valor >= 100000) return "Alavancável";
  if(performance !== null && performance >= 60 && valor < 100000) return "Não crítico";

  return "Gargalo";
}

async function renderFornecedores(){
  app.innerHTML = `
    <section class="hero">
      <h1>Ranking de Fornecedores</h1>
      <p>Carregando matriz Kraljic...</p>
    </section>
  `;

  try{
    await ensureGeralData();

    fornecedoresData = Object.values(group(geralData, "fornecedor"))
      .map(g => {
        const valor = g.items.reduce((sum,x) => sum + x.valor, 0);

        const entregues = g.items.filter(x => x.entregue);
        const ok = entregues.filter(x => x.entregueNoPrazo).length;
        const performance = entregues.length ? Math.round((ok / entregues.length) * 100) : null;

        const pedidos = new Set(g.items.map(x => x.pedido).filter(Boolean)).size;

        const compradorPrincipal = Object.values(group(g.items, "comprador"))
          .map(c => ({
            nome:c.nome,
            valor:c.items.reduce((sum,x) => sum + x.valor, 0)
          }))
          .sort((a,b) => b.valor - a.valor)[0]?.nome || "Não informado";

        return {
          fornecedor:g.nome,
          valor,
          comprador:compradorPrincipal,
          performance,
          pedidos,
          plano:"",
          situacao:classificarFornecedorAutomatico(g.nome, valor, performance, pedidos)
        };
      })
      .sort((a,b) => b.valor - a.valor)
      .map((x,i) => ({
        ...x,
        classificacao:i + 1
      }));

    renderFornecedoresView(fornecedoresData);
  } catch(error){
    console.error("Erro Ranking Fornecedores:", error);

    app.innerHTML = `
      <section class="hero">
        <h1>Ranking de Fornecedores</h1>
        <p>Erro ao gerar o ranking a partir do <b>data/geral.csv</b>. Veja o Console com F12.</p>
      </section>
    `;
  }
}

function renderFornecedoresView(base){
  const compradores = uniqueOptions(base, "comprador");
  const fornecedores = uniqueOptions(base, "fornecedor");
  const situacoes = uniqueOptions(base, "situacao");

  app.innerHTML = `
    <section class="hero">
      <h1>Ranking de Fornecedores / Matriz Kraljic</h1>
      <p>Ranking gerado automaticamente a partir do arquivo geral.csv.</p>
    </section>

    ${renderFilterBar([
      {type:"select", id:"fornComprador", label:"Todos compradores", options:compradores},
      {type:"select", id:"fornFornecedor", label:"Todos fornecedores", options:fornecedores},
      {type:"select", id:"fornSituacao", label:"Todas situações", options:situacoes},
      {type:"select", id:"fornPerf", label:"Todas performances", options:["Sem medição", "Boa ≥ 85%", "Alerta 60% a 84%", "Crítica < 60%"]},
      {type:"text", id:"fornBusca", placeholder:"Buscar fornecedor"}
    ])}

    <div id="fornecedoresContent"></div>
  `;

  attachFilterEvents(
    ["fornComprador","fornFornecedor","fornSituacao","fornPerf","fornBusca"],
    () => renderFornecedoresContent(base)
  );

  renderFornecedoresContent(base);
}

function filterFornecedores(base){
  const comprador = getFilterValue("fornComprador");
  const fornecedor = getFilterValue("fornFornecedor");
  const situacao = getFilterValue("fornSituacao");
  const perf = getFilterValue("fornPerf");
  const busca = norm(getFilterValue("fornBusca"));

  return base.filter(x => {
    const fullText = norm(`${x.fornecedor} ${x.comprador} ${x.situacao}`);

    const passaPerf =
      !perf ||
      (perf === "Sem medição" && x.performance === null) ||
      (perf === "Boa ≥ 85%" && x.performance !== null && x.performance >= 85) ||
      (perf === "Alerta 60% a 84%" && x.performance !== null && x.performance >= 60 && x.performance < 85) ||
      (perf === "Crítica < 60%" && x.performance !== null && x.performance < 60);

    return (!comprador || x.comprador === comprador) &&
      (!fornecedor || x.fornecedor === fornecedor) &&
      (!situacao || x.situacao === situacao) &&
      passaPerf &&
      (!busca || fullText.includes(busca));
  }).sort((a,b) => a.classificacao - b.classificacao);
}

function aplicarFiltroFornecedorSituacao(situacao){
  setFilterValue("fornSituacao", situacao);
}

function aplicarFiltroFornecedorPerf(valor){
  setFilterValue("fornPerf", valor);
}

function limparFiltrosFornecedores(){
  setFilterValue("fornComprador", "");
  setFilterValue("fornFornecedor", "");
  setFilterValue("fornSituacao", "");
  setFilterValue("fornPerf", "");
  setFilterValue("fornBusca", "");
}

function renderFornecedoresContent(base){
  const data = filterFornecedores(base);
  const content = document.getElementById("fornecedoresContent");

  const situacoesPadrao = ["Estratégico", "Alavancável", "Gargalo", "Não crítico"];
  const total = data.reduce((sum, x) => sum + x.valor, 0);

  content.innerHTML = `
    <section class="kpis">
      ${kpi("Fornecedores", data.length, "blue", "limparFiltrosFornecedores()")}
      ${kpi("Valor total", money(total), "blue")}
      ${kpi("Estratégicos", data.filter(x => x.situacao === "Estratégico").length, "green", "aplicarFiltroFornecedorSituacao('Estratégico')")}
      ${kpi("Alavancáveis", data.filter(x => x.situacao === "Alavancável").length, "blue", "aplicarFiltroFornecedorSituacao('Alavancável')")}
      ${kpi("Gargalos", data.filter(x => x.situacao === "Gargalo").length, "red", "aplicarFiltroFornecedorSituacao('Gargalo')")}
      ${kpi("Não críticos", data.filter(x => x.situacao === "Não crítico").length, "orange", "aplicarFiltroFornecedorSituacao('Não crítico')")}
      ${kpi("Sem medição", data.filter(x => x.performance === null).length, "orange", "aplicarFiltroFornecedorPerf('Sem medição')")}
    </section>

    <section class="matrix">
      ${situacoesPadrao.map(s => {
        const groupItems = data.filter(x => x.situacao === s);
        const value = groupItems.reduce((sum, x) => sum + x.valor, 0);

        return `
          <div class="quad ${statusFornecedorClass(s)}">
            <h2>${s}</h2>
            <div class="quad-meta">${groupItems.length} fornecedores • ${money(value)}</div>

            <div class="supplier-grid">
              ${groupItems.map(x => `
                <div class="supplier">
                  <h3>${x.classificacao}. ${esc(x.fornecedor)}</h3>
                  <div class="row"><span>${esc(x.comprador || "—")}</span><b>${money(x.valor)}</b></div>
                  <div class="row">
                    <span>Entrega</span>
                    <span class="${perfColor(x.performance)}">${perfText(x.performance)}</span>
                  </div>
                  <div class="row">
                    <span>Pedidos</span>
                    <b>${x.pedidos}</b>
                  </div>
                </div>
              `).join("")}
            </div>
          </div>
        `;
      }).join("")}
    </section>
  `;
}

/* =========================
   RANKING SAVING INPUTÁVEL
========================= */

const SAVING_STORAGE_KEY = "linshalm_savings_v1";

let savingRegistros = [];

function uid(){
  return "SV" + Date.now() + Math.floor(Math.random() * 9999);
}

function salvarSavingsLocal(){
  localStorage.setItem(SAVING_STORAGE_KEY, JSON.stringify(savingRegistros));
}

function carregarSavingsLocal(){
  try{
    savingRegistros = JSON.parse(localStorage.getItem(SAVING_STORAGE_KEY) || "[]");
  }catch(e){
    savingRegistros = [];
  }
}

function statusAtivo(x){
  return norm(x.status) !== "declinado";
}

function calcularSavingRegistro(r){
  const categoria = r.categoria || "Saving";
  const tipo = r.tipo || "Spot";
  const quantidade = numberBR(r.quantidade);
  const precoAtual = numberBR(r.precoAtual);

  let vencedor = "";
  let precoNegociado = 0;

  if(categoria === "Saving"){
    const competidores = [
      {nome:r.competidorA, preco:numberBR(r.precoCompetidorA)},
      {nome:r.competidorB, preco:numberBR(r.precoCompetidorB)},
      {nome:r.competidorC, preco:numberBR(r.precoCompetidorC)}
    ].filter(x => x.nome && x.preco > 0)
     .sort((a,b) => a.preco - b.preco);

    vencedor = competidores[0]?.nome || "";
    precoNegociado = competidores[0]?.preco || 0;

    const savingUnitario = precoAtual - precoNegociado;
    const savingMensal = quantidade * savingUnitario;
    const savingTotal = tipo === "Anual" ? savingMensal * 12 : savingMensal;
    const custoReferencia = tipo === "Anual" ? quantidade * precoAtual * 12 : quantidade * precoAtual;
    const reducaoPercentual = precoAtual > 0 ? (savingUnitario / precoAtual) * 100 : 0;

    return {
      ...r,
      vencedor,
      precoNegociado,
      savingUnitario,
      savingMensal,
      savingTotal,
      costAvoidanceUnitario:0,
      costAvoidanceMensal:0,
      costAvoidanceTotal:0,
      impactoTotal:savingTotal,
      custoReferencia,
      reducaoPercentual
    };
  }

  const reajusteSolicitado = numberBR(r.reajusteSolicitado);
  const reajusteAcordado = numberBR(r.reajusteAcordado);

  const precoSolicitado = precoAtual * (1 + reajusteSolicitado / 100);
  const precoAcordado = precoAtual * (1 + reajusteAcordado / 100);

  const costAvoidanceUnitario = precoSolicitado - precoAcordado;
  const costAvoidanceMensal = quantidade * costAvoidanceUnitario;
  const costAvoidanceTotal = costAvoidanceMensal * 12;
  const custoReferencia = quantidade * precoSolicitado * 12;
  const reducaoPercentual = reajusteSolicitado - reajusteAcordado;

  return {
    ...r,
    vencedor:r.fornecedorAtual,
    precoNegociado:precoAcordado,
    savingUnitario:0,
    savingMensal:0,
    savingTotal:0,
    precoSolicitado,
    precoAcordado,
    costAvoidanceUnitario,
    costAvoidanceMensal,
    costAvoidanceTotal,
    impactoTotal:costAvoidanceTotal,
    custoReferencia,
    reducaoPercentual
  };
}

function savingsCalculados(){
  return savingRegistros.map(calcularSavingRegistro);
}

async function renderSaving(){
  carregarSavingsLocal();
  renderSavingView(savingsCalculados());
}

function renderSavingView(base){
  const compradores = uniqueOptions(base, "comprador");
  const status = uniqueOptions(base, "status");
  const categorias = uniqueOptions(base, "categoria");

  app.innerHTML = `
    <section class="hero">
      <h1>Ranking de Saving</h1>
      <p>Controle de saving, reajustes e cost avoidance com inclusão manual, importação e exportação CSV.</p>
    </section>

    <section class="saving-actions">
      <button class="action-btn" onclick="abrirModalSaving('Saving')">Incluir Saving</button>
      <button class="action-btn" onclick="abrirModalSaving('Reajuste')">Incluir Reajuste</button>
      <label class="action-btn file-btn">
        Importar CSV
        <input type="file" accept=".csv" onchange="importarSavingCSV(event)">
      </label>
      <button class="action-btn secondary" onclick="exportarSavingCSV()">Baixar CSV consolidado</button>
    </section>

    ${renderFilterBar([
      {type:"select", id:"savingCategoria", label:"Todas categorias", options:categorias},
      {type:"select", id:"savingComprador", label:"Todos compradores", options:compradores},
      {type:"select", id:"savingStatus", label:"Todos status", options:status},
      {type:"text", id:"savingBusca", placeholder:"Buscar código, item ou fornecedor"}
    ])}

    <div id="savingContent"></div>
    <div id="savingModal"></div>
  `;

  attachFilterEvents(
    ["savingCategoria","savingComprador","savingStatus","savingBusca"],
    () => renderSavingContent(savingsCalculados())
  );

  renderSavingContent(base);
}

function filterSaving(base){
  const categoria = getFilterValue("savingCategoria");
  const comprador = getFilterValue("savingComprador");
  const status = getFilterValue("savingStatus");
  const busca = norm(getFilterValue("savingBusca"));

  return base.filter(x => {
    const fullText = norm(`${x.codigo} ${x.descricao} ${x.fornecedorAtual} ${x.vencedor} ${x.comprador} ${x.status}`);

    return (!categoria || x.categoria === categoria) &&
      (!comprador || x.comprador === comprador) &&
      (!status || x.status === status) &&
      (!busca || fullText.includes(busca));
  });
}

function renderSavingContent(base){
  const data = filterSaving(base);
  const ativos = data.filter(statusAtivo);

  const homologados = ativos.filter(x => norm(x.status) === "homologado");
  const pipeline = ativos.filter(x => norm(x.status).includes("curso"));

  const savingHomologado = homologados.reduce((s,x) => s + x.savingTotal, 0);
  const savingPipeline = pipeline.reduce((s,x) => s + x.savingTotal, 0);

  const caHomologado = homologados.reduce((s,x) => s + x.costAvoidanceTotal, 0);
  const caPipeline = pipeline.reduce((s,x) => s + x.costAvoidanceTotal, 0);

  const impactoTotal = savingHomologado + caHomologado;

  const porComprador = Object.values(group(ativos, "comprador"))
    .map(g => ({
      nome:g.nome,
      valor:g.items.reduce((s,x) => s + x.savingTotal + x.costAvoidanceTotal, 0)
    }))
    .sort((a,b) => b.valor - a.valor);

  const maxComprador = Math.max(...porComprador.map(x => Math.abs(x.valor)), 1);

  const content = document.getElementById("savingContent");

  content.innerHTML = `
    <section class="kpis">
      ${kpi("Registros", data.length, "blue", "limparFiltrosSaving()")}
      ${kpi("Saving homologado", money(savingHomologado), "green")}
      ${kpi("Saving pipeline", money(savingPipeline), "orange")}
      ${kpi("Cost Avoidance homologado", money(caHomologado), "green")}
      ${kpi("Cost Avoidance pipeline", money(caPipeline), "orange")}
      ${kpi("Impacto total homologado", money(impactoTotal), "blue")}
      ${kpi("Declinados", data.filter(x => norm(x.status) === "declinado").length, "red")}
    </section>

    <section class="panel-grid">
      <div class="panel">
        <h2>Impacto por comprador</h2>
        ${porComprador.map(x => barLine(x.nome, Math.abs(x.valor), "bar-blue", money(x.valor), maxComprador)).join("")}
      </div>

      <div class="panel">
        <h2>Resumo por categoria</h2>
        ${barLine("Saving", Math.abs(savingHomologado), "bar-green", money(savingHomologado), Math.max(Math.abs(savingHomologado), Math.abs(caHomologado), 1))}
        ${barLine("Cost Avoidance", Math.abs(caHomologado), "bar-orange", money(caHomologado), Math.max(Math.abs(savingHomologado), Math.abs(caHomologado), 1))}
      </div>
    </section>

    <section class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Categoria</th>
            <th>Tipo</th>
            <th>Data</th>
            <th>Comprador</th>
            <th>Código</th>
            <th>Descrição</th>
            <th>Fornecedor Atual</th>
            <th>Vencedor</th>
            <th>Status</th>
            <th>Qtd</th>
            <th>Preço Atual</th>
            <th>Preço Final</th>
            <th>Saving Total</th>
            <th>Cost Avoidance</th>
            <th>Redução</th>
            <th>Ações</th>
          </tr>
        </thead>

        <tbody>
          ${data.map(x => `
            <tr class="${norm(x.status) === "declinado" ? "declined-row" : ""}">
              <td>${esc(x.categoria)}</td>
              <td>${esc(x.tipo)}</td>
              <td>${esc(x.data)}</td>
              <td>${esc(x.comprador)}</td>
              <td>${esc(x.codigo)}</td>
              <td><b>${esc(x.descricao)}</b></td>
              <td>${esc(x.fornecedorAtual)}</td>
              <td>${esc(x.vencedor || "—")}</td>
              <td>
                <select class="status-select" onchange="alterarStatusSaving('${x.id}', this.value)">
                  ${["Homologação em curso","Homologado","Declinado"].map(s => `
                    <option value="${s}" ${x.status === s ? "selected" : ""}>${s}</option>
                  `).join("")}
                </select>
              </td>
              <td>${x.quantidade}</td>
              <td>${money(x.precoAtual)}</td>
              <td>${money(x.precoNegociado)}</td>
              <td>${money(x.savingTotal)}</td>
              <td>${money(x.costAvoidanceTotal)}</td>
              <td>${x.reducaoPercentual.toFixed(2)}%</td>
              <td>
                <button class="mini-btn" onclick="excluirSaving('${x.id}')">Excluir</button>
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </section>
  `;
}

function limparFiltrosSaving(){
  setFilterValue("savingCategoria", "");
  setFilterValue("savingComprador", "");
  setFilterValue("savingStatus", "");
  setFilterValue("savingBusca", "");
}

function abrirModalSaving(categoria){
  const modal = document.getElementById("savingModal");

  modal.innerHTML = `
    <div class="modal-backdrop">
      <div class="modal-card">
        <h2>${categoria === "Saving" ? "Incluir Saving" : "Incluir Reajuste / Cost Avoidance"}</h2>

        <div class="modal-grid">
          <input id="svData" placeholder="Data">
          <input id="svComprador" placeholder="Comprador">
          <input id="svCodigo" placeholder="Código">
          <input id="svDescricao" placeholder="Descrição">
          <input id="svFornecedorAtual" placeholder="Fornecedor atual">
          <select id="svStatus">
            <option>Homologação em curso</option>
            <option>Homologado</option>
            <option>Declinado</option>
          </select>
          <select id="svTipo">
            <option>Spot</option>
            <option>Anual</option>
          </select>
          <input id="svQuantidade" placeholder="Quantidade">
          <input id="svPrecoAtual" placeholder="Preço atual">

          ${
            categoria === "Saving"
            ? `
              <input id="svCompetidorA" placeholder="Competidor A">
              <input id="svPrecoCompetidorA" placeholder="Preço Competidor A">
              <input id="svCompetidorB" placeholder="Competidor B">
              <input id="svPrecoCompetidorB" placeholder="Preço Competidor B">
              <input id="svCompetidorC" placeholder="Competidor C">
              <input id="svPrecoCompetidorC" placeholder="Preço Competidor C">
            `
            : `
              <input id="svReajusteSolicitado" placeholder="% Reajuste solicitado">
              <input id="svReajusteAcordado" placeholder="% Reajuste acordado">
            `
          }

          <textarea id="svObservacao" placeholder="Observação"></textarea>
        </div>

        <div class="modal-actions">
          <button class="action-btn" onclick="salvarRegistroSaving('${categoria}')">Salvar</button>
          <button class="action-btn secondary" onclick="fecharModalSaving()">Cancelar</button>
        </div>
      </div>
    </div>
  `;
}

function fecharModalSaving(){
  document.getElementById("savingModal").innerHTML = "";
}

function salvarRegistroSaving(categoria){
  const registro = {
    id:uid(),
    categoria,
    tipo:document.getElementById("svTipo").value,
    data:document.getElementById("svData").value,
    comprador:document.getElementById("svComprador").value,
    codigo:document.getElementById("svCodigo").value,
    descricao:document.getElementById("svDescricao").value,
    fornecedorAtual:document.getElementById("svFornecedorAtual").value,
    status:document.getElementById("svStatus").value,
    quantidade:document.getElementById("svQuantidade").value,
    precoAtual:document.getElementById("svPrecoAtual").value,
    competidorA:document.getElementById("svCompetidorA")?.value || "",
    precoCompetidorA:document.getElementById("svPrecoCompetidorA")?.value || "",
    competidorB:document.getElementById("svCompetidorB")?.value || "",
    precoCompetidorB:document.getElementById("svPrecoCompetidorB")?.value || "",
    competidorC:document.getElementById("svCompetidorC")?.value || "",
    precoCompetidorC:document.getElementById("svPrecoCompetidorC")?.value || "",
    reajusteSolicitado:document.getElementById("svReajusteSolicitado")?.value || "",
    reajusteAcordado:document.getElementById("svReajusteAcordado")?.value || "",
    observacao:document.getElementById("svObservacao").value
  };

  savingRegistros.push(registro);
  salvarSavingsLocal();
  fecharModalSaving();
  renderSaving();
}

function alterarStatusSaving(id, status){
  const item = savingRegistros.find(x => x.id === id);
  if(!item) return;

  item.status = status;
  salvarSavingsLocal();
  renderSaving();
}

function excluirSaving(id){
  if(!confirm("Deseja excluir este lançamento?")) return;

  savingRegistros = savingRegistros.filter(x => x.id !== id);
  salvarSavingsLocal();
  renderSaving();
}

function importarSavingCSV(event){
  const file = event.target.files[0];
  if(!file) return;

  const reader = new FileReader();

  reader.onload = e => {
    const rows = parseCSV(e.target.result);
    const headers = rows[0].map(h => String(h || "").trim());

    const novos = rows.slice(1).map(row => {
      const obj = {};
      headers.forEach((h,i) => obj[h] = row[i] || "");

      return {
        id:uid(),
        categoria:get(obj, ["Categoria"]) || "Saving",
        tipo:get(obj, ["Tipo"]) || "Spot",
        data:get(obj, ["Data"]),
        comprador:get(obj, ["Comprador"]),
        codigo:get(obj, ["Código", "Codigo"]),
        descricao:get(obj, ["Descrição", "Descricao"]),
        fornecedorAtual:get(obj, ["Fornecedor Atual"]),
        status:get(obj, ["Status"]) || "Homologação em curso",
        quantidade:get(obj, ["Quantidade"]),
        precoAtual:get(obj, ["Preço Atual", "Preco Atual"]),
        competidorA:get(obj, ["Competidor A"]),
        precoCompetidorA:get(obj, ["Preço Competidor A", "Preco Competidor A"]),
        competidorB:get(obj, ["Competidor B"]),
        precoCompetidorB:get(obj, ["Preço Competidor B", "Preco Competidor B"]),
        competidorC:get(obj, ["Competidor C"]),
        precoCompetidorC:get(obj, ["Preço Competidor C", "Preco Competidor C"]),
        reajusteSolicitado:get(obj, ["Reajuste Solicitado %", "Reajuste Solicitado"]),
        reajusteAcordado:get(obj, ["Reajuste Acordado %", "Reajuste Acordado"]),
        observacao:get(obj, ["Observação", "Observacao"])
      };
    });

    savingRegistros.push(...novos);
    salvarSavingsLocal();
    renderSaving();
  };

  reader.readAsText(file, "UTF-8");
}

function exportarSavingCSV(){
  const headers = [
    "Categoria","Tipo","Data","Comprador","Código","Descrição","Fornecedor Atual","Status","Quantidade","Preço Atual",
    "Competidor A","Preço Competidor A","Competidor B","Preço Competidor B","Competidor C","Preço Competidor C",
    "Reajuste Solicitado %","Reajuste Acordado %","Observação"
  ];

  const linhas = savingRegistros.map(r => [
    r.categoria,r.tipo,r.data,r.comprador,r.codigo,r.descricao,r.fornecedorAtual,r.status,r.quantidade,r.precoAtual,
    r.competidorA,r.precoCompetidorA,r.competidorB,r.precoCompetidorB,r.competidorC,r.precoCompetidorC,
    r.reajusteSolicitado,r.reajusteAcordado,r.observacao
  ]);

  const csv = [headers, ...linhas]
    .map(row => row.map(v => `"${String(v || "").replaceAll('"','""')}"`).join(";"))
    .join("\n");

  const blob = new Blob(["\uFEFF" + csv], {type:"text/csv;charset=utf-8;"});
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "savings-consolidado.csv";
  a.click();

  URL.revokeObjectURL(url);
}

/* =========================
   NAVEGAÇÃO
========================= */

function goPage(page){
  document.querySelectorAll(".nav-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.page === page);
  });

  if(page === "geral") renderGeral();
  if(page === "fornecedores") renderFornecedores();
  if(page === "saving") renderSaving();
}

document.querySelectorAll(".nav-btn").forEach(btn => {
  if(btn.dataset.page){
    btn.addEventListener("click", () => goPage(btn.dataset.page));
  }
});

renderGeral();
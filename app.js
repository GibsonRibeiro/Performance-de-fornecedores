const FILES = {
  geral: "./data/geral.csv",
  fornecedores: "./data/fornecedores.csv",
  saving: "./data/saving.csv"
};

let geralData = [];
let fornecedoresData = [];
let savingData = [];

const app = document.getElementById("app");

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
  return String(text || "").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim();
}

function esc(text){
  return String(text || "").replace(/[&<>"']/g, m => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[m]));
}

function money(value){
  return Number(value || 0).toLocaleString("pt-BR", { style:"currency", currency:"BRL" });
}

function numberBR(text){
  const clean = String(text || "").replace("R$","").replace(/\./g,"").replace(",",".").replace(/[^\d.-]/g,"").trim();
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

function daysUntil(date){
  if(!date) return null;
  const today = new Date();
  today.setHours(0,0,0,0);
  const d = new Date(date);
  d.setHours(0,0,0,0);
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
  let row = [], field = "", inQuotes = false;

  for(let i = 0; i < text.length; i++){
    const char = text[i], next = text[i + 1];

    if(char === '"' && inQuotes && next === '"'){
      field += '"'; i++;
    } else if(char === '"'){
      inQuotes = !inQuotes;
    } else if(char === delimiter && !inQuotes){
      row.push(field); field = "";
    } else if((char === "\n" || char === "\r") && !inQuotes){
      if(field || row.length){
        row.push(field); rows.push(row); row = []; field = "";
      }
      if(char === "\r" && next === "\n") i++;
    } else {
      field += char;
    }
  }

  if(field || row.length) rows.push([...row, field]);
  return rows.filter(r => r.some(c => String(c).trim() !== ""));
}

async function loadCSV(path){
  const response = await fetch(path);
  if(!response.ok) throw new Error(`Erro ao carregar ${path} - HTTP ${response.status}`);

  const text = await response.text();
  const rows = parseCSV(text);
  if(rows.length <= 1) throw new Error(`Arquivo vazio ou sem dados: ${path}`);

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
  return `<div class="kpi" ${clickable}><small>${label}</small><strong class="${color}">${value}</strong></div>`;
}

function group(data, key){
  const map = {};
  data.forEach(item => {
    const nome = item[key] || "Não informado";
    if(!map[nome]) map[nome] = { nome, items: [] };
    map[nome].items.push(item);
  });
  return map;
}

function barLine(label, value, cls, text, max){
  const width = max > 0 ? Math.max(2, (value / max) * 100) : 0;
  return `
    <div class="bar-row">
      <span>${esc(label)}</span>
      <div class="bar-bg"><div class="bar ${cls}" style="width:${width}%"></div></div>
      <b>${text}</b>
    </div>
  `;
}

function barList(items, max){
  return items.map(([label, value, cls]) => barLine(label, value, cls, value, max)).join("");
}

function renderFilterBar(config){
  return `
    <section class="filters">
      ${config.map(item => {
        if(item.type === "text"){
          return `<input id="${item.id}" placeholder="${item.placeholder}" value="${item.value || ""}">`;
        }
        return `<select id="${item.id}">${optionList(item.options || [], item.label)}</select>`;
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

/* DASHBOARD GERAL */

function faixaClass(faixa){
  const f = norm(faixa);
  if(f.includes("atrasado")) return "badge-red";
  if(f.includes("critico")) return "badge-orange";
  if(f.includes("alerta")) return "badge-yellow";
  if(f.includes("dentro")) return "badge-green";
  if(f.includes("entregue")) return "badge-blue";
  return "badge-gray";
}

function mapGeralRows(rows){
  return rows.map(r => {
    const dataRecebimento = get(r, ["Data Recebimentos", "Data Recebimento", "Recebimento"]);
    const dataObj = parseDateBR(dataRecebimento);

    const previsaoInicial = get(r, [
      "Previsão Entrega Inicial",
      "Previsao Entrega Inicial",
      "Data Prevista Inicial"
    ]);

    const previsaoInicialObj = parseDateBR(previsaoInicial);

    return {
      pedido: get(r, ["Pedido", "Número Pedido", "Nº Pedido", "Num Pedido"]),
      produto: get(r, ["Produto", "Cod Produto", "Código Produto", "Codigo Produto"]),
      descricaoProduto: get(r, ["Descrição Produto", "Descricao Produto", "Desc Produto"]),
      fornecedor: get(r, ["Descrição Fornecedor", "Fornecedor"]),
      comprador: get(r, ["Nome Comprador", "Comprador"]),
      faixa: get(r, ["Faixa de risco", "Faixa Risco", "Risco"]),
      valor: numberBR(get(r, ["Valor total do pedido", "Valor total", "Valor Pedido", "Valor"])),
      atraso: numberBR(get(r, ["Entregas com atraso", "Dias atraso", "Atraso"])),
      dataRecebimento,
      mesRecebimento: monthKeyFromDate(dataObj),
      previsaoInicial,
      previsaoInicialObj,
      entradaPrevista: get(r, ["Entrada prevista", "Previsão entrega", "Previsao entrega"]),
      prazoPagamento: numberBR(get(r, ["média de dias", "Média de dias", "Prazo Médio Pagamento", "Prazo médio pagamento"]))
    };
  }).filter(x => x.fornecedor || x.pedido);
}

async function ensureGeralData(){
  if(!geralData.length) geralData = mapGeralRows(await loadCSV(FILES.geral));
}

async function renderGeral(){
  app.innerHTML = `<section class="hero"><h1>Dashboard Geral</h1><p>Carregando base geral...</p></section>`;

  try{
    await ensureGeralData();
    renderGeralView(geralData);
  } catch(error){
    console.error("Erro Dashboard Geral:", error);
    app.innerHTML = `<section class="hero"><h1>Dashboard Geral</h1><p>Erro ao carregar o arquivo <b>data/geral.csv</b>. Veja o Console com F12.</p></section>`;
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
      <p>Indicadores de pedidos, entregas, risco, performance operacional e recebimentos mensais.</p>
    </section>

    ${renderFilterBar([
      {type:"select", id:"geralComprador", label:"Todos compradores", options:compradores},
      {type:"select", id:"geralFornecedor", label:"Todos fornecedores", options:fornecedores},
      {type:"text", id:"geralPedido", placeholder:"Buscar por número do pedido"},
      {type:"select", id:"geralFaixa", label:"Todas faixas de risco", options:faixas},
      {type:"select", id:"geralMes", label:"Todos meses recebidos", options:meses}
    ])}

    <div class="actions-row">
      <button class="action-btn" onclick="gerarRelatorioAtencao()">Imprimir pedidos de atenção</button>
      <span class="action-hint">Usa a coluna Previsão Entrega Inicial. Entra o que está atrasado ou vence em até 10 dias.</span>
    </div>

    <div id="geralContent"></div>
  `;

  attachFilterEvents(["geralComprador","geralFornecedor","geralPedido","geralFaixa","geralMes"], () => renderGeralContent(base));
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

function aplicarFiltroGeralFaixa(faixa){ setFilterValue("geralFaixa", faixa); }
function aplicarFiltroGeralMes(mes){ setFilterValue("geralMes", mes); }

function limparFiltrosGeral(){
  setFilterValue("geralComprador", "");
  setFilterValue("geralFornecedor", "");
  setFilterValue("geralPedido", "");
  setFilterValue("geralFaixa", "");
  setFilterValue("geralMes", "");
}

function gerarRelatorioAtencao(){
  const comprador = getFilterValue("geralComprador");
  const fornecedor = getFilterValue("geralFornecedor");
  const pedidoBusca = norm(getFilterValue("geralPedido"));

  const base = geralData.filter(x => {
    const dias = daysUntil(x.previsaoInicialObj);
    const naoEntregue = norm(x.faixa) !== "entregue";
    const emAtencao = dias !== null && dias <= 10;

    return naoEntregue &&
      emAtencao &&
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
<title>Relatório de Pedidos de Atenção</title>
<style>
  body{font-family:Arial,Helvetica,sans-serif;margin:0;color:#111827;background:white}
  .page{padding:28px}
  .header{display:flex;justify-content:space-between;align-items:center;border-bottom:4px solid #b91c1c;padding-bottom:16px;margin-bottom:20px}
  .logo{max-width:260px;background:#111827;padding:14px;border-radius:10px}
  h1{font-size:24px;margin:0;color:#111827}
  .sub{color:#4b5563;margin-top:6px;font-size:13px}
  .print-btn{background:#b91c1c;color:white;border:0;border-radius:10px;padding:10px 16px;font-weight:bold;cursor:pointer}
  .meta{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin:18px 0}
  .card{border:1px solid #d1d5db;border-radius:12px;padding:12px;background:#f9fafb}
  .card small{display:block;color:#6b7280;font-size:11px;text-transform:uppercase;font-weight:bold}
  .card strong{display:block;margin-top:6px;font-size:19px}
  .criteria{font-size:12px;color:#4b5563;background:#f3f4f6;border-radius:10px;padding:12px;margin-bottom:16px}
  table{width:100%;border-collapse:collapse;font-size:11px}
  th{background:#111827;color:white;text-align:left;padding:8px}
  td{border-bottom:1px solid #e5e7eb;padding:7px;vertical-align:top}
  tr:nth-child(even){background:#f9fafb}
  .late{color:#b91c1c;font-weight:bold}
  .soon{color:#b45309;font-weight:bold}
  .footer{margin-top:18px;font-size:10px;color:#6b7280;text-align:right}
  @media print{
    .print-btn{display:none}
    .page{padding:14px}
    .header{break-inside:avoid}
    table{font-size:9px}
    th,td{padding:5px}
  }
</style>
</head>
<body>
<div class="page">
  <div class="header">
    <div>
      <img src="logo-linshalm.png" class="logo">
    </div>
    <div style="text-align:right">
      <h1>Relatório de Follow-up</h1>
      <div class="sub">Pedidos de atenção por Previsão Entrega Inicial</div>
      <button class="print-btn" onclick="window.print()">Imprimir / Salvar PDF</button>
    </div>
  </div>

  <div class="meta">
    <div class="card"><small>Comprador</small><strong>${esc(tituloComprador)}</strong></div>
    <div class="card"><small>Linhas em atenção</small><strong>${base.length}</strong></div>
    <div class="card"><small>Atrasados</small><strong>${atrasados}</strong></div>
    <div class="card"><small>Valor total</small><strong>${money(total)}</strong></div>
  </div>

  <div class="criteria">
    <b>Critério:</b> linhas não entregues com <b>Previsão Entrega Inicial</b> já vencida ou vencendo em até 10 dias.
    ${fornecedor ? `<br><b>Fornecedor filtrado:</b> ${esc(fornecedor)}` : ""}
    ${pedidoBusca ? `<br><b>Pedido filtrado:</b> ${esc(pedidoBusca)}` : ""}
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
        <th>Faixa</th>
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
            <td>${esc(x.faixa)}</td>
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

  const entreguesData = data.filter(x => norm(x.faixa) === "entregue");
  const entreguesNoPrazo = entreguesData.filter(x => x.atraso <= 0).length;
  const perfEntrega = entreguesData.length ? Math.round((entreguesNoPrazo / entreguesData.length) * 100) : 0;

  const porComprador = group(data, "comprador");

  const porFaixa = [
    ["Atrasado", atrasados, "bar-red"],
    ["Crítico", criticos, "bar-orange"],
    ["Alerta", alerta, "bar-yellow"],
    ["Dentro do prazo", dentro, "bar-green"]
  ];

  const performanceComprador = Object.values(porComprador).map(g => {
    const entregues = g.items.filter(x => norm(x.faixa) === "entregue");
    const ok = entregues.filter(x => x.atraso <= 0).length;
    return { nome: g.nome, perf: entregues.length ? Math.round((ok / entregues.length) * 100) : 0 };
  }).sort((a,b) => b.perf - a.perf);

  const topFornecedores = Object.values(group(data, "fornecedor"))
    .map(g => ({ nome: g.nome, valor: g.items.reduce((sum, x) => sum + x.valor, 0) }))
    .sort((a,b) => b.valor - a.valor)
    .slice(0, 10);

  const rankingCompras = Object.values(porComprador)
    .map(g => ({ nome: g.nome, valor: g.items.reduce((sum, x) => sum + x.valor, 0) }))
    .sort((a,b) => b.valor - a.valor);

  const recebidosPorMes = Object.values(group(data.filter(x => x.mesRecebimento), "mesRecebimento"))
    .map(g => ({ mes: g.nome, label: monthLabel(g.nome), valor: g.items.reduce((sum,x) => sum + x.valor, 0) }))
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
      ${kpi("Entregues no prazo", `${perfEntrega}%`, "green")}
    </section>

    <section class="panel-grid">
      <div class="panel"><h2>Pedidos em aberto</h2>${barList(porFaixa, Math.max(...porFaixa.map(x => x[1]), 1))}</div>
      <div class="panel"><h2>Performance por comprador</h2>${performanceComprador.map(x => barLine(x.nome, x.perf, "bar-blue", `${x.perf}%`, 100)).join("")}</div>
      <div class="panel"><h2>Top fornecedores por valor</h2>${topFornecedores.map(x => barLine(x.nome, x.valor, "bar-red", money(x.valor), topFornecedores[0]?.valor || 1)).join("")}</div>
      <div class="panel"><h2>Ranking de compras por comprador</h2>${rankingCompras.map(x => barLine(x.nome, x.valor, "bar-red", money(x.valor), rankingCompras[0]?.valor || 1)).join("")}</div>
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
            <th>Pedido</th><th>Produto</th><th>Descrição Produto</th><th>Fornecedor</th><th>Comprador</th><th>Valor</th><th>Faixa</th><th>Atraso</th><th>Data recebimento</th><th>Previsão Entrega Inicial</th>
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
              <td>${money(x.valor)}</td>
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

/* RANKING FORNECEDORES */

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

function contarPedidosPorFornecedor(baseGeral){
  const mapa = {};
  baseGeral.forEach(item => {
    const fornecedor = norm(item.fornecedor);
    const pedido = norm(item.pedido);
    if(!fornecedor || !pedido) return;
    if(!mapa[fornecedor]) mapa[fornecedor] = new Set();
    mapa[fornecedor].add(pedido);
  });

  const resultado = {};
  Object.keys(mapa).forEach(fornecedor => resultado[fornecedor] = mapa[fornecedor].size);
  return resultado;
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

function mapFornecedoresRows(rows, pedidosPorFornecedor){
  return rows.map(r => {
    const fornecedor = get(r, ["Descrição Fornecedor", "Fornecedor"]);
    const valor = numberBR(get(r, ["Valor total", "Valor"]));
    const performance = parsePercent(get(r, ["Performance de entrega", "Performance"]));
    const pedidos = pedidosPorFornecedor[norm(fornecedor)] || 0;

    return {
      fornecedor,
      valor,
      classificacao: Number(get(r, ["Classificação", "Ranking"])) || 0,
      comprador: get(r, ["Comprador"]),
      plano: get(r, ["Plano de ação", "Plano"]),
      performance,
      pedidos,
      situacao: classificarFornecedorAutomatico(fornecedor, valor, performance, pedidos)
    };
  }).filter(x => x.fornecedor);
}

async function renderFornecedores(){
  app.innerHTML = `<section class="hero"><h1>Ranking de Fornecedores</h1><p>Carregando matriz Kraljic...</p></section>`;

  try{
    await ensureGeralData();
    const pedidosPorFornecedor = contarPedidosPorFornecedor(geralData);
    fornecedoresData = mapFornecedoresRows(await loadCSV(FILES.fornecedores), pedidosPorFornecedor);
    renderFornecedoresView(fornecedoresData);
  } catch(error){
    console.error("Erro Ranking Fornecedores:", error);
    app.innerHTML = `<section class="hero"><h1>Ranking de Fornecedores</h1><p>Erro ao carregar o arquivo <b>data/fornecedores.csv</b>. Veja o Console com F12.</p></section>`;
  }
}

function renderFornecedoresView(base){
  const compradores = uniqueOptions(base, "comprador");
  const fornecedores = uniqueOptions(base, "fornecedor");
  const situacoes = uniqueOptions(base, "situacao");

  app.innerHTML = `
    <section class="hero">
      <h1>Ranking de Fornecedores / Matriz Kraljic</h1>
      <p>Classificação automática: estratégicos fixos, compra única como não crítico, alavancáveis por valor/performance e gargalos.</p>
    </section>

    ${renderFilterBar([
      {type:"select", id:"fornComprador", label:"Todos compradores", options:compradores},
      {type:"select", id:"fornFornecedor", label:"Todos fornecedores", options:fornecedores},
      {type:"select", id:"fornSituacao", label:"Todas situações", options:situacoes},
      {type:"select", id:"fornPlano", label:"Todos planos", options:["Com plano", "Sem plano"]},
      {type:"select", id:"fornPerf", label:"Todas performances", options:["Sem medição", "Boa ≥ 85%", "Alerta 60% a 84%", "Crítica < 60%"]},
      {type:"text", id:"fornBusca", placeholder:"Buscar fornecedor ou plano de ação"}
    ])}

    <div id="fornecedoresContent"></div>
  `;

  attachFilterEvents(["fornComprador","fornFornecedor","fornSituacao","fornPlano","fornPerf","fornBusca"], () => renderFornecedoresContent(base));
  renderFornecedoresContent(base);
}

function filterFornecedores(base){
  const comprador = getFilterValue("fornComprador");
  const fornecedor = getFilterValue("fornFornecedor");
  const situacao = getFilterValue("fornSituacao");
  const plano = getFilterValue("fornPlano");
  const perf = getFilterValue("fornPerf");
  const busca = norm(getFilterValue("fornBusca"));

  return base.filter(x => {
    const fullText = norm(`${x.fornecedor} ${x.plano} ${x.comprador} ${x.situacao}`);

    const passaPlano =
      !plano ||
      (plano === "Com plano" && !!x.plano) ||
      (plano === "Sem plano" && !x.plano);

    const passaPerf =
      !perf ||
      (perf === "Sem medição" && x.performance === null) ||
      (perf === "Boa ≥ 85%" && x.performance !== null && x.performance >= 85) ||
      (perf === "Alerta 60% a 84%" && x.performance !== null && x.performance >= 60 && x.performance < 85) ||
      (perf === "Crítica < 60%" && x.performance !== null && x.performance < 60);

    return (!comprador || x.comprador === comprador) &&
      (!fornecedor || x.fornecedor === fornecedor) &&
      (!situacao || x.situacao === situacao) &&
      passaPlano &&
      passaPerf &&
      (!busca || fullText.includes(busca));
  }).sort((a,b) => a.classificacao - b.classificacao);
}

function aplicarFiltroFornecedorSituacao(situacao){ setFilterValue("fornSituacao", situacao); }
function aplicarFiltroFornecedorPlano(valor){ setFilterValue("fornPlano", valor); }
function aplicarFiltroFornecedorPerf(valor){ setFilterValue("fornPerf", valor); }

function limparFiltrosFornecedores(){
  setFilterValue("fornComprador", "");
  setFilterValue("fornFornecedor", "");
  setFilterValue("fornSituacao", "");
  setFilterValue("fornPlano", "");
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
      ${kpi("Com plano", data.filter(x => x.plano).length, "yellow", "aplicarFiltroFornecedorPlano('Com plano')")}
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
                  <div class="row"><span>Entrega</span><span class="${perfColor(x.performance)}">${perfText(x.performance)}</span></div>
                  <div class="row"><span>Pedidos</span><b>${x.pedidos}</b></div>
                  ${x.plano ? `<div class="row"><b class="yellow">${esc(x.plano)}</b></div>` : ""}
                </div>
              `).join("")}
            </div>
          </div>
        `;
      }).join("")}
    </section>
  `;
}

/* SAVING */

function mapSavingRows(rows){
  return rows.map(r => ({
    tipo: get(r, ["Tipo"]),
    data: get(r, ["Data"]),
    comprador: get(r, ["Comprador", "Nome Comprador"]),
    codigo: get(r, ["Código", "Codigo"]),
    descricao: get(r, ["Descrição", "Descriçao", "Descricao"]),
    fornecedorAtual: get(r, ["Fornecedor Atual"]),
    vencedor: get(r, ["Vencedor"]),
    status: get(r, ["Status"]),
    savingMensal: numberBR(get(r, ["Saving Mensal"])),
    savingTotal: numberBR(get(r, ["Saving Total"])),
    reducaoPercentual: parsePercent(get(r, ["Reducao Percentual", "Redução Percentual"])),
    custoReferencia: numberBR(get(r, ["Custo referência", "Custo referencia", "Custo Referência"]))
  })).filter(x => x.descricao || x.codigo || x.fornecedorAtual || x.vencedor);
}

async function renderSaving(){
  app.innerHTML = `<section class="hero"><h1>Ranking de Saving</h1><p>Carregando base de saving...</p></section>`;

  try{
    if(!savingData.length) savingData = mapSavingRows(await loadCSV(FILES.saving));
    renderSavingView(savingData);
  } catch(error){
    console.error("Erro Ranking Saving:", error);
    app.innerHTML = `<section class="hero"><h1>Ranking de Saving</h1><p>Erro ao carregar o arquivo <b>data/saving.csv</b>. Veja o Console com F12.</p></section>`;
  }
}

function renderSavingView(base){
  const compradores = uniqueOptions(base, "comprador");
  const status = uniqueOptions(base, "status");
  const fornecedores = uniqueOptions(base, "fornecedorAtual");
  const vencedores = uniqueOptions(base, "vencedor");

  app.innerHTML = `
    <section class="hero">
      <h1>Ranking de Saving</h1>
      <p>Análise de saving total, pipeline, homologação, percentual de redução e impacto financeiro por comprador.</p>
    </section>

    ${renderFilterBar([
      {type:"select", id:"savingComprador", label:"Todos compradores", options:compradores},
      {type:"select", id:"savingStatus", label:"Todos status", options:status},
      {type:"select", id:"savingFornecedor", label:"Todos fornecedores atuais", options:fornecedores},
      {type:"select", id:"savingVencedor", label:"Todos vencedores", options:vencedores},
      {type:"text", id:"savingBusca", placeholder:"Buscar código, item ou fornecedor"}
    ])}

    <div id="savingContent"></div>
  `;

  attachFilterEvents(["savingComprador","savingStatus","savingFornecedor","savingVencedor","savingBusca"], () => renderSavingContent(base));
  renderSavingContent(base);
}

function filterSaving(base){
  const comprador = getFilterValue("savingComprador");
  const status = getFilterValue("savingStatus");
  const fornecedor = getFilterValue("savingFornecedor");
  const vencedor = getFilterValue("savingVencedor");
  const busca = norm(getFilterValue("savingBusca"));

  return base.filter(x => {
    const fullText = norm(`${x.codigo} ${x.descricao} ${x.fornecedorAtual} ${x.vencedor} ${x.comprador} ${x.status}`);
    return (!comprador || x.comprador === comprador) &&
      (!status || x.status === status) &&
      (!fornecedor || x.fornecedorAtual === fornecedor) &&
      (!vencedor || x.vencedor === vencedor) &&
      (!busca || fullText.includes(busca));
  });
}

function statusClassSaving(status){
  const s = norm(status);
  if(s.includes("homologado") && !s.includes("curso")) return "badge-green";
  if(s.includes("curso")) return "badge-orange";
  if(s.includes("declinado")) return "badge-red";
  return "badge-gray";
}

function aplicarFiltroSavingStatus(status){ setFilterValue("savingStatus", status); }

function limparFiltrosSaving(){
  setFilterValue("savingComprador", "");
  setFilterValue("savingStatus", "");
  setFilterValue("savingFornecedor", "");
  setFilterValue("savingVencedor", "");
  setFilterValue("savingBusca", "");
}

function renderSavingContent(base){
  const data = filterSaving(base);
  const content = document.getElementById("savingContent");

  const totalSaving = data.reduce((sum,x) => sum + x.savingTotal, 0);
  const savingMensal = data.reduce((sum,x) => sum + x.savingMensal, 0);
  const custoReferencia = data.reduce((sum,x) => sum + x.custoReferencia, 0);

  const homologado = data.filter(x => norm(x.status).includes("homologado") && !norm(x.status).includes("curso"));
  const pipeline = data.filter(x => norm(x.status).includes("curso"));
  const declinado = data.filter(x => norm(x.status).includes("declinado"));

  const savingHomologado = homologado.reduce((sum,x) => sum + x.savingTotal, 0);
  const savingPipeline = pipeline.reduce((sum,x) => sum + x.savingTotal, 0);
  const savingDeclinado = declinado.reduce((sum,x) => sum + x.savingTotal, 0);

  const percentualSaving = custoReferencia > 0 ? Math.round((totalSaving / custoReferencia) * 100) : 0;

  const porComprador = Object.values(group(data, "comprador"))
    .map(g => ({
      nome:g.nome,
      valor:g.items.reduce((sum,x) => sum + x.savingTotal, 0),
      custo:g.items.reduce((sum,x) => sum + x.custoReferencia, 0)
    }))
    .sort((a,b) => b.valor - a.valor);

  const topSavings = [...data].sort((a,b) => b.savingTotal - a.savingTotal).slice(0, 10);

  const maxComprador = Math.max(...porComprador.map(x => Math.abs(x.valor)), 1);
  const maxTop = Math.max(...topSavings.map(x => Math.abs(x.savingTotal)), 1);

  content.innerHTML = `
    <section class="kpis">
      ${kpi("Processos", data.length, "blue", "limparFiltrosSaving()")}
      ${kpi("Saving total", money(totalSaving), totalSaving >= 0 ? "green" : "red")}
      ${kpi("Saving mensal", money(savingMensal), savingMensal >= 0 ? "green" : "red")}
      ${kpi("Saving %", `${percentualSaving}%`, percentualSaving >= 0 ? "green" : "red")}
      ${kpi("Homologado", money(savingHomologado), "green", "aplicarFiltroSavingStatus('Homologado')")}
      ${kpi("Pipeline", money(savingPipeline), "orange", "aplicarFiltroSavingStatus('Homologação em curso')")}
      ${kpi("Declinado", money(savingDeclinado), "red", "aplicarFiltroSavingStatus('Declinado')")}
      ${kpi("Custo referência", money(custoReferencia), "blue")}
    </section>

    <section class="panel-grid">
      <div class="panel"><h2>Saving por comprador</h2>${porComprador.map(x => barLine(x.nome, Math.abs(x.valor), x.valor >= 0 ? "bar-blue" : "bar-red", money(x.valor), maxComprador)).join("")}</div>
      <div class="panel"><h2>Top savings</h2>${topSavings.map(x => barLine(x.descricao || x.codigo || "Item", Math.abs(x.savingTotal), x.savingTotal >= 0 ? "bar-red" : "bar-orange", money(x.savingTotal), maxTop)).join("")}</div>
    </section>

    <section class="table-wrap">
      <table>
        <thead>
          <tr><th>Tipo</th><th>Data</th><th>Comprador</th><th>Código</th><th>Descrição</th><th>Fornecedor Atual</th><th>Vencedor</th><th>Status</th><th>Saving Mensal</th><th>Saving Total</th><th>Redução</th><th>Custo Referência</th></tr>
        </thead>
        <tbody>
          ${data.map(x => `
            <tr>
              <td>${esc(x.tipo || "—")}</td><td>${esc(x.data || "—")}</td><td>${esc(x.comprador || "—")}</td><td>${esc(x.codigo || "—")}</td>
              <td><b>${esc(x.descricao || "—")}</b></td><td>${esc(x.fornecedorAtual || "—")}</td><td>${esc(x.vencedor || "—")}</td>
              <td><span class="badge ${statusClassSaving(x.status)}">${esc(x.status || "—")}</span></td>
              <td>${money(x.savingMensal)}</td><td><b class="${x.savingTotal >= 0 ? "green" : "red"}">${money(x.savingTotal)}</b></td>
              <td>${x.reducaoPercentual === null ? "—" : x.reducaoPercentual + "%"}</td><td>${money(x.custoReferencia)}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </section>
  `;
}

function goPage(page){
  document.querySelectorAll(".nav-btn").forEach(btn => btn.classList.toggle("active", btn.dataset.page === page));
  if(page === "geral") renderGeral();
  if(page === "fornecedores") renderFornecedores();
  if(page === "saving") renderSaving();
}

document.querySelectorAll(".nav-btn").forEach(btn => btn.addEventListener("click", () => goPage(btn.dataset.page)));

renderGeral();
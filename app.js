const FILES = {
  geral: "./data/geral.csv",
  fornecedores: "./data/fornecedores.csv",
  saving: "./data/saving.csv"
};

let geralData = [];
let fornecedoresData = [];
let savingData = [];

const app = document.getElementById("app");

/* =========================
   FORNECEDORES ESTRATÉGICOS FIXOS
========================= */

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

/* =========================
   UTILITÁRIOS
========================= */

function norm(text){
  return String(text || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g,"")
    .toLowerCase()
    .trim();
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

async function loadCSV(path){
  const response = await fetch(path);

  if(!response.ok){
    throw new Error(`Erro ao carregar ${path} - HTTP ${response.status}`);
  }

  const text = await response.text();
  const rows = parseCSV(text);

  if(rows.length <= 1){
    throw new Error(`Arquivo vazio ou sem dados: ${path}`);
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

function kpi(label, value, color){
  return `
    <div class="kpi">
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
      <span>${label}</span>
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

function mapGeralRows(rows){
  return rows.map(r => ({
    pedido: get(r, ["Pedido", "Número Pedido", "Nº Pedido", "Num Pedido"]),
    fornecedor: get(r, ["Descrição Fornecedor", "Fornecedor"]),
    comprador: get(r, ["Nome Comprador", "Comprador"]),
    faixa: get(r, ["Faixa de risco", "Faixa Risco", "Risco"]),
    valor: numberBR(get(r, ["Valor total do pedido", "Valor total", "Valor Pedido", "Valor"])),
    atraso: numberBR(get(r, ["Entregas com atraso", "Dias atraso", "Atraso"])),
    dataRecebimento: get(r, ["Data Recebimentos", "Data Recebimento", "Recebimento"]),
    entradaPrevista: get(r, ["Entrada prevista", "Previsão entrega", "Previsao entrega"]),
    prazoPagamento: numberBR(get(r, ["média de dias", "Média de dias", "Prazo Médio Pagamento", "Prazo médio pagamento"]))
  })).filter(x => x.fornecedor || x.pedido);
}

async function renderGeral(){
  app.innerHTML = `
    <section class="hero">
      <h1>Dashboard Geral</h1>
      <p>Carregando base geral...</p>
    </section>
  `;

  try{
    if(!geralData.length){
      geralData = mapGeralRows(await loadCSV(FILES.geral));
    }

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

  app.innerHTML = `
    <section class="hero">
      <h1>Dashboard Geral</h1>
      <p>Indicadores de pedidos, entregas, risco e performance operacional.</p>
    </section>

    ${renderFilterBar([
      {type:"select", id:"geralComprador", label:"Todos compradores", options:compradores},
      {type:"select", id:"geralFornecedor", label:"Todos fornecedores", options:fornecedores},
      {type:"text", id:"geralPedido", placeholder:"Buscar por número do pedido"},
      {type:"select", id:"geralFaixa", label:"Todas faixas de risco", options:faixas}
    ])}

    <div id="geralContent"></div>
  `;

  attachFilterEvents(["geralComprador","geralFornecedor","geralPedido","geralFaixa"], () => renderGeralContent(base));
  renderGeralContent(base);
}

function filterGeral(base){
  const comprador = getFilterValue("geralComprador");
  const fornecedor = getFilterValue("geralFornecedor");
  const pedido = norm(getFilterValue("geralPedido"));
  const faixa = getFilterValue("geralFaixa");

  return base.filter(x => {
    return (!comprador || x.comprador === comprador) &&
      (!fornecedor || x.fornecedor === fornecedor) &&
      (!pedido || norm(x.pedido).includes(pedido)) &&
      (!faixa || x.faixa === faixa);
  });
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
    const entregues = g.items.filter(x => norm(x.faixa) === "entregue");
    const ok = entregues.filter(x => x.atraso <= 0).length;

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

  content.innerHTML = `
    <section class="kpis">
      ${kpi("Registros filtrados", data.length, "blue")}
      ${kpi("Atrasados", atrasados, "red")}
      ${kpi("Crítico", criticos, "orange")}
      ${kpi("Alerta", alerta, "yellow")}
      ${kpi("Dentro do prazo", dentro, "green")}
      ${kpi("Entregues", entregues, "blue")}
      ${kpi("Total comprado", money(totalComprado), "blue")}
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

    <section class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Pedido</th>
            <th>Fornecedor</th>
            <th>Comprador</th>
            <th>Valor</th>
            <th>Faixa</th>
            <th>Atraso</th>
            <th>Entrada prevista</th>
          </tr>
        </thead>

        <tbody>
          ${data.slice(0, 1500).map(x => `
            <tr>
              <td>${x.pedido || "—"}</td>
              <td><b>${x.fornecedor || "—"}</b></td>
              <td>${x.comprador || "—"}</td>
              <td>${money(x.valor)}</td>
              <td><span class="badge ${faixaClass(x.faixa)}">${x.faixa || "—"}</span></td>
              <td>${x.atraso}</td>
              <td>${x.entradaPrevista || "—"}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </section>
  `;
}

/* =========================
   RANKING FORNECEDORES
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

function classificarFornecedorAutomatico(fornecedor, valor, performance){
  const nome = norm(fornecedor);

  const ehEstrategico = FORNECEDORES_ESTRATEGICOS_FIXOS.some(item => norm(item) === nome);

  if(ehEstrategico){
    return "Estratégico";
  }

  if(performance !== null && performance >= 60 && valor >= 100000){
    return "Alavancável";
  }

  if(performance !== null && performance >= 60 && valor < 100000){
    return "Não crítico";
  }

  return "Gargalo";
}

function mapFornecedoresRows(rows){
  return rows.map(r => {
    const fornecedor = get(r, ["Descrição Fornecedor", "Fornecedor"]);
    const valor = numberBR(get(r, ["Valor total", "Valor"]));
    const performance = parsePercent(get(r, ["Performance de entrega", "Performance"]));

    return {
      fornecedor,
      valor,
      classificacao: Number(get(r, ["Classificação", "Ranking"])) || 0,
      comprador: get(r, ["Comprador"]),
      plano: get(r, ["Plano de ação", "Plano"]),
      performance,
      situacao: classificarFornecedorAutomatico(fornecedor, valor, performance)
    };
  }).filter(x => x.fornecedor);
}

async function renderFornecedores(){
  app.innerHTML = `
    <section class="hero">
      <h1>Ranking de Fornecedores</h1>
      <p>Carregando matriz Kraljic...</p>
    </section>
  `;

  try{
    fornecedoresData = mapFornecedoresRows(await loadCSV(FILES.fornecedores));
    renderFornecedoresView(fornecedoresData);
  } catch(error){
    console.error("Erro Ranking Fornecedores:", error);

    app.innerHTML = `
      <section class="hero">
        <h1>Ranking de Fornecedores</h1>
        <p>Erro ao carregar o arquivo <b>data/fornecedores.csv</b>. Veja o Console com F12.</p>
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
      <p>Classificação automática: estratégicos fixos, alavancáveis por valor/performance, não críticos e gargalos.</p>
    </section>

    ${renderFilterBar([
      {type:"select", id:"fornComprador", label:"Todos compradores", options:compradores},
      {type:"select", id:"fornFornecedor", label:"Todos fornecedores", options:fornecedores},
      {type:"select", id:"fornSituacao", label:"Todas situações", options:situacoes},
      {type:"text", id:"fornBusca", placeholder:"Buscar fornecedor ou plano de ação"}
    ])}

    <div id="fornecedoresContent"></div>
  `;

  attachFilterEvents(["fornComprador","fornFornecedor","fornSituacao","fornBusca"], () => renderFornecedoresContent(base));
  renderFornecedoresContent(base);
}

function filterFornecedores(base){
  const comprador = getFilterValue("fornComprador");
  const fornecedor = getFilterValue("fornFornecedor");
  const situacao = getFilterValue("fornSituacao");
  const busca = norm(getFilterValue("fornBusca"));

  return base.filter(x => {
    const fullText = norm(`${x.fornecedor} ${x.plano} ${x.comprador} ${x.situacao}`);

    return (!comprador || x.comprador === comprador) &&
      (!fornecedor || x.fornecedor === fornecedor) &&
      (!situacao || x.situacao === situacao) &&
      (!busca || fullText.includes(busca));
  }).sort((a,b) => a.classificacao - b.classificacao);
}

function renderFornecedoresContent(base){
  const data = filterFornecedores(base);
  const content = document.getElementById("fornecedoresContent");

  const situacoesPadrao = ["Estratégico", "Alavancável", "Gargalo", "Não crítico"];
  const total = data.reduce((sum, x) => sum + x.valor, 0);

  content.innerHTML = `
    <section class="kpis">
      ${kpi("Fornecedores", data.length, "blue")}
      ${kpi("Valor total", money(total), "blue")}
      ${kpi("Estratégicos", data.filter(x => x.situacao === "Estratégico").length, "green")}
      ${kpi("Alavancáveis", data.filter(x => x.situacao === "Alavancável").length, "blue")}
      ${kpi("Gargalos", data.filter(x => x.situacao === "Gargalo").length, "red")}
      ${kpi("Não críticos", data.filter(x => x.situacao === "Não crítico").length, "orange")}
      ${kpi("Com plano", data.filter(x => x.plano).length, "yellow")}
      ${kpi("Sem medição", data.filter(x => x.performance === null).length, "orange")}
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
                  <h3>${x.classificacao}. ${x.fornecedor}</h3>
                  <div class="row"><span>${x.comprador || "—"}</span><b>${money(x.valor)}</b></div>
                  <div class="row">
                    <span>Entrega</span>
                    <span class="${perfColor(x.performance)}">${perfText(x.performance)}</span>
                  </div>
                  ${x.plano ? `<div class="row"><b class="yellow">${x.plano}</b></div>` : ""}
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
   RANKING SAVING
========================= */

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
  app.innerHTML = `
    <section class="hero">
      <h1>Ranking de Saving</h1>
      <p>Carregando base de saving...</p>
    </section>
  `;

  try{
    if(!savingData.length){
      savingData = mapSavingRows(await loadCSV(FILES.saving));
    }

    renderSavingView(savingData);
  } catch(error){
    console.error("Erro Ranking Saving:", error);

    app.innerHTML = `
      <section class="hero">
        <h1>Ranking de Saving</h1>
        <p>Erro ao carregar o arquivo <b>data/saving.csv</b>. Veja o Console com F12.</p>
      </section>
    `;
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

  const percentualSaving = custoReferencia > 0
    ? Math.round((totalSaving / custoReferencia) * 100)
    : 0;

  const porComprador = Object.values(group(data, "comprador"))
    .map(g => ({
      nome:g.nome,
      valor:g.items.reduce((sum,x) => sum + x.savingTotal, 0),
      custo:g.items.reduce((sum,x) => sum + x.custoReferencia, 0)
    }))
    .sort((a,b) => b.valor - a.valor);

  const topSavings = [...data]
    .sort((a,b) => b.savingTotal - a.savingTotal)
    .slice(0, 10);

  const maxComprador = Math.max(...porComprador.map(x => Math.abs(x.valor)), 1);
  const maxTop = Math.max(...topSavings.map(x => Math.abs(x.savingTotal)), 1);

  content.innerHTML = `
    <section class="kpis">
      ${kpi("Processos", data.length, "blue")}
      ${kpi("Saving total", money(totalSaving), totalSaving >= 0 ? "green" : "red")}
      ${kpi("Saving mensal", money(savingMensal), savingMensal >= 0 ? "green" : "red")}
      ${kpi("Saving %", `${percentualSaving}%`, percentualSaving >= 0 ? "green" : "red")}
      ${kpi("Homologado", money(savingHomologado), "green")}
      ${kpi("Pipeline", money(savingPipeline), "orange")}
      ${kpi("Declinado", money(savingDeclinado), "red")}
      ${kpi("Custo referência", money(custoReferencia), "blue")}
    </section>

    <section class="panel-grid">
      <div class="panel">
        <h2>Saving por comprador</h2>
        ${porComprador.map(x => barLine(x.nome, Math.abs(x.valor), x.valor >= 0 ? "bar-blue" : "bar-red", money(x.valor), maxComprador)).join("")}
      </div>

      <div class="panel">
        <h2>Top savings</h2>
        ${topSavings.map(x => barLine(x.descricao || x.codigo || "Item", Math.abs(x.savingTotal), x.savingTotal >= 0 ? "bar-red" : "bar-orange", money(x.savingTotal), maxTop)).join("")}
      </div>
    </section>

    <section class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Tipo</th>
            <th>Data</th>
            <th>Comprador</th>
            <th>Código</th>
            <th>Descrição</th>
            <th>Fornecedor Atual</th>
            <th>Vencedor</th>
            <th>Status</th>
            <th>Saving Mensal</th>
            <th>Saving Total</th>
            <th>Redução</th>
            <th>Custo Referência</th>
          </tr>
        </thead>

        <tbody>
          ${data.map(x => `
            <tr>
              <td>${x.tipo || "—"}</td>
              <td>${x.data || "—"}</td>
              <td>${x.comprador || "—"}</td>
              <td>${x.codigo || "—"}</td>
              <td><b>${x.descricao || "—"}</b></td>
              <td>${x.fornecedorAtual || "—"}</td>
              <td>${x.vencedor || "—"}</td>
              <td><span class="badge ${statusClassSaving(x.status)}">${x.status || "—"}</span></td>
              <td>${money(x.savingMensal)}</td>
              <td><b class="${x.savingTotal >= 0 ? "green" : "red"}">${money(x.savingTotal)}</b></td>
              <td>${x.reducaoPercentual === null ? "—" : x.reducaoPercentual + "%"}</td>
              <td>${money(x.custoReferencia)}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </section>
  `;
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
  btn.addEventListener("click", () => goPage(btn.dataset.page));
});

renderGeral();
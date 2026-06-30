const FILES = {
  geral: "./data/geral.csv",
  saving: "./data/saving.csv",
  indices: "./data/indices.csv",
  historico: {
    "2026": "./data/geral.csv",
    "2025": "./data/2025.csv",
    "2024": "./data/2024.csv",
    "2023": "./data/2023.csv"
  }
};

const SUPABASE_URL = "https://ylldnlmptfeonvrueoke.supabase.co";
const SUPABASE_KEY = "sb_publishable_BBHqYdMh-GcJ5CEtyy9EUw_3VcM78Ry";

let supabaseClient = null;

function getSupabaseClient(){
  if(supabaseClient) return supabaseClient;

  if(window.supabase && window.supabase.createClient){
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    return supabaseClient;
  }

  console.error("Supabase não carregou. Verifique se o script do Supabase está antes do app.js no index.html.");
  return null;
}

const ANO_PADRAO = "2026";
const ANOS_HISTORICO = ["2026", "2025", "2024", "2023"];
const OPCAO_TODOS_ANOS = "Todos os anos";

const MESES_FILTRO = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

const MASCARAS_INFLACAO = [
  { familia:"Aço", subfamilia:"Chapas Aço Planas", prefixo:"1.01.01" },
  { familia:"Aço", subfamilia:"Bobina Aço", prefixo:"1.01.02" },
  { familia:"Aço", subfamilia:"Barras Aço", prefixo:"1.09.03" },
  { familia:"Aço", subfamilia:"Cantoneiras", prefixo:"1.09.02" },
  { familia:"Aço", subfamilia:"Tubos Aço", prefixo:"1.09.01.01" },
  { familia:"Alumínio", subfamilia:"Chapas Alumínio", prefixo:"1.02.01" },
  { familia:"Alumínio", subfamilia:"Bobina Alumínio", prefixo:"1.02.02" }
];

const OPCOES_INFLACAO = [
  { id:"Alumínio|Consolidado", label:"Alumínio — Consolidado", familia:"Alumínio", subfamilia:"" },
  { id:"Alumínio|Chapas Alumínio", label:"Chapas Alumínio", familia:"Alumínio", subfamilia:"Chapas Alumínio" },
  { id:"Alumínio|Bobina Alumínio", label:"Bobina Alumínio", familia:"Alumínio", subfamilia:"Bobina Alumínio" },

  { id:"Aço|Consolidado", label:"Aço — Consolidado", familia:"Aço", subfamilia:"" },
  { id:"Aço|Chapas Aço Planas", label:"Chapas Aço Planas", familia:"Aço", subfamilia:"Chapas Aço Planas" },
  { id:"Aço|Bobina Aço", label:"Bobina Aço", familia:"Aço", subfamilia:"Bobina Aço" },
  { id:"Aço|Barras Aço", label:"Barras Aço", familia:"Aço", subfamilia:"Barras Aço" },
  { id:"Aço|Cantoneiras", label:"Cantoneiras", familia:"Aço", subfamilia:"Cantoneiras" },
  { id:"Aço|Tubos Aço", label:"Tubos Aço", familia:"Aço", subfamilia:"Tubos Aço" }
];

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

let geralData = [];
let savingData = [];
let indicesData = [];

let indicesTentouCarregar = false;
let inflacaoPontoSelecionado = null;

const app = document.getElementById("app");

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

function moneyKg(value){
  if(value === null || value === undefined || !Number.isFinite(Number(value))) return "—";
  return `${money(value)}/kg`;
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

  const date = new Date(year, month - 1, day);
  date.setHours(0,0,0,0);

  return date;
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
  if(dias === null || dias === undefined) return "Sem data";
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

function mesNumeroFromValue(valor){
  if(!valor) return null;

  const idx = MESES_FILTRO.findIndex(m => norm(m) === norm(valor));
  if(idx >= 0) return idx + 1;

  const n = Number(String(valor).replace(/\D/g,""));

  return Number.isFinite(n) && n >= 1 && n <= 12 ? n : null;
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
    }else if(char === '"'){
      inQuotes = !inQuotes;
    }else if(char === delimiter && !inQuotes){
      row.push(field);
      field = "";
    }else if((char === "\n" || char === "\r") && !inQuotes){
      if(field || row.length){
        row.push(field);
        rows.push(row);
        row = [];
        field = "";
      }

      if(char === "\r" && next === "\n") i++;
    }else{
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

    headers.forEach((h, i) => {
      obj[h] = row[i] || "";
    });

    return obj;
  });
}

function get(obj, names){
  const keys = Object.keys(obj || {});

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
    const safe = esc(v);
    return `<option value="${safe}">${esc(v)}</option>`;
  }).join("");
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

function attachFilterEvents(ids, callback){
  ids.forEach(id => {
    const el = document.getElementById(id);
    if(!el) return;

    el.addEventListener("input", callback);
    el.addEventListener("change", callback);
  });
}

function renderFilterBar(config){
  return `
    <section class="filters">
      ${config.map(item => {
        if(item.type === "text"){
          return `<input id="${item.id}" placeholder="${esc(item.placeholder || "")}" value="${esc(item.value || "")}">`;
        }

        return `
          <select id="${item.id}">
            ${optionList(item.options || [], item.label || "Selecione")}
          </select>
        `;
      }).join("")}
    </section>
  `;
}

function kpi(label, value, color = "blue", action = ""){
  const clickable = action ? `onclick="${action}" style="cursor:pointer"` : "";

  return `
    <div class="kpi" ${clickable}>
      <small>${esc(label)}</small>
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

function percentText(value){
  if(value === null || value === undefined || !Number.isFinite(Number(value))) return "—";

  const sinal = Number(value) > 0 ? "+" : "";
  return `${sinal}${Number(value).toFixed(2).replace(".", ",")}%`;
}

function kgText(value){
  return `${Number(value || 0).toLocaleString("pt-BR", {maximumFractionDigits:0})} kg`;
}

function valorPontoKg(value){
  if(value === null || value === undefined || !Number.isFinite(Number(value))) return "—";

  return `R$ ${Number(value).toLocaleString("pt-BR", {
    minimumFractionDigits:2,
    maximumFractionDigits:2
  })}/kg`;
}

function anosDisponiveis(base){
  const encontrados = [...new Set(base.map(x => x.anoBase).filter(Boolean))]
    .sort((a,b) => Number(b) - Number(a));

  const anos = ANOS_HISTORICO.filter(ano => encontrados.includes(ano));

  if(!anos.includes(ANO_PADRAO)) anos.unshift(ANO_PADRAO);

  return [...new Set([...anos, OPCAO_TODOS_ANOS])];
}

function getPeriodoMes(prefix){
  let ini = mesNumeroFromValue(getFilterValue(`${prefix}MesInicial`));
  let fim = mesNumeroFromValue(getFilterValue(`${prefix}MesFinal`));

  if(!ini && !fim){
    return {ini:null, fim:null};
  }

  if(ini && !fim) fim = 12;
  if(!ini && fim) ini = 1;

  if(ini > fim){
    const temp = ini;
    ini = fim;
    fim = temp;
  }

  return {ini, fim};
}

function passaFiltroAnoPeriodo(x, prefix, campoData = "dataRecebimentoObj"){
  const anoSelecionado = getFilterValue(`${prefix}Ano`) || ANO_PADRAO;

  if(anoSelecionado !== OPCAO_TODOS_ANOS && x.anoBase !== anoSelecionado){
    return false;
  }

  const {ini, fim} = getPeriodoMes(prefix);

  if(ini !== null && fim !== null){
    const data = x[campoData];
    if(!data) return false;

    const mes = data.getMonth() + 1;

    if(mes < ini || mes > fim) return false;
  }

  return true;
}

function aplicarPeriodoPadrao(prefix){
  const anoEl = document.getElementById(`${prefix}Ano`);

  if(anoEl && !anoEl.value){
    anoEl.value = ANO_PADRAO;
  }
}

function mesEstaNoPeriodoAtivo(mesKey, prefix){
  if(!mesKey) return false;

  const [ano, mes] = mesKey.split("-");
  const anoSelecionado = getFilterValue(`${prefix}Ano`) || ANO_PADRAO;
  const {ini, fim} = getPeriodoMes(prefix);
  const mesNum = Number(mes);

  const anoOk = anoSelecionado === OPCAO_TODOS_ANOS || anoSelecionado === ano;
  const mesOk = ini !== null && fim !== null && mesNum >= ini && mesNum <= fim;

  return anoOk && mesOk;
}

function aplicarFiltroPeriodoMes(prefix, mesKey){
  if(!mesKey) return;

  const [ano, mes] = mesKey.split("-");
  const mesNome = MESES_FILTRO[Number(mes) - 1];

  const anoEl = document.getElementById(`${prefix}Ano`);
  const mesInicialEl = document.getElementById(`${prefix}MesInicial`);
  const mesFinalEl = document.getElementById(`${prefix}MesFinal`);

  if(anoEl && anoEl.value !== OPCAO_TODOS_ANOS){
    anoEl.value = ano;
  }

  if(mesInicialEl) mesInicialEl.value = mesNome;
  if(mesFinalEl) mesFinalEl.value = mesNome;

  if(mesFinalEl){
    mesFinalEl.dispatchEvent(new Event("change"));
  }else if(mesInicialEl){
    mesInicialEl.dispatchEvent(new Event("change"));
  }else if(anoEl){
    anoEl.dispatchEvent(new Event("change"));
  }
}
function classificarMascaraInflacao(mascara){
  const valor = String(mascara || "").trim();
  if(!valor) return null;

  const regras = [...MASCARAS_INFLACAO].sort((a,b) => b.prefixo.length - a.prefixo.length);

  return regras.find(regra => valor.startsWith(regra.prefixo)) || null;
}

function getOpcaoInflacao(id){
  return OPCOES_INFLACAO.find(x => x.id === id) || OPCOES_INFLACAO[0];
}

function opcoesInflacaoHTML(){
  const aluminio = OPCOES_INFLACAO.filter(x => x.familia === "Alumínio");
  const aco = OPCOES_INFLACAO.filter(x => x.familia === "Aço");

  const render = lista => lista.map(opcao => `
    <option value="${esc(opcao.id)}">${esc(opcao.label)}</option>
  `).join("");

  return `
    <optgroup label="Alumínio">
      ${render(aluminio)}
    </optgroup>
    <optgroup label="Aço">
      ${render(aco)}
    </optgroup>
  `;
}

function alterarOpcaoInflacao(){
  inflacaoPontoSelecionado = null;
  renderInflacaoContent(window.inflacaoBaseAtual || []);
}

function selecionarPontoInflacao(mes){
  inflacaoPontoSelecionado = mes;
  renderInflacaoContent(window.inflacaoBaseAtual || []);
}

function limparPontoInflacao(){
  inflacaoPontoSelecionado = null;
  renderInflacaoContent(window.inflacaoBaseAtual || []);
}

function mapIndicesRows(rows){
  return rows.map(r => {
    const ano = String(get(r, ["Ano", "Year"])).trim();

    const mesRaw = get(r, ["Mes", "Mês", "Month"]);
    const mesNumero = Number(String(mesRaw).replace(/\D/g, "")) || mesNumeroFromValue(mesRaw);
    const mes = mesNumero ? String(mesNumero).padStart(2,"0") : "";

    const familia = get(r, ["Familia", "Família"]);
    const indice = get(r, ["Indice", "Índice"]);
    const valor = numberBR(get(r, ["Valor", "Valor R$/kg", "Valor BRL KG", "Valor_BRL_KG"]));

    return {
      ano,
      mes,
      key: ano && mes ? `${ano}-${mes}` : "",
      familia,
      indice,
      valor
    };
  }).filter(x => x.key && x.familia && x.valor > 0);
}

async function ensureIndicesData(){
  if(indicesTentouCarregar) return;

  indicesTentouCarregar = true;

  try{
    const rows = await loadCSV(FILES.indices, false);
    indicesData = mapIndicesRows(rows);
  }catch(error){
    console.warn("indices.csv não carregado. O painel seguirá apenas com inflação interna.", error);
    indicesData = [];
  }
}

function buscarIndiceMercado(familia, mesKey){
  return indicesData.find(x => norm(x.familia) === norm(familia) && x.key === mesKey) || null;
}

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

function mapGeralRows(rows, anoBase = ANO_PADRAO){
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

    const mascaraEntrada = get(r, ["Máscara de Entrada", "Mascara de Entrada", "Mascara Entrada"]);
    const inflacao = classificarMascaraInflacao(mascaraEntrada);

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
      anoBase:String(anoBase),
      pedido: get(r, ["Pedido", "Número Pedido", "Nº Pedido", "Num Pedido"]),
      produto: get(r, ["Produto", "Cod Produto", "Código Produto", "Codigo Produto"]),
      descricaoProduto: get(r, ["Descrição Produto", "Descricao Produto", "Desc Produto"]),
      fornecedor: get(r, ["Descrição Fornecedor", "Fornecedor"]),
      comprador: get(r, ["Nome Comprador", "Comprador"]),

      mascaraEntrada,
      familiaInflacao: inflacao?.familia || "",
      subfamiliaInflacao: inflacao?.subfamilia || "",

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
      mesRecebimentoNum: dataRecebimentoObj ? dataRecebimentoObj.getMonth() + 1 : null,

      previsaoInicial,
      previsaoInicialObj,
      dataLimiteOperacionalObj
    };
  }).filter(x => x.fornecedor || x.pedido);
}

async function ensureGeralData(){
  if(geralData.length) return;

  const carregados = [];

  for(const ano of ANOS_HISTORICO){
    const path = FILES.historico[ano];
    const required = ano === ANO_PADRAO;

    try{
      const rows = await loadCSV(path, required);
      carregados.push(...mapGeralRows(rows, ano));
    }catch(error){
      if(required) throw error;
      console.warn(`Histórico ${ano} não carregado:`, error.message);
    }
  }

  geralData = carregados;
}

function filtrarBaseInflacao(base, opcaoId){
  const opcao = getOpcaoInflacao(opcaoId);

  return base.filter(x => {
    const familiaOk = x.familiaInflacao === opcao.familia;
    const subfamiliaOk = !opcao.subfamilia || x.subfamiliaInflacao === opcao.subfamilia;

    return familiaOk &&
      subfamiliaOk &&
      x.mesRecebimento &&
      x.quantidade > 0 &&
      x.valor > 0;
  });
}

function gerarInflacaoMensal(base, opcaoId){
  const opcao = getOpcaoInflacao(opcaoId);
  const linhas = filtrarBaseInflacao(base, opcaoId);

  const grupos = Object.values(group(linhas, "mesRecebimento"))
    .map(g => {
      const valorTotal = g.items.reduce((s,x) => s + x.valor, 0);
      const quantidadeTotal = g.items.reduce((s,x) => s + x.quantidade, 0);
      const precoInterno = quantidadeTotal > 0 ? valorTotal / quantidadeTotal : 0;

      const indice = buscarIndiceMercado(opcao.familia, g.nome);
      const valorIndice = indice ? indice.valor : null;

      const diferencaPercentual = valorIndice && valorIndice > 0
        ? ((precoInterno / valorIndice) - 1) * 100
        : null;

      const impactoEstimado = valorIndice
        ? (precoInterno - valorIndice) * quantidadeTotal
        : null;

      return {
        mes:g.nome,
        label:monthLabel(g.nome),
        familia:opcao.familia,
        subfamilia:opcao.subfamilia,
        nomeOpcao:opcao.label,
        precoInterno,
        indiceMercado:valorIndice,
        nomeIndice:indice?.indice || "Mercado -1",
        diferencaPercentual,
        impactoEstimado,
        quantidadeTotal,
        valorTotal
      };
    })
    .sort((a,b) => a.mes.localeCompare(b.mes));

  grupos.forEach((item, index) => {
    const anterior = grupos[index - 1];

    item.variacaoMesAnterior = anterior && anterior.precoInterno > 0
      ? ((item.precoInterno / anterior.precoInterno) - 1) * 100
      : null;

    const mesmoMesAnoAnterior = grupos.find(x => {
      const [anoAtual, mesAtual] = item.mes.split("-");
      const [anoBase, mesBase] = x.mes.split("-");

      return Number(anoBase) === Number(anoAtual) - 1 && mesBase === mesAtual;
    });

    item.inflacaoAnual = mesmoMesAnoAnterior && mesmoMesAnoAnterior.precoInterno > 0
      ? ((item.precoInterno / mesmoMesAnoAnterior.precoInterno) - 1) * 100
      : null;

    item.baseAnual = mesmoMesAnoAnterior || null;
  });

  grupos.forEach(item => {
    const primeiro = grupos[0];

    item.variacaoPeriodo = primeiro && primeiro.precoInterno > 0
      ? ((item.precoInterno / primeiro.precoInterno) - 1) * 100
      : null;

    item.basePeriodo = primeiro || null;
  });

  return grupos;
}

function calcularResumoInflacaoPeriodo(base, opcaoId){
  const linhas = filtrarBaseInflacao(base, opcaoId);
  const opcao = getOpcaoInflacao(opcaoId);

  const valorTotal = linhas.reduce((s,x) => s + x.valor, 0);
  const quantidadeTotal = linhas.reduce((s,x) => s + x.quantidade, 0);
  const precoMedio = quantidadeTotal > 0 ? valorTotal / quantidadeTotal : 0;

  const meses = gerarInflacaoMensal(base, opcaoId);
  const primeiro = meses[0] || null;
  const ultimo = meses[meses.length - 1] || null;

  const variacaoPeriodo = primeiro && ultimo && primeiro.precoInterno > 0
    ? ((ultimo.precoInterno / primeiro.precoInterno) - 1) * 100
    : null;

  const indicesValidos = meses.filter(x => x.indiceMercado > 0 && x.quantidadeTotal > 0);

  const indicePonderado = indicesValidos.length
    ? indicesValidos.reduce((s,x) => s + (x.indiceMercado * x.quantidadeTotal), 0) /
      indicesValidos.reduce((s,x) => s + x.quantidadeTotal, 0)
    : null;

  const diferencaVsMercado = indicePonderado && indicePonderado > 0
    ? ((precoMedio / indicePonderado) - 1) * 100
    : null;

  const impactoEstimado = indicePonderado
    ? (precoMedio - indicePonderado) * quantidadeTotal
    : null;

  return {
    modo:"periodo",
    opcao,
    linhas,
    meses,
    valorTotal,
    quantidadeTotal,
    precoMedio,
    primeiro,
    ultimo,
    variacaoPeriodo,
    indicePonderado,
    diferencaVsMercado,
    impactoEstimado
  };
}
function enriquecerInflacaoComBaseComparativa(meses, opcaoId, baseComparativa){
  if(!meses.length) return meses;

  const comparativaMensal = gerarInflacaoMensal(baseComparativa || [], opcaoId);

  meses.forEach(item => {
    const [anoAtual, mesAtual] = item.mes.split("-");

    const mesmoMesAnoAnterior = comparativaMensal.find(x => {
      const [anoBase, mesBase] = x.mes.split("-");
      return Number(anoBase) === Number(anoAtual) - 1 && mesBase === mesAtual;
    });

    item.inflacaoAnual = mesmoMesAnoAnterior && mesmoMesAnoAnterior.precoInterno > 0
      ? ((item.precoInterno / mesmoMesAnoAnterior.precoInterno) - 1) * 100
      : null;

    item.baseAnual = mesmoMesAnoAnterior || null;
  });

  return meses;
}

function calcularInflacaoAnualPeriodo(baseFiltrada, opcaoId, baseComparativa){
  const anoSelecionado = getFilterValue("geralAno") || ANO_PADRAO;

  if(anoSelecionado === OPCAO_TODOS_ANOS){
    return null;
  }

  const anoAtual = Number(anoSelecionado);
  const anoAnterior = anoAtual - 1;

  if(!anoAtual || !anoAnterior){
    return null;
  }

  const linhasAtuais = filtrarBaseInflacao(baseFiltrada, opcaoId);

  if(!linhasAtuais.length){
    return null;
  }

  const mesesAtuais = [...new Set(linhasAtuais.map(x => x.mesRecebimentoNum).filter(Boolean))];

  if(!mesesAtuais.length){
    return null;
  }

  const linhasAnoAnterior = filtrarBaseInflacao(baseComparativa || [], opcaoId)
    .filter(x => {
      return Number(x.anoBase) === anoAnterior &&
        mesesAtuais.includes(x.mesRecebimentoNum);
    });

  const valorAtual = linhasAtuais.reduce((s,x) => s + x.valor, 0);
  const qtdAtual = linhasAtuais.reduce((s,x) => s + x.quantidade, 0);
  const precoAtual = qtdAtual > 0 ? valorAtual / qtdAtual : 0;

  const valorAnterior = linhasAnoAnterior.reduce((s,x) => s + x.valor, 0);
  const qtdAnterior = linhasAnoAnterior.reduce((s,x) => s + x.quantidade, 0);
  const precoAnterior = qtdAnterior > 0 ? valorAnterior / qtdAnterior : 0;

  if(!precoAtual || !precoAnterior){
    return null;
  }

  return {
    valor: ((precoAtual / precoAnterior) - 1) * 100,
    precoAtual,
    precoAnterior,
    anoAtual,
    anoAnterior,
    mesesComparados: mesesAtuais.length
  };
}

function resumoBaseAnualPeriodo(info){
  if(!info) return "Sem base anual";

  return `${info.anoAtual} vs ${info.anoAnterior}`;
}

function textoBasePeriodo(resumo){
  if(!resumo || !resumo.primeiro || !resumo.ultimo) return "Sem base";

  if(resumo.primeiro.mes === resumo.ultimo.mes){
    return resumo.primeiro.label;
  }

  return `${resumo.primeiro.label} → ${resumo.ultimo.label}`;
}

function corPercentual(value){
  if(value === null || value === undefined || !Number.isFinite(Number(value))) return "blue";
  if(Number(value) > 0) return "orange";
  if(Number(value) < 0) return "green";
  return "blue";
}

function corMercado(value){
  if(value === null || value === undefined || !Number.isFinite(Number(value))) return "blue";
  if(Number(value) > 0) return "red";
  if(Number(value) < 0) return "green";
  return "blue";
}

function corImpacto(value){
  if(value === null || value === undefined || !Number.isFinite(Number(value))) return "blue";
  if(Number(value) > 0) return "red";
  if(Number(value) < 0) return "green";
  return "blue";
}

function renderInflacaoCardsPeriodo(resumo, inflacaoAnualPeriodo){
  return `
    <section class="kpis inflacao-kpis">
      ${kpi("Modo de análise", "Período consolidado", "blue")}
      ${kpi("Família analisada", resumo.opcao.label, "blue")}
      ${kpi("Preço médio Linshalm", moneyKg(resumo.precoMedio), "blue")}
      ${kpi("Volume analisado", kgText(resumo.quantidadeTotal), "blue")}
      ${kpi("Valor comprado", money(resumo.valorTotal), "blue")}
      ${kpi("Inflação anual", inflacaoAnualPeriodo ? percentText(inflacaoAnualPeriodo.valor) : "Sem base anual", corPercentual(inflacaoAnualPeriodo?.valor))}
      ${kpi("Base anual", resumoBaseAnualPeriodo(inflacaoAnualPeriodo), "blue")}
      ${kpi("Variação no período", percentText(resumo.variacaoPeriodo), corPercentual(resumo.variacaoPeriodo))}
      ${kpi("Base do período", textoBasePeriodo(resumo), "blue")}
      ${kpi("Índice mercado -1", resumo.indicePonderado ? moneyKg(resumo.indicePonderado) : "Não carregado", resumo.indicePonderado ? "orange" : "yellow")}
      ${kpi("Diferença vs mercado", percentText(resumo.diferencaVsMercado), corMercado(resumo.diferencaVsMercado))}
      ${kpi("Impacto estimado", resumo.impactoEstimado !== null ? money(resumo.impactoEstimado) : "—", corImpacto(resumo.impactoEstimado))}
    </section>
  `;
}

function renderInflacaoCardsPonto(ponto){
  const baseAnualTexto = ponto.baseAnual
    ? `${ponto.label} vs ${ponto.baseAnual.label}`
    : "Sem base anual";

  const basePeriodoTexto = ponto.basePeriodo
    ? `${ponto.basePeriodo.label} → ${ponto.label}`
    : "Sem base";

  return `
    <section class="kpis inflacao-kpis">
      ${kpi("Modo de análise", "Mês selecionado", "blue")}
      ${kpi("Ponto analisado", ponto.label, "blue")}
      ${kpi("Preço médio Linshalm", moneyKg(ponto.precoInterno), "blue")}
      ${kpi("Volume analisado", kgText(ponto.quantidadeTotal), "blue")}
      ${kpi("Valor comprado", money(ponto.valorTotal), "blue")}
      ${kpi("Inflação anual", percentText(ponto.inflacaoAnual), corPercentual(ponto.inflacaoAnual))}
      ${kpi("Base anual", baseAnualTexto, "blue")}
      ${kpi("Variação desde início", percentText(ponto.variacaoPeriodo), corPercentual(ponto.variacaoPeriodo))}
      ${kpi("Base do período", basePeriodoTexto, "blue")}
      ${kpi("Índice mercado -1", ponto.indiceMercado ? moneyKg(ponto.indiceMercado) : "Não carregado", ponto.indiceMercado ? "orange" : "yellow")}
      ${kpi("Diferença vs mercado", percentText(ponto.diferencaPercentual), corMercado(ponto.diferencaPercentual))}
      ${kpi("Impacto estimado", ponto.impactoEstimado !== null ? money(ponto.impactoEstimado) : "—", corImpacto(ponto.impactoEstimado))}
    </section>
  `;
}

function renderInflacaoLineChart(rows, selectedMes){
  if(!rows.length){
    return `<div class="empty-state">Nenhuma compra encontrada para esta família no período filtrado.</div>`;
  }

  const width = 980;
  const height = 285;
  const margin = {top:42, right:30, bottom:50, left:66};
  const chartW = width - margin.left - margin.right;
  const chartH = height - margin.top - margin.bottom;

  const valores = [];

  rows.forEach(x => {
    if(x.precoInterno > 0) valores.push(x.precoInterno);
    if(x.indiceMercado > 0) valores.push(x.indiceMercado);
  });

  if(!valores.length){
    return `<div class="empty-state">Não há valores suficientes para montar o gráfico.</div>`;
  }

  const max = Math.max(...valores) * 1.12;
  const minRaw = Math.min(...valores) * 0.94;
  const min = Math.max(0, minRaw);
  const denom = max - min || 1;

  const xPos = index => rows.length === 1
    ? margin.left + chartW / 2
    : margin.left + (index / (rows.length - 1)) * chartW;

  const yPos = value => margin.top + chartH - ((value - min) / denom) * chartH;

  const pointsInterno = rows
    .filter(x => x.precoInterno > 0)
    .map(x => {
      const idx = rows.indexOf(x);
      return `${xPos(idx)},${yPos(x.precoInterno)}`;
    }).join(" ");

  const pointsMercado = rows
    .filter(x => x.indiceMercado > 0)
    .map(x => {
      const idx = rows.indexOf(x);
      return `${xPos(idx)},${yPos(x.indiceMercado)}`;
    }).join(" ");

  const grid = [0,1,2,3].map(i => {
    const y = margin.top + (i / 3) * chartH;
    const value = max - (i / 3) * denom;

    return `
      <line x1="${margin.left}" y1="${y}" x2="${width - margin.right}" y2="${y}" class="chart-grid-line" />
      <text x="${margin.left - 10}" y="${y + 4}" text-anchor="end" class="chart-axis-text">${valorPontoKg(value)}</text>
    `;
  }).join("");

  const labelsMes = rows.map((x, idx) => {
    const selected = x.mes === selectedMes;

    return `
      <text
        x="${xPos(idx)}"
        y="${height - 22}"
        text-anchor="middle"
        class="chart-axis-text ${selected ? "chart-axis-selected" : ""}"
      >${esc(x.label)}</text>
    `;
  }).join("");

  const labelsValorInterno = rows.map((x, idx) => {
    const y = yPos(x.precoInterno);
    const selected = x.mes === selectedMes;
    const labelY = y < 54 ? y + 22 : y - 12;

    return `
      <text
        x="${xPos(idx)}"
        y="${labelY}"
        text-anchor="middle"
        class="chart-point-label ${selected ? "chart-point-label-selected" : ""}"
        onclick="selecionarPontoInflacao('${x.mes}')"
      >${valorPontoKg(x.precoInterno)}</text>
    `;
  }).join("");

  const pontosInternos = rows.map((x, idx) => {
    const selected = x.mes === selectedMes;
    const r = selected ? 8 : 5;

    return `
      <circle
        cx="${xPos(idx)}"
        cy="${yPos(x.precoInterno)}"
        r="${r}"
        class="chart-point-interno ${selected ? "chart-point-selected" : ""}"
        onclick="selecionarPontoInflacao('${x.mes}')"
      >
        <title>${x.label} • Linshalm: ${moneyKg(x.precoInterno)} • Volume: ${kgText(x.quantidadeTotal)}</title>
      </circle>
    `;
  }).join("");

  const pontosMercado = rows.filter(x => x.indiceMercado > 0).map(x => {
    const idx = rows.indexOf(x);
    const selected = x.mes === selectedMes;

    return `
      <circle
        cx="${xPos(idx)}"
        cy="${yPos(x.indiceMercado)}"
        r="${selected ? "6" : "4"}"
        class="chart-point-mercado"
        onclick="selecionarPontoInflacao('${x.mes}')"
      >
        <title>${x.label} • ${esc(x.nomeIndice)}: ${moneyKg(x.indiceMercado)}</title>
      </circle>
    `;
  }).join("");

  const linhaMercado = pointsMercado
    ? `<polyline points="${pointsMercado}" fill="none" class="chart-line-mercado" />`
    : "";

  const legendaMercado = pointsMercado
    ? `<span><i class="legend-line mercado"></i>Mercado / LME -1</span>`
    : `<span class="muted">Índice externo não carregado</span>`;

  return `
    <div class="inflacao-chart-wrap">
      <svg viewBox="0 0 ${width} ${height}" class="inflacao-chart-svg">
        <rect x="0" y="0" width="${width}" height="${height}" rx="16" class="chart-bg" />
        ${grid}

        <line x1="${margin.left}" y1="${margin.top}" x2="${margin.left}" y2="${height - margin.bottom}" class="chart-axis-line" />
        <line x1="${margin.left}" y1="${height - margin.bottom}" x2="${width - margin.right}" y2="${height - margin.bottom}" class="chart-axis-line" />

        <polyline points="${pointsInterno}" fill="none" class="chart-line-interno" />
        ${linhaMercado}

        ${pontosInternos}
        ${pontosMercado}
        ${labelsValorInterno}
        ${labelsMes}

        <text x="${margin.left}" y="23" class="chart-title-small">R$/kg</text>
      </svg>
    </div>

    <div class="inflacao-legend">
      <span><i class="legend-line interno"></i>Linshalm R$/kg</span>
      ${legendaMercado}
      <span class="muted">Clique em um ponto para abrir a visão do mês.</span>
    </div>
  `;
}

function renderInflacaoContent(base){
  const container = document.getElementById("inflacaoContent");
  if(!container) return;

  const opcaoId = getFilterValue("inflacaoFamilia") || "Alumínio|Consolidado";
  const opcao = getOpcaoInflacao(opcaoId);

  const baseComparativa = window.inflacaoBaseComparativaAtual || base;

  let data = gerarInflacaoMensal(base, opcaoId);
  data = enriquecerInflacaoComBaseComparativa(data, opcaoId, baseComparativa);

  const resumo = calcularResumoInflacaoPeriodo(base, opcaoId);
  const inflacaoAnualPeriodo = calcularInflacaoAnualPeriodo(base, opcaoId, baseComparativa);

  if(!data.length){
    container.innerHTML = `
      <section class="kpis inflacao-kpis">
        ${kpi("Modo de análise", "Período consolidado", "blue")}
        ${kpi("Família analisada", opcao.label, "blue")}
        ${kpi("Preço médio Linshalm", "—", "blue")}
        ${kpi("Volume analisado", "—", "blue")}
        ${kpi("Inflação anual", "—", "yellow")}
      </section>

      <div class="empty-state">
        Nenhuma compra encontrada para <b>${esc(opcao.label)}</b> no período filtrado.
      </div>
    `;
    return;
  }

  const pontoSelecionado = inflacaoPontoSelecionado
    ? data.find(x => x.mes === inflacaoPontoSelecionado)
    : null;

  const cards = pontoSelecionado
    ? renderInflacaoCardsPonto(pontoSelecionado)
    : renderInflacaoCardsPeriodo(resumo, inflacaoAnualPeriodo);

  const temIndice = data.some(x => x.indiceMercado > 0);

  const aviso = temIndice
    ? `<div class="inflacao-note">Comparativo externo carregado a partir de <b>data/indices.csv</b>. O valor deve estar em R$/kg e já alinhado como mercado -1.</div>`
    : `<div class="inflacao-note">Sem <b>data/indices.csv</b> carregado. O painel segue normalmente mostrando apenas a inflação interna Linshalm.</div>`;

  const acaoPonto = pontoSelecionado
    ? `<button class="btn secondary" type="button" onclick="limparPontoInflacao()">Voltar para consolidado do período</button>`
    : `<button class="btn secondary" type="button" disabled>Visão consolidada do período</button>`;

  container.innerHTML = `
    <div class="inflacao-study-header">
      <div>
        <strong>${pontoSelecionado ? `Estudo do mês: ${esc(pontoSelecionado.label)}` : "Estudo do período consolidado"}</strong>
        <span>${esc(opcao.label)}</span>
      </div>
      ${acaoPonto}
    </div>

    ${cards}
    ${renderInflacaoLineChart(data, pontoSelecionado?.mes || null)}
    ${aviso}
  `;
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
    await ensureIndicesData();
    renderGeralView(geralData);
  }catch(error){
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
  const anos = anosDisponiveis(base);
  const compradores = uniqueOptions(base, "comprador");
  const fornecedores = uniqueOptions(base, "fornecedor");
  const faixas = uniqueOptions(base, "faixa");

  app.innerHTML = `
    <section class="hero">
      <h1>Dashboard Geral</h1>
      <p>Indicadores calculados automaticamente a partir do CSV bruto, com visão anual, histórica e por período.</p>
    </section>

    ${renderFilterBar([
      {type:"select", id:"geralAno", label:"Ano", options:anos},
      {type:"select", id:"geralMesInicial", label:"Mês inicial", options:MESES_FILTRO},
      {type:"select", id:"geralMesFinal", label:"Mês final", options:MESES_FILTRO},
      {type:"select", id:"geralComprador", label:"Todos compradores", options:compradores},
      {type:"select", id:"geralFornecedor", label:"Todos fornecedores", options:fornecedores},
      {type:"text", id:"geralPedido", placeholder:"Buscar por número do pedido"},
      {type:"select", id:"geralFaixa", label:"Todas faixas de risco", options:faixas}
    ])}

    <div id="geralContent"></div>
  `;

  aplicarPeriodoPadrao("geral");

  attachFilterEvents(
    ["geralAno","geralMesInicial","geralMesFinal","geralComprador","geralFornecedor","geralPedido","geralFaixa"],
    () => {
      inflacaoPontoSelecionado = null;
      renderGeralContent(base);
    }
  );

  renderGeralContent(base);
}

function filterGeral(base){
  const comprador = getFilterValue("geralComprador");
  const fornecedor = getFilterValue("geralFornecedor");
  const pedido = norm(getFilterValue("geralPedido"));
  const faixa = getFilterValue("geralFaixa");

  return base.filter(x => {
    return passaFiltroAnoPeriodo(x, "geral") &&
      (!comprador || x.comprador === comprador) &&
      (!fornecedor || x.fornecedor === fornecedor) &&
      (!pedido || norm(x.pedido).includes(pedido)) &&
      (!faixa || x.faixa === faixa);
  });
}

function filterGeralComparativaInflacao(base){
  const comprador = getFilterValue("geralComprador");
  const fornecedor = getFilterValue("geralFornecedor");
  const pedido = norm(getFilterValue("geralPedido"));
  const faixa = getFilterValue("geralFaixa");
  const {ini, fim} = getPeriodoMes("geral");

  return base.filter(x => {
    if(comprador && x.comprador !== comprador) return false;
    if(fornecedor && x.fornecedor !== fornecedor) return false;
    if(pedido && !norm(x.pedido).includes(pedido)) return false;
    if(faixa && x.faixa !== faixa) return false;

    if(ini !== null && fim !== null){
      if(!x.dataRecebimentoObj) return false;

      const mes = x.dataRecebimentoObj.getMonth() + 1;
      if(mes < ini || mes > fim) return false;
    }

    return true;
  });
}

function aplicarFiltroGeralFaixa(faixa){
  setFilterValue("geralFaixa", faixa);
}

function aplicarFiltroGeralMes(mes){
  aplicarFiltroPeriodoMes("geral", mes);
}

function limparFiltrosGeral(){
  setFilterValue("geralAno", ANO_PADRAO);
  setFilterValue("geralMesInicial", "");
  setFilterValue("geralMesFinal", "");
  setFilterValue("geralComprador", "");
  setFilterValue("geralFornecedor", "");
  setFilterValue("geralPedido", "");
  setFilterValue("geralFaixa", "");
}

async function gerarRelatorioAtencao(){
  await ensureGeralData();

  const comprador = getFilterValue("geralComprador");
  const fornecedor = getFilterValue("geralFornecedor");
  const pedidoBusca = norm(getFilterValue("geralPedido"));

  const base = filterGeral(geralData).filter(x => {
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

  window.inflacaoBaseAtual = data;
  window.inflacaoBaseComparativaAtual = filterGeralComparativaInflacao(base);

  const content = document.getElementById("geralContent");
  if(!content) return;

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
        ${performanceComprador.length ? performanceComprador.map(x => {
          return barLine(x.nome, x.perf, "bar-blue", `${x.perf}%`, 100);
        }).join("") : `<div class="empty-state">Sem dados de entrega para o período.</div>`}
      </div>

      <div class="panel">
        <h2>Top fornecedores por valor</h2>
        ${topFornecedores.length ? topFornecedores.map(x => {
          return barLine(x.nome, x.valor, "bar-red", money(x.valor), topFornecedores[0]?.valor || 1);
        }).join("") : `<div class="empty-state">Sem fornecedores no período filtrado.</div>`}
      </div>

      <div class="panel">
        <h2>Ranking de compras por comprador</h2>
        ${rankingCompras.length ? rankingCompras.map(x => {
          return barLine(x.nome, x.valor, "bar-red", money(x.valor), rankingCompras[0]?.valor || 1);
        }).join("") : `<div class="empty-state">Sem compras no período filtrado.</div>`}
      </div>
    </section>

    <section class="panel" style="margin-bottom:22px;">
      <div class="panel-title-row">
        <div>
          <h2>Total recebido por mês</h2>
          <p>Visão de recebimentos pelo valor total das linhas entregues no período.</p>
        </div>

        <button class="btn secondary" type="button" onclick="gerarRelatorioAtencao()">
          Imprimir pedidos em atenção
        </button>
      </div>

      <div class="month-chart">
        ${recebidosPorMes.length ? recebidosPorMes.map(x => `
          <div class="month-bar ${mesEstaNoPeriodoAtivo(x.mes, "geral") ? "active" : ""}" onclick="aplicarFiltroGeralMes('${x.mes}')">
            <div class="month-bar-value">${money(x.valor)}</div>
            <div class="month-bar-fill" style="height:${Math.max(18,(x.valor / maxMes) * 210)}px"></div>
            <div class="month-bar-label">${x.label}</div>
          </div>
        `).join("") : `<div class="empty-state">Sem recebimentos no período filtrado.</div>`}
      </div>
    </section>

    <section class="panel inflacao-panel" style="margin-bottom:22px;">
      <div class="inflacao-header">
        <div>
          <h2>Acompanhamento inflacionário — Aço e Alumínio</h2>
          <p>
            Preço médio Linshalm em R$/kg, calculado por valor comprado dividido pela quantidade comprada.
            A visão inicial é o consolidado do período; ao clicar em um ponto, os cards mudam para o mês selecionado.
          </p>
        </div>

        <div class="inflacao-controls">
          <label for="inflacaoFamilia">Família / subfamília</label>
          <select id="inflacaoFamilia" onchange="alterarOpcaoInflacao()">
            ${opcoesInflacaoHTML()}
          </select>
        </div>
      </div>

      <div id="inflacaoContent"></div>
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
              <td>${Number(x.quantidade || 0).toLocaleString("pt-BR", {maximumFractionDigits:2})}</td>
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

      ${data.length > 1500 ? `
        <div class="table-note">
          Exibindo as primeiras 1.500 linhas do período filtrado para manter o painel leve.
        </div>
      ` : ""}
    </section>
  `;

  renderInflacaoContent(data);
}
/* =========================
   RANKING FORNECEDORES / KRALJIC
========================= */

function fornecedorKey(nome){
  return norm(nome)
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isFornecedorEstrategico(nome){
  const chave = fornecedorKey(nome);

  return FORNECEDORES_ESTRATEGICOS_FIXOS.some(fixo => fornecedorKey(fixo) === chave);
}

function classificarFornecedorKraljic(stats){
  if(isFornecedorEstrategico(stats.nome)){
    return "Estratégico";
  }

  if(stats.pedidosUnicos <= 1){
    return "Não crítico";
  }

  if(stats.performance >= 60 && stats.valorTotal >= 100000){
    return "Alavancável";
  }

  if(stats.performance >= 60 && stats.valorTotal < 100000){
    return "Não crítico";
  }

  return "Gargalo";
}

function categoriaFornecedorClass(categoria){
  const c = norm(categoria);

  if(c.includes("estrategico")) return "badge-red";
  if(c.includes("alavancavel")) return "badge-green";
  if(c.includes("gargalo")) return "badge-orange";
  if(c.includes("nao critico")) return "badge-blue";

  return "badge-gray";
}

function corPerformanceFornecedor(value){
  if(value >= 80) return "green";
  if(value >= 60) return "yellow";
  return "red";
}

function calcularRankingFornecedores(base){
  return Object.values(group(base.filter(x => x.fornecedor), "fornecedor")).map(g => {
    const pedidos = [...new Set(g.items.map(x => x.pedido).filter(Boolean))];

    const valorTotal = g.items.reduce((s,x) => s + x.valor, 0);
    const quantidadeTotal = g.items.reduce((s,x) => s + x.quantidade, 0);

    const entregues = g.items.filter(x => x.entregue);
    const entreguesNoPrazo = entregues.filter(x => x.entregueNoPrazo).length;

    const performance = entregues.length
      ? Math.round((entreguesNoPrazo / entregues.length) * 100)
      : 0;

    const atrasoMedio = g.items.length
      ? Math.round(g.items.reduce((s,x) => s + (x.atraso || 0), 0) / g.items.length)
      : 0;

    const prazoMedioPagamento = valorTotal > 0
      ? Math.round(g.items.reduce((s,x) => s + ((x.prazoPagamento || 0) * x.valor), 0) / valorTotal)
      : 0;

    const compradores = [...new Set(g.items.map(x => x.comprador).filter(Boolean))];

    const stats = {
      nome:g.nome,
      itens:g.items,
      linhas:g.items.length,
      pedidosUnicos:pedidos.length,
      valorTotal,
      quantidadeTotal,
      entregues:entregues.length,
      entreguesNoPrazo,
      performance,
      atrasoMedio,
      prazoMedioPagamento,
      compradores
    };

    stats.categoria = classificarFornecedorKraljic(stats);

    return stats;
  }).sort((a,b) => b.valorTotal - a.valorTotal);
}

async function renderFornecedores(){
  app.innerHTML = `
    <section class="hero">
      <h1>Ranking Fornecedores</h1>
      <p>Carregando fornecedores a partir da base geral...</p>
    </section>
  `;

  try{
    await ensureGeralData();
    renderFornecedoresView(geralData);
  }catch(error){
    console.error("Erro Ranking Fornecedores:", error);

    app.innerHTML = `
      <section class="hero">
        <h1>Ranking Fornecedores</h1>
        <p>Erro ao carregar a base de fornecedores. Veja o Console com F12.</p>
      </section>
    `;
  }
}

function renderFornecedoresView(base){
  const anos = anosDisponiveis(base);
  const compradores = uniqueOptions(base, "comprador");
  const fornecedores = uniqueOptions(base, "fornecedor");
  const categorias = ["Estratégico", "Alavancável", "Gargalo", "Não crítico"];

  app.innerHTML = `
    <section class="hero">
      <h1>Ranking Fornecedores</h1>
      <p>
        Classificação estratégica dos fornecedores com base em valor comprado, performance de entrega e fornecedores estratégicos fixos.
      </p>
    </section>

    ${renderFilterBar([
      {type:"select", id:"fornAno", label:"Ano", options:anos},
      {type:"select", id:"fornMesInicial", label:"Mês inicial", options:MESES_FILTRO},
      {type:"select", id:"fornMesFinal", label:"Mês final", options:MESES_FILTRO},
      {type:"select", id:"fornComprador", label:"Todos compradores", options:compradores},
      {type:"select", id:"fornFornecedor", label:"Todos fornecedores", options:fornecedores},
      {type:"select", id:"fornCategoria", label:"Todas categorias", options:categorias}
    ])}

    <div id="fornecedoresContent"></div>
  `;

  aplicarPeriodoPadrao("forn");

  attachFilterEvents(
    ["fornAno","fornMesInicial","fornMesFinal","fornComprador","fornFornecedor","fornCategoria"],
    () => renderFornecedoresContent(base)
  );

  renderFornecedoresContent(base);
}

function filterFornecedoresBase(base){
  const comprador = getFilterValue("fornComprador");
  const fornecedor = getFilterValue("fornFornecedor");

  return base.filter(x => {
    return passaFiltroAnoPeriodo(x, "forn") &&
      (!comprador || x.comprador === comprador) &&
      (!fornecedor || x.fornecedor === fornecedor);
  });
}

function renderMatrizKraljic(stats){
  const categorias = {
    "Estratégico": stats.filter(x => x.categoria === "Estratégico"),
    "Alavancável": stats.filter(x => x.categoria === "Alavancável"),
    "Gargalo": stats.filter(x => x.categoria === "Gargalo"),
    "Não crítico": stats.filter(x => x.categoria === "Não crítico")
  };

  const card = (titulo, lista, cls, descricao) => {
    const valor = lista.reduce((s,x) => s + x.valorTotal, 0);

    return `
      <div class="kraljic-card ${cls}">
        <div>
          <h3>${esc(titulo)}</h3>
          <p>${esc(descricao)}</p>
        </div>

        <strong>${lista.length}</strong>
        <span>${money(valor)}</span>

        <ul>
          ${lista.slice(0,5).map(x => `<li>${esc(x.nome)}</li>`).join("")}
          ${lista.length > 5 ? `<li>+ ${lista.length - 5} fornecedor(es)</li>` : ""}
        </ul>
      </div>
    `;
  };

  return `
    <section class="kraljic-grid">
      ${card("Estratégico", categorias["Estratégico"], "estrategico", "Fornecedores definidos como estratégicos para a operação.")}
      ${card("Alavancável", categorias["Alavancável"], "alavancavel", "Boa performance e alto valor comprado. Espaço para negociação.")}
      ${card("Gargalo", categorias["Gargalo"], "gargalo", "Baixa performance ou maior risco de fornecimento. Exige atenção.")}
      ${card("Não crítico", categorias["Não crítico"], "nao-critico", "Menor impacto ou baixo volume de pedidos.")}
    </section>
  `;
}

function renderFornecedoresContent(base){
  const dataBase = filterFornecedoresBase(base);
  const categoriaFiltro = getFilterValue("fornCategoria");

  let stats = calcularRankingFornecedores(dataBase);

  if(categoriaFiltro){
    stats = stats.filter(x => x.categoria === categoriaFiltro);
  }

  const totalValor = stats.reduce((s,x) => s + x.valorTotal, 0);
  const totalFornecedores = stats.length;
  const estrategicos = stats.filter(x => x.categoria === "Estratégico").length;
  const gargalos = stats.filter(x => x.categoria === "Gargalo").length;

  const performanceMedia = stats.length
    ? Math.round(stats.reduce((s,x) => s + x.performance, 0) / stats.length)
    : 0;

  const topValor = [...stats].sort((a,b) => b.valorTotal - a.valorTotal).slice(0,10);
  const topRisco = [...stats].sort((a,b) => {
    if(a.performance !== b.performance) return a.performance - b.performance;
    return b.valorTotal - a.valorTotal;
  }).slice(0,10);

  const content = document.getElementById("fornecedoresContent");
  if(!content) return;

  content.innerHTML = `
    <section class="kpis">
      ${kpi("Fornecedores analisados", totalFornecedores, "blue")}
      ${kpi("Valor analisado", money(totalValor), "blue")}
      ${kpi("Performance média", `${performanceMedia}%`, corPerformanceFornecedor(performanceMedia))}
      ${kpi("Estratégicos", estrategicos, "red")}
      ${kpi("Gargalos", gargalos, "orange")}
    </section>

    ${renderMatrizKraljic(stats)}

    <section class="panel-grid">
      <div class="panel">
        <h2>Top fornecedores por valor</h2>
        ${topValor.length ? topValor.map(x => {
          return barLine(x.nome, x.valorTotal, "bar-red", money(x.valorTotal), topValor[0]?.valorTotal || 1);
        }).join("") : `<div class="empty-state">Sem fornecedores para os filtros selecionados.</div>`}
      </div>

      <div class="panel">
        <h2>Fornecedores com maior atenção</h2>
        ${topRisco.length ? topRisco.map(x => {
          return barLine(`${x.nome} • ${x.performance}%`, 100 - x.performance, "bar-orange", `${x.performance}%`, 100);
        }).join("") : `<div class="empty-state">Sem fornecedores para os filtros selecionados.</div>`}
      </div>
    </section>

    <section class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Fornecedor</th>
            <th>Categoria</th>
            <th>Valor comprado</th>
            <th>Pedidos</th>
            <th>Linhas</th>
            <th>Performance</th>
            <th>Entregues</th>
            <th>Atraso médio</th>
            <th>Prazo médio pgto</th>
            <th>Compradores</th>
          </tr>
        </thead>

        <tbody>
          ${stats.map(x => `
            <tr>
              <td><b>${esc(x.nome)}</b></td>
              <td><span class="badge ${categoriaFornecedorClass(x.categoria)}">${esc(x.categoria)}</span></td>
              <td>${money(x.valorTotal)}</td>
              <td>${x.pedidosUnicos}</td>
              <td>${x.linhas}</td>
              <td><b class="${corPerformanceFornecedor(x.performance)}">${x.performance}%</b></td>
              <td>${x.entreguesNoPrazo}/${x.entregues}</td>
              <td>${x.atrasoMedio} dias</td>
              <td>${x.prazoMedioPagamento} dias</td>
              <td>${esc(x.compradores.join(", ") || "—")}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </section>
  `;
}
/* =========================
   RANKING SAVING / SUPABASE
========================= */

const STATUS_SAVING = [
  "Homologação em curso",
  "Homologado",
  "Declinado"
];

const TIPOS_SAVING = [
  "Saving",
  "Cost Avoidance",
  "Reajuste evitado",
  "Negociação comercial",
  "Troca de fornecedor",
  "Homologação"
];

function jsArg(value){
  return String(value || "")
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "\\'")
    .replace(/\n/g, " ");
}

function keyClean(text){
  return String(text || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g,"")
    .replace(/[^a-zA-Z0-9]+/g," ")
    .toLowerCase()
    .trim();
}

function getSaving(row, names){
  const keys = Object.keys(row || {});

  for(const name of names){
    const target = keyClean(name);
    const found = keys.find(k => keyClean(k) === target);
    if(found) return row[found];
  }

  return "";
}

function parseDateSmart(text){
  const raw = String(text || "").trim();

  if(!raw) return null;

  if(/^\d{4}-\d{2}-\d{2}/.test(raw)){
    const [year, month, day] = raw.slice(0,10).split("-").map(Number);
    const date = new Date(year, month - 1, day);
    date.setHours(0,0,0,0);
    return date;
  }

  return parseDateBR(raw);
}

function hojeISO(){
  const d = new Date();

  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

function gerarIdLocal(){
  if(window.crypto && window.crypto.randomUUID){
    return window.crypto.randomUUID();
  }

  return `local-${Date.now()}-${Math.round(Math.random() * 999999)}`;
}

function normalizarStatusSaving(status){
  const raw = String(status || "").trim();

  const encontrado = STATUS_SAVING.find(x => norm(x) === norm(raw));
  return encontrado || "Homologação em curso";
}

function mapSavingRow(row){
  const id = getSaving(row, ["id", "uuid", "codigo", "código"]) || gerarIdLocal();

  const dataRaw = getSaving(row, ["data", "created_at", "data registro", "data da negociação", "data negociacao"]);
  const dataObj = parseDateSmart(dataRaw) || new Date();

  const valorAnterior = numberBR(getSaving(row, [
    "valor anterior",
    "valor_anterior",
    "preco anterior",
    "preço anterior",
    "valor antigo",
    "preco antigo",
    "preço antigo"
  ]));

  const valorNovo = numberBR(getSaving(row, [
    "valor novo",
    "valor_novo",
    "preco novo",
    "preço novo",
    "valor atual",
    "preco atual",
    "preço atual"
  ]));

  const quantidade = numberBR(getSaving(row, [
    "quantidade",
    "qtd",
    "volume",
    "volume anual",
    "quantidade anual"
  ]));

  const status = normalizarStatusSaving(getSaving(row, ["status", "situação", "situacao"]));

  const comprador = getSaving(row, ["comprador", "responsavel", "responsável"]) || "Não informado";
  const fornecedor = getSaving(row, ["fornecedor", "supplier"]) || "Não informado";
  const categoria = getSaving(row, ["categoria", "grupo", "familia", "família"]) || "Não informado";
  const descricao = getSaving(row, ["descricao", "descrição", "item", "produto", "negociacao", "negociação"]) || "Sem descrição";
  const tipo = getSaving(row, ["tipo", "tipo saving", "classificacao", "classificação"]) || "Saving";
  const observacao = getSaving(row, ["observacao", "observação", "obs", "comentario", "comentário"]) || "";

  const diferencaUnit = valorAnterior - valorNovo;
  const impacto = diferencaUnit * quantidade;

  const savingCalculado = impacto > 0 ? impacto : 0;
  const reajusteCalculado = impacto < 0 ? Math.abs(impacto) : 0;

  return {
    id:String(id),
    data:dataRaw || hojeISO(),
    dataObj,
    anoBase:String(dataObj.getFullYear()),
    mesBase:dataObj.getMonth() + 1,
    mesKey:monthKeyFromDate(dataObj),

    comprador,
    fornecedor,
    categoria,
    descricao,
    tipo,
    status,
    observacao,

    valorAnterior,
    valorNovo,
    quantidade,

    diferencaUnit,
    impacto,
    savingCalculado,
    reajusteCalculado
  };
}

function savingToSupabasePayload(reg){
  return {
    data: reg.data || hojeISO(),
    comprador: reg.comprador || "Não informado",
    fornecedor: reg.fornecedor || "Não informado",
    categoria: reg.categoria || "Não informado",
    descricao: reg.descricao || "Sem descrição",
    tipo: reg.tipo || "Saving",
    valor_anterior: Number(reg.valorAnterior || 0),
    valor_novo: Number(reg.valorNovo || 0),
    quantidade: Number(reg.quantidade || 0),
    status: normalizarStatusSaving(reg.status),
    observacao: reg.observacao || ""
  };
}

async function carregarSavingsLocal(force = false){
  if(savingData.length && !force) return savingData;

  const client = getSupabaseClient();

  if(client){
    const { data, error } = await client
      .from("savings")
      .select("*")
      .order("created_at", { ascending:false });

    if(!error && Array.isArray(data)){
      savingData = data.map(mapSavingRow);
      return savingData;
    }

    console.warn("Não foi possível carregar savings do Supabase. Tentando CSV local.", error);
  }

  try{
    const rows = await loadCSV(FILES.saving, false);
    savingData = rows.map(mapSavingRow);
  }catch(error){
    console.warn("saving.csv não carregado. Ranking Saving iniciará vazio.", error);
    savingData = [];
  }

  return savingData;
}

async function renderSaving(){
  app.innerHTML = `
    <section class="hero">
      <h1>Ranking Saving</h1>
      <p>Carregando registros de saving...</p>
    </section>
  `;

  try{
    await carregarSavingsLocal(true);
    renderSavingView(savingData);
  }catch(error){
    console.error("Erro Ranking Saving:", error);

    app.innerHTML = `
      <section class="hero">
        <h1>Ranking Saving</h1>
        <p>Erro ao carregar os registros de saving. Veja o Console com F12.</p>
      </section>
    `;
  }
}

function anosSavingDisponiveis(base){
  const anos = [...new Set(base.map(x => x.anoBase).filter(Boolean))]
    .sort((a,b) => Number(b) - Number(a));

  if(!anos.includes(ANO_PADRAO)) anos.unshift(ANO_PADRAO);

  return [...new Set([...anos, OPCAO_TODOS_ANOS])];
}

function renderSavingView(base){
  const anos = anosSavingDisponiveis(base);
  const compradores = uniqueOptions(base, "comprador");
  const fornecedores = uniqueOptions(base, "fornecedor");

  app.innerHTML = `
    <section class="hero">
      <h1>Ranking Saving</h1>
      <p>
        Controle de saving, reajuste evitado e homologações, com registros salvos no Supabase.
      </p>
    </section>

    ${renderFilterBar([
      {type:"select", id:"savingAno", label:"Ano", options:anos},
      {type:"select", id:"savingMesInicial", label:"Mês inicial", options:MESES_FILTRO},
      {type:"select", id:"savingMesFinal", label:"Mês final", options:MESES_FILTRO},
      {type:"select", id:"savingCompradorFiltro", label:"Todos compradores", options:compradores},
      {type:"select", id:"savingFornecedorFiltro", label:"Todos fornecedores", options:fornecedores},
      {type:"select", id:"savingStatusFiltro", label:"Todos status", options:STATUS_SAVING}
    ])}

    <div id="savingContent"></div>
  `;

  aplicarPeriodoPadrao("saving");

  attachFilterEvents(
    ["savingAno","savingMesInicial","savingMesFinal","savingCompradorFiltro","savingFornecedorFiltro","savingStatusFiltro"],
    () => renderSavingContent(base)
  );

  renderSavingContent(base);
}

function passaFiltroSaving(x){
  const anoSelecionado = getFilterValue("savingAno") || ANO_PADRAO;
  const comprador = getFilterValue("savingCompradorFiltro");
  const fornecedor = getFilterValue("savingFornecedorFiltro");
  const status = getFilterValue("savingStatusFiltro");

  if(anoSelecionado !== OPCAO_TODOS_ANOS && x.anoBase !== anoSelecionado){
    return false;
  }

  const {ini, fim} = getPeriodoMes("saving");

  if(ini !== null && fim !== null){
    if(!x.dataObj) return false;

    const mes = x.dataObj.getMonth() + 1;
    if(mes < ini || mes > fim) return false;
  }

  return (!comprador || x.comprador === comprador) &&
    (!fornecedor || x.fornecedor === fornecedor) &&
    (!status || x.status === status);
}

function filterSavings(base){
  return base.filter(passaFiltroSaving);
}

function statusSavingClass(status){
  const s = norm(status);

  if(s.includes("homologado")) return "badge-green";
  if(s.includes("declinado")) return "badge-red";
  if(s.includes("curso")) return "badge-yellow";

  return "badge-blue";
}

function calcularResumoSaving(data){
  const ativos = data.filter(x => x.status !== "Declinado");
  const homologados = data.filter(x => x.status === "Homologado");
  const curso = data.filter(x => x.status === "Homologação em curso");
  const declinados = data.filter(x => x.status === "Declinado");

  const savingHomologado = homologados.reduce((s,x) => s + x.savingCalculado, 0);
  const savingEmCurso = curso.reduce((s,x) => s + x.savingCalculado, 0);
  const reajusteEvitado = ativos.reduce((s,x) => s + x.reajusteCalculado, 0);
  const impactoLiquido = ativos.reduce((s,x) => s + x.impacto, 0);

  return {
    registros:data.length,
    ativos:ativos.length,
    homologados:homologados.length,
    curso:curso.length,
    declinados:declinados.length,
    savingHomologado,
    savingEmCurso,
    reajusteEvitado,
    impactoLiquido
  };
}

function renderSavingForm(){
  return `
    <section class="panel saving-form-panel">
      <div class="panel-title-row">
        <div>
          <h2>Novo registro de saving</h2>
          <p>Informe o preço anterior, preço novo e volume para o cálculo automático.</p>
        </div>
      </div>

      <form class="saving-form" onsubmit="salvarRegistroSaving(event)">
        <input id="savingData" type="date" value="${hojeISO()}">

        <input id="savingComprador" placeholder="Comprador / responsável">
        <input id="savingFornecedor" placeholder="Fornecedor">
        <input id="savingCategoria" placeholder="Categoria / família">
        <input id="savingDescricao" placeholder="Descrição da negociação">

        <select id="savingTipo">
          ${TIPOS_SAVING.map(x => `<option value="${esc(x)}">${esc(x)}</option>`).join("")}
        </select>

        <input id="savingValorAnterior" placeholder="Valor anterior" inputmode="decimal">
        <input id="savingValorNovo" placeholder="Valor novo" inputmode="decimal">
        <input id="savingQuantidade" placeholder="Quantidade / volume" inputmode="decimal">

        <select id="savingStatus">
          ${STATUS_SAVING.map(x => `<option value="${esc(x)}">${esc(x)}</option>`).join("")}
        </select>

        <input id="savingObservacao" placeholder="Observação">

        <button class="btn" type="submit">Salvar registro</button>
      </form>

      <div class="saving-import-row">
        <input id="savingImportCSV" type="file" accept=".csv">
        <button class="btn secondary" type="button" onclick="importarSavingCSV()">Importar CSV</button>
      </div>
    </section>
  `;
}

function renderSavingContent(base){
  const data = filterSavings(base);
  const resumo = calcularResumoSaving(data);

  const porComprador = Object.values(group(data.filter(x => x.status !== "Declinado"), "comprador"))
    .map(g => ({
      nome:g.nome,
      valor:g.items.reduce((s,x) => s + x.savingCalculado, 0)
    }))
    .sort((a,b) => b.valor - a.valor);

  const porFornecedor = Object.values(group(data.filter(x => x.status !== "Declinado"), "fornecedor"))
    .map(g => ({
      nome:g.nome,
      valor:g.items.reduce((s,x) => s + x.savingCalculado, 0)
    }))
    .sort((a,b) => b.valor - a.valor)
    .slice(0,10);

  const porStatus = STATUS_SAVING.map(status => [
    status,
    data.filter(x => x.status === status).length,
    status === "Homologado" ? "bar-green" : status === "Declinado" ? "bar-red" : "bar-yellow"
  ]);

  const content = document.getElementById("savingContent");
  if(!content) return;

  content.innerHTML = `
    <section class="kpis">
      ${kpi("Registros filtrados", resumo.registros, "blue")}
      ${kpi("Saving homologado", money(resumo.savingHomologado), "green")}
      ${kpi("Saving em curso", money(resumo.savingEmCurso), "yellow")}
      ${kpi("Reajuste / impacto", money(resumo.reajusteEvitado), "orange")}
      ${kpi("Impacto líquido", money(resumo.impactoLiquido), resumo.impactoLiquido >= 0 ? "green" : "red")}
      ${kpi("Homologados", resumo.homologados, "green")}
      ${kpi("Em homologação", resumo.curso, "yellow")}
      ${kpi("Declinados", resumo.declinados, "red")}
    </section>

    ${renderSavingForm()}

    <section class="panel-grid">
      <div class="panel">
        <h2>Saving por comprador</h2>
        ${porComprador.length ? porComprador.map(x => {
          return barLine(x.nome, x.valor, "bar-green", money(x.valor), porComprador[0]?.valor || 1);
        }).join("") : `<div class="empty-state">Sem saving ativo para o período.</div>`}
      </div>

      <div class="panel">
        <h2>Top fornecedores por saving</h2>
        ${porFornecedor.length ? porFornecedor.map(x => {
          return barLine(x.nome, x.valor, "bar-blue", money(x.valor), porFornecedor[0]?.valor || 1);
        }).join("") : `<div class="empty-state">Sem fornecedores para o período.</div>`}
      </div>

      <div class="panel">
        <h2>Status das negociações</h2>
        ${barList(porStatus, Math.max(...porStatus.map(x => x[1]), 1))}
      </div>
    </section>

    <section class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Data</th>
            <th>Comprador</th>
            <th>Fornecedor</th>
            <th>Categoria</th>
            <th>Descrição</th>
            <th>Tipo</th>
            <th>Valor anterior</th>
            <th>Valor novo</th>
            <th>Qtd</th>
            <th>Saving</th>
            <th>Impacto</th>
            <th>Status</th>
            <th>Ações</th>
          </tr>
        </thead>

        <tbody>
          ${data.map(x => `
            <tr>
              <td>${esc(x.data || "—")}</td>
              <td>${esc(x.comprador || "—")}</td>
              <td><b>${esc(x.fornecedor || "—")}</b></td>
              <td>${esc(x.categoria || "—")}</td>
              <td>
                ${esc(x.descricao || "—")}
                ${x.observacao ? `<br><small>${esc(x.observacao)}</small>` : ""}
              </td>
              <td>${esc(x.tipo || "—")}</td>
              <td>${money(x.valorAnterior)}</td>
              <td>${money(x.valorNovo)}</td>
              <td>${Number(x.quantidade || 0).toLocaleString("pt-BR", {maximumFractionDigits:2})}</td>
              <td><b class="green">${money(x.savingCalculado)}</b></td>
              <td><b class="${x.impacto >= 0 ? "green" : "red"}">${money(x.impacto)}</b></td>
              <td><span class="badge ${statusSavingClass(x.status)}">${esc(x.status)}</span></td>
              <td>
                <div class="table-actions">
                  <button class="mini-btn" onclick="alterarStatusSaving('${jsArg(x.id)}','Homologado')">Homologar</button>
                  <button class="mini-btn" onclick="alterarStatusSaving('${jsArg(x.id)}','Homologação em curso')">Curso</button>
                  <button class="mini-btn danger" onclick="alterarStatusSaving('${jsArg(x.id)}','Declinado')">Declinar</button>
                  <button class="mini-btn danger" onclick="excluirSaving('${jsArg(x.id)}')">Excluir</button>
                </div>
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>

      ${!data.length ? `<div class="empty-state">Nenhum registro de saving encontrado para os filtros selecionados.</div>` : ""}
    </section>
  `;
}

async function salvarRegistroSaving(event){
  if(event) event.preventDefault();

  const reg = {
    data:getFilterValue("savingData") || hojeISO(),
    comprador:getFilterValue("savingComprador") || "Não informado",
    fornecedor:getFilterValue("savingFornecedor") || "Não informado",
    categoria:getFilterValue("savingCategoria") || "Não informado",
    descricao:getFilterValue("savingDescricao") || "Sem descrição",
    tipo:getFilterValue("savingTipo") || "Saving",
    valorAnterior:numberBR(getFilterValue("savingValorAnterior")),
    valorNovo:numberBR(getFilterValue("savingValorNovo")),
    quantidade:numberBR(getFilterValue("savingQuantidade")),
    status:normalizarStatusSaving(getFilterValue("savingStatus")),
    observacao:getFilterValue("savingObservacao") || ""
  };

  if(!reg.valorAnterior || !reg.valorNovo || !reg.quantidade){
    alert("Informe valor anterior, valor novo e quantidade para calcular o saving.");
    return;
  }

  const client = getSupabaseClient();

  if(client){
    const { error } = await client
      .from("savings")
      .insert([savingToSupabasePayload(reg)]);

    if(error){
      console.error("Erro ao salvar saving:", error);
      alert("Não consegui salvar no Supabase. Veja o Console com F12.");
      return;
    }
  }else{
    savingData.unshift(mapSavingRow({
      id:gerarIdLocal(),
      data:reg.data,
      comprador:reg.comprador,
      fornecedor:reg.fornecedor,
      categoria:reg.categoria,
      descricao:reg.descricao,
      tipo:reg.tipo,
      valor_anterior:reg.valorAnterior,
      valor_novo:reg.valorNovo,
      quantidade:reg.quantidade,
      status:reg.status,
      observacao:reg.observacao
    }));
  }

  await carregarSavingsLocal(true);
  renderSavingView(savingData);
}

async function alterarStatusSaving(id, status){
  const client = getSupabaseClient();

  if(client){
    const { error } = await client
      .from("savings")
      .update({ status:normalizarStatusSaving(status) })
      .eq("id", id);

    if(error){
      console.error("Erro ao alterar status:", error);
      alert("Não consegui alterar o status no Supabase. Veja o Console com F12.");
      return;
    }
  }else{
    const item = savingData.find(x => x.id === id);
    if(item) item.status = normalizarStatusSaving(status);
  }

  await carregarSavingsLocal(true);
  renderSavingView(savingData);
}

async function excluirSaving(id){
  const ok = confirm("Excluir este registro de saving?");
  if(!ok) return;

  const client = getSupabaseClient();

  if(client){
    const { error } = await client
      .from("savings")
      .delete()
      .eq("id", id);

    if(error){
      console.error("Erro ao excluir saving:", error);
      alert("Não consegui excluir no Supabase. Veja o Console com F12.");
      return;
    }
  }else{
    savingData = savingData.filter(x => x.id !== id);
  }

  await carregarSavingsLocal(true);
  renderSavingView(savingData);
}

async function importarSavingCSV(){
  const input = document.getElementById("savingImportCSV");
  const file = input?.files?.[0];

  if(!file){
    alert("Selecione um arquivo CSV para importar.");
    return;
  }

  const text = await file.text();
  const rows = parseCSV(text);

  if(rows.length <= 1){
    alert("CSV vazio ou sem cabeçalho.");
    return;
  }

  const headers = rows[0].map(h => String(h || "").trim().replace(/^\uFEFF/, ""));

  const objetos = rows.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => obj[h] = row[i] || "");
    return obj;
  });

  const registros = objetos.map(mapSavingRow);
  const client = getSupabaseClient();

  if(client){
    const payload = registros.map(savingToSupabasePayload);

    const { error } = await client
      .from("savings")
      .insert(payload);

    if(error){
      console.error("Erro ao importar CSV:", error);
      alert("Não consegui importar no Supabase. Veja o Console com F12.");
      return;
    }
  }else{
    savingData = [...registros, ...savingData];
  }

  await carregarSavingsLocal(true);
  renderSavingView(savingData);
}

/* =========================
   INICIALIZAÇÃO
========================= */

renderGeral();
/* =========================================================
   LINSHALM COMPRAS — APP.JS COMPLETO
   Dashboard Geral | Ranking Fornecedores | Ranking Saving
========================================================= */

/* =========================
   ARQUIVOS
========================= */

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

/* =========================
   SUPABASE
========================= */

const SUPABASE_URL = "https://ylldnlmptfeonvrueoke.supabase.co";
const SUPABASE_KEY = "sb_publishable_BBHqYdMh-GcJ5CEtyy9EUw_3VcM78Ry";

let supabaseClient = null;

function getSupabaseClient(){
  if(supabaseClient) return supabaseClient;

  if(window.supabase && window.supabase.createClient){
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    return supabaseClient;
  }

  console.warn("Supabase não carregado. O painel tentará usar CSV local quando aplicável.");
  return null;
}

/* =========================
   CONSTANTES GERAIS
========================= */

const ANO_PADRAO = "2026";
const ANOS_HISTORICO = ["2026", "2025", "2024", "2023"];
const OPCAO_TODOS_ANOS = "Todos os anos";

const MESES_FILTRO = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

const CONDICOES_PAGAMENTO = {
  "6": 28, "2": 7, "91": 49, "14": 45, "45": 52.5, "136": 59,
  "12": 42, "9": 35, "19": 45, "31": 28, "105": 30, "26": 42,
  "23": 60, "17": 37.5, "28": 56, "10": 45, "39": 60, "29": 75,
  "8": 45, "7": 30, "20": 35, "30": 42, "11": 35, "3": 10,
  "84": 42, "4": 14, "5": 21, "153": 50, "106": 35, "52": 0,
  "32": 31.5, "82": 15, "53": 0, "24": 0, "67": 5, "56": 17.5,
  "85": 31.5, "99": 22.5, "122": 105, "47": 0, "152": 48,
  "151": 60, "150": 15, "88": 90, "137": 38.5, "155": 37.5,
  "16": 70, "21": 28, "156": 75, "154": 64, "149": 21
};

/* =========================
   INFLAÇÃO — MÁSCARAS
========================= */

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

/* =========================
   FORNECEDORES ESTRATÉGICOS
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
   SAVING
========================= */

const STATUS_SAVING = [
  "Homologação em curso",
  "Homologado",
  "Declinado"
];

const TIPOS_SAVING = [
  "Saving",
  "Reajuste / Impacto",
  "Cost Avoidance",
  "Reajuste evitado",
  "Negociação comercial",
  "Troca de fornecedor",
  "Homologação"
];

/* =========================
   ESTADO GLOBAL
========================= */

let geralData = [];
let savingData = [];
let indicesData = [];

let savingRawColumns = [];
let indicesTentouCarregar = false;
let inflacaoPontoSelecionado = null;
let appInicializado = false;

let app = document.getElementById("app");

function ensureAppElement(){
  app = document.getElementById("app");

  if(!app){
    console.error("Elemento #app não encontrado no HTML.");
    return null;
  }

  return app;
}

/* =========================
   HELPERS BASE
========================= */

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

function parseDateBR(text){
  const raw = String(text || "").trim();

  if(!raw) return null;

  if(/^\d{4}-\d{2}-\d{2}/.test(raw)){
    const [year, month, day] = raw.slice(0,10).split("-").map(Number);
    const date = new Date(year, month - 1, day);
    date.setHours(0,0,0,0);
    return date;
  }

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
/* =========================
   HELPERS DE CHAVE / CAMPOS
========================= */

function keyClean(text){
  return String(text || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g,"")
    .replace(/[^a-zA-Z0-9]+/g," ")
    .toLowerCase()
    .trim();
}

function get(obj, names){
  const keys = Object.keys(obj || {});

  for(const name of names){
    const target = keyClean(name);
    const found = keys.find(k => keyClean(k) === target);
    if(found) return obj[found];
  }

  return "";
}

function getLike(obj, names){
  const keys = Object.keys(obj || {});

  for(const name of names){
    const target = keyClean(name);
    const found = keys.find(k => {
      const clean = keyClean(k);
      return clean.includes(target) || target.includes(clean);
    });

    if(found) return obj[found];
  }

  return "";
}

function jsArg(value){
  return String(value || "")
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "\\'")
    .replace(/\n/g, " ");
}

/* =========================
   CSV
========================= */

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

/* =========================
   FILTROS
========================= */

function uniqueOptions(data, key){
  return [...new Set(data.map(item => item[key]).filter(Boolean))]
    .sort((a,b) => String(a).localeCompare(String(b), "pt-BR"));
}

function optionList(values, label){
  return `<option value="">${esc(label)}</option>` + values.map(v => {
    return `<option value="${esc(v)}">${esc(v)}</option>`;
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
}

function triggerFilter(id){
  const el = document.getElementById(id);
  if(!el) return;

  el.dispatchEvent(new Event("change"));
}

function setFilterAndTrigger(id, value){
  setFilterValue(id, value);
  triggerFilter(id);
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

/* =========================
   COMPONENTES VISUAIS
========================= */

function kpi(label, value, color = "blue", action = ""){
  const clickable = action ? `onclick="${action}" style="cursor:pointer"` : "";

  return `
    <div class="kpi" ${clickable}>
      <small>${esc(label)}</small>
      <strong class="${color}">${value}</strong>
    </div>
  `;
}

function miniKpi(label, value, color = "blue"){
  return `
    <div style="
      background:#020617;
      border:1px solid #334155;
      border-radius:14px;
      padding:13px 14px;
      min-height:82px;
      display:flex;
      flex-direction:column;
      justify-content:center;
    ">
      <small style="
        color:#94a3b8;
        font-weight:800;
        font-size:9px;
        letter-spacing:.7px;
        text-transform:uppercase;
        margin-bottom:7px;
      ">${esc(label)}</small>
      <strong class="${color}" style="
        display:block;
        font-size:17px;
        font-weight:900;
        line-height:1.12;
        overflow-wrap:anywhere;
      ">${value}</strong>
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
        items:[]
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

/* =========================
   FORMATAÇÕES
========================= */

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

/* =========================
   PERÍODO / ANO / MÊS
========================= */

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
/* =========================
   INFLAÇÃO — OPÇÕES / MÁSCARAS
========================= */

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

  const render = lista => lista.map(opcao => {
    return `<option value="${esc(opcao.id)}">${esc(opcao.label)}</option>`;
  }).join("");

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

/* =========================
   ÍNDICES EXTERNOS OPCIONAIS
========================= */

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

/* =========================
   BASE GERAL
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

function mapGeralRows(rows, anoBase = ANO_PADRAO){
  return rows.map(r => {
    const quantidade = numberBR(get(r, [
      "Quantidade Compra",
      "Qtd Compra",
      "Quantidade",
      "Qtd"
    ]));

    const precoUnitario = numberBR(get(r, [
      "Preço Unit. Compra",
      "Preco Unit. Compra",
      "Preço Unitário Compra",
      "Preco Unitario Compra",
      "Preço Unitário",
      "Preco Unitario"
    ]));

    const valor = quantidade * precoUnitario;

    const dataRecebimento = get(r, [
      "Data Recebimentos",
      "Data Recebimento",
      "Recebimento",
      "Data de Recebimento"
    ]);

    const dataRecebimentoObj = parseDateBR(dataRecebimento);

    const previsaoInicial = get(r, [
      "Previsão Entrega Inicial",
      "Previsao Entrega Inicial",
      "Data Prevista Inicial",
      "Previsão Inicial",
      "Previsao Inicial"
    ]);

    const previsaoInicialObj = parseDateBR(previsaoInicial);
    const dataLimiteOperacionalObj = addDays(previsaoInicialObj, 7);

    const condicaoPagamento = String(get(r, [
      "Condição Pagamento",
      "Condicao Pagamento",
      "Condição de Pagamento",
      "Condicao de Pagamento"
    ])).trim();

    const prazoPagamento = CONDICOES_PAGAMENTO[condicaoPagamento] ?? 0;

    const mascaraEntrada = get(r, [
      "Máscara de Entrada",
      "Mascara de Entrada",
      "Mascara Entrada",
      "Máscara Entrada"
    ]);

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

      pedido: get(r, ["Pedido", "Número Pedido", "Nº Pedido", "Num Pedido", "Numero Pedido"]),
      produto: get(r, ["Produto", "Cod Produto", "Código Produto", "Codigo Produto", "Item"]),
      descricaoProduto: get(r, ["Descrição Produto", "Descricao Produto", "Desc Produto", "Produto Descrição", "Produto Descricao"]),
      fornecedor: get(r, ["Descrição Fornecedor", "Descricao Fornecedor", "Fornecedor", "Nome Fornecedor"]),
      comprador: get(r, ["Nome Comprador", "Comprador", "Buyer"]),

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

/* =========================
   CÁLCULO INFLACIONÁRIO
========================= */

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

    const primeiro = grupos[0];

    item.variacaoPeriodo = primeiro && primeiro.precoInterno > 0
      ? ((item.precoInterno / primeiro.precoInterno) - 1) * 100
      : null;

    item.basePeriodo = primeiro || null;
  });

  return grupos;
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
/* =========================
   INFLAÇÃO — CARDS E GRÁFICO
========================= */

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

function renderInflacaoCardsPeriodo(resumo, inflacaoAnualPeriodo){
  return `
    <section style="
      display:grid;
      grid-template-columns:repeat(auto-fit,minmax(175px,1fr));
      gap:12px;
      margin:12px 0 18px;
    ">
      ${miniKpi("Modo de análise", "Período consolidado", "blue")}
      ${miniKpi("Família analisada", resumo.opcao.label, "blue")}
      ${miniKpi("Preço médio Linshalm", moneyKg(resumo.precoMedio), "blue")}
      ${miniKpi("Volume analisado", kgText(resumo.quantidadeTotal), "blue")}
      ${miniKpi("Valor comprado", money(resumo.valorTotal), "blue")}
      ${miniKpi("Inflação anual", inflacaoAnualPeriodo ? percentText(inflacaoAnualPeriodo.valor) : "Sem base anual", corPercentual(inflacaoAnualPeriodo?.valor))}
      ${miniKpi("Base anual", resumoBaseAnualPeriodo(inflacaoAnualPeriodo), "blue")}
      ${miniKpi("Variação no período", percentText(resumo.variacaoPeriodo), corPercentual(resumo.variacaoPeriodo))}
      ${miniKpi("Base do período", textoBasePeriodo(resumo), "blue")}
      ${miniKpi("Índice mercado -1", resumo.indicePonderado ? moneyKg(resumo.indicePonderado) : "Não carregado", resumo.indicePonderado ? "orange" : "yellow")}
      ${miniKpi("Diferença vs mercado", percentText(resumo.diferencaVsMercado), corMercado(resumo.diferencaVsMercado))}
      ${miniKpi("Impacto estimado", resumo.impactoEstimado !== null ? money(resumo.impactoEstimado) : "—", corImpacto(resumo.impactoEstimado))}
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
    <section style="
      display:grid;
      grid-template-columns:repeat(auto-fit,minmax(175px,1fr));
      gap:12px;
      margin:12px 0 18px;
    ">
      ${miniKpi("Modo de análise", "Mês selecionado", "blue")}
      ${miniKpi("Ponto analisado", ponto.label, "blue")}
      ${miniKpi("Preço médio Linshalm", moneyKg(ponto.precoInterno), "blue")}
      ${miniKpi("Volume analisado", kgText(ponto.quantidadeTotal), "blue")}
      ${miniKpi("Valor comprado", money(ponto.valorTotal), "blue")}
      ${miniKpi("Inflação anual", percentText(ponto.inflacaoAnual), corPercentual(ponto.inflacaoAnual))}
      ${miniKpi("Base anual", baseAnualTexto, "blue")}
      ${miniKpi("Variação desde início", percentText(ponto.variacaoPeriodo), corPercentual(ponto.variacaoPeriodo))}
      ${miniKpi("Base do período", basePeriodoTexto, "blue")}
      ${miniKpi("Índice mercado -1", ponto.indiceMercado ? moneyKg(ponto.indiceMercado) : "Não carregado", ponto.indiceMercado ? "orange" : "yellow")}
      ${miniKpi("Diferença vs mercado", percentText(ponto.diferencaPercentual), corMercado(ponto.diferencaPercentual))}
      ${miniKpi("Impacto estimado", ponto.impactoEstimado !== null ? money(ponto.impactoEstimado) : "—", corImpacto(ponto.impactoEstimado))}
    </section>
  `;
}

function renderInflacaoLineChart(rows, selectedMes){
  if(!rows.length){
    return `<div class="empty-state">Nenhuma compra encontrada para esta família no período filtrado.</div>`;
  }

  const width = 920;
  const height = 235;
  const margin = {top:34, right:46, bottom:42, left:62};
  const chartW = width - margin.left - margin.right;
  const chartH = height - margin.top - margin.bottom;

  const precoLabel = value => {
    if(value === null || value === undefined || !Number.isFinite(Number(value))) return "—";

    return `R$ ${Number(value).toLocaleString("pt-BR", {
      minimumFractionDigits:2,
      maximumFractionDigits:2
    })}`;
  };

  const eixoLabel = value => {
    if(value === null || value === undefined || !Number.isFinite(Number(value))) return "—";

    return `R$ ${Number(value).toLocaleString("pt-BR", {
      minimumFractionDigits:1,
      maximumFractionDigits:1
    })}`;
  };

  const valores = [];

  rows.forEach(x => {
    if(x.precoInterno > 0) valores.push(x.precoInterno);
    if(x.baseAnual?.precoInterno > 0) valores.push(x.baseAnual.precoInterno);
    if(x.indiceMercado > 0) valores.push(x.indiceMercado);
  });

  if(!valores.length){
    return `<div class="empty-state">Não há valores suficientes para montar o gráfico.</div>`;
  }

  const max = Math.max(...valores) * 1.10;
  const minRaw = Math.min(...valores) * 0.96;
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

  const rowsAnoAnterior = rows.filter(x => x.baseAnual?.precoInterno > 0);

  const pointsAnoAnterior = rowsAnoAnterior
    .map(x => {
      const idx = rows.indexOf(x);
      return `${xPos(idx)},${yPos(x.baseAnual.precoInterno)}`;
    }).join(" ");

  const pointsMercado = rows
    .filter(x => x.indiceMercado > 0)
    .map(x => {
      const idx = rows.indexOf(x);
      return `${xPos(idx)},${yPos(x.indiceMercado)}`;
    }).join(" ");

  const grid = [0,1,2].map(i => {
    const y = margin.top + (i / 2) * chartH;
    const value = max - (i / 2) * denom;

    return `
      <line x1="${margin.left}" y1="${y}" x2="${width - margin.right}" y2="${y}" stroke="#1e293b" stroke-width="1" />
      <text x="${margin.left - 10}" y="${y + 3}" text-anchor="end" fill="#94a3b8" font-size="8.5" font-weight="700">${eixoLabel(value)}</text>
    `;
  }).join("");

  const labelsMes = rows.map((x, idx) => {
    const selected = x.mes === selectedMes;

    return `
      <text
        x="${xPos(idx)}"
        y="${height - 16}"
        text-anchor="middle"
        fill="${selected ? "#f8fafc" : "#94a3b8"}"
        font-size="9"
        font-weight="${selected ? "900" : "700"}"
      >${esc(x.label)}</text>
    `;
  }).join("");

  const labelsValorInterno = rows.map((x, idx) => {
    const y = yPos(x.precoInterno);
    const selected = x.mes === selectedMes;
    const labelY = y < 48 ? y + 18 : y - 9;

    let anchor = "middle";
    let xLabel = xPos(idx);

    if(idx === 0){
      anchor = "start";
      xLabel += 4;
    }

    if(idx === rows.length - 1){
      anchor = "end";
      xLabel -= 4;
    }

    const mostrarLabel = rows.length <= 14 || selected || idx === 0 || idx === rows.length - 1;

    if(!mostrarLabel) return "";

    return `
      <text
        x="${xLabel}"
        y="${labelY}"
        text-anchor="${anchor}"
        fill="${selected ? "#f8fafc" : "#dbeafe"}"
        font-size="${selected ? "9.8" : "8.7"}"
        font-weight="800"
        style="cursor:pointer;"
        onclick="selecionarPontoInflacao('${x.mes}')"
      >${precoLabel(x.precoInterno)}</text>
    `;
  }).join("");

  const pontosInternos = rows.map((x, idx) => {
    const selected = x.mes === selectedMes;
    const r = selected ? 6.5 : 4.3;

    return `
      <circle
        cx="${xPos(idx)}"
        cy="${yPos(x.precoInterno)}"
        r="${r}"
        fill="${selected ? "#f8fafc" : "#38bdf8"}"
        stroke="${selected ? "#38bdf8" : "#020617"}"
        stroke-width="${selected ? "3" : "1.8"}"
        style="cursor:pointer;"
        onclick="selecionarPontoInflacao('${x.mes}')"
      >
        <title>${x.label} • Linshalm atual: ${moneyKg(x.precoInterno)} • Volume: ${kgText(x.quantidadeTotal)}</title>
      </circle>
    `;
  }).join("");

  const pontosAnoAnterior = rowsAnoAnterior.map(x => {
    const idx = rows.indexOf(x);
    const selected = x.mes === selectedMes;

    return `
      <circle
        cx="${xPos(idx)}"
        cy="${yPos(x.baseAnual.precoInterno)}"
        r="${selected ? "5.2" : "3.6"}"
        fill="#a78bfa"
        stroke="#020617"
        stroke-width="1.8"
        style="cursor:pointer;"
        onclick="selecionarPontoInflacao('${x.mes}')"
      >
        <title>${x.label} • Base anual ${x.baseAnual.label}: ${moneyKg(x.baseAnual.precoInterno)}</title>
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
        r="${selected ? "5" : "3.4"}"
        fill="#f59e0b"
        stroke="#020617"
        stroke-width="1.8"
        style="cursor:pointer;"
        onclick="selecionarPontoInflacao('${x.mes}')"
      >
        <title>${x.label} • ${esc(x.nomeIndice)}: ${moneyKg(x.indiceMercado)}</title>
      </circle>
    `;
  }).join("");

  const linhaAnoAnterior = pointsAnoAnterior
    ? `<polyline points="${pointsAnoAnterior}" fill="none" stroke="#a78bfa" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="4 5" />`
    : "";

  const linhaMercado = pointsMercado
    ? `<polyline points="${pointsMercado}" fill="none" stroke="#f59e0b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="6 5" />`
    : "";

  const legendaAnoAnterior = pointsAnoAnterior
    ? `<span style="display:inline-flex;align-items:center;gap:7px;"><i style="width:22px;height:2px;background:#a78bfa;border-radius:999px;display:inline-block;"></i>Mesmo mês do ano anterior</span>`
    : `<span style="color:#94a3b8;">Histórico anual não encontrado</span>`;

  const legendaMercado = pointsMercado
    ? `<span style="display:inline-flex;align-items:center;gap:7px;"><i style="width:22px;height:2px;background:#f59e0b;border-radius:999px;display:inline-block;"></i>Mercado / LME -1</span>`
    : `<span style="color:#94a3b8;">Índice externo não carregado</span>`;

  return `
    <div style="
      width:100%;
      overflow-x:auto;
      background:#020617;
      border:1px solid #1e293b;
      border-radius:18px;
      padding:10px;
      margin-top:12px;
      display:flex;
      justify-content:center;
    ">
      <svg viewBox="0 0 ${width} ${height}" style="
        width:100%;
        max-width:1040px;
        min-width:720px;
        height:auto;
        display:block;
      ">
        <rect x="0" y="0" width="${width}" height="${height}" rx="14" fill="#020617" />

        ${grid}

        <line x1="${margin.left}" y1="${margin.top}" x2="${margin.left}" y2="${height - margin.bottom}" stroke="#334155" stroke-width="1" />
        <line x1="${margin.left}" y1="${height - margin.bottom}" x2="${width - margin.right}" y2="${height - margin.bottom}" stroke="#334155" stroke-width="1" />

        ${linhaAnoAnterior}
        ${linhaMercado}
        <polyline points="${pointsInterno}" fill="none" stroke="#38bdf8" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" />

        ${pontosAnoAnterior}
        ${pontosMercado}
        ${pontosInternos}

        ${labelsValorInterno}
        ${labelsMes}

        <text x="${margin.left}" y="20" fill="#cbd5e1" font-size="10" font-weight="900">R$/kg</text>
      </svg>
    </div>

    <div style="
      display:flex;
      align-items:center;
      gap:16px;
      flex-wrap:wrap;
      color:#cbd5e1;
      font-size:11px;
      margin:8px 0 0;
    ">
      <span style="display:inline-flex;align-items:center;gap:7px;"><i style="width:22px;height:2px;background:#38bdf8;border-radius:999px;display:inline-block;"></i>Linshalm atual</span>
      ${legendaAnoAnterior}
      ${legendaMercado}
      <span style="color:#94a3b8;">Clique em um ponto para abrir a visão do mês.</span>
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
      <section style="
        display:grid;
        grid-template-columns:repeat(auto-fit,minmax(175px,1fr));
        gap:12px;
        margin:12px 0 18px;
      ">
        ${miniKpi("Modo de análise", "Período consolidado", "blue")}
        ${miniKpi("Família analisada", opcao.label, "blue")}
        ${miniKpi("Preço médio Linshalm", "—", "blue")}
        ${miniKpi("Volume analisado", "—", "blue")}
        ${miniKpi("Inflação anual", "—", "yellow")}
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
  const temAnoAnterior = data.some(x => x.baseAnual?.precoInterno > 0);

  const avisoIndice = temIndice
    ? `Comparativo externo carregado a partir de <b>data/indices.csv</b>.`
    : `Sem <b>data/indices.csv</b> carregado.`;

  const avisoAnoAnterior = temAnoAnterior
    ? `Linha roxa: comparação com o mesmo mês do ano anterior.`
    : `Histórico anual ainda não encontrado para essa família/período.`;

  const acaoPonto = pontoSelecionado
    ? `<button type="button" onclick="limparPontoInflacao()" style="
        background:#111827;
        color:#e5e7eb;
        border:1px solid #334155;
        border-radius:14px;
        padding:11px 16px;
        font-weight:800;
        cursor:pointer;
        font-size:13px;
      ">Voltar para consolidado do período</button>`
    : `<button type="button" disabled style="
        background:#111827;
        color:#94a3b8;
        border:1px solid #334155;
        border-radius:14px;
        padding:11px 16px;
        font-weight:800;
        cursor:not-allowed;
        opacity:.6;
        font-size:13px;
      ">Visão consolidada do período</button>`;

  container.innerHTML = `
    <div style="
      display:flex;
      justify-content:flex-end;
      align-items:center;
      margin:10px 0 12px;
    ">
      ${acaoPonto}
    </div>

    ${cards}
    ${renderInflacaoLineChart(data, pontoSelecionado?.mes || null)}

    <div style="color:#94a3b8;font-size:12px;margin-top:10px;line-height:1.5;">
      ${avisoAnoAnterior} ${avisoIndice} Valores em R$/kg.
    </div>
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
  const root = ensureAppElement();
  if(!root) return;

  root.innerHTML = `
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

    root.innerHTML = `
      <section class="hero">
        <h1>Dashboard Geral</h1>
        <p>Erro ao carregar o arquivo <b>data/geral.csv</b>. Veja o Console com F12.</p>
      </section>
    `;
  }
}

function renderGeralView(base){
  const root = ensureAppElement();
  if(!root) return;

  const anos = anosDisponiveis(base);
  const compradores = uniqueOptions(base, "comprador");
  const fornecedores = uniqueOptions(base, "fornecedor");
  const faixas = uniqueOptions(base, "faixa");

  root.innerHTML = `
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
  setFilterAndTrigger("geralFaixa", faixa);
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

  triggerFilter("geralAno");
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
      <div style="
        display:flex;
        align-items:flex-start;
        justify-content:space-between;
        gap:16px;
        margin-bottom:16px;
      ">
        <div>
          <h2>Total recebido por mês</h2>
          <p style="color:#94a3b8;line-height:1.5;margin-top:6px;">
            Visão de recebimentos pelo valor total das linhas entregues no período.
          </p>
        </div>
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

    <section class="panel" style="margin-bottom:22px;">
      <div style="
        display:flex;
        align-items:flex-start;
        justify-content:space-between;
        gap:18px;
        flex-wrap:wrap;
        margin-bottom:16px;
      ">
        <div style="flex:1;min-width:280px;">
          <h2>Acompanhamento inflacionário — Aço e Alumínio</h2>
          <p style="color:#94a3b8;line-height:1.5;margin-top:6px;">
            Preço médio Linshalm em R$/kg, calculado por valor comprado dividido pela quantidade comprada.
            Clique em um ponto do gráfico para analisar o mês.
          </p>
        </div>

        <div style="
          min-width:260px;
          display:flex;
          flex-direction:column;
          gap:7px;
        ">
          <label for="inflacaoFamilia" style="
            color:#cbd5e1;
            font-size:12px;
            font-weight:800;
            text-transform:uppercase;
            letter-spacing:.6px;
          ">Família / subfamília</label>

          <select id="inflacaoFamilia" onchange="alterarOpcaoInflacao()" style="
            width:100%;
            background:#111827;
            color:#f8fafc;
            border:1px solid #334155;
            border-radius:12px;
            padding:12px 14px;
            font-size:14px;
            outline:none;
          ">
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
        <div style="color:#94a3b8;font-size:12px;padding:12px 14px;">
          Exibindo as primeiras 1.500 linhas do período filtrado para manter o painel leve.
        </div>
      ` : ""}
    </section>
  `;

  renderInflacaoContent(data);
}
/* =========================
   RELATÓRIO DE PEDIDOS EM ATENÇÃO
========================= */

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

  if(!win){
    alert("O navegador bloqueou a abertura do relatório. Libere pop-ups para esta página.");
    return;
  }

  win.document.open();
  win.document.write(html);
  win.document.close();
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
  const root = ensureAppElement();
  if(!root) return;

  root.innerHTML = `
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

    root.innerHTML = `
      <section class="hero">
        <h1>Ranking Fornecedores</h1>
        <p>Erro ao carregar a base de fornecedores. Veja o Console com F12.</p>
      </section>
    `;
  }
}

function renderFornecedoresView(base){
  const root = ensureAppElement();
  if(!root) return;

  const anos = anosDisponiveis(base);
  const compradores = uniqueOptions(base, "comprador");
  const fornecedores = uniqueOptions(base, "fornecedor");
  const categorias = ["Estratégico", "Alavancável", "Gargalo", "Não crítico"];

  root.innerHTML = `
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

  function quad(titulo, lista, classe, descricao){
    const valor = lista.reduce((s,x) => s + x.valorTotal, 0);

    return `
      <div class="quad ${classe}">
        <h2>${esc(titulo)}</h2>
        <div class="quad-meta">
          ${esc(descricao)}<br>
          <b>${lista.length}</b> fornecedor(es) • <b>${money(valor)}</b>
        </div>

        <div class="supplier-grid">
          ${lista.slice(0,8).map(x => `
            <div class="supplier">
              <h3>${esc(x.nome)}</h3>
              <div class="row">
                <span>Valor</span>
                <b>${money(x.valorTotal)}</b>
              </div>
              <div class="row">
                <span>Performance</span>
                <b>${x.performance}%</b>
              </div>
              <div class="row">
                <span>Pedidos</span>
                <b>${x.pedidosUnicos}</b>
              </div>
            </div>
          `).join("")}

          ${lista.length > 8 ? `
            <div class="supplier">
              <h3>+ ${lista.length - 8} fornecedor(es)</h3>
              <div class="row">
                <span>Use a tabela abaixo</span>
                <b>Detalhe</b>
              </div>
            </div>
          ` : ""}
        </div>
      </div>
    `;
  }

  return `
    <section class="matrix" style="margin-bottom:22px;">
      ${quad("Estratégico", categorias["Estratégico"], "estrategico", "Fornecedores definidos como estratégicos para a operação.")}
      ${quad("Alavancável", categorias["Alavancável"], "alavancavel", "Boa performance e alto valor comprado. Espaço para negociação.")}
      ${quad("Gargalo", categorias["Gargalo"], "gargalo", "Baixa performance ou maior risco de fornecimento. Exige atenção.")}
      ${quad("Não crítico", categorias["Não crítico"], "nao-critico", "Menor impacto ou baixo volume de pedidos.")}
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
  const alavancaveis = stats.filter(x => x.categoria === "Alavancável").length;
  const gargalos = stats.filter(x => x.categoria === "Gargalo").length;
  const naoCriticos = stats.filter(x => x.categoria === "Não crítico").length;

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
      ${kpi("Alavancáveis", alavancaveis, "green")}
      ${kpi("Gargalos", gargalos, "orange")}
      ${kpi("Não críticos", naoCriticos, "blue")}
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

      ${!stats.length ? `<div class="empty-state">Nenhum fornecedor encontrado para os filtros selecionados.</div>` : ""}
    </section>
  `;
}
/* =========================
   RANKING SAVING / SUPABASE
   Compatível com o CSV original:
   Categoria; Tipo; Data; Comprador; Código; Descrição; Fornecedor Atual...
========================= */

const SAVING_HEADERS_PADRAO = [
  "Categoria",
  "Tipo",
  "Data",
  "Comprador",
  "Código",
  "Descrição",
  "Fornecedor Atual",
  "Status",
  "Quantidade",
  "Preço Atual",
  "Competidor A",
  "Preço Competidor A",
  "Competidor B",
  "Preço Competidor B",
  "Competidor C",
  "Preço Competidor C",
  "Reajuste Solicitado %",
  "Reajuste Acordado %",
  "Observação"
];

const TIPOS_FLUXO_SAVING = [
  "Spot",
  "Anual"
];

function getSaving(row, names){
  return get(row, names);
}

function getSavingLike(row, names){
  return getLike(row, names);
}

function excelSerialToDate(serial){
  const n = Number(serial);

  if(!Number.isFinite(n) || n < 25000 || n > 90000){
    return null;
  }

  const date = new Date(Date.UTC(1899, 11, 30));
  date.setUTCDate(date.getUTCDate() + n);

  const local = new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  local.setHours(0,0,0,0);

  return local;
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

  if(/^\d+(\,\d+|\.\d+)?$/.test(raw)){
    const excel = excelSerialToDate(raw.replace(",", "."));
    if(excel) return excel;
  }

  return parseDateBR(raw);
}

function dateToISO(date){
  if(!date) return "";

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;
}

function normalizarDataSaving(valor){
  const data = parseDateSmart(valor);
  return data ? dateToISO(data) : hojeISO();
}

function hojeISO(){
  return dateToISO(new Date());
}

function gerarIdLocal(){
  if(window.crypto && window.crypto.randomUUID){
    return window.crypto.randomUUID();
  }

  return `local-${Date.now()}-${Math.round(Math.random() * 999999)}`;
}

function normalizarCategoriaSaving(categoria){
  const raw = String(categoria || "").trim();
  const c = norm(raw);

  if(c.includes("reajuste")) return "Reajuste";
  return "Saving";
}

function normalizarTipoFluxoSaving(tipo){
  const raw = String(tipo || "").trim();
  const t = norm(raw);

  if(t.includes("spot")) return "Spot";
  if(t.includes("anual")) return "Anual";

  return raw || "Anual";
}

function normalizarStatusSaving(status){
  const raw = String(status || "").trim();

  if(!raw) return "Homologação em curso";

  const encontrado = STATUS_SAVING.find(x => norm(x) === norm(raw));
  if(encontrado) return encontrado;

  const s = norm(raw);

  if(s.includes("homologado") || s.includes("aprovado") || s.includes("concluido")) return "Homologado";
  if(s.includes("declinado") || s.includes("recusado") || s.includes("cancelado") || s.includes("reprovado")) return "Declinado";

  return "Homologação em curso";
}

function menorCompetidorSaving(row){
  const competidores = [
    {
      nome:getSaving(row, ["Competidor A", "competidor_a", "competidor a"]),
      preco:numberBR(getSaving(row, ["Preço Competidor A", "Preco Competidor A", "preco_competidor_a", "preço competidor a"]))
    },
    {
      nome:getSaving(row, ["Competidor B", "competidor_b", "competidor b"]),
      preco:numberBR(getSaving(row, ["Preço Competidor B", "Preco Competidor B", "preco_competidor_b", "preço competidor b"]))
    },
    {
      nome:getSaving(row, ["Competidor C", "competidor_c", "competidor c"]),
      preco:numberBR(getSaving(row, ["Preço Competidor C", "Preco Competidor C", "preco_competidor_c", "preço competidor c"]))
    }
  ].filter(x => x.preco > 0);

  if(!competidores.length){
    return {
      nome:"",
      preco:0
    };
  }

  return competidores.sort((a,b) => a.preco - b.preco)[0];
}

function originalSavingFromRow(row){
  return {
    "Categoria": normalizarCategoriaSaving(getSaving(row, ["Categoria", "categoria"])),
    "Tipo": normalizarTipoFluxoSaving(getSaving(row, ["Tipo", "tipo"])),
    "Data": normalizarDataSaving(getSaving(row, ["Data", "data", "created_at"])),
    "Comprador": getSaving(row, ["Comprador", "comprador", "responsavel", "responsável"]) || "Não informado",
    "Código": getSaving(row, ["Código", "Codigo", "codigo", "código"]) || "",
    "Descrição": getSaving(row, ["Descrição", "Descricao", "descricao", "descrição", "produto", "item"]) || "Sem descrição",
    "Fornecedor Atual": getSaving(row, ["Fornecedor Atual", "Fornecedor", "fornecedor_atual", "fornecedor atual", "fornecedor"]) || "Não informado",
    "Status": normalizarStatusSaving(getSaving(row, ["Status", "status", "situacao", "situação"])),
    "Quantidade": getSaving(row, ["Quantidade", "quantidade", "qtd", "volume"]) || "",
    "Preço Atual": getSaving(row, ["Preço Atual", "Preco Atual", "preco_atual", "preço atual", "valor atual"]) || "",
    "Competidor A": getSaving(row, ["Competidor A", "competidor_a", "competidor a"]) || "",
    "Preço Competidor A": getSaving(row, ["Preço Competidor A", "Preco Competidor A", "preco_competidor_a", "preço competidor a"]) || "",
    "Competidor B": getSaving(row, ["Competidor B", "competidor_b", "competidor b"]) || "",
    "Preço Competidor B": getSaving(row, ["Preço Competidor B", "Preco Competidor B", "preco_competidor_b", "preço competidor b"]) || "",
    "Competidor C": getSaving(row, ["Competidor C", "competidor_c", "competidor c"]) || "",
    "Preço Competidor C": getSaving(row, ["Preço Competidor C", "Preco Competidor C", "preco_competidor_c", "preço competidor c"]) || "",
    "Reajuste Solicitado %": getSaving(row, ["Reajuste Solicitado %", "reajuste_solicitado", "reajuste solicitado %"]) || "",
    "Reajuste Acordado %": getSaving(row, ["Reajuste Acordado %", "reajuste_acordado", "reajuste acordado %"]) || "",
    "Observação": getSaving(row, ["Observação", "Observacao", "observacao", "observação", "obs"]) || ""
  };
}

function mapSavingRow(row){
  const original = originalSavingFromRow(row);

  const id = getSaving(row, [
    "id",
    "uuid",
    "registro"
  ]) || gerarIdLocal();

  const categoria = original["Categoria"];
  const tipo = original["Tipo"];
  const data = original["Data"];
  const dataObj = parseDateSmart(data) || new Date();

  const quantidade = numberBR(original["Quantidade"]);
  const precoAtual = numberBR(original["Preço Atual"]);

  const melhorCompetidor = menorCompetidorSaving(original);
  const menorPrecoCompetidor = melhorCompetidor.preco;

  const reajusteSolicitadoPct = numberBR(original["Reajuste Solicitado %"]);
  const reajusteAcordadoPct = numberBR(original["Reajuste Acordado %"]);

  let savingCalculado = 0;
  let reajusteEvitado = 0;
  let reajusteCalculado = 0;
  let impacto = 0;

  if(categoria === "Saving"){
    savingCalculado = menorPrecoCompetidor > 0
      ? Math.max(0, (precoAtual - menorPrecoCompetidor) * quantidade)
      : 0;

    impacto = savingCalculado;
  }

  if(categoria === "Reajuste"){
    const reajusteSolicitadoValor = precoAtual * quantidade * (reajusteSolicitadoPct / 100);
    const reajusteAcordadoValor = precoAtual * quantidade * (reajusteAcordadoPct / 100);

    reajusteEvitado = Math.max(0, reajusteSolicitadoValor - reajusteAcordadoValor);
    reajusteCalculado = Math.max(0, reajusteAcordadoValor);

    savingCalculado = reajusteEvitado;
    impacto = -reajusteCalculado;
  }

  return {
    id:String(id),

    categoria,
    tipo,
    data,
    dataObj,
    anoBase:String(dataObj.getFullYear()),
    mesBase:dataObj.getMonth() + 1,
    mesKey:monthKeyFromDate(dataObj),

    comprador:original["Comprador"],
    codigo:original["Código"],
    descricao:original["Descrição"],
    fornecedor:original["Fornecedor Atual"],
    status:original["Status"],
    observacao:original["Observação"],

    quantidade,
    precoAtual,

    competidorA:original["Competidor A"],
    precoCompetidorA:numberBR(original["Preço Competidor A"]),
    competidorB:original["Competidor B"],
    precoCompetidorB:numberBR(original["Preço Competidor B"]),
    competidorC:original["Competidor C"],
    precoCompetidorC:numberBR(original["Preço Competidor C"]),

    melhorCompetidor:melhorCompetidor.nome,
    menorPrecoCompetidor,

    reajusteSolicitadoPct,
    reajusteAcordadoPct,
    reajusteEvitado,
    reajusteCalculado,

    savingCalculado,
    impacto,

    _raw:row,
    _original:original
  };
}

function colunaSupabaseSaving(headerPadrao){
  const variantes = {
    "Categoria":["Categoria", "categoria"],
    "Tipo":["Tipo", "tipo"],
    "Data":["Data", "data"],
    "Comprador":["Comprador", "comprador"],
    "Código":["Código", "Codigo", "codigo", "código"],
    "Descrição":["Descrição", "Descricao", "descricao", "descrição"],
    "Fornecedor Atual":["Fornecedor Atual", "Fornecedor", "fornecedor_atual", "fornecedor atual", "fornecedor"],
    "Status":["Status", "status"],
    "Quantidade":["Quantidade", "quantidade", "qtd"],
    "Preço Atual":["Preço Atual", "Preco Atual", "preco_atual", "preço atual"],
    "Competidor A":["Competidor A", "competidor_a", "competidor a"],
    "Preço Competidor A":["Preço Competidor A", "Preco Competidor A", "preco_competidor_a", "preço competidor a"],
    "Competidor B":["Competidor B", "competidor_b", "competidor b"],
    "Preço Competidor B":["Preço Competidor B", "Preco Competidor B", "preco_competidor_b", "preço competidor b"],
    "Competidor C":["Competidor C", "competidor_c", "competidor c"],
    "Preço Competidor C":["Preço Competidor C", "Preco Competidor C", "preco_competidor_c", "preço competidor c"],
    "Reajuste Solicitado %":["Reajuste Solicitado %", "reajuste_solicitado", "reajuste solicitado %"],
    "Reajuste Acordado %":["Reajuste Acordado %", "reajuste_acordado", "reajuste acordado %"],
    "Observação":["Observação", "Observacao", "observacao", "observação", "obs"]
  };

  const cols = savingRawColumns.map(c => ({
    original:c,
    clean:keyClean(c)
  }));

  const busca = variantes[headerPadrao] || [headerPadrao];

  for(const nome of busca){
    const alvo = keyClean(nome);
    const found = cols.find(c => c.clean === alvo);
    if(found) return found.original;
  }

  return "";
}

function valorPayloadSaving(header, value){
  const h = norm(header);

  if(h === "data"){
    return normalizarDataSaving(value);
  }

  if(
    h.includes("quantidade") ||
    h.includes("preco") ||
    h.includes("preço") ||
    h.includes("reajuste")
  ){
    return numberBR(value);
  }

  return value || "";
}

function montarPayloadSupabaseSaving(rowOuRegistro){
  const original = rowOuRegistro._original
    ? rowOuRegistro._original
    : originalSavingFromRow(rowOuRegistro);

  const payload = {};

  if(savingRawColumns.length){
    SAVING_HEADERS_PADRAO.forEach(header => {
      const coluna = colunaSupabaseSaving(header);

      if(!coluna) return;

      const clean = keyClean(coluna);

      if(["id", "created at", "created_at", "updated at", "updated_at"].includes(clean)){
        return;
      }

      payload[coluna] = valorPayloadSaving(header, original[header]);
    });

    return payload;
  }

  return {
    categoria: original["Categoria"],
    tipo: original["Tipo"],
    data: normalizarDataSaving(original["Data"]),
    comprador: original["Comprador"],
    codigo: original["Código"],
    descricao: original["Descrição"],
    fornecedor_atual: original["Fornecedor Atual"],
    status: original["Status"],
    quantidade: numberBR(original["Quantidade"]),
    preco_atual: numberBR(original["Preço Atual"]),
    competidor_a: original["Competidor A"],
    preco_competidor_a: numberBR(original["Preço Competidor A"]),
    competidor_b: original["Competidor B"],
    preco_competidor_b: numberBR(original["Preço Competidor B"]),
    competidor_c: original["Competidor C"],
    preco_competidor_c: numberBR(original["Preço Competidor C"]),
    reajuste_solicitado: numberBR(original["Reajuste Solicitado %"]),
    reajuste_acordado: numberBR(original["Reajuste Acordado %"]),
    observacao: original["Observação"]
  };
}

async function carregarSavingsLocal(force = false){
  if(savingData.length && !force) return savingData;

  const client = getSupabaseClient();

  if(client){
    const { data, error } = await client
      .from("savings")
      .select("*");

    if(!error && Array.isArray(data)){
      savingRawColumns = data[0] ? Object.keys(data[0]) : savingRawColumns;

      savingData = data
        .map(mapSavingRow)
        .sort((a,b) => {
          const da = a.dataObj ? a.dataObj.getTime() : 0;
          const db = b.dataObj ? b.dataObj.getTime() : 0;
          return db - da;
        });

      return savingData;
    }

    console.error("Erro ao carregar savings do Supabase:", error);
  }

  try{
    const rows = await loadCSV(FILES.saving, false);

    savingRawColumns = rows[0] ? Object.keys(rows[0]) : savingRawColumns;

    savingData = rows
      .map(mapSavingRow)
      .sort((a,b) => {
        const da = a.dataObj ? a.dataObj.getTime() : 0;
        const db = b.dataObj ? b.dataObj.getTime() : 0;
        return db - da;
      });
  }catch(error){
    console.warn("saving.csv não carregado. Ranking Saving iniciará vazio.", error);
    savingData = [];
  }

  return savingData;
}

async function renderSaving(){
  const root = ensureAppElement();
  if(!root) return;

  root.innerHTML = `
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

    root.innerHTML = `
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
  const root = ensureAppElement();
  if(!root) return;

  const anos = anosSavingDisponiveis(base);
  const compradores = uniqueOptions(base, "comprador");
  const fornecedores = uniqueOptions(base, "fornecedor");
  const categorias = ["Saving", "Reajuste"];
  const tipos = ["Spot", "Anual"];

  root.innerHTML = `
    <section class="hero">
      <h1>Ranking Saving</h1>
      <p>
        Controle de savings, reajustes e homologações com integração ao Supabase.
      </p>
    </section>

    ${renderFilterBar([
      {type:"select", id:"savingAno", label:"Ano", options:anos},
      {type:"select", id:"savingMesInicial", label:"Mês inicial", options:MESES_FILTRO},
      {type:"select", id:"savingMesFinal", label:"Mês final", options:MESES_FILTRO},
      {type:"select", id:"savingCompradorFiltro", label:"Todos compradores", options:compradores},
      {type:"select", id:"savingFornecedorFiltro", label:"Todos fornecedores", options:fornecedores},
      {type:"select", id:"savingCategoriaFiltro", label:"Todas categorias", options:categorias},
      {type:"select", id:"savingTipoFiltro", label:"Todos tipos", options:tipos},
      {type:"select", id:"savingStatusFiltro", label:"Todos status", options:STATUS_SAVING}
    ])}

    <div id="savingContent"></div>
    <div id="modalRoot" class="modal-root"></div>
  `;

  aplicarPeriodoPadrao("saving");

  attachFilterEvents(
    [
      "savingAno",
      "savingMesInicial",
      "savingMesFinal",
      "savingCompradorFiltro",
      "savingFornecedorFiltro",
      "savingCategoriaFiltro",
      "savingTipoFiltro",
      "savingStatusFiltro"
    ],
    () => renderSavingContent(base)
  );

  renderSavingContent(base);
}

function passaFiltroSaving(x){
  const anoSelecionado = getFilterValue("savingAno") || ANO_PADRAO;
  const comprador = getFilterValue("savingCompradorFiltro");
  const fornecedor = getFilterValue("savingFornecedorFiltro");
  const categoria = getFilterValue("savingCategoriaFiltro");
  const tipo = getFilterValue("savingTipoFiltro");
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
    (!categoria || x.categoria === categoria) &&
    (!tipo || x.tipo === tipo) &&
    (!status || x.status === status);
}

function filterSavings(base){
  return base.filter(passaFiltroSaving);
}

function statusSavingClass(status){
  const s = norm(status);

  if(s.includes("homologado")) return "badge-green";
  if(s.includes("declinado")) return "badge-red";

  return "badge-yellow";
}

function calcularResumoSaving(data){
  const ativos = data.filter(x => x.status !== "Declinado");
  const homologados = data.filter(x => x.status === "Homologado");
  const curso = data.filter(x => x.status === "Homologação em curso");
  const declinados = data.filter(x => x.status === "Declinado");

  const savingHomologado = homologados.reduce((s,x) => s + x.savingCalculado, 0);
  const savingEmCurso = curso.reduce((s,x) => s + x.savingCalculado, 0);
  const reajusteImpacto = ativos.reduce((s,x) => s + x.reajusteCalculado, 0);
  const impactoLiquido = ativos.reduce((s,x) => s + x.impacto, 0);

  return {
    registros:data.length,
    ativos:ativos.length,
    homologados:homologados.length,
    curso:curso.length,
    declinados:declinados.length,
    savingHomologado,
    savingEmCurso,
    reajusteImpacto,
    impactoLiquido
  };
}

function abrirModalSaving(categoriaInicial = "Saving"){
  const root = document.getElementById("modalRoot");
  if(!root) return;

  const categoriaNormalizada = normalizarCategoriaSaving(categoriaInicial);

  root.innerHTML = `
    <div class="modal-overlay">
      <div class="modal-container">
        <div class="modal-header">
          <div>
            <h2>${categoriaNormalizada === "Reajuste" ? "Novo reajuste" : "Novo saving"}</h2>
            <p>Preencha no mesmo padrão da planilha original do painel.</p>
          </div>
          <button class="modal-close" onclick="fecharModalSaving()">×</button>
        </div>

        <form onsubmit="salvarRegistroSaving(event)">
          <div class="modal-body">
            <div class="form-grid">
              <div class="form-group">
                <label>Categoria</label>
                <select id="savingCategoria">
                  <option value="Saving" ${categoriaNormalizada === "Saving" ? "selected" : ""}>Saving</option>
                  <option value="Reajuste" ${categoriaNormalizada === "Reajuste" ? "selected" : ""}>Reajuste</option>
                </select>
              </div>

              <div class="form-group">
                <label>Tipo</label>
                <select id="savingTipo">
                  ${TIPOS_FLUXO_SAVING.map(x => `<option value="${esc(x)}">${esc(x)}</option>`).join("")}
                </select>
              </div>

              <div class="form-group">
                <label>Data</label>
                <input id="savingData" type="date" value="${hojeISO()}">
              </div>

              <div class="form-group">
                <label>Comprador</label>
                <input id="savingComprador" placeholder="Comprador">
              </div>

              <div class="form-group">
                <label>Código</label>
                <input id="savingCodigo" placeholder="Código do item">
              </div>

              <div class="form-group">
                <label>Fornecedor Atual</label>
                <input id="savingFornecedor" placeholder="Fornecedor atual">
              </div>

              <div class="form-group">
                <label>Status</label>
                <select id="savingStatus">
                  ${STATUS_SAVING.map(x => `<option value="${esc(x)}">${esc(x)}</option>`).join("")}
                </select>
              </div>

              <div class="form-group">
                <label>Quantidade</label>
                <input id="savingQuantidade" placeholder="Ex.: 1000" inputmode="decimal">
              </div>

              <div class="form-group">
                <label>Preço Atual</label>
                <input id="savingPrecoAtual" placeholder="Ex.: 10,50" inputmode="decimal">
              </div>

              <div class="form-separator">Concorrentes / Saving</div>

              <div class="form-group">
                <label>Competidor A</label>
                <input id="savingCompetidorA" placeholder="Nome">
              </div>

              <div class="form-group">
                <label>Preço Competidor A</label>
                <input id="savingPrecoCompetidorA" placeholder="Ex.: 9,80" inputmode="decimal">
              </div>

              <div class="form-group">
                <label>Competidor B</label>
                <input id="savingCompetidorB" placeholder="Nome">
              </div>

              <div class="form-group">
                <label>Preço Competidor B</label>
                <input id="savingPrecoCompetidorB" placeholder="Ex.: 9,60" inputmode="decimal">
              </div>

              <div class="form-group">
                <label>Competidor C</label>
                <input id="savingCompetidorC" placeholder="Nome">
              </div>

              <div class="form-group">
                <label>Preço Competidor C</label>
                <input id="savingPrecoCompetidorC" placeholder="Ex.: 9,40" inputmode="decimal">
              </div>

              <div class="form-separator">Reajuste</div>

              <div class="form-group">
                <label>Reajuste Solicitado %</label>
                <input id="savingReajusteSolicitado" placeholder="Ex.: 12,5" inputmode="decimal">
              </div>

              <div class="form-group">
                <label>Reajuste Acordado %</label>
                <input id="savingReajusteAcordado" placeholder="Ex.: 8,0" inputmode="decimal">
              </div>

              <div class="form-group full">
                <label>Descrição</label>
                <input id="savingDescricao" placeholder="Descrição do item ou negociação">
              </div>

              <div class="form-group full">
                <label>Observação</label>
                <textarea id="savingObservacao" placeholder="Observações adicionais"></textarea>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button class="action-btn secondary" type="button" onclick="fecharModalSaving()">Cancelar</button>
            <button class="action-btn" type="submit">Salvar registro</button>
          </div>
        </form>
      </div>
    </div>
  `;
}

function fecharModalSaving(){
  const root = document.getElementById("modalRoot");
  if(root) root.innerHTML = "";
}

function renderSavingContent(base){
  const data = filterSavings(base);
  const resumo = calcularResumoSaving(data);

  const ativos = data.filter(x => x.status !== "Declinado");

  const porComprador = Object.values(group(ativos, "comprador"))
    .map(g => ({
      nome:g.nome,
      valor:g.items.reduce((s,x) => s + x.savingCalculado + x.reajusteCalculado, 0)
    }))
    .sort((a,b) => b.valor - a.valor);

  const porFornecedor = Object.values(group(ativos, "fornecedor"))
    .map(g => ({
      nome:g.nome,
      valor:g.items.reduce((s,x) => s + x.savingCalculado + x.reajusteCalculado, 0)
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
      ${kpi("Reajuste / impacto", money(resumo.reajusteImpacto), "orange")}
      ${kpi("Impacto líquido", money(resumo.impactoLiquido), resumo.impactoLiquido >= 0 ? "green" : "red")}
      ${kpi("Homologados", resumo.homologados, "green")}
      ${kpi("Em homologação", resumo.curso, "yellow")}
      ${kpi("Declinados", resumo.declinados, "red")}
    </section>

    <section class="saving-actions">
      <button class="action-btn" onclick="abrirModalSaving('Saving')">+ Novo saving</button>
      <button class="action-btn secondary" onclick="abrirModalSaving('Reajuste')">+ Reajuste</button>
      <button class="action-btn secondary" onclick="baixarModeloSaving()">Baixar planilha padrão</button>

      <label class="action-btn secondary file-btn">
        Importar planilha
        <input id="savingImportCSV" type="file" accept=".csv,.txt,.xlsx,.xls" onchange="importarSavingCSV()">
      </label>
    </section>

    <section class="panel-grid">
      <div class="panel">
        <h2>Saving / impacto por comprador</h2>
        ${porComprador.length ? porComprador.map(x => {
          return barLine(x.nome, x.valor, "bar-green", money(x.valor), porComprador[0]?.valor || 1);
        }).join("") : `<div class="empty-state">Sem registros ativos para o período.</div>`}
      </div>

      <div class="panel">
        <h2>Top fornecedores por saving / impacto</h2>
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
            <th>Categoria</th>
            <th>Tipo</th>
            <th>Data</th>
            <th>Comprador</th>
            <th>Código</th>
            <th>Descrição</th>
            <th>Fornecedor Atual</th>
            <th>Qtd</th>
            <th>Preço Atual</th>
            <th>Melhor Competidor</th>
            <th>Melhor Preço</th>
            <th>Saving</th>
            <th>Reajuste Solicitado</th>
            <th>Reajuste Acordado</th>
            <th>Impacto Reajuste</th>
            <th>Status</th>
            <th>Ações</th>
          </tr>
        </thead>

        <tbody>
          ${data.map(x => `
            <tr class="${x.status === "Declinado" ? "declined-row" : ""}">
              <td><span class="badge ${x.categoria === "Saving" ? "badge-green" : "badge-orange"}">${esc(x.categoria)}</span></td>
              <td>${esc(x.tipo || "—")}</td>
              <td>${esc(x.data || "—")}</td>
              <td>${esc(x.comprador || "—")}</td>
              <td>${esc(x.codigo || "—")}</td>
              <td>
                ${esc(x.descricao || "—")}
                ${x.observacao ? `<br><small>${esc(x.observacao)}</small>` : ""}
              </td>
              <td><b>${esc(x.fornecedor || "—")}</b></td>
              <td>${Number(x.quantidade || 0).toLocaleString("pt-BR", {maximumFractionDigits:2})}</td>
              <td>${money(x.precoAtual)}</td>
              <td>${esc(x.melhorCompetidor || "—")}</td>
              <td>${x.menorPrecoCompetidor ? money(x.menorPrecoCompetidor) : "—"}</td>
              <td><b class="green">${money(x.savingCalculado)}</b></td>
              <td>${x.reajusteSolicitadoPct ? `${String(x.reajusteSolicitadoPct).replace(".", ",")}%` : "—"}</td>
              <td>${x.reajusteAcordadoPct ? `${String(x.reajusteAcordadoPct).replace(".", ",")}%` : "—"}</td>
              <td><b class="orange">${money(x.reajusteCalculado)}</b></td>
              <td>
                <select class="status-select" onchange="alterarStatusSaving('${jsArg(x.id)}', this.value)">
                  ${STATUS_SAVING.map(status => `
                    <option value="${esc(status)}" ${x.status === status ? "selected" : ""}>${esc(status)}</option>
                  `).join("")}
                </select>
              </td>
              <td>
                <button class="mini-btn" onclick="excluirSaving('${jsArg(x.id)}')">Excluir</button>
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>

      ${!data.length ? `<div class="empty-state">Nenhum registro de saving encontrado para os filtros selecionados.</div>` : ""}
    </section>
  `;
}

function montarRegistroSavingDaTela(){
  const original = {
    "Categoria": getFilterValue("savingCategoria") || "Saving",
    "Tipo": getFilterValue("savingTipo") || "Anual",
    "Data": getFilterValue("savingData") || hojeISO(),
    "Comprador": getFilterValue("savingComprador") || "Não informado",
    "Código": getFilterValue("savingCodigo") || "",
    "Descrição": getFilterValue("savingDescricao") || "Sem descrição",
    "Fornecedor Atual": getFilterValue("savingFornecedor") || "Não informado",
    "Status": getFilterValue("savingStatus") || "Homologação em curso",
    "Quantidade": getFilterValue("savingQuantidade") || "",
    "Preço Atual": getFilterValue("savingPrecoAtual") || "",
    "Competidor A": getFilterValue("savingCompetidorA") || "",
    "Preço Competidor A": getFilterValue("savingPrecoCompetidorA") || "",
    "Competidor B": getFilterValue("savingCompetidorB") || "",
    "Preço Competidor B": getFilterValue("savingPrecoCompetidorB") || "",
    "Competidor C": getFilterValue("savingCompetidorC") || "",
    "Preço Competidor C": getFilterValue("savingPrecoCompetidorC") || "",
    "Reajuste Solicitado %": getFilterValue("savingReajusteSolicitado") || "",
    "Reajuste Acordado %": getFilterValue("savingReajusteAcordado") || "",
    "Observação": getFilterValue("savingObservacao") || ""
  };

  return mapSavingRow(original);
}

async function salvarRegistroSaving(event){
  if(event) event.preventDefault();

  const reg = montarRegistroSavingDaTela();

  if(!reg.quantidade || !reg.precoAtual){
    alert("Informe pelo menos Quantidade e Preço Atual.");
    return;
  }

  if(reg.categoria === "Saving" && !reg.menorPrecoCompetidor){
    alert("Para Saving, informe pelo menos um preço de competidor.");
    return;
  }

  if(reg.categoria === "Reajuste" && !reg.reajusteAcordadoPct && !reg.reajusteSolicitadoPct){
    alert("Para Reajuste, informe o percentual solicitado e/ou acordado.");
    return;
  }

  const client = getSupabaseClient();

  if(client){
    const payload = montarPayloadSupabaseSaving(reg);

    console.log("Payload Saving enviado ao Supabase:", payload);
    console.log("Colunas detectadas no Supabase:", savingRawColumns);

    const { error } = await client
      .from("savings")
      .insert([payload]);

    if(error){
      console.error("Erro ao salvar saving no Supabase:", error, payload, savingRawColumns);
      alert(`Não consegui salvar no Supabase: ${error.message || "erro sem mensagem"}`);
      return;
    }
  }else{
    savingData.unshift(reg);
  }

  fecharModalSaving();
  await carregarSavingsLocal(true);
  renderSavingView(savingData);
}

async function alterarStatusSaving(id, status){
  const client = getSupabaseClient();

  if(client){
    const colStatus = colunaSupabaseSaving("Status") || "status";

    const { error } = await client
      .from("savings")
      .update({ [colStatus]:normalizarStatusSaving(status) })
      .eq("id", id);

    if(error){
      console.error("Erro ao alterar status:", error);
      alert(`Não consegui alterar o status no Supabase: ${error.message || "erro sem mensagem"}`);
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
      alert(`Não consegui excluir no Supabase: ${error.message || "erro sem mensagem"}`);
      return;
    }
  }else{
    savingData = savingData.filter(x => x.id !== id);
  }

  await carregarSavingsLocal(true);
  renderSavingView(savingData);
}

function baixarModeloSaving(){
  const linhas = [
    SAVING_HEADERS_PADRAO,
    [
      "Saving",
      "Spot",
      hojeISO(),
      "Gibson",
      "224380",
      "Pneu 235/75R17.5 18PR TL 143/141L BF188",
      "Michelin",
      "Homologado",
      "140",
      "2139,75",
      "Link",
      "715,00",
      "RS Pneus",
      "626,68",
      "",
      "",
      "",
      "",
      "Exemplo de saving por concorrência"
    ],
    [
      "Reajuste",
      "Anual",
      hojeISO(),
      "Gibson",
      "202109",
      "Mancal Varão PT - Sup Central - Nylon",
      "Plastuning",
      "Homologado",
      "586",
      "1,50",
      "",
      "",
      "",
      "",
      "",
      "",
      "28,66666667",
      "28,66666667",
      "Exemplo de reajuste"
    ]
  ];

  const csv = linhas.map(row => {
    return row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(";");
  }).join("\n");

  const blob = new Blob(["\uFEFF" + csv], {type:"text/csv;charset=utf-8;"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");

  a.href = url;
  a.download = "modelo_savings_linshalm.csv";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

async function lerArquivoSaving(file){
  const ext = file.name.split(".").pop().toLowerCase();

  if(["xlsx", "xls"].includes(ext)){
    if(!window.XLSX){
      alert("Para importar XLSX direto, inclua a biblioteca SheetJS no index.html ou salve a planilha como CSV.");
      return [];
    }

    const buffer = await file.arrayBuffer();
    const workbook = window.XLSX.read(buffer, {type:"array"});
    const sheet = workbook.Sheets[workbook.SheetNames[0]];

    return window.XLSX.utils.sheet_to_json(sheet, {defval:""});
  }

  const text = await file.text();
  const rows = parseCSV(text);

  if(rows.length <= 1){
    alert("CSV vazio ou sem cabeçalho.");
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

async function importarSavingCSV(){
  const input = document.getElementById("savingImportCSV");
  const file = input?.files?.[0];

  if(!file){
    alert("Selecione um arquivo para importar.");
    return;
  }

  const objetos = await lerArquivoSaving(file);

  if(!objetos.length){
    return;
  }

  const registros = objetos.map(mapSavingRow);
  const client = getSupabaseClient();

  if(client){
    const payload = registros.map(montarPayloadSupabaseSaving);

    console.log("Importando Savings:", payload);
    console.log("Colunas detectadas no Supabase:", savingRawColumns);

    const { error } = await client
      .from("savings")
      .insert(payload);

    if(error){
      console.error("Erro ao importar planilha no Supabase:", error, payload, savingRawColumns);
      alert(`Não consegui importar no Supabase: ${error.message || "erro sem mensagem"}`);
      return;
    }
  }else{
    savingData = [...registros, ...savingData];
  }

  await carregarSavingsLocal(true);
  renderSavingView(savingData);
}
/* =========================
   COMPATIBILIDADE DOS BOTÕES DO TOPO
========================= */

function irDashboardGeral(){
  return renderGeral();
}

function dashboardGeral(){
  return renderGeral();
}

function irGeral(){
  return renderGeral();
}

function irRankingFornecedores(){
  return renderFornecedores();
}

function irRankingFornecedor(){
  return renderFornecedores();
}

function irFornecedores(){
  return renderFornecedores();
}

function renderRankingFornecedores(){
  return renderFornecedores();
}

function renderRankingFornecedor(){
  return renderFornecedores();
}

function rankingFornecedores(){
  return renderFornecedores();
}

function rankingFornecedor(){
  return renderFornecedores();
}

function fornecedores(){
  return renderFornecedores();
}

function irRankingSaving(){
  return renderSaving();
}

function irSaving(){
  return renderSaving();
}

function renderRankingSaving(){
  return renderSaving();
}

function rankingSaving(){
  return renderSaving();
}

function saving(){
  return renderSaving();
}

function imprimirPedidosAtencao(){
  return gerarRelatorioAtencao();
}

function gerarPedidosAtencao(){
  return gerarRelatorioAtencao();
}

function relatorioAtencao(){
  return gerarRelatorioAtencao();
}

function normalizarTextoMenu(texto){
  return norm(texto)
    .replace(/\s+/g, " ")
    .trim();
}

function acaoMenuPorTexto(texto){
  const t = normalizarTextoMenu(texto);

  if(
    t === "dashboard" ||
    t === "dashboard geral" ||
    t === "geral" ||
    t.includes("dashboard geral")
  ){
    return renderGeral;
  }

  if(
    t === "fornecedores" ||
    t === "ranking fornecedor" ||
    t === "ranking fornecedores" ||
    t.includes("ranking fornecedor") ||
    t.includes("ranking fornecedores")
  ){
    return renderFornecedores;
  }

  if(
    t === "saving" ||
    t === "ranking saving" ||
    t.includes("ranking saving")
  ){
    return renderSaving;
  }

  if(
    t.includes("imprimir pedidos") ||
    t.includes("pedidos em atencao") ||
    t.includes("pedidos em atenção") ||
    t.includes("relatorio de follow") ||
    t.includes("relatório de follow")
  ){
    return gerarRelatorioAtencao;
  }

  return null;
}

function blindarMenuTopo(){
  const candidatos = document.querySelectorAll("button, a, .nav-btn, .menu button, .menu a, nav button, nav a, header button, header a, [onclick]");

  candidatos.forEach(el => {
    const texto = String(
      el.textContent ||
      el.value ||
      el.getAttribute("aria-label") ||
      el.getAttribute("title") ||
      ""
    ).trim();

    const acao = acaoMenuPorTexto(texto);

    if(!acao) return;

    el.onclick = event => {
      if(event){
        event.preventDefault();
        event.stopPropagation();
      }

      acao();
      return false;
    };
  });
}

/* =========================
   EXPOSIÇÃO GLOBAL
   Mantém compatibilidade com onclick do HTML antigo
========================= */

function exporFuncoesGlobais(){
  window.renderGeral = renderGeral;
  window.irDashboardGeral = irDashboardGeral;
  window.dashboardGeral = dashboardGeral;
  window.irGeral = irGeral;

  window.renderFornecedores = renderFornecedores;
  window.irRankingFornecedores = irRankingFornecedores;
  window.irRankingFornecedor = irRankingFornecedor;
  window.irFornecedores = irFornecedores;
  window.renderRankingFornecedores = renderRankingFornecedores;
  window.renderRankingFornecedor = renderRankingFornecedor;
  window.rankingFornecedores = rankingFornecedores;
  window.rankingFornecedor = rankingFornecedor;
  window.fornecedores = fornecedores;

  window.renderSaving = renderSaving;
  window.irRankingSaving = irRankingSaving;
  window.irSaving = irSaving;
  window.renderRankingSaving = renderRankingSaving;
  window.rankingSaving = rankingSaving;
  window.saving = saving;

  window.gerarRelatorioAtencao = gerarRelatorioAtencao;
  window.imprimirPedidosAtencao = imprimirPedidosAtencao;
  window.gerarPedidosAtencao = gerarPedidosAtencao;
  window.relatorioAtencao = relatorioAtencao;

  window.alterarOpcaoInflacao = alterarOpcaoInflacao;
  window.selecionarPontoInflacao = selecionarPontoInflacao;
  window.limparPontoInflacao = limparPontoInflacao;

  window.aplicarFiltroGeralFaixa = aplicarFiltroGeralFaixa;
  window.aplicarFiltroGeralMes = aplicarFiltroGeralMes;
  window.limparFiltrosGeral = limparFiltrosGeral;

  window.abrirModalSaving = abrirModalSaving;
  window.fecharModalSaving = fecharModalSaving;
  window.salvarRegistroSaving = salvarRegistroSaving;
  window.alterarStatusSaving = alterarStatusSaving;
  window.excluirSaving = excluirSaving;
  window.baixarModeloSaving = baixarModeloSaving;
  window.importarSavingCSV = importarSavingCSV;
}

/* =========================
   DIAGNÓSTICO RÁPIDO
========================= */

function diagnosticoApp(){
  console.log("APP LINSHALM carregado.");
  console.log("Geral:", geralData.length, "linhas");
  console.log("Saving:", savingData.length, "registros");
  console.log("Colunas Saving detectadas:", savingRawColumns);
  console.log("Supabase disponível:", !!getSupabaseClient());
}

window.diagnosticoApp = diagnosticoApp;

/* =========================
   INICIALIZAÇÃO
========================= */

function iniciarApp(){
  if(appInicializado) return;

  appInicializado = true;

  exporFuncoesGlobais();
  blindarMenuTopo();
  renderGeral();
}

if(document.readyState === "loading"){
  document.addEventListener("DOMContentLoaded", iniciarApp);
}else{
  iniciarApp();
}
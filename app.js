/* =========================================================
   LINSHALM COMPRAS — APP.JS COMPLETO
   Dashboard Geral | Performance de Fornecedores | Ranking Saving
========================================================= */

/* =========================
   ARQUIVOS
========================= */

const FILES = {
  geral: "./data/geral.csv",
  historicoConsolidado: "./data/historico.csv",
  saving: "./data/saving.csv",
  indices: "./data/indices.csv",
  pesosPerfis: "./data/pesos-perfis-aluminio.csv",
  historico: {
    "2026": "./data/geral.csv",
    "2025": "./data/2025.csv",
    "2024": "./data/2024.csv",
    "2023": "./data/2023.csv",
    "2022": "./data/2022.csv",
    "2021": "./data/2021.csv",
    "2020": "./data/2020.csv"
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
const ANOS_HISTORICO = ["2026", "2025", "2024", "2023", "2022", "2021", "2020"];
const OPCAO_TODOS_ANOS = "Todos os anos";
const META_SAVING_2026 = 0.05;
const PESO_ENTREGAS_COMPRADOR = 0.90;

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
  { familia:"Alumínio", subfamilia:"Bobina Alumínio", prefixo:"1.02.02" },
  { familia:"Alumínio", subfamilia:"Perfis Alumínio", prefixo:"1.02.03" }
];

const OPCOES_INFLACAO = [
  { id:"Alumínio|Consolidado", label:"Alumínio — Consolidado", familia:"Alumínio", subfamilia:"" },
  { id:"Alumínio|Chapas Alumínio", label:"Chapas Alumínio", familia:"Alumínio", subfamilia:"Chapas Alumínio" },
  { id:"Alumínio|Bobina Alumínio", label:"Bobina Alumínio", familia:"Alumínio", subfamilia:"Bobina Alumínio" },
  { id:"Alumínio|Perfis Alumínio", label:"Perfis Alumínio", familia:"Alumínio", subfamilia:"Perfis Alumínio" },

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
let geralFornecedoresSelecionados = new Set();
let geralFornecedorOpcoes = [];
let geralPagina = 1;
const GERAL_POR_PAGINA = 100;
let savingData = [];
let indicesData = [];
let pesosPerfisData = [];

let savingRawColumns = [];
let indicesTentouCarregar = false;
let pesosPerfisTentouCarregar = false;
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

function moneyCompact(value){
  const numero = Number(value || 0);

  if(Math.abs(numero) < 1000000){
    return money(numero);
  }

  return new Intl.NumberFormat("pt-BR", {
    style:"currency",
    currency:"BRL",
    notation:"compact",
    maximumFractionDigits:1
  }).format(numero);
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

function parseDateListBR(text){
  const raw = String(text || "").trim();
  if(!raw) return [];

  const matches = raw.match(/\b\d{2}\/\d{2}\/\d{4}\b|\b\d{4}-\d{2}-\d{2}\b/g) || [];

  return matches
    .map(parseDateBR)
    .filter(Boolean)
    .sort((a,b) => a - b);
}

function primeiraData(lista){
  return Array.isArray(lista) && lista.length ? lista[0] : null;
}

function ultimaData(lista){
  return Array.isArray(lista) && lista.length ? lista[lista.length - 1] : null;
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

function renderFilterControl(item){
  const size = ["compact","medium","wide"].includes(item.size) ? item.size : "medium";
  const label = item.label || item.placeholder || "Filtro";

  if(item.type === "text"){
    return `
      <label class="filter-field ${size}">
        <span>${esc(label)}</span>
        <input
          id="${item.id}"
          aria-label="${esc(label)}"
          placeholder="${esc(item.placeholder || "")}"
          value="${esc(item.value || "")}"
        >
      </label>
    `;
  }

  return `
    <label class="filter-field ${size}">
      <span>${esc(label)}</span>
      <select id="${item.id}" aria-label="${esc(label)}">
        ${optionList(item.options || [], item.label || "Selecione")}
      </select>
    </label>
  `;
}

function renderFilterBar(config, options = {}){
  const principais = config.filter(item => !item.advanced);
  const avancados = config.filter(item => item.advanced);
  const clearAction = options.clearAction || "";

  return `
    <section class="filters">
      <div class="filters-primary">
        ${principais.map(renderFilterControl).join("")}
      </div>

      ${avancados.length ? `
        <details class="filters-more">
          <summary>Mais filtros <b>${avancados.length}</b></summary>
          <div class="filters-advanced">
            ${avancados.map(renderFilterControl).join("")}
          </div>
        </details>
      ` : ""}

      ${clearAction ? `
        <button type="button" class="filters-clear" onclick="${clearAction}">Limpar</button>
      ` : ""}
    </section>
  `;
}

/* =========================
   COMPONENTES VISUAIS
========================= */

function kpi(label, value, color = "blue", action = ""){
  const clickable = action ? `onclick="${action}" role="button" tabindex="0"` : "";

  return `
    <div class="kpi ${action ? "is-clickable" : ""}" ${clickable}>
      <small>${esc(label)}</small>
      <strong class="${color}">${value}</strong>
    </div>
  `;
}

function executiveKpi(label, value, color = "blue", action = "", meta = "", title = ""){
  const clickable = action ? `onclick="${action}" role="button" tabindex="0"` : "";
  const tooltip = title ? `title="${esc(title)}"` : "";

  return `
    <div class="executive-kpi ${color} ${action ? "is-clickable" : ""}" ${clickable} ${tooltip}>
      <div class="executive-kpi-label"><i></i>${esc(label)}</div>
      <strong>${value}</strong>
      ${meta ? `<span>${esc(meta)}</span>` : ""}
    </div>
  `;
}

function compactStat(label, value, color = "blue", action = ""){
  const clickable = action ? `onclick="${action}" role="button" tabindex="0"` : "";

  return `
    <div class="compact-stat ${action ? "is-clickable" : ""}" ${clickable}>
      <span>${esc(label)}</span>
      <b class="${color}">${value}</b>
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

function dateTextBR(date){
  return date ? normalizeDate(date).toLocaleDateString("pt-BR") : "—";
}

function quantidadeText(value, unidade = ""){
  const numero = Number(value || 0).toLocaleString("pt-BR", {
    minimumFractionDigits:0,
    maximumFractionDigits:3
  });

  return unidade ? `${numero} ${unidade}` : numero;
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

    const subfamilia = get(r, [
      "Subfamilia",
      "Subfamília",
      "Sub Familia",
      "Sub Família",
      "Sub-Familia",
      "Sub-Família"
    ]);

    const indice = get(r, ["Indice", "Índice"]);

    const valor = numberBR(get(r, [
      "Valor",
      "Valor R$/kg",
      "Valor BRL KG",
      "Valor_BRL_KG"
    ]));

    return {
      ano,
      mes,
      key: ano && mes ? `${ano}-${mes}` : "",
      familia,
      subfamilia:String(subfamilia || "").trim(),
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

function indiceExternoEhGeral(item){
  return !String(item?.subfamilia || "").trim();
}

function resumirIndicesMercado(lista, fallbackNome){
  const validos = (lista || []).filter(x => x && x.valor > 0);

  if(!validos.length) return null;

  const valorMedio = validos.reduce((s,x) => s + x.valor, 0) / validos.length;
  const nomes = [...new Set(validos.map(x => x.indice).filter(Boolean))];

  const nomeIndice = nomes.length === 1
    ? nomes[0]
    : fallbackNome;

  return {
    ...validos[0],
    indice:nomeIndice,
    valor:valorMedio,
    quantidadeIndices:validos.length,
    itens:validos
  };
}

function buscarIndiceMercado(familia, mesKey, subfamilia = ""){
  const familiaNorm = norm(familia);
  const subfamiliaNorm = norm(subfamilia);

  const baseMesFamilia = indicesData.filter(x => {
    return norm(x.familia) === familiaNorm &&
      x.key === mesKey;
  });

  if(!baseMesFamilia.length){
    return null;
  }

  if(subfamiliaNorm){
    const especificos = baseMesFamilia.filter(x => {
      return norm(x.subfamilia) === subfamiliaNorm;
    });

    if(especificos.length){
      const resumo = resumirIndicesMercado(especificos, `${subfamilia} mercado -1`);

      return {
        ...resumo,
        origemIndice:"Específico"
      };
    }
  }

  const gerais = baseMesFamilia.filter(indiceExternoEhGeral);

  if(gerais.length){
    const resumo = resumirIndicesMercado(gerais, `${familia} mercado -1`);

    return {
      ...resumo,
      origemIndice:"Geral"
    };
  }

  return null;
}

function calcularIndiceMercadoPonderado(familia, mesKey, linhas){
  const linhasValidas = (linhas || []).filter(x => {
    return x &&
      x.mesRecebimento === mesKey &&
      x.quantidadeInflacao > 0 &&
      x.familiaInflacao === familia;
  });

  if(!linhasValidas.length){
    return null;
  }

  const gruposSubfamilia = Object.values(group(linhasValidas, "subfamiliaInflacao"));

  const detalhes = gruposSubfamilia.map(g => {
    const subfamilia = g.nome === "Não informado" ? "" : g.nome;

    const quantidadeTotal = g.items.reduce((s,x) => s + x.quantidadeInflacao, 0);
    const valorTotal = g.items.reduce((s,x) => s + x.valor, 0);
    const precoInterno = quantidadeTotal > 0 ? valorTotal / quantidadeTotal : 0;

    const indice = buscarIndiceMercado(familia, mesKey, subfamilia);

    return {
      subfamilia,
      quantidadeTotal,
      valorTotal,
      precoInterno,
      indice
    };
  });

  const comIndice = detalhes.filter(x => {
    return x.indice &&
      x.indice.valor > 0 &&
      x.quantidadeTotal > 0;
  });

  if(!comIndice.length){
    return null;
  }

  const quantidadePonderada = comIndice.reduce((s,x) => s + x.quantidadeTotal, 0);

  if(!quantidadePonderada){
    return null;
  }

  const valorPonderado = comIndice.reduce((s,x) => {
    return s + (x.indice.valor * x.quantidadeTotal);
  }, 0) / quantidadePonderada;

  const temEspecifico = comIndice.some(x => x.indice.origemIndice === "Específico");
  const temGeral = comIndice.some(x => x.indice.origemIndice === "Geral");

  let nomeIndice = `${familia} mercado -1`;

  if(temEspecifico && temGeral){
    nomeIndice = `${familia} ponderado — específico + geral`;
  }else if(temEspecifico){
    nomeIndice = `${familia} ponderado — índices específicos`;
  }else if(temGeral){
    nomeIndice = `${familia} ponderado — índice geral`;
  }

  return {
    ano:mesKey.split("-")[0],
    mes:mesKey.split("-")[1],
    key:mesKey,
    familia,
    subfamilia:"Consolidado",
    indice:nomeIndice,
    valor:valorPonderado,
    origemIndice:"Ponderado",
    quantidadeIndices:comIndice.length,
    quantidadePonderada,
    detalhes
  };
}

/* =========================
   PESOS — PERFIS DE ALUMÍNIO
========================= */

function normalizarCodigoProdutoPeso(valor){
  return String(valor || "")
    .trim()
    .replace(/\.0$/,"")
    .replace(/,0$/,"")
    .replace(/\D/g,"");
}

function mapPesosPerfisRows(rows){
  return rows.map(r => {
    const produto = get(r, [
      "Produto",
      "Código Produto",
      "Codigo Produto",
      "Cod Produto",
      "Item"
    ]);

    const descricaoProduto = get(r, [
      "Descricao Produto",
      "Descrição Produto",
      "Descricao",
      "Descrição"
    ]);

    const pesoPorPecaKg = numberBR(get(r, [
      "PesoPorPecaKg",
      "Peso Por Peca Kg",
      "Peso Por Peça Kg",
      "Peso por peça kg",
      "Peso Kg",
      "Kg por peça",
      "Kg por peca"
    ]));

    return {
      produto:String(produto || "").trim(),
      produtoKey:normalizarCodigoProdutoPeso(produto),
      descricaoProduto,
      pesoPorPecaKg
    };
  }).filter(x => x.produtoKey && x.pesoPorPecaKg > 0);
}

async function ensurePesosPerfisData(){
  if(pesosPerfisTentouCarregar) return;

  pesosPerfisTentouCarregar = true;

  try{
    const rows = await loadCSV(FILES.pesosPerfis, false);
    pesosPerfisData = mapPesosPerfisRows(rows);
  }catch(error){
    console.warn("pesos-perfis-aluminio.csv não carregado. Perfis de alumínio seguirão usando quantidade original.", error);
    pesosPerfisData = [];
  }
}

function buscarPesoPerfilProduto(produto){
  const produtoKey = normalizarCodigoProdutoPeso(produto);

  if(!produtoKey){
    return null;
  }

  return pesosPerfisData.find(x => x.produtoKey === produtoKey) || null;
}

function calcularQuantidadeInflacaoKg(produto, subfamiliaInflacao, quantidadeOriginal){
  const quantidade = Number(quantidadeOriginal || 0);

  if(norm(subfamiliaInflacao) !== norm("Perfis Alumínio")){
    return quantidade;
  }

  const peso = buscarPesoPerfilProduto(produto);

  if(!peso || !peso.pesoPorPecaKg){
    return quantidade;
  }

  return quantidade * peso.pesoPorPecaKg;
}

function obterPesoPerfilKg(produto, subfamiliaInflacao){
  if(norm(subfamiliaInflacao) !== norm("Perfis Alumínio")){
    return null;
  }

  const peso = buscarPesoPerfilProduto(produto);

  return peso?.pesoPorPecaKg || null;
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
  const assinaturasVistas = new Set();
  const rowsSemDuplicacaoExata = rows.filter(r => {
    const pedidoLinha = get(r, ["Pedido", "Número Pedido", "Nº Pedido", "Num Pedido", "Numero Pedido"]);
    const itemLinha = get(r, ["Item", "Item Pedido", "Número Item", "Numero Item"]);

    if(!pedidoLinha || !itemLinha) return true;

    const assinatura = `${pedidoLinha}::${itemLinha}::${JSON.stringify(r)}`;

    if(assinaturasVistas.has(assinatura)){
      console.warn("Linha duplicada ignorada na base geral:", get(r, ["Pedido"]), get(r, ["Item"]));
      return false;
    }

    assinaturasVistas.add(assinatura);
    return true;
  });

  return rowsSemDuplicacaoExata.map(r => {
    const quantidade = numberBR(get(r, [
      "Quantidade Compra",
      "Qtd Compra",
      "Quantidade",
      "Qtd"
    ]));

    const quantidadeAtendidaRaw = get(r, [
      "Quantidade Compra Atend.",
      "Quantidade Compra Atendida",
      "Qtd Compra Atend.",
      "Qtd Atendida"
    ]);

    const quantidadeSaldoRaw = get(r, [
      "Quantidade Compra Saldo",
      "Saldo Quantidade Compra",
      "Qtd Compra Saldo",
      "Saldo em Aberto"
    ]);

    const quantidadeAtendida = numberBR(quantidadeAtendidaRaw);
    const quantidadeSaldo = numberBR(quantidadeSaldoRaw);
    const quantidadeCancelada = numberBR(get(r, ["Quantidade Compra Canc.", "Quantidade Compra Cancelada"]));
    const temControleAtendimento = String(quantidadeAtendidaRaw).trim() !== "" ||
      String(quantidadeSaldoRaw).trim() !== "";

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

    const datasRecebimento = parseDateListBR(dataRecebimento);
    const primeiraDataRecebimentoObj = primeiraData(datasRecebimento);
    const dataRecebimentoObj = ultimaData(datasRecebimento);

    const previsaoInicial = get(r, [
      "Previsão Entrega Inicial",
      "Previsao Entrega Inicial",
      "Data Prevista Inicial",
      "Previsão Inicial",
      "Previsao Inicial"
    ]);

    const previsaoInicialObj = parseDateBR(previsaoInicial);
    const dataCadastroObj = parseDateBR(get(r, ["Data Cadastro", "Data do Pedido", "Data Pedido"]));
    const leadTimePrevisto = diffDays(previsaoInicialObj, dataCadastroObj);
    const leadTimeRealizado = diffDays(dataRecebimentoObj, dataCadastroObj);
    const dataLimiteOperacionalObj = addDays(previsaoInicialObj, 7);

    const condicaoPagamento = String(get(r, [
      "Condição Pagamento",
      "Condicao Pagamento",
      "Condição de Pagamento",
      "Condicao de Pagamento"
    ])).trim();

    const prazoPagamento = CONDICOES_PAGAMENTO[condicaoPagamento] ?? 0;

    const produto = get(r, [
      "Produto",
      "Cod Produto",
      "Código Produto",
      "Codigo Produto"
    ]);

    const itemPedido = get(r, [
      "Item",
      "Item Pedido",
      "Número Item",
      "Numero Item",
      "Sequência Item",
      "Sequencia Item"
    ]);

    const unidadeCompra = get(r, [
      "Unidade de Compra",
      "Unidade Compra",
      "Unidade",
      "UN"
    ]);

    const descricaoProduto = get(r, [
      "Descrição Produto",
      "Descricao Produto",
      "Desc Produto",
      "Produto Descrição",
      "Produto Descricao"
    ]);
    const observacaoProduto = get(r, [
      "Observação Produto", "Observacao Produto", "Observação Item",
      "Observacao Item", "Observação", "Obs. Item"
    ]);
    const referenciaProdutoFornecedor = [
      get(r, ["Código Produto Fornecedor", "Codigo Produto Fornecedor",
        "Referência Fornecedor", "Referencia Fornecedor"]),
      get(r, ["PN", "Part Number", "P/N"]),
      get(r, ["TAUS"])
    ].filter(Boolean).join(" · ");

    const fornecedor = get(r, [
      "Descrição Fornecedor",
      "Descricao Fornecedor",
      "Fornecedor",
      "Nome Fornecedor"
    ]);

    const fornecedorCodigo = get(r, [
      "Fornecedor",
      "Código Fornecedor",
      "Codigo Fornecedor",
      "Cod Fornecedor"
    ]);

    const comprador = get(r, [
      "Nome Comprador",
      "Comprador",
      "Buyer"
    ]);

    const situacaoPedido = get(r, [
      "Situação Pedido",
      "Situacao Pedido",
      "Status Pedido",
      "Situação"
    ]);

    const mascaraEntrada = get(r, [
      "Máscara de Entrada",
      "Mascara de Entrada",
      "Mascara Entrada",
      "Máscara Entrada"
    ]);

    const inflacao = classificarMascaraInflacao(mascaraEntrada);

    const familiaInflacao = inflacao?.familia || "";
    const subfamiliaInflacao = inflacao?.subfamilia || "";

    const pesoPerfilKg = obterPesoPerfilKg(produto, subfamiliaInflacao);

    const quantidadeInflacao = calcularQuantidadeInflacaoKg(
      produto,
      subfamiliaInflacao,
      quantidade
    );

    const precoUnitarioInflacao = quantidadeInflacao > 0
      ? valor / quantidadeInflacao
      : 0;

    const conversaoInflacaoAplicada = !!pesoPerfilKg &&
      norm(subfamiliaInflacao) === norm("Perfis Alumínio");

    let statusAtendimento = "Em aberto";

    if(temControleAtendimento){
      if(quantidadeSaldo <= 0){
        statusAtendimento = "Atendido em plenitude";
      }else if(quantidadeAtendida > 0){
        statusAtendimento = "Atendido parcial";
      }
    }else if(norm(situacaoPedido).includes("parcial")){
      statusAtendimento = "Atendido parcial";
    }else if(norm(situacaoPedido).includes("atendido") || dataRecebimentoObj){
      statusAtendimento = "Atendido em plenitude";
    }

    const entregue = statusAtendimento === "Atendido em plenitude";
    const parcial = statusAtendimento === "Atendido parcial";
    const emAberto = statusAtendimento === "Em aberto";
    const faixa = calcularFaixa(previsaoInicialObj, entregue ? dataRecebimentoObj : null);

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
      itemPedido,
      produto,
      descricaoProduto,
      observacaoProduto,
      referenciaProdutoFornecedor,
      fornecedor,
      fornecedorCodigo,
      comprador,
      unidadeCompra,
      situacaoPedido,
      statusAtendimento,

      mascaraEntrada,
      familiaInflacao,
      subfamiliaInflacao,

      quantidade,
      quantidadeAtendida,
      quantidadeCancelada,
      quantidadeSaldo,
      temControleAtendimento,
      quantidadeOriginal:quantidade,
      quantidadeInflacao,
      pesoPerfilKg,
      precoUnitario,
      precoUnitarioInflacao,
      conversaoInflacaoAplicada,

      valor,

      condicaoPagamento,
      prazoPagamento,

      faixa,
      entregue,
      parcial,
      emAberto,
      entregueNoPrazo,
      atraso: entregue ? diasAtrasoEntrega : atrasoAberto,

      dataRecebimento,
      datasRecebimento,
      primeiraDataRecebimentoObj,
      dataRecebimentoObj,
      mesRecebimento: monthKeyFromDate(dataRecebimentoObj),
      mesRecebimentoNum: dataRecebimentoObj ? dataRecebimentoObj.getMonth() + 1 : null,

      previsaoInicial,
      previsaoInicialObj,
      dataCadastroObj,
      leadTimePrevisto,
      leadTimeRealizado,
      dataLimiteOperacionalObj
    };
  }).filter(x => x.fornecedor || x.pedido);
}

async function ensureGeralData(){
  if(geralData.length) return;

  await ensurePesosPerfisData();

  const carregados = [];

  carregados.push(...mapGeralRows(await loadCSV(FILES.geral), ANO_PADRAO));

  // Uma exportação de 2020–2025 substitui os arquivos anuais antigos.
  // O ano é o da Data Cadastro, nunca o nome do arquivo nem a data de entrega.
  let historicoConsolidado = [];
  try{
    historicoConsolidado = await loadCSV(FILES.historicoConsolidado, false);
  }catch(error){
    console.warn("Histórico consolidado não carregado:", error.message);
  }
  const porAno = new Map();
  if(historicoConsolidado.length){
    historicoConsolidado.forEach(r => {
      const ano = String(parseDateBR(get(r, ["Data Cadastro", "Data do Pedido", "Data Pedido"]))?.getFullYear() || "");
      if(!ANOS_HISTORICO.includes(ano) || ano === ANO_PADRAO) return;
      if(!porAno.has(ano)) porAno.set(ano, []);
      porAno.get(ano).push(r);
    });
    if(porAno.size){
      ANOS_HISTORICO.slice(1).forEach(ano => {
        if(porAno.has(ano)) carregados.push(...mapGeralRows(porAno.get(ano), ano));
      });
    }else{
      console.warn("historico.csv sem linhas válidas de 2020 a 2025; usando arquivos anuais.");
    }
  }

  for(const ano of ANOS_HISTORICO.slice(1)){
    if(porAno.has(ano)) continue;
    try{
      const rows = await loadCSV(FILES.historico[ano], false);
      carregados.push(...mapGeralRows(rows, ano));
    }catch(error){
      console.warn(`Histórico ${ano} não carregado:`, error.message);
    }
  }

  geralData = carregados;
}

/* =========================
   CÁLCULO INFLACIONÁRIO
========================= */

function quantidadeInflacaoLinha(x){
  const quantidadeConvertida = Number(x?.quantidadeInflacao || 0);

  if(quantidadeConvertida > 0){
    return quantidadeConvertida;
  }

  return Number(x?.quantidade || 0);
}

function filtrarBaseInflacao(base, opcaoId){
  const opcao = getOpcaoInflacao(opcaoId);

  return base.filter(x => {
    const familiaOk = x.familiaInflacao === opcao.familia;
    const subfamiliaOk = !opcao.subfamilia || x.subfamiliaInflacao === opcao.subfamilia;
    const quantidadeKg = quantidadeInflacaoLinha(x);

    return familiaOk &&
      subfamiliaOk &&
      x.mesRecebimento &&
      quantidadeKg > 0 &&
      x.valor > 0;
  });
}

function calcularBaseComparativaIndice(indice, quantidadeTotal, valorTotal, precoInterno){
  if(!indice || !indice.valor){
    return {
      quantidadeIndice:0,
      precoInternoComparativo:null,
      coberturaIndicePercentual:null
    };
  }

  if(Array.isArray(indice.detalhes) && indice.detalhes.length){
    const detalhesComIndice = indice.detalhes.filter(x => {
      return x &&
        x.indice &&
        x.indice.valor > 0 &&
        x.quantidadeTotal > 0;
    });

    const quantidadeComIndice = detalhesComIndice.reduce((s,x) => s + x.quantidadeTotal, 0);
    const valorComIndice = detalhesComIndice.reduce((s,x) => s + x.valorTotal, 0);

    if(quantidadeComIndice > 0){
      return {
        quantidadeIndice:quantidadeComIndice,
        precoInternoComparativo:valorComIndice / quantidadeComIndice,
        coberturaIndicePercentual:quantidadeTotal > 0 ? (quantidadeComIndice / quantidadeTotal) * 100 : null
      };
    }
  }

  return {
    quantidadeIndice:quantidadeTotal,
    precoInternoComparativo:precoInterno,
    coberturaIndicePercentual:100
  };
}

function gerarInflacaoMensal(base, opcaoId){
  const opcao = getOpcaoInflacao(opcaoId);
  const linhas = filtrarBaseInflacao(base, opcaoId);

  const grupos = Object.values(group(linhas, "mesRecebimento"))
    .map(g => {
      const valorTotal = g.items.reduce((s,x) => s + x.valor, 0);
      const quantidadeTotal = g.items.reduce((s,x) => s + quantidadeInflacaoLinha(x), 0);
      const precoInterno = quantidadeTotal > 0 ? valorTotal / quantidadeTotal : 0;

      const indice = opcao.subfamilia
        ? buscarIndiceMercado(opcao.familia, g.nome, opcao.subfamilia)
        : calcularIndiceMercadoPonderado(opcao.familia, g.nome, g.items);

      const valorIndice = indice ? indice.valor : null;

      const baseComparativa = calcularBaseComparativaIndice(
        indice,
        quantidadeTotal,
        valorTotal,
        precoInterno
      );

      const diferencaPercentual = valorIndice && valorIndice > 0 && baseComparativa.precoInternoComparativo > 0
        ? ((baseComparativa.precoInternoComparativo / valorIndice) - 1) * 100
        : null;

      const impactoEstimado = valorIndice && baseComparativa.quantidadeIndice > 0
        ? (baseComparativa.precoInternoComparativo - valorIndice) * baseComparativa.quantidadeIndice
        : null;

      return {
        mes:g.nome,
        label:monthLabel(g.nome),

        familia:opcao.familia,
        subfamilia:opcao.subfamilia,
        nomeOpcao:opcao.label,

        precoInterno,
        precoInternoComparativo:baseComparativa.precoInternoComparativo,

        indiceMercado:valorIndice,
        nomeIndice:indice?.indice || "Mercado -1",
        origemIndice:indice?.origemIndice || "",

        diferencaPercentual,
        impactoEstimado,

        quantidadeTotal,
        quantidadeIndice:baseComparativa.quantidadeIndice,
        coberturaIndicePercentual:baseComparativa.coberturaIndicePercentual,

        valorTotal,
        indiceDetalhes:indice?.detalhes || []
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
  const quantidadeTotal = linhas.reduce((s,x) => s + quantidadeInflacaoLinha(x), 0);
  const precoMedio = quantidadeTotal > 0 ? valorTotal / quantidadeTotal : 0;

  const meses = gerarInflacaoMensal(base, opcaoId);
  const primeiro = meses[0] || null;
  const ultimo = meses[meses.length - 1] || null;

  const variacaoPeriodo = primeiro && ultimo && primeiro.precoInterno > 0
    ? ((ultimo.precoInterno / primeiro.precoInterno) - 1) * 100
    : null;

  const indicesValidos = meses.filter(x => {
    return x.indiceMercado > 0 &&
      x.quantidadeIndice > 0 &&
      x.precoInternoComparativo > 0;
  });

  const quantidadeComIndice = indicesValidos.reduce((s,x) => s + x.quantidadeIndice, 0);

  const indicePonderado = quantidadeComIndice > 0
    ? indicesValidos.reduce((s,x) => s + (x.indiceMercado * x.quantidadeIndice), 0) / quantidadeComIndice
    : null;

  const precoMedioComparativo = quantidadeComIndice > 0
    ? indicesValidos.reduce((s,x) => s + (x.precoInternoComparativo * x.quantidadeIndice), 0) / quantidadeComIndice
    : null;

  const diferencaVsMercado = indicePonderado && indicePonderado > 0 && precoMedioComparativo > 0
    ? ((precoMedioComparativo / indicePonderado) - 1) * 100
    : null;

  const impactoEstimado = indicePonderado && precoMedioComparativo !== null
    ? (precoMedioComparativo - indicePonderado) * quantidadeComIndice
    : null;

  const coberturaIndicePercentual = quantidadeTotal > 0 && quantidadeComIndice > 0
    ? (quantidadeComIndice / quantidadeTotal) * 100
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
    precoMedioComparativo,
    quantidadeComIndice,
    coberturaIndicePercentual,

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
  const qtdAtual = linhasAtuais.reduce((s,x) => s + quantidadeInflacaoLinha(x), 0);
  const precoAtual = qtdAtual > 0 ? valorAtual / qtdAtual : 0;

  const valorAnterior = linhasAnoAnterior.reduce((s,x) => s + x.valor, 0);
  const qtdAnterior = linhasAnoAnterior.reduce((s,x) => s + quantidadeInflacaoLinha(x), 0);
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

function statusAtendimentoClass(status){
  const s = norm(status);

  if(s.includes("plenitude")) return "badge-green";
  if(s.includes("parcial")) return "badge-yellow";
  if(s.includes("aberto")) return "badge-orange";

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
    statusSavingsPerformance = "carregando";
    savingsPerformancePromise = carregarSavingsPerformance();
    savingsPerformancePromise.then(() => {
      if(document.getElementById("geralContent")) renderGeralContent(geralData);
    });
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

// O CSV não contém o prazo homologado: usamos a previsão inicial do pedido.
function calcularLeadTimePonderado(linhas, campo){
  const validas = linhas.filter(x => x.quantidade > 0 &&
    Number.isFinite(x[campo]) && x[campo] >= 0 &&
    (campo !== "leadTimeRealizado" || x.entregue));
  const peso = validas.reduce((s, x) => s + x.quantidade, 0);
  return {
    dias:peso ? validas.reduce((s,x) => s + x[campo] * x.quantidade, 0) / peso : null,
    linhas:validas.length
  };
}

function leadTimeTexto(resultado){
  return resultado.dias === null ? "—" : `${resultado.dias.toLocaleString("pt-BR", {maximumFractionDigits:1})} d`;
}

/* Nota por item vencido. A última entrega mede a conclusão; sem quantidade por
   recebimento, datas intermediárias identificam entregas mistas, não seu volume. */
function notaEntregaLinha(x, hoje = normalizeDate(new Date())){
  const limite = x.dataLimiteOperacionalObj;
  if(!limite || limite > hoje) return {tipo:"futuro"};
  const quantidadeEfetiva = x.quantidade - (x.quantidadeCancelada || 0);
  if(!(quantidadeEfetiva > 0)) return {tipo:"excluido"};
  // Os históricos antigos não têm quantidades atendidas. É possível avaliar
  // a última entrega das linhas concluídas, mas não pontuar suas parciais.
  if(!x.temControleAtendimento && !x.entregue) return {tipo:"excluido"};
  const datas = x.datasRecebimento || [];
  if(datas.some(d => x.dataCadastroObj && d < x.dataCadastroObj)) return {tipo:"excluido"};
  const fracao = x.temControleAtendimento
    ? Math.min(1, Math.max(0, x.quantidadeAtendida / quantidadeEfetiva)) : 1;
  const completo = x.temControleAtendimento
    ? x.quantidadeSaldo <= 0 && fracao >= 0.999 : x.entregue;
  if(completo && !x.dataRecebimentoObj) return {tipo:"excluido"};
  const termino = completo ? x.dataRecebimentoObj : hoje;
  const atraso = Math.max(0, diffDays(termino, limite) || 0);
  const misto = datas.some(d => d <= limite) && datas.some(d => d > limite);
  return {
    tipo:completo ? (atraso ? "completoAtraso" : "completoPrazo")
      : (fracao ? "parcial" : "aberto"),
    misto, atraso, fracao,
    pontos:100 * fracao / (1 + atraso / 30),
    valor:Math.max(0, x.valor || 0)
  };
}

function resumirNotaEntrega(linhas){
  const tipos = {completoPrazo:0, completoAtraso:0, parcial:0, aberto:0, misto:0, futuro:0, excluido:0};
  let soma = 0, somaPonderada = 0, valor = 0, validos = 0;
  linhas.forEach(x => {
    const r = notaEntregaLinha(x);
    tipos[r.tipo]++;
    if(r.misto) tipos.misto++;
    if(r.pontos === undefined) return;
    validos++;
    soma += r.pontos;
    somaPonderada += r.pontos * r.valor;
    valor += r.valor;
  });
  return {
    tipos, validos,
    nota:validos ? 0.7 * (soma / validos) + 0.3 * (valor ? somaPonderada / valor : soma / validos) : null
  };
}

function baseNotaCompleta(){
  return geralData.some(x => x.anoBase === ANO_PADRAO && x.itemPedido);
}

function detalheNotaEntrega(r){
  const c = r.tipos;
  return `${r.validos} itens avaliados · ${c.completoPrazo} completos no prazo · ` +
    `${c.completoAtraso} completos com atraso · ${c.parcial} parciais · ` +
    `${c.aberto} sem entrega · ${c.misto} com recebimentos antes e depois do prazo · ` +
    `${c.futuro} ainda não vencidos · ${c.excluido} sem dados válidos para a nota.`;
}

let savingsPerformance = [];
let statusSavingsPerformance = "carregando";
let savingsPerformancePromise = null;

async function carregarSavingsPerformance(){
  try{
    const client = getSavingClient();
    if(client){
      const {data, error} = await client.from(SAVING_TABLE).select("*");
      if(error) throw error;
      savingsPerformance = (data || []).map(dbToSaving);
    }else{
      const rows = await loadCSV(FILES.saving, false);
      savingsPerformance = rows.map(r => ({
        categoria:"Saving", tipo:get(r,["Tipo"]), data:get(r,["Data"]),
        comprador:get(r,["Comprador"]), status:get(r,["Status"]),
        quantidade:get(r,["Consumo Mensal"]), precoAtual:get(r,["Preco Atual Unitario", "Preço Atual Unitario"]),
        competidorA:get(r,["Vencedor"]), precoCompetidorA:get(r,["Preco Vencedor", "Preço Vencedor"])
      }));
    }
    statusSavingsPerformance = "disponivel";
  }catch(error){
    console.warn("Saving indisponível para a nota integrada:", error);
    statusSavingsPerformance = "indisponivel";
  }
}

function chaveCompradorNota(nome){
  return norm(nome).split(/\s+/)[0];
}

function notaSavingComprador(nome, ano, carteiraCompleta){
  if(ano !== "2026" || statusSavingsPerformance !== "disponivel") return null;
  const hoje = normalizeDate(new Date());
  const fim = new Date(Math.min(+hoje, +new Date(2026,11,31)));
  const inicio = new Date(fim.getFullYear() - 1, fim.getMonth(), fim.getDate() + 1);
  const comprador = chaveCompradorNota(nome);
  const valorCarteira = carteiraCompleta.filter(x =>
    chaveCompradorNota(x.comprador) === comprador &&
    x.dataCadastroObj >= inicio && x.dataCadastroObj <= fim
  ).reduce((s,x) => s + Math.max(0,x.valor), 0);
  if(!valorCarteira) return null;
  const homologados = savingsPerformance.filter(x => {
    const data = parseDateBR(x.data);
    return norm(x.categoria) === "saving" && norm(x.status) === "homologado" &&
      chaveCompradorNota(x.comprador) === comprador && data && data.getFullYear() === 2026;
  });
  const projetado = homologados.reduce((s,x) => s + calcularSavingRegistro(x).savingTotal, 0);
  const taxa = projetado / valorCarteira;
  return {projetado, valorCarteira, taxa, quantidade:homologados.length,
    pontos:Math.max(0, Math.min(10, 10 * taxa / META_SAVING_2026))};
}

function barraNota(nome, resumo, saving = undefined){
  const entrega = resumo.nota;
  const pontosEntrega = entrega === null ? null : entrega * PESO_ENTREGAS_COMPRADOR;
  const total = saving === undefined ? entrega : saving && pontosEntrega !== null
    ? pontosEntrega + saving.pontos : null;
  const texto = total === null ? "—" : `${total.toLocaleString("pt-BR", {maximumFractionDigits:1})} / 100`;
  const explicacaoSaving = saving === undefined ? "" : saving
    ? `<p>Entregas: ${pontosEntrega.toFixed(1).replace(".",",")} / 90 · Saving anualizado homologado: ${saving.pontos.toFixed(1).replace(".",",")} / 10.</p>
       <p>Saving projetado ${moneySV(saving.projetado)} / carteira em 12 meses ${moneySV(saving.valorCarteira)} = ${(saving.taxa*100).toLocaleString("pt-BR",{maximumFractionDigits:2})}% · meta 2026: 5% · ${saving.quantidade} negociação(ões).</p>`
    : `<p>Entregas: ${pontosEntrega === null ? "—" : pontosEntrega.toFixed(1).replace(".",",")} / 90 · Saving sem base comparável ou indisponível; nota combinada não calculada.</p>`;
  return `<details class="performance-detail"><summary>
    <span class="performance-name">${esc(nome)}</span>
    <span class="performance-track"><span style="width:${total === null ? 0 : total}%"></span></span>
    <b>${texto}</b></summary>
    <div class="performance-explain">${explicacaoSaving}<p>${esc(detalheNotaEntrega(resumo))}</p>
    <small>Prazo: previsão inicial + 7 dias. Entrega: 70% por item e 30% por valor; dias de atraso reduzem progressivamente a nota. Cancelamentos integrais e datas incoerentes são excluídos.</small></div>
  </details>`;
}

function chaveFornecedor(x){
  return String(x.fornecedorCodigo || `nome:${x.fornecedor}`).trim();
}

function renderFornecedorChoices(){
  const list = document.getElementById("geralFornecedorChoices");
  const input = document.getElementById("geralFornecedorBusca");
  if(!list || !input) return;
  const termos = norm(input.value).split(/\s+/).filter(Boolean);
  const encontrados = geralFornecedorOpcoes.filter(x =>
    termos.every(t => norm(`${x.codigo} ${x.nome}`).includes(t)));
  const visiveis = encontrados.slice(0, 80);
  list.innerHTML = visiveis.map(x => `
    <label class="supplier-option">
      <input type="checkbox" value="${esc(x.chave)}" ${geralFornecedoresSelecionados.has(x.chave) ? "checked" : ""}>
      <span class="supplier-option-name">${esc(x.nome)}</span>
      <small>${esc(x.codigo)}</small>
    </label>`).join("") || '<div class="supplier-empty">Nenhum fornecedor encontrado.</div>';
  const counter = document.getElementById("geralFornecedorCount");
  if(counter) counter.textContent = encontrados.length > 80
    ? `Mostrando 80 de ${encontrados.length}. Continue digitando.`
    : `${encontrados.length} fornecedor${encontrados.length === 1 ? "" : "es"}`;
}

function atualizarFornecedorSelecionado(renderizarLista = true){
  const count = geralFornecedoresSelecionados.size;
  const trigger = document.getElementById("geralFornecedorTrigger");
  if(trigger) trigger.textContent = count ? `${count} fornecedor${count === 1 ? "" : "es"} selecionado${count === 1 ? "" : "s"} ▾` : "Todos os fornecedores ▾";
  const chips = document.getElementById("geralFornecedorChips");
  if(chips) chips.innerHTML = geralFornecedorOpcoes.filter(x => geralFornecedoresSelecionados.has(x.chave))
    .map(x => `<button type="button" class="supplier-chip" data-remove="${esc(x.chave)}" title="Remover ${esc(x.nome)}">${esc(x.nome)} <b aria-hidden="true">×</b></button>`).join("");
  if(renderizarLista) renderFornecedorChoices();
}

let geralFiltroAbort = new AbortController();

function configurarFiltroFornecedores(base){
  const opcoes = new Map();
  base.forEach(x => {
    if(x.fornecedor){
      const chave = chaveFornecedor(x);
      if(!opcoes.has(chave)) opcoes.set(chave, {chave, nome:x.fornecedor, codigo:x.fornecedorCodigo || "Sem código"});
    }
  });
  geralFornecedorOpcoes = [...opcoes.values()].sort((a,b) => a.nome.localeCompare(b.nome,"pt-BR"));
  const trigger = document.getElementById("geralFornecedorTrigger");
  const painel = document.getElementById("geralFornecedorPanel");
  trigger.addEventListener("click", () => {
    painel.hidden = !painel.hidden;
    trigger.setAttribute("aria-expanded", String(!painel.hidden));
    if(!painel.hidden) document.getElementById("geralFornecedorBusca").focus();
  });
  document.getElementById("geralFornecedorBusca").addEventListener("input", renderFornecedorChoices);
  document.getElementById("geralFornecedorChoices").addEventListener("change", e => {
    if(e.target.matches('input[type="checkbox"]')){
      if(e.target.checked) geralFornecedoresSelecionados.add(e.target.value);
      else geralFornecedoresSelecionados.delete(e.target.value);
      atualizarFornecedorSelecionado(false);
      geralPagina = 1;
      renderGeralContent(base);
    }
  });
  document.getElementById("geralFornecedorChips").addEventListener("click", e => {
    const chip = e.target.closest("[data-remove]");
    if(!chip) return;
    geralFornecedoresSelecionados.delete(chip.dataset.remove);
    atualizarFornecedorSelecionado();
    geralPagina = 1;
    renderGeralContent(base);
  });
  document.getElementById("geralFornecedorClear").addEventListener("click", () => {
    geralFornecedoresSelecionados.clear();
    atualizarFornecedorSelecionado();
    geralPagina = 1;
    renderGeralContent(base);
  });
  painel.addEventListener("keydown", e => {
    if(e.key === "Escape"){
      painel.hidden = true;
      trigger.setAttribute("aria-expanded", "false");
      trigger.focus();
    }
  });
  document.addEventListener("click", e => {
    if(painel.isConnected && !e.target.closest("#geralFornecedorPicker")){
      painel.hidden = true;
      trigger.setAttribute("aria-expanded", "false");
    }
  }, {signal:geralFiltroAbort.signal});
  atualizarFornecedorSelecionado();
}

function renderGeralView(base){
  const root = ensureAppElement();
  if(!root) return;
  geralFiltroAbort.abort();
  geralFiltroAbort = new AbortController();

  const anos = anosDisponiveis(base);
  const compradores = uniqueOptions(base, "comprador");
  const faixas = uniqueOptions(base, "faixa");
  const statusAtendimento = ["Atendido em plenitude", "Atendido parcial", "Em aberto"];

  root.innerHTML = `
    <section class="hero">
      <div>
        <span class="hero-kicker">Visão executiva</span>
        <h1>Dashboard Geral</h1>
        <p>Leitura rápida da carteira, dos riscos de entrega e do volume comprado.</p>
      </div>
    </section>

    ${renderFilterBar([
      {type:"select", id:"geralAno", label:"Ano", options:anos, size:"compact"},
      {type:"select", id:"geralMesInicial", label:"Mês inicial", options:MESES_FILTRO, size:"medium"},
      {type:"select", id:"geralMesFinal", label:"Mês final", options:MESES_FILTRO, size:"medium"},
      {type:"select", id:"geralComprador", label:"Todos compradores", options:compradores, size:"medium"},
      {type:"text", id:"geralProduto", label:"Código do item", placeholder:"Código exato do item", size:"medium"},
      {type:"text", id:"geralDescricao", label:"Descrição, PN ou TAUS", placeholder:"Pesquisar descrição, PN ou TAUS", size:"wide"},
      {type:"text", id:"geralCodigoFornecedor", label:"Código do fornecedor (cadastro)", placeholder:"Código do fornecedor", size:"medium"},
      {type:"text", id:"geralPedido", label:"Pedido", placeholder:"Número do pedido", size:"medium"},
      {type:"select", id:"geralFaixa", label:"Todas faixas de risco", options:faixas, size:"wide", advanced:true},
      {type:"select", id:"geralAtendimento", label:"Todos status de atendimento", options:statusAtendimento, size:"wide", advanced:true}
    ], {clearAction:"limparFiltrosGeral()"})}

    <div class="supplier-filter-row">
      <div class="supplier-picker" id="geralFornecedorPicker">
        <span class="supplier-filter-label">Fornecedores</span>
        <button type="button" id="geralFornecedorTrigger" aria-haspopup="true" aria-expanded="false" aria-controls="geralFornecedorPanel">Todos os fornecedores ▾</button>
        <div class="supplier-popover" id="geralFornecedorPanel" hidden>
          <div class="supplier-popover-head">
            <input type="search" id="geralFornecedorBusca" aria-label="Pesquisar fornecedores" placeholder="Busque nome ou código">
            <button type="button" id="geralFornecedorClear">Limpar seleção</button>
          </div>
          <div id="geralFornecedorCount" class="supplier-count"></div>
          <div id="geralFornecedorChoices" class="supplier-choices"></div>
        </div>
      </div>
      <div id="geralFornecedorChips" class="supplier-chips" aria-live="polite"></div>
    </div>
    <div class="filter-hint">Combine código, descrição e fornecedores. PN, TAUS e observações são pesquisáveis quando constarem da exportação. Para consultar o histórico completo, selecione “Todos os anos”.</div>
    ${baseNotaCompleta() ? "" : '<div class="score-warning">Notas preliminares: o geral.csv atual não traz o número do item nem cancelamentos. Substitua pela exportação completa para a análise definitiva.</div>'}
    <div id="geralContent"></div>
  `;

  aplicarPeriodoPadrao("geral");
  configurarFiltroFornecedores(base);
  let timer;
  ["geralAno","geralMesInicial","geralMesFinal","geralComprador","geralProduto","geralDescricao","geralCodigoFornecedor","geralPedido","geralFaixa","geralAtendimento"].forEach(id => {
    const el = document.getElementById(id);
    const refresh = () => {
      clearTimeout(timer);
      geralPagina = 1;
      inflacaoPontoSelecionado = null;
      if(el.tagName === "INPUT") timer = setTimeout(() => renderGeralContent(base), 180);
      else renderGeralContent(base);
    };
    el.addEventListener(el.tagName === "INPUT" ? "input" : "change", refresh);
  });

  renderGeralContent(base);
}

function filtrosGeralAtuais(){
  return {
    comprador:getFilterValue("geralComprador"),
    codigoProduto:norm(getFilterValue("geralProduto")),
    termosDescricao:norm(getFilterValue("geralDescricao")).split(/\s+/).filter(Boolean),
    fornecedorCodigo:norm(getFilterValue("geralCodigoFornecedor")),
    pedido:norm(getFilterValue("geralPedido")),
    faixa:getFilterValue("geralFaixa"),
    atendimento:getFilterValue("geralAtendimento")
  };
}

function passaFiltrosGeralComuns(x, filtros){
  const {comprador, codigoProduto, termosDescricao, fornecedorCodigo, pedido, faixa, atendimento} = filtros;
  return (!comprador || x.comprador === comprador) &&
    (!geralFornecedoresSelecionados.size || geralFornecedoresSelecionados.has(chaveFornecedor(x))) &&
    (!fornecedorCodigo || norm(x.fornecedorCodigo) === fornecedorCodigo) &&
    (!codigoProduto || norm(x.produto) === codigoProduto) &&
    termosDescricao.every(t => norm(`${x.descricaoProduto} ${x.observacaoProduto} ${x.referenciaProdutoFornecedor}`).includes(t)) &&
    (!pedido || norm(x.pedido).includes(pedido)) &&
    (!faixa || x.faixa === faixa) &&
    (!atendimento || x.statusAtendimento === atendimento);
}

function filterGeral(base){
  const filtros = filtrosGeralAtuais();
  return base.filter(x => passaFiltroAnoPeriodo(x, "geral") && passaFiltrosGeralComuns(x, filtros));
}

function filterGeralComparativaInflacao(base){
  const filtros = filtrosGeralAtuais();
  const {ini, fim} = getPeriodoMes("geral");

  return base.filter(x => {
    if(!passaFiltrosGeralComuns(x, filtros)) return false;

    if(ini !== null && fim !== null){
      if(!x.dataRecebimentoObj) return false;

      const mes = x.dataRecebimentoObj.getMonth() + 1;
      if(mes < ini || mes > fim) return false;
    }

    return true;
  });
}

function renderPrazosPorFornecedor(data){
  const codigos = [...new Set(data.map(x => x.produto).filter(Boolean))];
  if(codigos.length !== 1) return "";
  const grupos = Object.values(group(data, "fornecedor"))
    .map(g => ({nome:g.nome, codigo:g.items[0].fornecedorCodigo,
      previsto:calcularLeadTimePonderado(g.items,"leadTimePrevisto"),
      realizado:calcularLeadTimePonderado(g.items,"leadTimeRealizado")}))
    .sort((a,b) => b.previsto.linhas - a.previsto.linhas);
  return `<section class="panel leadtime-panel">
    <h2>Histórico do item ${esc(codigos[0])} por fornecedor</h2>
    <p>Referência para o cadastro. Fornecedor com compra no histórico não significa fornecedor homologado.</p>
    <div class="leadtime-table-wrap"><table><thead><tr><th>Fornecedor</th><th>Código</th><th>Previsto ponderado</th><th>Realizado ponderado</th><th>Pedidos válidos</th></tr></thead>
    <tbody>${grupos.map(g => `<tr><td>${esc(g.nome)}</td><td>${esc(g.codigo || "—")}</td><td>${leadTimeTexto(g.previsto)}</td><td>${leadTimeTexto(g.realizado)}</td><td>${g.previsto.linhas}</td></tr>`).join("")}</tbody></table></div>
  </section>`;
}

function irParaPaginaGeral(pagina){
  geralPagina = pagina;
  renderGeralContent(geralData);
  document.getElementById("geralTabela")?.scrollIntoView({block:"start",behavior:"smooth"});
}

function aplicarFiltroGeralFaixa(faixa){
  setFilterAndTrigger("geralFaixa", faixa);
}

function aplicarFiltroGeralAtendimento(status){
  setFilterAndTrigger("geralAtendimento", status);
}

function aplicarFiltroGeralMes(mes){
  aplicarFiltroPeriodoMes("geral", mes);
}

function limparFiltrosGeral(){
  setFilterValue("geralAno", ANO_PADRAO);
  setFilterValue("geralMesInicial", "");
  setFilterValue("geralMesFinal", "");
  setFilterValue("geralComprador", "");
  geralFornecedoresSelecionados.clear();
  atualizarFornecedorSelecionado();
  setFilterValue("geralProduto", "");
  setFilterValue("geralDescricao", "");
  setFilterValue("geralCodigoFornecedor", "");
  setFilterValue("geralPedido", "");
  setFilterValue("geralFaixa", "");
  setFilterValue("geralAtendimento", "");

  geralPagina = 1;
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
  const parciais = data.filter(x => x.parcial).length;
  const emAberto = data.filter(x => x.emAberto).length;

  const leadTimePrevisto = calcularLeadTimePonderado(data, "leadTimePrevisto");
  const leadTimeRealizado = calcularLeadTimePonderado(data, "leadTimeRealizado");
  const leadTimePrevistoComparavel = calcularLeadTimePonderado(
    data.filter(x => x.entregue && Number.isFinite(x.leadTimeRealizado) && x.leadTimeRealizado >= 0),
    "leadTimePrevisto"
  );
  const totalPaginas = Math.max(1, Math.ceil(data.length / GERAL_POR_PAGINA));
  geralPagina = Math.min(Math.max(1, geralPagina), totalPaginas);
  const primeiraLinha = (geralPagina - 1) * GERAL_POR_PAGINA;
  const paginaLinhas = data.slice(primeiraLinha, primeiraLinha + GERAL_POR_PAGINA);

  const totalComprado = data.reduce((sum, x) => sum + x.valor, 0);

  const prazoMedioPonderado = totalComprado > 0
    ? Math.round(data.reduce((sum, x) => sum + (x.valor * x.prazoPagamento), 0) / totalComprado)
    : 0;

  const resumoEntrega = resumirNotaEntrega(data);
  const perfEntrega = resumoEntrega.validos
    ? Math.round(resumoEntrega.tipos.completoPrazo / resumoEntrega.validos * 100) : null;

  const porComprador = group(data, "comprador");

  const porFaixa = [
    ["Atrasado", atrasados, "bar-red"],
    ["Crítico", criticos, "bar-orange"],
    ["Alerta", alerta, "bar-yellow"],
    ["Dentro do prazo", dentro, "bar-green"]
  ];

  const anoNota = getFilterValue("geralAno") || ANO_PADRAO;
  const baseAnoNota = anoNota === OPCAO_TODOS_ANOS ? geralData
    : geralData.filter(x => x.anoBase === anoNota);
  const performanceComprador = Object.values(porComprador).map(g => {
    const carteira = baseAnoNota.filter(x => x.comprador === g.nome);
    const resumo = resumirNotaEntrega(carteira);
    const saving = anoNota === "2026"
      ? notaSavingComprador(g.nome, anoNota, geralData) : undefined;
    return {nome:g.nome, resumo, saving,
      nota:saving === undefined ? resumo.nota
        : saving && resumo.nota !== null ? resumo.nota * 0.9 + saving.pontos : null};
  }).sort((a,b) => (b.nota ?? -1) - (a.nota ?? -1));

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
    <section class="executive-kpis">
      ${executiveKpi("Completos no prazo", perfEntrega === null ? "—" : `${perfEntrega}%`, corPerformanceFornecedor(perfEntrega), "", "itens vencidos e avaliáveis")}
      ${executiveKpi("Atrasados", atrasados, "red", "aplicarFiltroGeralFaixa('Atrasado')", "fora do prazo")}
      ${executiveKpi("Atendidos parcialmente", parciais, "yellow", "aplicarFiltroGeralAtendimento('Atendido parcial')", "itens com saldo")}
      ${executiveKpi("Totalmente em aberto", emAberto, "orange", "aplicarFiltroGeralAtendimento('Em aberto')", "sem atendimento")}
      ${executiveKpi("Total comprado", moneyCompact(totalComprado), "blue", "", "no período filtrado", money(totalComprado))}
    </section>

    <section class="operational-strip">
      <div class="strip-block strip-risk">
        <div class="strip-heading">
          <div>
            <span>Carteira em aberto</span>
            <small>Distribuição por faixa de risco</small>
          </div>
        </div>
        <div class="compact-stats">
          ${compactStat("Crítico", criticos, "orange", "aplicarFiltroGeralFaixa('Crítico')")}
          ${compactStat("Alerta", alerta, "yellow", "aplicarFiltroGeralFaixa('Alerta')")}
          ${compactStat("Dentro do prazo", dentro, "green", "aplicarFiltroGeralFaixa('Dentro do prazo')")}
        </div>
      </div>

      <div class="strip-block strip-context">
        <div class="strip-heading">
          <div>
            <span>Contexto</span>
            <small>Volume, pagamento e lead time</small>
          </div>
        </div>
        <div class="compact-stats">
          ${compactStat("Registros", data.length, "blue", "limparFiltrosGeral()")}
          ${compactStat("Atendidos plenamente", entregues, "green", "aplicarFiltroGeralAtendimento('Atendido em plenitude')")}
          ${compactStat("Pgto. médio", `${prazoMedioPonderado} d`, "blue")}
          <div class="compact-stat" title="Da data do pedido à previsão inicial, ponderado pela quantidade comprada (${leadTimePrevisto.linhas} linhas válidas). Não é o prazo homologado."><span>LT previsto ponderado</span><b class="blue">${leadTimeTexto(leadTimePrevisto)}</b></div>
          <div class="compact-stat" title="Da data do pedido ao último recebimento de itens atendidos em plenitude, ponderado pela quantidade comprada (${leadTimeRealizado.linhas} linhas válidas)."><span>LT realizado ponderado</span><b class="green">${leadTimeTexto(leadTimeRealizado)}</b></div>
        </div>
      </div>
    </section>

    <div class="leadtime-note">Lead time em dias corridos. Previsto = previsão inicial − data do pedido (todos os itens); realizado = último recebimento − data do pedido (somente itens concluídos). As duas médias dos cards têm bases diferentes.${leadTimePrevistoComparavel.dias !== null && leadTimeRealizado.dias !== null ? ` Nos mesmos itens concluídos: previsto ${leadTimeTexto(leadTimePrevistoComparavel)}, realizado ${leadTimeTexto(leadTimeRealizado)} (${(leadTimeRealizado.dias - leadTimePrevistoComparavel.dias) >= 0 ? "+" : ""}${(leadTimeRealizado.dias - leadTimePrevistoComparavel.dias).toLocaleString("pt-BR",{maximumFractionDigits:1})} d).` : ""} Médias ponderadas pela quantidade comprada, aplicadas aos filtros. ${data.length && new Set(data.map(x => x.produto)).size > 1 ? "Há mais de um código no resultado: filtre um item antes de copiar uma referência para o cadastro." : "Confirme com Compras o prazo preferencial e a homologação antes de cadastrar."}</div>
    ${renderPrazosPorFornecedor(data)}

    <section class="panel-grid">
      <div class="panel">
        <h2>Pedidos em aberto</h2>
        ${barList(porFaixa, Math.max(...porFaixa.map(x => x[1]), 1))}
      </div>

      <div class="panel">
        <h2>Performance por comprador</h2>
        <p class="score-caption">${anoNota === "2026" ? "Nota anual da carteira · entregas 90 pontos + Saving homologado 10 pontos." : "Nota da carteira no período selecionado · apenas entregas; meta de Saving definida para 2026."} Clique para entender. Filtros de item e fornecedor não alteram a nota anual do comprador.${baseAnoNota.some(x => !x.temControleAtendimento) ? " Histórico antigo sem quantidades: apenas entregas concluídas são pontuadas até a importação completa." : ""}</p>
        ${performanceComprador.length ? performanceComprador.map(x => {
          return barraNota(x.nome, x.resumo, x.saving);
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

    <section class="table-wrap" id="geralTabela">
      <div class="table-toolbar">
        <strong>Itens encontrados: ${data.length.toLocaleString("pt-BR")}</strong>
        <div class="page-controls">
          <span>${data.length ? primeiraLinha + 1 : 0}–${Math.min(primeiraLinha + GERAL_POR_PAGINA, data.length)} de ${data.length} · página ${geralPagina}/${totalPaginas}</span>
          <button type="button" onclick="irParaPaginaGeral(${geralPagina - 1})" ${geralPagina <= 1 ? "disabled" : ""}>Anterior</button>
          <button type="button" onclick="irParaPaginaGeral(${geralPagina + 1})" ${geralPagina >= totalPaginas ? "disabled" : ""}>Próxima</button>
        </div>
      </div>
      <table>
        <thead>
          <tr>
            <th>Pedido</th>
            <th>Item</th>
            <th>Produto</th>
            <th>Descrição Produto</th>
            <th>Fornecedor / código</th>
            <th>Comprador</th>
            <th>Qtd. comprada</th>
            <th>Qtd. atendida</th>
            <th>Saldo</th>
            <th>Status atendimento</th>
            <th>Preço Unit.</th>
            <th>Valor</th>
            <th>Condição</th>
            <th>Prazo Pgto</th>
            <th>LT previsto</th>
            <th>LT realizado</th>
            <th>Faixa</th>
            <th>Atraso</th>
            <th>Último recebimento</th>
            <th>Previsão Entrega Inicial</th>
          </tr>
        </thead>

        <tbody>
          ${paginaLinhas.map(x => `
            <tr>
              <td>${esc(x.pedido || "—")}</td>
              <td>${esc(x.itemPedido || "—")}</td>
              <td>${esc(x.produto || "—")}</td>
              <td>${esc(x.descricaoProduto || "—")}${x.observacaoProduto || x.referenciaProdutoFornecedor ? `<small class="cell-code">${esc([x.referenciaProdutoFornecedor,x.observacaoProduto].filter(Boolean).join(" · "))}</small>` : ""}</td>
              <td><b>${esc(x.fornecedor || "—")}</b><small class="cell-code">${esc(x.fornecedorCodigo || "—")}</small></td>
              <td>${esc(x.comprador || "—")}</td>
              <td>${quantidadeText(x.quantidade, x.unidadeCompra)}</td>
              <td>${quantidadeText(x.quantidadeAtendida, x.unidadeCompra)}</td>
              <td>${quantidadeText(x.quantidadeSaldo, x.unidadeCompra)}</td>
              <td><span class="badge ${statusAtendimentoClass(x.statusAtendimento)}">${esc(x.statusAtendimento)}</span></td>
              <td>${money(x.precoUnitario)}</td>
              <td>${money(x.valor)}</td>
              <td>${esc(x.condicaoPagamento || "—")}</td>
              <td>${x.prazoPagamento} dias</td>
              <td>${Number.isFinite(x.leadTimePrevisto) && x.leadTimePrevisto >= 0 ? `${x.leadTimePrevisto} d` : "—"}</td>
              <td>${x.entregue && Number.isFinite(x.leadTimeRealizado) && x.leadTimeRealizado >= 0 ? `${x.leadTimeRealizado} d` : "—"}</td>
              <td><span class="badge ${faixaClass(x.faixa)}">${esc(x.faixa || "—")}</span></td>
              <td>${x.atraso}</td>
              <td>${esc(dateTextBR(x.dataRecebimentoObj))}</td>
              <td>${esc(x.previsaoInicial || "—")}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>

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
  const pedidoBusca = norm(getFilterValue("geralPedido"));
  const produtoBusca = getFilterValue("geralProduto");
  const descricaoBusca = getFilterValue("geralDescricao");
  const fornecedorCodigoBusca = getFilterValue("geralCodigoFornecedor");
  const faixa = getFilterValue("geralFaixa");
  const atendimento = getFilterValue("geralAtendimento");
  const ano = getFilterValue("geralAno") || ANO_PADRAO;
  const mesInicial = getFilterValue("geralMesInicial");
  const mesFinal = getFilterValue("geralMesFinal");
  const fornecedoresSelecionados = geralFornecedorOpcoes
    .filter(x => geralFornecedoresSelecionados.has(x.chave)).map(x => x.nome);
  const filtros = filtrosGeralAtuais();

  const base = geralData.filter(x => {
    const dias = daysUntil(x.previsaoInicialObj);

    return passaFiltroAnoPeriodo(x, "geral", "previsaoInicialObj") &&
      !x.entregue &&
      dias !== null &&
      dias <= 10 &&
      passaFiltrosGeralComuns(x, filtros);
  }).sort((a,b) => {
    const da = daysUntil(a.previsaoInicialObj);
    const db = daysUntil(b.previsaoInicialObj);

    return da - db;
  });

  const valorSaldo = base.reduce((s,x) => s + (x.quantidadeSaldo * x.precoUnitario), 0);
  const atrasados = base.filter(x => daysUntil(x.previsaoInicialObj) < 0);
  const pedidosAtrasados = new Set(atrasados.map(x => x.pedido).filter(Boolean)).size;
  const parciais = base.filter(x => x.parcial).length;

  const vencendo = base.filter(x => {
    const d = daysUntil(x.previsaoInicialObj);
    return d >= 0 && d <= 10;
  }).length;

  const tituloComprador = comprador || "Todos os compradores";
  const dataEmissao = new Date().toLocaleDateString("pt-BR");
  const periodoMes = mesInicial || mesFinal
    ? `${mesInicial || "Janeiro"} a ${mesFinal || "Dezembro"}`
    : "Todos os meses";

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
  .meta{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px;margin:18px 0;}
  .card{border:1px solid #334155;border-radius:14px;padding:13px;background:#0f172a;}
  .card small{display:block;color:#94a3b8;font-size:11px;text-transform:uppercase;font-weight:bold;}
  .card strong{display:block;margin-top:7px;font-size:20px;color:#f8fafc;}
  .criteria{font-size:12px;color:#cbd5e1;background:#0f172a;border:1px solid #334155;border-radius:12px;padding:13px;margin-bottom:16px;line-height:1.6;}
  table{width:100%;border-collapse:collapse;font-size:10px;background:#020617;border:1px solid #334155;}
  th{background:#111827;color:#f8fafc;text-align:left;padding:8px;border-bottom:1px solid #334155;}
  td{border-bottom:1px solid #1e293b;padding:7px;vertical-align:top;color:#e5e7eb;}
  tr:nth-child(even){background:#0f172a;}
  .num{text-align:right;white-space:nowrap;}
  .status{font-weight:bold;white-space:nowrap;}
  .partial{color:#facc15;}
  .open{color:#fb923c;}
  .late{color:#f87171;font-weight:bold;}
  .soon{color:#facc15;font-weight:bold;}
  .footer{margin-top:18px;font-size:10px;color:#94a3b8;text-align:right;}
  @media print{
    @page{size:landscape;margin:8mm;}
    body{background:#020617;color:#f8fafc;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
    .print-btn{display:none;}
    .page{padding:8px;}
    table{font-size:7.5px;}
    thead{display:table-header-group;}
    th,td{padding:4px;}
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
    <div class="card"><small>Itens em atenção</small><strong>${base.length}</strong></div>
    <div class="card"><small>Itens parciais</small><strong>${parciais}</strong></div>
    <div class="card"><small>Pedidos atrasados</small><strong>${pedidosAtrasados}</strong></div>
    <div class="card"><small>Vencendo em até 10 dias</small><strong>${vencendo}</strong></div>
  </div>

  <div class="criteria">
    <b>Critério:</b> itens em aberto ou atendidos parcialmente, com <b>Previsão Entrega Inicial</b> já vencida ou vencendo em até 10 dias.
    <br><b>Período da previsão inicial:</b> ${esc(ano)} — ${esc(periodoMes)}
    ${fornecedoresSelecionados.length ? `<br><b>Fornecedores:</b> ${esc(fornecedoresSelecionados.join(", "))}` : ""}
    ${fornecedorCodigoBusca ? `<br><b>Código fornecedor:</b> ${esc(fornecedorCodigoBusca)}` : ""}
    ${produtoBusca ? `<br><b>Código item:</b> ${esc(produtoBusca)}` : ""}
    ${descricaoBusca ? `<br><b>Descrição/PN/TAUS:</b> ${esc(descricaoBusca)}` : ""}
    ${pedidoBusca ? `<br><b>Pedido filtrado:</b> ${esc(pedidoBusca)}` : ""}
    ${faixa ? `<br><b>Faixa filtrada:</b> ${esc(faixa)}` : ""}
    ${atendimento ? `<br><b>Status filtrado:</b> ${esc(atendimento)}` : ""}
    <br><b>Valor estimado do saldo em atenção:</b> ${money(valorSaldo)}
    <br><b>Emitido em:</b> ${dataEmissao}
  </div>

  <table>
    <thead>
      <tr>
        <th>Pedido</th>
        <th>Item</th>
        <th>Produto</th>
        <th>Descrição Produto</th>
        <th>Fornecedor</th>
        <th>Comprador</th>
        <th class="num">Comprada</th>
        <th class="num">Atendida</th>
        <th class="num">Saldo</th>
        <th>Status</th>
        <th class="num">Valor saldo</th>
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
            <td>${esc(x.itemPedido || "—")}</td>
            <td>${esc(x.produto)}</td>
            <td>${esc(x.descricaoProduto)}</td>
            <td>${esc(x.fornecedor)}</td>
            <td>${esc(x.comprador)}</td>
            <td class="num">${quantidadeText(x.quantidade, x.unidadeCompra)}</td>
            <td class="num">${quantidadeText(x.quantidadeAtendida, x.unidadeCompra)}</td>
            <td class="num"><b>${quantidadeText(x.quantidadeSaldo, x.unidadeCompra)}</b></td>
            <td class="status ${x.parcial ? "partial" : "open"}">${esc(x.statusAtendimento)}</td>
            <td class="num">${money(x.quantidadeSaldo * x.precoUnitario)}</td>
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
   PERFORMANCE DE FORNECEDORES
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

function classificarFornecedor(stats){
  if(isFornecedorEstrategico(stats.nome)){
    return "Estratégico";
  }

  if(stats.pedidosUnicos <= 1){
    return "Não crítico";
  }

  if(stats.performance === null || stats.performance === undefined){
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
  if(value === null || value === undefined) return "blue";
  if(value >= 80) return "green";
  if(value >= 60) return "yellow";
  return "red";
}

function performanceFornecedorText(value){
  return value === null || value === undefined ? "Sem base" : `${value.toLocaleString("pt-BR", {maximumFractionDigits:1})} / 100`;
}

function pedidoEstaAtrasadoAberto(itens){
  const hoje = normalizeDate(new Date());

  return itens.some(x => !x.entregue && x.dataLimiteOperacionalObj && hoje > x.dataLimiteOperacionalObj);
}

function pedidoFoiEntregueAtrasado(itens){
  return itens.length > 0 &&
    itens.every(x => x.entregue) &&
    itens.some(x => !x.entregueNoPrazo);
}

function calcularRankingFornecedores(base){
  const grupos = new Map();

  base.filter(x => x.fornecedor).forEach(x => {
    const chave = String(x.fornecedorCodigo || fornecedorKey(x.fornecedor));

    if(!grupos.has(chave)){
      grupos.set(chave, {
        nome:x.fornecedor,
        codigo:x.fornecedorCodigo,
        items:[]
      });
    }

    grupos.get(chave).items.push(x);
  });

  return [...grupos.values()].map(g => {
    const pedidos = [...new Set(g.items.map(x => x.pedido).filter(Boolean))];

    const valorTotal = g.items.reduce((s,x) => s + x.valor, 0);
    const quantidadeTotal = g.items.reduce((s,x) => s + x.quantidade, 0);

    const itensPlenos = g.items.filter(x => x.entregue);
    const itensParciais = g.items.filter(x => x.parcial);
    const itensEmAberto = g.items.filter(x => x.emAberto);
    const resumoNota = resumirNotaEntrega(g.items);
    const performance = resumoNota.nota;

    const itensAtrasadosAbertos = g.items.filter(x => !x.entregue && x.atraso > 0);
    const itensEntreguesAtrasados = itensPlenos.filter(x => x.atraso > 0);

    const atrasoMedioAberto = itensAtrasadosAbertos.length
      ? Math.round(itensAtrasadosAbertos.reduce((s,x) => s + x.atraso, 0) / itensAtrasadosAbertos.length)
      : 0;

    const atrasoMedioEntregue = itensEntreguesAtrasados.length
      ? Math.round(itensEntreguesAtrasados.reduce((s,x) => s + x.atraso, 0) / itensEntreguesAtrasados.length)
      : 0;

    const pedidosAgrupados = Object.values(group(g.items.filter(x => x.pedido), "pedido"));
    const pedidosAtrasadosAbertos = pedidosAgrupados.filter(p => pedidoEstaAtrasadoAberto(p.items)).length;
    const pedidosEntreguesAtrasados = pedidosAgrupados.filter(p => pedidoFoiEntregueAtrasado(p.items)).length;

    const prazoMedioPagamento = valorTotal > 0
      ? Math.round(g.items.reduce((s,x) => s + ((x.prazoPagamento || 0) * x.valor), 0) / valorTotal)
      : 0;

    const compradores = [...new Set(g.items.map(x => x.comprador).filter(Boolean))];

    const stats = {
      nome:g.nome,
      codigo:g.codigo,
      itens:g.items,
      linhas:g.items.length,
      pedidosUnicos:pedidos.length,
      valorTotal,
      quantidadeTotal,
      itensPlenos:itensPlenos.length,
      itensParciais:itensParciais.length,
      itensEmAberto:itensEmAberto.length,
      itensAvaliados:resumoNota.validos,
      itensPlenosNoPrazo:resumoNota.tipos.completoPrazo,
      resumoNota,
      pedidosAtrasadosAbertos,
      pedidosEntreguesAtrasados,
      performance,
      atrasoMedioAberto,
      atrasoMedioEntregue,
      prazoMedioPagamento,
      compradores
    };

    stats.categoria = classificarFornecedor(stats);
    stats.estrategico = isFornecedorEstrategico(stats.nome);

    return stats;
  }).sort((a,b) => b.valorTotal - a.valorTotal);
}

async function renderFornecedores(){
  const root = ensureAppElement();
  if(!root) return;

  root.innerHTML = `
    <section class="hero">
      <h1>Performance de Fornecedores</h1>
      <p>Carregando fornecedores a partir da base geral...</p>
    </section>
  `;

  try{
    await ensureGeralData();
    renderFornecedoresView(geralData);
  }catch(error){
    console.error("Erro Performance de Fornecedores:", error);

    root.innerHTML = `
      <section class="hero">
        <h1>Performance de Fornecedores</h1>
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
  const categorias = ["Estratégico", "Alavancável", "Gargalo", "Não crítico"];
  const ordenacoes = [
    "Maior valor",
    "Melhor performance",
    "Pior performance",
    "Mais pedidos em atraso",
    "Mais entregas atrasadas",
    "Mais itens parciais"
  ];

  root.innerHTML = `
    <section class="hero">
      <div>
        <span class="hero-kicker">Gestão de fornecimento</span>
        <h1>Performance de Fornecedores</h1>
        <p>Atendimento completo, entregas parciais, pontualidade e carteira atrasada por fornecedor.</p>
      </div>
      <div class="hero-note">Prazo operacional: previsão inicial + 7 dias</div>
    </section>

    ${renderFilterBar([
      {type:"select", id:"fornAno", label:"Ano", options:anos, size:"compact"},
      {type:"select", id:"fornMesInicial", label:"Mês inicial", options:MESES_FILTRO, size:"medium"},
      {type:"select", id:"fornMesFinal", label:"Mês final", options:MESES_FILTRO, size:"medium"},
      {type:"select", id:"fornComprador", label:"Todos compradores", options:compradores, size:"medium"},
      {type:"text", id:"fornBusca", label:"Fornecedor", placeholder:"Buscar nome ou código", size:"wide"},
      {type:"select", id:"fornCategoria", label:"Todas categorias", options:categorias, size:"wide", advanced:true},
      {type:"select", id:"fornOrdenacao", label:"Ordenar fornecedores", options:ordenacoes, size:"wide", advanced:true}
    ], {clearAction:"limparFiltrosFornecedores()"})}

    ${baseNotaCompleta() ? "" : '<div class="score-warning">Notas preliminares até a substituição do geral.csv pela exportação completa.</div>'}
    <div id="fornecedoresContent"></div>
  `;

  aplicarPeriodoPadrao("forn");

  attachFilterEvents(
    ["fornAno","fornMesInicial","fornMesFinal","fornComprador","fornCategoria","fornOrdenacao"],
    () => renderFornecedoresContent(base)
  );

  const buscaEl = document.getElementById("fornBusca");
  let buscaTimer = null;

  if(buscaEl){
    buscaEl.addEventListener("input", () => {
      clearTimeout(buscaTimer);
      buscaTimer = setTimeout(() => renderFornecedoresContent(base), 180);
    });
  }

  renderFornecedoresContent(base);
}

function filterFornecedoresBase(base){
  const comprador = getFilterValue("fornComprador");

  return base.filter(x => {
    return passaFiltroAnoPeriodo(x, "forn", "previsaoInicialObj") &&
      (!comprador || x.comprador === comprador);
  });
}

function aplicarFiltroFornecedorCategoria(categoria){
  setFilterAndTrigger("fornCategoria", categoria);
}

function limparFiltrosFornecedores(){
  setFilterValue("fornAno", ANO_PADRAO);
  setFilterValue("fornMesInicial", "");
  setFilterValue("fornMesFinal", "");
  setFilterValue("fornComprador", "");
  setFilterValue("fornBusca", "");
  setFilterValue("fornCategoria", "");
  setFilterValue("fornOrdenacao", "");
  triggerFilter("fornAno");
}

function ordenarFornecedores(stats, ordenacao){
  const lista = [...stats];

  if(ordenacao === "Melhor performance"){
    return lista.sort((a,b) => (b.performance ?? -1) - (a.performance ?? -1) || b.valorTotal - a.valorTotal);
  }

  if(ordenacao === "Pior performance"){
    return lista.sort((a,b) => (a.performance ?? 101) - (b.performance ?? 101) || b.valorTotal - a.valorTotal);
  }

  if(ordenacao === "Mais pedidos em atraso"){
    return lista.sort((a,b) => b.pedidosAtrasadosAbertos - a.pedidosAtrasadosAbertos || b.valorTotal - a.valorTotal);
  }

  if(ordenacao === "Mais entregas atrasadas"){
    return lista.sort((a,b) => b.pedidosEntreguesAtrasados - a.pedidosEntreguesAtrasados || b.valorTotal - a.valorTotal);
  }

  if(ordenacao === "Mais itens parciais"){
    return lista.sort((a,b) => b.itensParciais - a.itensParciais || b.valorTotal - a.valorTotal);
  }

  return lista.sort((a,b) => b.valorTotal - a.valorTotal);
}

function renderSegmentacaoFornecedores(stats, categoriaAtiva = ""){
  const categorias = {
    "Estratégico": stats.filter(x => x.categoria === "Estratégico"),
    "Alavancável": stats.filter(x => x.categoria === "Alavancável"),
    "Gargalo": stats.filter(x => x.categoria === "Gargalo"),
    "Não crítico": stats.filter(x => x.categoria === "Não crítico")
  };

  function categoriaCard(titulo, lista, classe, descricao){
    const valor = lista.reduce((s,x) => s + x.valorTotal, 0);
    const ativa = categoriaAtiva === titulo;

    return `
      <button
        type="button"
        class="segment-card ${classe} ${ativa ? "active" : ""}"
        onclick="aplicarFiltroFornecedorCategoria('${jsArg(ativa ? "" : titulo)}')"
      >
        <span class="segment-card-label">${esc(titulo)}</span>
        <strong>${lista.length}</strong>
        <span class="segment-card-value">${moneyCompact(valor)}</span>
        <small>${esc(descricao)}</small>
      </button>
    `;
  }

  return `
    <section class="segment-cards" aria-label="Categorias de fornecedores">
      ${categoriaCard("Estratégico", categorias["Estratégico"], "estrategico", "Essenciais para a operação")}
      ${categoriaCard("Alavancável", categorias["Alavancável"], "alavancavel", "Potencial de negociação")}
      ${categoriaCard("Gargalo", categorias["Gargalo"], "gargalo", "Risco que exige atenção")}
      ${categoriaCard("Não crítico", categorias["Não crítico"], "nao-critico", "Menor impacto ou volume")}
    </section>
  `;
}

function renderFornecedoresContent(base){
  const dataBase = filterFornecedoresBase(base);
  const categoriaFiltro = getFilterValue("fornCategoria");
  const busca = norm(getFilterValue("fornBusca"));
  const ordenacao = getFilterValue("fornOrdenacao") || "Maior valor";

  let statsBase = calcularRankingFornecedores(dataBase);

  if(busca){
    statsBase = statsBase.filter(x => norm(`${x.codigo} ${x.nome}`).includes(busca));
  }

  let stats = [...statsBase];

  if(categoriaFiltro){
    stats = stats.filter(x => x.categoria === categoriaFiltro);
  }

  stats = ordenarFornecedores(stats, ordenacao);

  const totalValor = stats.reduce((s,x) => s + x.valorTotal, 0);
  const totalFornecedores = stats.length;

  const totalItensAvaliados = stats.reduce((s,x) => s + x.itensAvaliados, 0);
  const performanceMedia = resumirNotaEntrega(stats.flatMap(x => x.itens)).nota;

  const totalItensPlenos = stats.reduce((s,x) => s + x.itensPlenos, 0);
  const totalItensParciais = stats.reduce((s,x) => s + x.itensParciais, 0);
  const totalPedidosAtrasados = stats.reduce((s,x) => s + x.pedidosAtrasadosAbertos, 0);
  const totalPedidosEntreguesAtrasados = stats.reduce((s,x) => s + x.pedidosEntreguesAtrasados, 0);

  const topValor = [...stats].sort((a,b) => b.valorTotal - a.valorTotal).slice(0,10);

  const topRisco = stats.filter(x =>
    x.pedidosAtrasadosAbertos > 0 ||
    x.itensParciais > 0 ||
    x.pedidosEntreguesAtrasados > 0 ||
    (x.performance !== null && x.performance < 100)
  ).sort((a,b) =>
    b.pedidosAtrasadosAbertos - a.pedidosAtrasadosAbertos ||
    b.itensParciais - a.itensParciais ||
    (a.performance ?? 101) - (b.performance ?? 101) ||
    b.valorTotal - a.valorTotal
  ).slice(0,10);

  const content = document.getElementById("fornecedoresContent");
  if(!content) return;

  content.innerHTML = `
    <section class="executive-kpis">
      ${executiveKpi("Nota das entregas", performanceFornecedorText(performanceMedia), corPerformanceFornecedor(performanceMedia), "", "prazo + quantidade + atraso")}
      ${executiveKpi("Atrasados em aberto", totalPedidosAtrasados, "red", "", "pedidos ainda pendentes")}
      ${executiveKpi("Entregues com atraso", totalPedidosEntreguesAtrasados, "orange", "", "pedidos já concluídos")}
      ${executiveKpi("Itens parciais", totalItensParciais, "yellow", "", "com saldo em aberto")}
      ${executiveKpi("Valor analisado", moneyCompact(totalValor), "blue", "", "no período filtrado", money(totalValor))}
    </section>

    <section class="supplier-meta-strip">
      ${compactStat("Fornecedores analisados", totalFornecedores, "blue")}
      ${compactStat("Itens plenos", totalItensPlenos, "green")}
      ${compactStat("Itens avaliados", totalItensAvaliados, "blue")}
    </section>
    <p class="score-caption">Nota de 0 a 100: itens com prazo inicial + 7 dias já vencido; 70% por item e 30% por valor. Clique na nota de cada fornecedor para ver a composição.${dataBase.some(x => !x.temControleAtendimento) ? " Histórico antigo sem quantidades: somente entregas concluídas são pontuadas." : ""}</p>

    <div class="section-heading">
      <div>
        <h2>Segmentação de fornecedores</h2>
        <p>Selecione uma categoria para filtrar a lista completa. Clique novamente para exibir todas.</p>
      </div>
    </div>

    ${renderSegmentacaoFornecedores(statsBase, categoriaFiltro)}

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
          const texto = `${x.pedidosAtrasadosAbertos} pedido(s) aberto(s) em atraso`;
          return barLine(x.nome, x.pedidosAtrasadosAbertos, "bar-orange", texto, topRisco[0]?.pedidosAtrasadosAbertos || 1);
        }).join("") : `<div class="empty-state">Sem fornecedores para os filtros selecionados.</div>`}
      </div>
    </section>

    <div class="section-heading table-heading">
      <div>
        <h2>Lista completa de fornecedores</h2>
        <p>${totalFornecedores} fornecedor(es) conforme os filtros selecionados.</p>
      </div>
    </div>

    <section class="table-wrap supplier-table">
      <table>
        <thead>
          <tr>
            <th>Fornecedor</th>
            <th>Categoria</th>
            <th>Valor comprado</th>
            <th>Pedidos</th>
            <th>Performance</th>
            <th>Itens plenos</th>
            <th>Itens parciais</th>
            <th>Itens em aberto</th>
            <th>Pedidos atrasados abertos</th>
            <th>Pedidos entregues atrasados</th>
            <th>Atraso médio aberto</th>
            <th>Atraso médio entregue</th>
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
              <td><details class="supplier-score-detail"><summary class="${corPerformanceFornecedor(x.performance)}" title="${x.itensAvaliados} itens avaliados"><span>${performanceFornecedorText(x.performance)}</span><span class="supplier-score-track"><span style="width:${x.performance ?? 0}%"></span></span></summary><p>${esc(detalheNotaEntrega(x.resumoNota))}</p></details></td>
              <td>${x.itensPlenos}</td>
              <td>${x.itensParciais}</td>
              <td>${x.itensEmAberto}</td>
              <td><b class="${x.pedidosAtrasadosAbertos ? "red" : "green"}">${x.pedidosAtrasadosAbertos}</b></td>
              <td>${x.pedidosEntreguesAtrasados}</td>
              <td>${x.atrasoMedioAberto} dias</td>
              <td>${x.atrasoMedioEntregue} dias</td>
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
   Restaurado com base na lógica antiga correta:
   - Saving Spot = quantidade x diferença unitária
   - Saving Anual = quantidade mensal x diferença unitária x 12
   - Reajuste / Cost Avoidance = diferença entre reajuste solicitado e acordado
========================= */

const SAVING_TABLE = "savings";

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

const STATUS_SAVING_PADRAO = [
  "Homologação em curso",
  "Homologado",
  "Declinado"
];

let savingRegistros = [];

function uidSaving(){
  return "SV" + Date.now() + Math.floor(Math.random() * 9999);
}

function getSavingClient(){
  if(typeof getSupabaseClient === "function"){
    return getSupabaseClient();
  }

  if(typeof supabaseClient !== "undefined"){
    return supabaseClient;
  }

  return null;
}

function valorSV(v){
  return v === null || v === undefined ? "" : v;
}

function limparNumeroSV(valor){
  return String(valor ?? "")
    .replace(/\u00A0/g, " ")
    .replace(/R\$/gi, "")
    .replace(/%/g, "")
    .trim();
}

function numeroSV(valor){
  if(valor === null || valor === undefined || valor === "") return 0;

  if(typeof valor === "number"){
    return Number.isFinite(valor) ? valor : 0;
  }

  let raw = limparNumeroSV(valor);

  if(!raw) return 0;

  raw = raw.replace(/\s/g, "");

  const temVirgula = raw.includes(",");
  const temPonto = raw.includes(".");

  if(temVirgula && temPonto){
    raw = raw.replace(/\./g, "").replace(",", ".");
    return Number(raw) || 0;
  }

  if(temVirgula){
    raw = raw.replace(",", ".");
    return Number(raw) || 0;
  }

  if(temPonto){
    return Number(raw) || 0;
  }

  return Number(raw) || 0;
}

function percentualSV(valor){
  const raw = String(valor ?? "").trim();

  if(!raw) return 0;

  let n = numeroSV(valor);

  if(!Number.isFinite(n)) return 0;

  if(!raw.includes("%") && Math.abs(n) > 0 && Math.abs(n) <= 1){
    n = n * 100;
  }

  return n;
}

function moneySV(value){
  return Number(value || 0).toLocaleString("pt-BR", {
    style:"currency",
    currency:"BRL",
    minimumFractionDigits:2,
    maximumFractionDigits:2
  });
}

function pctSV(value){
  return `${Number(value || 0).toLocaleString("pt-BR", {
    minimumFractionDigits:2,
    maximumFractionDigits:2
  })}%`;
}

function statusAtivoSaving(x){
  return norm(x.status) !== "declinado";
}

function fatorTipoSaving(tipo){
  return norm(tipo) === "spot" ? 1 : 12;
}

function dbToSaving(row){
  return {
    id: valorSV(row.id) || uidSaving(),
    categoria: valorSV(row.categoria) || "Saving",
    tipo: valorSV(row.tipo) || "Spot",
    data: valorSV(row.data),
    comprador: valorSV(row.comprador),
    codigo: valorSV(row.codigo),
    descricao: valorSV(row.descricao),
    fornecedorAtual: valorSV(row.fornecedor_atual),
    status: valorSV(row.status) || "Homologação em curso",
    quantidade: valorSV(row.quantidade),
    precoAtual: valorSV(row.preco_atual),
    competidorA: valorSV(row.competidor_a),
    precoCompetidorA: valorSV(row.preco_competidor_a),
    competidorB: valorSV(row.competidor_b),
    precoCompetidorB: valorSV(row.preco_competidor_b),
    competidorC: valorSV(row.competidor_c),
    precoCompetidorC: valorSV(row.preco_competidor_c),
    reajusteSolicitado: valorSV(row.reajuste_solicitado),
    reajusteAcordado: valorSV(row.reajuste_acordado),
    observacao: valorSV(row.observacao)
  };
}

function savingToDb(r){
  return {
    id: r.id || uidSaving(),
    categoria: r.categoria || "Saving",
    tipo: r.tipo || "Spot",
    data: r.data || "",
    comprador: r.comprador || "",
    codigo: r.codigo || "",
    descricao: r.descricao || "",
    fornecedor_atual: r.fornecedorAtual || "",
    status: r.status || "Homologação em curso",
    quantidade: r.quantidade || "",
    preco_atual: r.precoAtual || "",
    competidor_a: r.competidorA || "",
    preco_competidor_a: r.precoCompetidorA || "",
    competidor_b: r.competidorB || "",
    preco_competidor_b: r.precoCompetidorB || "",
    competidor_c: r.competidorC || "",
    preco_competidor_c: r.precoCompetidorC || "",
    reajuste_solicitado: r.reajusteSolicitado || "",
    reajuste_acordado: r.reajusteAcordado || "",
    observacao: r.observacao || ""
  };
}

async function carregarSavingsLocal(){
  const client = getSavingClient();

  if(client){
    try{
      const { data, error } = await client
        .from(SAVING_TABLE)
        .select("*")
        .order("created_at", { ascending:false });

      if(error){
        throw error;
      }

      savingRegistros = (data || []).map(dbToSaving);
      return savingRegistros;
    }catch(error){
      console.error("Erro ao carregar savings do Supabase:", error);
      savingRegistros = [];
      alert("Erro ao carregar savings do Supabase. Veja o Console com F12.");
      return savingRegistros;
    }
  }

  try{
    if(typeof FILES !== "undefined" && FILES.saving){
      const rows = await loadCSV(FILES.saving, false);

      savingRegistros = rows.map(row => ({
        id: uidSaving(),
        categoria: get(row, ["Categoria"]) || "Saving",
        tipo: get(row, ["Tipo"]) || "Spot",
        data: get(row, ["Data"]),
        comprador: get(row, ["Comprador"]),
        codigo: get(row, ["Código", "Codigo"]),
        descricao: get(row, ["Descrição", "Descricao"]),
        fornecedorAtual: get(row, ["Fornecedor Atual"]),
        status: get(row, ["Status"]) || "Homologação em curso",
        quantidade: get(row, ["Quantidade"]),
        precoAtual: get(row, ["Preço Atual", "Preco Atual"]),
        competidorA: get(row, ["Competidor A"]),
        precoCompetidorA: get(row, ["Preço Competidor A", "Preco Competidor A"]),
        competidorB: get(row, ["Competidor B"]),
        precoCompetidorB: get(row, ["Preço Competidor B", "Preco Competidor B"]),
        competidorC: get(row, ["Competidor C"]),
        precoCompetidorC: get(row, ["Preço Competidor C", "Preco Competidor C"]),
        reajusteSolicitado: get(row, ["Reajuste Solicitado %", "Reajuste Solicitado"]),
        reajusteAcordado: get(row, ["Reajuste Acordado %", "Reajuste Acordado"]),
        observacao: get(row, ["Observação", "Observacao"])
      }));

      return savingRegistros;
    }
  }catch(error){
    console.warn("Não foi possível carregar saving.csv local:", error);
  }

  savingRegistros = [];
  return savingRegistros;
}

async function salvarSavingsLocal(){
  /*
    Mantida apenas por compatibilidade.
    O salvamento real acontece direto no Supabase em:
    salvarRegistroSaving, alterarStatusSaving, excluirSaving e importarSavingCSV.
  */
}

function calcularSavingRegistro(r){
  const categoria = r.categoria || "Saving";
  const tipo = r.tipo || "Spot";

  const quantidade = numeroSV(r.quantidade);
  const precoAtual = numeroSV(r.precoAtual);
  const fator = fatorTipoSaving(tipo);

  if(categoria === "Saving"){
    const competidores = [
      {
        nome:r.competidorA,
        preco:numeroSV(r.precoCompetidorA)
      },
      {
        nome:r.competidorB,
        preco:numeroSV(r.precoCompetidorB)
      },
      {
        nome:r.competidorC,
        preco:numeroSV(r.precoCompetidorC)
      }
    ]
    .filter(x => x.nome && x.preco > 0)
    .sort((a,b) => a.preco - b.preco);

    const vencedor = competidores[0]?.nome || "";
    const precoNegociado = competidores[0]?.preco || 0;

    const savingUnitario = precoAtual - precoNegociado;
    const savingMensal = quantidade * savingUnitario;
    const savingTotal = savingMensal * fator;
    const custoReferencia = quantidade * precoAtual * fator;
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

  const reajusteSolicitado = percentualSV(r.reajusteSolicitado);
  const reajusteAcordado = percentualSV(r.reajusteAcordado);

  const precoSolicitado = precoAtual * (1 + reajusteSolicitado / 100);
  const precoAcordado = precoAtual * (1 + reajusteAcordado / 100);

  const costAvoidanceUnitario = precoSolicitado - precoAcordado;
  const costAvoidanceMensal = quantidade * costAvoidanceUnitario;
  const costAvoidanceTotal = costAvoidanceMensal * fator;
  const custoReferencia = quantidade * precoSolicitado * fator;
  const reducaoPercentual = reajusteSolicitado - reajusteAcordado;

  return {
    ...r,
    vencedor:r.fornecedorAtual,
    precoNegociado:precoAcordado,
    precoSolicitado,
    precoAcordado,
    savingUnitario:0,
    savingMensal:0,
    savingTotal:0,
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
  const root = ensureAppElement ? ensureAppElement() : document.getElementById("app");

  if(!root) return;

  root.innerHTML = `
    <section class="hero">
      <h1>Ranking de Saving</h1>
      <p>Carregando savings do Supabase...</p>
    </section>
  `;

  await carregarSavingsLocal();
  renderSavingView(savingsCalculados());
}

function renderSavingView(base){
  const root = ensureAppElement ? ensureAppElement() : document.getElementById("app");

  if(!root) return;

  const compradores = uniqueOptions(base, "comprador");
  const status = uniqueOptions(base, "status");
  const categorias = uniqueOptions(base, "categoria");

  root.innerHTML = `
    <section class="hero">
      <h1>Ranking de Saving</h1>
      <p>Controle de saving, reajustes e cost avoidance conectado ao Supabase.</p>
    </section>

    <section class="saving-actions">
      <button class="action-btn" onclick="abrirModalSaving('Saving')">+ Novo Saving</button>
      <button class="action-btn" onclick="abrirModalSaving('Reajuste')">+ Novo Reajuste</button>
      <button class="action-btn secondary" onclick="baixarModeloSaving()">Baixar modelo CSV</button>

      <label class="action-btn secondary file-btn">
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
    <div id="savingModal" class="modal-root"></div>
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
    const fullText = norm(`${x.codigo} ${x.descricao} ${x.fornecedorAtual} ${x.vencedor} ${x.comprador} ${x.status} ${x.categoria}`);

    return (!categoria || x.categoria === categoria) &&
      (!comprador || x.comprador === comprador) &&
      (!status || x.status === status) &&
      (!busca || fullText.includes(busca));
  });
}

function renderSavingContent(base){
  const data = filterSaving(base);
  const ativos = data.filter(statusAtivoSaving);

  const homologados = ativos.filter(x => norm(x.status) === "homologado");
  const pipeline = ativos.filter(x => norm(x.status).includes("curso"));

  const savingHomologado = homologados.reduce((s,x) => s + x.savingTotal, 0);
  const savingPipeline = pipeline.reduce((s,x) => s + x.savingTotal, 0);

  const caHomologado = homologados.reduce((s,x) => s + x.costAvoidanceTotal, 0);
  const caPipeline = pipeline.reduce((s,x) => s + x.costAvoidanceTotal, 0);

  const impactoHomologado = savingHomologado + caHomologado;
  const impactoPipeline = savingPipeline + caPipeline;

  const porComprador = Object.values(group(ativos, "comprador"))
    .map(g => ({
      nome:g.nome,
      valor:g.items.reduce((s,x) => s + x.savingTotal + x.costAvoidanceTotal, 0)
    }))
    .sort((a,b) => b.valor - a.valor);

  const maxComprador = Math.max(...porComprador.map(x => Math.abs(x.valor)), 1);
  const maxResumo = Math.max(
    Math.abs(savingHomologado),
    Math.abs(caHomologado),
    Math.abs(impactoHomologado),
    1
  );

  const content = document.getElementById("savingContent");

  if(!content) return;

  content.innerHTML = `
    <section class="kpis">
      ${kpi("Registros", data.length, "blue", "limparFiltrosSaving()")}
      ${kpi("Saving homologado", moneySV(savingHomologado), "green")}
      ${kpi("Saving pipeline", moneySV(savingPipeline), "orange")}
      ${kpi("Cost Avoidance homologado", moneySV(caHomologado), "green")}
      ${kpi("Cost Avoidance pipeline", moneySV(caPipeline), "orange")}
      ${kpi("Impacto homologado", moneySV(impactoHomologado), "blue")}
      ${kpi("Impacto pipeline", moneySV(impactoPipeline), "orange")}
      ${kpi("Declinados", data.filter(x => norm(x.status) === "declinado").length, "red")}
    </section>

    <section class="panel-grid">
      <div class="panel">
        <h2>Impacto por comprador</h2>
        ${
          porComprador.length
          ? porComprador.map(x => barLine(x.nome, Math.abs(x.valor), "bar-blue", moneySV(x.valor), maxComprador)).join("")
          : `<div class="empty-state">Nenhum lançamento ativo para exibir.</div>`
        }
      </div>

      <div class="panel">
        <h2>Resumo homologado</h2>
        ${barLine("Saving", Math.abs(savingHomologado), "bar-green", moneySV(savingHomologado), maxResumo)}
        ${barLine("Cost Avoidance", Math.abs(caHomologado), "bar-orange", moneySV(caHomologado), maxResumo)}
        ${barLine("Impacto total", Math.abs(impactoHomologado), "bar-blue", moneySV(impactoHomologado), maxResumo)}
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
          ${
            data.length
            ? data.map(x => `
              <tr class="${norm(x.status) === "declinado" ? "declined-row" : ""}">
                <td>${esc(x.categoria || "—")}</td>
                <td>${esc(x.tipo || "—")}</td>
                <td>${esc(x.data || "—")}</td>
                <td>${esc(x.comprador || "—")}</td>
                <td>${esc(x.codigo || "—")}</td>
                <td><b>${esc(x.descricao || "—")}</b></td>
                <td>${esc(x.fornecedorAtual || "—")}</td>
                <td>${esc(x.vencedor || "—")}</td>
                <td>
                  <select class="status-select" onchange="alterarStatusSaving('${jsArg ? jsArg(x.id) : x.id}', this.value)">
                    ${STATUS_SAVING_PADRAO.map(s => `
                      <option value="${esc(s)}" ${x.status === s ? "selected" : ""}>${esc(s)}</option>
                    `).join("")}
                  </select>
                </td>
                <td>${esc(x.quantidade || "—")}</td>
                <td>${moneySV(numeroSV(x.precoAtual))}</td>
                <td>${moneySV(x.precoNegociado)}</td>
                <td>${moneySV(x.savingTotal)}</td>
                <td>${moneySV(x.costAvoidanceTotal)}</td>
                <td>${pctSV(x.reducaoPercentual)}</td>
                <td>
                  <button class="mini-btn" onclick="excluirSaving('${jsArg ? jsArg(x.id) : x.id}')">Excluir</button>
                </td>
              </tr>
            `).join("")
            : `
              <tr>
                <td colspan="16">
                  <div class="empty-state">Nenhum saving lançado ainda. Use “+ Novo Saving”, “+ Novo Reajuste” ou importe um CSV.</div>
                </td>
              </tr>
            `
          }
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
  renderSavingContent(savingsCalculados());
}

function abrirModalSaving(categoria){
  const modal = document.getElementById("savingModal");

  if(!modal) return;

  const titulo = categoria === "Saving" ? "Incluir Saving" : "Incluir Reajuste / Cost Avoidance";

  modal.innerHTML = `
    <div class="modal-overlay" onclick="fecharModalSaving(event)">
      <div class="modal-container" onclick="event.stopPropagation()">
        <div class="modal-header">
          <div>
            <h2>${titulo}</h2>
            <p>${categoria === "Saving" ? "Informe os competidores. O menor preço será considerado vencedor automaticamente." : "Informe o reajuste solicitado e o reajuste acordado. O portal calcula o cost avoidance."}</p>
          </div>
          <button class="modal-close" onclick="fecharModalSaving()">×</button>
        </div>

        <div class="modal-body">
          <div class="form-grid">
            <div class="form-group">
              <label>Data</label>
              <input id="svData" placeholder="dd/mm/aaaa">
            </div>

            <div class="form-group">
              <label>Comprador</label>
              <input id="svComprador" placeholder="Nome do comprador">
            </div>

            <div class="form-group">
              <label>Código</label>
              <input id="svCodigo" placeholder="Código do item">
            </div>

            <div class="form-group">
              <label>Descrição</label>
              <input id="svDescricao" placeholder="Descrição do item">
            </div>

            <div class="form-group">
              <label>Fornecedor atual</label>
              <input id="svFornecedorAtual" placeholder="Fornecedor atual">
            </div>

            <div class="form-group">
              <label>Status</label>
              <select id="svStatus">
                ${STATUS_SAVING_PADRAO.map(s => `<option>${esc(s)}</option>`).join("")}
              </select>
            </div>

            <div class="form-group">
              <label>Tipo</label>
              <select id="svTipo">
                <option>Spot</option>
                <option>Anual</option>
              </select>
            </div>

            <div class="form-group">
              <label>Quantidade</label>
              <input id="svQuantidade" placeholder="${categoria === "Saving" ? "Qtd negociada ou média mensal" : "Qtd média mensal"}">
            </div>

            <div class="form-group">
              <label>Preço atual</label>
              <input id="svPrecoAtual" placeholder="Ex.: 10,50">
            </div>

            ${
              categoria === "Saving"
              ? `
                <div class="form-separator">Competidores</div>

                <div class="form-group">
                  <label>Competidor A</label>
                  <input id="svCompetidorA" placeholder="Fornecedor A">
                </div>

                <div class="form-group">
                  <label>Preço Competidor A</label>
                  <input id="svPrecoCompetidorA" placeholder="Ex.: 9,80">
                </div>

                <div class="form-group">
                  <label>Competidor B</label>
                  <input id="svCompetidorB" placeholder="Fornecedor B">
                </div>

                <div class="form-group">
                  <label>Preço Competidor B</label>
                  <input id="svPrecoCompetidorB" placeholder="Ex.: 9,40">
                </div>

                <div class="form-group">
                  <label>Competidor C</label>
                  <input id="svCompetidorC" placeholder="Fornecedor C">
                </div>

                <div class="form-group">
                  <label>Preço Competidor C</label>
                  <input id="svPrecoCompetidorC" placeholder="Ex.: 9,60">
                </div>
              `
              : `
                <div class="form-separator">Reajuste</div>

                <div class="form-group">
                  <label>% Reajuste solicitado</label>
                  <input id="svReajusteSolicitado" placeholder="Ex.: 10">
                </div>

                <div class="form-group">
                  <label>% Reajuste acordado</label>
                  <input id="svReajusteAcordado" placeholder="Ex.: 6">
                </div>
              `
            }

            <div class="form-group full">
              <label>Observação</label>
              <textarea id="svObservacao" placeholder="Observações da negociação"></textarea>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="action-btn secondary" onclick="fecharModalSaving()">Cancelar</button>
          <button class="action-btn" onclick="salvarRegistroSaving('${categoria}')">Salvar lançamento</button>
        </div>
      </div>
    </div>
  `;
}

function fecharModalSaving(event){
  if(event && event.target && !event.target.classList.contains("modal-overlay")) return;

  const modal = document.getElementById("savingModal");

  if(modal) modal.innerHTML = "";
}

async function salvarRegistroSaving(categoria){
  const registro = {
    id:uidSaving(),
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

  const client = getSavingClient();

  if(!client){
    savingRegistros.unshift(registro);
    fecharModalSaving();
    renderSavingContent(savingsCalculados());
    return;
  }

  try{
    const { error } = await client
      .from(SAVING_TABLE)
      .insert([savingToDb(registro)]);

    if(error){
      throw error;
    }

    fecharModalSaving();
    await renderSaving();
  }catch(error){
    console.error("Erro ao salvar saving no Supabase:", error);
    alert("Erro ao salvar no Supabase. Veja o Console com F12.");
  }
}

async function alterarStatusSaving(id, status){
  const client = getSavingClient();

  if(!client){
    const item = savingRegistros.find(x => x.id === id);
    if(item) item.status = status;

    renderSavingContent(savingsCalculados());
    return;
  }

  try{
    const { error } = await client
      .from(SAVING_TABLE)
      .update({ status })
      .eq("id", id);

    if(error){
      throw error;
    }

    const item = savingRegistros.find(x => x.id === id);
    if(item) item.status = status;

    renderSavingContent(savingsCalculados());
  }catch(error){
    console.error("Erro ao alterar status no Supabase:", error);
    alert("Erro ao alterar status no Supabase. Veja o Console com F12.");
  }
}

async function excluirSaving(id){
  if(!confirm("Deseja excluir este lançamento?")) return;

  const client = getSavingClient();

  if(!client){
    savingRegistros = savingRegistros.filter(x => x.id !== id);
    renderSavingContent(savingsCalculados());
    return;
  }

  try{
    const { error } = await client
      .from(SAVING_TABLE)
      .delete()
      .eq("id", id);

    if(error){
      throw error;
    }

    savingRegistros = savingRegistros.filter(x => x.id !== id);
    renderSavingContent(savingsCalculados());
  }catch(error){
    console.error("Erro ao excluir saving no Supabase:", error);
    alert("Erro ao excluir no Supabase. Veja o Console com F12.");
  }
}

async function importarSavingCSV(event){
  const file = event?.target?.files?.[0];

  if(!file) return;

  const reader = new FileReader();

  reader.onload = async e => {
    try{
      const rows = parseCSV(e.target.result);

      if(rows.length <= 1){
        alert("CSV vazio ou sem dados.");
        return;
      }

      const headers = rows[0].map(h => String(h || "").trim().replace(/^\uFEFF/, ""));

      const novos = rows.slice(1)
        .filter(row => row.some(cell => String(cell || "").trim()))
        .map(row => {
          const obj = {};

          headers.forEach((h,i) => {
            obj[h] = row[i] || "";
          });

          return {
            id:uidSaving(),
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

      if(!novos.length){
        alert("Nenhum registro válido encontrado no CSV.");
        return;
      }

      const client = getSavingClient();

      if(client){
        const payload = novos.map(savingToDb);

        const { error } = await client
          .from(SAVING_TABLE)
          .insert(payload);

        if(error){
          throw error;
        }

        await renderSaving();
      }else{
        savingRegistros = [...novos, ...savingRegistros];
        renderSavingContent(savingsCalculados());
      }
    }catch(error){
      console.error("Erro ao importar CSV para o Supabase:", error);
      alert("Erro ao importar CSV para o Supabase. Veja o Console com F12.");
    }finally{
      event.target.value = "";
    }
  };

  reader.readAsText(file, "UTF-8");
}

function exportarSavingCSV(){
  const linhas = savingRegistros.map(r => [
    r.categoria,
    r.tipo,
    r.data,
    r.comprador,
    r.codigo,
    r.descricao,
    r.fornecedorAtual,
    r.status,
    r.quantidade,
    r.precoAtual,
    r.competidorA,
    r.precoCompetidorA,
    r.competidorB,
    r.precoCompetidorB,
    r.competidorC,
    r.precoCompetidorC,
    r.reajusteSolicitado,
    r.reajusteAcordado,
    r.observacao
  ]);

  const csv = [SAVING_HEADERS_PADRAO, ...linhas]
    .map(row => row.map(v => `"${String(v || "").replace(/"/g,'""')}"`).join(";"))
    .join("\n");

  const blob = new Blob(["\uFEFF" + csv], {type:"text/csv;charset=utf-8;"});
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "savings-consolidado.csv";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  URL.revokeObjectURL(url);
}

function baixarModeloSaving(){
  const exemplo = [
    [
      "Saving",
      "Spot",
      "01/07/2026",
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
      "Exemplo Spot: não multiplica por 12"
    ],
    [
      "Saving",
      "Anual",
      "01/07/2026",
      "Gibson",
      "202109",
      "Mancal Varão PT - Sup Central - Nylon",
      "Fornecedor Atual",
      "Homologado",
      "586",
      "1,50",
      "Competidor A",
      "1,20",
      "",
      "",
      "",
      "",
      "",
      "",
      "Exemplo Anual: quantidade mensal x 12"
    ],
    [
      "Reajuste",
      "Anual",
      "01/07/2026",
      "Gibson",
      "999999",
      "Item com reajuste negociado",
      "Fornecedor Atual",
      "Homologado",
      "100",
      "10,00",
      "",
      "",
      "",
      "",
      "",
      "",
      "12",
      "8",
      "Exemplo Reajuste: calcula cost avoidance"
    ]
  ];

  const csv = [SAVING_HEADERS_PADRAO, ...exemplo]
    .map(row => row.map(v => `"${String(v || "").replace(/"/g,'""')}"`).join(";"))
    .join("\n");

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

window.renderSaving = renderSaving;
window.abrirModalSaving = abrirModalSaving;
window.fecharModalSaving = fecharModalSaving;
window.salvarRegistroSaving = salvarRegistroSaving;
window.alterarStatusSaving = alterarStatusSaving;
window.excluirSaving = excluirSaving;
window.importarSavingCSV = importarSavingCSV;
window.exportarSavingCSV = exportarSavingCSV;
window.baixarModeloSaving = baixarModeloSaving;
window.limparFiltrosSaving = limparFiltrosSaving;
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
    t === "performance de fornecedores" ||
    t.includes("performance de fornecedor") ||
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
  window.aplicarFiltroGeralAtendimento = aplicarFiltroGeralAtendimento;
  window.aplicarFiltroGeralMes = aplicarFiltroGeralMes;
  window.limparFiltrosGeral = limparFiltrosGeral;
  window.irParaPaginaGeral = irParaPaginaGeral;

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

const FILES = {
  geral: "./data/geral.csv",
  fornecedores: "./data/fornecedores.csv",
  saving: "./data/saving.csv"
};

let geralData = [];
let fornecedoresData = [];

const app = document.getElementById("app");

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

function parsePerf(text){
  const value = String(text || "").replace("%","").trim();
  if(value === "") return null;
  const number = Number(value.replace(",","."));
  return Number.isFinite(number) ? number : null;
}

function parseCSV(text){
  const delimiter = text.split("\n")[0].includes(";") ? ";" : ",";
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for(let i=0;i<text.length;i++){
    const char = text[i];
    const next = text[i+1];

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

async function loadCSV(path){
  const response = await fetch(path);
  if(!response.ok) throw new Error(`Erro ao carregar ${path}`);
  const text = await response.text();
  const rows = parseCSV(text);
  const headers = rows[0].map(h => h.trim().replace(/^\uFEFF/, ""));

  return rows.slice(1).map(row => {
    const obj = {};
    headers.forEach((h,i) => obj[h] = row[i] || "");
    return obj;
  });
}

function get(obj,names){
  const keys = Object.keys(obj);
  for(const name of names){
    const found = keys.find(k => norm(k) === norm(name));
    if(found) return obj[found];
  }
  return "";
}

function faixaClass(faixa){
  const f = norm(faixa);
  if(f.includes("atrasado")) return "badge-red";
  if(f.includes("critico")) return "badge-orange";
  if(f.includes("alerta")) return "badge-yellow";
  if(f.includes("dentro")) return "badge-green";
  if(f.includes("entregue")) return "badge-blue";
  return "badge-gray";
}

function statusFornecedorClass(status){
  const s = norm(status);
  if(s === "estrategico") return "estrategico";
  if(s === "alavancavel") return "alavancavel";
  if(s === "gargalo") return "gargalo";
  return "nao-critico";
}

function renderHome(){
  app.innerHTML = `
    <section class="hero">
      <h1>Portal Performance de Compras</h1>
      <p>Central executiva Linshalm para acompanhamento de pedidos, fornecedores, performance e saving.</p>

      <div class="grid-menu">
        <div class="menu-card" onclick="goPage('geral')">
          <h2>Dashboard Geral</h2>
          <p>Acompanhe atrasados, críticos, alertas, pedidos em aberto, entregas, performance e total comprado.</p>
        </div>

        <div class="menu-card" onclick="goPage('fornecedores')">
          <h2>Ranking Fornecedores</h2>
          <p>Matriz Kraljic com classificação estratégica, comprador, performance e plano de ação.</p>
        </div>

        <div class="menu-card" onclick="goPage('saving')">
          <h2>Ranking Saving</h2>
          <p>Módulo reservado para ranking de saving, negociações e evolução de ganhos.</p>
        </div>
      </div>
    </section>
  `;
}

async function renderGeral(){
  app.innerHTML = `<section class="hero"><h1>Dashboard Geral</h1><p>Carregando base geral...</p></section>`;

  if(!geralData.length){
    geralData = await loadCSV(FILES.geral);
  }

  const data = geralData.map(r => ({
    pedido: get(r,["Pedido"]),
    fornecedor: get(r,["Descrição Fornecedor","Fornecedor"]),
    comprador: get(r,["Nome Comprador","Comprador"]),
    faixa: get(r,["Faixa de risco"]),
    valor: numberBR(get(r,["Valor total do pedido","Valor total"," Valor total "])),
    atraso: numberBR(get(r,["Entregas com atraso"])),
    dataRecebimento: get(r,["Data Recebimentos"]),
    entradaPrevista: get(r,["Entrada prevista"]),
    prazoPagamento: numberBR(get(r,["média de dias","Média de dias"]))
  }));

  const count = f => data.filter(x => norm(x.faixa) === norm(f)).length;

  const atrasados = count("Atrasado");
  const criticos = count("Crítico");
  const alerta = count("Alerta");
  const dentro = count("Dentro do prazo");
  const entregues = count("Entregue");
  const totalComprado = data.reduce((s,x) => s + x.valor, 0);

  const entreguesData = data.filter(x => norm(x.faixa) === "entregue");
  const entreguesNoPrazo = entreguesData.filter(x => x.atraso <= 0).length;
  const perfEntrega = entreguesData.length ? Math.round((entreguesNoPrazo / entreguesData.length) * 100) : 0;

  const prazos = data.map(x => x.prazoPagamento).filter(x => x > 0);
  const prazoMedio = prazos.length ? Math.round(prazos.reduce((a,b)=>a+b,0) / prazos.length) : 0;

  const porComprador = group(data,"comprador");
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
      nome:g.nome,
      perf: entregues.length ? Math.round((ok / entregues.length) * 100) : 0
    };
  }).sort((a,b)=>b.perf-a.perf);

  const topFornecedores = Object.values(group(data,"fornecedor"))
    .map(g => ({nome:g.nome, valor:g.items.reduce((s,x)=>s+x.valor,0)}))
    .sort((a,b)=>b.valor-a.valor)
    .slice(0,5);

  const rankingCompras = Object.values(porComprador)
    .map(g => ({nome:g.nome, valor:g.items.reduce((s,x)=>s+x.valor,0)}))
    .sort((a,b)=>b.valor-a.valor);

  app.innerHTML = `
    <section class="hero">
      <h1>Dashboard Geral</h1>
      <p>Base carregada com ${data.length} registros. Indicadores calculados diretamente do CSV geral.</p>
    </section>

    <section class="kpis">
      ${kpi("Atrasados", atrasados, "red")}
      ${kpi("Crítico", criticos, "orange")}
      ${kpi("Alerta", alerta, "yellow")}
      ${kpi("Dentro do prazo", dentro, "green")}
      ${kpi("Entregues", entregues, "blue")}
      ${kpi("Total comprado", money(totalComprado), "blue")}
      ${kpi("Prazo médio", `${prazoMedio} dias`, "blue")}
      ${kpi("Entregues no prazo", `${perfEntrega}%`, "green")}
    </section>

    <section class="panel-grid">
      <div class="panel">
        <h2>Pedidos em aberto</h2>
        ${barList(porFaixa, Math.max(...porFaixa.map(x=>x[1]),1))}
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
          ${data.slice(0,800).map(x => `
            <tr>
              <td>${x.pedido}</td>
              <td><b>${x.fornecedor}</b></td>
              <td>${x.comprador}</td>
              <td>${money(x.valor)}</td>
              <td><span class="badge ${faixaClass(x.faixa)}">${x.faixa}</span></td>
              <td>${x.atraso}</td>
              <td>${x.entradaPrevista}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </section>
  `;
}

async function renderFornecedores(){
  app.innerHTML = `<section class="hero"><h1>Ranking Fornecedores</h1><p>Carregando matriz Kraljic...</p></section>`;

  if(!fornecedoresData.length){
    fornecedoresData = await loadCSV(FILES.fornecedores);
  }

  const data = fornecedoresData.map(r => ({
    fornecedor: get(r,["Descrição Fornecedor","Fornecedor"]),
    valor: numberBR(get(r,["Valor total","Valor"])),
    classificacao: Number(get(r,["Classificação","Ranking"])) || 0,
    comprador: get(r,["Comprador"]),
    plano: get(r,["Plano de ação","Plano"]),
    performance: parsePerf(get(r,["Performance de entrega","Performance"])),
    situacao: get(r,["Situação","Situacao"])
  })).filter(x => x.fornecedor);

  const situacoes = ["Estratégico","Alavancável","Gargalo","Não crítico"];
  const total = data.reduce((s,x)=>s+x.valor,0);

  app.innerHTML = `
    <section class="hero">
      <h1>Ranking de Fornecedores / Matriz Kraljic</h1>
      <p>${data.length} fornecedores analisados • ${money(total)} em valor total.</p>
    </section>

    <section class="kpis">
      ${kpi("Fornecedores", data.length, "blue")}
      ${kpi("Valor total", money(total), "blue")}
      ${kpi("Estratégicos", data.filter(x=>x.situacao==="Estratégico").length, "green")}
      ${kpi("Alavancáveis", data.filter(x=>x.situacao==="Alavancável").length, "blue")}
      ${kpi("Gargalos", data.filter(x=>x.situacao==="Gargalo").length, "red")}
      ${kpi("Não críticos", data.filter(x=>x.situacao==="Não crítico").length, "orange")}
      ${kpi("Com plano", data.filter(x=>x.plano).length, "yellow")}
      ${kpi("Sem medição", data.filter(x=>x.performance===null).length, "orange")}
    </section>

    <section class="matrix">
      ${situacoes.map(s => {
        const group = data.filter(x => x.situacao === s);
        const value = group.reduce((sum,x)=>sum+x.valor,0);

        return `
          <div class="quad ${statusFornecedorClass(s)}">
            <h2>${s}</h2>
            <div class="quad-meta">${group.length} fornecedores • ${money(value)}</div>

            <div class="supplier-grid">
              ${group.map(x => `
                <div class="supplier">
                  <h3>${x.classificacao}. ${x.fornecedor}</h3>
                  <div class="row"><span>${x.comprador}</span><b>${money(x.valor)}</b></div>
                  <div class="row"><span>Entrega</span><span>${x.performance === null ? "Sem medição" : x.performance + "%"}</span></div>
                  ${x.plano ? `<div class="row yellow"><b>${x.plano}</b></div>` : ""}
                </div>
              `).join("")}
            </div>
          </div>
        `;
      }).join("")}
    </section>
  `;
}

function renderSaving(){
  app.innerHTML = `
    <section class="hero">
      <h1>Ranking de Saving</h1>
      <p>Módulo reservado para a próxima etapa.</p>
    </section>

    <div class="notice">
      Assim que a base de saving estiver pronta, subiremos o arquivo como <b>data/saving.csv</b> e criaremos este painel com:
      <br><br>
      • saving por comprador;<br>
      • saving por fornecedor;<br>
      • percentual negociado;<br>
      • ranking mensal;<br>
      • evolução acumulada;<br>
      • impacto financeiro por carteira.
    </div>
  `;
}

function kpi(label,value,color){
  return `
    <div class="kpi">
      <small>${label}</small>
      <strong class="${color}">${value}</strong>
    </div>
  `;
}

function group(data,key){
  const map = {};
  data.forEach(item => {
    const nome = item[key] || "Não informado";
    if(!map[nome]) map[nome] = {nome,items:[]};
    map[nome].items.push(item);
  });
  return map;
}

function barList(items,max){
  return items.map(([label,value,cls]) => barLine(label,value,cls,value,max)).join("");
}

function barLine(label,value,cls,text,max){
  const width = Math.max(2,(value / max) * 100);

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

function goPage(page){
  document.querySelectorAll(".nav-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.page === page);
  });

  if(page === "home") renderHome();
  if(page === "geral") renderGeral();
  if(page === "fornecedores") renderFornecedores();
  if(page === "saving") renderSaving();
}

document.querySelectorAll(".nav-btn").forEach(btn => {
  btn.addEventListener("click", () => goPage(btn.dataset.page));
});

renderHome();
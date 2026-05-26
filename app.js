const CSV_URL = "./fornecedores.csv";

let suppliers = [];

const situacoes = ["Estratégico", "Alavancável", "Gargalo", "Não crítico"];

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

function parseMoney(text){
  const clean = String(text || "")
    .replace("R$","")
    .replace(/\./g,"")
    .replace(",",".")
    .replace(/[^\d.-]/g,"")
    .trim();

  return Number(clean) || 0;
}

function parsePerformance(text){
  const value = String(text || "").replace("%","").trim();

  if(value === "") return null;

  const number = Number(value.replace(",","."));

  return Number.isFinite(number) ? number : null;
}

function parseCSV(text){
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
    } else if(char === ";" && !inQuotes){
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

  return rows;
}

function getValue(obj, possibleNames){
  const keys = Object.keys(obj);

  for(const name of possibleNames){
    const found = keys.find(k => norm(k) === norm(name));

    if(found) return obj[found];
  }

  return "";
}

function statusClass(status){
  const s = norm(status);

  if(s === "estrategico") return "estrategico";
  if(s === "alavancavel") return "alavancavel";
  if(s === "gargalo") return "gargalo";

  return "nao-critico";
}

function perfClass(perf){
  if(perf === null) return "sem";
  if(perf >= 85) return "ok";
  if(perf >= 70) return "alerta";

  return "critica";
}

function perfText(perf){
  return perf === null ? "Sem medição" : `${perf}%`;
}

function passPerfFilter(filter, perf){
  if(!filter) return true;
  if(filter === "sem") return perf === null;
  if(perf === null) return false;
  if(filter === "boa") return perf >= 85;
  if(filter === "alerta") return perf >= 70 && perf < 85;
  if(filter === "critica") return perf < 70;

  return true;
}

async function loadData(){
  const status = document.getElementById("status");

  try{
    const response = await fetch(CSV_URL);

    if(!response.ok){
      throw new Error(`Erro HTTP ${response.status}`);
    }

    const text = await response.text();

    const rows = parseCSV(text)
      .filter(row => row.some(cell => String(cell).trim() !== ""));

    if(rows.length <= 1){
      throw new Error("CSV sem dados ou sem linhas suficientes.");
    }

    const headers = rows[0].map(header => header.trim());

    suppliers = rows.slice(1).map(row => {
      const obj = {};

      headers.forEach((header, index) => {
        obj[header] = row[index] || "";
      });

      return {
        fornecedor: String(getValue(obj, ["Descrição Fornecedor", "Fornecedor"])).trim(),
        valor: parseMoney(getValue(obj, ["Valor total", "Valor"])),
        classificacao: Number(getValue(obj, ["Classificação", "Ranking"])) || 0,
        comprador: String(getValue(obj, ["Comprador", "Responsável"])).trim(),
        plano: String(getValue(obj, ["Plano de ação", "Plano"])).trim(),
        performance: parsePerformance(getValue(obj, ["Performance de entrega", "Performance"])),
        situacao: String(getValue(obj, ["Situação", "Situacao"])).trim()
      };
    }).filter(item => item.fornecedor);

    populateFilters();
    render();

    status.textContent = `Dados carregados com sucesso: ${suppliers.length} fornecedores.`;
  } catch(error){
    console.error("Erro real ao carregar CSV:", error);
    status.textContent = "Erro ao carregar dados. Veja o Console com F12.";
  }
}

function populateFilters(){
  const buyers = [...new Set(suppliers.map(item => item.comprador).filter(Boolean))].sort();

  document.getElementById("buyerFilter").innerHTML =
    `<option value="">Todos compradores</option>` +
    buyers.map(buyer => `<option value="${buyer}">${buyer}</option>`).join("");

  document.getElementById("statusFilter").innerHTML =
    `<option value="">Todas situações</option>` +
    situacoes.map(status => `<option value="${status}">${status}</option>`).join("");
}

function getFiltered(){
  const search = norm(document.getElementById("search").value);
  const buyer = document.getElementById("buyerFilter").value;
  const status = document.getElementById("statusFilter").value;
  const perf = document.getElementById("perfFilter").value;
  const action = document.getElementById("actionFilter").value;

  return suppliers.filter(item => {
    const fullText = norm(`${item.fornecedor} ${item.comprador} ${item.plano} ${item.situacao}`);

    return (!search || fullText.includes(search)) &&
      (!buyer || item.comprador === buyer) &&
      (!status || item.situacao === status) &&
      passPerfFilter(perf, item.performance) &&
      (!action || (action === "sim" ? !!item.plano : !item.plano));
  }).sort((a,b) => a.classificacao - b.classificacao);
}

function renderKPIs(data){
  const total = data.reduce((sum, item) => sum + item.valor, 0);
  const measured = data.filter(item => item.performance !== null);

  const avgPerf = measured.length
    ? Math.round(measured.reduce((sum, item) => sum + item.performance, 0) / measured.length)
    : null;

  const criticalPerf = data.filter(item => item.performance !== null && item.performance < 70).length;

  const cards = [
    ["Fornecedores", data.length],
    ["Valor total", money(total)],
    ["Performance média", avgPerf === null ? "—" : `${avgPerf}%`],
    ["Estratégicos", data.filter(item => item.situacao === "Estratégico").length],
    ["Alavancáveis", data.filter(item => item.situacao === "Alavancável").length],
    ["Gargalos", data.filter(item => item.situacao === "Gargalo").length],
    ["Não críticos", data.filter(item => item.situacao === "Não crítico").length],
    ["Perf. crítica", criticalPerf]
  ];

  document.getElementById("kpis").innerHTML = cards.map(([label, value]) => `
    <div class="card">
      <small>${label}</small>
      <strong>${value}</strong>
    </div>
  `).join("");
}

function renderInsights(data){
  const critical = data
    .filter(item => item.performance !== null && item.performance < 70)
    .sort((a,b) => a.performance - b.performance)
    .slice(0,5);

  const topValue = [...data]
    .sort((a,b) => b.valor - a.valor)
    .slice(0,5);

  const actionPlans = data.filter(item => item.plano).length;

  document.getElementById("insights").innerHTML = `
    <div class="card">
      <strong>Fornecedores com maior risco de entrega</strong><br><br>
      ${critical.length ? critical.map(item => `${item.fornecedor} — ${item.performance}%`).join("<br>") : "Nenhum fornecedor crítico no filtro atual."}
    </div>

    <div class="card">
      <strong>Maior exposição financeira</strong><br><br>
      ${topValue.map(item => `${item.fornecedor} — ${money(item.valor)}`).join("<br>")}
    </div>

    <div class="card">
      <strong>Leitura executiva</strong><br><br>
      Base atual com ${data.length} fornecedores, ${data.filter(item => item.situacao === "Gargalo").length} gargalos e ${actionPlans} planos de ação.
      Priorizar fornecedores com baixa performance em itens de alto impacto financeiro ou operacional.
    </div>
  `;
}

function renderMatrix(data){
  document.getElementById("matrix").innerHTML = situacoes.map(status => {
    const group = data.filter(item => item.situacao === status);
    const total = group.reduce((sum, item) => sum + item.valor, 0);

    return `
      <div class="quad ${statusClass(status)}">
        <h2>${status}</h2>
        <div class="quad-meta">${group.length} fornecedores • ${money(total)}</div>

        <div class="supplier-grid">
          ${group.map(item => `
            <div class="supplier">
              <h3>${item.classificacao || ""}. ${item.fornecedor}</h3>
              <div class="row"><span>${item.comprador || "—"}</span><b>${money(item.valor)}</b></div>
              <div class="row"><span>Entrega</span><span class="${perfClass(item.performance)}">${perfText(item.performance)}</span></div>
              ${item.plano ? `<div class="plan">${item.plano}</div>` : ""}
            </div>
          `).join("")}
        </div>
      </div>
    `;
  }).join("");
}

function renderTable(data){
  document.getElementById("tableBody").innerHTML = data.map(item => `
    <tr>
      <td>${item.classificacao || ""}</td>
      <td><b>${item.fornecedor}</b></td>
      <td>${item.comprador || "—"}</td>
      <td><b>${money(item.valor)}</b></td>
      <td class="${perfClass(item.performance)}">${perfText(item.performance)}</td>
      <td><span class="badge b-${statusClass(item.situacao)}">${item.situacao || "—"}</span></td>
      <td>${item.plano || "—"}</td>
    </tr>
  `).join("");
}

function groupByBuyer(data){
  const map = {};

  data.forEach(item => {
    const buyer = item.comprador || "Sem comprador";

    if(!map[buyer]){
      map[buyer] = {
        buyer,
        count: 0,
        value: 0
      };
    }

    map[buyer].count++;
    map[buyer].value += item.valor;
  });

  return Object.values(map);
}

function renderBars(data){
  const grouped = groupByBuyer(data);

  const valueGroup = [...grouped].sort((a,b) => b.value - a.value);
  const countGroup = [...grouped].sort((a,b) => b.count - a.count);

  const maxValue = Math.max(...valueGroup.map(item => item.value), 1);
  const maxCount = Math.max(...countGroup.map(item => item.count), 1);

  document.getElementById("valueByBuyer").innerHTML = valueGroup.map(item => `
    <div class="bar-line">
      <span>${item.buyer}</span>
      <div class="bar-bg">
        <div class="bar" style="width:${(item.value / maxValue) * 100}%"></div>
      </div>
      <b>${money(item.value)}</b>
    </div>
  `).join("");

  document.getElementById("countByBuyer").innerHTML = countGroup.map(item => `
    <div class="bar-line">
      <span>${item.buyer}</span>
      <div class="bar-bg">
        <div class="bar" style="width:${(item.count / maxCount) * 100}%"></div>
      </div>
      <b>${item.count} forn.</b>
    </div>
  `).join("");
}

function render(){
  const data = getFiltered();

  renderKPIs(data);
  renderInsights(data);
  renderMatrix(data);
  renderBars(data);
  renderTable(data);
}

["search","buyerFilter","statusFilter","perfFilter","actionFilter"].forEach(id => {
  document.addEventListener("input", event => {
    if(event.target && event.target.id === id){
      render();
    }
  });

  document.addEventListener("change", event => {
    if(event.target && event.target.id === id){
      render();
    }
  });
});

loadData();
const STORAGE_KEY = "historico";

const form = document.getElementById("searchForm");
const tipo = document.getElementById("tipoConsulta");
const input = document.getElementById("inputBusca");
const resultArea = document.getElementById("resultArea");
const historyArea = document.getElementById("historyArea");
const message = document.getElementById("message");

function getIcon(type) {
  if (type === "cep") return '<i class="fa-solid fa-location-dot"></i>';
  if (type === "cnpj") return '<i class="fa-solid fa-building"></i>';
  return '<i class="fa-solid fa-building-columns"></i>';
}

function getHistory() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
}

function saveHistory(item) {
  const history = getHistory();

  const index = history.findIndex(h => h.type === item.type && h.search === item.search);

  if (index !== -1) {
    history.splice(index, 1);
  }

  history.unshift(item);

  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  renderHistory();
}

function renderHistory() {
  const history = getHistory();

  if (!history.length) {
    historyArea.innerHTML = "Sem histórico";
    return;
  }

  historyArea.innerHTML = `
    <table>
      <tr>
        <th>Tipo</th>
        <th>Busca</th>
        <th>Ação</th>
      </tr>

      ${history.map(item => `
        <tr>
          <td>${item.type}</td>
          <td>${item.search}</td>
          <td>
            <button onclick="deleteItem(${item.id})">
              <i class="fa-solid fa-trash"></i>
            </button>
          </td>
        </tr>
      `).join("")}
    </table>
  `;
}

function deleteItem(id) {
  const filtered = getHistory().filter(item => item.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  renderHistory();
}

function clearHistory() {
  localStorage.removeItem(STORAGE_KEY);
  renderHistory();
}

document.getElementById("clearHistory").onclick = clearHistory;

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const type = tipo.value;
  const value = input.value.replace(/\D/g, "");

  let url = "";

  if (type === "cep") url = `https://brasilapi.com.br/api/cep/v1/${value}`;
  if (type === "cnpj") url = `https://brasilapi.com.br/api/cnpj/v1/${value}`;
  if (type === "bancos") url = `https://brasilapi.com.br/api/banks/v1`;

  const res = await fetch(url);
  const data = await res.json();

  resultArea.innerHTML = `
    <h2>${getIcon(type)} Resultado</h2>
    <pre>${JSON.stringify(data, null, 2)}</pre>
  `;

  saveHistory({
    id: Date.now(),
    type,
    search: value,
    data
  });
});

renderHistory();

const STORAGE_KEY = 'brasilExplorerHistorico';

    const form = document.getElementById('searchForm');
    const tipoConsulta = document.getElementById('tipoConsulta');
    const inputBusca = document.getElementById('inputBusca');
    const message = document.getElementById('message');
    const resultArea = document.getElementById('resultArea');
    const historyArea = document.getElementById('historyArea');
    const clearResultsButton = document.getElementById('clearResults');
    const clearHistoryButton = document.getElementById('clearHistory');

    /**
     * Atualiza o placeholder do campo com base no tipo de consulta.
     * @returns {void}
     */
    function updatePlaceholder() {
      const type = tipoConsulta.value;

      if (type === 'cep') {
        inputBusca.placeholder = 'Ex.: 01001000';
        inputBusca.disabled = false;
        inputBusca.value = '';
      } else if (type === 'cnpj') {
        inputBusca.placeholder = 'Ex.: 27865757000102';
        inputBusca.disabled = false;
        inputBusca.value = '';
      } else {
        inputBusca.placeholder = 'Consulta automática da lista de bancos';
        inputBusca.disabled = true;
        inputBusca.value = 'listar';
      }
    }

    /**
     * Exibe mensagem de sucesso ou erro na interface.
     * @param {string} text - Texto da mensagem.
     * @param {'success'|'error'} type - Tipo visual da mensagem.
     * @returns {void}
     */
    function showMessage(text, type) {
      message.textContent = text;
      message.className = `message ${type}`;
    }

    /**
     * Limpa a mensagem atual.
     * @returns {void}
     */
    function clearMessage() {
      message.textContent = '';
      message.className = 'message';
    }

    /**
     * Remove caracteres não numéricos de uma string.
     * @param {string} value - Valor informado pelo usuário.
     * @returns {string} Valor contendo apenas números.
     */
    function onlyNumbers(value) {
      return value.replace(/\D/g, '');
    }

    /**
     * Valida a entrada de acordo com o tipo escolhido.
     * @param {string} type - Tipo de consulta.
     * @param {string} value - Valor digitado.
     * @returns {{valid: boolean, message: string}} Resultado da validação.
     */
    function validateInput(type, value) {
      if (type === 'bancos') {
        return { valid: true, message: '' };
      }

      if (!value.trim()) {
        return { valid: false, message: 'Preencha o campo antes de buscar.' };
      }

      const cleanValue = onlyNumbers(value);

      if (type === 'cep' && cleanValue.length !== 8) {
        return { valid: false, message: 'O CEP deve conter exatamente 8 números.' };
      }

      if (type === 'cnpj' && cleanValue.length !== 14) {
        return { valid: false, message: 'O CNPJ deve conter exatamente 14 números.' };
      }

      return { valid: true, message: '' };
    }

    /**
     * Monta a URL da API conforme o tipo e o valor informado.
     * @param {string} type - Tipo de consulta.
     * @param {string} value - Valor digitado.
     * @returns {string} URL da requisição.
     */
    function buildApiUrl(type, value) {
      const cleanValue = onlyNumbers(value);

      if (type === 'cep') return `https://brasilapi.com.br/api/cep/v1/${cleanValue}`;
      if (type === 'cnpj') return `https://brasilapi.com.br/api/cnpj/v1/${cleanValue}`;
      return 'https://brasilapi.com.br/api/banks/v1';
    }

    /**
     * Salva um item no histórico no localStorage.
     * @param {object} item - Item a ser armazenado.
     * @returns {void}
     */
    function saveToHistory(item) {
      const history = getHistory();
      history.unshift(item);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
      renderHistory();
    }

    /**
     * Lê o histórico salvo no localStorage.
     * @returns {Array<object>} Lista de itens salvos.
     */
    function getHistory() {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    }

    /**
     * Remove um item do histórico pelo id.
     * @param {number} id - Identificador do item.
     * @returns {void}
     */
    function deleteHistoryItem(id) {
      const filtered = getHistory().filter(item => item.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
      renderHistory();
    }

    /**
     * Limpa todo o histórico salvo.
     * @returns {void}
     */
    function clearHistory() {
      localStorage.removeItem(STORAGE_KEY);
      renderHistory();
      showMessage('Histórico removido com sucesso.', 'success');
    }

    /**
     * Cria um cartão visual para exibir atributos principais do resultado.
     * @param {Array<{label: string, value: string}>} items - Lista de atributos.
     * @returns {string} HTML do cartão.
     */
    function createResultCards(items) {
      return `
        <div class="result-grid">
          ${items.map(item => `
            <div class="result-item">
              <strong>${item.label}</strong>
              <span>${item.value || 'Não informado'}</span>
            </div>
          `).join('')}
        </div>
      `;
    }

    /**
     * Renderiza o resultado atual na tela.
     * @param {string} type - Tipo da consulta.
     * @param {object|Array<object>} data - Dados retornados pela API.
     * @returns {void}
     */
    function renderResult(type, data) {
      if (type === 'cep') {
        const items = [
          { label: 'CEP', value: data.cep },
          { label: 'Rua', value: data.street },
          { label: 'Bairro', value: data.neighborhood },
          { label: 'Cidade', value: data.city },
          { label: 'Estado', value: data.state },
          { label: 'Serviço', value: data.service }
        ];
        resultArea.innerHTML = `<h2>Resultado da consulta de CEP</h2>${createResultCards(items)}`;
        return;
      }

      if (type === 'cnpj') {
        const items = [
          { label: 'Razão Social', value: data.razao_social },
          { label: 'Nome Fantasia', value: data.nome_fantasia },
          { label: 'CNPJ', value: data.cnpj },
          { label: 'Situação Cadastral', value: data.descricao_situacao_cadastral },
          { label: 'Município', value: data.municipio },
          { label: 'UF', value: data.uf },
          { label: 'CEP', value: data.cep },
          { label: 'Porte', value: data.porte }
        ];
        resultArea.innerHTML = `<h2>Resultado da consulta de CNPJ</h2>${createResultCards(items)}`;
        return;
      }

      const rows = data.slice(0, 10).map(bank => `
        <tr>
          <td data-label="Código">${bank.code ?? 'N/A'}</td>
          <td data-label="Nome">${bank.name ?? 'N/A'}</td>
          <td data-label="ISPB">${bank.ispb ?? 'N/A'}</td>
          <td data-label="Nome completo">${bank.fullName ?? 'N/A'}</td>
        </tr>
      `).join('');

      resultArea.innerHTML = `
        <h2>Lista de bancos (10 primeiros)</h2>
        <table>
          <thead>
            <tr>
              <th>Código</th>
              <th>Nome</th>
              <th>ISPB</th>
              <th>Nome completo</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      `;
    }

    /**
     * Gera um resumo textual para a tabela de histórico.
     * @param {object} item - Item salvo.
     * @returns {string} Texto resumido.
     */
    function summarizeHistoryItem(item) {
      if (item.type === 'cep') {
        return `${item.data.cep} - ${item.data.city}/${item.data.state} - ${item.data.street}`;
      }
      if (item.type === 'cnpj') {
        return `${item.data.razao_social} - ${item.data.cnpj} - ${item.data.municipio}/${item.data.uf}`;
      }
      return `${item.data.length} bancos carregados da BrasilAPI`;
    }

    /**
     * Renderiza a tabela de histórico armazenada localmente.
     * @returns {void}
     */
    function renderHistory() {
      const history = getHistory();

      if (!history.length) {
        historyArea.innerHTML = '<p class="empty">Nenhuma consulta salva ainda.</p>';
        return;
      }

      const rows = history.map(item => `
        <tr>
          <td data-label="Tipo">${item.type.toUpperCase()}</td>
          <td data-label="Busca">${item.search}</td>
          <td data-label="Resumo">${summarizeHistoryItem(item)}</td>
          <td data-label="Data">${item.date}</td>
          <td data-label="Ação"><button class="btn-danger" onclick="deleteHistoryItem(${item.id})">Excluir</button></td>
        </tr>
      `).join('');

      historyArea.innerHTML = `
        <table>
          <thead>
            <tr>
              <th>Tipo</th>
              <th>Busca</th>
              <th>Resumo</th>
              <th>Data</th>
              <th>Ação</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      `;
    }

    /**
     * Realiza a consulta na BrasilAPI e trata o retorno.
     * @param {Event} event - Evento de envio do formulário.
     * @returns {Promise<void>}
     */
    async function handleSearch(event) {
      event.preventDefault();
      clearMessage();

      const type = tipoConsulta.value;
      const rawValue = inputBusca.value;
      const validation = validateInput(type, rawValue);

      if (!validation.valid) {
        showMessage(validation.message, 'error');
        return;
      }

      try {
        const response = await fetch(buildApiUrl(type, rawValue));

        if (!response.ok) {
          throw new Error('Não foi possível encontrar dados para a consulta realizada.');
        }

        const data = await response.json();
        renderResult(type, data);

        const historyItem = {
          id: Date.now(),
          type,
          search: type === 'bancos' ? 'Lista de bancos' : onlyNumbers(rawValue),
          data,
          date: new Date().toLocaleString('pt-BR')
        };

        saveToHistory(historyItem);
        showMessage('Consulta realizada e salva no histórico com sucesso.', 'success');
      } catch (error) {
        resultArea.innerHTML = '';
        showMessage(error.message || 'Erro ao consultar a API.', 'error');
      }
    }

    form.addEventListener('submit', handleSearch);
    tipoConsulta.addEventListener('change', updatePlaceholder);
    clearResultsButton.addEventListener('click', () => {
      resultArea.innerHTML = '';
      clearMessage();
    });
    clearHistoryButton.addEventListener('click', clearHistory);

    updatePlaceholder();
    renderHistory();

document.addEventListener('DOMContentLoaded', () => {
  ConfiguracoesController.init();
});

// --- 2. SERVICE ---
const ConfiguracoesService = {
  getTipoEntrega: (cb) => app.get('/entrega/tipo', cb),
  postAtivarTipoEntrega: (data, cb) =>
    app.post('/entrega/tipo/ativar', JSON.stringify(data), cb),
  postSalvarTipoEntrega: (data, cb) =>
    app.post('/entrega/tipo/salvar', JSON.stringify(data), cb),

  // Novas rotas de Pagamento
  getFormasPagamento: (cb) => app.get('/formapagamento', cb),
  postSalvarFormaPagamento: (data, cb) =>
    app.post('/formapagamento', JSON.stringify(data), cb),
};

// --- 3. VIEW ---
const ConfiguracoesView = {
  renderEstadoSwitchEntrega: (tipoStr, ativo) => {
    const checkbox = document.getElementById(`checkOpcao${tipoStr}`);
    const label = document.getElementById(`lblSwitch${tipoStr}`);
    const container = document.getElementById(`containerTempo${tipoStr}`);
    const btnSalvar = document.getElementById(`btn-salvarOpcao${tipoStr}`);

    if (checkbox) checkbox.checked = ativo === 1;
    if (label) label.innerText = ativo === 1 ? 'Ativado' : 'Desativado';

    if (container) {
      ativo === 1
        ? container.classList.remove('disabled')
        : container.classList.add('disabled');
      const inputs = container.querySelectorAll('input');
      inputs.forEach((i) => (i.disabled = ativo !== 1));
    }
    if (btnSalvar)
      ativo === 1
        ? btnSalvar.classList.remove('disabled')
        : btnSalvar.classList.add('disabled');
  },

  renderEstadoPagamento: (tipoStr, ativo) => {
    const checkbox = document.getElementById(`checkForma${tipoStr}`);
    if (checkbox) checkbox.checked = ativo === 1;
  },

  toggleTab: (tabId) => {
    document
      .querySelectorAll('.tab-content')
      .forEach((e) => e.classList.remove('active'));
    document
      .querySelectorAll('.tab-item')
      .forEach((e) => e.classList.add('hidden'));
    document.querySelector(`#tab-${tabId}`)?.classList.add('active');
    document.querySelector(`#${tabId}`)?.classList.remove('hidden');
  },
};

// --- 4. CONTROLLER ---
const ConfiguracoesController = {
  init: () => {
    app.validaToken();
    app.carregarDadosEmpresa();
    ConfiguracoesController.openTab('delivery-retirada');
  },

  openTab: (tab) => {
    ConfiguracoesView.toggleTab(tab);
    const acoes = {
      'delivery-retirada': ConfiguracoesController.obterConfigTipoEntrega,
      'taxa-entrega': ConfiguracoesController.obterConfigTaxaEntrega,
      'forma-pagamento': ConfiguracoesController.obterFormasPagamento,
    };
    if (acoes[tab]) acoes[tab]();
  },

  // --- LÓGICA DE ENTREGA ---
  obterConfigTipoEntrega: () => {
    ConfiguracoesService.getTipoEntrega((response) => {
      if (response.status === 'error') return app.mensagem(response.message);
      response.data.forEach((item) => {
        const tipoStr = item.idtipoentrega === 1 ? 'Delivery' : 'Retirada';
        ConfiguracoesView.renderEstadoSwitchEntrega(tipoStr, item.ativo);
        document.getElementById(`txtTempoMinimo${tipoStr}`).value =
          item.tempominimo || 0;
        document.getElementById(`txtTempoMaximo${tipoStr}`).value =
          item.tempomaximo || 0;
      });
    });
  },

  toggleAtivoEntrega: (tipoStr) => {
    const isChecked = document.getElementById(`checkOpcao${tipoStr}`).checked;
    ConfiguracoesView.renderEstadoSwitchEntrega(tipoStr, isChecked ? 1 : 0);

    ConfiguracoesService.postAtivarTipoEntrega(
      {
        idtipoentrega: tipoStr === 'Delivery' ? 1 : 2,
        ativo: isChecked ? 1 : 0,
      },
      (res) =>
        res.status === 'error'
          ? app.mensagem(res.message)
          : app.mensagem(res.message, 'green'),
    );
  },
  salvarOpcaoEntrega: (tipoStr) => {
    const min = parseInt(
      document.getElementById(`txtTempoMinimo${tipoStr}`).value,
    );
    const max = parseInt(
      document.getElementById(`txtTempoMaximo${tipoStr}`).value,
    );

    if (min > max)
      return app.mensagem('Mínimo não pode ser maior que o máximo.');

    ConfiguracoesService.postSalvarTipoEntrega(
      {
        idtipoentrega: tipoStr === 'Delivery' ? 1 : 2,
        tempominimo: min,
        tempomaximo: max,
      },
      (res) =>
        app.mensagem(res.message, res.status === 'error' ? 'red' : 'green'),
    );
  },

  // --- LÓGICA DE PAGAMENTO (MELHORADA) ---
  obterFormasPagamento: () => {
    ConfiguracoesService.getFormasPagamento((response) => {
      if (response.status === 'error') return app.mensagem(response.message);

      // Dicionário para mapear ID do banco para o sufixo do ID no HTML
      const mapaPagamento = {
        1: 'PIX',
        2: 'Dinheiro',
        3: 'CartaoCredito',
        4: 'CartaoDebito',
      };

      response.data.forEach((item) => {
        const sufixo = mapaPagamento[item.idformapagamento];
        if (sufixo) ConfiguracoesView.renderEstadoPagamento(sufixo, item.ativo);
      });
    });
  },

  toggleAtivoPagamento: (id, tipoStr) => {
    const isChecked = document.getElementById(`checkForma${tipoStr}`).checked;

    const dados = {
      idformapagamento: id,
      ativo: isChecked ? 1 : 0,
    };

    ConfiguracoesService.postSalvarFormaPagamento(dados, (response) => {
      if (response.status === 'error') {
        // Se der erro, volta o switch para o estado anterior
        document.getElementById(`checkForma${tipoStr}`).checked = !isChecked;
        return app.mensagem(response.message);
      }
      app.mensagem(response.message, 'green');
    });
  },

  // Taxa Entrega
};

// Interface Global
window.configuracoes = {
  openTab: ConfiguracoesController.openTab,
  toggleAtivoEntrega: ConfiguracoesController.toggleAtivoEntrega,
  toggleAtivoPagamento: ConfiguracoesController.toggleAtivoPagamento,
  salvarOpcaoEntrega: ConfiguracoesController.salvarOpcaoEntrega,
};

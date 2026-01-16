document.addEventListener('DOMContentLoaded', () => {
  ConfiguracoesController.init();
});

var TAXA_UNICA_ID = 0;
var TAXA_DISTANCIA_SELECIONADA = 0;

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
  getTaxaEntregaTipo: (cb) => app.get(`/taxaentregatipo`, cb),
  postAtivarTaxaEntregaTipo: (data, cb) =>
    app.post('/taxaentregatipo/ativar', JSON.stringify(data), cb),
  getTaxaUnica: (cb) => app.get('/taxaentregatipo/taxaunica', cb),
  postTaxaUnica: (data, cb) =>
    app.post('/taxaentregatipo/taxaunica', JSON.stringify(data), cb),
  getTaxaPorDistancia: (cb) => app.get('/taxaentregatipo/taxapordistancia', cb),
  postAddTaxaPorDistancia: (data, cb) =>
    app.post('/taxaentregatipo/taxapordistancia', JSON.stringify(data), cb),
  postAtivarTaxaPorDistancia: (data, cb) =>
    app.post(
      '/taxaentregatipo/taxapordistancia/ativar',
      JSON.stringify(data),
      cb,
    ),
  postRemoverTaxaDistancia: (data, cb) =>
    app.post(
      '/taxaentregatipo/taxapordistancia/remover',
      JSON.stringify(data),
      cb,
    ),
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
    $('.money').mask('#.##0,00', { reverse: true });
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

  obterConfigTaxaEntrega: () => {
    ConfiguracoesService.getTaxaEntregaTipo((response) => {
      if (response.status === 'error') {
        return app.mensagem(response.message);
      }
      // Lógica para renderizar as taxas de entrega

      let semtaxa = response.data.filter((e) => e.idtaxaentregatipo === 1);
      let taxaunica = response.data.filter((e) => e.idtaxaentregatipo === 2);
      let taxapordistancia = response.data.filter(
        (e) => e.idtaxaentregatipo === 3,
      );

      document.getElementById('checkSemTaxa').checked = semtaxa[0].ativo
        ? true
        : false;
      document.getElementById('checkTaxaUnica').checked = taxaunica[0].ativo
        ? true
        : false;
      document.getElementById('checkTaxaDistancia').checked =
        taxapordistancia[0].ativo ? true : false;

      Array.from(document.querySelectorAll('.tab-item-taxa')).forEach((e) => {
        e.classList.add('hidden');
      });

      if (semtaxa[0].ativo) {
        document
          .getElementById('container-sem-taxa')
          .classList.remove('hidden');
      } else if (taxaunica[0].ativo) {
        document
          .getElementById('container-taxa-unica')
          .classList.remove('hidden');
        ConfiguracoesController.listarTaxaUnica();
      } else if (taxapordistancia[0].ativo) {
        document
          .getElementById('container-taxa-distancia')
          .classList.remove('hidden');
        ConfiguracoesController.listarTaxaPorDistancia();
      }
    });
  },

  openTabTaxa: (tab, pai) => {
    Array.from(document.querySelectorAll('.tab-item-taxa')).forEach((e) => {
      e.classList.add('hidden');
    });
    document.getElementById(tab).classList.remove('hidden');

    document.getElementById('checkSemTaxa').checked = false;
    document.getElementById('checkTaxaUnica').checked = false;
    document.getElementById('checkTaxaDistancia').checked = false;

    document.getElementById(pai).checked = true;

    switch (tab) {
      case 'container-sem-taxa':
        ConfiguracoesController.obterConfigSemTaxa();
        break;

      case 'container-taxa-unica':
        ConfiguracoesController.obterConfigTaxaUnica();
        break;

      case 'container-taxa-distancia':
        ConfiguracoesController.obterConfigTaxaPorDistancia();
        break;

      default:
        break;
    }
  },

  ativarTaxaEntregaTipo: (id) => {
    console.log('Ativando tipo de taxa de entrega:', id);
    let dados = {
      semtaxa: id === 1 ? 1 : 0,
      taxaunica: id === 2 ? 1 : 0,
      taxapordistancia: id === 3 ? 1 : 0,
    };

    ConfiguracoesService.postAtivarTaxaEntregaTipo(dados, (res) =>
      res.status === 'error'
        ? app.mensagem(res.message)
        : app.mensagem(res.message, 'green'),
    );
  },

  obterConfigSemTaxa: () => {
    ConfiguracoesController.ativarTaxaEntregaTipo(1);
    TAXA_UNICA_ID = 0;
  },

  obterConfigTaxaUnica: () => {
    ConfiguracoesController.ativarTaxaEntregaTipo(2);
    ConfiguracoesController.listarTaxaUnica();
  },

  obterConfigTaxaPorDistancia: () => {
    ConfiguracoesController.ativarTaxaEntregaTipo(3);
    ConfiguracoesController.listarTaxaPorDistancia();
  },

  listarTaxaUnica: () => {
    TAXA_UNICA_ID = 0;
    ConfiguracoesService.getTaxaUnica((response) => {
      if (response.status === 'error') {
        return app.mensagem(response.message);
      }

      const taxaUnica = response.data;
      let valor = document.getElementById('inputTaxaUnicaValor');
      let tempominimo = document.getElementById('inputTaxaUnicaTempoMinimo');
      let tempomaximo = document.getElementById('inputTaxaUnicaTempoMaximo');

      if (taxaUnica.length > 0) {
        TAXA_UNICA_ID = taxaUnica[0].idtaxaentrega;
        valor.value = taxaUnica[0].valor;
        tempominimo.value = taxaUnica[0].tempominimo;
        tempomaximo.value = taxaUnica[0].tempomaximo;
      }
    });
  },

  salvarTaxaUnica: () => {
    const valor = document
      .getElementById('inputTaxaUnicaValor')
      .value.replace(',', '.')
      .trim();
    const tempominimo = parseFloat(
      document.getElementById('inputTaxaUnicaTempoMinimo').value.trim(),
    );

    const tempomaximo = parseInt(
      document.getElementById('inputTaxaUnicaTempoMaximo').value.trim(),
    );

    if (
      isNaN(tempominimo) ||
      isNaN(tempomaximo) ||
      valor.trim() === '' ||
      isNaN(valor)
    ) {
      return app.mensagem('Por favor, insira valores válidos para os campos.');
    }

    if (tempominimo > tempomaximo)
      return app.mensagem('Mínimo não pode ser maior que o máximo.');

    const dados = {
      idtaxaentrega: TAXA_UNICA_ID,
      valor: valor,
      tempominimo: tempominimo,
      tempomaximo: tempomaximo,
    };

    ConfiguracoesService.postTaxaUnica(dados, (response) => {
      if (response.status === 'error') {
        return app.mensagem(response.message);
      }
      app.mensagem(response.message, 'green');
      ConfiguracoesController.listarTaxaUnica();
    });
  },

  listarTaxaPorDistancia: () => {
    ConfiguracoesService.getTaxaPorDistancia((response) => {
      if (response.status === 'error') {
        return app.mensagem(response.message);
      }
      let tabela = document.getElementById('listaTaxaDistancia');
      tabela.innerHTML = '';

      if (response.data.length === 0) {
        tabela.innerHTML =
          '<tr><td colspan="5">Nenhuma taxa por distância cadastrada.</td></tr>';
        return;
      }

      const html = response.data
        .map((e) => {
          let tempo = '';
          let status = `<span class="badge bg-success">Ativado</span>`;
          let acoes = `
          <a class="dropdown-item" href="#!" 
          onclick="configuracoes.ativarTaxaDistancia('${e.idtaxaentrega}', 0)">
           <i class="fas fa-ban"></i
           >&nbsp; <b>Desativar</b>
           </a>`;

          if (e.ativo === 0) {
            status = `<span class="badge bg-danger">Desativado</span>`;
            acoes = `
            <a class="dropdown-item" href="#!"
            onclick="configuracoes.ativarTaxaDistancia('${e.idtaxaentrega}', 1)">
             <i class="fas fa-check-circle"></i
             >&nbsp; <b>Ativar</b>
             </a>`;
          }

          return ConfiguracoesTemplate.taxadistancia()
            .replace(/\${idtaxaentrega}/g, e.idtaxaentrega)
            .replace(/\${distancia}/g, e.distancia)
            .replace(
              /\${valor}/g,
              (e.valor || '0').toString().replace('.', ','),
            )
            .replace(/\${tempominimo}/g, e.tempominimo || 0)
            .replace(/\${tempomaximo}/g, e.tempomaximo || 0)
            .replace(/\${status}/g, status)
            .replace(/\${acoes}/g, acoes);
        })
        .join('');

      tabela.innerHTML += html;
    });
  },

  addTaxaPorDistancia: () => {
    let distanciaKM = parseInt(
      document.getElementById('txtTaxaDistanciaKm').value.trim(),
    );
    let valor = document
      .getElementById('txtTaxaDistanciaValor')
      .value.replace(/\./g, '')
      .replace(',', '.')
      .trim();
    let tempominimo = document
      .getElementById('txtTaxaDistanciaTempoMinimo')
      .value.trim();
    let tempomaximo = document
      .getElementById('txtTaxaDistanciaTempoMaximo')
      .value.trim();

    if (
      isNaN(distanciaKM) ||
      isNaN(valor) ||
      isNaN(tempominimo) ||
      isNaN(tempomaximo) ||
      distanciaKM <= 0 ||
      valor <= 0 ||
      tempominimo <= 0 ||
      tempomaximo <= 0
    ) {
      return app.mensagem(
        'Por favor, insira valores válidos para os campos. (Apenas numeros)',
      );
    }

    let dados = {
      distancia: distanciaKM,
      valor: valor,
      tempominimo: tempominimo,
      tempomaximo: tempomaximo,
    };

    ConfiguracoesService.postAddTaxaPorDistancia(dados, (response) => {
      if (response.status === 'error') {
        return app.mensagem(response.message);
      }
      app.mensagem(response.message, 'green');
      document.getElementById('txtTaxaDistanciaKm').value = '';
      document.getElementById('txtTaxaDistanciaValor').value = '';
      document.getElementById('txtTaxaDistanciaTempoMinimo').value = '';
      document.getElementById('txtTaxaDistanciaTempoMaximo').value = '';

      ConfiguracoesController.listarTaxaPorDistancia();
    });
  },

  abrirModalRemoverTaxaDistancia: (idtaxaentrega) => {
    $('#modalRemoverTaxaDistancia').modal('show');
    TAXA_DISTANCIA_SELECIONADA = idtaxaentrega;
  },

  removerTaxaDistancia: () => {
    var dados = {
      idtaxaentrega: TAXA_DISTANCIA_SELECIONADA,
    };

    ConfiguracoesService.postRemoverTaxaDistancia(dados, (response) => {
      $('#modalRemoverTaxaDistancia').modal('hide');
      if (response.status === 'error') {
        return app.mensagem(response.message);
      }
      app.mensagem(response.message, 'green');
      ConfiguracoesController.listarTaxaPorDistancia();
    });
  },

  ativarTaxaDistancia: (idtaxaentrega, ativar) => {
    let dados = {
      idtaxaentrega: idtaxaentrega,
      ativo: ativar,
    };

    ConfiguracoesService.postAtivarTaxaPorDistancia(dados, (response) => {
      if (response.status === 'error') {
        return app.mensagem(response.message);
      }
      app.mensagem(response.message, 'green');
      ConfiguracoesController.listarTaxaPorDistancia();
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

const ConfiguracoesTemplate = {
  taxadistancia: () => `<tr>
                          <td>Até \${distancia} KM</td>
                          <td>R$ \${valor}</td>
                          <td>de \${tempominimo} até \${tempomaximo} minutos</td>
                          <td>
                            \${status}
                          </td>
                          <td>
                            <div class="dropdown">
                              <button
                                class="btn btn-white btn-sm"
                                type="button"
                                data-bs-toggle="dropdown"
                                aria-expanded="false"
                              >
                                <i class="fas fa-ellipsis-v"></i>
                              </button>
                              <div class="dropdown-menu">
                                  \${acoes}

                                <a href="#!" class="dropdown-item color-red" onclick="configuracoes.abrirModalRemoverTaxaDistancia('\${idtaxaentrega}')">
                                  <i class="fas fa-trash-alt"></i>&nbsp;
                                  <b>Remover</b>
                                </a>
                              </div>
                            </div>
                          </td>
                        </tr>`,
};

// Interface Global
window.configuracoes = {
  openTab: ConfiguracoesController.openTab,
  toggleAtivoEntrega: ConfiguracoesController.toggleAtivoEntrega,
  toggleAtivoPagamento: ConfiguracoesController.toggleAtivoPagamento,
  salvarOpcaoEntrega: ConfiguracoesController.salvarOpcaoEntrega,
  openTabTaxa: ConfiguracoesController.openTabTaxa,
  salvarTaxaUnica: ConfiguracoesController.salvarTaxaUnica,
  addTaxaPorDistancia: ConfiguracoesController.addTaxaPorDistancia,
  ativarTaxaDistancia: ConfiguracoesController.ativarTaxaDistancia,
  abrirModalRemoverTaxaDistancia:
    ConfiguracoesController.abrirModalRemoverTaxaDistancia,
  removerTaxaDistancia: ConfiguracoesController.removerTaxaDistancia,
};

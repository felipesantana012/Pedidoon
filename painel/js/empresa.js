document.addEventListener('DOMContentLoaded', () => {
  EmpresaController.init();
});

// Referências Globais de Instância
const MODAL_UPLOAD = new bootstrap.Modal(
  document.getElementById('modalUpload'),
);

// --- 1. SERVICE: Camada de Comunicação com API ---
const EmpresaService = {
  getSobre: (cb) => app.get('/empresa/sobre', cb),
  postSobre: (dados, cb) =>
    app.post('/empresa/sobre', JSON.stringify(dados), cb),

  getHorarios: (cb) => app.get('/empresa/horario', cb),
  postHorarios: (dados, cb) =>
    app.post('/empresa/horario', JSON.stringify(dados), cb),

  postEndereco: (dados, cb) =>
    app.post('/empresa/endereco', JSON.stringify(dados), cb),

  uploadLogo: (formData, cb) => app.upload('/image/logo/upload', formData, cb),
  removeLogo: (dados, cb) =>
    app.post('/image/logo/remove', JSON.stringify(dados), cb),

  buscarCep: (cep) =>
    fetch(`https://viacep.com.br/ws/${cep}/json/`).then((r) => r.json()),
};

// --- 2. VIEW: Camada de Manipulação do DOM ---
const EmpresaView = {
  elements: {
    dropArea: document.getElementById('drop-area'),
    imgEmpresa: document.getElementById('img-empresa'),
    listaHorarios: document.getElementById('listaHorarios'),
    btnEditarLogo: document.getElementById('btn-editar-logo'),
    btnRemoverLogo: document.getElementById('btn-remover-logo'),
    inputs: {
      nome: document.getElementById('txtNomeEmpresa'),
      sobre: document.getElementById('txtSobreEmpresa'),
      cep: document.getElementById('txtCEP'),
      rua: document.getElementById('txtRua'),
      numero: document.getElementById('txtNumero'),
      complemento: document.getElementById('txtComplemento'),
      bairro: document.getElementById('txtBairro'),
      cidade: document.getElementById('txtCidade'),
      uf: document.getElementById('ddlUF'),
    },
  },

  toggleTab: (tabId) => {
    document
      .querySelectorAll('.tab-content')
      .forEach((e) => e.classList.remove('active'));
    document
      .querySelectorAll('.tab-item')
      .forEach((e) => e.classList.add('hidden'));

    const tabLink = document.querySelector('#tab-' + tabId);
    const tabContent = document.querySelector('#' + tabId);

    if (tabLink) tabLink.classList.add('active');
    if (tabContent) tabContent.classList.remove('hidden');
  },

  renderDados: (data) => {
    const { inputs, imgEmpresa, btnEditarLogo, btnRemoverLogo } =
      EmpresaView.elements;

    // Logotipo
    if (data.logotipo) {
      imgEmpresa.style.backgroundImage = `url('../public/images/empresa/${data.logotipo}')`;
      imgEmpresa.style.backgroundSize = '70%';
      btnEditarLogo.classList.add('hidden');
      btnRemoverLogo.classList.remove('hidden');
    } else {
      imgEmpresa.style.backgroundImage = `url('../public/images/default.jpg')`;
      imgEmpresa.style.backgroundSize = 'cover';
      btnEditarLogo.classList.remove('hidden');
      btnRemoverLogo.classList.add('hidden');
    }

    // Preenche inputs
    inputs.nome.value = data.nome || '';
    inputs.sobre.value = (data.sobre || '').replace(/\\n/g, '\n');
    inputs.cep.value = data.cep || '';
    inputs.rua.value = data.rua || '';
    inputs.numero.value = data.numero || '';
    inputs.complemento.value = data.complemento || '';
    inputs.bairro.value = data.bairro || '';
    inputs.cidade.value = data.cidade || '';
    inputs.uf.value = (data.estado || '').toUpperCase();
  },

  renderHorarioItem: (horario = {}) => {
    const id = Math.floor(Date.now() * Math.random()).toString();
    const div = document.createElement('div');
    div.className = 'container-horario mt-4';
    div.id = `horario-${id}`;
    div.innerHTML = EmpresaTemplates.horario(id);
    EmpresaView.elements.listaHorarios.appendChild(div);

    if (horario.diainicio !== undefined) {
      document.querySelector(`#diainicio-${id}`).value = horario.diainicio;
      document.querySelector(`#diafim-${id}`).value = horario.diafim;
      document.querySelector(`#iniciohorarioum-${id}`).value =
        horario.iniciohorarioum;
      document.querySelector(`#fimhorarioum-${id}`).value =
        horario.fimhorarioum;
      document.querySelector(`#iniciohorariodois-${id}`).value =
        horario.iniciohorariodois || '';
      document.querySelector(`#fimhorariodois-${id}`).value =
        horario.fimhorariodois || '';
    }
  },
};

// --- 3. CONTROLLER: Regras de Negócio ---
const EmpresaController = {
  state: { dados: {} },

  init: () => {
    app.validaToken();
    app.carregarDadosEmpresa();

    // Bootstrap Tooltips
    [].slice
      .call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
      .map((t) => new bootstrap.Tooltip(t));

    $('.cep').mask('00000-000');
    EmpresaController.setupDragAndDrop();
    EmpresaController.openTab('sobre');
  },

  openTab: (tab) => {
    EmpresaView.toggleTab(tab);
    if (tab === 'horario') {
      EmpresaController.carregarHorarios();
    } else {
      EmpresaController.carregarDadosGerais();
    }
  },

  carregarDadosGerais: () => {
    EmpresaService.getSobre((response) => {
      if (response.status === 'error') return app.mensagem(response.message);
      EmpresaController.state.dados = response.data[0];
      EmpresaView.renderDados(EmpresaController.state.dados);
    });
  },

  salvarSobre: () => {
    const nome = EmpresaView.elements.inputs.nome.value.trim();
    const sobre = EmpresaView.elements.inputs.sobre.value.trim();

    if (!nome) return app.mensagem('Nome é obrigatório.');

    EmpresaService.postSobre({ nome, sobre }, (response) => {
      if (response.status === 'error') return app.mensagem(response.message);
      app.mensagem(response.message, 'green');

      let current = app.obterValorStorage();
      app.gravarValorStorage({ ...current, nome });

      EmpresaController.carregarDadosGerais();
      app.carregarDadosEmpresa();
    });
  },

  buscarCep: () => {
    const cep = EmpresaView.elements.inputs.cep.value.replace(/\D/g, '');
    if (cep.length !== 8) return app.mensagem('CEP inválido.');

    app.loading(true);
    EmpresaService.buscarCep(cep)
      .then((data) => {
        app.loading(false);
        if (data.erro) return app.mensagem('CEP não encontrado.');

        const { inputs } = EmpresaView.elements;
        inputs.rua.value = data.logradouro;
        inputs.bairro.value = data.bairro;
        inputs.cidade.value = data.localidade;
        inputs.uf.value = data.uf;
        inputs.numero.focus();
      })
      .catch(() => {
        app.loading(false);
        app.mensagem('Erro na busca.');
      });
  },

  salvarEndereco: () => {
    const { inputs } = EmpresaView.elements;
    const dados = {
      cep: inputs.cep.value.trim(),
      rua: inputs.rua.value.trim(),
      numero: inputs.numero.value.trim(),
      complemento: inputs.complemento.value.trim(),
      bairro: inputs.bairro.value.trim(),
      cidade: inputs.cidade.value.trim(),
      estado: inputs.uf.value.trim(),
    };

    if (!dados.cep || !dados.rua || dados.estado === '-1')
      return app.mensagem('Preencha os campos obrigatórios.');

    EmpresaService.postEndereco(dados, (response) => {
      if (response.status === 'error') return app.mensagem(response.message);
      app.mensagem(response.message, 'green');
      app.carregarDadosEmpresa();
    });
  },

  validarHorariosAtuais: () => {
    const containers = document.querySelectorAll('.container-horario');
    let todosPreenchidos = true;
    containers.forEach((el) => {
      const id = el.id.split('-')[1];
      const diaInicio = document.querySelector(`#diainicio-${id}`).value;
      const diaFim = document.querySelector(`#diafim-${id}`).value;
      const horaInicio = document.querySelector(`#iniciohorarioum-${id}`).value;
      const horaFim = document.querySelector(`#fimhorarioum-${id}`).value;

      if (diaInicio == -1 || diaFim == -1 || !horaInicio || !horaFim) {
        todosPreenchidos = false;
      }
    });

    return todosPreenchidos;
  },

  adicionarNovoHorario: () => {
    if (EmpresaController.validarHorariosAtuais()) {
      EmpresaView.renderHorarioItem();
    } else {
      app.mensagem(
        'Preencha os campos do horário anterior antes de adicionar um novo.',
      );
    }
  },

  carregarHorarios: () => {
    EmpresaView.elements.listaHorarios.innerHTML = '';
    EmpresaService.getHorarios((res) => {
      if (res.data && res.data.length > 0)
        res.data.forEach((h) => EmpresaView.renderHorarioItem(h));
      else EmpresaView.renderHorarioItem();
    });
  },

  salvarHorario: () => {
    const horarios = [];
    let valido = true;
    document.querySelectorAll('.container-horario').forEach((el) => {
      const id = el.id.split('-')[1];
      const item = {
        diainicio: document.querySelector(`#diainicio-${id}`).value,
        diafim: document.querySelector(`#diafim-${id}`).value,
        iniciohorarioum: document.querySelector(`#iniciohorarioum-${id}`).value,
        fimhorarioum: document.querySelector(`#fimhorarioum-${id}`).value,
        iniciohorariodois: document.querySelector(`#iniciohorariodois-${id}`)
          .value,
        fimhorariodois: document.querySelector(`#fimhorariodois-${id}`).value,
      };
      if (item.diainicio === '-1' || !item.iniciohorarioum) valido = false;
      horarios.push(item);
    });

    if (!valido) return app.mensagem('Preencha os horários obrigatórios.');

    EmpresaService.postHorarios(horarios, (res) => {
      if (res.status === 'error') return app.mensagem(res.message);
      app.mensagem(res.message, 'green');
      EmpresaController.openTab('horario');
    });
  },

  setupDragAndDrop: () => {
    const area = EmpresaView.elements.dropArea;
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach((n) => {
      area.addEventListener(n, (e) => {
        e.preventDefault();
        e.stopPropagation();
      });
    });
    area.addEventListener('drop', (e) =>
      EmpresaController.uploadLogo(e.dataTransfer.files),
    );
  },

  uploadLogo: (files) => {
    MODAL_UPLOAD.hide();
    const formData = new FormData();
    const file = files
      ? files[0]
      : document.querySelector('#fileElem').files[0];
    formData.append('image', file);

    EmpresaService.uploadLogo(formData, (res) => {
      if (res.status === 'error') return app.mensagem(res.message);
      app.mensagem(res.message, 'green');
      let current = app.obterValorStorage();
      app.gravarValorStorage({ ...current, logo: res.logotipo });
      EmpresaController.carregarDadosGerais();
      app.carregarDadosEmpresa();
    });
  },

  removerLogo: () => {
    const data = { imagem: EmpresaController.state.dados.logotipo };
    EmpresaService.removeLogo(data, (res) => {
      if (res.status === 'error') return app.mensagem(res.message);
      app.mensagem(res.message, 'green');
      app.removerSessao('logo');
      EmpresaController.carregarDadosGerais();
      app.carregarDadosEmpresa();
    });
  },
};

// --- 4. TEMPLATES ---
const EmpresaTemplates = {
  horario: (id) => `
        <div class="content-horario">
            <div class="row">
                <div class="col-md-6 form-group">
                    <p class="mb-0"><b>De *:</b></p>
                    <select class="form-control" id="diainicio-${id}">
                        <option value="-1">...</option>
                        <option value="0">Domingo</option><option value="1">Segunda</option><option value="2">Terça</option>
                        <option value="3">Quarta</option><option value="4">Quinta</option><option value="5">Sexta</option><option value="6">Sábado</option>
                    </select>
                </div>
                <div class="col-md-6 form-group">
                    <p class="mb-0"><b>Até *:</b></p>
                    <select class="form-control" id="diafim-${id}">
                        <option value="-1">...</option>
                        <option value="0">Domingo</option><option value="1">Segunda</option><option value="2">Terça</option>
                        <option value="3">Quarta</option><option value="4">Quinta</option><option value="5">Sexta</option><option value="6">Sábado</option>
                    </select>
                </div>
            </div>
            <div class="row mt-2">
                <div class="col-md-3"><p class="mb-0"><b>Das *:</b></p><input type="time" class="form-control" id="iniciohorarioum-${id}"></div>
                <div class="col-md-3"><p class="mb-0"><b>Até *:</b></p><input type="time" class="form-control" id="fimhorarioum-${id}"></div>
                <div class="col-md-3"><p class="mb-0"><b>E das:</b></p><input type="time" class="form-control" id="iniciohorariodois-${id}"></div>
                <div class="col-md-3"><p class="mb-0"><b>Até:</b></p><input type="time" class="form-control" id="fimhorariodois-${id}"></div>
            </div>
            <div class="text-end mt-2">
                <button class="btn btn-red btn-sm" onclick="empresa.removerHorario('${id}')"><i class="fas fa-trash"></i></button>
            </div>
            <hr>
        </div>`,
};

// Interface Global para Onclick do HTML
window.empresa = {
  openTab: EmpresaController.openTab,
  salvarDadosSobre: EmpresaController.salvarSobre,
  salvarDadosEndereco: EmpresaController.salvarEndereco,
  salvarHorario: EmpresaController.salvarHorario,
  adicionarNovoHorario: () => EmpresaController.adicionarNovoHorario(),
  removerHorario: (id) => document.getElementById(`horario-${id}`).remove(),
  openModalLogo: () => MODAL_UPLOAD.show(),
  uploadLogo: EmpresaController.uploadLogo,
  removerLogo: EmpresaController.removerLogo,
  buscarCep: EmpresaController.buscarCep,
};

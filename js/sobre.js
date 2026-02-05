document.addEventListener('DOMContentLoaded', () => {
  app.init();
  SobreController.init();
});

var DIAS_SEMANA = [
  'Domingo',
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
];

const SobreService = {
  getDadosEmpresaSobre: (cb) => app.get('/empresa/sobre', cb),
  getHorariosFuncionamento: (cb) => app.get('/empresa/horario', cb),
  getFormaPagamento: (cb) => app.get('/formapagamento/ativa', cb),
};

const SobreView = {};

const SobreController = {
  init: () => {
    SobreController.obterDadosEmpresa();
    SobreController.obterHorarioFuncionamento();
    SobreController.obterFormasPagamento();
  },

  obterDadosEmpresa: () => {
    SobreService.getDadosEmpresaSobre(
      (res) => {
        if (res.status == 'error') {
          app.mensagem(res.message);
          return;
        }
        SobreController.preencherDadosEmpresaSobre(res.data[0]);
      },
      (status, error) => {
        app.mensagem('Erro ao obter dados da empresa. Atualize a página.');
        console.log('Erro ' + status + ': ' + error);
      },
      true,
    );
  },

  preencherDadosEmpresaSobre: (data) => {
    document.getElementById('lblNomeEmpresa').innerText = data.nome;
    document.getElementById('lblSobreEmpresa').innerHTML =
      data.sobre.replace(/\\n/g, '<br>') || 'Descrição não disponível';

    let urlLogo = data.logotipo
      ? `/public/images/empresa/${data.logotipo}`
      : '/public/images/default.jpg';

    document.getElementById(
      'imgLogoEmpresa',
    ).style.backgroundImage = `url(${urlLogo})`;
    document.getElementById('imgLogoEmpresa').style.backgroundSize = '70%';

    if (data.rua) {
      let complemento = data.complemento ? `(${data.complemento})` : '';
      document.getElementById(
        'lblEnderecoEmpresa',
      ).innerHTML = `${data.rua}, ${data.numero} ${complemento}, ${data.bairro}, ${data.cidade} - ${data.estado}, ${data.cep}`;
    }
  },

  obterHorarioFuncionamento: () => {
    SobreService.getHorariosFuncionamento(
      (res) => {
        if (res.status == 'error') {
          app.mensagem(res.message);
          return;
        }
        SobreController.preencherHorarioFuncionamento(res.data);
      },
      (status, error) => {
        app.mensagem(
          'Erro ao obter horários de funcionamento. Atualize a página.',
        );
        console.log('Erro ' + status + ': ' + error);
      },
      true,
    );
  },

  preencherHorarioFuncionamento: (data) => {
    let tempHoarario = document.getElementById('horarioFuncionamento');
    if (data.length <= 0) {
      tempHoarario.remove();
    }

    tempHoarario.classList.remove('hidden');

    data.forEach((e) => {
      let textoDia = '';
      let textoHorario = `${e.iniciohorarioum} ás ${e.fimhorarioum}`;

      if (e.iniciohorariodois && e.fimhorariodois) {
        textoHorario += ` - e ${e.iniciohorariodois} ás ${e.fimhorariodois}`;
      }

      if (e.diainicio != e.diafim) {
        textoDia = `${DIAS_SEMANA[e.diainicio]} a ${DIAS_SEMANA[e.diafim]}`;
      } else {
        textoDia = DIAS_SEMANA[e.diainicio];
      }

      let temp = SobreTemplate.horario(textoDia, textoHorario);

      document.getElementById('horarioFuncionamento').innerHTML += temp;
    });
  },

  obterFormasPagamento: () => {
    SobreService.getFormaPagamento(
      (res) => {
        if (res.status == 'error') {
          app.mensagem(res.message);
          return;
        }
        SobreController.preencherFormaPagamento(res.data);
      },
      (status, error) => {
        app.mensagem('Erro ao obter formas de pagamento. Atualize a página.');
        console.log('Erro ' + status + ': ' + error);
      },
      true,
    );
  },

  preencherFormaPagamento: (data) => {
    let tempFormaPagamento = document.getElementById('formasPagamento');
    if (data.length <= 0) {
      tempFormaPagamento.remove();
    }

    tempFormaPagamento.classList.remove('hidden');

    data.forEach((e) => {
      let temp = SobreTemplate.formaPagamento(e.nome);

      document.getElementById('formasPagamento').innerHTML += temp;
    });
  },
};

const SobreTemplate = {
  horario: (dia, horario) => {
    return `     <div class="card mt-2">
          <p class="normal-text mb-0"><b>${dia}</b></p>
          <p class="normal-text mb-0">${horario}</p>
        </div>`;
  },
  formaPagamento: (forma) => {
    return `    <div class="card mt-2">
          <p class="normal-text mb-0"><b>${forma}</b></p>
        </div>`;
  },
};

window.sobre = {};

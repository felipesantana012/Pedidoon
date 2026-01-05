document.addEventListener('DOMContentLoaded', function (event) {
  loginController.init();
});

const loginController = {
  init: () => {
    document.getElementById('formLogin').addEventListener('submit', (e) => {
      e.preventDefault();
      loginController.validarLogin();
    });

    const msg = localStorage.getItem('msg_pendente');
    if (msg) {
      app.mensagem(msg);
      localStorage.removeItem('msg_pendente');
    }
  },

  validarLogin: () => {
    let email = document.getElementById('inputEmailLogin').value.trim();
    let senha = document.getElementById('inputSenhaLogin').value.trim();

    if (email.length === 0) {
      app.mensagem('Por favor, preencha o campo de email.');
      document.getElementById('inputEmailLogin').focus();
      return;
    }
    if (senha.length === 0) {
      app.mensagem('Por favor, preencha o campo de Senha.');
      document.getElementById('inputSenhaLogin').focus();
      return;
    }

    loginService.fazerLogin(email, senha);
  },
};

const loginService = {
  fazerLogin: async (email, senha) => {
    const dados = {
      email: email,
      senha: senha,
    };

    app.post(
      '/login',
      JSON.stringify(dados),
      (response) => {
        if (response.status === 'error') {
          app.mensagem(response.message);
          return;
        }

        if (response.status === 'success') {
          const dadosStorage = {
            token: response.tokenAcesso,
            nome: response.nome,
            email: response.email,
            logo: response.logo,
          };
          app.gravarValorStorage(dadosStorage);
          window.location.href = '/painel/home.html';
        }
      },
      (error) => {
        console.log('Erro ao realizar login: ' + error);
      },
      true,
    );
  },
};

const SESSION_KEY = 'sessao_pedidoon';

var app = {
  init: (home = false) => {
    app.validarEmpresaAberta(home);
  },

  get: (url, callbackSuccess, callbackError, login = false) => {
    try {
      app.loading(true);
      if (app.validaToken(login)) {
        let xhr = new XMLHttpRequest();
        xhr.open('GET', url);
        xhr.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');

        const sessao = app.obterValorStorage();
        const token = sessao ? sessao.token : '';
        xhr.setRequestHeader('Authorization', 'Bearer ' + token);

        xhr.onreadystatechange = function () {
          if (this.readyState == 4) {
            app.loading(false);
            if (this.status == 200) {
              return callbackSuccess(JSON.parse(this.responseText));
            } else {
              if (this.status === 401) {
                app.logout();
              }
              return callbackError(this.status, this.responseText);
            }
          }
        };
        xhr.send();
      }
    } catch (error) {
      app.loading(false);
      return callbackError(error);
    }
  },

  post: (url, dados, callbackSuccess, callbackError, login = false) => {
    try {
      app.loading(true);
      if (app.validaToken(login)) {
        let xhr = new XMLHttpRequest();
        xhr.open('POST', url);
        xhr.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');

        const sessao = app.obterValorStorage();
        const token = sessao ? sessao.token : '';
        xhr.setRequestHeader('Authorization', 'Bearer ' + token);

        xhr.onreadystatechange = function () {
          if (this.readyState == 4) {
            app.loading(false);
            if (this.status == 200) {
              return callbackSuccess(JSON.parse(this.responseText));
            } else {
              if (this.status === 401) {
                app.logout();
              }
              return callbackError(this.status, this.responseText);
            }
          }
        };
        xhr.send(dados);
      }
    } catch (error) {
      app.loading(false);
      return callbackError(error);
    }
  },

  upload: (url, dados, callbackSuccess, callbackError, login = false) => {
    try {
      app.loading(true);
      if (app.validaToken(login)) {
        let xhr = new XMLHttpRequest();
        xhr.open('POST', url);
        xhr.setRequestHeader('Mime-Type', 'multipart/form-data');

        const sessao = app.obterValorStorage();
        const token = sessao ? sessao.token : '';
        xhr.setRequestHeader('Authorization', 'Bearer ' + token);

        xhr.onreadystatechange = function () {
          if (this.readyState == 4) {
            app.loading(false);
            if (this.status == 200) {
              return callbackSuccess(JSON.parse(this.responseText));
            } else {
              if (this.status === 401) {
                app.logout();
              }
              return callbackError(this.status, this.responseText);
            }
          }
        };
        xhr.send(dados);
      }
    } catch (error) {
      app.loading(false);
      return callbackError(error);
    }
  },

  validaToken: (login = false) => {
    const sessao = app.obterValorStorage();

    if ((!sessao || !sessao.token) && !login) {
      localStorage.setItem(
        'msg_pendente',
        'Sessão expirada. Faça login novamente.',
      );
      window.location.href = '/painel/login.html';
      return false;
    }
    return true;
  },

  gravarValorStorage: (dados) => {
    localStorage.setItem(SESSION_KEY, JSON.stringify(dados));
  },

  obterValorStorage: () => {
    const dados = localStorage.getItem(SESSION_KEY);
    return dados ? JSON.parse(dados) : null;
  },

  removerSessao: (item) => {
    let sessao = app.obterValorStorage();

    if (sessao && sessao[item] !== undefined) {
      delete sessao[item];
      app.gravarValorStorage(sessao);
    }
  },

  logout: () => {
    localStorage.removeItem(SESSION_KEY);
    window.location.href = '/painel/login.html';
  },

  mensagem: (texto, cor = 'red', tempo = 3500) => {
    let container = document.getElementById('container-mensagens');

    if (container.childElementCount > 1) return;

    let id = Math.floor(Date.now() * Math.random()).toString();
    let msg = `<div id="msg-${id}" class="toast ${cor}">${texto}</div>`;

    container.innerHTML += msg;
    setTimeout(() => {
      let elem = document.getElementById(`msg-${id}`);
      if (elem) elem.remove();
    }, tempo);
  },

  loading: (mostrar = false) => {
    if (mostrar) {
      document.querySelector('.loader-full').classList.remove('hidden');
    } else {
      document.querySelector('.loader-full').classList.add('hidden');
    }
  },

  carregarDadosEmpresa: () => {
    const sessao = app.obterValorStorage();
    if (sessao) {
      document.querySelector('.nome-empresa').innerHTML = sessao.nome || '';
      document.querySelector('.email-empresa').innerHTML = sessao.email || '';

      const logoElement = document.querySelector('.logo-empresa');

      if (sessao.logo && sessao.logo !== 'null') {
        logoElement.src = '/public/images/empresa/' + sessao.logo;
      } else {
        logoElement.src = '/public/images/default.jpg';
      }
    }
  },

  validarEmpresaAberta: (home = false) => {
    app.get(
      '/empresa/open',
      (res) => {
        if (home) {
          document.querySelector('.status-open').classList.remove('hidden');
        }
        if (res.status == 'error') {
          if (home) {
            document.querySelector('.status-open').classList.add('closed');
            document.querySelector('#lblLojaAberta').innerText = 'Fechado';
          }
          document.querySelector('#menu-bottom').remove();
          document
            .querySelector('#menu-bottom-closed')
            .classList.remove('hidden');
          return;
        }

        if (home) {
          document.querySelector('.status-open').classList.remove('closed');
          document.querySelector('#lblLojaAberta').innerText = 'Aberto';
        }
        document.querySelector('#menu-bottom').classList.remove('hidden');
        document.querySelector('#menu-bottom-closed').remove();
      },
      (status, error) => {
        app.mensagem('Erro ao verificar status da empresa. Atualize a página.');
        console.log('Erro ' + status + ': ' + error);
      },
      true,
    );
  },
};

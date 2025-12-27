document.addEventListener('DOMContentLoaded', function (event) {
  homeController.init();
});

const homeController = {
  init: () => {
    app.validaToken();
    app.carregarDadosEmpresa();
  },
};

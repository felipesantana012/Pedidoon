document.addEventListener('DOMContentLoaded', () => {
  app.init();
  ItemController.init();
});

var ITEM_ID = 0;
var PRODUTO = {};

const ItemService = {
  getDadosProduto: (cb) => app.get(`/produto/${ITEM_ID}`, cb),
  getOpcionaisProduto: (cb) => app.get(`/opcional/produto/${ITEM_ID}`, cb),
};

const ItemView = {
  preencherDadosProduto: (produto) => {
    let urlImagem = produto.imagem
      ? `/public/images/cardapio/${produto.imagem}`
      : '/public/images/default.jpg';

    document.getElementById(
      'img-produto',
    ).style.backgroundImage = `url(${urlImagem})`;
    document.getElementById('img-produto').style.backgroundSize = 'cover';

    document.getElementById('titulo-produto').innerText = produto.nome;
    document.getElementById('descricao-produto').innerText =
      produto.descricao || 'Sem descrição disponível';
    let preco = parseFloat(produto.valor)
      .toFixed(2)
      .toString()
      .replace('.', ',');
    document.getElementById('preco-produto').innerText = `R$ ${preco}`;
    document.getElementById('btn-preco-produto').innerText = `R$ ${preco}`;
  },
};

const ItemController = {
  init: () => {
    let url = new URL(window.location.href);
    var idproduto = url.searchParams.get('idproduto');

    if (idproduto == null || idproduto.trim() == '' || isNaN(idproduto)) {
      window.location.href = '/index.html';
      return;
    }

    ITEM_ID = parseInt(idproduto);

    ItemController.obterDadosProduto();
  },

  obterDadosProduto: () => {
    PRODUTO = {};

    ItemService.getDadosProduto(
      (res) => {
        if (res.status == 'error') {
          app.mensagem(res.message);
          return;
        }

        PRODUTO = res.data[0];

        ItemView.preencherDadosProduto(PRODUTO);
        ItemController.obterOpcionaisProduto();
      },
      (status, error) => {
        console.log('Erro ' + status + ': ' + error);
      },
      true,
    );
  },

  obterOpcionaisProduto: () => {
    ItemService.getOpcionaisProduto(
      (res) => {
        if (res.status == 'error') {
          app.mensagem(res.message);
          return;
        }
        ItemController.carregarOpcionais(res.data);
        ItemController.carregarOpcionaisSimples(res.data);
        console.log('Opcionais do produto: ', res.data);
      },
      (status, error) => {
        console.log('Erro ' + status + ': ' + error);
      },
      true,
    );
  },

  carregarOpcionais: (lista) => {},

  carregarOpcionaisSimples: (lista) => {},
};

const ItemTemplate = {};

window.item = {};

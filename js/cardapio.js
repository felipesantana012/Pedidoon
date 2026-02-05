document.addEventListener('DOMContentLoaded', () => {
  app.init(true);
  CardapioController.init();
});

const CardapioService = {
  getDadosEmpresa: (cb) => app.get('/empresa', cb),
  getCategorias: (cb) => app.get('/categoria', cb),
  getProdutos: (cb) => app.get('/produto', cb),
};

const CardapioView = {};

const CardapioController = {
  init: () => {
    CardapioController.obterDadosEmpresa();
    CardapioController.obterCategorias();
  },

  obterDadosEmpresa: () => {
    CardapioService.getDadosEmpresa(
      (res) => {
        if (res.status == 'error') {
          app.mensagem(res.message);
          return;
        }
        CardapioController.preencherDadosEmpresa(res.data[0]);
      },
      (status, error) => {
        app.mensagem('Erro ao obter dados da empresa. Atualize a página.');
        console.log('Erro ' + status + ': ' + error);
      },
      true,
    );
  },

  preencherDadosEmpresa: (data) => {
    document.getElementById('lblNomeEmpresa').innerText = data.nome;

    if (data.logotipo && data.logotipo != 'null') {
      document.getElementById(
        'imgLogoEmpresa',
      ).style.backgroundImage = `url('/public/images/empresa/${data.logotipo}')`;
      document.getElementById('imgLogoEmpresa').style.backgroundSize = 'cover';
    } else {
      document.getElementById(
        'imgLogoEmpresa',
      ).style.backgroundImage = `url('/public/images/default.jpg')`;
      document.getElementById('imgLogoEmpresa').style.backgroundSize = 'cover';
    }
  },

  obterCategorias: () => {
    CardapioService.getCategorias(
      (res) => {
        if (res.status == 'error') {
          app.mensagem(res.message);
          return;
        }
        CardapioController.preencherDadosCategorias(res.data);
      },
      (status, error) => {
        app.mensagem('Erro ao obter categorias. Atualize a página.');
        console.log('Erro ' + status + ': ' + error);
      },
      true,
    );
  },

  preencherDadosCategorias: (lista) => {
    document.getElementById('listaCategorias').innerHTML = '';
    document.getElementById('listaItensCardapio').innerHTML = '';
    if (lista.length == 0) {
      return;
    }

    lista.forEach((e, i) => {
      let active = '';

      let icone = ICONES.filter((ic) => {
        return ic.name == e.icone;
      });

      let iconeCategoria = icone.length > 0 ? icone[0].icon : '';
      if (i == 0) {
        active = 'active';
      }

      let temp = CardapioTemplate.categoria(
        e.idcategoria,
        iconeCategoria,
        e.nome,
        active,
      );

      document.getElementById('listaCategorias').innerHTML += temp;

      let tempHeader = CardapioTemplate.headerCategoria()
        .replace('${idcategoria}', e.idcategoria)
        .replace('${nome}', e.nome);

      document.getElementById('listaItensCardapio').innerHTML += tempHeader;

      if (lista.length == i + 1) {
        CardapioController.obterProdutos();
        document.addEventListener('scroll', (event) => {
          CardapioController.validarCategoriaScroll();
        });
      }
    });
  },

  obterProdutos: () => {
    CardapioService.getProdutos(
      (res) => {
        if (res.status == 'error') {
          app.mensagem(res.message);
          return;
        }
        CardapioController.preencherDadosProdutos(res.data);
      },
      (status, error) => {
        console.log('Erro ' + status + ': ' + error);
      },
      true,
    );
  },

  preencherDadosProdutos: (lista) => {
    if (lista.length == 0) {
      return;
    }

    lista.forEach((e, i) => {
      let _imagem = e.imagem;
      if (e.imagem == null || e.imagem == 'null' || e.imagem == '') {
        _imagem = 'default.jpg';
      }

      let temp = CardapioTemplate.produto()
        .replace('${idproduto}', e.idproduto)
        .replace('${nome}', e.nome)
        .replace('${imagem}', _imagem)
        .replace('${descricao}', e.descricao)
        .replace('${valor}', e.valor.replace('.', ','));

      document.getElementById('categoria-header-' + e.idcategoria).innerHTML +=
        temp;
    });
  },

  abrirProduto: (id) => {
    window.location.href = `/item.html?idproduto=${id}`;
  },

  validarCategoriaScroll: () => {
    var categorias = document
      .getElementById('listaItensCardapio')
      .getElementsByClassName('container-grup');

    for (let index = 0; index < categorias.length; index++) {
      let element = categorias[index].getAttribute('id');

      let docViewTop = window.scrollY;
      let elemTop = document.getElementById(element).offsetTop;
      let top = (elemTop - (docViewTop + 150)) * -1;
      let id = element.split('categoria-header-')[1];

      if (top > 0) {
        Array.from(document.querySelectorAll('.item-categoria')).forEach((e) =>
          e.classList.remove('active'),
        );
        document.querySelector('#categoria-' + id).classList.add('active');
      }
    }
  },

  selecionarCategoria: (idcategoria) => {
    Array.from(document.querySelectorAll('.item-categoria')).forEach((e) =>
      e.classList.remove('active'),
    );
    document.querySelector('#categoria-' + idcategoria).classList.add('active');

    window.scrollTo({
      top:
        document.getElementById('categoria-header-' + idcategoria).offsetTop -
        100,
      behavior: 'smooth',
    });
  },
};

const CardapioTemplate = {
  categoria: (idcategoria, iconeCategoria, nome, active) => {
    return `<a href="#!" id="categoria-${idcategoria}" class="item-categoria btn btn-white btn-sm mb-3 ${active}" onclick="cardapio.selecionarCategoria('${idcategoria}')">
          ${iconeCategoria} ${nome}
        </a>`;
  },
  headerCategoria: () => {
    return ` <div class="container-grup mb-5" id="categoria-header-\${idcategoria}">
        <p class="title-categoria"><b>\${nome}</b></p>
        </div>`;
  },

  produto: () => {
    return `<div class="card mb-2 item-cardapio" onclick="cardapio.abrirProduto('\${idproduto}')">
          <div class="d-flex">
            <div
              class="container-img-produto"
              style="
                background-image: url('/public/images/cardapio/\${imagem}');
                background-size: cover;
              "
            ></div>
            <div class="infos-produto">
              <p class="name"><b>\${nome}</b></p>
              <p class="description">
                \${descricao}
              </p>
              <p class="price"><b>R$ \${valor}</b></p>
            </div>
          </div>
        </div>`;
  },
};

window.cardapio = {
  selecionarCategoria: CardapioController.selecionarCategoria,
  abrirProduto: CardapioController.abrirProduto,
};

$(document).ready(function () {
  CardapioController.init();
});

// Referências Globais de Instância
const MODAL_UPLOAD = new bootstrap.Modal(
  document.getElementById('modalUpload'),
);

var CATEGORIA_ID = 0;
var PRODUTO_ID = 0;

// --- 1. HELPERS: Formatação e Lógica de Apoio ---
const CardapioHelpers = {
  formatarMoeda: (valor) => {
    return parseFloat(valor || 0)
      .toFixed(2)
      .replace('.', ',');
  },

  obterEstiloImagem: (imagem) => {
    const pastaCardapio = '/public/images/cardapio/';
    const pastaDefault = '/public/images/';
    const imagemValida =
      imagem !== null &&
      imagem !== undefined &&
      String(imagem).trim() !== '' &&
      String(imagem) !== 'null';

    const fotoFinal = imagemValida
      ? `${pastaCardapio}${imagem}`
      : `${pastaDefault}default.jpg`;

    return `style="background-image: url('${fotoFinal}'); background-size: cover; background-position: center;"`;
  },
};

// --- 2. SERVICE: Camada de Comunicação com API ---
const CardapioService = {
  getCategorias: (cb) => app.get('/categoria', cb),
  postCategoria: (dados, cb) =>
    app.post('/categoria', JSON.stringify(dados), cb),
  postOrdenarCategoria: (dados, cb) =>
    app.post('/categoria/ordenar', JSON.stringify(dados), cb),
  postOrdenarProdutos: (dados, cb) =>
    app.post('/produto/ordenar', JSON.stringify(dados), cb),
  getProdutos: (idcategoria, cb) =>
    app.get('/produto/categoria/' + idcategoria, cb),
  postProduto: (dados, cb) => app.post('/produto', JSON.stringify(dados), cb),
  postUploadImagemProduto: (formData, cb) =>
    app.upload('/image/produto/upload/' + PRODUTO_ID, formData, cb),
  postRemoveImagemProduto: (dados, cb) =>
    app.post('/image/produto/remove', JSON.stringify(dados), cb),
  postRemoverProduto: (dados, cb) =>
    app.post('/produto/remove', JSON.stringify(dados), cb),
  postDuplicarProduto: (dados, cb) =>
    app.post('/produto/duplicar', JSON.stringify(dados), cb),
  postRemoverCategoria: (dados, cb) =>
    app.post('/categoria/remove', JSON.stringify(dados), cb),
};

// --- 3. VIEW: Camada de Manipulação do DOM ---
const CardapioView = {
  elements: {
    dropArea: document.getElementById('drop-area'),
  },

  renderCategorias: (lista) => {
    const $menu = $('#categoriasMenu');
    $menu.html('');

    if (!lista || lista.length === 0) return;

    const html = lista
      .map((e) => {
        const iconeObj = ICONES.find((elemt) => elemt.name === e.icone);
        return CardapioTemplates.categoria()
          .replace(/\${id}/g, e.idcategoria)
          .replace(/\${titulo}/g, e.nome)
          .replace(/\${icone}/g, iconeObj ? iconeObj.icon : '');
      })
      .join('');

    $menu.append(html);
    $('[data-toggle="tooltip"]').tooltip();
  },

  renderProdutos: (idcategoria, lista) => {
    const $container = $(`#listaProdutos-${idcategoria}`);
    $container.html('');

    if (!lista || lista.length === 0) {
      $container.html(
        '<p class="mb-0 mt-1" style="font-size: 12px;">Nenhum produto encontrado nesta categoria.</p>',
      );
      return;
    }

    const html = lista
      .map((e) => {
        const temImagem =
          e.imagem && e.imagem !== 'null' && e.imagem.trim() !== '';
        return CardapioTemplates.produtos()
          .replace(/\${id}/g, e.idproduto)
          .replace(/\${imagem}/g, CardapioHelpers.obterEstiloImagem(e.imagem))
          .replace(/\${nome}/g, e.nome)
          .replace(/\${descricao}/g, e.descricao || 'Sem descrição')
          .replace(/\${valor}/g, CardapioHelpers.formatarMoeda(e.valor))
          .replace(/\${idcategoria}/g, idcategoria)
          .replace(/\${btnEditar}/g, temImagem ? 'hidden' : '')
          .replace(/\${btnRemover}/g, temImagem ? '' : 'hidden');
      })
      .join('');

    $container.append(html);
    $container.find('[data-toggle="tooltip"]').tooltip();
    $('#listaProdutos-' + idcategoria).sortable({
      scroll: false,
      update: () => CardapioController.atualizarOrdemProduto(idcategoria),
      handle: '.drag-icon-produto',
    });
  },
};

// --- 4. CONTROLLER: Regras de Negócio ---
const CardapioController = {
  state: { dados: [] },

  init: () => {
    app.validaToken();
    app.carregarDadosEmpresa();

    $('#categoriasMenu').sortable({
      scroll: false,
      update: () => CardapioController.atualizarOrdemCategoria(),
      handle: '.drag-icon',
    });

    $('.money').mask('#.##0,00', { reverse: true });

    CardapioController.obterCategorias();
    CardapioController.carregarListaIcones();
    CardapioController.setupDragAndDrop();
  },

  obterCategorias: () => {
    CardapioService.getCategorias((response) => {
      if (response.status === 'error') return app.mensagem(response.message);
      CardapioController.state.dados = response.data;
      CardapioView.renderCategorias(response.data);
    });
  },

  // obterCategoriasAtivas: () => {
  //   CardapioService.getCategorias((response) => {
  //     if (response.status === 'error') return app.mensagem(response.message);
  //     const categoriasAtivas = response.data.filter((cat) => cat.ativa === 1);
  //     CardapioController.state.dados = categoriasAtivas;
  //     CardapioView.renderCategorias(categoriasAtivas);
  //   });
  // },

  obterProdutosCategoria: (idcategoria, forcar = false) => {
    const container = $(`#listaProdutos-${idcategoria}`);

    if (container.children().length > 0 && !forcar) return;

    CardapioService.getProdutos(idcategoria, (response) => {
      if (response.status === 'error') {
        container.html('');
        return app.mensagem(response.message);
      }
      CardapioView.renderProdutos(idcategoria, response.data);
    });
  },

  salvarCategoria: () => {
    const icone = $('#ddlIconeCategoria').val();
    const nome = $('#txtNomeCategoria').val().trim();

    if (icone == '-1') return app.mensagem('Selecione um ícone.');
    if (!nome) return app.mensagem('Informe o nome da categoria.');

    const dados = { icone, nome, idcategoria: CATEGORIA_ID };

    CardapioService.postCategoria(dados, (response) => {
      $('#modalCategoria').modal('hide');
      if (response.status === 'error') return app.mensagem(response.message);

      app.mensagem(response.message, 'green');
      CardapioController.obterCategorias();
    });
  },

  atualizarOrdemCategoria: () => {
    let categorias = [];
    $('#categoriasMenu')
      .children()
      .each((i, e) => {
        categorias.push({
          idcategoria: $(e).attr('data-idcategoria'),
          ordem: i + 1,
        });
      });

    CardapioService.postOrdenarCategoria(categorias, (response) => {
      if (response.status === 'error') return app.mensagem(response.message);
      app.mensagem(response.message, 'green');
    });
  },

  carregarListaIcones: () => {
    const $ddl = $('#ddlIconeCategoria');
    ICONES.forEach((e) => {
      $ddl.append(`<option value="${e.name}">${e.unicode}</option>`);
    });
  },

  editarCategoria: (idcategoria) => {
    CATEGORIA_ID = idcategoria;
    const cat = CardapioController.state.dados.find(
      (e) => e.idcategoria == idcategoria,
    );

    if (cat) {
      $('#ddlIconeCategoria').val(cat.icone);
      $('#txtNomeCategoria').val(cat.nome);
      $('#modalCategoria').modal('show');
    }
  },

  abrirModalAdicionarCategoria: () => {
    CATEGORIA_ID = 0;
    $('#ddlIconeCategoria').val('-1');
    $('#txtNomeCategoria').val('');
    $('#modalCategoria').modal({ backdrop: 'static' });
    $('#modalCategoria').modal('show');
  },

  // ------ Produto ------

  atualizarOrdemProduto: (idcategoria) => {
    let produtos = [];
    $(`#listaProdutos-${idcategoria}`)
      .children()
      .each((i, e) => {
        produtos.push({
          idproduto: $(e).attr('data-idproduto'),
          ordem: i + 1,
        });
      });

    if (produtos.length === 0) return;

    CardapioService.postOrdenarProdutos(produtos, (response) => {
      if (response.status === 'error') return app.mensagem(response.message);
      app.mensagem(response.message, 'green');
    });
  },

  abrirModalAdicionarProduto: (idcategoria) => {
    CATEGORIA_ID = idcategoria;
    PRODUTO_ID = 0;

    $('#txtNomeProduto').val('');
    $('#txtValorProduto').val('');
    $('#txtDscricaoProduto').val('');

    $('#modalProduto').modal({ backdrop: 'static' });
    $('#modalProduto').modal('show');
  },

  editarProduto: (idcategoria, idproduto) => {
    CATEGORIA_ID = idcategoria;
    PRODUTO_ID = idproduto;

    const card = $(`.card[data-idproduto="${idproduto}"]`);
    const nome = card.find('.name b').text();
    const descricao = card.find('.description').text().trim();
    const valorBruto = card.find('.price b').text().replace('R$ ', '').trim();
    const valor = CardapioHelpers.formatarMoeda(valorBruto);

    $('#txtNomeProduto').val(nome);
    $('#txtValorProduto').val(valor);
    $('#txtDscricaoProduto').val(
      descricao === 'Sem descrição' ? '' : descricao,
    );

    $('#modalProduto').modal({ backdrop: 'static' });
    $('#modalProduto').modal('show');
  },

  salvarProduto: () => {
    const nome = $('#txtNomeProduto').val().trim();
    const descricao = $('#txtDscricaoProduto').val().trim();

    let valorInput = $('#txtValorProduto').val();
    let valorParaBanco = parseFloat(
      valorInput.replace(/\./g, '').replace(',', '.'),
    );

    if (!nome) return app.mensagem('Informe o nome do produto.');
    if (isNaN(valorParaBanco) || valorParaBanco <= 0)
      return app.mensagem('Informe um valor válido.');

    const dados = {
      idcategoria: CATEGORIA_ID,
      idproduto: PRODUTO_ID,
      nome: nome,
      valor: valorParaBanco, // Enviamos o número puro para a API
      descricao: descricao,
    };

    CardapioService.postProduto(dados, (response) => {
      $('#modalProduto').modal('hide');
      if (response.status === 'error') return app.mensagem(response.message);

      app.mensagem(response.message, 'green');
      CardapioController.obterProdutosCategoria(CATEGORIA_ID, true);
    });
  },

  setupDragAndDrop: () => {
    const area = CardapioView.elements.dropArea;
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach((n) => {
      area.addEventListener(n, (e) => {
        e.preventDefault();
        e.stopPropagation();
      });
    });
    area.addEventListener('drop', (e) =>
      CardapioController.uploadImagemProduto(e.dataTransfer.files),
    );
  },

  abrirModalEditarImagemProduto: (idcategoria, idproduto) => {
    CATEGORIA_ID = idcategoria;
    PRODUTO_ID = idproduto;
    $('#fileElem').val('');
    MODAL_UPLOAD.show();
  },

  abrirModalRemoverImagemProduto: (idcategoria, idproduto) => {
    CATEGORIA_ID = idcategoria;
    PRODUTO_ID = idproduto;

    $('#abrirModalRemoverImagemProduto').modal({ backdrop: 'static' });
    $('#abrirModalRemoverImagemProduto').modal('show');
  },

  uploadImagemProduto: (files) => {
    MODAL_UPLOAD.hide();
    const formData = new FormData();
    const file = files
      ? files[0]
      : document.querySelector('#fileElem').files[0];
    formData.append('image', file);

    CardapioService.postUploadImagemProduto(formData, (res) => {
      if (res.status === 'error') return app.mensagem(res.message);
      app.mensagem(res.message, 'green');
      CardapioController.obterProdutosCategoria(CATEGORIA_ID, true);
    });
  },

  removeImagemProduto: () => {
    $('#abrirModalRemoverImagemProduto').modal('hide');
    const data = { idproduto: PRODUTO_ID };
    CardapioService.postRemoveImagemProduto(data, (res) => {
      if (res.status === 'error') return app.mensagem(res.message);
      app.mensagem(res.message, 'green');
      CardapioController.obterProdutosCategoria(CATEGORIA_ID, true);
    });
  },

  abrirModalRemoverProduto: (idcategoria, idproduto) => {
    CATEGORIA_ID = idcategoria;
    PRODUTO_ID = idproduto;

    $('#modalRemoverProduto').modal('show');
  },

  removerProduto: () => {
    $('#modalRemoverProduto').modal('hide');
    const data = { idproduto: PRODUTO_ID };
    CardapioService.postRemoverProduto(data, (res) => {
      if (res.status === 'error') return app.mensagem(res.message);
      app.mensagem(res.message, 'green');
      CardapioController.obterProdutosCategoria(CATEGORIA_ID, true);
    });
  },

  abrirModalDuplicarProduto: (idcategoria, idproduto) => {
    CATEGORIA_ID = idcategoria;
    PRODUTO_ID = idproduto;

    $('#modalDuplicarProduto').modal({ backdrop: 'static' });
    $('#modalDuplicarProduto').modal('show');
  },

  duplicarProduto: () => {
    $('#modalDuplicarProduto').modal('hide');
    const data = { idproduto: PRODUTO_ID };
    CardapioService.postDuplicarProduto(data, (res) => {
      if (res.status === 'error') return app.mensagem(res.message);
      app.mensagem(res.message, 'green');
      CardapioController.obterProdutosCategoria(CATEGORIA_ID, true);
    });
  },

  modalRemoverCategoria: (idcategoria) => {
    CATEGORIA_ID = idcategoria;
    $('#modalRemoverCategoria').modal('show');
  },

  removerCategoria: () => {
    $('#modalRemoverCategoria').modal('hide');
    const data = { idcategoria: CATEGORIA_ID };
    CardapioService.postRemoverCategoria(data, (res) => {
      if (res.status === 'error') return app.mensagem(res.message);
      app.mensagem(res.message, 'green');
      CardapioController.obterCategorias();
    });
  },
};

// --- 5. TEMPLATES ---
const CardapioTemplates = {
  categoria: () => ` <div class="card mt-3" data-idcategoria="\${id}">
                      <div class="card-drag" id="heading-\${id}">
                        <div class="drag-icon">
                          <i class="fas fa-ellipsis-v"></i>
                          <i class="fas fa-ellipsis-v"></i>
                        </div>

                        <div class="infos">
                          <a
                            href="#!"
                            class="name mb-0"
                            data-bs-toggle="collapse"
                            data-bs-target="#collapse-\${id}"
                            aria-expanded="true"
                            aria-controls="collapse-\${id}"
                            onclick="cardapio.obterProdutosCategoria('\${id}')"
                          >
                            <span class="me-2"
                              >\${icone}</span>
                            <b>\${titulo}</b>
                          </a>
                        </div>

                        <div class="actions">
                          <a href="#!" class="icon-action" data-toggle="tooltip" data-placement="top" title="Editar" 
                          onclick="cardapio.editarCategoria('\${id}')">
                            <i class="fas fa-pencil-alt"></i>
                          </a>


                          <a href="#!" class="icon-action" data-toggle="tooltip" data-placement="top" title="Remover" 
                          onclick="cardapio.modalRemoverCategoria('\${id}')">
                            <i class="fas fa-trash-alt"></i>
                          </a>
                        </div>
                      </div>

                      <div
                        id="collapse-\${id}"
                        class="collapse"
                        data-parent="#categoriasMenu"
                      >
                        <div class="card-body">
                          <p class="title-produtos mb-0"><b>Produtos</b></p>

                          <div class="lista-produtos" id="listaProdutos-\${id}">
                          
                          </div>

                          <div class="card card-select mt-3" onclick="cardapio.abrirModalAdicionarProduto('\${id}')">
                            <div class="infos-produto-opcional">
                              <p class="mb-0 color-primary">
                                <i class="fas fa-plus-circle"></i>&nbsp;
                                Adicionar novo produto
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>`,

  produtos: () => `  <div class="card mt-3 pl-0" data-idproduto="\${id}">
                              <div class="d-flex">
                                <div class="drag-icon-produto">
                                  <i class="fas fa-ellipsis-v"></i>
                                  <i class="fas fa-ellipsis-v"></i>
                                </div>

                                <div
                                  class="container-img-produto"
                                  \${imagem}             
                                >
                                         <a id="btn-editar-imagem-\${id}" onclick="cardapio.abrirModalEditarImagemProduto('\${idcategoria}','\${id}')" href="#!"
                                            class="icon-action me-1 mb-1 \${btnEditar}" data-bs-toggle="tooltip"
                                            data-bs-placement="top" title="Editar">
                                            <i class="fas fa-pencil-alt"></i>
                                        </a>
                                        <a id="btn-remover-imagem-\${id}" onclick="cardapio.abrirModalRemoverImagemProduto('\${idcategoria}','\${id}')" href="#!"
                                            class="icon-action me-1 mb-1 \${btnRemover}" data-bs-toggle="tooltip"
                                            data-bs-placement="top" title="Remover">
                                            <i class="fas fa-trash-alt"></i>
                                        </a>
                                </div>

                                <div class="infos-produto">
                                  <p class="name"><b>\${nome}</b></p>
                                  <p class="description">
                                    \${descricao}
                                  </p>
                                  <p class="price"><b>R$ \${valor}</b></p>
                                </div>

                                <div class="actions">
                                  <a href="#!" class="icon-action">
                                    <span class="badge-adicionais">2</span>
                                    <i class="fas fa-layer-group"></i>
                                  </a>

                                 <a href="#!" class="icon-action" data-toggle="tooltip" data-placement="top" title="Editar" 
                          onclick="cardapio.editarProduto('\${idcategoria}','\${id}')">
                            <i class="fas fa-pencil-alt"></i>
                          </a>

                          <a href="#!" class="icon-action" data-toggle="tooltip" data-placement="top" title="Duplicar" 
                          onclick="cardapio.abrirModalDuplicarProduto('\${idcategoria}','\${id}')">
                            <i class="far fa-copy"></i>
                          </a>

                          <a href="#!" class="icon-action" data-toggle="tooltip" data-placement="top" title="Remover" 
                          onclick="cardapio.abrirModalRemoverProduto('\${idcategoria}','\${id}')">
                            <i class="fas fa-trash-alt"></i>
                          </a>
                                </div>
                              </div>
                            </div>`,
};

// Interface Global para Onclick do HTML
window.cardapio = {
  abrirModalAdicionarCategoria: CardapioController.abrirModalAdicionarCategoria,
  editarCategoria: CardapioController.editarCategoria,
  salvarCategoria: CardapioController.salvarCategoria,
  obterProdutosCategoria: CardapioController.obterProdutosCategoria,
  abrirModalAdicionarProduto: CardapioController.abrirModalAdicionarProduto,
  salvarProduto: CardapioController.salvarProduto,
  editarProduto: CardapioController.editarProduto,
  uploadImagemProduto: CardapioController.uploadImagemProduto,
  removeImagemProduto: CardapioController.removeImagemProduto,
  abrirModalRemoverImagemProduto:
    CardapioController.abrirModalRemoverImagemProduto,
  abrirModalEditarImagemProduto:
    CardapioController.abrirModalEditarImagemProduto,
  abrirModalRemoverProduto: CardapioController.abrirModalRemoverProduto,
  removerProduto: CardapioController.removerProduto,
  abrirModalDuplicarProduto: CardapioController.abrirModalDuplicarProduto,
  duplicarProduto: CardapioController.duplicarProduto,
  modalRemoverCategoria: CardapioController.modalRemoverCategoria,
  removerCategoria: CardapioController.removerCategoria,
};

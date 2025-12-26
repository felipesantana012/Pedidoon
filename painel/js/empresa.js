document.addEventListener("DOMContentLoaded", function(event) {
    empresa.event.init();
});

var empresa = {};
var DADOS_EMPRESA = {};
var MODAL_UPLOAD = new bootstrap.Modal(document.getElementById('modalUpload'));

var DROP_AREA = document.getElementById('drop-area');

empresa.event = {
    init: () => {
        app.method.validaToken();
        app.method.carregarDadosEmpresa();

       var tooltipList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
         tooltipList.map(function (element) {
                new bootstrap.Tooltip(element);
          });
        
        empresa.method.openTab('sobre');
        
        //Previne os comportamentos padroes do navegador
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            DROP_AREA.addEventListener(eventName, empresa.method.preventDefaults, false);
            document.body.addEventListener(eventName, empresa.method.preventDefaults, false);
        });

        //Evento quando passa o mouse em cima com a imagem segurada
         ['dragenter', 'dragover'].forEach(eventName => {
            DROP_AREA.addEventListener(eventName, empresa.method.highligtht, false);
        });

        //Evento quando sai com o mouse de cima
         ['dragleave', 'drop'].forEach(eventName => {
            DROP_AREA.addEventListener(eventName, empresa.method.unhighligtht, false);
        });

        //Evento quando solta a imagem na area
        DROP_AREA.addEventListener('drop', empresa.method.handleDrop, false);

        //inicializa a mascara de cep
       $('.cep').mask('00000-000');
        

    }
},

empresa.method = {

    openTab:(tab) => {
        Array.from(document.querySelectorAll(".tab-content")).forEach(e => e.classList.remove("active"));
         Array.from(document.querySelectorAll(".tab-item")).forEach(e => e.classList.add("hidden"));

        document.querySelector("#tab-" + tab).classList.add("active");
        document.querySelector("#" + tab).classList.remove("hidden");

        switch (tab) {
        case 'sobre':
                empresa.method.obterDados();
                break;
        case 'endereco':
                empresa.method.obterDados();
                break;
        case 'horario':
                empresa.method.obterHorarios();    
                break;
            default:
                break;
        }
    },

    obterDados:() => {
        app.method.get('/empresa/sobre',
        (response)=>{
            if (response.status == 'error') {
                app.method.mensagem(response.message);
                return;       
            }
            let empresa = response.data[0];
            DADOS_EMPRESA = empresa;
            
            if(empresa.logotipo != null && empresa.logotipo != '') {
                document.getElementById("img-empresa").style.backgroundImage = `url('../public/images/empresa/${empresa.logotipo}')`;
                document.getElementById("img-empresa").style.backgroundSize = '70%';
                document.getElementById("btn-editar-logo").classList.add('hidden');
                document.getElementById("btn-remover-logo").classList.remove('hidden');
            }else{
                document.getElementById("img-empresa").style.backgroundImage = `url('../public/images/default.jpg')`;
                document.getElementById("img-empresa").style.backgroundSize = 'cover';
                document.getElementById("btn-editar-logo").classList.remove('hidden');
                document.getElementById("btn-remover-logo").classList.add('hidden');
            }
            document.getElementById("txtNomeEmpresa").value = empresa.nome;
            document.getElementById("txtSobreEmpresa").innerHTML = empresa.sobre.replace(/\n/g, '\r\n');

            document.getElementById("txtCEP").value = empresa.cep;
            document.getElementById("txtRua").value = empresa.rua;
            document.getElementById("txtNumero").value = empresa.numero;
            document.getElementById("txtComplemento").value = empresa.complemento;
            document.getElementById("txtBairro").value = empresa.bairro;
            document.getElementById("txtCidade").value = empresa.cidade;
            document.getElementById("ddlUF").value = empresa.estado.toUpperCase();

        },
        (error)=>{
            console.log(error);
        }
        );
    },

    salvarDadosSobre:() => {
        let nome = document.getElementById("txtNomeEmpresa").value.trim();
        let sobre = document.getElementById("txtSobreEmpresa").value.trim();

        if(nome.length <=0 || nome == '') {
            app.method.mensagem('O nome da empresa é obrigatório.');
            document.getElementById("txtNomeEmpresa").focus();
            return;
        }

        let dados = {
            nome: nome,
            sobre: sobre
        };

        app.method.loading(true);
        app.method.post('/empresa/sobre', JSON.stringify(dados),
        (response) => {
            app.method.loading(false);
            if (response.status == 'error') {
                app.method.mensagem(response.message);
                return;       
            }
            app.method.mensagem(response.message, 'green');
            app.method.gravarValorStorage({ ...app.method.obterValorStorage(), nome: nome
            });
            empresa.method.obterDados();
            app.method.carregarDadosEmpresa();
        },
        (error) => {
            console.log('Error', error);
            app.method.loading(false);
        });
    },

    uploadLogo:(logoUpload=[]) => {
        MODAL_UPLOAD.hide();
        
        var formData = new FormData();
        if(logoUpload != undefined){
            formData.append('image', logoUpload[0]);
        }else{
            formData.append('image', document.querySelector('#fileElem').files[0]);
        }

        app.method.loading(true);

         app.method.upload('/image/logo/upload', formData,
        (response)=>{
            app.method.loading(false);
            if (response.status == 'error') {
                app.method.mensagem(response.message);
                return;       
            }

             app.method.mensagem(response.message, 'green');
              app.method.gravarValorStorage({ ...app.method.obterValorStorage(), logo: response.logotipo
            });
            empresa.method.obterDados();
            app.method.carregarDadosEmpresa();

        },
        (error)=>{
            console.log(error);
            app.method.loading(false);
        }
        );

    },
    removerLogo:() => {
        var data = {
            imagem : DADOS_EMPRESA.logotipo
        }

        app.method.loading(true);

         app.method.post('/image/logo/remove', JSON.stringify(data),
        (response)=>{
            app.method.loading(false);
            if (response.status == 'error') {
                app.method.mensagem(response.message);
                return;       
            }

            app.method.mensagem(response.message, 'green');
            app.method.removerSessao('logo');
            empresa.method.obterDados();
            app.method.carregarDadosEmpresa();

        },
        (error)=>{
            console.log(error);
            app.method.loading(false);
        }
        );

    },

    openModalLogo:() => {
        MODAL_UPLOAD.show();
    },

    preventDefaults:(e) => {
        e.preventDefault();
        e.stopPropagation();
    },

    highligtht:(e) => {
        if (!DROP_AREA.classList.contains('highlight')) {
            DROP_AREA.classList.add('highlight');
        }
    },
    unhighligtht:(e) => {
        DROP_AREA.classList.remove('highlight');
    },
    handleDrop:(e) => {
        let dt = e.dataTransfer;
        let files = dt.files;

        empresa.method.uploadLogo(files);
    },


    buscarCep:()=>{
        let cep = document.getElementById("txtCEP").value.replace(/\D/g, '');
        if (cep.length != 8) {
            app.method.mensagem('CEP inválido. O CEP deve conter 8 dígitos.');
            document.getElementById("txtCEP").focus();
            return;
        }

        app.method.loading(true);
        fetch(`https://viacep.com.br/ws/${cep}/json/`)
        .then(response => response.json())
        .then(data => {
            app.method.loading(false);
            if (data.erro) {
                app.method.mensagem('CEP não encontrado.');
                return;
            }
            document.getElementById("txtRua").value = data.logradouro;
            document.getElementById("txtBairro").value = data.bairro;
            document.getElementById("txtCidade").value = data.localidade;
            document.getElementById("ddlUF").value = data.uf;
            document.getElementById("txtNumero").focus();
            document.getElementById("txtNumero").value = "";
            
        })
        .catch(error => {
            console.error('Erro ao buscar CEP:', error);
            app.method.loading(false);
            app.method.mensagem('Erro ao buscar CEP. Tente novamente mais tarde.');
        });
    },

    salvarDadosEndereco:() => {

        let newEndereco = {
            cep: document.getElementById("txtCEP").value.trim(),
            rua: document.getElementById("txtRua").value.trim(),
            numero: document.getElementById("txtNumero").value.trim(),
            complemento: document.getElementById("txtComplemento").value.trim(),
            bairro: document.getElementById("txtBairro").value.trim(),
            cidade: document.getElementById("txtCidade").value.trim(),
            estado: document.getElementById("ddlUF").value.toUpperCase().trim()
        };
        

        for (const key in newEndereco) {
            if (newEndereco[key].length <=0 || newEndereco[key] == '' || newEndereco[key] == -1) {
                app.method.mensagem(`O campo ${key.charAt(0).toUpperCase() + key.slice(1)} é obrigatório.`);
                document.getElementById("txt" + key.charAt(0).toUpperCase() + key.slice(1)).focus();
                return;
            }
        }
        app.method.loading(true);
        app.method.post('/empresa/endereco', JSON.stringify(newEndereco),
        (response) => {
            app.method.loading(false);
            if (response.status == 'error') {
                app.method.mensagem(response.message);
                return;       
            }
            app.method.mensagem(response.message, 'green');
            app.method.carregarDadosEmpresa();
        },
        (error) => {
            console.log('Error', error);
            app.method.loading(false);
        });
    },


    obterHorarios:()=> {
        
    }

}
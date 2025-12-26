const SESSION_KEY = "sessao_pedidoon";

var app = {}

app.event = {}

app.method = {

get: (url, callbackSuccess, callbackError, login = false) => {

    try {
        app.method.loading(true);
        if(app.method.validaToken(login)){
            let xhr = new XMLHttpRequest();
            xhr.open("GET", url);
            xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
            const sessao = app.method.obterValorStorage();
                const token = sessao ? sessao.token : '';
                xhr.setRequestHeader("Authorization", "Bearer " + token);

            xhr.onreadystatechange = function() {
                if(this.readyState == 4){
                    app.method.loading(false);
                    if(this.status == 200 ){
                       return callbackSuccess(JSON.parse(this.responseText));
                    } else {
                        if(this.status === 401){
                            app.method.logout(); 
                        }

                        return callbackError(this.status, this.responseText);
                    }
                }

        }
        xhr.send();
    }
        
    } catch (error) {
        app.method.loading(false);
        return callbackError(error);
    }    

},


post: (url, dados, callbackSuccess, callbackError, login = false) => {

    try {
        app.method.loading(true);
        if(app.method.validaToken(login)){
            let xhr = new XMLHttpRequest();
            xhr.open("POST", url);
            xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
            const sessao = app.method.obterValorStorage();
                const token = sessao ? sessao.token : '';
                xhr.setRequestHeader("Authorization", "Bearer " + token);

            xhr.onreadystatechange = function() {
                if(this.readyState == 4){
                    app.method.loading(false);
                    if(this.status == 200 ){
                       return callbackSuccess(JSON.parse(this.responseText));
                    } else {
                        if(this.status === 401){
                            app.method.logout(); 
                        }

                        return callbackError(this.status, this.responseText);
                    }
                }

        }
        xhr.send(dados);
    }
        
    } catch (error) {
        app.method.loading(false);
        return callbackError(error);
    }    

},

upload: (url, dados, callbackSuccess, callbackError, login = false) => {

    try {
        app.method.loading(true);
        if(app.method.validaToken(login)){
            let xhr = new XMLHttpRequest();
            xhr.open("POST", url);
            xhr.setRequestHeader("Mime-Type", "multipart/form-data");
            const sessao = app.method.obterValorStorage();
                const token = sessao ? sessao.token : '';
                xhr.setRequestHeader("Authorization", "Bearer " + token);

            xhr.onreadystatechange = function() {
                if(this.readyState == 4){
                    app.method.loading(false);
                    if(this.status == 200 ){
                       return callbackSuccess(JSON.parse(this.responseText));
                    } else {
                        if(this.status === 401){
                            app.method.logout(); 
                        }

                        return callbackError(this.status, this.responseText);
                    }
                }

        }
        xhr.send(dados);
    }
        
    } catch (error) {
        app.method.loading(false);
        return callbackError(error);
    }    

},
    

    validaToken: (login = false) => {
            const sessao = app.method.obterValorStorage();
            
            if ((!sessao || !sessao.token) && !login) {
                window.location.href = "/painel/login.html";
                return false;
            }
            return true;
        },

    gravarValorStorage:(dados) => {
        localStorage.setItem(SESSION_KEY, JSON.stringify(dados));
    },

    obterValorStorage:() => {
        const dados = localStorage.getItem(SESSION_KEY);
        return dados ? JSON.parse(dados) : null;
    },

  removerSessao: (item) => {
    // 1. Busca o objeto completo que já está no storage
    let sessao = app.method.obterValorStorage();

    // 2. Verifica se a sessão existe e se o item que você quer remover está lá
    if (sessao && sessao[item] !== undefined) {
        
        // 3. Deleta apenas a propriedade específica (ex: sessao.nome)
        delete sessao[item];

        // 4. Grava o objeto atualizado de volta no storage usando seu método existente
        app.method.gravarValorStorage(sessao);
        
        console.log(`Item '${item}' removido da sessão.`);
    }
},

    logout:() => {
        localStorage.removeItem(SESSION_KEY);
        window.location.href = "/painel/login.html";
    },

    mensagem: (texto, cor='red', tempo=3500) => {
        let container = document.getElementById('container-mensagens');

        if(container.childElementCount > 2) return;
        
        let id = Math.floor(Date.now() * Math.random()).toString();
        let msg = `<div id="msg-${id}" class="toast ${cor}">${texto}</div>`;

        container.innerHTML += msg;
        setTimeout(() => {
            document.getElementById(`msg-${id}`).remove();
        }, tempo);
    },

    loading: (mostrar = false) => {

        if(mostrar) {
            document.querySelector('.loader-full').classList.remove('hidden');
        } else {
            document.querySelector('.loader-full').classList.add('hidden');
        }
    },

    carregarDadosEmpresa: () => {
        const sessao = app.method.obterValorStorage();
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
    }


    
}


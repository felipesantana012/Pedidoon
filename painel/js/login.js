document.addEventListener("DOMContentLoaded", function(event) { 
    login.event.init();
});


var login = {};

login.event = {

    init: () => {
       document.getElementById("formLogin").addEventListener("submit", (e) => {
            e.preventDefault();
            login.method.validarLogin();
        });
    }

}

login.method = {

    validarLogin: () => {

     let email = document.getElementById("inputEmailLogin").value.trim();
     let senha = document.getElementById("inputSenhaLogin").value.trim();

     if(email.length === 0){
        app.method.mensagem("Por favor, preencha o campo de email.");
        document.getElementById("inputEmailLogin").focus();
        return;
     }
       if(senha.length === 0){
        app.method.mensagem("Por favor, preencha o campo de Senha.");
        document.getElementById("inputSenhaLogin").focus();
        return;
     }

     login.method.fazerLogin(email, senha);
    },

    fazerLogin: async (email, senha) => {

        const dados = {
            email: email,
            senha: senha
        };

       app.method.post('/login', JSON.stringify(dados), 
       (response) => {
            if(response.status === 'error'){
                app.method.mensagem(response.message);
                return;
            }

            if(response.status === 'success'){
                const dadosStorage = {
                    token: response.tokenAcesso,
                    nome: response.nome,
                    email: response.email,
                    logo: response.logo
                };
                app.method.gravarValorStorage(dadosStorage);             
                window.location.href = '/painel/home.html';
            }
       },
       (error) => {
        console.log("Erro ao realizar login: " + error);
       }, true
       );
       
    }
}


const express = require("express");
const bodyParser = require("body-parser");

const app = express();

// Configuração para a recepção de dados em JSON
app.use(bodyParser.json());

// Configuração para decodar parametros da url
app.use(bodyParser.urlencoded({ extended: false }));

/* 
    Estrutura apresentada até a aula 03
    Problema: para cada rota era necessário adicionar um novo require dentro do app.js
    Solução: Utilizar 2 libs "fs/path" para adicionar dinamicamente os novos controllers

 require('./app/controllers/authController')(app);
 require('./app/controllers/projectController')(app);

*/

require("./app/controllers/index")(app);

app.listen(8003, () => console.log("Projeto sendo executado na porta 8003"));

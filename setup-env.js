// Script para ajudar a configurar as variáveis de ambiente
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Caminho para o arquivo .env
const envPath = path.join(__dirname, '.env');

// Configurações do Firebase do projeto
const defaultConfig = {
  VITE_FIREBASE_API_KEY: "AIzaSyB6sxRPQn4UVFmM64oraRjJf9acTbP5-Ds",
  VITE_FIREBASE_AUTH_DOMAIN: "oticadavi-113e0.firebaseapp.com",
  VITE_FIREBASE_PROJECT_ID: "oticadavi-113e0",
  VITE_FIREBASE_STORAGE_BUCKET: "oticadavi-113e0.firebasestorage.app",
  VITE_FIREBASE_MESSAGING_SENDER_ID: "258252033306",
  VITE_FIREBASE_APP_ID: "1:258252033306:web:88af7cdb01236c95d670a3",
  VITE_FIREBASE_MEASUREMENT_ID: "G-B4BDGHWF70",
  VITE_APP_ENV: "production"
};

console.log('Configurando variáveis de ambiente para o projeto...');
console.log('Pressione ENTER para aceitar os valores padrão ou digite um novo valor.');

const askQuestions = async () => {
  const config = {};
  
  for (const [key, defaultValue] of Object.entries(defaultConfig)) {
    const answer = await new Promise(resolve => {
      rl.question(`${key} [${defaultValue}]: `, (answer) => {
        resolve(answer || defaultValue);
      });
    });
    
    config[key] = answer;
  }
  
  return config;
};

const writeEnvFile = (config) => {
  const envContent = Object.entries(config)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');
  
  fs.writeFileSync(envPath, envContent);
  console.log(`Arquivo .env criado em ${envPath}`);
};

const main = async () => {
  try {
    const config = await askQuestions();
    writeEnvFile(config);
    console.log('Configuração concluída com sucesso!');
  } catch (error) {
    console.error('Erro ao configurar as variáveis de ambiente:', error);
  } finally {
    rl.close();
  }
};

main();

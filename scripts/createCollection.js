// Script para criar a coleção templates_enviados no Firebase
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc } = require('firebase/firestore');

// Configuração do Firebase (mesma do seu projeto)
const firebaseConfig = {
  apiKey: "AIzaSyB6sxRPQn4UVFmM64oraRjJf9acTbP5-Ds",
  authDomain: "oticadavi-113e0.firebaseapp.com",
  projectId: "oticadavi-113e0",
  storageBucket: "oticadavi-113e0.appspot.com",
  messagingSenderId: "258252033306",
  appId: "1:258252033306:web:88af7cdb01236c95d670a3",
  measurementId: "G-B4BDGHWF70"
};

// Inicializar o Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Função para criar a coleção templates_enviados
async function createTemplateCollection() {
  try {
    console.log('Iniciando criação da coleção templates_enviados...');
    
    // Criar um documento na coleção templates_enviados
    const docRef = await addDoc(collection(db, 'templates_enviados'), {
      id_documento: 'doc123',
      id_template: 'template456',
      active: true
    });
    
    console.log('Coleção criada com sucesso!');
    console.log('Documento adicionado com ID:', docRef.id);
    
    return docRef.id;
  } catch (error) {
    console.error('Erro ao criar a coleção:', error);
    throw error;
  }
}

// Executar a função
createTemplateCollection()
  .then(() => {
    console.log('Operação concluída com sucesso!');
    // Encerrar o processo após 3 segundos
    setTimeout(() => process.exit(0), 3000);
  })
  .catch(error => {
    console.error('Falha na operação:', error);
    process.exit(1);
  });

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc } from 'firebase/firestore';

// Configuração do Firebase
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

// Função para criar a coleção e adicionar um documento
const createTemplateCollection = async () => {
  try {
    // Adicionar um documento à coleção templates_enviados
    const docRef = await addDoc(collection(db, 'templates_enviados'), {
      id_documento: 'primeiro_documento',
      id_template: 'template_teste',
      active: true
    });
    
    console.log('Documento adicionado com ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Erro ao criar coleção:', error);
    throw error;
  }
};

// Executar a função
createTemplateCollection()
  .then(id => console.log('Coleção criada com sucesso! ID do documento:', id))
  .catch(error => console.error('Falha ao criar coleção:', error));

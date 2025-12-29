// Script para deletar usuário do Firebase Authentication
// Execute com: node delete-user-script.js

const admin = require('firebase-admin');

// Inicializar Firebase Admin
const serviceAccount = require('./serviceAccountKey.json'); // Você precisa baixar isso do Firebase Console

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const email = 'oticadavicm@gmail.com';

async function deleteUser() {
  try {
    // Buscar usuário por email
    const userRecord = await admin.auth().getUserByEmail(email);
    console.log(`Usuário encontrado: ${userRecord.email} (UID: ${userRecord.uid})`);
    
    // Deletar o usuário
    await admin.auth().deleteUser(userRecord.uid);
    console.log(`✅ Usuário ${email} deletado com sucesso do Firebase Authentication!`);
    
    process.exit(0);
  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      console.log(`❌ Usuário ${email} não encontrado no Firebase Authentication`);
    } else {
      console.error('❌ Erro ao deletar usuário:', error.message);
    }
    process.exit(1);
  }
}

deleteUser();

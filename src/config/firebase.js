import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// As credenciais do Firebase devem ser movidas para variáveis de ambiente em produção
// Crie um arquivo .env na raiz do projeto com estas variáveis
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyB6sxRPQn4UVFmM64oraRjJf9acTbP5-Ds",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "oticadavi-113e0.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "oticadavi-113e0",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "oticadavi-113e0.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "258252033306",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:258252033306:web:88af7cdb01236c95d670a3",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-B4BDGHWF70"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };

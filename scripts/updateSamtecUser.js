/**
 * SCRIPT EMERGENCIAL: Atualizar usuário samtecsolucoes@gmail.com para ADMIN
 * Corrige o problema de acesso negado
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';

// Configuração Firebase (usar as mesmas credenciais do projeto)
const firebaseConfig = {
  apiKey: "AIzaSyB6sxRPQn4UVFmM64oraRjJf9acTbP5-Ds",
  authDomain: "oticadavi-113e0.firebaseapp.com",
  projectId: "oticadavi-113e0",
  storageBucket: "oticadavi-113e0.appspot.com",
  messagingSenderId: "258252033306",
  appId: "1:258252033306:web:88af7cdb01236c95d670a3",
  measurementId: "G-B4BDGHWF70"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Todas as permissões do sistema
const ALL_PERMISSIONS = [
  'users_view', 'users_create', 'users_edit', 'users_delete', 'users_manage_roles',
  'appointments_view', 'appointments_create', 'appointments_edit', 'appointments_delete',
  'appointments_view_all', 'appointments_view_own', 'appointments_manage_status',
  'doctors_view', 'doctors_create', 'doctors_edit', 'doctors_delete',
  'cities_view', 'cities_create', 'cities_edit', 'cities_delete',
  'dates_view', 'dates_create', 'dates_edit', 'dates_delete',
  'clients_view', 'clients_create', 'clients_edit', 'clients_delete',
  'financial_view', 'financial_create', 'financial_edit', 'financial_delete', 'financial_reports',
  'reports_view', 'dashboard_view', 'export_data',
  'settings_view', 'settings_edit', 'system_manage'
];

async function updateSamtecUser() {
  try {
    console.log('🔍 Procurando usuário samtecsolucoes@gmail.com...');
    
    // Buscar o usuário
    const usersRef = collection(db, 'usuarios');
    const q = query(usersRef, where("email", "==", "samtecsolucoes@gmail.com"));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.log('❌ Usuário samtecsolucoes@gmail.com não encontrado!');
      return;
    }
    
    const userDoc = querySnapshot.docs[0];
    const userData = userDoc.data();
    
    console.log('📋 Dados atuais do usuário:');
    console.log('- Email:', userData.email);
    console.log('- Role atual:', userData.role);
    console.log('- Permissões atuais:', userData.permissions?.length || 0);
    
    // Atualizar para admin com todas as permissões
    const updateData = {
      role: 'admin',
      permissions: ALL_PERMISSIONS,
      updatedAt: new Date(),
      updatedBy: 'emergency_script'
    };
    
    await updateDoc(doc(db, 'usuarios', userDoc.id), updateData);
    
    console.log('✅ USUÁRIO ATUALIZADO COM SUCESSO!');
    console.log('- Novo role: admin');
    console.log('- Permissões: ' + ALL_PERMISSIONS.length + ' (todas)');
    console.log('- Status: Acesso total e irrestrito');
    
  } catch (error) {
    console.error('❌ Erro ao atualizar usuário:', error);
  }
}

// Executar
updateSamtecUser()
  .then(() => {
    console.log('🎉 Script executado com sucesso!');
    console.log('👨‍💻 O usuário samtecsolucoes@gmail.com agora tem acesso total!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Erro na execução:', error);
    process.exit(1);
  }); 
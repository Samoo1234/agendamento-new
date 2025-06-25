import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  getDocs, 
  updateDoc, 
  doc, 
  writeBatch 
} from 'firebase/firestore';

// Configuração do Firebase (usar suas credenciais)
const firebaseConfig = {
  apiKey: "AIzaSyB6sxRPQn4UVFmM64oraRjJf9acTbP5-Ds",
  authDomain: "oticadavi-113e0.firebaseapp.com",
  projectId: "oticadavi-113e0",
  storageBucket: "oticadavi-113e0.appspot.com",
  messagingSenderId: "258252033306",
  appId: "1:258252033306:web:88af7cdb01236c95d670a3",
  measurementId: "G-B4BDGHWF70"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/**
 * Mapeamento de roles antigos para novos
 */
const ROLE_MAPPING = {
  'admin': 'admin',
  'administrador': 'admin',
  'usuario': 'receptionist',
  'user': 'receptionist',
  'manager': 'manager',
  'gerente': 'manager',
  'medico': 'doctor',
  'doctor': 'doctor',
  'financeiro': 'financial',
  'financial': 'financial'
};

/**
 * Migrar estrutura de usuários para novo sistema de roles
 */
async function migrateUserRoles() {
  console.log('🚀 Iniciando migração de roles de usuários...');
  
  try {
    // Buscar todos os usuários
    const usersSnapshot = await getDocs(collection(db, 'usuarios'));
    const batch = writeBatch(db);
    let updateCount = 0;
    
    console.log(`📊 Encontrados ${usersSnapshot.size} usuários para migrar`);
    
    usersSnapshot.docs.forEach(userDoc => {
      const userData = userDoc.data();
      const currentRole = userData.role?.toLowerCase();
      
      console.log(`\n👤 Usuário: ${userData.email || 'Email não informado'}`);
      console.log(`   Role atual: ${currentRole || 'Não definido'}`);
      
      // Determinar novo role
      let newRole = 'receptionist'; // Role padrão
      
      if (currentRole && ROLE_MAPPING[currentRole]) {
        newRole = ROLE_MAPPING[currentRole];
      } else if (userData.email?.includes('admin')) {
        newRole = 'admin';
      }
      
      // Preparar dados de atualização
      const updateData = {
        role: newRole,
        disabled: userData.disabled || false,
        lastUpdated: new Date(),
        migratedAt: new Date()
      };
      
      // Remover senha em texto plano se existir (segurança)
      if (userData.senha || userData.password) {
        console.log(`   ⚠️  REMOVENDO senha em texto plano por segurança`);
        updateData.senha = null;
        updateData.password = null;
        updateData.passwordRemoved = true;
        updateData.passwordRemovedAt = new Date();
      }
      
      console.log(`   ✅ Novo role: ${newRole}`);
      
      batch.update(doc(db, 'usuarios', userDoc.id), updateData);
      updateCount++;
    });
    
    if (updateCount > 0) {
      await batch.commit();
      console.log(`\n✅ Migração concluída! ${updateCount} usuários atualizados.`);
    } else {
      console.log('\n📝 Nenhum usuário precisou ser atualizado.');
    }
    
  } catch (error) {
    console.error('❌ Erro durante a migração:', error);
    throw error;
  }
}

/**
 * Criar usuário super admin padrão
 */
async function createSuperAdmin() {
  console.log('\n🔧 Criando usuário Super Admin padrão...');
  
  try {
    const superAdminData = {
      email: 'admin@agendamento.com',
      role: 'super_admin',
      disabled: false,
      createdAt: new Date(),
      createdBy: 'migration_script',
      // Nota: Senha deve ser definida via Firebase Auth Console
      requirePasswordReset: true
    };
    
    // Verificar se já existe
    const existingUsers = await getDocs(collection(db, 'usuarios'));
    const hasSuperAdmin = existingUsers.docs.some(doc => 
      doc.data().role === 'super_admin'
    );
    
    if (hasSuperAdmin) {
      console.log('📋 Super Admin já existe no sistema.');
      return;
    }
    
    const docRef = doc(collection(db, 'usuarios'));
    await updateDoc(docRef, superAdminData);
    
    console.log('✅ Super Admin criado com sucesso!');
    console.log('📌 IMPORTANTE:');
    console.log('   1. Defina uma senha para admin@agendamento.com no Firebase Auth Console');
    console.log('   2. O usuário deve fazer login e alterar a senha no primeiro acesso');
    
  } catch (error) {
    console.error('❌ Erro ao criar Super Admin:', error);
  }
}

/**
 * Executar migração completa
 */
async function runMigration() {
  console.log('🎯 MIGRAÇÃO DO SISTEMA DE CONTROLE DE ACESSO');
  console.log('=' * 50);
  
  try {
    await migrateUserRoles();
    await createSuperAdmin();
    
    console.log('\n🎉 MIGRAÇÃO CONCLUÍDA COM SUCESSO!');
    console.log('\n📋 PRÓXIMOS PASSOS:');
    console.log('1. ✅ Atualize as regras do Firestore');
    console.log('2. ✅ Configure senhas no Firebase Auth Console');
    console.log('3. ✅ Teste o login com diferentes roles');
    console.log('4. ✅ Ajuste permissões conforme necessário');
    
  } catch (error) {
    console.error('\n💥 FALHA NA MIGRAÇÃO:', error);
    process.exit(1);
  }
}

// Executar migração se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigration();
}

export { migrateUserRoles, createSuperAdmin, runMigration }; 
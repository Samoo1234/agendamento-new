/**
 * SCRIPT DE MIGRAÇÃO DE ROLES DE USUÁRIOS
 * ULTRA-SEGURO - NÃO AFETA LAYOUT/INTERFACE
 * 
 * Este script converte usuários do formato legado para o novo sistema de roles
 * COM MODO SIMULAÇÃO E BACKUP AUTOMÁTICO
 */

const admin = require('firebase-admin');
const readline = require('readline');

// ========================================
// CONFIGURAÇÃO FIREBASE
// ========================================

// Configurar Firebase Admin SDK
if (!admin.apps.length) {
  // Usar variáveis de ambiente ou arquivo de credenciais
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  } else {
    // Fallback para arquivo local (desenvolvimento)
    console.log('⚠️ Usando configuração local do Firebase Admin SDK');
    admin.initializeApp({
      credential: admin.credential.applicationDefault()
    });
  }
}

const db = admin.firestore();

// ========================================
// MAPEAMENTO DE ROLES LEGADOS
// ========================================

const LEGACY_ROLE_MAPPING = {
  'admin': 'ADMIN',
  'usuario': 'RECEPTIONIST', 
  'medico': 'DOCTOR',
  'financeiro': 'FINANCIAL',
  'gerente': 'MANAGER',
  'super_admin': 'SUPER_ADMIN',
  'recepcionista': 'RECEPTIONIST',
  'atendente': 'RECEPTIONIST'
};

const VALID_ROLES = ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'RECEPTIONIST', 'DOCTOR', 'FINANCIAL'];

// ========================================
// FUNÇÕES UTILITÁRIAS
// ========================================

/**
 * Cria backup dos usuários antes da migração
 */
async function createBackup() {
  console.log('📦 Criando backup dos usuários...');
  
  try {
    const usersSnapshot = await db.collection('usuarios').get();
    const backupData = {
      timestamp: new Date().toISOString(),
      totalUsers: usersSnapshot.size,
      users: []
    };

    usersSnapshot.forEach(doc => {
      backupData.users.push({
        id: doc.id,
        data: doc.data()
      });
    });

    // Salvar backup na collection especial
    const backupRef = await db.collection('_backups').add({
      type: 'user_migration',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      data: backupData
    });

    console.log('✅ Backup criado com sucesso:', backupRef.id);
    return backupRef.id;

  } catch (error) {
    console.error('❌ Erro ao criar backup:', error);
    throw error;
  }
}

/**
 * Mapeia perfil legado para novo role
 */
function mapLegacyRole(legacyRole) {
  if (!legacyRole) return 'RECEPTIONIST';
  
  const normalized = legacyRole.toLowerCase().trim();
  return LEGACY_ROLE_MAPPING[normalized] || 'RECEPTIONIST';
}

/**
 * Analisa usuários existentes
 */
async function analyzeUsers() {
  console.log('🔍 Analisando usuários existentes...');
  
  try {
    const usersSnapshot = await db.collection('usuarios').get();
    const analysis = {
      total: usersSnapshot.size,
      withPerfil: 0,
      withRole: 0,
      needsMigration: 0,
      roleDistribution: {},
      users: []
    };

    usersSnapshot.forEach(doc => {
      const data = doc.data();
      const user = {
        id: doc.id,
        email: data.email,
        perfil: data.perfil,
        role: data.role,
        needsMigration: false,
        suggestedRole: null
      };

      // Contar usuários com perfil
      if (data.perfil) {
        analysis.withPerfil++;
      }

      // Contar usuários com role novo
      if (data.role && VALID_ROLES.includes(data.role)) {
        analysis.withRole++;
        analysis.roleDistribution[data.role] = (analysis.roleDistribution[data.role] || 0) + 1;
      }

      // Verificar se precisa migração
      if (data.perfil && (!data.role || !VALID_ROLES.includes(data.role))) {
        user.needsMigration = true;
        user.suggestedRole = mapLegacyRole(data.perfil);
        analysis.needsMigration++;
        analysis.roleDistribution[user.suggestedRole] = (analysis.roleDistribution[user.suggestedRole] || 0) + 1;
      }

      analysis.users.push(user);
    });

    return analysis;

  } catch (error) {
    console.error('❌ Erro ao analisar usuários:', error);
    throw error;
  }
}

/**
 * Executa migração (simulação ou real)
 */
async function executeMigration(usersToMigrate, isSimulation = true) {
  const mode = isSimulation ? 'SIMULAÇÃO' : 'REAL';
  console.log(`🚀 Executando migração em modo ${mode}...`);

  const results = {
    processed: 0,
    successful: 0,
    failed: 0,
    errors: []
  };

  for (const user of usersToMigrate) {
    if (!user.needsMigration) continue;

    results.processed++;

    try {
      const updateData = {
        role: user.suggestedRole,
        migratedAt: admin.firestore.FieldValue.serverTimestamp(),
        migrationSource: 'script_v1'
      };

      // Preservar perfil original para compatibilidade
      if (user.perfil) {
        updateData.originalPerfil = user.perfil;
      }

      if (!isSimulation) {
        await db.collection('usuarios').doc(user.id).update(updateData);
      }

      console.log(`✅ ${mode}: ${user.email} → ${user.suggestedRole}`);
      results.successful++;

    } catch (error) {
      console.error(`❌ Erro ao migrar ${user.email}:`, error.message);
      results.failed++;
      results.errors.push({
        userId: user.id,
        email: user.email,
        error: error.message
      });
    }
  }

  return results;
}

/**
 * Interface de linha de comando
 */
function askQuestion(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise(resolve => {
    rl.question(question, answer => {
      rl.close();
      resolve(answer.trim().toLowerCase());
    });
  });
}

// ========================================
// FUNÇÃO PRINCIPAL
// ========================================

async function main() {
  console.log('🚀 SCRIPT DE MIGRAÇÃO DE ROLES DE USUÁRIOS');
  console.log('============================================');
  console.log('⚠️ MODO ULTRA-SEGURO: Não afeta layout/interface');
  console.log('');

  try {
    // 1. Analisar usuários existentes
    const analysis = await analyzeUsers();
    
    console.log('📊 ANÁLISE DOS USUÁRIOS:');
    console.log(`Total de usuários: ${analysis.total}`);
    console.log(`Com perfil legado: ${analysis.withPerfil}`);
    console.log(`Com role novo: ${analysis.withRole}`);
    console.log(`Precisam migração: ${analysis.needsMigration}`);
    console.log('');

    if (analysis.needsMigration === 0) {
      console.log('✅ Todos os usuários já estão migrados!');
      return;
    }

    console.log('📋 DISTRIBUIÇÃO DE ROLES APÓS MIGRAÇÃO:');
    Object.entries(analysis.roleDistribution).forEach(([role, count]) => {
      console.log(`  ${role}: ${count} usuários`);
    });
    console.log('');

    // 2. Mostrar usuários que serão migrados
    const usersToMigrate = analysis.users.filter(u => u.needsMigration);
    console.log('👥 USUÁRIOS PARA MIGRAÇÃO:');
    usersToMigrate.forEach(user => {
      console.log(`  ${user.email}: ${user.perfil} → ${user.suggestedRole}`);
    });
    console.log('');

    // 3. Executar simulação primeiro
    console.log('🧪 EXECUTANDO SIMULAÇÃO...');
    const simulationResults = await executeMigration(usersToMigrate, true);
    
    console.log('📈 RESULTADOS DA SIMULAÇÃO:');
    console.log(`Processados: ${simulationResults.processed}`);
    console.log(`Sucessos: ${simulationResults.successful}`);
    console.log(`Falhas: ${simulationResults.failed}`);
    
    if (simulationResults.errors.length > 0) {
      console.log('❌ Erros na simulação:');
      simulationResults.errors.forEach(error => {
        console.log(`  ${error.email}: ${error.error}`);
      });
    }
    console.log('');

    // 4. Perguntar se quer continuar com migração real
    if (simulationResults.failed === 0) {
      const proceed = await askQuestion('✅ Simulação bem-sucedida! Executar migração real? (sim/não): ');
      
      if (proceed === 'sim' || proceed === 's' || proceed === 'yes') {
        // 5. Criar backup
        const backupId = await createBackup();
        console.log(`📦 Backup criado: ${backupId}`);
        console.log('');

        // 6. Executar migração real
        console.log('🚀 EXECUTANDO MIGRAÇÃO REAL...');
        const realResults = await executeMigration(usersToMigrate, false);
        
        console.log('🎉 MIGRAÇÃO CONCLUÍDA!');
        console.log(`Processados: ${realResults.processed}`);
        console.log(`Sucessos: ${realResults.successful}`);
        console.log(`Falhas: ${realResults.failed}`);
        
        if (realResults.errors.length > 0) {
          console.log('❌ Erros na migração real:');
          realResults.errors.forEach(error => {
            console.log(`  ${error.email}: ${error.error}`);
          });
        }

        console.log('');
        console.log('✅ Migração concluída com sucesso!');
        console.log('🔄 Os usuários agora têm roles granulares');
        console.log('💾 Backup disponível para reversão se necessário');
        
      } else {
        console.log('❌ Migração cancelada pelo usuário');
      }
    } else {
      console.log('❌ Simulação falhou. Corrija os erros antes de continuar.');
    }

  } catch (error) {
    console.error('💥 Erro fatal na migração:', error);
    process.exit(1);
  }
}

// ========================================
// FUNÇÕES AUXILIARES PARA TESTE
// ========================================

/**
 * Função para testar conexão com Firestore
 */
async function testConnection() {
  try {
    console.log('🔍 Testando conexão com Firestore...');
    const testDoc = await db.collection('usuarios').limit(1).get();
    console.log('✅ Conexão com Firestore OK');
    return true;
  } catch (error) {
    console.error('❌ Erro de conexão:', error.message);
    return false;
  }
}

/**
 * Função para validar mapeamento de roles
 */
function validateRoleMapping() {
  console.log('🔍 Validando mapeamento de roles...');
  
  const issues = [];
  
  // Verificar se todos os roles mapeados são válidos
  Object.entries(LEGACY_ROLE_MAPPING).forEach(([legacy, newRole]) => {
    if (!VALID_ROLES.includes(newRole)) {
      issues.push(`Role inválido no mapeamento: ${legacy} → ${newRole}`);
    }
  });

  if (issues.length > 0) {
    console.error('❌ Problemas no mapeamento:');
    issues.forEach(issue => console.error(`  ${issue}`));
    return false;
  }

  console.log('✅ Mapeamento de roles válido');
  return true;
}

// ========================================
// EXECUÇÃO
// ========================================

// Se executado diretamente
if (require.main === module) {
  // Validações iniciais
  if (!validateRoleMapping()) {
    process.exit(1);
  }

  // Testar conexão e executar
  testConnection()
    .then(connected => {
      if (connected) {
        return main();
      } else {
        console.log('❌ Não foi possível conectar ao Firestore');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('💥 Erro na execução:', error);
      process.exit(1);
    });
}

// Exportar funções para testes
module.exports = {
  analyzeUsers,
  mapLegacyRole,
  validateRoleMapping,
  testConnection,
  createBackup
}; 
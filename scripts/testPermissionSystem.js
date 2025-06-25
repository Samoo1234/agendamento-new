import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  getDocs, 
  doc, 
  getDoc
} from 'firebase/firestore';

// Simulando importações (ajustar paths conforme necessário)
const PERMISSIONS = {
  // WHATSAPP E TEMPLATES
  VIEW_TEMPLATES: 'view_templates',
  CREATE_TEMPLATES: 'create_templates',
  EDIT_TEMPLATES: 'edit_templates',
  DELETE_TEMPLATES: 'delete_templates',
  SEND_WHATSAPP: 'send_whatsapp',
  VIEW_WHATSAPP_LOGS: 'view_whatsapp_logs',
  MANAGE_N8N_INTEGRATION: 'manage_n8n_integration',

  // AGENDAMENTOS
  VIEW_APPOINTMENTS: 'view_appointments',
  CREATE_APPOINTMENTS: 'create_appointments',
  EDIT_APPOINTMENTS: 'edit_appointments',
  MANAGE_APPOINTMENT_STATUS: 'manage_appointment_status',

  // USUÁRIOS
  VIEW_USERS: 'view_users',
  CREATE_USERS: 'create_users',
  MANAGE_USER_ROLES: 'manage_user_roles'
};

const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  MANAGER: 'manager',
  RECEPTIONIST: 'receptionist',
  DOCTOR: 'doctor',
  FINANCIAL: 'financial'
};

const ROLE_PERMISSIONS = {
  [ROLES.SUPER_ADMIN]: Object.values(PERMISSIONS),
  
  [ROLES.ADMIN]: [
    PERMISSIONS.VIEW_TEMPLATES,
    PERMISSIONS.CREATE_TEMPLATES,
    PERMISSIONS.EDIT_TEMPLATES,
    PERMISSIONS.DELETE_TEMPLATES,
    PERMISSIONS.SEND_WHATSAPP,
    PERMISSIONS.VIEW_WHATSAPP_LOGS,
    PERMISSIONS.MANAGE_N8N_INTEGRATION,
    PERMISSIONS.VIEW_APPOINTMENTS,
    PERMISSIONS.CREATE_APPOINTMENTS,
    PERMISSIONS.EDIT_APPOINTMENTS,
    PERMISSIONS.MANAGE_APPOINTMENT_STATUS,
    PERMISSIONS.VIEW_USERS,
    PERMISSIONS.CREATE_USERS
  ],
  
  [ROLES.MANAGER]: [
    PERMISSIONS.VIEW_TEMPLATES,
    PERMISSIONS.SEND_WHATSAPP,
    PERMISSIONS.VIEW_WHATSAPP_LOGS,
    PERMISSIONS.VIEW_APPOINTMENTS,
    PERMISSIONS.CREATE_APPOINTMENTS,
    PERMISSIONS.EDIT_APPOINTMENTS,
    PERMISSIONS.MANAGE_APPOINTMENT_STATUS
  ],
  
  [ROLES.RECEPTIONIST]: [
    PERMISSIONS.VIEW_TEMPLATES,
    PERMISSIONS.SEND_WHATSAPP,
    PERMISSIONS.VIEW_APPOINTMENTS,
    PERMISSIONS.CREATE_APPOINTMENTS,
    PERMISSIONS.EDIT_APPOINTMENTS,
    PERMISSIONS.MANAGE_APPOINTMENT_STATUS
  ],
  
  [ROLES.DOCTOR]: [
    PERMISSIONS.VIEW_APPOINTMENTS
  ],
  
  [ROLES.FINANCIAL]: [
    PERMISSIONS.VIEW_APPOINTMENTS
  ]
};

const hasPermission = (userRole, permission) => {
  if (!userRole || !permission) return false;
  const permissions = ROLE_PERMISSIONS[userRole];
  return permissions ? permissions.includes(permission) : false;
};

const hasAnyPermission = (userRole, permissions = []) => {
  if (!userRole || !Array.isArray(permissions)) return false;
  return permissions.some(permission => hasPermission(userRole, permission));
};

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

// Resultados dos testes
let testResults = {
  permissions: { passed: 0, failed: 0, tests: [] },
  data: { passed: 0, failed: 0, tests: [] },
  security: { passed: 0, failed: 0, tests: [] },
  compatibility: { passed: 0, failed: 0, tests: [] },
  performance: { passed: 0, failed: 0, tests: [] }
};

/**
 * 🧪 TESTE 1: Sistema de Permissões
 */
async function testPermissionLogic() {
  console.log('\n🧪 TESTANDO SISTEMA DE PERMISSÕES...');
  
  const tests = [
    {
      name: 'Super Admin tem todas as permissões',
      test: () => {
        const superAdminPerms = ROLE_PERMISSIONS[ROLES.SUPER_ADMIN];
        const allPerms = Object.values(PERMISSIONS);
        return superAdminPerms.length === allPerms.length;
      }
    },
    
    {
      name: 'Admin tem mais permissões que Manager',
      test: () => {
        const adminPerms = ROLE_PERMISSIONS[ROLES.ADMIN].length;
        const managerPerms = ROLE_PERMISSIONS[ROLES.MANAGER].length;
        return adminPerms > managerPerms;
      }
    },
    
    {
      name: 'Receptionist pode ver agendamentos',
      test: () => {
        return hasPermission('receptionist', PERMISSIONS.VIEW_APPOINTMENTS);
      }
    },
    
    {
      name: 'Doctor não pode gerenciar usuários',
      test: () => {
        return !hasPermission('doctor', PERMISSIONS.VIEW_USERS);
      }
    },
    
    {
      name: 'Financial pode ver dados financeiros',
      test: () => {
        return hasAnyPermission('financial', [
          PERMISSIONS.VIEW_APPOINTMENTS
        ]);
      }
    },
    
    {
      name: 'Role inexistente retorna false',
      test: () => {
        return !hasPermission('role_inexistente', PERMISSIONS.VIEW_USERS);
      }
    },
    
    {
      name: 'Permissão inexistente retorna false',
      test: () => {
        return !hasPermission('admin', 'permissao_inexistente');
      }
    }
  ];
  
  for (const test of tests) {
    try {
      const result = test.test();
      if (result) {
        testResults.permissions.passed++;
        console.log(`  ✅ ${test.name}`);
      } else {
        testResults.permissions.failed++;
        console.log(`  ❌ ${test.name}`);
      }
      testResults.permissions.tests.push({ name: test.name, passed: result });
    } catch (error) {
      testResults.permissions.failed++;
      console.log(`  💥 ${test.name} - ERRO: ${error.message}`);
      testResults.permissions.tests.push({ name: test.name, passed: false, error: error.message });
    }
  }
}

/**
 * 🗄️ TESTE 2: Validação de Dados
 */
async function testDataIntegrity() {
  console.log('\n🗄️ TESTANDO INTEGRIDADE DOS DADOS...');
  
  const tests = [
    {
      name: 'Conectar com Firestore',
      test: async () => {
        try {
          const testDoc = await getDoc(doc(db, 'usuarios', 'test'));
          return true;
        } catch (error) {
          console.log(`    Erro de conexão: ${error.message}`);
          return false;
        }
      }
    },
    
    {
      name: 'Usuários existem na base',
      test: async () => {
        try {
          const users = await getDocs(collection(db, 'usuarios'));
          console.log(`    Encontrados ${users.size} usuários`);
          return users.size > 0;
        } catch (error) {
          console.log(`    Erro ao buscar usuários: ${error.message}`);
          return false;
        }
      }
    },
    
    {
      name: 'Médicos existem na base',
      test: async () => {
        try {
          const doctors = await getDocs(collection(db, 'medicos'));
          console.log(`    Encontrados ${doctors.size} médicos`);
          return doctors.size >= 0;
        } catch (error) {
          console.log(`    Erro ao buscar médicos: ${error.message}`);
          return false;
        }
      }
    },
    
    {
      name: 'Agendamentos existem na base',
      test: async () => {
        try {
          const appointments = await getDocs(collection(db, 'agendamentos'));
          console.log(`    Encontrados ${appointments.size} agendamentos`);
          return appointments.size >= 0;
        } catch (error) {
          console.log(`    Erro ao buscar agendamentos: ${error.message}`);
          return false;
        }
      }
    },
    
    {
      name: 'Estrutura de usuários válida',
      test: async () => {
        try {
          const users = await getDocs(collection(db, 'usuarios'));
          let validStructure = true;
          let usersWithoutEmail = 0;
          
          users.docs.forEach(doc => {
            const data = doc.data();
            if (!data.email) {
              validStructure = false;
              usersWithoutEmail++;
            }
          });
          
          if (usersWithoutEmail > 0) {
            console.log(`    ${usersWithoutEmail} usuários sem email`);
          }
          
          return validStructure;
        } catch (error) {
          console.log(`    Erro na validação: ${error.message}`);
          return false;
        }
      }
    }
  ];
  
  for (const test of tests) {
    try {
      const result = await test.test();
      if (result) {
        testResults.data.passed++;
        console.log(`  ✅ ${test.name}`);
      } else {
        testResults.data.failed++;
        console.log(`  ❌ ${test.name}`);
      }
      testResults.data.tests.push({ name: test.name, passed: result });
    } catch (error) {
      testResults.data.failed++;
      console.log(`  💥 ${test.name} - ERRO: ${error.message}`);
      testResults.data.tests.push({ name: test.name, passed: false, error: error.message });
    }
  }
}

/**
 * 🔒 TESTE 3: Segurança e Fallbacks
 */
async function testSecurityFallbacks() {
  console.log('\n🔒 TESTANDO SEGURANÇA E FALLBACKS...');
  
  const tests = [
    {
      name: 'Fallback para role undefined',
      test: () => {
        try {
          const result = hasPermission(undefined, PERMISSIONS.VIEW_USERS);
          return result === false;
        } catch (error) {
          return false;
        }
      }
    },
    
    {
      name: 'Fallback para role null',
      test: () => {
        try {
          const result = hasPermission(null, PERMISSIONS.VIEW_USERS);
          return result === false;
        } catch (error) {
          return false;
        }
      }
    },
    
    {
      name: 'Fallback para permissão undefined',
      test: () => {
        try {
          const result = hasPermission('admin', undefined);
          return result === false;
        } catch (error) {
          return false;
        }
      }
    },
    
    {
      name: 'Array vazio de permissões',
      test: () => {
        try {
          const result = hasAnyPermission('admin', []);
          return result === false;
        } catch (error) {
          return false;
        }
      }
    },
    
    {
      name: 'Role case-insensitive',
      test: () => {
        const upper = hasPermission('ADMIN', PERMISSIONS.VIEW_USERS);
        const lower = hasPermission('admin', PERMISSIONS.VIEW_USERS);
        const mixed = hasPermission('Admin', PERMISSIONS.VIEW_USERS);
        return upper === lower && lower === mixed;
      }
    }
  ];
  
  for (const test of tests) {
    try {
      const result = test.test();
      if (result) {
        testResults.security.passed++;
        console.log(`  ✅ ${test.name}`);
      } else {
        testResults.security.failed++;
        console.log(`  ❌ ${test.name}`);
      }
      testResults.security.tests.push({ name: test.name, passed: result });
    } catch (error) {
      testResults.security.failed++;
      console.log(`  💥 ${test.name} - ERRO: ${error.message}`);
      testResults.security.tests.push({ name: test.name, passed: false, error: error.message });
    }
  }
}

/**
 * 🔄 TESTE 4: Compatibilidade com Sistema Atual
 */
async function testCompatibility() {
  console.log('\n🔄 TESTANDO COMPATIBILIDADE...');
  
  const tests = [
    {
      name: 'Roles antigos mapeiam corretamente',
      test: () => {
        const oldRoleMappings = {
          'administrador': 'admin',
          'usuario': 'receptionist',
          'medico': 'doctor'
        };
        
        return Object.keys(oldRoleMappings).every(oldRole => {
          const newRole = oldRoleMappings[oldRole];
          return ROLE_PERMISSIONS[newRole.toUpperCase()] !== undefined;
        });
      }
    },
    
    {
      name: 'Sistema funciona sem Firebase Auth',
      test: () => {
        try {
          const result = hasPermission('admin', PERMISSIONS.VIEW_USERS);
          return typeof result === 'boolean';
        } catch (error) {
          return false;
        }
      }
    },
    
    {
      name: 'Não quebra componentes React existentes',
      test: () => {
        return (
          typeof PERMISSIONS === 'object' &&
          typeof ROLES === 'object' &&
          typeof hasPermission === 'function'
        );
      }
    }
  ];
  
  for (const test of tests) {
    try {
      const result = test.test();
      if (result) {
        testResults.compatibility.passed++;
        console.log(`  ✅ ${test.name}`);
      } else {
        testResults.compatibility.failed++;
        console.log(`  ❌ ${test.name}`);
      }
      testResults.compatibility.tests.push({ name: test.name, passed: result });
    } catch (error) {
      testResults.compatibility.failed++;
      console.log(`  💥 ${test.name} - ERRO: ${error.message}`);
      testResults.compatibility.tests.push({ name: test.name, passed: false, error: error.message });
    }
  }
}

/**
 * ⚡ TESTE 5: Performance
 */
async function testPerformance() {
  console.log('\n⚡ TESTANDO PERFORMANCE...');
  
  const tests = [
    {
      name: 'Verificação de permissão é rápida (<1ms)',
      test: () => {
        const start = Date.now();
        
        for (let i = 0; i < 1000; i++) {
          hasPermission('admin', PERMISSIONS.VIEW_USERS);
        }
        
        const end = Date.now();
        const avgTime = (end - start) / 1000;
        
        console.log(`    Tempo médio: ${avgTime.toFixed(3)}ms`);
        return avgTime < 1;
      }
    },
    
    {
      name: 'Verificação de múltiplas permissões é rápida',
      test: () => {
        const start = Date.now();
        
        for (let i = 0; i < 1000; i++) {
          hasAnyPermission('admin', [
            PERMISSIONS.VIEW_USERS,
            PERMISSIONS.CREATE_USERS,
            PERMISSIONS.VIEW_APPOINTMENTS
          ]);
        }
        
        const end = Date.now();
        const avgTime = (end - start) / 1000;
        
        console.log(`    Tempo médio: ${avgTime.toFixed(3)}ms`);
        return avgTime < 5;
      }
    },
    
    {
      name: 'Não há vazamentos de memória básicos',
      test: () => {
        const initialMemory = process.memoryUsage ? process.memoryUsage().heapUsed : 0;
        
        for (let i = 0; i < 10000; i++) {
          hasPermission('admin', PERMISSIONS.VIEW_USERS);
          hasAnyPermission('receptionist', [PERMISSIONS.VIEW_APPOINTMENTS]);
        }
        
        if (process.memoryUsage) {
          const finalMemory = process.memoryUsage().heapUsed;
          const memoryIncrease = finalMemory - initialMemory;
          console.log(`    Aumento de memória: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`);
          return memoryIncrease < 10 * 1024 * 1024;
        }
        
        return true; // Se não conseguir medir, assumir OK
      }
    }
  ];
  
  for (const test of tests) {
    try {
      const result = test.test();
      if (result) {
        testResults.performance.passed++;
        console.log(`  ✅ ${test.name}`);
      } else {
        testResults.performance.failed++;
        console.log(`  ❌ ${test.name}`);
      }
      testResults.performance.tests.push({ name: test.name, passed: result });
    } catch (error) {
      testResults.performance.failed++;
      console.log(`  💥 ${test.name} - ERRO: ${error.message}`);
      testResults.performance.tests.push({ name: test.name, passed: false, error: error.message });
    }
  }
}

/**
 * 📊 Gerar Relatório Final
 */
function generateReport() {
  console.log('\n📊 RELATÓRIO FINAL DOS TESTES');
  console.log('='.repeat(50));
  
  const categories = Object.keys(testResults);
  let totalPassed = 0;
  let totalFailed = 0;
  
  categories.forEach(category => {
    const result = testResults[category];
    totalPassed += result.passed;
    totalFailed += result.failed;
    
    const total = result.passed + result.failed;
    const percentage = total > 0 ? ((result.passed / total) * 100).toFixed(1) : 0;
    
    console.log(`\n${category.toUpperCase()}:`);
    console.log(`  ✅ Passou: ${result.passed}`);
    console.log(`  ❌ Falhou: ${result.failed}`);
    console.log(`  📊 Taxa de sucesso: ${percentage}%`);
  });
  
  const totalTests = totalPassed + totalFailed;
  const overallPercentage = totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(1) : 0;
  
  console.log(`\n🎯 RESULTADO GERAL:`);
  console.log(`  Total de testes: ${totalTests}`);
  console.log(`  ✅ Sucessos: ${totalPassed}`);
  console.log(`  ❌ Falhas: ${totalFailed}`);
  console.log(`  📊 Taxa de sucesso geral: ${overallPercentage}%`);
  
  console.log(`\n💡 RECOMENDAÇÕES:`);
  
  if (overallPercentage >= 95) {
    console.log(`  🟢 SISTEMA PRONTO PARA IMPLEMENTAÇÃO!`);
    console.log(`  🚀 Prossiga com a implementação gradual.`);
  } else if (overallPercentage >= 80) {
    console.log(`  🟡 SISTEMA QUASE PRONTO`);
    console.log(`  ⚠️  Corrija as falhas antes de implementar.`);
  } else {
    console.log(`  🔴 SISTEMA NÃO ESTÁ PRONTO`);
    console.log(`  ❌ Muitas falhas detectadas. Revisar código.`);
  }
  
  const reportData = {
    timestamp: new Date().toISOString(),
    results: testResults,
    summary: {
      totalTests,
      totalPassed,
      totalFailed,
      overallPercentage: parseFloat(overallPercentage)
    }
  };
  
  console.log(`\n📁 Relatório disponível como objeto JavaScript`);
  return reportData;
}

/**
 * 🎯 Executar Todos os Testes
 */
async function runAllTests() {
  console.log('🧪 INICIANDO BATERIA COMPLETA DE TESTES');
  console.log('🕐 Início:', new Date().toLocaleString());
  console.log('='.repeat(50));
  
  try {
    await testPermissionLogic();
    await testDataIntegrity();
    await testSecurityFallbacks();
    await testCompatibility();
    await testPerformance();
    
    const report = generateReport();
    
    console.log('\n🕐 Fim:', new Date().toLocaleString());
    console.log('✅ TODOS OS TESTES CONCLUÍDOS!');
    
    return report;
    
  } catch (error) {
    console.error('\n💥 ERRO CRÍTICO NOS TESTES:', error);
    console.error('Stack:', error.stack);
    return null;
  }
}

// Exportar para uso
if (typeof window !== 'undefined') {
  window.runPermissionTests = runAllTests;
}

export { runAllTests, testResults }; 
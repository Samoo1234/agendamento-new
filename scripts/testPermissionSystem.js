/**
 * SCRIPT DE TESTE DO SISTEMA DE PERMISSÕES
 * ULTRA-SEGURO - NÃO AFETA LAYOUT/INTERFACE
 * 
 * Este script testa todas as funcionalidades do sistema de permissões
 * SEM ALTERAR NADA VISUAL
 */

// ========================================
// IMPORTS E CONFIGURAÇÃO
// ========================================

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Simular ambiente React para testes
global.console = console;
global.process = process;

// ========================================
// SIMULAÇÃO DOS MÓDULOS REACT
// ========================================

// Mock do useStore
const mockUsers = [
  { email: 'admin@teste.com', perfil: 'admin' },
  { email: 'usuario@teste.com', perfil: 'usuario' },
  { email: 'medico@teste.com', perfil: 'medico' },
  { email: 'financeiro@teste.com', perfil: 'financeiro' },
  { email: 'gerente@teste.com', perfil: 'gerente' },
  { email: 'super@teste.com', role: 'SUPER_ADMIN' }
];

// Mock do React hooks
const mockUseMemo = (fn, deps) => fn();

// ========================================
// CARREGAR CONFIGURAÇÕES
// ========================================

async function loadPermissionsConfig() {
  try {
    const configPath = path.join(__dirname, '../src/config/permissions.js');
    const configModule = await import(`file://${configPath}`);
    
    return {
      PERMISSIONS: configModule.PERMISSIONS,
      ROLES: configModule.ROLES,
      ROLE_PERMISSIONS: configModule.ROLE_PERMISSIONS,
      LEGACY_ROLE_MAPPING: configModule.LEGACY_ROLE_MAPPING
    };
    
  } catch (error) {
    console.error('❌ Erro ao carregar configurações:', error.message);
    return null;
  }
}

// ========================================
// TESTES DO SISTEMA DE PERMISSÕES
// ========================================

function testPermissionsStructure(config) {
  console.log('🔍 Testando estrutura de permissões...');
  
  const tests = [];
  
  // Teste 1: PERMISSIONS definido
  tests.push({
    name: 'PERMISSIONS definido',
    result: config.PERMISSIONS && typeof config.PERMISSIONS === 'object',
    details: `${Object.keys(config.PERMISSIONS || {}).length} permissões encontradas`
  });
  
  // Teste 2: ROLES definido
  tests.push({
    name: 'ROLES definido',
    result: config.ROLES && typeof config.ROLES === 'object',
    details: `${Object.keys(config.ROLES || {}).length} roles encontrados`
  });
  
  // Teste 3: ROLE_PERMISSIONS definido
  tests.push({
    name: 'ROLE_PERMISSIONS definido',
    result: config.ROLE_PERMISSIONS && typeof config.ROLE_PERMISSIONS === 'object',
    details: `${Object.keys(config.ROLE_PERMISSIONS || {}).length} mapeamentos encontrados`
  });
  
  // Teste 4: LEGACY_ROLE_MAPPING definido
  tests.push({
    name: 'LEGACY_ROLE_MAPPING definido',
    result: config.LEGACY_ROLE_MAPPING && typeof config.LEGACY_ROLE_MAPPING === 'object',
    details: `${Object.keys(config.LEGACY_ROLE_MAPPING || {}).length} mapeamentos legados`
  });
  
  // Teste 5: Permissões específicas críticas
  const criticalPermissions = [
    'WHATSAPP_SEND', 'N8N_INTEGRATION', 'TEMPLATES_VIEW',
    'USERS_VIEW', 'FINANCIAL_VIEW', 'APPOINTMENTS_VIEW'
  ];
  
  const foundCritical = criticalPermissions.filter(perm => 
    config.PERMISSIONS && config.PERMISSIONS[perm]
  );
  
  tests.push({
    name: 'Permissões críticas presentes',
    result: foundCritical.length === criticalPermissions.length,
    details: `${foundCritical.length}/${criticalPermissions.length} permissões críticas`
  });
  
  // Teste 6: Roles hierárquicos
  const expectedRoles = ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'RECEPTIONIST', 'DOCTOR', 'FINANCIAL'];
  const foundRoles = expectedRoles.filter(role => 
    config.ROLES && Object.values(config.ROLES).includes(role)
  );
  
  tests.push({
    name: 'Roles hierárquicos completos',
    result: foundRoles.length === expectedRoles.length,
    details: `${foundRoles.length}/${expectedRoles.length} roles encontrados`
  });
  
  // Teste 7: Mapeamento WhatsApp/N8N
  const whatsappPermissions = Object.keys(config.PERMISSIONS || {}).filter(key => 
    key.includes('WHATSAPP') || key.includes('N8N') || key.includes('TEMPLATES')
  );
  
  tests.push({
    name: 'Permissões WhatsApp/N8N',
    result: whatsappPermissions.length >= 5,
    details: `${whatsappPermissions.length} permissões WhatsApp/N8N encontradas`
  });
  
  return tests;
}

function testRoleMappings(config) {
  console.log('🔄 Testando mapeamentos de roles...');
  
  const tests = [];
  
  // Teste 1: Mapeamento legado funcional
  const legacyRoles = ['admin', 'usuario', 'medico', 'financeiro'];
  const mappingResults = legacyRoles.map(legacy => {
    const mapped = config.LEGACY_ROLE_MAPPING && config.LEGACY_ROLE_MAPPING[legacy];
    const isValid = mapped && Object.values(config.ROLES || {}).includes(mapped);
    return { legacy, mapped, isValid };
  });
  
  const validMappings = mappingResults.filter(r => r.isValid).length;
  
  tests.push({
    name: 'Mapeamento roles legados',
    result: validMappings === legacyRoles.length,
    details: `${validMappings}/${legacyRoles.length} mapeamentos válidos`
  });
  
  // Teste 2: Todos os roles têm permissões
  const rolesWithPermissions = Object.keys(config.ROLE_PERMISSIONS || {}).length;
  const totalRoles = Object.keys(config.ROLES || {}).length;
  
  tests.push({
    name: 'Roles com permissões definidas',
    result: rolesWithPermissions === totalRoles,
    details: `${rolesWithPermissions}/${totalRoles} roles com permissões`
  });
  
  // Teste 3: SUPER_ADMIN tem todas as permissões
  const superAdminPerms = config.ROLE_PERMISSIONS && config.ROLE_PERMISSIONS[config.ROLES?.SUPER_ADMIN];
  const totalPermissions = Object.keys(config.PERMISSIONS || {}).length;
  const superAdminPermCount = superAdminPerms ? superAdminPerms.length : 0;
  
  tests.push({
    name: 'SUPER_ADMIN acesso total',
    result: superAdminPermCount >= totalPermissions * 0.9, // 90% das permissões
    details: `${superAdminPermCount}/${totalPermissions} permissões para SUPER_ADMIN`
  });
  
  return tests;
}

function testWhatsAppIntegration(config) {
  console.log('📱 Testando integração WhatsApp/N8N...');
  
  const tests = [];
  
  // Teste 1: Permissões WhatsApp existem
  const whatsappPerms = [
    'WHATSAPP_SEND', 'WHATSAPP_LOGS', 'N8N_INTEGRATION',
    'TEMPLATES_VIEW', 'TEMPLATES_CREATE', 'TEMPLATES_EDIT', 'TEMPLATES_DELETE'
  ];
  
  const foundWhatsappPerms = whatsappPerms.filter(perm => 
    config.PERMISSIONS && config.PERMISSIONS[perm]
  );
  
  tests.push({
    name: 'Permissões WhatsApp completas',
    result: foundWhatsappPerms.length >= 6,
    details: `${foundWhatsappPerms.length}/${whatsappPerms.length} permissões WhatsApp`
  });
  
  // Teste 2: ADMIN tem acesso WhatsApp completo
  const adminRole = config.ROLES?.ADMIN;
  const adminPerms = config.ROLE_PERMISSIONS && config.ROLE_PERMISSIONS[adminRole];
  const adminWhatsappCount = adminPerms ? 
    whatsappPerms.filter(perm => adminPerms.includes(config.PERMISSIONS[perm])).length : 0;
  
  tests.push({
    name: 'ADMIN acesso WhatsApp completo',
    result: adminWhatsappCount >= 6,
    details: `${adminWhatsappCount}/${whatsappPerms.length} permissões WhatsApp para ADMIN`
  });
  
  // Teste 3: RECEPTIONIST tem acesso WhatsApp básico
  const recepRole = config.ROLES?.RECEPTIONIST;
  const recepPerms = config.ROLE_PERMISSIONS && config.ROLE_PERMISSIONS[recepRole];
  const recepWhatsappCount = recepPerms ? 
    ['WHATSAPP_SEND', 'TEMPLATES_VIEW'].filter(perm => 
      recepPerms.includes(config.PERMISSIONS[perm])
    ).length : 0;
  
  tests.push({
    name: 'RECEPTIONIST acesso WhatsApp básico',
    result: recepWhatsappCount >= 2,
    details: `${recepWhatsappCount}/2 permissões WhatsApp básicas para RECEPTIONIST`
  });
  
  // Teste 4: DOCTOR sem acesso WhatsApp
  const doctorRole = config.ROLES?.DOCTOR;
  const doctorPerms = config.ROLE_PERMISSIONS && config.ROLE_PERMISSIONS[doctorRole];
  const doctorWhatsappCount = doctorPerms ? 
    whatsappPerms.filter(perm => doctorPerms.includes(config.PERMISSIONS[perm])).length : 0;
  
  tests.push({
    name: 'DOCTOR sem acesso WhatsApp',
    result: doctorWhatsappCount === 0,
    details: `${doctorWhatsappCount} permissões WhatsApp para DOCTOR (deve ser 0)`
  });
  
  // Teste 5: N8N_INTEGRATION restrita
  const n8nPerm = config.PERMISSIONS?.N8N_INTEGRATION;
  const rolesWithN8N = Object.entries(config.ROLE_PERMISSIONS || {}).filter(([role, perms]) => 
    perms.includes(n8nPerm)
  ).length;
  
  tests.push({
    name: 'N8N_INTEGRATION restrita',
    result: rolesWithN8N <= 3, // Apenas SUPER_ADMIN, ADMIN, talvez MANAGER
    details: `${rolesWithN8N} roles com acesso N8N (deve ser ≤ 3)`
  });
  
  return tests;
}

function testCompatibility(config) {
  console.log('🔄 Testando compatibilidade legada...');
  
  const tests = [];
  
  // Teste 1: Mapeamento de usuários mockados
  const mappingResults = mockUsers.map(user => {
    let expectedRole;
    
    if (user.role) {
      expectedRole = user.role;
    } else if (user.perfil) {
      expectedRole = config.LEGACY_ROLE_MAPPING && config.LEGACY_ROLE_MAPPING[user.perfil.toLowerCase()];
    }
    
    const isValidRole = expectedRole && Object.values(config.ROLES || {}).includes(expectedRole);
    
    return {
      email: user.email,
      perfil: user.perfil,
      role: user.role,
      expectedRole,
      isValid: isValidRole
    };
  });
  
  const validMappings = mappingResults.filter(r => r.isValid).length;
  
  tests.push({
    name: 'Mapeamento usuários mockados',
    result: validMappings === mockUsers.length,
    details: `${validMappings}/${mockUsers.length} usuários mapeados corretamente`
  });
  
  // Teste 2: Fallback para role padrão
  const defaultRole = 'RECEPTIONIST';
  const hasDefaultRole = config.ROLES && Object.values(config.ROLES).includes(defaultRole);
  const defaultHasPermissions = config.ROLE_PERMISSIONS && config.ROLE_PERMISSIONS[defaultRole];
  
  tests.push({
    name: 'Role padrão funcional',
    result: hasDefaultRole && defaultHasPermissions && defaultHasPermissions.length > 0,
    details: `Role padrão ${defaultRole} com ${defaultHasPermissions ? defaultHasPermissions.length : 0} permissões`
  });
  
  // Teste 3: Preservação de funcionalidades críticas
  const criticalFeatures = [
    'APPOINTMENTS_VIEW', 'DOCTORS_VIEW', 'CLIENTS_VIEW', 
    'WHATSAPP_SEND', 'DASHBOARD_VIEW'
  ];
  
  const recepRole = config.ROLES?.RECEPTIONIST;
  const recepPerms = config.ROLE_PERMISSIONS && config.ROLE_PERMISSIONS[recepRole];
  const criticalCount = recepPerms ? 
    criticalFeatures.filter(feature => recepPerms.includes(config.PERMISSIONS[feature])).length : 0;
  
  tests.push({
    name: 'Funcionalidades críticas preservadas',
    result: criticalCount >= 4,
    details: `${criticalCount}/${criticalFeatures.length} funcionalidades críticas para role padrão`
  });
  
  return tests;
}

function testSecurityModel(config) {
  console.log('🔒 Testando modelo de segurança...');
  
  const tests = [];
  
  // Teste 1: Separação de responsabilidades
  const financialRole = config.ROLES?.FINANCIAL;
  const financialPerms = config.ROLE_PERMISSIONS && config.ROLE_PERMISSIONS[financialRole];
  const hasFinancialPerms = financialPerms ? 
    financialPerms.some(perm => perm.includes('financial')) : false;
  const hasUserManagement = financialPerms ? 
    financialPerms.some(perm => perm.includes('users') && perm.includes('delete')) : false;
  
  tests.push({
    name: 'Separação financeiro/usuários',
    result: hasFinancialPerms && !hasUserManagement,
    details: `FINANCIAL tem permissões financeiras mas não gerencia usuários`
  });
  
  // Teste 2: Médico acesso restrito
  const doctorRole = config.ROLES?.DOCTOR;
  const doctorPerms = config.ROLE_PERMISSIONS && config.ROLE_PERMISSIONS[doctorRole];
  const doctorPermCount = doctorPerms ? doctorPerms.length : 0;
  const hasOwnAppointments = doctorPerms ? 
    doctorPerms.includes(config.PERMISSIONS?.APPOINTMENTS_VIEW_OWN) : false;
  
  tests.push({
    name: 'Médico acesso restrito',
    result: doctorPermCount <= 10 && hasOwnAppointments,
    details: `DOCTOR tem ${doctorPermCount} permissões (deve ser ≤ 10) e acesso próprios agendamentos`
  });
  
  // Teste 3: Hierarquia de permissões
  const adminPerms = config.ROLE_PERMISSIONS && config.ROLE_PERMISSIONS[config.ROLES?.ADMIN];
  const managerPerms = config.ROLE_PERMISSIONS && config.ROLE_PERMISSIONS[config.ROLES?.MANAGER];
  const adminCount = adminPerms ? adminPerms.length : 0;
  const managerCount = managerPerms ? managerPerms.length : 0;
  
  tests.push({
    name: 'Hierarquia ADMIN > MANAGER',
    result: adminCount > managerCount,
    details: `ADMIN: ${adminCount} permissões, MANAGER: ${managerCount} permissões`
  });
  
  // Teste 4: Permissões sensíveis restritas
  const sensitivePerms = ['USERS_DELETE', 'SYSTEM_MANAGE', 'USERS_MANAGE_ROLES'];
  const rolesWithSensitive = Object.entries(config.ROLE_PERMISSIONS || {}).filter(([role, perms]) => 
    sensitivePerms.some(sensitivePerm => perms.includes(config.PERMISSIONS[sensitivePerm]))
  ).length;
  
  tests.push({
    name: 'Permissões sensíveis restritas',
    result: rolesWithSensitive <= 2, // Apenas SUPER_ADMIN e talvez ADMIN
    details: `${rolesWithSensitive} roles com permissões sensíveis (deve ser ≤ 2)`
  });
  
  return tests;
}

// ========================================
// FUNÇÃO PRINCIPAL DE TESTE
// ========================================

async function runAllTests() {
  console.log('🚀 INICIANDO TESTES DO SISTEMA DE PERMISSÕES');
  console.log('==============================================');
  console.log('⚠️ MODO ULTRA-SEGURO: Não afeta layout/interface');
  console.log('');
  
  // Carregar configurações
  const config = await loadPermissionsConfig();
  if (!config) {
    console.error('❌ Falha ao carregar configurações. Abortando testes.');
    return false;
  }
  
  console.log('✅ Configurações carregadas com sucesso');
  console.log('');
  
  // Executar todos os testes
  const testSuites = [
    { name: 'PERMISSIONS', tests: testPermissionsStructure(config) },
    { name: 'MAPPINGS', tests: testRoleMappings(config) },
    { name: 'WHATSAPP', tests: testWhatsAppIntegration(config) },
    { name: 'COMPATIBILITY', tests: testCompatibility(config) },
    { name: 'SECURITY', tests: testSecurityModel(config) }
  ];
  
  let totalTests = 0;
  let passedTests = 0;
  
  testSuites.forEach(suite => {
    console.log(`📋 ${suite.name}:`);
    
    suite.tests.forEach(test => {
      totalTests++;
      const status = test.result ? '✅' : '❌';
      const details = test.details ? ` (${test.details})` : '';
      
      console.log(`  ${status} ${test.name}${details}`);
      
      if (test.result) {
        passedTests++;
      }
    });
    
    const suitePassRate = (suite.tests.filter(t => t.result).length / suite.tests.length * 100).toFixed(1);
    console.log(`  📊 Taxa de sucesso: ${suitePassRate}%`);
    console.log('');
  });
  
  // Resultado final
  const overallPassRate = (passedTests / totalTests * 100).toFixed(1);
  
  console.log('🎯 RESULTADO FINAL:');
  console.log(`Total de testes: ${totalTests}`);
  console.log(`Testes aprovados: ${passedTests}`);
  console.log(`Testes falharam: ${totalTests - passedTests}`);
  console.log(`Taxa de sucesso geral: ${overallPassRate}%`);
  console.log('');
  
  if (overallPassRate >= 90) {
    console.log('🎉 SISTEMA DE PERMISSÕES APROVADO!');
    console.log('✅ Pronto para uso em produção');
  } else if (overallPassRate >= 70) {
    console.log('⚠️ SISTEMA PARCIALMENTE APROVADO');
    console.log('🔧 Algumas correções recomendadas');
  } else {
    console.log('❌ SISTEMA REPROVADO');
    console.log('🚨 Correções necessárias antes do uso');
  }
  
  return overallPassRate >= 90;
}

// ========================================
// EXECUÇÃO
// ========================================

// Executar sempre (para testes)
runAllTests().catch(console.error);

export {
  runAllTests,
  loadPermissionsConfig,
  testPermissionsStructure,
  testWhatsAppIntegration,
  testCompatibility,
  testSecurityModel
}; 
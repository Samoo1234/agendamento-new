/**
 * SISTEMA DE PERMISSÕES GRANULARES
 * MODO COMPATIBILIDADE - NÃO AFETA SISTEMA ATUAL
 * 
 * Este arquivo define as 42 permissões específicas do sistema
 * incluindo controle completo de WhatsApp/N8N
 */

// ========================================
// PERMISSÕES BÁSICAS DO SISTEMA
// ========================================

export const PERMISSIONS = {
  // === USUÁRIOS ===
  USERS_VIEW: 'users_view',
  USERS_CREATE: 'users_create', 
  USERS_EDIT: 'users_edit',
  USERS_DELETE: 'users_delete',
  USERS_MANAGE_ROLES: 'users_manage_roles',

  // === AGENDAMENTOS ===
  APPOINTMENTS_VIEW: 'appointments_view',
  APPOINTMENTS_CREATE: 'appointments_create',
  APPOINTMENTS_EDIT: 'appointments_edit', 
  APPOINTMENTS_DELETE: 'appointments_delete',
  APPOINTMENTS_VIEW_ALL: 'appointments_view_all',
  APPOINTMENTS_VIEW_OWN: 'appointments_view_own',
  APPOINTMENTS_MANAGE_STATUS: 'appointments_manage_status',

  // === MÉDICOS ===
  DOCTORS_VIEW: 'doctors_view',
  DOCTORS_CREATE: 'doctors_create',
  DOCTORS_EDIT: 'doctors_edit',
  DOCTORS_DELETE: 'doctors_delete',

  // === CIDADES ===
  CITIES_VIEW: 'cities_view',
  CITIES_CREATE: 'cities_create',
  CITIES_EDIT: 'cities_edit',
  CITIES_DELETE: 'cities_delete',

  // === DATAS ===
  DATES_VIEW: 'dates_view',
  DATES_CREATE: 'dates_create',
  DATES_EDIT: 'dates_edit',
  DATES_DELETE: 'dates_delete',

  // === CLIENTES ===
  CLIENTS_VIEW: 'clients_view',
  CLIENTS_CREATE: 'clients_create',
  CLIENTS_EDIT: 'clients_edit',
  CLIENTS_DELETE: 'clients_delete',

  // === FINANCEIRO ===
  FINANCIAL_VIEW: 'financial_view',
  FINANCIAL_CREATE: 'financial_create',
  FINANCIAL_EDIT: 'financial_edit',
  FINANCIAL_DELETE: 'financial_delete',
  FINANCIAL_REPORTS: 'financial_reports',



  // === RELATÓRIOS ===
  REPORTS_VIEW: 'reports_view',
  DASHBOARD_VIEW: 'dashboard_view',
  EXPORT_DATA: 'export_data',

  // === CONFIGURAÇÕES ===
  SETTINGS_VIEW: 'settings_view',
  SETTINGS_EDIT: 'settings_edit',
  SYSTEM_MANAGE: 'system_manage'
};

// ========================================
// SISTEMA SIMPLIFICADO: ADMIN vs USUARIO
// ========================================

// Função para obter todas as permissões para admin
export function getAllPermissions() {
  return Object.values(PERMISSIONS);
}

// Função para verificar se é admin
export function isAdminRole(role) {
  return role === 'admin' || role === 'administrador' || role === 'ADMIN' || role === 'SUPER_ADMIN';
}

// ========================================
// COMPATIBILIDADE COM SISTEMA LEGADO
// ========================================

export const LEGACY_ROLE_MAPPING = {
  'admin': 'admin',
  'administrador': 'admin',
  'usuario': 'usuario',
  'user': 'usuario'
};

// ========================================
// FUNÇÕES UTILITÁRIAS
// ========================================

/**
 * Obtém permissões baseado no role simplificado
 */
export function getRolePermissions(role) {
  if (isAdminRole(role)) {
    return getAllPermissions();
  }
  return []; // Usuários começam sem permissões
}

/**
 * Verifica se uma permissão existe
 */
export function isValidPermission(permission) {
  return Object.values(PERMISSIONS).includes(permission);
}

/**
 * Converte role legado para novo formato
 */
export function mapLegacyRole(legacyRole) {
  return LEGACY_ROLE_MAPPING[legacyRole?.toLowerCase()] || 'usuario';
}

export default {
  PERMISSIONS,
  LEGACY_ROLE_MAPPING,
  getRolePermissions,
  mapLegacyRole,
  isValidPermission,
  getAllPermissions,
  isAdminRole
}; 
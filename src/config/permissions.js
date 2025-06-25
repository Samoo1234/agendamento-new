// Sistema de Controle de Acesso Granular
export const PERMISSIONS = {
  // Gestão de Usuários
  USERS_VIEW: 'users:view',
  USERS_CREATE: 'users:create',
  USERS_EDIT: 'users:edit',
  USERS_DELETE: 'users:delete',
  USERS_MANAGE_ROLES: 'users:manage_roles',
  
  // Gestão de Médicos
  DOCTORS_VIEW: 'doctors:view',
  DOCTORS_CREATE: 'doctors:create',
  DOCTORS_EDIT: 'doctors:edit',
  DOCTORS_DELETE: 'doctors:delete',
  
  // Gestão de Cidades
  CITIES_VIEW: 'cities:view',
  CITIES_CREATE: 'cities:create',
  CITIES_EDIT: 'cities:edit',
  CITIES_DELETE: 'cities:delete',
  
  // Agendamentos
  APPOINTMENTS_VIEW_ALL: 'appointments:view_all',
  APPOINTMENTS_VIEW_OWN: 'appointments:view_own',
  APPOINTMENTS_CREATE: 'appointments:create',
  APPOINTMENTS_EDIT: 'appointments:edit',
  APPOINTMENTS_DELETE: 'appointments:delete',
  APPOINTMENTS_CHANGE_STATUS: 'appointments:change_status',
  
  // Datas Disponíveis
  DATES_VIEW: 'dates:view',
  DATES_MANAGE: 'dates:manage',
  
  // Financeiro
  FINANCIAL_VIEW: 'financial:view',
  FINANCIAL_CREATE: 'financial:create',
  FINANCIAL_EDIT: 'financial:edit',
  FINANCIAL_DELETE: 'financial:delete',
  FINANCIAL_REPORTS: 'financial:reports',
  
  // Dashboard e Relatórios
  DASHBOARD_VIEW: 'dashboard:view',
  REPORTS_VIEW: 'reports:view',
  REPORTS_EXPORT: 'reports:export',
  
  // Configurações do Sistema
  SYSTEM_CONFIG: 'system:config',
  SCHEDULE_CONFIG: 'schedule:config',
};

export const ROLES = {
  SUPER_ADMIN: {
    id: 'super_admin',
    name: 'Super Administrador',
    description: 'Acesso total ao sistema',
    permissions: Object.values(PERMISSIONS),
    canManageRoles: true,
  },
  
  ADMIN: {
    id: 'admin',
    name: 'Administrador',
    description: 'Administrador geral com acesso a maioria das funcionalidades',
    permissions: [
      PERMISSIONS.USERS_VIEW,
      PERMISSIONS.USERS_CREATE,
      PERMISSIONS.USERS_EDIT,
      PERMISSIONS.DOCTORS_VIEW,
      PERMISSIONS.DOCTORS_CREATE,
      PERMISSIONS.DOCTORS_EDIT,
      PERMISSIONS.CITIES_VIEW,
      PERMISSIONS.CITIES_CREATE,
      PERMISSIONS.CITIES_EDIT,
      PERMISSIONS.APPOINTMENTS_VIEW_ALL,
      PERMISSIONS.APPOINTMENTS_CREATE,
      PERMISSIONS.APPOINTMENTS_EDIT,
      PERMISSIONS.APPOINTMENTS_CHANGE_STATUS,
      PERMISSIONS.DATES_VIEW,
      PERMISSIONS.DATES_MANAGE,
      PERMISSIONS.FINANCIAL_VIEW,
      PERMISSIONS.FINANCIAL_CREATE,
      PERMISSIONS.FINANCIAL_EDIT,
      PERMISSIONS.DASHBOARD_VIEW,
      PERMISSIONS.REPORTS_VIEW,
      PERMISSIONS.SCHEDULE_CONFIG,
    ],
    canManageRoles: false,
  },
  
  MANAGER: {
    id: 'manager',
    name: 'Gerente',
    description: 'Gerente com acesso a agendamentos e relatórios',
    permissions: [
      PERMISSIONS.DOCTORS_VIEW,
      PERMISSIONS.CITIES_VIEW,
      PERMISSIONS.APPOINTMENTS_VIEW_ALL,
      PERMISSIONS.APPOINTMENTS_CREATE,
      PERMISSIONS.APPOINTMENTS_EDIT,
      PERMISSIONS.APPOINTMENTS_CHANGE_STATUS,
      PERMISSIONS.DATES_VIEW,
      PERMISSIONS.FINANCIAL_VIEW,
      PERMISSIONS.DASHBOARD_VIEW,
      PERMISSIONS.REPORTS_VIEW,
    ],
    canManageRoles: false,
  },
  
  RECEPTIONIST: {
    id: 'receptionist',
    name: 'Recepcionista',
    description: 'Acesso a agendamentos e informações básicas',
    permissions: [
      PERMISSIONS.DOCTORS_VIEW,
      PERMISSIONS.CITIES_VIEW,
      PERMISSIONS.APPOINTMENTS_VIEW_ALL,
      PERMISSIONS.APPOINTMENTS_CREATE,
      PERMISSIONS.APPOINTMENTS_EDIT,
      PERMISSIONS.APPOINTMENTS_CHANGE_STATUS,
      PERMISSIONS.DATES_VIEW,
      PERMISSIONS.DASHBOARD_VIEW,
    ],
    canManageRoles: false,
  },
  
  DOCTOR: {
    id: 'doctor',
    name: 'Médico',
    description: 'Médico com acesso aos próprios agendamentos',
    permissions: [
      PERMISSIONS.APPOINTMENTS_VIEW_OWN,
      PERMISSIONS.APPOINTMENTS_CHANGE_STATUS,
      PERMISSIONS.DATES_VIEW,
    ],
    canManageRoles: false,
  },
  
  FINANCIAL: {
    id: 'financial',
    name: 'Financeiro',
    description: 'Acesso ao módulo financeiro e relatórios',
    permissions: [
      PERMISSIONS.FINANCIAL_VIEW,
      PERMISSIONS.FINANCIAL_CREATE,
      PERMISSIONS.FINANCIAL_EDIT,
      PERMISSIONS.FINANCIAL_DELETE,
      PERMISSIONS.FINANCIAL_REPORTS,
      PERMISSIONS.APPOINTMENTS_VIEW_ALL,
      PERMISSIONS.DASHBOARD_VIEW,
      PERMISSIONS.REPORTS_VIEW,
      PERMISSIONS.REPORTS_EXPORT,
    ],
    canManageRoles: false,
  },
};

// Função para verificar se usuário tem permissão
export const hasPermission = (userRole, permission) => {
  const role = ROLES[userRole?.toUpperCase()];
  return role?.permissions.includes(permission) || false;
};

// Função para verificar múltiplas permissões
export const hasAnyPermission = (userRole, permissions) => {
  return permissions.some(permission => hasPermission(userRole, permission));
};

// Função para verificar se usuário pode gerenciar roles
export const canManageRoles = (userRole) => {
  const role = ROLES[userRole?.toUpperCase()];
  return role?.canManageRoles || false;
};

// Função para obter permissões do usuário
export const getUserPermissions = (userRole) => {
  const role = ROLES[userRole?.toUpperCase()];
  return role?.permissions || [];
};

// Função para obter lista de roles disponíveis para atribuição
export const getAvailableRoles = (currentUserRole) => {
  if (!canManageRoles(currentUserRole)) {
    return [];
  }
  
  // Super admin pode atribuir qualquer role exceto outro super admin
  if (currentUserRole?.toUpperCase() === 'SUPER_ADMIN') {
    const { SUPER_ADMIN, ...availableRoles } = ROLES;
    return Object.values(availableRoles);
  }
  
  return [];
}; 
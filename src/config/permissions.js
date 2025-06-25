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

  // === USUÁRIOS ===
  VIEW_USERS: 'view_users',
  CREATE_USERS: 'create_users',
  EDIT_USERS: 'edit_users',
  DELETE_USERS: 'delete_users',
  MANAGE_USER_ROLES: 'manage_user_roles',

  // === AGENDAMENTOS ===
  VIEW_APPOINTMENTS: 'view_appointments',
  CREATE_APPOINTMENTS: 'create_appointments',
  EDIT_APPOINTMENTS: 'edit_appointments',
  DELETE_APPOINTMENTS: 'delete_appointments',
  VIEW_ALL_APPOINTMENTS: 'view_all_appointments',
  VIEW_OWN_APPOINTMENTS: 'view_own_appointments',
  MANAGE_APPOINTMENT_STATUS: 'manage_appointment_status',

  // === MÉDICOS ===
  VIEW_DOCTORS: 'view_doctors',
  CREATE_DOCTORS: 'create_doctors',
  EDIT_DOCTORS: 'edit_doctors',
  DELETE_DOCTORS: 'delete_doctors',

  // === CIDADES E DATAS ===
  VIEW_CITIES: 'view_cities',
  CREATE_CITIES: 'create_cities',
  EDIT_CITIES: 'edit_cities',
  DELETE_CITIES: 'delete_cities',
  VIEW_DATES: 'view_dates',
  CREATE_DATES: 'create_dates',
  EDIT_DATES: 'edit_dates',
  DELETE_DATES: 'delete_dates',

  // === CLIENTES ===
  VIEW_CLIENTS: 'view_clients',
  CREATE_CLIENTS: 'create_clients',
  EDIT_CLIENTS: 'edit_clients',
  DELETE_CLIENTS: 'delete_clients',

  // === FINANCEIRO ===
  VIEW_FINANCIAL: 'view_financial',
  CREATE_FINANCIAL: 'create_financial',
  EDIT_FINANCIAL: 'edit_financial',
  DELETE_FINANCIAL: 'delete_financial',
  VIEW_FINANCIAL_REPORTS: 'view_financial_reports',

  // === WHATSAPP E TEMPLATES ===
  VIEW_TEMPLATES: 'view_templates',
  CREATE_TEMPLATES: 'create_templates',
  EDIT_TEMPLATES: 'edit_templates',
  DELETE_TEMPLATES: 'delete_templates',
  SEND_WHATSAPP: 'send_whatsapp',
  VIEW_WHATSAPP_LOGS: 'view_whatsapp_logs',
  MANAGE_N8N_INTEGRATION: 'manage_n8n_integration',

  // === RELATÓRIOS ===
  VIEW_REPORTS: 'view_reports',
  VIEW_DASHBOARD: 'view_dashboard',
  EXPORT_DATA: 'export_data',

  // === CONFIGURAÇÕES ===
  VIEW_SETTINGS: 'view_settings',
  EDIT_SETTINGS: 'edit_settings',
  MANAGE_SYSTEM: 'manage_system'
};

export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin', 
  MANAGER: 'manager',
  RECEPTIONIST: 'receptionist',
  DOCTOR: 'doctor',
  FINANCIAL: 'financial'
};

export const ROLE_PERMISSIONS = {
  [ROLES.SUPER_ADMIN]: [
    // Acesso total a tudo
    ...Object.values(PERMISSIONS)
  ],
  
  [ROLES.ADMIN]: [
    // Usuários (sem gerenciar roles)
    PERMISSIONS.VIEW_USERS,
    PERMISSIONS.CREATE_USERS,
    PERMISSIONS.EDIT_USERS,
    PERMISSIONS.DELETE_USERS,
    
    // Agendamentos completos
    PERMISSIONS.VIEW_APPOINTMENTS,
    PERMISSIONS.CREATE_APPOINTMENTS,
    PERMISSIONS.EDIT_APPOINTMENTS,
    PERMISSIONS.DELETE_APPOINTMENTS,
    PERMISSIONS.VIEW_ALL_APPOINTMENTS,
    PERMISSIONS.MANAGE_APPOINTMENT_STATUS,
    
    // Médicos completos
    PERMISSIONS.VIEW_DOCTORS,
    PERMISSIONS.CREATE_DOCTORS,
    PERMISSIONS.EDIT_DOCTORS,
    PERMISSIONS.DELETE_DOCTORS,
    
    // Cidades e Datas completos
    PERMISSIONS.VIEW_CITIES,
    PERMISSIONS.CREATE_CITIES,
    PERMISSIONS.EDIT_CITIES,
    PERMISSIONS.DELETE_CITIES,
    PERMISSIONS.VIEW_DATES,
    PERMISSIONS.CREATE_DATES,
    PERMISSIONS.EDIT_DATES,
    PERMISSIONS.DELETE_DATES,
    
    // Clientes completos
    PERMISSIONS.VIEW_CLIENTS,
    PERMISSIONS.CREATE_CLIENTS,
    PERMISSIONS.EDIT_CLIENTS,
    PERMISSIONS.DELETE_CLIENTS,
    
    // Financeiro completo
    PERMISSIONS.VIEW_FINANCIAL,
    PERMISSIONS.CREATE_FINANCIAL,
    PERMISSIONS.EDIT_FINANCIAL,
    PERMISSIONS.DELETE_FINANCIAL,
    PERMISSIONS.VIEW_FINANCIAL_REPORTS,
    
    // WhatsApp e Templates completos
    PERMISSIONS.VIEW_TEMPLATES,
    PERMISSIONS.CREATE_TEMPLATES,
    PERMISSIONS.EDIT_TEMPLATES,
    PERMISSIONS.DELETE_TEMPLATES,
    PERMISSIONS.SEND_WHATSAPP,
    PERMISSIONS.VIEW_WHATSAPP_LOGS,
    PERMISSIONS.MANAGE_N8N_INTEGRATION,
    
    // Relatórios
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.EXPORT_DATA,
    
    // Configurações básicas
    PERMISSIONS.VIEW_SETTINGS,
    PERMISSIONS.EDIT_SETTINGS
  ],
  
  [ROLES.MANAGER]: [
    // Visualizar usuários
    PERMISSIONS.VIEW_USERS,
    
    // Agendamentos (sem deletar)
    PERMISSIONS.VIEW_APPOINTMENTS,
    PERMISSIONS.CREATE_APPOINTMENTS,
    PERMISSIONS.EDIT_APPOINTMENTS,
    PERMISSIONS.VIEW_ALL_APPOINTMENTS,
    PERMISSIONS.MANAGE_APPOINTMENT_STATUS,
    
    // Médicos (visualizar e editar)
    PERMISSIONS.VIEW_DOCTORS,
    PERMISSIONS.EDIT_DOCTORS,
    
    // Cidades e Datas (visualizar e editar)
    PERMISSIONS.VIEW_CITIES,
    PERMISSIONS.EDIT_CITIES,
    PERMISSIONS.VIEW_DATES,
    PERMISSIONS.EDIT_DATES,
    
    // Clientes
    PERMISSIONS.VIEW_CLIENTS,
    PERMISSIONS.CREATE_CLIENTS,
    PERMISSIONS.EDIT_CLIENTS,
    
    // Financeiro limitado
    PERMISSIONS.VIEW_FINANCIAL,
    PERMISSIONS.VIEW_FINANCIAL_REPORTS,
    
    // WhatsApp limitado
    PERMISSIONS.VIEW_TEMPLATES,
    PERMISSIONS.SEND_WHATSAPP,
    PERMISSIONS.VIEW_WHATSAPP_LOGS,
    
    // Relatórios
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.EXPORT_DATA,
    
    // Configurações limitadas
    PERMISSIONS.VIEW_SETTINGS
  ],
  
  [ROLES.RECEPTIONIST]: [
    // Agendamentos básicos
    PERMISSIONS.VIEW_APPOINTMENTS,
    PERMISSIONS.CREATE_APPOINTMENTS,
    PERMISSIONS.EDIT_APPOINTMENTS,
    PERMISSIONS.VIEW_ALL_APPOINTMENTS,
    PERMISSIONS.MANAGE_APPOINTMENT_STATUS,
    
    // Visualizar médicos, cidades, datas
    PERMISSIONS.VIEW_DOCTORS,
    PERMISSIONS.VIEW_CITIES,
    PERMISSIONS.VIEW_DATES,
    
    // Clientes básicos
    PERMISSIONS.VIEW_CLIENTS,
    PERMISSIONS.CREATE_CLIENTS,
    PERMISSIONS.EDIT_CLIENTS,
    
    // WhatsApp básico (apenas visualizar e enviar)
    PERMISSIONS.VIEW_TEMPLATES,
    PERMISSIONS.SEND_WHATSAPP,
    
    // Dashboard básico
    PERMISSIONS.VIEW_DASHBOARD
  ],
  
  [ROLES.DOCTOR]: [
    // Apenas próprios agendamentos
    PERMISSIONS.VIEW_OWN_APPOINTMENTS,
    
    // Visualizar informações necessárias
    PERMISSIONS.VIEW_CLIENTS,
    PERMISSIONS.VIEW_CITIES,
    PERMISSIONS.VIEW_DATES,
    
    // Dashboard limitado
    PERMISSIONS.VIEW_DASHBOARD
  ],
  
  [ROLES.FINANCIAL]: [
    // Financeiro completo
    PERMISSIONS.VIEW_FINANCIAL,
    PERMISSIONS.CREATE_FINANCIAL,
    PERMISSIONS.EDIT_FINANCIAL,
    PERMISSIONS.DELETE_FINANCIAL,
    PERMISSIONS.VIEW_FINANCIAL_REPORTS,
    
    // Visualizar agendamentos (para contexto financeiro)
    PERMISSIONS.VIEW_APPOINTMENTS,
    PERMISSIONS.VIEW_ALL_APPOINTMENTS,
    
    // Visualizar clientes
    PERMISSIONS.VIEW_CLIENTS,
    
    // Relatórios financeiros
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.EXPORT_DATA
  ]
};

// Função para verificar se um usuário tem uma permissão específica
export const hasPermission = (userRole, permission) => {
  if (!userRole || !permission) {
    console.warn('hasPermission: Missing userRole or permission', { userRole, permission });
    return false;
  }
  
  const permissions = ROLE_PERMISSIONS[userRole];
  if (!permissions) {
    console.warn('hasPermission: Role not found', { userRole });
    return false;
  }
  
  return permissions.includes(permission);
};

// Função para verificar se um usuário tem qualquer uma das permissões listadas
export const hasAnyPermission = (userRole, permissions = []) => {
  if (!userRole || !Array.isArray(permissions)) {
    console.warn('hasAnyPermission: Invalid parameters', { userRole, permissions });
    return false;
  }
  
  return permissions.some(permission => hasPermission(userRole, permission));
};

// Função para verificar se um usuário tem todas as permissões listadas
export const hasAllPermissions = (userRole, permissions = []) => {
  if (!userRole || !Array.isArray(permissions)) {
    console.warn('hasAllPermissions: Invalid parameters', { userRole, permissions });
    return false;
  }
  
  return permissions.every(permission => hasPermission(userRole, permission));
};

// Função para obter todas as permissões de um role
export const getRolePermissions = (userRole) => {
  if (!userRole) {
    console.warn('getRolePermissions: Missing userRole');
    return [];
  }
  
  return ROLE_PERMISSIONS[userRole] || [];
};

// Função de segurança: verificar se é admin/super_admin
export const isAdmin = (userRole) => {
  return userRole === ROLES.SUPER_ADMIN || userRole === ROLES.ADMIN;
};

// Função para verificar acesso a integração WhatsApp/N8N
export const canManageWhatsApp = (userRole) => {
  return hasAnyPermission(userRole, [
    PERMISSIONS.SEND_WHATSAPP,
    PERMISSIONS.MANAGE_N8N_INTEGRATION,
    PERMISSIONS.VIEW_WHATSAPP_LOGS
  ]);
};

// Função para verificar acesso a templates
export const canManageTemplates = (userRole) => {
  return hasAnyPermission(userRole, [
    PERMISSIONS.VIEW_TEMPLATES,
    PERMISSIONS.CREATE_TEMPLATES,
    PERMISSIONS.EDIT_TEMPLATES,
    PERMISSIONS.DELETE_TEMPLATES
  ]);
};

export default {
  ROLES,
  PERMISSIONS,
  ROLE_PERMISSIONS,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  getRolePermissions,
  isAdmin,
  canManageWhatsApp,
  canManageTemplates
}; 
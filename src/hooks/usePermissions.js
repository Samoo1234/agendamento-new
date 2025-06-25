import { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { 
  hasPermission as checkPermission, 
  hasAnyPermission as checkAnyPermission,
  hasAllPermissions as checkAllPermissions,
  getRolePermissions,
  isAdmin,
  canManageWhatsApp,
  canManageTemplates,
  PERMISSIONS,
  ROLES
} from '../config/permissions';

/**
 * Hook customizado para verificação de permissões
 * Facilita o uso do sistema de controle de acesso nos componentes
 * VERSÃO SEGURA com fallbacks
 */
export const usePermissions = () => {
  const { user } = useStore();
  const [isLoading, setIsLoading] = useState(true);
  const [permissions, setPermissions] = useState([]);

  // Estado do usuário atual
  const userRole = user?.role || user?.perfil || null;
  const isAuthenticated = !!user && !!userRole;

  useEffect(() => {
    // Simular loading pequeno para evitar flash de conteúdo
    const timer = setTimeout(() => {
      if (isAuthenticated && userRole) {
        const userPermissions = getRolePermissions(userRole);
        setPermissions(userPermissions);
        console.log(`[usePermissions] Usuário carregado: ${userRole}, Permissões: ${userPermissions.length}`);
      } else {
        setPermissions([]);
        console.log('[usePermissions] Usuário não autenticado ou sem role');
      }
      setIsLoading(false);
    }, 50);

    return () => clearTimeout(timer);
  }, [userRole, isAuthenticated]);

  // === FUNÇÕES PRINCIPAIS ===
  
  // Verificar permissão específica
  const hasPermission = (permission) => {
    if (!isAuthenticated || !userRole) {
      console.warn(`[usePermissions] hasPermission: Usuário não autenticado para permissão ${permission}`);
      return false;
    }
    
    // Fallback de segurança: sempre permitir para super_admin
    if (userRole === ROLES.SUPER_ADMIN) {
      return true;
    }
    
    const result = checkPermission(userRole, permission);
    console.log(`[usePermissions] hasPermission: ${permission} = ${result} (role: ${userRole})`);
    return result;
  };

  // Verificar qualquer uma das permissões
  const hasAnyPermission = (permissionsList = []) => {
    if (!isAuthenticated || !userRole) {
      console.warn(`[usePermissions] hasAnyPermission: Usuário não autenticado`);
      return false;
    }
    
    // Fallback de segurança: sempre permitir para super_admin
    if (userRole === ROLES.SUPER_ADMIN) {
      return true;
    }
    
    const result = checkAnyPermission(userRole, permissionsList);
    console.log(`[usePermissions] hasAnyPermission: ${JSON.stringify(permissionsList)} = ${result} (role: ${userRole})`);
    return result;
  };

  // Verificar todas as permissões
  const hasAllPermissions = (permissionsList = []) => {
    if (!isAuthenticated || !userRole) {
      console.warn(`[usePermissions] hasAllPermissions: Usuário não autenticado`);
      return false;
    }
    
    // Fallback de segurança: sempre permitir para super_admin
    if (userRole === ROLES.SUPER_ADMIN) {
      return true;
    }
    
    const result = checkAllPermissions(userRole, permissionsList);
    console.log(`[usePermissions] hasAllPermissions: ${JSON.stringify(permissionsList)} = ${result} (role: ${userRole})`);
    return result;
  };

  // === VERIFICAÇÕES ESPECÍFICAS DO SISTEMA ===

  // Verificações de Admin
  const isSuperAdmin = () => userRole === ROLES.SUPER_ADMIN;
  const isAdminUser = () => isAdmin(userRole);
  const canManageUsers = () => hasAnyPermission([PERMISSIONS.VIEW_USERS, PERMISSIONS.CREATE_USERS, PERMISSIONS.EDIT_USERS]);
  const canManageRoles = () => userRole === ROLES.SUPER_ADMIN; // Apenas super admin

  // Verificações de Agendamentos
  const canViewAppointments = () => hasAnyPermission([PERMISSIONS.VIEW_APPOINTMENTS, PERMISSIONS.VIEW_ALL_APPOINTMENTS, PERMISSIONS.VIEW_OWN_APPOINTMENTS]);
  const canCreateAppointments = () => hasPermission(PERMISSIONS.CREATE_APPOINTMENTS);
  const canEditAppointments = () => hasPermission(PERMISSIONS.EDIT_APPOINTMENTS);
  const canDeleteAppointments = () => hasPermission(PERMISSIONS.DELETE_APPOINTMENTS);
  const canViewAllAppointments = () => hasPermission(PERMISSIONS.VIEW_ALL_APPOINTMENTS);
  const canViewOwnAppointments = () => hasPermission(PERMISSIONS.VIEW_OWN_APPOINTMENTS);
  const canManageAppointmentStatus = () => hasPermission(PERMISSIONS.MANAGE_APPOINTMENT_STATUS);

  // Verificações de Médicos
  const canViewDoctors = () => hasPermission(PERMISSIONS.VIEW_DOCTORS);
  const canCreateDoctors = () => hasPermission(PERMISSIONS.CREATE_DOCTORS);
  const canEditDoctors = () => hasPermission(PERMISSIONS.EDIT_DOCTORS);
  const canDeleteDoctors = () => hasPermission(PERMISSIONS.DELETE_DOCTORS);

  // Verificações de Cidades/Datas
  const canViewCities = () => hasPermission(PERMISSIONS.VIEW_CITIES);
  const canCreateCities = () => hasPermission(PERMISSIONS.CREATE_CITIES);
  const canEditCities = () => hasPermission(PERMISSIONS.EDIT_CITIES);
  const canDeleteCities = () => hasPermission(PERMISSIONS.DELETE_CITIES);
  const canViewDates = () => hasPermission(PERMISSIONS.VIEW_DATES);
  const canCreateDates = () => hasPermission(PERMISSIONS.CREATE_DATES);
  const canEditDates = () => hasPermission(PERMISSIONS.EDIT_DATES);
  const canDeleteDates = () => hasPermission(PERMISSIONS.DELETE_DATES);

  // Verificações de Clientes
  const canViewClients = () => hasPermission(PERMISSIONS.VIEW_CLIENTS);
  const canCreateClients = () => hasPermission(PERMISSIONS.CREATE_CLIENTS);
  const canEditClients = () => hasPermission(PERMISSIONS.EDIT_CLIENTS);
  const canDeleteClients = () => hasPermission(PERMISSIONS.DELETE_CLIENTS);

  // Verificações Financeiras
  const canViewFinancial = () => hasPermission(PERMISSIONS.VIEW_FINANCIAL);
  const canCreateFinancial = () => hasPermission(PERMISSIONS.CREATE_FINANCIAL);
  const canEditFinancial = () => hasPermission(PERMISSIONS.EDIT_FINANCIAL);
  const canDeleteFinancial = () => hasPermission(PERMISSIONS.DELETE_FINANCIAL);
  const canViewFinancialReports = () => hasPermission(PERMISSIONS.VIEW_FINANCIAL_REPORTS);

  // === VERIFICAÇÕES WHATSAPP E TEMPLATES ===
  const canViewTemplates = () => hasPermission(PERMISSIONS.VIEW_TEMPLATES);
  const canCreateTemplates = () => hasPermission(PERMISSIONS.CREATE_TEMPLATES);
  const canEditTemplates = () => hasPermission(PERMISSIONS.EDIT_TEMPLATES);
  const canDeleteTemplates = () => hasPermission(PERMISSIONS.DELETE_TEMPLATES);
  const canSendWhatsApp = () => hasPermission(PERMISSIONS.SEND_WHATSAPP);
  const canViewWhatsAppLogs = () => hasPermission(PERMISSIONS.VIEW_WHATSAPP_LOGS);
  const canManageN8NIntegration = () => hasPermission(PERMISSIONS.MANAGE_N8N_INTEGRATION);
  
  // Verificações combinadas para WhatsApp/Templates
  const hasWhatsAppAccess = () => canManageWhatsApp(userRole);
  const hasTemplateAccess = () => canManageTemplates(userRole);

  // Verificações de Relatórios e Dashboard
  const canViewReports = () => hasPermission(PERMISSIONS.VIEW_REPORTS);
  const canViewDashboard = () => hasPermission(PERMISSIONS.VIEW_DASHBOARD);
  const canExportData = () => hasPermission(PERMISSIONS.EXPORT_DATA);

  // Verificações de Configurações
  const canViewSettings = () => hasPermission(PERMISSIONS.VIEW_SETTINGS);
  const canEditSettings = () => hasPermission(PERMISSIONS.EDIT_SETTINGS);
  const canManageSystem = () => hasPermission(PERMISSIONS.MANAGE_SYSTEM);

  // === VERIFICAÇÕES DE COMPATIBILIDADE (SISTEMA LEGADO) ===
  
  // Mapeamento de compatibilidade com sistema antigo
  const isLegacyCompatible = () => {
    // Verificar se o usuário tem acesso usando o sistema antigo
    if (!user) return false;
    
    // Se não tem role definido, assumir acesso básico
    if (!userRole) {
      console.warn('[usePermissions] Usuário sem role definido, assumindo acesso básico');
      return true;
    }
    
    return true;
  };

  // === LOGS E DEBUG ===
  
  // Função para debug de permissões
  const debugPermissions = () => {
    console.group(`[usePermissions] Debug - Usuário: ${user?.nome || user?.email || 'N/A'}`);
    console.log('Role:', userRole);
    console.log('É Admin:', isAdminUser());
    console.log('Permissões:', permissions);
    console.log('WhatsApp Access:', hasWhatsAppAccess());
    console.log('Template Access:', hasTemplateAccess());
    console.groupEnd();
  };

  // === RETURN DO HOOK ===
  
  return {
    // Estado
    isLoading,
    isAuthenticated,
    userRole,
    permissions,
    user,

    // Funções principais
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,

    // Admin e Usuários
    isSuperAdmin,
    isAdminUser,
    canManageUsers,
    canManageRoles,

    // Agendamentos
    canViewAppointments,
    canCreateAppointments,
    canEditAppointments,
    canDeleteAppointments,
    canViewAllAppointments,
    canViewOwnAppointments,
    canManageAppointmentStatus,

    // Médicos
    canViewDoctors,
    canCreateDoctors,
    canEditDoctors,
    canDeleteDoctors,

    // Cidades e Datas
    canViewCities,
    canCreateCities,
    canEditCities,
    canDeleteCities,
    canViewDates,
    canCreateDates,
    canEditDates,
    canDeleteDates,

    // Clientes
    canViewClients,
    canCreateClients,
    canEditClients,
    canDeleteClients,

    // Financeiro
    canViewFinancial,
    canCreateFinancial,
    canEditFinancial,
    canDeleteFinancial,
    canViewFinancialReports,

    // WhatsApp e Templates
    canViewTemplates,
    canCreateTemplates,
    canEditTemplates,
    canDeleteTemplates,
    canSendWhatsApp,
    canViewWhatsAppLogs,
    canManageN8NIntegration,
    hasWhatsAppAccess,
    hasTemplateAccess,

    // Relatórios e Dashboard
    canViewReports,
    canViewDashboard,
    canExportData,

    // Configurações
    canViewSettings,
    canEditSettings,
    canManageSystem,

    // Compatibilidade
    isLegacyCompatible,

    // Debug
    debugPermissions,

    // Constantes exportadas
    PERMISSIONS,
    ROLES
  };
};

export default usePermissions;

/**
 * Hook para verificar permissão específica
 * Uso: const canEdit = usePermission('users:edit');
 * VERSÃO SEGURA
 */
export const usePermission = (permission, fallbackValue = false) => {
  const { hasPermission } = usePermissions();
  return hasPermission(permission);
};

/**
 * Hook para verificar múltiplas permissões
 * Uso: const canManageUsers = useAnyPermissions(['users:edit', 'users:delete']);
 * VERSÃO SEGURA
 */
export const useAnyPermissions = (permissionsList, fallbackValue = false) => {
  const { hasAnyPermission } = usePermissions();
  
  try {
    return hasAnyPermission(permissionsList);
  } catch (error) {
    console.error('Erro no hook useAnyPermissions:', error);
    return fallbackValue;
  }
}; 
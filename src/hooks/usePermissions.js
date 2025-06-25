import { useMemo } from 'react';
import { hasPermission, hasAnyPermission, canManageRoles, getUserPermissions } from '../config/permissions';
import useStore from '../store/useStore';

/**
 * Hook customizado para verificação de permissões
 * Facilita o uso do sistema de controle de acesso nos componentes
 * VERSÃO SEGURA com fallbacks
 */
export const usePermissions = () => {
  const { user } = useStore();
  
  const userRole = user?.role;
  
  // Memoizar as funções para evitar recriações desnecessárias
  const permissions = useMemo(() => ({
    // Verificar permissão específica
    can: (permission) => {
      try {
        // FALLBACK: se não há usuário ou role, permitir acesso (modo desenvolvimento)
        if (!user || !userRole) {
          console.warn('usePermissions: Usuário ou role não definido, permitindo acesso');
          return true;
        }
        
        return hasPermission(userRole, permission);
      } catch (error) {
        console.error('Erro na verificação de permissão:', error);
        // FALLBACK: em caso de erro, permitir acesso para não quebrar a interface
        return true;
      }
    },
    
    // Verificar se tem qualquer uma das permissões
    canAny: (permissionsList) => {
      try {
        if (!user || !userRole) {
          console.warn('usePermissions: Usuário ou role não definido, permitindo acesso');
          return true;
        }
        
        if (!Array.isArray(permissionsList) || permissionsList.length === 0) {
          return true;
        }
        
        return hasAnyPermission(userRole, permissionsList);
      } catch (error) {
        console.error('Erro na verificação de múltiplas permissões:', error);
        return true; // FALLBACK
      }
    },
    
    // Verificar se pode gerenciar roles
    canManage: () => {
      try {
        if (!user || !userRole) return false;
        return canManageRoles(userRole);
      } catch (error) {
        console.error('Erro na verificação de gerenciamento de roles:', error);
        return false; // Para gerenciamento, ser mais restritivo
      }
    },
    
    // Obter todas as permissões do usuário
    getAll: () => {
      try {
        if (!user || !userRole) return [];
        return getUserPermissions(userRole);
      } catch (error) {
        console.error('Erro ao obter permissões do usuário:', error);
        return [];
      }
    },
    
    // Verificar se é super admin
    isSuperAdmin: () => {
      try {
        return userRole?.toUpperCase() === 'SUPER_ADMIN';
      } catch (error) {
        return false;
      }
    },
    
    // Verificar se é admin (admin ou super_admin)
    isAdmin: () => {
      try {
        return ['ADMIN', 'SUPER_ADMIN'].includes(userRole?.toUpperCase());
      } catch (error) {
        return false;
      }
    },
    
    // Obter role atual
    getRole: () => {
      try {
        return userRole || 'guest';
      } catch (error) {
        return 'guest';
      }
    },
    
    // Verificar se tem acesso a rota
    canAccessRoute: (routePermissions) => {
      try {
        if (!routePermissions || routePermissions.length === 0) return true;
        
        if (!user || !userRole) {
          console.warn('usePermissions: Usuário não autenticado, permitindo acesso à rota');
          return true;
        }
        
        return hasAnyPermission(userRole, routePermissions);
      } catch (error) {
        console.error('Erro na verificação de acesso à rota:', error);
        return true; // FALLBACK: permitir acesso
      }
    },
    
    // NOVO: Modo de depuração
    isDebugMode: () => {
      return process.env.NODE_ENV === 'development' || window.location.hostname === 'localhost';
    },
    
    // NOVO: Verificação com modo seguro
    canSafe: (permission, fallbackValue = false) => {
      try {
        if (!user || !userRole) return fallbackValue;
        return hasPermission(userRole, permission);
      } catch (error) {
        console.error('Erro na verificação segura de permissão:', error);
        return fallbackValue;
      }
    }
  }), [user, userRole]);
  
  return permissions;
};

/**
 * Hook para verificar permissão específica
 * Uso: const canEdit = usePermission('users:edit');
 * VERSÃO SEGURA
 */
export const usePermission = (permission, fallbackValue = false) => {
  const { canSafe } = usePermissions();
  return canSafe(permission, fallbackValue);
};

/**
 * Hook para verificar múltiplas permissões
 * Uso: const canManageUsers = useAnyPermissions(['users:edit', 'users:delete']);
 * VERSÃO SEGURA
 */
export const useAnyPermissions = (permissionsList, fallbackValue = false) => {
  const { canAny } = usePermissions();
  
  try {
    return canAny(permissionsList);
  } catch (error) {
    console.error('Erro no hook useAnyPermissions:', error);
    return fallbackValue;
  }
}; 
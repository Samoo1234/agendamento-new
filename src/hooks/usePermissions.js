/**
 * HOOK DE PERMISSÕES SIMPLIFICADO
 * SISTEMA: ADMIN vs USUARIO
 */

import { useMemo } from 'react';
import useStore from '../store/useStore';
import { 
  PERMISSIONS, 
  getRolePermissions,
  mapLegacyRole,
  isValidPermission,
  isAdminRole,
  getAllPermissions
} from '../config/permissions';

/**
 * Hook principal para gerenciamento de permissões
 * SISTEMA SIMPLIFICADO
 */
export function usePermissions() {
  const { user } = useStore();

  // ========================================
  // DETERMINAÇÃO DO ROLE ATUAL
  // ========================================
  
  const currentRole = useMemo(() => {
    try {
      if (!user) {
        return 'usuario';
      }

      // Verificar role atual
      if (user.role) {
        return mapLegacyRole(user.role);
      }

      // Verificar perfil legado
      if (user.perfil) {
        return mapLegacyRole(user.perfil);
      }

      // Fallback
      return 'usuario';

    } catch (error) {
      console.error('usePermissions: Erro ao determinar role:', error);
      return 'usuario';
    }
  }, [user]);

  // ========================================
  // PERMISSÕES DO USUÁRIO ATUAL
  // ========================================
  
  const userPermissions = useMemo(() => {
    try {
      // Se é admin, tem todas as permissões
      if (isAdminRole(currentRole)) {
        return getAllPermissions();
      }

      // Se tem permissões customizadas, usar elas
      if (user?.permissions && Array.isArray(user.permissions)) {
        return user.permissions.filter(p => isValidPermission(p));
      }

      // Usuário sem permissões customizadas = sem permissões
      return [];

    } catch (error) {
      console.error('usePermissions: Erro ao obter permissões:', error);
      return [];
    }
  }, [currentRole, user?.permissions]);

  // ========================================
  // FUNÇÕES PÚBLICAS
  // ========================================

  /**
   * Verifica se o usuário tem uma permissão específica
   */
  const can = (permission) => {
    try {
      if (!permission || !isValidPermission(permission)) {
        return false;
      }

      return userPermissions.includes(permission);

    } catch (error) {
      console.error('usePermissions.can: Erro:', error);
      return false;
    }
  };

  /**
   * Verifica se o usuário tem QUALQUER uma das permissões
   */
  const canAny = (permissions = []) => {
    try {
      if (!Array.isArray(permissions) || permissions.length === 0) {
        return true;
      }

      return permissions.some(permission => can(permission));

    } catch (error) {
      console.error('usePermissions.canAny: Erro:', error);
      return false;
    }
  };

  /**
   * Verifica se o usuário tem TODAS as permissões
   */
  const canAll = (permissions = []) => {
    try {
      if (!Array.isArray(permissions) || permissions.length === 0) {
        return true;
      }

      return permissions.every(permission => can(permission));

    } catch (error) {
      console.error('usePermissions.canAll: Erro:', error);
      return false;
    }
  };

  /**
   * Obtém o role atual do usuário
   */
  const getRole = () => {
    return currentRole;
  };

  /**
   * Obtém todas as permissões do usuário
   */
  const getAll = () => {
    return [...userPermissions];
  };

  /**
   * Verifica se é admin
   */
  const isAdmin = () => {
    return isAdminRole(currentRole);
  };

  /**
   * COMPATIBILIDADE: Acesso legado baseado no perfil antigo
   */
  const hasLegacyAccess = (feature) => {
    try {
      if (!user) return false;

      const legacyProfile = user.perfil?.toLowerCase();
      
      // Admin tem acesso a tudo
      if (legacyProfile === 'admin' || legacyProfile === 'administrador') {
        return true;
      }

      // Mapeamento básico para compatibilidade
      const basicAccess = [
        'dashboard', 'agendamentos', 'clientes', 'medicos', 
        'cidades', 'datas', 'historico'
      ];

      return basicAccess.includes(feature?.toLowerCase());

    } catch (error) {
      console.error('usePermissions.hasLegacyAccess: Erro:', error);
      return false;
    }
  };

  // ========================================
  // RETORNO DO HOOK
  // ========================================

  return {
    // Verificações principais
    can,
    canAny, 
    canAll,
    
    // Informações do usuário
    getRole,
    getAll,
    isAdmin,
    
    // Compatibilidade
    hasLegacyAccess,
    
    // Dados para debug
    user: user || null,
    role: currentRole,
    permissions: userPermissions
  };
}

// ========================================
// HOOKS AUXILIARES
// ========================================

/**
 * Hook para verificar uma permissão específica
 */
export function usePermission(permission) {
  const { can } = usePermissions();
  return can(permission);
}

/**
 * Hook para verificar múltiplas permissões
 */
export function usePermissions2(permissions = []) {
  const { canAny } = usePermissions();
  return canAny(permissions);
}

/**
 * Hook para obter o role atual
 */
export function useRole() {
  const { getRole } = usePermissions();
  return getRole();
}

export default usePermissions; 
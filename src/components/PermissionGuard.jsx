import React from 'react';
import styled from 'styled-components';
import { usePermissions } from '../hooks/usePermissions';

const AccessDeniedMessage = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
  color: #666;
  background: #f8f9fa;
  border-radius: 8px;
  margin: 20px 0;

  h3 {
    color: #dc3545;
    margin-bottom: 10px;
  }

  p {
    margin-bottom: 0;
    font-size: 14px;
  }
`;

const DebugInfo = styled.div`
  background: #fff3cd;
  border: 1px solid #ffeaa7;
  border-radius: 4px;
  padding: 10px;
  margin: 10px 0;
  font-size: 12px;
  color: #856404;
`;

/**
 * Componente para proteger conteúdo baseado em permissões
 * VERSÃO SEGURA com fallbacks
 * 
 * @param {Object} props
 * @param {string|string[]} props.permission - Permissão(ões) necessária(s)
 * @param {React.ReactNode} props.children - Conteúdo a ser protegido
 * @param {React.ReactNode} props.fallback - Componente alternativo se não tiver permissão
 * @param {boolean} props.requireAll - Se true, requer todas as permissões; se false, qualquer uma
 * @param {boolean} props.showMessage - Se deve mostrar mensagem de acesso negado
 * @param {boolean} props.safeMode - Se true, permite acesso em caso de erro
 * @param {boolean} props.showDebug - Se deve mostrar informações de debug
 */
export const PermissionGuard = ({ 
  permission, 
  children, 
  fallback = null, 
  requireAll = false,
  showMessage = true,
  safeMode = true,
  showDebug = false
}) => {
  const { can, canAny, isDebugMode, getRole } = usePermissions();
  
  let hasAccess = false;
  let errorOccurred = false;
  let debugInfo = {};
  
  try {
    if (Array.isArray(permission)) {
      hasAccess = requireAll 
        ? permission.every(p => can(p))
        : canAny(permission);
      
      debugInfo = {
        permissions: permission,
        requireAll,
        userRole: getRole(),
        results: permission.map(p => ({ permission: p, allowed: can(p) }))
      };
    } else {
      hasAccess = can(permission);
      
      debugInfo = {
        permission,
        userRole: getRole(),
        allowed: hasAccess
      };
    }
  } catch (error) {
    console.error('Erro no PermissionGuard:', error);
    errorOccurred = true;
    
    // Em modo seguro, permitir acesso se houver erro
    if (safeMode) {
      console.warn('PermissionGuard: Erro detectado, permitindo acesso devido ao modo seguro');
      hasAccess = true;
    }
    
    debugInfo = {
      error: error.message,
      safeMode,
      fallbackAccess: hasAccess
    };
  }
  
  // Se tem acesso, mostrar conteúdo
  if (hasAccess) {
    return (
      <>
        {showDebug && isDebugMode() && (
          <DebugInfo>
            <strong>🔍 Debug PermissionGuard:</strong>
            <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
          </DebugInfo>
        )}
        {children}
      </>
    );
  }
  
  // Se tem fallback personalizado, usar ele
  if (fallback) {
    return (
      <>
        {showDebug && isDebugMode() && (
          <DebugInfo>
            <strong>🔍 Debug PermissionGuard (Fallback):</strong>
            <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
          </DebugInfo>
        )}
        {fallback}
      </>
    );
  }
  
  // Se deve mostrar mensagem de acesso negado
  if (showMessage) {
    return (
      <>
        {showDebug && isDebugMode() && (
          <DebugInfo>
            <strong>🔍 Debug PermissionGuard (Acesso Negado):</strong>
            <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
          </DebugInfo>
        )}
        <AccessDeniedMessage>
          <h3>🔒 Acesso Restrito</h3>
          <p>Você não tem permissão para acessar este conteúdo.</p>
          <p>Entre em contato com o administrador se precisar de acesso.</p>
          {errorOccurred && (
            <p style={{ color: '#dc3545', marginTop: '10px' }}>
              ⚠️ Erro técnico detectado. Contate o suporte técnico.
            </p>
          )}
        </AccessDeniedMessage>
      </>
    );
  }
  
  // Caso contrário, não mostrar nada
  return null;
};

/**
 * Componente para mostrar botões condicionalmente baseado em permissões
 * VERSÃO SEGURA
 */
export const ConditionalButton = ({ 
  permission, 
  children, 
  requireAll = false,
  disabled = false,
  safeMode = true,
  ...buttonProps 
}) => {
  const { can, canAny } = usePermissions();
  
  let hasAccess = false;
  
  try {
    if (Array.isArray(permission)) {
      hasAccess = requireAll 
        ? permission.every(p => can(p))
        : canAny(permission);
    } else {
      hasAccess = can(permission);
    }
  } catch (error) {
    console.error('Erro no ConditionalButton:', error);
    
    // Em modo seguro, mostrar botão mas desabilitado
    if (safeMode) {
      hasAccess = true;
      disabled = true;
    }
  }
  
  if (!hasAccess) {
    return null;
  }
  
  return React.cloneElement(children, {
    disabled: disabled || !hasAccess,
    ...buttonProps
  });
};

/**
 * HOC para proteger rotas inteiras
 * VERSÃO SEGURA
 */
export const withPermissions = (Component, requiredPermissions, options = {}) => {
  const {
    requireAll = false,
    safeMode = true,
    showDebug = false
  } = options;
  
  return function ProtectedComponent(props) {
    return (
      <PermissionGuard 
        permission={requiredPermissions} 
        requireAll={requireAll}
        showMessage={true}
        safeMode={safeMode}
        showDebug={showDebug}
      >
        <Component {...props} />
      </PermissionGuard>
    );
  };
};

/**
 * Componente para desenvolvimento - mostra todas as permissões do usuário
 */
export const PermissionDebugger = () => {
  const { getAll, getRole, isDebugMode } = usePermissions();
  
  if (!isDebugMode()) {
    return null;
  }
  
  const permissions = getAll();
  
  return (
    <DebugInfo style={{ position: 'fixed', top: '10px', right: '10px', zIndex: 9999 }}>
      <strong>🔍 Debug Permissões:</strong>
      <p><strong>Role:</strong> {getRole()}</p>
      <p><strong>Permissões:</strong></p>
      <ul style={{ margin: 0, paddingLeft: '20px' }}>
        {permissions.map(permission => (
          <li key={permission}>{permission}</li>
        ))}
      </ul>
    </DebugInfo>
  );
};

export default PermissionGuard; 
import React from 'react';
import styled from 'styled-components';

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

/**
 * Componente para proteger conteúdo - versão simplificada
 */
export const PermissionGuard = ({ 
  permission, 
  children, 
  fallback = null, 
  showMessage = true
}) => {
  // Por enquanto, sempre permitir acesso
  return children;
};

/**
 * HOC para proteger componentes - versão simplificada
 */
export const withPermissions = (Component, requiredPermissions, options = {}) => {
  return function ProtectedComponent(props) {
    // Por enquanto, sempre renderizar o componente
    return <Component {...props} />;
  };
};

export default PermissionGuard; 
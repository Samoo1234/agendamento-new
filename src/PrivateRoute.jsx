import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import useStore from './store/useStore';

const PrivateRoute = () => {
  const { isAuthenticated } = useStore();

  // Se não estiver autenticado, redireciona para o login
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // Se estiver autenticado, renderiza o conteúdo protegido
  return <Outlet />;
};

export default PrivateRoute;

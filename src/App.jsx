import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import PrivateRoute from './PrivateRoute';
import Layout from './Layout';
import Login from './Login';
import Dashboard from './Dashboard';
import DatasDisponiveis from './DatasDisponiveis';
import Medicos from './Medicos';
import Cidades from './Cidades';
import Clientes from './Clientes';
import GerenciarUsuarios from './GerenciarUsuarios';
import AgendamentoForm from './AgendamentoForm';
import GerenciarClientes from './GerenciarClientes';
import Financeiro from './Financeiro';
import HistoricoAgendamentos from './HistoricoAgendamentos';
import { PERMISSIONS } from './config/permissions';
import { withPermissions } from './components/PermissionGuard';

// Componentes protegidos por permissões
const ProtectedDashboard = withPermissions(Dashboard, [PERMISSIONS.DASHBOARD_VIEW]);
const ProtectedDatasDisponiveis = withPermissions(DatasDisponiveis, [PERMISSIONS.DATES_VIEW]);
const ProtectedMedicos = withPermissions(Medicos, [PERMISSIONS.DOCTORS_VIEW]);
const ProtectedCidades = withPermissions(Cidades, [PERMISSIONS.CITIES_VIEW]);
const ProtectedGerenciarClientes = withPermissions(GerenciarClientes, [PERMISSIONS.APPOINTMENTS_VIEW_ALL]);
const ProtectedGerenciarUsuarios = withPermissions(GerenciarUsuarios, [PERMISSIONS.USERS_VIEW]);
const ProtectedFinanceiro = withPermissions(Financeiro, [PERMISSIONS.FINANCIAL_VIEW]);
const ProtectedHistoricoAgendamentos = withPermissions(HistoricoAgendamentos, [PERMISSIONS.APPOINTMENTS_VIEW_ALL]);

function App() {
  return (
    <>
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#333',
            color: '#fff',
          },
          success: {
            style: {
              background: '#28a745',
            },
          },
          error: {
            style: {
              background: '#dc3545',
            },
          },
        }}
      />
      <Routes>
        <Route path="/" element={<AgendamentoForm />} />
        <Route path="/login" element={<Login />} />
        <Route element={<PrivateRoute />}>
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<ProtectedDashboard />} />
            <Route path="/datas-disponiveis" element={<ProtectedDatasDisponiveis />} />
            <Route path="/medicos" element={<ProtectedMedicos />} />
            <Route path="/cidades" element={<ProtectedCidades />} />
            <Route path="/clientes" element={<ProtectedGerenciarClientes />} />
            <Route path="/gerenciar-usuarios" element={<ProtectedGerenciarUsuarios />} />
            <Route path="/financeiro" element={<ProtectedFinanceiro />} />
            {/* Rota alternativa para o financeiro */}
            <Route path="/modulo-financeiro" element={<ProtectedFinanceiro />} />
            {/* Rota para o histórico de agendamentos */}
            <Route path="/historico" element={<ProtectedHistoricoAgendamentos />} />
          </Route>
        </Route>
      </Routes>
    </>
  );
}

export default App;
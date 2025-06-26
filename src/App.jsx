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
import FixAdminUser from './FixAdminUser';

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
        <Route path="/fix-admin" element={<FixAdminUser />} />
        <Route element={<PrivateRoute />}>
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/datas-disponiveis" element={<DatasDisponiveis />} />
            <Route path="/medicos" element={<Medicos />} />
            <Route path="/cidades" element={<Cidades />} />
            <Route path="/clientes" element={<GerenciarClientes />} />
            <Route path="/gerenciar-usuarios" element={<GerenciarUsuarios />} />
            <Route path="/financeiro" element={<Financeiro />} />
            {/* Rota alternativa para o financeiro */}
            <Route path="/modulo-financeiro" element={<Financeiro />} />
            {/* Rota para o histórico de agendamentos */}
            <Route path="/historico" element={<HistoricoAgendamentos />} />
          </Route>
        </Route>
      </Routes>
    </>
  );
}

export default App;
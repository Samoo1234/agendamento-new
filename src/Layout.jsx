import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useNavigate, Outlet, Link as RouterLink, useLocation } from 'react-router-dom';
import useStore from './store/useStore';
import { Toaster } from 'react-hot-toast';
import { AiOutlineDashboard, AiOutlineCalendar, AiOutlineUser, AiOutlineTeam, AiOutlineLogout, AiOutlineMenu, AiOutlineClose, AiOutlineSetting, AiOutlineHistory } from 'react-icons/ai';
import { BiBuilding } from 'react-icons/bi';
import { FaMoneyBillWave } from 'react-icons/fa';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Container = styled.div`
  display: flex;
  min-height: 100vh;
  background-color: #f5f5f5;
  padding-top: 60px;
`;

const Navbar = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 60px;
  background-color: #000033;
  color: white;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  z-index: 100;
`;

const MenuButton = styled.button`
  background: none;
  border: none;
  color: white;
  font-size: 24px;
  cursor: pointer;
  display: flex;
  align-items: center;
  padding: 8px;
  border-radius: 4px;
  transition: background-color 0.2s;

  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }
`;

const Sidebar = styled.div`
  position: fixed;
  top: 60px;
  left: 0;
  height: calc(100vh - 60px);
  width: ${props => props.$sidebarOpen ? '250px' : '0'};
  background-color: #000033;
  color: white;
  transition: width 0.3s ease;
  overflow: hidden;
  z-index: 99;
  padding: ${props => props.$sidebarOpen ? '20px' : '0'};
`;

const Overlay = styled.div`
  position: fixed;
  top: 60px;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 98;
`;

const MainContent = styled.div`
  flex: 1;
  padding: 20px;
  margin-left: ${props => props.$sidebarOpen ? '250px' : '0'};
  margin-top: 0;
  transition: margin-left 0.3s ease;
`;

const MenuItem = styled.div`
  padding: 12px;
  margin: 5px 0;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
  color: white;

  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }

  &.active {
    background-color: rgba(255, 255, 255, 0.2);
  }

  svg {
    font-size: 20px;
    color: white;
  }
`;

const LogoutItem = styled(MenuItem)`
  margin-top: auto;
  color: #dc3545;

  svg {
    color: #dc3545;
  }

  &:hover {
    background-color: rgba(255, 107, 107, 0.1);
  }
`;

const MenuLink = styled(RouterLink)`
  text-decoration: none;
  color: inherit;
`;

function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, logout } = useStore();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const menuItems = [
    { icon: <AiOutlineDashboard />, text: 'Dashboard', path: '/dashboard' },
    { icon: <AiOutlineCalendar />, text: 'Datas Disponíveis', path: '/datas-disponiveis' },
    { icon: <AiOutlineUser />, text: 'Médicos', path: '/medicos' },
    { icon: <BiBuilding />, text: 'Cidades', path: '/cidades' },
    { icon: <AiOutlineTeam />, text: 'Clientes', path: '/clientes' },
    { icon: <FaMoneyBillWave />, text: 'Financeiro', path: '/financeiro', alwaysShow: true },
    { icon: <AiOutlineHistory />, text: 'Histórico', path: '/historico' },
    { icon: <AiOutlineSetting />, text: 'Gerenciar Usuários', path: '/gerenciar-usuarios' }
  ];

  // Verificar se estamos em ambiente de produção
  const isProduction = window.location.hostname !== 'localhost' && !window.location.hostname.includes('127.0.0.1');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  return (
    <Container>
      <ToastContainer position="top-right" autoClose={3000} />
      <Navbar>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <MenuButton onClick={toggleSidebar}>
            {sidebarOpen ? <AiOutlineClose /> : <AiOutlineMenu />}
          </MenuButton>
          <span>Sistema de Agendamento</span>
        </div>
      </Navbar>

      {sidebarOpen && (
        <Overlay
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar $sidebarOpen={sidebarOpen}>
        {menuItems.map((item, index) => (
          <MenuItem
            key={index}
            onClick={() => navigate(item.path)}
            className={location.pathname === item.path ? 'active' : ''}
            style={{ display: item.alwaysShow ? 'flex' : undefined }}
          >
            {item.icon}
            {item.text}
          </MenuItem>
        ))}
        <LogoutItem
          onClick={() => {
            logout();
            navigate('/login');
          }}
        >
          <AiOutlineLogout />
          Sair
        </LogoutItem>
      </Sidebar>

      <MainContent $sidebarOpen={sidebarOpen}>
        <Outlet />
      </MainContent>
    </Container>
  );
}

export default Layout;
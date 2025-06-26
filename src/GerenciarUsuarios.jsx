import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import toast from 'react-hot-toast';
import { collection, getDocs, updateDoc, deleteDoc, doc, addDoc, query, where } from 'firebase/firestore';
import { db } from './config/firebase';
import { createUserWithEmailAndPassword, deleteUser } from 'firebase/auth';
import { auth } from './config/firebase';
import { PERMISSIONS } from './config/permissions';
import { usePermissions } from './hooks/usePermissions';

const MainContent = styled.div`
  width: 100%;
  padding: 20px;
`;

const Title = styled.h1`
  color: #333;
  margin-bottom: 20px;
`;

const Button = styled.button`
  padding: 8px 16px;
  background-color: #000080;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  height: 35px;
  margin-bottom: 20px;

  &:hover {
    background-color: #000066;
  }
`;

const Table = styled.table`
  width: 100%;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  border-collapse: collapse;
`;

const Th = styled.th`
  text-align: left;
  padding: 12px;
  border-bottom: 2px solid #ddd;
  color: #333;
`;

const Td = styled.td`
  padding: 12px;
  border-bottom: 1px solid #ddd;
  color: #666;
`;

const ActionButton = styled.button`
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-right: 5px;
  color: white;
  background-color: ${props => props.$variant === 'edit' ? '#007bff' : '#dc3545'};

  &:hover {
    opacity: 0.9;
  }
`;

const ToggleSwitch = styled.label`
  position: relative;
  display: inline-block;
  width: 50px;
  height: 24px;

  input {
    opacity: 0;
    width: 0;
    height: 0;
  }

  span {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #ccc;
    transition: .4s;
    border-radius: 34px;

    &:before {
      position: absolute;
      content: "";
      height: 16px;
      width: 16px;
      left: 4px;
      bottom: 4px;
      background-color: white;
      transition: .4s;
      border-radius: 50%;
    }
  }

  input:checked + span {
    background-color: #28a745;
  }

  input:checked + span:before {
    transform: translateX(26px);
  }
`;

const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: white;
  padding: 20px;
  border-radius: 8px;
  width: 100%;
  max-width: 400px;
`;

const Input = styled.input`
  width: 100%;
  padding: 8px;
  margin-bottom: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
`;

const Select = styled.select`
  width: 100%;
  padding: 8px;
  margin-bottom: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
`;

const ModalButtons = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
`;

const ModalButton = styled.button`
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  background-color: ${props => props.$cancel ? '#ddd' : '#000080'};
  color: ${props => props.$cancel ? '#333' : 'white'};

  &:hover {
    opacity: 0.9;
  }
`;

const PermissionsModal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1001;
`;

const PermissionsModalContent = styled.div`
  background: white;
  padding: 30px;
  border-radius: 12px;
  width: 90%;
  max-width: 800px;
  max-height: 80vh;
  overflow-y: auto;
`;

const TabContainer = styled.div`
  display: flex;
  border-bottom: 2px solid #eee;
  margin-bottom: 20px;
`;

const Tab = styled.button`
  padding: 12px 24px;
  border: none;
  background: ${props => props.$active ? '#000080' : 'transparent'};
  color: ${props => props.$active ? 'white' : '#666'};
  cursor: pointer;
  border-radius: 8px 8px 0 0;
  font-weight: ${props => props.$active ? 'bold' : 'normal'};
  margin-right: 5px;
  
  &:hover {
    background: ${props => props.$active ? '#000080' : '#f5f5f5'};
  }
`;

const RoleCard = styled.div`
  border: 2px solid ${props => props.$selected ? '#000080' : '#ddd'};
  border-radius: 8px;
  padding: 15px;
  margin: 10px 0;
  cursor: pointer;
  transition: all 0.3s;
  background: ${props => props.$selected ? '#f0f4ff' : 'white'};
  
  &:hover {
    border-color: #000080;
    box-shadow: 0 2px 8px rgba(0,0,128,0.1);
  }
`;

const RoleBadge = styled.span`
  display: inline-block;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: bold;
  margin-left: 10px;
  color: white;
  background: ${props => {
    switch(props.$role) {
      case 'SUPER_ADMIN': return '#dc3545';
      case 'ADMIN': return '#007bff';
      case 'MANAGER': return '#28a745';
      case 'RECEPTIONIST': return '#ffc107';
      case 'DOCTOR': return '#17a2b8';
      case 'FINANCIAL': return '#6f42c1';
      default: return '#6c757d';
    }
  }};
`;

const PermissionGroup = styled.div`
  margin: 20px 0;
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 15px;
`;

const PermissionGroupTitle = styled.h4`
  color: #333;
  margin: 0 0 15px 0;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const CheckboxGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 10px;
`;

const CheckboxItem = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 5px;
  border-radius: 4px;
  
  &:hover {
    background: #f5f5f5;
  }
  
  input[type="checkbox"] {
    width: 16px;
    height: 16px;
  }
`;

const PermissionsButton = styled.button`
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-right: 5px;
  color: white;
  background-color: #28a745;
  font-size: 12px;

  &:hover {
    opacity: 0.9;
  }
`;

const PERMISSION_GROUPS = {
  usuarios: {
    label: '👥 Usuários',
    permissions: [
      { key: 'USERS_VIEW', label: 'Visualizar usuários' },
      { key: 'USERS_CREATE', label: 'Criar usuários' },
      { key: 'USERS_EDIT', label: 'Editar usuários' },
      { key: 'USERS_DELETE', label: 'Deletar usuários' },
      { key: 'USERS_MANAGE_ROLES', label: 'Gerenciar roles' }
    ]
  },
  agendamentos: {
    label: '📅 Agendamentos',
    permissions: [
      { key: 'APPOINTMENTS_VIEW', label: 'Ver agendamentos' },
      { key: 'APPOINTMENTS_CREATE', label: 'Criar agendamentos' },
      { key: 'APPOINTMENTS_EDIT', label: 'Editar agendamentos' },
      { key: 'APPOINTMENTS_DELETE', label: 'Deletar agendamentos' },
      { key: 'APPOINTMENTS_VIEW_ALL', label: 'Ver todos os agendamentos' },
      { key: 'APPOINTMENTS_VIEW_OWN', label: 'Ver próprios agendamentos' },
      { key: 'APPOINTMENTS_MANAGE_STATUS', label: 'Gerenciar status' }
    ]
  },
  medicos: {
    label: '👨‍⚕️ Médicos',
    permissions: [
      { key: 'DOCTORS_VIEW', label: 'Visualizar médicos' },
      { key: 'DOCTORS_CREATE', label: 'Criar médicos' },
      { key: 'DOCTORS_EDIT', label: 'Editar médicos' },
      { key: 'DOCTORS_DELETE', label: 'Deletar médicos' }
    ]
  },
  localizacao: {
    label: '🏙️ Cidades & Datas',
    permissions: [
      { key: 'CITIES_VIEW', label: 'Ver cidades' },
      { key: 'CITIES_CREATE', label: 'Criar cidades' },
      { key: 'CITIES_EDIT', label: 'Editar cidades' },
      { key: 'CITIES_DELETE', label: 'Deletar cidades' },
      { key: 'DATES_VIEW', label: 'Ver datas' },
      { key: 'DATES_CREATE', label: 'Criar datas' },
      { key: 'DATES_EDIT', label: 'Editar datas' },
      { key: 'DATES_DELETE', label: 'Deletar datas' }
    ]
  },
  clientes: {
    label: '👤 Clientes',
    permissions: [
      { key: 'CLIENTS_VIEW', label: 'Visualizar clientes' },
      { key: 'CLIENTS_CREATE', label: 'Criar clientes' },
      { key: 'CLIENTS_EDIT', label: 'Editar clientes' },
      { key: 'CLIENTS_DELETE', label: 'Deletar clientes' }
    ]
  },
  financeiro: {
    label: '💰 Financeiro',
    permissions: [
      { key: 'FINANCIAL_VIEW', label: 'Ver financeiro' },
      { key: 'FINANCIAL_CREATE', label: 'Criar registros' },
      { key: 'FINANCIAL_EDIT', label: 'Editar registros' },
      { key: 'FINANCIAL_DELETE', label: 'Deletar registros' },
      { key: 'FINANCIAL_REPORTS', label: 'Relatórios financeiros' }
    ]
  },
  historico: {
    label: '📋 Histórico',
    permissions: [
      { key: 'APPOINTMENTS_VIEW', label: 'Ver histórico de agendamentos' },
      { key: 'EXPORT_DATA', label: 'Exportar dados (PDF)' }
    ]
  },
  sistema: {
    label: '⚙️ Sistema & Relatórios',
    permissions: [
      { key: 'REPORTS_VIEW', label: 'Ver relatórios' },
      { key: 'DASHBOARD_VIEW', label: 'Ver dashboard' },
      { key: 'EXPORT_DATA', label: 'Exportar dados' },
      { key: 'SETTINGS_VIEW', label: 'Ver configurações' },
      { key: 'SETTINGS_EDIT', label: 'Editar configurações' },
      { key: 'SYSTEM_MANAGE', label: 'Gerenciar sistema' }
    ]
  }
};

const GerenciarUsuarios = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    email: '',
    senha: '',
    cidade: '',
    role: 'usuario'
  });
  
  // NOVOS ESTADOS PARA SISTEMA DE PERMISSÕES
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [permissionsUserId, setPermissionsUserId] = useState(null);
  const [customPermissions, setCustomPermissions] = useState([]);

  // HOOK DE PERMISSÕES
  const { can } = usePermissions();

  const fetchUsers = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'usuarios'));

      const usersData = querySnapshot.docs.map(doc => {
        const data = doc.data();

        return {
          id: doc.id,
          ...data
        };
      });

      setUsers(usersData);
    } catch (error) {
      toast.error('Erro ao carregar usuários');
      console.error('Erro:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleStatusChange = async (id, currentStatus) => {
    try {
      const userRef = doc(db, 'usuarios', id);
      await updateDoc(userRef, {
        disabled: !currentStatus
      });
      toast.success('Status atualizado com sucesso!');
      fetchUsers();
    } catch (error) {
      toast.error('Erro ao atualizar status');
      console.error('Erro:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir este usuário? Isso removerá o usuário tanto do sistema quanto do Firebase Authentication.')) {
      try {
        // 1. Primeiro buscar os dados do usuário para pegar o email
        const userDoc = users.find(user => user.id === id);
        const userEmail = userDoc?.email;

        // 2. Excluir da coleção usuarios
        await deleteDoc(doc(db, 'usuarios', id));
        
        // 3. Tentar excluir do Firebase Authentication (se possível)
        if (userEmail) {
          try {
            // Nota: Isso só funciona se o usuário atual for admin e tiver as permissões adequadas
            // Para funcionar completamente, seria necessário usar Firebase Admin SDK

            toast.success(`Usuário excluído da coleção! Para completar, remova ${userEmail} do Firebase Authentication no console.`);
          } catch (authError) {
            console.warn('Não foi possível remover do Authentication automaticamente:', authError);
            toast.success(`Usuário excluído da coleção! Para completar, remova ${userEmail} do Firebase Authentication no console.`);
          }
        } else {
          toast.success('Usuário excluído com sucesso!');
        }
        
        fetchUsers();
      } catch (error) {
        toast.error('Erro ao excluir usuário');
        console.error('Erro:', error);
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // NOVAS FUNÇÕES PARA SISTEMA DE PERMISSÕES
  const openPermissionsModal = (user) => {
    setPermissionsUserId(user.id);
    
    // Se for admin, carregar TODAS as permissões automaticamente
    if (user.role === 'admin' || user.role === 'administrador') {
      setCustomPermissions(Object.values(PERMISSIONS));
    } else {
      // Se for usuário comum, carregar apenas as permissões salvas
      setCustomPermissions(user.permissions || []);
    }
    
    setShowPermissionsModal(true);
  };

  const closePermissionsModal = () => {
    setShowPermissionsModal(false);
    setPermissionsUserId(null);
    setCustomPermissions([]);
  };

  const handlePermissionToggle = (permission) => {
    console.log('=== TOGGLE PERMISSION ===');
    console.log('permission:', permission);
    console.log('customPermissions antes:', customPermissions);
    
    setCustomPermissions(prev => {
      if (prev.includes(permission)) {
        console.log('REMOVENDO permissão:', permission);
        const newPermissions = prev.filter(p => p !== permission);
        console.log('customPermissions depois (removido):', newPermissions);
        return newPermissions;
      } else {
        console.log('ADICIONANDO permissão:', permission);
        const newPermissions = [...prev, permission];
        console.log('customPermissions depois (adicionado):', newPermissions);
        return newPermissions;
      }
    });
  };

  const savePermissions = async () => {
    try {
      console.log('=== SALVANDO PERMISSÕES ===');
      
      // Encontrar o usuário atual para verificar o role
      const currentUser = users.find(u => u.id === permissionsUserId);
      console.log('currentUser:', currentUser);
      console.log('customPermissions:', customPermissions);
      console.log('permissionsUserId:', permissionsUserId);
      
      // Se for admin, forçar TODAS as permissões
      let finalPermissions = customPermissions;
      if (currentUser && (currentUser.role === 'admin' || currentUser.role === 'administrador')) {
        finalPermissions = Object.values(PERMISSIONS);
        console.log('USUÁRIO É ADMIN - forçando todas as permissões:', finalPermissions);
        toast.success('Usuário admin sempre tem acesso total e irrestrito!');
      } else {
        console.log('USUÁRIO COMUM - usando permissões customizadas:', finalPermissions);
      }

      const userRef = doc(db, 'usuarios', permissionsUserId);
      const updateData = {
        permissions: finalPermissions,
        updatedAt: new Date()
      };

      console.log('updateData que será salvo:', updateData);
      console.log('Verificação - finalPermissions inclui FINANCIAL_REPORTS?:', 
        finalPermissions.includes(PERMISSIONS.FINANCIAL_REPORTS));

      await updateDoc(userRef, updateData);
      console.log('SUCESSO - Permissões salvas no Firestore');
      
      toast.success('Permissões atualizadas com sucesso!');
      closePermissionsModal();
      fetchUsers();
    } catch (error) {
      console.error('Erro ao salvar permissões:', error);
      toast.error('Erro ao salvar permissões');
    }
  };

  const getCurrentUserPermissions = () => {
    return customPermissions;
  };

  const isPermissionChecked = (permission) => {
    const currentPermissions = getCurrentUserPermissions();
    return currentPermissions.includes(PERMISSIONS[permission]);
  };

  const handleEdit = (user) => {
    setEditingId(user.id);
    setFormData({
      email: user.email,
      senha: '', // Senha em branco para edição
      cidade: user.cidade || '',
      role: user.role || 'usuario'
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!formData.email || (!editingId && !formData.senha) || !formData.cidade) {
      toast.error('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    try {
      if (editingId) {
        // Atualizar usuário existente
        const userRef = doc(db, 'usuarios', editingId);
        const updateData = {
          cidade: formData.cidade,
          role: formData.role
        };
        
        // Se mudou para admin, dar todas as permissões automaticamente
        if (formData.role === 'admin' || formData.role === 'administrador') {
          updateData.permissions = Object.values(PERMISSIONS);
        }
        
        await updateDoc(userRef, updateData);
        toast.success('Usuário atualizado com sucesso!');
      } else {
        // Criar novo usuário
        try {

          const userCredential = await createUserWithEmailAndPassword(
            auth,
            formData.email,
            formData.senha
          );

          const newUserData = {
            email: formData.email,
            cidade: formData.cidade,
            role: formData.role,
            disabled: false,
            dataCriacao: new Date()
          };
          
          // Se for admin, dar todas as permissões automaticamente
          if (formData.role === 'admin' || formData.role === 'administrador') {
            newUserData.permissions = Object.values(PERMISSIONS);
          }

          await addDoc(collection(db, 'usuarios'), newUserData);
          
          toast.success('Usuário criado com sucesso!');
          setShowModal(false);
          setEditingId(null);
          setFormData({
            email: '',
            senha: '',
            cidade: '',
            role: 'usuario'
          });
          fetchUsers();
        } catch (error) {
          console.error('Erro completo:', error);
          console.error('Código do erro:', error.code);
          console.error('Mensagem do erro:', error.message);
          
          let errorMessage = 'Erro ao criar usuário';
          
          switch(error.code) {
            case 'auth/api-key-not-valid':
              errorMessage = 'Chave de API inválida. Verifique as configurações do Firebase.';
              break;
            case 'auth/email-already-in-use':
              errorMessage = 'Este e-mail já está em uso.';
              break;
            case 'auth/invalid-email':
              errorMessage = 'E-mail inválido.';
              break;
            case 'auth/weak-password':
              errorMessage = 'Senha muito fraca. Use pelo menos 6 caracteres.';
              break;
            default:
              errorMessage = `Erro: ${error.message}`;
          }
          
          toast.error(errorMessage);
        }
      }
    } catch (error) {
      console.error('Erro ao salvar usuário:', error);
      toast.error(error.message || 'Erro ao salvar usuário');
    }
  };

  if (loading) {
    return <div>Carregando...</div>;
  }

  // Verificar se tem permissão para ver usuários
  if (!can(PERMISSIONS.USERS_VIEW)) {
    return (
      <MainContent>
        <Title>Acesso Negado</Title>
        <p>Você não tem permissão para visualizar usuários.</p>
      </MainContent>
    );
  }

  return (
    <MainContent>
      <Title>Gerenciar Usuários</Title>
      {can(PERMISSIONS.USERS_CREATE) && (
        <Button onClick={() => {
          setEditingId(null);
          setFormData({
            email: '',
            senha: '',
            cidade: '',
            role: 'usuario'
          });
          setShowModal(true);
        }}>
          NOVO USUÁRIO
        </Button>
      )}

      <Table>
        <thead>
          <tr>
            <Th>Email</Th>
            <Th>Cidade</Th>
            <Th>Função</Th>
            <Th>Data de Criação</Th>
            <Th>Status</Th>
            <Th>Ações</Th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user.id}>
              <Td>{user.email}</Td>
              <Td>{user.cidade || 'N/A'}</Td>
              <Td>{user.role || 'N/A'}</Td>
              <Td>
                {user.dataCriacao?.seconds 
                  ? new Date(user.dataCriacao.seconds * 1000).toLocaleDateString() 
                  : 'N/A'}
              </Td>
              <Td>
                <ToggleSwitch>
                  <input
                    type="checkbox"
                    checked={!user.disabled}
                    onChange={() => handleStatusChange(user.id, user.disabled)}
                  />
                  <span />
                </ToggleSwitch>
              </Td>
              <Td>
                {can(PERMISSIONS.USERS_EDIT) && (
                  <ActionButton 
                    $variant="edit" 
                    onClick={() => handleEdit(user)}
                  >
                    Editar
                  </ActionButton>
                )}
                {can(PERMISSIONS.USERS_MANAGE_ROLES) && (
                  <PermissionsButton
                    onClick={() => openPermissionsModal(user)}
                  >
                    Permissões
                  </PermissionsButton>
                )}
                {can(PERMISSIONS.USERS_DELETE) && (
                  <ActionButton 
                    $variant="delete" 
                    onClick={() => handleDelete(user.id)}
                  >
                    Excluir
                  </ActionButton>
                )}
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>

      {showModal && (
        <Modal>
          <ModalContent>
            <h2>{editingId ? 'Editar Usuário' : 'Novo Usuário'}</h2>
            <Input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleInputChange}
              disabled={editingId} // Email não pode ser editado
            />
            {!editingId && (
              <Input
                type="password"
                name="senha"
                placeholder="Senha"
                value={formData.senha}
                onChange={handleInputChange}
              />
            )}
            <Select
              name="cidade"
              value={formData.cidade}
              onChange={handleInputChange}
            >
              <option value="">Selecione uma cidade</option>
              <option value="Alto Rio Novo">Alto Rio Novo</option>
              <option value="Central de Minas">Central de Minas</option>
              <option value="Mantena">Mantena</option>
              <option value="Mantenópolis">Mantenópolis</option>
              <option value="São João de Mantena">São João de Mantena</option>
            </Select>
            <Select
              name="role"
              value={formData.role}
              onChange={handleInputChange}
            >
              <option value="usuario">Usuário</option>
              <option value="admin">Administrador</option>
            </Select>
            <ModalButtons>
              <ModalButton $cancel onClick={() => {
                setShowModal(false);
                setEditingId(null);
                setFormData({
                  email: '',
                  senha: '',
                  cidade: '',
                  role: 'usuario'
                });
              }}>
                Cancelar
              </ModalButton>
              <ModalButton onClick={handleSubmit}>
                {editingId ? 'Atualizar' : 'Cadastrar'}
              </ModalButton>
            </ModalButtons>
          </ModalContent>
        </Modal>
      )}

      {/* NOVO MODAL DE PERMISSÕES */}
      {showPermissionsModal && (
        <PermissionsModal>
          <PermissionsModalContent>
            <h2>🔐 Gerenciar Permissões do Usuário</h2>
            
            {/* INTERFACE SIMPLIFICADA - APENAS CHECKBOXES */}
            <div>
              <h3>Permissões Customizadas:</h3>
                {Object.entries(PERMISSION_GROUPS).map(([groupKey, group]) => (
                  <PermissionGroup key={groupKey}>
                    <PermissionGroupTitle>
                      {group.label}
                    </PermissionGroupTitle>
                    <CheckboxGrid>
                      {group.permissions.map((perm) => (
                        <CheckboxItem key={perm.key}>
                          <input
                            type="checkbox"
                            checked={isPermissionChecked(perm.key)}
                            onChange={() => handlePermissionToggle(PERMISSIONS[perm.key])}
                          />
                          <span>{perm.label}</span>
                        </CheckboxItem>
                      ))}
                    </CheckboxGrid>
                  </PermissionGroup>
                ))}
              </div>

            <ModalButtons>
              <ModalButton $cancel onClick={closePermissionsModal}>
                Cancelar
              </ModalButton>
              <ModalButton onClick={savePermissions}>
                💾 Salvar Permissões
              </ModalButton>
            </ModalButtons>
          </PermissionsModalContent>
        </PermissionsModal>
      )}
    </MainContent>
  );
};

export default GerenciarUsuarios;

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import toast from 'react-hot-toast';
import { collection, getDocs, updateDoc, deleteDoc, doc, addDoc } from 'firebase/firestore';
import { db } from './config/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from './config/firebase';

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

  const fetchUsers = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'usuarios'));
      console.log('Documentos encontrados:', querySnapshot.size);
      const usersData = querySnapshot.docs.map(doc => {
        const data = doc.data();
        console.log('Dados do usuário:', data);
        return {
          id: doc.id,
          ...data
        };
      });
      console.log('Dados processados:', usersData);
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
    if (window.confirm('Tem certeza que deseja excluir este usuário?')) {
      try {
        await deleteDoc(doc(db, 'usuarios', id));
        toast.success('Usuário excluído com sucesso!');
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
        
        await updateDoc(userRef, updateData);
        toast.success('Usuário atualizado com sucesso!');
      } else {
        // Criar novo usuário
        try {
          console.log('Iniciando criação de usuário com:', formData.email);
          console.log('Usando configuração Firebase:', auth.app.options);
          
          const userCredential = await createUserWithEmailAndPassword(
            auth,
            formData.email,
            formData.senha
          );

          await addDoc(collection(db, 'usuarios'), {
            email: formData.email,
            cidade: formData.cidade,
            role: formData.role,
            disabled: false,
            dataCriacao: new Date()
          });
          
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

  return (
    <MainContent>
      <Title>Gerenciar Usuários</Title>
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
                <ActionButton 
                  $variant="edit" 
                  onClick={() => handleEdit(user)}
                >
                  Editar
                </ActionButton>
                <ActionButton 
                  $variant="delete" 
                  onClick={() => handleDelete(user.id)}
                >
                  Excluir
                </ActionButton>
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
    </MainContent>
  );
};

export default GerenciarUsuarios;
import React, { useState } from 'react';
import styled from 'styled-components';
import useStore from './store/useStore';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const MainContent = styled.div`
  width: 100%;
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
  padding: 4px 8px;
  margin: 0 4px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  background-color: ${props => props.delete ? '#ff4444' : '#000080'};
  color: white;

  &:hover {
    background-color: ${props => props.delete ? '#cc0000' : '#000066'};
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
  background-color: ${props => props.cancel ? '#ddd' : '#000080'};
  color: ${props => props.cancel ? '#333' : 'white'};

  &:hover {
    background-color: ${props => props.cancel ? '#ccc' : '#000066'};
  }
`;

const StatusToggle = styled.div`
  width: 40px;
  height: 20px;
  background-color: ${props => props.$active ? '#4CAF50' : '#ccc'};
  border-radius: 10px;
  position: relative;
  cursor: pointer;
  transition: background-color 0.3s;

  &::after {
    content: '';
    position: absolute;
    top: 2px;
    left: ${props => props.$active ? '22px' : '2px'};
    width: 16px;
    height: 16px;
    background-color: white;
    border-radius: 50%;
    transition: left 0.3s;
  }
`;

function GerenciarUsuarios() {
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const { users, addUser, updateUser, deleteUser } = useStore();
  const [formData, setFormData] = useState({
    email: '',
    senha: '',
    cidade: '',
    funcao: 'usuario',
    status: true
  });

  const resetForm = () => {
    setFormData({
      email: '',
      senha: '',
      cidade: '',
      funcao: 'usuario',
      status: true
    });
    setEditingId(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleToggleStatus = (id) => {
    const user = users.find(u => u.id === id);
    if (user) {
      updateUser(id, { ...user, status: !user.status });
      toast.success(`Usuário ${user.status ? 'desativado' : 'ativado'} com sucesso`);
    }
  };

  const handleEdit = (user) => {
    setFormData({
      email: user.email,
      cidade: user.cidade,
      funcao: user.funcao,
      status: user.status,
      senha: '' // Não preenchemos a senha por segurança
    });
    setEditingId(user.id);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir este usuário?')) {
      try {
        await deleteUser(id);
        toast.success('Usuário excluído com sucesso');
      } catch (error) {
        toast.error('Erro ao excluir usuário');
      }
    }
  };

  const validateForm = () => {
    if (!formData.email) {
      toast.error('Email é obrigatório');
      return false;
    }
    if (!formData.email.includes('@')) {
      toast.error('Email inválido');
      return false;
    }
    if (!editingId && !formData.senha) {
      toast.error('Senha é obrigatória para novos usuários');
      return false;
    }
    if (!formData.cidade) {
      toast.error('Cidade é obrigatória');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      if (editingId) {
        await updateUser(editingId, {
          ...formData,
          senha: formData.senha || undefined // Só atualiza a senha se foi fornecida
        });
        toast.success('Usuário atualizado com sucesso');
      } else {
        await addUser({
          ...formData,
          id: Date.now(),
          dataCriacao: new Date().toLocaleDateString('pt-BR')
        });
        toast.success('Usuário cadastrado com sucesso');
      }
      setShowModal(false);
      resetForm();
    } catch (error) {
      toast.error(error.message || 'Erro ao salvar usuário');
    }
  };

  return (
    <MainContent>
      <Title>Gerenciar Usuários</Title>
      <Button onClick={() => {
        resetForm();
        setShowModal(true);
      }}>NOVO USUÁRIO</Button>

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
            <motion.tr
              key={user.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Td>{user.email}</Td>
              <Td>{user.cidade}</Td>
              <Td>{user.funcao === 'admin' ? 'Administrador' : 'Usuário'}</Td>
              <Td>{user.dataCriacao}</Td>
              <Td>
                <StatusToggle
                  $active={user.status}
                  onClick={() => handleToggleStatus(user.id)}
                />
              </Td>
              <Td>
                <ActionButton onClick={() => handleEdit(user)}>
                  Editar
                </ActionButton>
                <ActionButton delete onClick={() => handleDelete(user.id)}>
                  Excluir
                </ActionButton>
              </Td>
            </motion.tr>
          ))}
        </tbody>
      </Table>

      <AnimatePresence>
        {showModal && (
          <Modal>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
            >
              <ModalContent>
                <h2>{editingId ? 'Editar Usuário' : 'Novo Usuário'}</h2>
                <Input
                  type="email"
                  name="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={handleInputChange}
                />
                <Input
                  type="password"
                  name="senha"
                  placeholder={editingId ? 'Nova senha (opcional)' : 'Senha'}
                  value={formData.senha}
                  onChange={handleInputChange}
                />
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
                  name="funcao"
                  value={formData.funcao}
                  onChange={handleInputChange}
                >
                  <option value="usuario">Usuário</option>
                  <option value="admin">Administrador</option>
                </Select>
                <ModalButtons>
                  <ModalButton cancel onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}>
                    Cancelar
                  </ModalButton>
                  <ModalButton onClick={handleSubmit}>
                    {editingId ? 'Atualizar' : 'Cadastrar'}
                  </ModalButton>
                </ModalButtons>
              </ModalContent>
            </motion.div>
          </Modal>
        )}
      </AnimatePresence>
    </MainContent>
  );
}

export default GerenciarUsuarios;
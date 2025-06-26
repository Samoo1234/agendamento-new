import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import useStore from './store/useStore';
import { toast } from 'react-toastify';
import { PERMISSIONS } from './config/permissions';
import { usePermissions } from './hooks/usePermissions';

const MainContent = styled.div`
  width: 100%;
`;

const Title = styled.h1`
  color: #333;
  margin-bottom: 20px;
`;

const FormContainer = styled.div`
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
  display: flex;
  gap: 15px;
  align-items: flex-end;
`;

const InputGroup = styled.div`
  flex: 1;
`;

const Input = styled.input`
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
`;

const Button = styled.button`
  padding: 8px 16px;
  background-color: #000033;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  height: 35px;

  &:hover {
    background-color: rgba(0, 0, 51, 0.9);
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
  background-color: #000033;
  color: white;
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
  background-color: ${props => props.$isDelete ? '#ff4444' : '#000033'};
  color: white;

  &:hover {
    background-color: ${props => props.$isDelete ? '#cc0000' : 'rgba(0, 0, 51, 0.9)'};
  }
`;

const Cidades = () => {
  const [nomeCidade, setNomeCidade] = useState('');
  const [editingId, setEditingId] = useState(null);
  const { cities, fetchCities, addCity, updateCity, deleteCity, setIsLoading } = useStore();
  const { can } = usePermissions();

  useEffect(() => {
    fetchCities().then(() => {
      // Log mais detalhado para ver a estrutura exata dos objetos
      console.log('Dados das cidades (detalhado):', JSON.stringify(cities, null, 2));
      // Verificar cada objeto individualmente
      cities.forEach((city, index) => {
        console.log(`Cidade ${index}:`, city);
        console.log(`Propriedades da cidade ${index}:`, Object.keys(city));
      });
    });
  }, [fetchCities]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nomeCidade.trim()) {
      toast.error('Digite o nome da cidade');
      return;
    }

    setIsLoading(true);
    try {
      if (editingId) {
        await updateCity(editingId, { name: nomeCidade });
        toast.success('Cidade atualizada com sucesso!');
        setEditingId(null);
      } else {
        await addCity({ name: nomeCidade });
        toast.success('Cidade cadastrada com sucesso!');
      }
      setNomeCidade('');
    } catch (error) {
      toast.error(error.message || 'Erro ao salvar cidade');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (city) => {
    setEditingId(city.id);
    setNomeCidade(city.name || city.nome || '');
    console.log('Editando cidade:', city);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir esta cidade?')) {
      setIsLoading(true);
      try {
        await deleteCity(id);
        toast.success('Cidade excluída com sucesso!');
      } catch (error) {
        toast.error('Erro ao excluir cidade');
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Verificar se tem permissão para ver cidades
  if (!can(PERMISSIONS.CITIES_VIEW)) {
    return (
      <MainContent>
        <Title>Acesso Negado</Title>
        <p>Você não tem permissão para visualizar cidades.</p>
      </MainContent>
    );
  }

  return (
    <MainContent>
      <Title>Gerenciar Cidades</Title>
      {can(PERMISSIONS.CITIES_CREATE) && (
        <FormContainer>
          <InputGroup>
            <Input
              type="text"
              placeholder="Nome da cidade"
              value={nomeCidade}
              onChange={(e) => setNomeCidade(e.target.value)}
            />
          </InputGroup>
          <Button onClick={handleSubmit}>
            {editingId ? 'ATUALIZAR' : 'CADASTRAR'}
          </Button>
        </FormContainer>
      )}

      <Table>
        <thead>
          <tr>
            <Th>Cidade</Th>
            <Th>Ações</Th>
          </tr>
        </thead>
        <tbody>
          {cities.map((city) => (
            <tr key={city.id}>
              <Td>{city.name || city.nome || JSON.stringify(city)}</Td>
              <Td>
                {can(PERMISSIONS.CITIES_EDIT) && (
                  <ActionButton $isDelete={false} onClick={() => handleEdit(city)}>
                    Editar
                  </ActionButton>
                )}
                {can(PERMISSIONS.CITIES_DELETE) && (
                  <ActionButton $isDelete={true} onClick={() => handleDelete(city.id)}>
                    Excluir
                  </ActionButton>
                )}
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>
    </MainContent>
  );
};

export default Cidades;
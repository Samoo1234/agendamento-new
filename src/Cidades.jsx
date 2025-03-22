import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import useStore from './store/useStore';
import { toast } from 'react-toastify';

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
  background-color: ${props => props.delete ? '#ff4444' : '#000033'};
  color: white;

  &:hover {
    background-color: ${props => props.delete ? '#cc0000' : 'rgba(0, 0, 51, 0.9)'};
  }
`;

const Cidades = () => {
  const [nomeCidade, setNomeCidade] = useState('');
  const [editingId, setEditingId] = useState(null);
  const { cities, setCities, addCity, updateCity, deleteCity, setIsLoading } = useStore();

  useEffect(() => {
    const mockCities = [
      { id: 1, name: 'Alto Rio Novo' },
      { id: 2, name: 'Central de Minas' },
      { id: 3, name: 'Mantena' },
      { id: 4, name: 'Mantenópolis' },
      { id: 5, name: 'São João de Mantena' }
    ];
    setCities(mockCities);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nomeCidade) {
      toast.error('Por favor, preencha o nome da cidade');
      return;
    }

    setIsLoading(true);
    try {
      const cityData = {
        name: nomeCidade,
        id: editingId || Date.now()
      };

      if (editingId) {
        await updateCity(editingId, cityData);
        toast.success('Cidade atualizada com sucesso!');
        setEditingId(null);
      } else {
        await addCity(cityData);
        toast.success('Cidade cadastrada com sucesso!');
      }
      setNomeCidade('');
    } catch (error) {
      toast.error('Erro ao salvar cidade');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <MainContent>
      <Title>Gerenciar Cidades</Title>
      <FormContainer>
        <InputGroup>
          <Input
            type="text"
            value={nomeCidade}
            onChange={(e) => setNomeCidade(e.target.value)}
            placeholder="Nome da Cidade *"
          />
        </InputGroup>
        <Button onClick={handleSubmit}>CADASTRAR CIDADE</Button>
      </FormContainer>

      <Table>
        <thead>
          <tr>
            <Th>Nome</Th>
            <Th>Ações</Th>
          </tr>
        </thead>
        <tbody>
          {cities.map((city) => (
            <tr key={city.id}>
              <Td>{city.name}</Td>
              <Td>
                <ActionButton onClick={() => {
                  setNomeCidade(city.name);
                  setEditingId(city.id);
                }}>Editar</ActionButton>
                <ActionButton delete onClick={async () => {
                  try {
                    setIsLoading(true);
                    await deleteCity(city.id);
                    toast.success('Cidade excluída com sucesso!');
                  } catch (error) {
                    toast.error('Erro ao excluir cidade');
                  } finally {
                    setIsLoading(false);
                  }
                }}>Excluir</ActionButton>
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>

    </MainContent>
  );
}

export default Cidades;
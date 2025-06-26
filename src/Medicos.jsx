import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import useStore from './store/useStore';
import toast from 'react-hot-toast';
import { PERMISSIONS } from './config/permissions';
import { usePermissions } from './hooks/usePermissions';

const MainContent = styled.div`
  padding: 20px;
  max-width: 100%;
`;

const Title = styled.h1`
  font-size: 24px;
  margin-bottom: 20px;
  color: #000033;
  
  @media (max-width: 768px) {
    font-size: 20px;
    text-align: center;
  }
`;

const FormContainer = styled.form`
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin-bottom: 30px;
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  
  @media (max-width: 768px) {
    padding: 15px;
  }
`;

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 5px;
`;

const Label = styled.label`
  font-weight: 500;
`;

const Input = styled.input`
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
  
  @media (max-width: 768px) {
    font-size: 14px;
  }
`;

const Button = styled.button`
  background-color: #000033;
  color: white;
  border: none;
  padding: 10px 15px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  align-self: flex-start;
  
  &:hover {
    background-color: #000066;
  }
  
  @media (max-width: 768px) {
    align-self: center;
    width: 100%;
  }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  background-color: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  
  @media (max-width: 768px) {
    font-size: 14px;
  }
`;

const Th = styled.th`
  background-color: #000033;
  color: white;
  text-align: left;
  padding: 12px 15px;
  
  @media (max-width: 768px) {
    padding: 10px;
  }
`;

const Td = styled.td`
  padding: 12px 15px;
  border-bottom: 1px solid #ddd;
  
  @media (max-width: 768px) {
    padding: 10px;
  }
`;

const ActionButton = styled.button`
  background-color: ${props => props.delete ? '#dc3545' : '#0d6efd'};
  color: white;
  border: none;
  padding: 8px 12px;
  border-radius: 4px;
  margin-right: 8px;
  cursor: pointer;
  
  &:hover {
    background-color: ${props => props.delete ? '#bd2130' : '#0b5ed7'};
  }
  
  @media (max-width: 768px) {
    padding: 6px 10px;
    margin-right: 5px;
    font-size: 12px;
  }
`;

const LoadingMessage = styled.p`
  text-align: center;
  margin-bottom: 20px;
`;

const EmptyMessage = styled.p`
  text-align: center;
  margin-bottom: 20px;
`;

function Medicos() {
  const [nomeMedico, setNomeMedico] = useState('');
  const [editingId, setEditingId] = useState(null);
  const { doctors, addDoctor, updateDoctor, deleteDoctor, setIsLoading, fetchDoctors, isLoading } = useStore();
  const { can } = usePermissions();

  // Carregar médicos quando o componente é montado
  useEffect(() => {
    const loadDoctors = async () => {
      try {
        console.log('Carregando médicos...');
        setIsLoading(true);
        await fetchDoctors();
        console.log('Médicos carregados com sucesso!');
      } catch (error) {
        console.error('Erro ao carregar médicos:', error);
        toast.error('Erro ao carregar médicos');
      } finally {
        setIsLoading(false);
      }
    };

    loadDoctors();
  }, [fetchDoctors, setIsLoading]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nomeMedico.trim()) {
      toast.error('Por favor, preencha o nome do médico');
      return;
    }

    setIsLoading(true);
    try {
      if (editingId) {
        await updateDoctor(editingId, { name: nomeMedico });
        toast.success('Médico atualizado com sucesso!');
        setEditingId(null);
      } else {
        await addDoctor({ name: nomeMedico });
        toast.success('Médico cadastrado com sucesso!');
      }
      setNomeMedico('');
    } catch (error) {
      toast.error('Erro ao salvar médico');
    } finally {
      setIsLoading(false);
    }
  };

  // Verificar se tem permissão para ver médicos
  if (!can(PERMISSIONS.DOCTORS_VIEW)) {
    return (
      <MainContent>
        <Title>Acesso Negado</Title>
        <p>Você não tem permissão para visualizar médicos.</p>
      </MainContent>
    );
  }

  return (
    <MainContent>
      <Title>Gerenciar Médicos</Title>
      
      {can(PERMISSIONS.DOCTORS_CREATE) && (
        <FormContainer onSubmit={handleSubmit}>
          <InputGroup>
            <Label>Nome do Médico *</Label>
            <Input
              type="text"
              value={nomeMedico}
              onChange={(e) => setNomeMedico(e.target.value)}
              placeholder="Digite o nome do médico"
            />
          </InputGroup>

          <Button type="submit">
            {editingId ? 'ATUALIZAR' : 'CADASTRAR'}
          </Button>
        </FormContainer>
      )}

      {isLoading ? (
        <LoadingMessage>Carregando médicos...</LoadingMessage>
      ) : doctors.length === 0 ? (
        <EmptyMessage>Nenhum médico cadastrado</EmptyMessage>
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Nome</Th>
              <Th>Ações</Th>
            </tr>
          </thead>
          <tbody>
            {doctors.map((doctor) => (
              <tr key={doctor.id}>
                <Td>{doctor.name}</Td>
                <Td>
                  {can(PERMISSIONS.DOCTORS_EDIT) && (
                    <ActionButton onClick={() => {
                      setNomeMedico(doctor.name);
                      setEditingId(doctor.id);
                    }}>
                      Editar
                    </ActionButton>
                  )}
                  {can(PERMISSIONS.DOCTORS_DELETE) && (
                    <ActionButton delete onClick={async () => {
                      try {
                        setIsLoading(true);
                        await deleteDoctor(doctor.id);
                        toast.success('Médico excluído com sucesso!');
                      } catch (error) {
                        toast.error('Erro ao excluir médico');
                      } finally {
                        setIsLoading(false);
                      }
                    }}>
                      Excluir
                    </ActionButton>
                  )}
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </MainContent>
  );
}

export default Medicos;
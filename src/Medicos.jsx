import React, { useState } from 'react';
import styled from 'styled-components';
import useStore from './store/useStore';
import toast from 'react-hot-toast';

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

const Label = styled.label`
  display: block;
  margin-bottom: 5px;
  color: #666;
  font-size: 14px;
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
  background-color: #000080;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  height: 35px;

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

function Medicos() {
  const [nomeMedico, setNomeMedico] = useState('');
  const [editingId, setEditingId] = useState(null);
  const { doctors, addDoctor, updateDoctor, deleteDoctor, setIsLoading } = useStore();

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

  return (
    <MainContent>
      <Title>Gerenciar Médicos</Title>
      <FormContainer>
        <InputGroup>
          <Label>Nome do Médico *</Label>
          <Input
            type="text"
            value={nomeMedico}
            onChange={(e) => setNomeMedico(e.target.value)}
            placeholder="Digite o nome do médico"
          />
        </InputGroup>

        <Button onClick={handleSubmit}>
          {editingId ? 'ATUALIZAR' : 'CADASTRAR'}
        </Button>
      </FormContainer>

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
                <ActionButton onClick={() => {
                  setNomeMedico(doctor.name);
                  setEditingId(doctor.id);
                }}>
                  Editar
                </ActionButton>
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
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>
    </MainContent>
  );
}

export default Medicos;
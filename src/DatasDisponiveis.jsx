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

const Select = styled.select`
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

function DatasDisponiveis() {
  const [formData, setFormData] = useState({
    cidade: '',
    medico: '',
    data: ''
  });
  const [editingId, setEditingId] = useState(null);
  const { 
    cities, 
    doctors,
    availableDates, 
    addAvailableDate, 
    updateAvailableDate, 
    deleteAvailableDate, 
    setIsLoading 
  } = useStore();

  const filteredDoctors = doctors;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.cidade || !formData.medico || !formData.data) {
      toast.error('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    setIsLoading(true);
    try {
      const selectedCity = cities.find(c => c.id === parseInt(formData.cidade));
      const selectedDoctor = doctors.find(d => d.id === parseInt(formData.medico));
      
      if (!selectedCity || !selectedDoctor) {
        throw new Error('Cidade ou médico não encontrado');
      }

      const dateData = {
        ...formData,
        cidade: selectedCity.name,
        medico: selectedDoctor.name,
        data: formData.data.split('-').reverse().join('/'),
        status: 'Disponível'
      };

      if (editingId) {
        await updateAvailableDate(editingId, dateData);
        toast.success('Data atualizada com sucesso!');
        setEditingId(null);
      } else {
        await addAvailableDate(dateData);
        toast.success('Data cadastrada com sucesso!');
      }
      setFormData({ cidade: '', medico: '', data: '' });
    } catch (error) {
      toast.error(error.message || 'Erro ao salvar data');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <MainContent>
      <Title>Gerenciar Datas Disponíveis</Title>
      <FormContainer>
        <InputGroup>
          <Label>Cidade *</Label>
          <Select
            name="cidade"
            value={formData.cidade}
            onChange={(e) => {
              handleInputChange(e);
              setFormData(prev => ({ ...prev, medico: '' }));
            }}
          >
            <option value="">Selecione uma cidade</option>
            {cities.map(city => (
              <option key={city.id} value={city.id}>
                {city.name}
              </option>
            ))}
          </Select>
        </InputGroup>

        <InputGroup>
          <Label>Médico *</Label>
          <Select
            name="medico"
            value={formData.medico}
            onChange={handleInputChange}
            disabled={!formData.cidade}
          >
            <option value="">Selecione um médico</option>
            {filteredDoctors.map(doctor => (
              <option key={doctor.id} value={doctor.id}>
                {doctor.name}
              </option>
            ))}
          </Select>
        </InputGroup>

        <InputGroup>
          <Label>Data *</Label>
          <Input
            type="date"
            name="data"
            value={formData.data}
            onChange={handleInputChange}
            min={new Date().toISOString().split('T')[0]}
          />
        </InputGroup>

        <Button onClick={handleSubmit}>
          {editingId ? 'ATUALIZAR' : 'CADASTRAR'}
        </Button>
      </FormContainer>

      <Table>
        <thead>
          <tr>
            <Th>Cidade</Th>
            <Th>Médico</Th>
            <Th>Data</Th>
            <Th>Status</Th>
            <Th>Ações</Th>
          </tr>
        </thead>
        <tbody>
          {availableDates.map((date) => (
            <tr key={date.id}>
              <Td>{date.cidade}</Td>
              <Td>{date.medico}</Td>
              <Td>{date.data}</Td>
              <Td>{date.status}</Td>
              <Td>
                <ActionButton onClick={() => {
                  const city = cities.find(c => c.name === date.cidade);
                  const doctor = doctors.find(d => d.name === date.medico);
                  setFormData({
                    cidade: city?.id.toString() || '',
                    medico: doctor?.id.toString() || '',
                    data: date.data.split('/').reverse().join('-')
                  });
                  setEditingId(date.id);
                }}>
                  Editar
                </ActionButton>
                <ActionButton delete onClick={async () => {
                  try {
                    setIsLoading(true);
                    await deleteAvailableDate(date.id);
                    toast.success('Data excluída com sucesso!');
                  } catch (error) {
                    toast.error('Erro ao excluir data');
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

export default DatasDisponiveis;
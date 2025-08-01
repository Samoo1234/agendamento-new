import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import useStore from './store/useStore';
import toast from 'react-hot-toast';
import { FaCog, FaTrash, FaEdit } from 'react-icons/fa';
import ConfigurarHorariosModal from './components/ConfigurarHorariosModal';
import * as firebaseService from './services/firebaseService';
import { sanitizeFirestoreData } from './utils/firebaseUtils';
import { PERMISSIONS } from './config/permissions';
import { usePermissions } from './hooks/usePermissions';

const MainContent = styled.div`
  padding: 20px;
`;

const Title = styled.h1`
  color: #333;
  margin-bottom: 20px;
`;

const FormContainer = styled.div`
  background: white;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
`;

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
`;

const Label = styled.label`
  margin-bottom: 8px;
  color: #666;
`;

const Select = styled.select`
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
`;

const Input = styled.input`
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
  align-self: flex-end;

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
  border-bottom: 2px solid #eee;
  color: #333;
`;

const Td = styled.td`
  padding: 12px;
  border-bottom: 1px solid #eee;
  color: #666;
`;

const ActionButton = styled.button`
  padding: 6px;
  margin: 0 4px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  background-color: ${props => props.delete ? '#ff4444' : props.edit ? '#008000' : '#000080'};
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;

  &:hover {
    background-color: ${props => props.delete ? '#cc0000' : props.edit ? '#00cc00' : '#000066'};
  }
`;

const ActionsContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const DateContainer = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`;

const ConfigButton = styled.button`
  background: none;
  border: none;
  color: #1a237e;
  cursor: pointer;
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: background-color 0.2s;

  &:hover {
    background-color: rgba(26, 35, 126, 0.1);
  }

  &:disabled {
    color: #ccc;
    cursor: not-allowed;
  }
`;

function DatasDisponiveis() {
  const [formData, setFormData] = useState({
    cidade: '',
    medico: '',
    data: ''
  });
  const [editingId, setEditingId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCidade, setSelectedCidade] = useState(null);
  
  const { 
    cities, 
    doctors,
    availableDates, 
    addAvailableDate, 
    updateAvailableDate, 
    deleteAvailableDate, 
    setIsLoading,
    scheduleConfigs,
    saveScheduleConfig,
    getScheduleConfig,
    fetchScheduleConfigs
  } = useStore();

  const { can } = usePermissions();

  useEffect(() => {
    fetchScheduleConfigs();
  }, [fetchScheduleConfigs]);

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
      // Os valores do formulário são IDs do Firestore
      const cidadeId = formData.cidade;
      const medicoId = formData.medico;
      





      

      
      // Formatar a data para exibição
      // Extrair ano, mês e dia diretamente da string de data original (formato YYYY-MM-DD)
      const [ano, mes, dia] = formData.data.split('-').map(num => parseInt(num, 10));
      
      // Formatar manualmente para evitar problemas de timezone
      const dataFormatada = `${dia.toString().padStart(2, '0')}/${mes.toString().padStart(2, '0')}/${ano}`;
      



      
      // Buscar documentos diretamente do Firestore usando os IDs
      const cidadeDoc = await firebaseService.getCityById(cidadeId);
      const medicoDoc = await firebaseService.getDoctorById(medicoId);
      
      if (!cidadeDoc) {
        throw new Error(`Cidade com ID ${cidadeId} não encontrada`);
      }
      
      if (!medicoDoc) {
        throw new Error(`Médico com ID ${medicoId} não encontrada`);
      }
      
      // Verificar se já existe uma data para esta cidade na mesma data
      const dataJaExiste = availableDates.some(date => 
        date.cidadeId === cidadeId && 
        date.data === dataFormatada && 
        (!editingId || date.id !== editingId)
      );
      
      if (dataJaExiste) {
        throw new Error(`Já existe uma data cadastrada para ${cidadeDoc.name} em ${dataFormatada}`);
      }
      
      // Preparar dados para salvar
      const dateData = {
        cidade: cidadeDoc.name,
        medico: medicoDoc.name,
        data: dataFormatada,
        dataOriginal: formData.data, // Guardar o formato original para edição
        cidadeId,
        medicoId,
        status: 'Disponível',
        createdAt: new Date().toISOString()
      };

      if (editingId) {
        // Modo de edição - atualizar data existente
        await updateAvailableDate(editingId, dateData);
        toast.success('Data atualizada com sucesso!');
        setEditingId(null); // Sair do modo de edição
      } else {
        // Modo de criação - adicionar nova data
        await addAvailableDate(dateData);
        toast.success('Data cadastrada com sucesso!');
      }
      
      // Limpar formulário
      setFormData({
        cidade: '',
        medico: '',
        data: ''
      });
    } catch (error) {
      console.error('Erro ao salvar data:', error);
      toast.error(error.message || 'Erro ao salvar data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfigureHorarios = async (cidade) => {
    const cityId = cities.find(c => c.name === cidade)?.id;
    if (cityId) {
      const config = await getScheduleConfig(cityId.toString());
      setSelectedCidade(cidade);
      setIsModalOpen(true);
    }
  };

  const handleSaveHorarios = async (configuracao) => {
    try {
      const cityId = cities.find(c => c.name === configuracao.cidade)?.id.toString();
      if (cityId) {
        await saveScheduleConfig(cityId, configuracao);
        toast.success('Horários configurados com sucesso!');
      }
    } catch (error) {
      toast.error('Erro ao salvar configuração de horários');
    }
  };

  const handleDelete = async (id) => {
    try {
      setIsLoading(true);
      await deleteAvailableDate(id);
      toast.success('Data excluída com sucesso!');
    } catch (error) {
      toast.error('Erro ao excluir data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (date) => {
    setEditingId(date.id);
    
    // Encontrar os IDs correspondentes no Firestore
    const cidadeId = cities.find(city => city.name === date.cidade)?.id || '';
    const medicoId = doctors.find(doctor => doctor.name === date.medico)?.id || '';
    
    // Preencher o formulário com os dados da data selecionada
    setFormData({
      cidade: cidadeId,
      medico: medicoId,
      data: date.dataOriginal || date.data // Usar o formato original da data se disponível
    });
    
    // Rolar para o topo da página para o usuário ver o formulário
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Verificar se tem permissão para ver datas
  if (!can(PERMISSIONS.DATES_VIEW)) {
    return (
      <MainContent>
        <Title>Acesso Negado</Title>
        <p>Você não tem permissão para visualizar datas disponíveis.</p>
      </MainContent>
    );
  }

  return (
    <MainContent>
      <Title>Gerenciar Datas Disponíveis</Title>
      {can(PERMISSIONS.DATES_CREATE) && (
        <FormContainer>
          <InputGroup>
            <Label>Cidade *</Label>
            <Select
              name="cidade"
              value={formData.cidade}
              onChange={handleInputChange}
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
              {doctors.map(doctor => (
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
            />
          </InputGroup>

          <Button onClick={handleSubmit}>
            {editingId ? 'ATUALIZAR' : 'CADASTRAR DATA'}
          </Button>
        </FormContainer>
      )}

      <Table>
        <thead>
          <tr>
            <Th>Cidade</Th>
            <Th>Data</Th>
            <Th>Médico</Th>
            <Th>Status</Th>
            <Th>Ações</Th>
          </tr>
        </thead>
        <tbody>
          {availableDates
            // Ordenar datas em ordem crescente
            .sort((a, b) => {
              // Converter datas do formato DD/MM/YYYY para objetos Date para comparação
              const [diaA, mesA, anoA] = a.data.split('/').map(Number);
              const [diaB, mesB, anoB] = b.data.split('/').map(Number);
              
              // Criar objetos Date para comparação (mês é 0-indexed no JavaScript)
              const dateA = new Date(anoA, mesA - 1, diaA);
              const dateB = new Date(anoB, mesB - 1, diaB);
              
              // Comparar as datas
              return dateA - dateB;
            })
            .map((date) => (
              <tr key={date.id}>
                <Td>{date.cidade}</Td>
                <Td>{date.data}</Td>
                <Td>{date.medico}</Td>
                <Td>{date.status}</Td>
                <Td>
                  <ActionsContainer>
                    <ActionButton
                      onClick={() => handleConfigureHorarios(date.cidade)}
                    >
                      <FaCog />
                    </ActionButton>
                    {can(PERMISSIONS.DATES_EDIT) && (
                      <ActionButton
                        edit
                        onClick={() => handleEdit(date)}
                      >
                        <FaEdit />
                      </ActionButton>
                    )}
                    {can(PERMISSIONS.DATES_DELETE) && (
                      <ActionButton
                        delete
                        onClick={() => handleDelete(date.id)}
                      >
                        <FaTrash />
                      </ActionButton>
                    )}
                  </ActionsContainer>
                </Td>
              </tr>
            ))}
        </tbody>
      </Table>

      <ConfigurarHorariosModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        cidade={selectedCidade}
        onSave={handleSaveHorarios}
        initialConfig={selectedCidade && cities && cities.length > 0 
          ? (() => {
              try {
                const cityObj = cities.find(c => c.name === selectedCidade);
                const cityId = cityObj ? cityObj.id : null;
                if (cityId && scheduleConfigs && scheduleConfigs[cityId]) {
                  // Sanitizar os dados para remover timestamps do Firestore
                  return sanitizeFirestoreData(scheduleConfigs[cityId]);
                }
                return null;
              } catch (error) {
                console.error('Erro ao processar configuração de horários:', error);
                return null;
              }
            })() 
          : null}
      />
    </MainContent>
  );
}

export default DatasDisponiveis;

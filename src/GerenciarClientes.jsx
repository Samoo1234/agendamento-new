import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import toast from 'react-hot-toast';
import { updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from './config/firebase';
import * as firebaseService from './services/firebaseService';
import jsPDF from 'jspdf';
import useStore from './store/useStore';
import AgendamentoModal from './components/AgendamentoModal';
import { usePermissions } from './hooks/usePermissions';
import { PERMISSIONS } from './config/permissions';

const Container = styled.div`
  padding: 20px;
`;

const Title = styled.h2`
  color: #333;
  margin-bottom: 20px;
`;

const TopContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 10px;
`;

const Button = styled.button`
  padding: 8px 16px;
  background-color: ${props => props.$variant === 'pdf' ? '#28a745' : '#000080'};
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-left: 10px;

  &:hover {
    opacity: 0.9;
  }
`;

const FilterContainer = styled.div`
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
`;

const CounterBadge = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background-color: #000033;
  color: white;
  font-size: 14px;
  font-weight: 500;
  padding: 4px 10px;
  border-radius: 20px;
  margin-left: 10px;
`;

const Select = styled.select`
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  min-width: 200px;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  background-color: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const Th = styled.th`
  padding: 12px;
  text-align: left;
  background-color: #f8f9fa;
  border-bottom: 2px solid #dee2e6;
`;

const Td = styled.td`
  padding: 12px;
  border-bottom: 1px solid #dee2e6;
`;

const ActionButton = styled.button`
  padding: 5px 10px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-right: 5px;
  color: white;
  background-color: #dc3545;

  &:hover {
    opacity: 0.9;
  }
`;

const StatusBadge = styled.span`
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  background-color: ${props => {
    switch (props.$status) {
      case 'pendente': return '#ffd700';
      case 'confirmado': return '#28a745';
      case 'cancelado': return '#dc3545';
      default: return '#6c757d';
    }
  }};
  color: ${props => props.$status === 'pendente' ? '#000' : '#fff'};
`;

const GerenciarClientes = () => {
  const [agendamentos, setAgendamentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cidadeFiltro, setCidadeFiltro] = useState('');
  const [dataFiltro, setDataFiltro] = useState('');
  const [statusFiltro, setStatusFiltro] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState(null);
  const { cities, appointmentUpdateCounter, availableDates } = useStore();
  const { can } = usePermissions();

  const fetchAgendamentos = async () => {
    try {

      setLoading(true);
      
      // Usar a nova função que busca apenas agendamentos ativos
      const agendamentosData = await firebaseService.getActiveAppointments();

      setAgendamentos(agendamentosData);
      
      // Após atualizar os agendamentos, o contador será recalculado automaticamente
      // devido à dependência dos filtros
    } catch (error) {
      toast.error('Erro ao carregar agendamentos');
      console.error('Erro ao carregar agendamentos:', error);
    } finally {
      setLoading(false);
    }
  };

  // Buscar agendamentos na inicialização
  useEffect(() => {
    fetchAgendamentos();
  }, []);
  
  // Buscar agendamentos novamente quando o contador de atualizações mudar
  useEffect(() => {
    if (appointmentUpdateCounter > 0) {

      fetchAgendamentos();
    }
  }, [appointmentUpdateCounter]);

  // Obter datas disponíveis com base na cidade selecionada
  const datasDisponiveis = [...new Set(
    agendamentos
      .filter(a => {
        // Normalizar strings para comparação (remover espaços extras e converter para minúsculas)
        const cidadeAgendamento = (a.cidade || '').trim().toLowerCase();
        const cidadeFiltrada = (cidadeFiltro || '').trim().toLowerCase();
        return cidadeAgendamento === cidadeFiltrada;
      })
      .map(a => a.data ? a.data.trim() : a.data)
  )].sort();

  // Log para depuração - Datas disponíveis

  // Selecionar automaticamente a primeira cidade quando os dados são carregados
  useEffect(() => {
    if (!loading && cities.length > 0 && !cidadeFiltro) {
      setCidadeFiltro(cities[0].name);
    }
  }, [loading, cities, cidadeFiltro]);

  // Selecionar automaticamente a primeira data disponível quando a cidade é selecionada
  useEffect(() => {
    if (cidadeFiltro && datasDisponiveis.length > 0) {
      setDataFiltro(datasDisponiveis[0]);
    } else {
      setDataFiltro('');
    }
  }, [cidadeFiltro]);

  // Filtrar agendamentos com base apenas na cidade e data selecionadas (para o contador)
  const agendamentosPorCidadeEData = agendamentos.filter(agendamento => {
    const cidadeMatch = !cidadeFiltro || 
      (agendamento.cidade || '').trim().toLowerCase() === (cidadeFiltro || '').trim().toLowerCase();
    const dataMatch = !dataFiltro || agendamento.data === dataFiltro;
    return cidadeMatch && dataMatch;
  });

  // Contador de agendamentos para a cidade e data selecionadas
  const totalAgendamentos = agendamentosPorCidadeEData.length;

  // Filtrar agendamentos com base nos critérios selecionados (incluindo status)
  const agendamentosFiltrados = agendamentos.filter(agendamento => {
    const matchCidade = (agendamento.cidade || '').trim().toLowerCase() === (cidadeFiltro || '').trim().toLowerCase();
    const matchData = (agendamento.data ? agendamento.data.trim() : agendamento.data) === (dataFiltro ? dataFiltro.trim() : dataFiltro);
    const matchStatus = !statusFiltro || agendamento.status === statusFiltro;
    
    // Log para depuração - Verificação de correspondência para data 15/04/2025
    if (dataFiltro === '15/04/2025' || dataFiltro === '15/04/2025 ') {
      }
    
    return matchCidade && matchData && matchStatus;
  });

  // Log para depuração - Total de agendamentos filtrados

  if (dataFiltro === '15/04/2025') {

  }

  // Função para converter horário no formato HH:MM para minutos
  const getMinutos = (horario) => {
    if (!horario) return 0;
    const [horas, minutos] = horario.split(':').map(Number);
    return (horas * 60) + minutos;
  };

  // Ordenar agendamentos por horário (do mais cedo para o mais tarde)
  const agendamentosOrdenados = [...agendamentosFiltrados].sort((a, b) => {
    const minutosA = getMinutos(a.horario);
    const minutosB = getMinutos(b.horario);
    return minutosA - minutosB;
  });

  const handleEdit = (agendamento) => {
    // Definir o agendamento a ser editado e abrir o modal
    setEditingAppointment(agendamento);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir este agendamento?')) {
      try {
        await deleteDoc(doc(db, 'agendamentos', id));
        toast.success('Agendamento excluído com sucesso!');
        fetchAgendamentos();
      } catch (error) {
        toast.error('Erro ao excluir agendamento');
        console.error('Erro:', error);
      }
    }
  };

  const handleStatusChange = async (id, novoStatus) => {
    try {
      const agendamentoRef = doc(db, 'agendamentos', id);
      await updateDoc(agendamentoRef, {
        status: novoStatus
      });
      toast.success('Status atualizado com sucesso!');
      fetchAgendamentos();
    } catch (error) {
      toast.error('Erro ao atualizar status');
      console.error('Erro:', error);
    }
  };

  const generatePDF = () => {
    // Criar documento PDF no formato paisagem para melhor visualização da tabela
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });
    
    // Configurações
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    let yPos = margin;
    const lineHeight = 7;
    
    // Adicionar cabeçalho com estilo
    doc.setFillColor(0, 32, 96); // Azul escuro
    doc.rect(0, 0, pageWidth, 20, 'F');
    
    // Título com estilo
    doc.setTextColor(255, 255, 255); // Texto branco
    doc.setFontSize(18);
    doc.setFont(undefined, 'bold');
    doc.text('Relatório de Agendamentos', pageWidth / 2, 12, { align: 'center' });
    
    // Resetar cor de texto para preto
    doc.setTextColor(0, 0, 0);
    yPos = 30;
    
    // Filtros aplicados com estilo
    doc.setFontSize(11);
    let filterText = 'Filtros: ';
    if (cidadeFiltro) filterText += `Cidade: ${cidadeFiltro} | `;
    if (dataFiltro) filterText += `Data: ${dataFiltro} | `;
    if (statusFiltro) filterText += `Status: ${statusFiltro}`;
    if (filterText !== 'Filtros: ') {
      doc.text(filterText, margin, yPos);
      yPos += lineHeight * 1.5;
    }

    // Linha separadora após filtros
    doc.setDrawColor(0, 32, 96); // Azul escuro
    doc.setLineWidth(0.5);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += lineHeight;

    // Cabeçalho da tabela com estilo
    doc.setFillColor(240, 240, 240); // Cinza claro
    doc.rect(margin, yPos - 5, pageWidth - (margin * 2), 8, 'F');
    
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text('Nome', margin + 5, yPos);
    doc.text('Telefone', margin + 65, yPos);
    doc.text('Horário', margin + 115, yPos);
    doc.text('Status', margin + 150, yPos);
    doc.text('Observações', margin + 185, yPos);
    yPos += lineHeight + 2;

    // Dados com linhas alternadas para melhor legibilidade
    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);
    
    // Ordenar agendamentos por horário antes de gerar o PDF
    const agendamentosOrdenados = [...agendamentosFiltrados].sort((a, b) => {
      // Converter horários para minutos para facilitar a comparação
      const getMinutos = (horario) => {
        if (!horario) return 0;
        const [horas, minutos] = horario.split(':').map(Number);
        return (horas * 60) + minutos;
      };
      
      const minutosA = getMinutos(a.horario);
      const minutosB = getMinutos(b.horario);
      
      return minutosA - minutosB; // Ordem crescente (manhã para tarde)
    });
    
    agendamentosOrdenados.forEach((agendamento, index) => {
      // Verifica se precisa criar nova página
      if (yPos > pageHeight - 25) {
        doc.addPage();
        yPos = margin + lineHeight;
        
        // Repete o cabeçalho na nova página
        doc.setFillColor(240, 240, 240);
        doc.rect(margin, yPos - 5, pageWidth - (margin * 2), 8, 'F');
        
        doc.setFontSize(11);
        doc.setFont(undefined, 'bold');
        doc.text('Nome', margin + 5, yPos);
        doc.text('Telefone', margin + 65, yPos);
        doc.text('Horário', margin + 115, yPos);
        doc.text('Status', margin + 150, yPos);
        doc.text('Observações', margin + 185, yPos);
        yPos += lineHeight + 2;
        doc.setFont(undefined, 'normal');
        doc.setFontSize(10);
      }

      // Adicionar fundo cinza claro para linhas alternadas
      if (index % 2 === 0) {
        doc.setFillColor(248, 248, 248);
        doc.rect(margin, yPos - 5, pageWidth - (margin * 2), 7, 'F');
      }

      doc.text(agendamento.nome?.substring(0, 30) || '', margin + 5, yPos);
      doc.text(agendamento.telefone || '', margin + 65, yPos);
      doc.text(agendamento.horario || '', margin + 115, yPos);
      doc.text(agendamento.status || '', margin + 150, yPos);
      // Usar campo observacoes ou informacoes em vez de descricao
      doc.text((agendamento.observacoes || agendamento.informacoes || '')?.substring(0, 25), margin + 185, yPos);
      yPos += lineHeight;
    });

    // Rodapé com informações e linha separadora
    const footerPosition = pageHeight - 10;
    
    // Linha separadora do rodapé
    doc.setDrawColor(0, 32, 96);
    doc.line(margin, footerPosition - 5, pageWidth - margin, footerPosition - 5);
    
    // Data de geração e número de página
    doc.setFontSize(8);
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, margin, footerPosition);
    doc.text(`Total de agendamentos: ${agendamentosFiltrados.length}`, pageWidth - margin, footerPosition, { align: 'right' });

    // Salvar PDF com nome mais descritivo
    const fileName = `agendamentos${dataFiltro ? '_' + dataFiltro : ''}${cidadeFiltro ? '_' + cidadeFiltro : ''}.pdf`;
    doc.save(fileName);
    toast.success('PDF gerado com sucesso!');
  };

  if (loading) {
    return <div>Carregando...</div>;
  }

  // Verificar se tem permissão para ver clientes
  if (!can(PERMISSIONS.CLIENTS_VIEW)) {
    return (
      <Container>
        <Title>Acesso Negado</Title>
        <p>Você não tem permissão para visualizar clientes.</p>
      </Container>
    );
  }

  return (
    <Container>
      <TopContainer>
        <Title>Gerenciar Agendamentos</Title>
        <ButtonGroup>
          {can(PERMISSIONS.APPOINTMENTS_CREATE) && (
            <Button $variant="primary" onClick={() => setIsModalOpen(true)}>
              Novo Agendamento
            </Button>
          )}
          {can(PERMISSIONS.EXPORT_DATA) && (
            <Button $variant="pdf" onClick={generatePDF}>
              Gerar PDF
            </Button>
          )}
        </ButtonGroup>
      </TopContainer>
      
      <FilterContainer>
        <Select 
          value={cidadeFiltro} 
          onChange={(e) => setCidadeFiltro(e.target.value)}
        >
          {cities.map(city => (
            <option key={city.id} value={city.name}>
              {city.name}
            </option>
          ))}
        </Select>

        <Select 
          value={dataFiltro} 
          onChange={(e) => {

            setDataFiltro(e.target.value);
          }}
        >
          {datasDisponiveis.map(data => {

            return (
              <option key={data} value={data}>{data}</option>
            );
          })}
        </Select>

        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Select 
            value={statusFiltro} 
            onChange={(e) => setStatusFiltro(e.target.value)}
          >
            <option value="">Todos os status</option>
            <option value="pendente">Pendente</option>
            <option value="confirmado">Confirmado</option>
            <option value="cancelado">Cancelado</option>
          </Select>
          <CounterBadge title="Total de agendamentos para esta cidade e data">
            {totalAgendamentos}
          </CounterBadge>
        </div>
      </FilterContainer>

      <Table>
        <thead>
          <tr>
            <Th>Nome</Th>
            <Th>Cidade</Th>
            <Th>Data</Th>
            <Th>Horário</Th>
            <Th>Observação</Th>
            <Th>Status</Th>
            <Th>Ações</Th>
          </tr>
        </thead>
        <tbody>
          {agendamentosOrdenados.map(agendamento => (
            <tr key={agendamento.id}>
              <Td>{agendamento.nome}</Td>
              <Td>{agendamento.cidade}</Td>
              <Td>{agendamento.data}</Td>
              <Td>{agendamento.horario}</Td>
              <Td>{agendamento.observacoes || agendamento.informacoes || ''}</Td>
              <Td>
                {can(PERMISSIONS.APPOINTMENTS_MANAGE_STATUS) ? (
                  <Select
                    value={agendamento.status}
                    onChange={(e) => handleStatusChange(agendamento.id, e.target.value)}
                    style={{ width: '100%' }}
                  >
                    <option value="pendente">Pendente</option>
                    <option value="confirmado">Confirmado</option>
                    <option value="cancelado">Cancelado</option>
                  </Select>
                ) : (
                  <StatusBadge $status={agendamento.status}>
                    {agendamento.status}
                  </StatusBadge>
                )}
              </Td>
              <Td>
                <div style={{ display: 'flex', gap: '5px' }}>
                  {can(PERMISSIONS.APPOINTMENTS_EDIT) && (
                    <ActionButton 
                      onClick={() => handleEdit(agendamento)}
                      style={{ backgroundColor: '#007bff' }}
                    >
                      Editar
                    </ActionButton>
                  )}
                  {can(PERMISSIONS.APPOINTMENTS_DELETE) && (
                    <ActionButton 
                      onClick={() => handleDelete(agendamento.id)}
                    >
                      Excluir
                    </ActionButton>
                  )}
                </div>
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>
      
      {/* Modal de Agendamento */}
      <AgendamentoModal 
        isOpen={isModalOpen} 
        onClose={() => {
          setIsModalOpen(false);
          setEditingAppointment(null);
        }} 
        onSuccess={() => {
          // Recarregar a lista de agendamentos após criar ou editar
          fetchAgendamentos();
        }}
        appointmentToEdit={editingAppointment}
      />
    </Container>
  );
};

export default GerenciarClientes;

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import toast from 'react-hot-toast';
import { collection, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from './config/firebase';
import jsPDF from 'jspdf';
import useStore from './store/useStore';

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

  const { cities } = useStore();

  const fetchAgendamentos = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'agendamentos'));
      const agendamentosData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAgendamentos(agendamentosData);
    } catch (error) {
      toast.error('Erro ao carregar agendamentos');
      console.error('Erro:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgendamentos();
  }, []);

  // Obter datas disponíveis com base na cidade selecionada
  const datasDisponiveis = [...new Set(
    agendamentos
      .filter(a => a.cidade === cidadeFiltro)
      .map(a => a.data)
  )].sort();

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
  }, [cidadeFiltro, datasDisponiveis]);

  // Filtrar agendamentos com base nos critérios selecionados
  const agendamentosFiltrados = agendamentos.filter(agendamento => {
    const matchCidade = agendamento.cidade === cidadeFiltro;
    const matchData = agendamento.data === dataFiltro;
    const matchStatus = !statusFiltro || agendamento.status === statusFiltro;
    return matchCidade && matchData && matchStatus;
  });

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
    doc.text('Cidade', margin + 65, yPos);
    doc.text('Data', margin + 115, yPos);
    doc.text('Horário', margin + 150, yPos);
    doc.text('Status', margin + 185, yPos);
    yPos += lineHeight + 2;

    // Dados com linhas alternadas para melhor legibilidade
    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);
    
    agendamentosFiltrados.forEach((agendamento, index) => {
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
        doc.text('Cidade', margin + 65, yPos);
        doc.text('Data', margin + 115, yPos);
        doc.text('Horário', margin + 150, yPos);
        doc.text('Status', margin + 185, yPos);
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
      doc.text(agendamento.cidade || '', margin + 65, yPos);
      doc.text(agendamento.data || '', margin + 115, yPos);
      doc.text(agendamento.horario || '', margin + 150, yPos);
      doc.text(agendamento.status || '', margin + 185, yPos);
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

  return (
    <Container>
      <TopContainer>
        <Title>Gerenciar Agendamentos</Title>
        <Button $variant="pdf" onClick={generatePDF}>
          Gerar PDF
        </Button>
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
          onChange={(e) => setDataFiltro(e.target.value)}
        >
          {datasDisponiveis.map(data => (
            <option key={data} value={data}>{data}</option>
          ))}
        </Select>

        <Select 
          value={statusFiltro} 
          onChange={(e) => setStatusFiltro(e.target.value)}
        >
          <option value="">Todos os status</option>
          <option value="pendente">Pendente</option>
          <option value="confirmado">Confirmado</option>
          <option value="cancelado">Cancelado</option>
        </Select>
      </FilterContainer>

      <Table>
        <thead>
          <tr>
            <Th>Nome</Th>
            <Th>Cidade</Th>
            <Th>Data</Th>
            <Th>Horário</Th>
            <Th>Descrição</Th>
            <Th>Status</Th>
            <Th>Ações</Th>
          </tr>
        </thead>
        <tbody>
          {agendamentosFiltrados.map(agendamento => (
            <tr key={agendamento.id}>
              <Td>{agendamento.nome}</Td>
              <Td>{agendamento.cidade}</Td>
              <Td>{agendamento.data}</Td>
              <Td>{agendamento.horario}</Td>
              <Td>{agendamento.descricao}</Td>
              <Td>
                <Select
                  value={agendamento.status}
                  onChange={(e) => handleStatusChange(agendamento.id, e.target.value)}
                  style={{ width: '100%' }}
                >
                  <option value="pendente">Pendente</option>
                  <option value="confirmado">Confirmado</option>
                  <option value="cancelado">Cancelado</option>
                </Select>
              </Td>
              <Td>
                <ActionButton 
                  onClick={() => handleDelete(agendamento.id)}
                >
                  Excluir
                </ActionButton>
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>
    </Container>
  );
};

export default GerenciarClientes;

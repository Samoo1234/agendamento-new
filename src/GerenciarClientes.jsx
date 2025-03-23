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
    const doc = new jsPDF();
    
    // Configurações
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 10;
    let yPos = margin;
    const lineHeight = 7;
    
    // Título
    doc.setFontSize(16);
    doc.text('Relatório de Agendamentos', margin, yPos);
    yPos += lineHeight * 2;

    // Filtros aplicados
    doc.setFontSize(10);
    let filterText = 'Filtros: ';
    if (cidadeFiltro) filterText += `Cidade: ${cidadeFiltro} | `;
    if (dataFiltro) filterText += `Data: ${dataFiltro} | `;
    if (statusFiltro) filterText += `Status: ${statusFiltro}`;
    if (filterText !== 'Filtros: ') {
      doc.text(filterText, margin, yPos);
      yPos += lineHeight * 1.5;
    }

    // Cabeçalho da tabela
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text('Nome', margin, yPos);
    doc.text('Cidade', margin + 50, yPos);
    doc.text('Data', margin + 80, yPos);
    doc.text('Horário', margin + 110, yPos);
    doc.text('Status', margin + 140, yPos);
    yPos += lineHeight;

    // Linha separadora
    doc.line(margin, yPos - 2, pageWidth - margin, yPos - 2);
    yPos += lineHeight / 2;

    // Dados
    doc.setFont(undefined, 'normal');
    agendamentosFiltrados.forEach(agendamento => {
      // Verifica se precisa criar nova página
      if (yPos > doc.internal.pageSize.getHeight() - 20) {
        doc.addPage();
        yPos = margin + lineHeight;
      }

      doc.text(agendamento.nome?.substring(0, 25) || '', margin, yPos);
      doc.text(agendamento.cidade || '', margin + 50, yPos);
      doc.text(agendamento.data || '', margin + 80, yPos);
      doc.text(agendamento.horario || '', margin + 110, yPos);
      doc.text(agendamento.status || '', margin + 140, yPos);
      yPos += lineHeight;
    });

    // Data de geração
    yPos = doc.internal.pageSize.getHeight() - 10;
    doc.setFontSize(8);
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, margin, yPos);

    // Salvar PDF
    doc.save('agendamentos.pdf');
    toast.success('PDF gerado com sucesso!');
  };

  const agendamentosFiltrados = agendamentos.filter(agendamento => {
    const matchCidade = !cidadeFiltro || agendamento.cidade === cidadeFiltro;
    const matchData = !dataFiltro || agendamento.data === dataFiltro;
    const matchStatus = !statusFiltro || agendamento.status === statusFiltro;
    return matchCidade && matchData && matchStatus;
  });

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
          <option value="">Todas as cidades</option>
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
          <option value="">Todas as datas</option>
          {[...new Set(agendamentos.map(a => a.data))].sort().map(data => (
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

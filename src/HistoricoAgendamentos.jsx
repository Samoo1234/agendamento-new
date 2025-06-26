import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import useStore from './store/useStore';
import toast from 'react-hot-toast';
import { FaSearch, FaFilePdf, FaCalendarAlt } from 'react-icons/fa';
import * as firebaseService from './services/firebaseService';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { registerLocale, setDefaultLocale } from 'react-datepicker';
import ptBR from 'date-fns/locale/pt-BR';
import { usePermissions } from './hooks/usePermissions';
import { PERMISSIONS } from './config/permissions';

// Registrar o locale pt-BR para o DatePicker
registerLocale('pt-BR', ptBR);
setDefaultLocale('pt-BR');

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
  display: flex;
  align-items: center;
  gap: 8px;

  &:hover {
    opacity: 0.9;
  }
`;

const FilterContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  margin-bottom: 20px;
  align-items: center;
`;

const FilterGroup = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 200px;
`;

const FilterLabel = styled.label`
  font-size: 14px;
  margin-bottom: 5px;
  color: #555;
`;

const Select = styled.select`
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  min-width: 200px;
`;

const SearchContainer = styled.div`
  display: flex;
  align-items: center;
  position: relative;
  min-width: 300px;
`;

const SearchInput = styled.input`
  padding: 8px 8px 8px 35px;
  border: 1px solid #ddd;
  border-radius: 4px;
  width: 100%;
`;

const SearchIcon = styled(FaSearch)`
  position: absolute;
  left: 10px;
  color: #888;
`;

const StyledDatePicker = styled(DatePicker)`
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  width: 120px;
`;

const DatePickerContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
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

const PaginationContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 20px;
  gap: 10px;
`;

const PageButton = styled.button`
  padding: 5px 10px;
  border: 1px solid #ddd;
  background-color: ${props => props.$active ? '#000080' : 'white'};
  color: ${props => props.$active ? 'white' : '#333'};
  border-radius: 4px;
  cursor: pointer;

  &:hover {
    background-color: ${props => props.$active ? '#000080' : '#f0f0f0'};
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
`;

const NoDataMessage = styled.div`
  text-align: center;
  padding: 30px;
  color: #666;
  font-style: italic;
`;

const CountBadge = styled.span`
  background-color: #000080;
  color: white;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 12px;
  margin-left: 8px;
`;

const HistoricoAgendamentos = () => {
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [cidadeFiltro, setCidadeFiltro] = useState('');
  const [statusFiltro, setStatusFiltro] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [appointments, setAppointments] = useState([]);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cidades, setCidades] = useState([]);
  const { can } = usePermissions();
  const [tiposAgendamento, setTiposAgendamento] = useState({});
  
  // Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [currentItems, setCurrentItems] = useState([]);
  
  const { getHistoricalAppointments, fetchCities } = useStore();

  // Função para carregar os agendamentos históricos
  const loadHistoricalAppointments = async () => {
    try {
      setLoading(true);
      
      // Construir objeto de filtros
      const filters = {};
      
      // Adicionar filtros apenas se estiverem preenchidos
      if (startDate) {
        filters.startDate = startDate.toISOString();
      }
      
      if (endDate) {
        filters.endDate = endDate.toISOString();
      }
      
      if (cidadeFiltro) {
        filters.cidade = cidadeFiltro;
      }
      
      if (statusFiltro) {
        filters.status = statusFiltro;
      }
      
      if (searchTerm) {
        filters.searchTerm = searchTerm;
      }

      // Buscar agendamentos históricos
      const result = await getHistoricalAppointments(filters);

      if (result && Array.isArray(result)) {
        // Transformar os dados para garantir consistência
        const formattedAppointments = result.map(appointment => ({
          id: appointment.id,
          nome: appointment.nome || appointment.paciente || '',
          telefone: appointment.telefone || '',
          cidade: appointment.cidade || '',
          data: appointment.data || '',
          horario: appointment.horario || '',
          status: appointment.status || 'pendente',
          informacoes: appointment.informacoes || '',
          observacoes: appointment.observacoes || ''
        }));
        
        // Inicializar os tipos de agendamento (padrão: 'Consultas')
        const initialTipos = {};
        formattedAppointments.forEach(appointment => {
          initialTipos[appointment.id] = appointment.tipo || 'Consultas';
        });
        setTiposAgendamento(initialTipos);
        
        setAppointments(formattedAppointments);
        setFilteredAppointments(formattedAppointments);
        updatePagination(formattedAppointments);
      } else {
        console.error('Formato de dados inválido:', result);
        setAppointments([]);
        setFilteredAppointments([]);
        updatePagination([]);
      }
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
      toast.error('Erro ao carregar histórico de agendamentos');
    } finally {
      setLoading(false);
    }
  };

  // Função para carregar cidades
  const loadCidades = async () => {
    try {
      // Usar diretamente o firebaseService importado no topo do arquivo
      const citiesFromFirebase = await firebaseService.getCities();

      // Garantir que temos um array de objetos com id e nome
      if (citiesFromFirebase && Array.isArray(citiesFromFirebase)) {
        // Processar as cidades para garantir que tenham o formato correto
        const processedCities = citiesFromFirebase.map(city => ({
          id: city.id,
          nome: city.nome || city.name || '',
        }));

        setCidades(processedCities);
        
        // Buscar um agendamento de exemplo para verificar o formato do ID da cidade
        const sampleAppointments = await firebaseService.getAppointments();
        if (sampleAppointments && sampleAppointments.length > 0) {
          // Verificar se o ID da cidade no agendamento corresponde a alguma cidade na lista
          const matchingCity = processedCities.find(c => c.id === sampleAppointments[0].cidade);

        }
      } else {
        console.error('Dados de cidades inválidos:', citiesFromFirebase);
        toast.error('Formato de dados de cidades inválido');
      }
    } catch (error) {
      console.error('Erro ao carregar cidades:', error);
      toast.error('Erro ao carregar lista de cidades');
    }
  };

  // Função para atualizar a paginação
  const updatePagination = (data) => {
    const totalPages = Math.ceil(data.length / itemsPerPage);
    setTotalPages(totalPages);
    
    // Calcular itens da página atual
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    setCurrentItems(data.slice(indexOfFirstItem, indexOfLastItem));
  };

  // Função para aplicar filtros
  const applyFilters = () => {

    // Verificar se a cidade selecionada existe na lista de cidades
    if (cidadeFiltro) {
      const cidadeSelecionada = cidades.find(c => c.id === cidadeFiltro);

    }
    loadHistoricalAppointments();
  };

  // Função para limpar filtros
  const clearFilters = () => {
    setStartDate(null);
    setEndDate(null);
    setCidadeFiltro('');
    setStatusFiltro('');
    setSearchTerm('');
    setCurrentPage(1);
    
    // Recarregar sem filtros
    setTimeout(() => {
      loadHistoricalAppointments();
    }, 100);
  };

  // Função para mudar de página
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    
    const indexOfLastItem = pageNumber * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    setCurrentItems(filteredAppointments.slice(indexOfFirstItem, indexOfLastItem));
  };

  // Função para formatar data no formato brasileiro
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  // Função para gerar PDF do histórico
  const generatePDF = () => {
    try {
      const doc = new jsPDF();
      
      // Título do documento
      doc.setFontSize(18);
      doc.text('Histórico de Agendamentos', 14, 22);
      
      // Informações dos filtros aplicados
      doc.setFontSize(10);
      let yPos = 30;
      
      if (startDate || endDate) {
        let dateText = 'Período: ';
        if (startDate) dateText += formatDate(startDate);
        if (startDate && endDate) dateText += ' até ';
        if (endDate) dateText += formatDate(endDate);
        doc.text(dateText, 14, yPos);
        yPos += 6;
      }
      
      if (cidadeFiltro) {
        const cidadeNome = cidades.find(c => c.id === cidadeFiltro)?.nome || cidadeFiltro;
        doc.text(`Cidade: ${cidadeNome}`, 14, yPos);
        yPos += 6;
      }
      
      if (statusFiltro) {
        doc.text(`Status: ${statusFiltro === 'pendente' ? 'Pendente' : 
                         statusFiltro === 'confirmado' ? 'Confirmado' : 
                         statusFiltro === 'cancelado' ? 'Cancelado' : 
                         statusFiltro}`, 14, yPos);
        yPos += 6;
      }
      
      if (searchTerm) {
        doc.text(`Busca: ${searchTerm}`, 14, yPos);
        yPos += 6;
      }
      
      doc.text(`Total de agendamentos: ${filteredAppointments.length}`, 14, yPos);
      yPos += 10;
      
      // Preparar dados para a tabela
      const tableColumn = ["Nome", "Telefone", "Cidade", "Data", "Horário", "Status", "Observações"];
      const tableRows = [];
      
      filteredAppointments.forEach(appointment => {
        const cidadeNome = cidades.find(c => c.id === appointment.cidade)?.nome || appointment.cidade;
        const status = appointment.status === 'pendente' ? 'Pendente' : 
                       appointment.status === 'confirmado' ? 'Confirmado' : 
                       appointment.status === 'cancelado' ? 'Cancelado' : 
                       appointment.status;
        
        const observacoes = appointment.informacoes || appointment.observacoes || '';
        
        const appointmentData = [
          appointment.nome,
          appointment.telefone,
          cidadeNome,
          appointment.data,
          appointment.horario,
          status,
          observacoes
        ];
        tableRows.push(appointmentData);
      });
      
      // Adicionar a tabela ao PDF
      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: yPos,
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [0, 0, 128] },
        alternateRowStyles: { fillColor: [240, 240, 240] },
        margin: { top: 10 }
      });
      
      // Adicionar data e hora de geração
      const dataGeracao = new Date().toLocaleString('pt-BR');
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.text(`Gerado em: ${dataGeracao}`, 14, doc.internal.pageSize.height - 10);
        doc.text(`Página ${i} de ${pageCount}`, doc.internal.pageSize.width - 30, doc.internal.pageSize.height - 10);
      }
      
      // Salvar o PDF
      doc.save(`historico_agendamentos_${new Date().toISOString().slice(0, 10)}.pdf`);
      toast.success('PDF gerado com sucesso');
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast.error('Erro ao gerar PDF');
    }
  };

  // Carregar dados iniciais
  useEffect(() => {
    loadCidades();
    loadHistoricalAppointments();
  }, []);
  
  // Atualizar paginação quando mudar a página atual
  useEffect(() => {
    if (filteredAppointments.length > 0) {
      const indexOfLastItem = currentPage * itemsPerPage;
      const indexOfFirstItem = indexOfLastItem - itemsPerPage;
      setCurrentItems(filteredAppointments.slice(indexOfFirstItem, indexOfLastItem));
    }
  }, [currentPage, filteredAppointments]);

  // Verificar se tem permissão para ver histórico
  if (!can(PERMISSIONS.APPOINTMENTS_VIEW)) {
    return (
      <Container>
        <Title>Acesso Negado</Title>
        <p>Você não tem permissão para visualizar o histórico de agendamentos.</p>
      </Container>
    );
  }

  return (
    <Container>
      <TopContainer>
        <Title>Histórico de Agendamentos</Title>
        <ButtonGroup>
          {can(PERMISSIONS.EXPORT_DATA) && (
            <Button onClick={generatePDF} $variant="pdf">
              <FaFilePdf /> Exportar PDF
            </Button>
          )}
        </ButtonGroup>
      </TopContainer>
      
      <FilterContainer>
        <FilterGroup>
          <FilterLabel>Período</FilterLabel>
          <DatePickerContainer>
            <StyledDatePicker
              selected={startDate}
              onChange={date => setStartDate(date)}
              selectsStart
              startDate={startDate}
              endDate={endDate}
              dateFormat="dd/MM/yyyy"
              placeholderText="Data inicial"
              locale="pt-BR"
            />
            <span>até</span>
            <StyledDatePicker
              selected={endDate}
              onChange={date => setEndDate(date)}
              selectsEnd
              startDate={startDate}
              endDate={endDate}
              minDate={startDate}
              dateFormat="dd/MM/yyyy"
              placeholderText="Data final"
              locale="pt-BR"
            />
            <FaCalendarAlt style={{ color: '#888' }} />
          </DatePickerContainer>
        </FilterGroup>
        
        <FilterGroup>
          <FilterLabel>Cidade</FilterLabel>
          <Select
            value={cidadeFiltro}
            onChange={e => setCidadeFiltro(e.target.value)}
          >
            <option value="">Todas as cidades</option>
            {cidades.length === 0 ? (
              <option disabled>Carregando cidades...</option>
            ) : (
              cidades.map((cidade, index) => {

                return (
                  <option key={cidade.id || index} value={cidade.id || ''}>
                    {cidade.nome || (cidade.name ? cidade.name : 'Cidade ' + (index + 1))}
                  </option>
                );
              })
            )}
          </Select>
        </FilterGroup>
        
        <FilterGroup>
          <FilterLabel>Status</FilterLabel>
          <Select
            value={statusFiltro}
            onChange={e => setStatusFiltro(e.target.value)}
          >
            <option value="">Todos os status</option>
            <option value="pendente">Pendente</option>
            <option value="confirmado">Confirmado</option>
            <option value="cancelado">Cancelado</option>
          </Select>
        </FilterGroup>
        
        <FilterGroup>
          <FilterLabel>Buscar</FilterLabel>
          <SearchContainer>
            <SearchIcon />
            <SearchInput
              type="text"
              placeholder="Nome ou telefone"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </SearchContainer>
        </FilterGroup>
        
        <FilterGroup style={{ justifyContent: 'flex-end', marginTop: '15px' }}>
          <div style={{ display: 'flex', gap: '10px' }}>
            <Button onClick={applyFilters}>
              Aplicar Filtros
            </Button>
            <Button onClick={clearFilters} style={{ backgroundColor: '#6c757d' }}>
              Limpar Filtros
            </Button>
          </div>
        </FilterGroup>
      </FilterContainer>
      
      {loading ? (
        <div>Carregando...</div>
      ) : filteredAppointments.length === 0 ? (
        <NoDataMessage>
          Nenhum agendamento encontrado para os filtros selecionados.
        </NoDataMessage>
      ) : (
        <>
          <div style={{ marginBottom: '10px' }}>
            Total de agendamentos: <CountBadge>{filteredAppointments.length}</CountBadge>
          </div>
          
          <Table>
            <thead>
              <tr>
                <Th>Nome</Th>
                <Th>Telefone</Th>
                <Th>Cidade</Th>
                <Th>Data</Th>
                <Th>Horário</Th>
                <Th>Status</Th>
                <Th>Observações</Th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map(appointment => (
                <tr key={appointment.id}>
                  <Td>{appointment.nome}</Td>
                  <Td>{appointment.telefone}</Td>
                  <Td>{cidades.find(c => c.id === appointment.cidade)?.nome || appointment.cidade}</Td>
                  <Td>{appointment.data}</Td>
                  <Td>{appointment.horario}</Td>
                  <Td>
                    <StatusBadge $status={appointment.status}>
                      {appointment.status === 'pendente' ? 'Pendente' : 
                       appointment.status === 'confirmado' ? 'Confirmado' : 
                       appointment.status === 'cancelado' ? 'Cancelado' : 
                       appointment.status}
                    </StatusBadge>
                  </Td>
                  <Td>{appointment.informacoes || appointment.observacoes || ''}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
          
          {totalPages > 1 && (
            <PaginationContainer>
              <PageButton 
                onClick={() => handlePageChange(1)} 
                disabled={currentPage === 1}
              >
                &laquo;
              </PageButton>
              
              <PageButton 
                onClick={() => handlePageChange(currentPage - 1)} 
                disabled={currentPage === 1}
              >
                &lt;
              </PageButton>
              
              {[...Array(totalPages)].map((_, index) => {
                const pageNumber = index + 1;
                // Mostrar apenas 5 páginas ao redor da página atual
                if (
                  pageNumber === 1 ||
                  pageNumber === totalPages ||
                  (pageNumber >= currentPage - 2 && pageNumber <= currentPage + 2)
                ) {
                  return (
                    <PageButton
                      key={pageNumber}
                      onClick={() => handlePageChange(pageNumber)}
                      $active={currentPage === pageNumber}
                    >
                      {pageNumber}
                    </PageButton>
                  );
                } else if (
                  pageNumber === currentPage - 3 ||
                  pageNumber === currentPage + 3
                ) {
                  return <span key={pageNumber}>...</span>;
                }
                return null;
              })}
              
              <PageButton 
                onClick={() => handlePageChange(currentPage + 1)} 
                disabled={currentPage === totalPages}
              >
                &gt;
              </PageButton>
              
              <PageButton 
                onClick={() => handlePageChange(totalPages)} 
                disabled={currentPage === totalPages}
              >
                &raquo;
              </PageButton>
            </PaginationContainer>
          )}
        </>
      )}
    </Container>
  );
};

export default HistoricoAgendamentos;

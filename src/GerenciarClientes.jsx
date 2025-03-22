import React, { useState } from 'react';
import styled from 'styled-components';
import useStore from './store/useStore';
import toast from 'react-hot-toast';
import { jsPDF } from 'jspdf';

const Container = styled.div`
  padding: 20px;
`;

const Title = styled.h2`
  color: #333;
  margin-bottom: 20px;
`;

const FilterContainer = styled.div`
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
  flex-wrap: wrap;
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
  background-color: ${props => {
    switch (props.$variant) {
      case 'pdf':
        return '#4CAF50';
      case 'status':
        return '#28a745';
      default:
        return '#dc3545';
    }
  }};
  color: white;

  &:hover {
    opacity: 0.9;
  }
`;

const StatusSelect = styled.select`
  padding: 5px 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  margin-right: 5px;
  background-color: white;
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: #28a745;
  }
`;

const StatusBadge = styled.span`
  padding: 5px 10px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  background-color: ${props => {
    switch (props.status) {
      case 'Pendente':
        return '#ffd700';
      case 'Confirmado':
        return '#28a745';
      case 'Cancelado':
        return '#dc3545';
      default:
        return '#6c757d';
    }
  }};
  color: ${props => props.status === 'Pendente' ? '#000' : '#fff'};
`;

function GerenciarClientes() {
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  const { 
    cities, 
    appointments,
    updateAppointment,
    deleteAppointment,
    setIsLoading 
  } = useStore();

  // Obter datas únicas dos agendamentos
  const uniqueDates = [...new Set(appointments.map(app => app.data))].sort();

  // Filtrar agendamentos
  const filteredAppointments = appointments.filter(appointment => {
    if (selectedCity && appointment.cidade !== selectedCity) return false;
    if (selectedDate && appointment.data !== selectedDate) return false;
    if (selectedStatus && appointment.status !== selectedStatus) return false;
    return true;
  });

  const handleStatusChange = async (appointment, newStatus) => {
    setIsLoading(true);
    try {
      await updateAppointment(appointment.id, { ...appointment, status: newStatus });
      toast.success('Status atualizado com sucesso!');
    } catch (error) {
      toast.error('Erro ao atualizar status');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir este agendamento?')) return;

    setIsLoading(true);
    try {
      await deleteAppointment(id);
      toast.success('Agendamento excluído com sucesso!');
    } catch (error) {
      toast.error('Erro ao excluir agendamento');
    } finally {
      setIsLoading(false);
    }
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    
    // Configurações iniciais
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    let yPos = margin;

    // Função para centralizar texto
    const centerText = (text, y) => {
      const textWidth = doc.getStringUnitWidth(text) * doc.internal.getFontSize() / doc.internal.scaleFactor;
      const x = (pageWidth - textWidth) / 2;
      doc.text(text, x, y);
    };

    // Função para adicionar cabeçalho da página
    const addPageHeader = () => {
      // Retângulo azul no topo
      doc.setFillColor(0, 0, 128);
      doc.rect(0, 0, pageWidth, 40, 'F');

      // Logo/Título
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      centerText('Sistema de Agendamento', 25);

      // Linha decorativa
      doc.setDrawColor(255, 255, 255);
      doc.setLineWidth(0.5);
      doc.line(margin, 32, pageWidth - margin, 32);

      return 50; // Retorna a posição Y após o cabeçalho
    };

    // Função para adicionar rodapé
    const addPageFooter = (pageNumber) => {
      const footerY = pageHeight - 20;
      doc.setTextColor(128, 128, 128);
      doc.setFontSize(8);
      doc.text(`Página ${pageNumber}`, margin, footerY);
      const date = new Date().toLocaleDateString('pt-BR', { 
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      doc.text(date, pageWidth - margin - doc.getStringUnitWidth(date) * 8 / doc.internal.scaleFactor, footerY);
    };

    // Adiciona primeira página
    let pageNumber = 1;
    yPos = addPageHeader();
    
    // Título do relatório
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 128);
    const title = selectedCity 
      ? `Lista de Agendamentos - ${selectedCity}`
      : 'Lista de Agendamentos - Todas as Cidades';
    centerText(title, yPos);
    yPos += 20;

    // Informações do filtro
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    const filterInfo = [];
    if (selectedCity) filterInfo.push(`Cidade: ${selectedCity}`);
    if (selectedDate) filterInfo.push(`Data: ${selectedDate}`);
    if (selectedStatus) filterInfo.push(`Status: ${selectedStatus}`);
    
    if (filterInfo.length > 0) {
      centerText(`Filtros: ${filterInfo.join(' | ')}`, yPos);
      yPos += 15;
    }

    // Configuração da tabela com larguras específicas para cada coluna
    const headers = ['Nome', 'Data', 'Horário', 'Status'];
    const colWidths = [
      (pageWidth - 2 * margin) * 0.4, // Nome (40% do espaço)
      (pageWidth - 2 * margin) * 0.2, // Data (20% do espaço)
      (pageWidth - 2 * margin) * 0.2, // Horário (20% do espaço)
      (pageWidth - 2 * margin) * 0.2  // Status (20% do espaço)
    ];
    
    // Calcula as posições X de cada coluna
    const colPositions = colWidths.reduce((acc, width, i) => {
      const lastPos = i === 0 ? margin : acc[i - 1] + colWidths[i - 1];
      acc.push(lastPos);
      return acc;
    }, []);

    // Cabeçalho da tabela
    doc.setFillColor(0, 0, 128);
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    
    // Desenha o fundo do cabeçalho
    doc.rect(margin, yPos - 5, pageWidth - (2 * margin), 10, 'F');
    
    // Texto do cabeçalho
    headers.forEach((header, i) => {
      doc.text(header, colPositions[i] + 5, yPos);
    });
    yPos += 15;

    // Dados da tabela
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    let rowColor = false;

    filteredAppointments.forEach((appointment, index) => {
      // Verifica se precisa de nova página
      if (yPos > pageHeight - 40) {
        addPageFooter(pageNumber);
        doc.addPage();
        pageNumber++;
        yPos = addPageHeader();
        
        // Repete o cabeçalho da tabela
        doc.setFillColor(0, 0, 128);
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(11);
        doc.rect(margin, yPos - 5, pageWidth - (2 * margin), 10, 'F');
        headers.forEach((header, i) => {
          doc.text(header, colPositions[i] + 5, yPos);
        });
        yPos += 15;
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(10);
      }

      // Fundo alternado para as linhas
      if (rowColor) {
        doc.setFillColor(245, 245, 245);
        doc.rect(margin, yPos - 5, pageWidth - (2 * margin), 8, 'F');
      }
      rowColor = !rowColor;

      // Limita o tamanho do nome para evitar sobreposição
      const maxNameLength = 35; // Ajuste este valor conforme necessário
      let displayName = appointment.paciente;
      if (displayName.length > maxNameLength) {
        displayName = displayName.substring(0, maxNameLength - 3) + '...';
      }

      const row = [
        displayName,
        appointment.data,
        appointment.horario,
        appointment.status
      ];

      row.forEach((cell, i) => {
        doc.text(cell, colPositions[i] + 5, yPos);
      });

      yPos += 10;
    });

    // Adiciona o rodapé na última página
    addPageFooter(pageNumber);

    // Rodapé com total de registros
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 128);
    doc.setFillColor(240, 240, 240);
    const totalText = `Total de Agendamentos: ${filteredAppointments.length}`;
    const totalWidth = doc.getStringUnitWidth(totalText) * 11 / doc.internal.scaleFactor;
    const totalX = (pageWidth - totalWidth) / 2;
    doc.rect(totalX - 5, yPos - 5, totalWidth + 10, 10, 'F');
    centerText(totalText, yPos);

    // Salva o PDF
    const fileName = selectedCity 
      ? `agendamentos_${selectedCity.toLowerCase().replace(/ /g, '_')}.pdf`
      : 'todos_agendamentos.pdf';
    
    doc.save(fileName);
    toast.success('PDF gerado com sucesso!');
  };

  return (
    <Container>
      <Title>Gerenciar Clientes</Title>

      <FilterContainer>
        <Select
          value={selectedCity}
          onChange={(e) => setSelectedCity(e.target.value)}
        >
          <option value="">Todas as cidades</option>
          {cities.map(city => (
            <option key={city.id} value={city.name}>
              {city.name}
            </option>
          ))}
        </Select>

        <Select
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
        >
          <option value="">Todas as datas</option>
          {uniqueDates.map(date => (
            <option key={date} value={date}>
              {date}
            </option>
          ))}
        </Select>

        <Select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
        >
          <option value="">Todos os status</option>
          <option value="Pendente">Pendente</option>
          <option value="Confirmado">Confirmado</option>
          <option value="Cancelado">Cancelado</option>
        </Select>

        <ActionButton 
          $variant="pdf"
          onClick={generatePDF}
        >
          Gerar PDF
        </ActionButton>
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
          {filteredAppointments.map(appointment => (
            <tr key={appointment.id}>
              <Td>{appointment.paciente}</Td>
              <Td>{appointment.cidade}</Td>
              <Td>{appointment.data}</Td>
              <Td>{appointment.horario}</Td>
              <Td>{appointment.infoAdicional || '-'}</Td>
              <Td>
                <StatusSelect
                  value={appointment.status}
                  onChange={(e) => handleStatusChange(appointment, e.target.value)}
                >
                  <option value="Pendente">Pendente</option>
                  <option value="Confirmado">Confirmado</option>
                  <option value="Cancelado">Cancelado</option>
                </StatusSelect>
              </Td>
              <Td>
                <ActionButton 
                  $variant="delete"
                  onClick={() => handleDelete(appointment.id)}
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
}

export default GerenciarClientes;

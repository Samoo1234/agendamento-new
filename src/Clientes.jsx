import React, { useState } from 'react';
import styled from 'styled-components';

const MainContent = styled.div`
  width: 100%;
`;

const Title = styled.h1`
  color: #333;
  margin-bottom: 20px;
`;

const FiltersContainer = styled.div`
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
  display: flex;
  gap: 15px;
  align-items: flex-end;
`;

const FilterGroup = styled.div`
  flex: 1;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 5px;
  color: #666;
  font-size: 14px;
`;

const Select = styled.select`
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
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

const StatusBadge = styled.span`
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  background-color: ${props => props.status === 'Pendente' ? '#ffd700' : '#4CAF50'};
  color: ${props => props.status === 'Pendente' ? '#000' : '#fff'};
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

function Clientes() {
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  return (
    <MainContent>
      <Title>Gerenciar Clientes</Title>
      <FiltersContainer>
        <FilterGroup>
          <Label>Cidade</Label>
          <Select value={selectedCity} onChange={(e) => setSelectedCity(e.target.value)}>
            <option value="">Todas</option>
            <option value="Alto Rio Novo">Alto Rio Novo</option>
          </Select>
        </FilterGroup>
        <FilterGroup>
          <Label>Data</Label>
          <Select value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)}>
            <option value="">Todas</option>
            <option value="20/02/2025">20/02/2025</option>
          </Select>
        </FilterGroup>
        <FilterGroup>
          <Label>Status</Label>
          <Select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
            <option value="">Todos</option>
            <option value="Pendente">Pendente</option>
            <option value="Confirmado">Confirmado</option>
          </Select>
        </FilterGroup>
      </FiltersContainer>

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
          <tr>
            <Td>Deivid Martins</Td>
            <Td>Alto Rio Novo</Td>
            <Td>20/02/2025</Td>
            <Td>09:40</Td>
            <Td></Td>
            <Td><StatusBadge status="Pendente">Pendente</StatusBadge></Td>
            <Td>
              <ActionButton>Editar</ActionButton>
              <ActionButton delete>Excluir</ActionButton>
            </Td>
          </tr>
          <tr>
            <Td>DIRCE DIAS TEIXEIRA</Td>
            <Td>Alto Rio Novo</Td>
            <Td>20/02/2025</Td>
            <Td>10:00</Td>
            <Td></Td>
            <Td><StatusBadge status="Pendente">Pendente</StatusBadge></Td>
            <Td>
              <ActionButton>Editar</ActionButton>
              <ActionButton delete>Excluir</ActionButton>
            </Td>
          </tr>
          <tr>
            <Td>AMANDA MARTINS</Td>
            <Td>Alto Rio Novo</Td>
            <Td>20/02/2025</Td>
            <Td>10:10</Td>
            <Td></Td>
            <Td><StatusBadge status="Pendente">Pendente</StatusBadge></Td>
            <Td>
              <ActionButton>Editar</ActionButton>
              <ActionButton delete>Excluir</ActionButton>
            </Td>
          </tr>
          <tr>
            <Td>IZABEL FERREIRA PRADO</Td>
            <Td>Alto Rio Novo</Td>
            <Td>20/02/2025</Td>
            <Td>10:20</Td>
            <Td>TITULAR DO NUMERO DE TELEFONE IVONE MARIA PRADO</Td>
            <Td><StatusBadge status="Pendente">Pendente</StatusBadge></Td>
            <Td>
              <ActionButton>Editar</ActionButton>
              <ActionButton delete>Excluir</ActionButton>
            </Td>
          </tr>
        </tbody>
      </Table>
    </MainContent>
  );
}

export default Clientes;

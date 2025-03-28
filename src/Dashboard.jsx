import React from 'react';
import styled from 'styled-components';

const MainContent = styled.div`
  width: 100%;
`;

const Title = styled.h1`
  color: #333;
  margin-bottom: 20px;
`;

const MetricsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
`;

const MetricCard = styled.div`
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

  h3 {
    font-size: 14px;
    color: #666;
    margin-bottom: 10px;
  }

  p {
    font-size: 24px;
    color: #000080;
    font-weight: bold;
  }
`;

const ChartsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
`;

const ChartCard = styled.div`
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  min-height: 300px;
`;

function Dashboard() {
  return (
    <MainContent>
        <Title>Dashboard</Title>
        <MetricsContainer>
          <MetricCard>
            <h3>Total de Agendamentos</h3>
            <p>245</p>
          </MetricCard>
          <MetricCard>
            <h3>Agendamentos Hoje</h3>
            <p>0</p>
          </MetricCard>
          <MetricCard>
            <h3>Pacientes Ativos</h3>
            <p>113</p>
          </MetricCard>
          <MetricCard>
            <h3>Taxa de Conversão</h3>
            <p>46.4%</p>
          </MetricCard>
        </MetricsContainer>
        <ChartsContainer>
          <ChartCard>
            <h3>Agendamentos por Cidade</h3>
            {/* Aqui será implementado o gráfico de barras */}
          </ChartCard>
          <ChartCard>
            <h3>Status dos Agendamentos</h3>
            {/* Aqui será implementado o gráfico de pizza */}
          </ChartCard>
          <ChartCard>
            <h3>Agendamentos por Mês</h3>
            {/* Aqui será implementado o gráfico de linha */}
          </ChartCard>
        </ChartsContainer>
    </MainContent>
  );
}

export default Dashboard;
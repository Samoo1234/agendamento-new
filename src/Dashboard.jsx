import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import useStore from './store/useStore';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title as ChartTitle, 
  Tooltip, 
  Legend, 
  ArcElement,
  PointElement,
  LineElement
} from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';

// Registrar os componentes do Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ChartTitle,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

const MainContent = styled.div`
  width: 100%;
`;

const PageTitle = styled.h1`
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

const LoadingMessage = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  font-size: 16px;
  color: #666;
`;

function Dashboard() {
  const { 
    fetchAppointments, 
    fetchCities, 
    appointments, 
    cities, 
    isLoading 
  } = useStore();
  
  const [dashboardData, setDashboardData] = useState({
    totalAppointments: 0,
    todayAppointments: 0,
    activePatients: 0,
    conversionRate: 0,
    appointmentsByCity: {},
    appointmentsByStatus: {},
    appointmentsByMonth: {}
  });

  useEffect(() => {
    // Carregar dados necessários
    const loadData = async () => {
      await fetchCities();
      await fetchAppointments();
    };
    
    loadData();
  }, [fetchCities, fetchAppointments]);

  useEffect(() => {
    if (appointments.length > 0 && cities.length > 0) {
      processAppointmentsData();
    }
  }, [appointments, cities]);

  const processAppointmentsData = () => {
    // Obter a data de hoje no formato DD/MM/YYYY
    const today = new Date();
    const todayFormatted = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;
    console.log('Data de hoje formatada:', todayFormatted);
    
    // Contagem de agendamentos por cidade
    const appointmentsByCity = {};
    cities.forEach(city => {
      appointmentsByCity[city.nome || city.name] = 0;
    });
    
    // Contagem de agendamentos por status
    const appointmentsByStatus = {
      'Agendado': 0,
      'Cancelado': 0,
      'Concluído': 0,
      'Remarcado': 0,
      'Pendente': 0
    };
    
    // Contagem de agendamentos por mês
    const appointmentsByMonth = {
      'Jan': 0, 'Fev': 0, 'Mar': 0, 'Abr': 0, 'Mai': 0, 'Jun': 0,
      'Jul': 0, 'Ago': 0, 'Set': 0, 'Out': 0, 'Nov': 0, 'Dez': 0
    };
    
    // Set para rastrear pacientes únicos
    const uniquePatients = new Set();
    
    // Contador de agendamentos de hoje
    let todayAppointments = 0;
    
    console.log('Total de agendamentos a processar:', appointments.length);
    console.log('Data atual para comparação:', todayFormatted);
    
    // Processar cada agendamento
    appointments.forEach(appointment => {
      // Contar por cidade
      if (appointment.cidade && typeof appointment.cidade === 'string') {
        if (appointmentsByCity.hasOwnProperty(appointment.cidade)) {
          appointmentsByCity[appointment.cidade]++;
        }
      }
      
      // Contar por status
      const status = appointment.status || 'pendente';
      if (appointmentsByStatus.hasOwnProperty(status)) {
        appointmentsByStatus[status]++;
      }
      
      // Contar por mês
      if (appointment.data) {
        const [day, month, year] = appointment.data.split('/').map(Number);
        if (!isNaN(month) && month >= 1 && month <= 12) {
          const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
          appointmentsByMonth[monthNames[month - 1]]++;
        }
      }
      
      // Contar pacientes únicos
      if (appointment.paciente) {
        uniquePatients.add(appointment.paciente);
      } else if (appointment.cliente) {
        uniquePatients.add(appointment.cliente);
      } else if (appointment.nome) {
        uniquePatients.add(appointment.nome);
      }
      
      // Contar agendamentos de hoje - CORREÇÃO PARA MOSTRAR CORRETAMENTE
      if (appointment.data) {
        // Extrair a data do agendamento
        const dataAgendamento = appointment.data;
        console.log(`Verificando agendamento: ${dataAgendamento} (data atual: ${todayFormatted})`);
        
        // Obter a data atual no formato correto (04/04/2025)
        const dataAtual = todayFormatted;
        
        // Verificar se a data do agendamento é igual à data atual
        if (dataAgendamento === dataAtual) {
          console.log('✅ ENCONTRADO AGENDAMENTO DE HOJE:', appointment);
          todayAppointments++;
        }
        
        // Verificação adicional para datas em formatos diferentes
        try {
          // Extrair componentes da data do agendamento
          const [diaAgendamento, mesAgendamento, anoAgendamento] = dataAgendamento.split('/').map(Number);
          
          // Extrair componentes da data atual
          const [diaAtual, mesAtual, anoAtual] = dataAtual.split('/').map(Number);
          
          // Verificar se os componentes são iguais
          if (diaAgendamento === diaAtual && 
              mesAgendamento === mesAtual && 
              anoAgendamento === anoAtual) {
            console.log('✅ ENCONTRADO AGENDAMENTO DE HOJE (verificação por componentes)');
            // Não incrementamos aqui para evitar duplicação, só se não foi encontrado na verificação anterior
            if (dataAgendamento !== dataAtual) {
              todayAppointments++;
            }
          }
        } catch (error) {
          console.error('Erro ao comparar datas:', error);
        }
      }
    });
    
    // Calcular taxa de conversão (exemplo: agendamentos concluídos / total)
    const completedAppointments = appointmentsByStatus['Concluído'] || 0;
    const conversionRate = appointments.length > 0 
      ? ((completedAppointments / appointments.length) * 100).toFixed(1)
      : 0;
    
    console.log(`Total de agendamentos de hoje encontrados: ${todayAppointments}`);
    
    setDashboardData({
      totalAppointments: appointments.length,
      todayAppointments,
      activePatients: uniquePatients.size,
      conversionRate,
      appointmentsByCity,
      appointmentsByStatus,
      appointmentsByMonth
    });
  };

  // Configuração para o gráfico de barras (agendamentos por cidade)
  const cityChartData = {
    labels: Object.keys(dashboardData.appointmentsByCity),
    datasets: [
      {
        label: 'Agendamentos',
        data: Object.values(dashboardData.appointmentsByCity),
        backgroundColor: '#000080',
      }
    ]
  };

  // Configuração para o gráfico de pizza (status dos agendamentos)
  const statusChartData = {
    labels: Object.keys(dashboardData.appointmentsByStatus),
    datasets: [
      {
        data: Object.values(dashboardData.appointmentsByStatus),
        backgroundColor: [
          '#000080', // Azul escuro - Agendado
          '#ff4d4d', // Vermelho - Cancelado
          '#4CAF50', // Verde - Concluído
          '#FFC107',  // Amarelo - Remarcado
          '#03A9F4'  // Azul claro - Pendente
        ],
        borderWidth: 1,
      }
    ]
  };

  // Configuração para o gráfico de linha (agendamentos por mês)
  const monthChartData = {
    labels: Object.keys(dashboardData.appointmentsByMonth),
    datasets: [
      {
        label: 'Agendamentos',
        data: Object.values(dashboardData.appointmentsByMonth),
        borderColor: '#000080',
        backgroundColor: 'rgba(0, 0, 128, 0.1)',
        tension: 0.3,
        fill: true
      }
    ]
  };

  // Opções comuns para os gráficos
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
    }
  };

  // Adicionar um botão de atualização no topo do dashboard
  const refreshData = async () => {
    try {
      await fetchCities();
      await fetchAppointments();
      console.log('Dados atualizados com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar dados:', error);
    }
  };

  return (
    <MainContent>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <PageTitle>Dashboard</PageTitle>
        <button 
          onClick={refreshData}
          style={{ 
            backgroundColor: '#000080', 
            color: 'white', 
            border: 'none', 
            padding: '8px 16px', 
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Atualizar Dados
        </button>
      </div>
      <MetricsContainer>
        <MetricCard>
          <h3>Total de Agendamentos</h3>
          <p>{dashboardData.totalAppointments}</p>
        </MetricCard>
        <MetricCard>
          <h3>Agendamentos Hoje</h3>
          <p>{dashboardData.todayAppointments}</p>
        </MetricCard>
        <MetricCard>
          <h3>Pacientes Ativos</h3>
          <p>{dashboardData.activePatients}</p>
        </MetricCard>
        <MetricCard>
          <h3>Taxa de Conversão</h3>
          <p>{dashboardData.conversionRate}%</p>
        </MetricCard>
      </MetricsContainer>
      <ChartsContainer>
        <ChartCard>
          <h3>Agendamentos por Cidade</h3>
          {isLoading ? (
            <LoadingMessage>Carregando dados...</LoadingMessage>
          ) : (
            <div style={{ height: '250px' }}>
              <Bar data={cityChartData} options={chartOptions} />
            </div>
          )}
        </ChartCard>
        <ChartCard>
          <h3>Status dos Agendamentos</h3>
          {isLoading ? (
            <LoadingMessage>Carregando dados...</LoadingMessage>
          ) : (
            <div style={{ height: '250px' }}>
              <Pie data={statusChartData} options={chartOptions} />
            </div>
          )}
        </ChartCard>
        <ChartCard>
          <h3>Agendamentos por Mês</h3>
          {isLoading ? (
            <LoadingMessage>Carregando dados...</LoadingMessage>
          ) : (
            <div style={{ height: '250px' }}>
              <Line data={monthChartData} options={chartOptions} />
            </div>
          )}
        </ChartCard>
      </ChartsContainer>
    </MainContent>
  );
}

export default Dashboard;
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
// Removendo importações problemáticas de date-fns
// import { format } from 'date-fns';
// import { ptBR } from 'date-fns/locale';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { collection, getDocs, doc, getDoc, addDoc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import { db } from './config/firebase';
import * as firebaseService from './services/firebaseService';
import useStore from './store/useStore';
import { FaTrash, FaPlus } from 'react-icons/fa';
import { PERMISSIONS } from './config/permissions';
import { usePermissions } from './hooks/usePermissions';

// Componentes estilizados
const Container = styled.div`
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
`;

const Title = styled.h1`
  color: #333;
  margin-bottom: 20px;
`;

const FilterContainer = styled.div`
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
  flex-wrap: wrap;
  align-items: flex-end;
`;

const SelectWrapper = styled.div`
  display: flex;
  flex-direction: column;
`;

const Label = styled.label`
  margin-bottom: 5px;
  font-weight: 500;
`;

const Select = styled.select`
  padding: 8px;
  border-radius: 4px;
  border: 1px solid #ccc;
  min-width: 200px;
`;

const Button = styled.button`
  background-color: #4caf50;
  color: white;
  border: none;
  padding: 10px 15px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  
  &:hover {
    background-color: #45a049;
  }
`;

const FilterGroup = styled.div`
  display: flex;
  flex-direction: column;
`;

const Financeiro = () => {
  const { cities, fetchCities, loadingCities } = useStore();
  const { can, user, getAll, getRole, isAdmin } = usePermissions();


  const [cidadeSelecionada, setCidadeSelecionada] = useState('');
  const [dataSelecionada, setDataSelecionada] = useState('');
  const [diaSemana, setDiaSemana] = useState('');
  const [datas, setDatas] = useState([]);
  const [datasFiltradasPorCidade, setDatasFiltradasPorCidade] = useState([]);
  const [registrosFinanceiros, setRegistrosFinanceiros] = useState([]);
  const [agendamentos, setAgendamentos] = useState([]);
  const [registroEditando, setRegistroEditando] = useState(null);
  const [modalAberto, setModalAberto] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [estatisticas, setEstatisticas] = useState({
    totalParticular: 0,
    totalConvenio: 0,
    totalCampanha: 0,
    totalGeral: 0,
    countParticular: 0,
    countConvenio: 0,
    countCampanha: 0,
    countTotal: 0,
    countDinheiro: 0,
    countCartao: 0,
    countPix: 0,
    totalDinheiro: 0,
    totalCartao: 0,
    totalPix: 0,
    countCasosClinicos: 0,
    countEfetivacoes: 0,
    countPerdas: 0
  });
  const [mapaCidadeDatas, setMapaCidadeDatas] = useState(new Map());
  const [pagamentosDivididos, setPagamentosDivididos] = useState({});

  // Carregar cidades e datas disponíveis
  useEffect(() => {
    const carregarDados = async () => {
      try {
        setIsLoading(true);

        // Carregar cidades usando o useStore

        await fetchCities();
        
        // Log único das cidades (sem causar loop)

        if (cities && cities.length > 0) {

        }
        
        // Carregar datas disponíveis diretamente do Firestore

        try {
          const datasDisponiveisRef = collection(db, 'datas_disponiveis');
          const querySnapshot = await getDocs(datasDisponiveisRef);
          
          const todasDatas = querySnapshot.docs.map(doc => {
            const data = doc.data();

            return {
              id: doc.id,
              ...data,
              // Garantir que temos a cidade como string para comparação
              cidade: data.cidade || ''
            };
          });

          setDatas(todasDatas);
        } catch (datasError) {
          console.error('Erro específico ao carregar datas:', datasError);
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Erro ao carregar dados iniciais:', error);
        setError('Erro ao carregar dados. Por favor, tente novamente.');
        setIsLoading(false);
      }
    };
    
    carregarDados();
  }, [fetchCities]);

  // Filtrar datas por cidade
  useEffect(() => {
    if (!cidadeSelecionada || datas.length === 0 || !cities || cities.length === 0) {
      setDatasFiltradasPorCidade([]);
      return;
    }
    
    // Encontrar a cidade selecionada pelo ID para obter o nome
    const cidadeSelecionadaObj = cities.find(city => city.id === cidadeSelecionada);
    if (!cidadeSelecionadaObj) {

      setDatasFiltradasPorCidade([]);
      return;
    }
    
    const nomeCidadeSelecionada = cidadeSelecionadaObj.name;

    // Filtrar datas que correspondem à cidade selecionada pelo nome
    const datasFiltradas = datas.filter(data => {
      // A cidade pode estar armazenada como nome (string)
      const nomeCidade = data.cidade;

      // Verificar se o nome da cidade da data corresponde ao nome da cidade selecionada
      const cidadeCorresponde = nomeCidade === nomeCidadeSelecionada;
      if (cidadeCorresponde) {

      }
      return cidadeCorresponde;
    });

    setDatasFiltradasPorCidade(datasFiltradas);
  }, [cidadeSelecionada, datas, cities]);

  // Função para buscar dados financeiros e agendamentos
  const buscarDados = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Verificar se temos cidade e data selecionadas
      if (!cidadeSelecionada || !dataSelecionada) {

        setIsLoading(false);
        return;
      }
      
      // Buscar a data selecionada para obter a data formatada
      const dataObj = datas.find(d => d.id === dataSelecionada);
      if (!dataObj) {
        console.error('Data selecionada não encontrada');
        setIsLoading(false);
        return;
      }
      
      // Buscar registros financeiros para a cidade e data selecionadas

      // Criar query para buscar registros financeiros
      const q = query(
        collection(db, 'registros_financeiros'),
        where('cidadeId', '==', cidadeSelecionada),
        where('dataId', '==', dataSelecionada)
      );
      
      const querySnapshot = await getDocs(q);

      // Processar resultados
      const registros = [];
      querySnapshot.forEach((doc) => {
        registros.push({
          id: doc.id,
          ...doc.data(),
          editando: false
        });
      });
      
      setRegistrosFinanceiros(registros);
      
      // Inicializar pagamentos divididos para registros existentes
      const pagamentosTemp = {};
      registros.forEach(registro => {
        if (registro.formasPagamento && Array.isArray(registro.formasPagamento)) {
          pagamentosTemp[registro.id] = registro.formasPagamento;
        } else {
          // Compatibilidade com registros antigos
          pagamentosTemp[registro.id] = [{
            formaPagamento: registro.formaPagamento || '',
            valor: registro.valor || ''
          }];
        }
      });
      
      setPagamentosDivididos(prev => ({
        ...prev,
        ...pagamentosTemp
      }));
      
      // Buscar agendamentos para a mesma cidade e data

      // Obter o nome da cidade a partir do ID
      const cidadeObj = cities.find(city => city.id === cidadeSelecionada);
      if (!cidadeObj) {
        console.error('Cidade selecionada não encontrada');
        setIsLoading(false);
        return;
      }
      
      // Obter a data formatada
      const dataFormatada = dataObj.data;

      // Criar query para buscar agendamentos usando o nome da cidade e a data formatada
      const qAgendamentos = query(
        collection(db, 'agendamentos'),
        where('cidade', '==', cidadeObj.name),
        where('data', '==', dataFormatada)
      );
      
      const agendamentosSnapshot = await getDocs(qAgendamentos);

      // Processar agendamentos
      const agendamentosData = [];
      const registrosDeAgendamentos = [...registros]; // Cópia dos registros existentes

      agendamentosSnapshot.forEach((doc) => {
        const agendamento = {
          id: doc.id,
          ...doc.data()
        };

        agendamentosData.push(agendamento);
        
        // Verificar se já existe um registro financeiro para este agendamento
        const registroExistente = registros.find(r => r.agendamentoId === agendamento.id);

        // Se não existir, criar um novo registro financeiro a partir do agendamento
        if (!registroExistente) {
          const novoRegistroId = `novo_${agendamento.id}`;
          
          // Verificar o nome do cliente/paciente
          let nomeCliente = '';
          if (agendamento.paciente) {
            nomeCliente = agendamento.paciente;
          } else if (agendamento.cliente) {
            nomeCliente = agendamento.cliente;
          } else if (agendamento.nome) {
            nomeCliente = agendamento.nome;
          }

          const novoRegistro = {
            id: novoRegistroId,
            agendamentoId: agendamento.id,
            cliente: nomeCliente,
            valor: agendamento.valor || '',
            tipo: '',
            formaPagamento: '',
            situacao: '',
            observacoes: '',
            novo: true,
            editando: true, // Iniciar em modo de edição para que o usuário possa preencher os campos
            cidadeId: cidadeSelecionada,
            dataId: dataSelecionada
          };

          registrosDeAgendamentos.push(novoRegistro);
          
          // Inicializar pagamentos divididos para este registro
          pagamentosTemp[novoRegistroId] = [{ formaPagamento: '', valor: agendamento.valor || '' }];
        }
      });

      setAgendamentos(agendamentosData);
      setRegistrosFinanceiros(registrosDeAgendamentos);
      
      // Atualizar dia da semana
      if (dataObj.data) {
        // Extrair dia, mês e ano da data formatada (DD/MM/YYYY)
        const [dia, mes, ano] = dataObj.data.split('/').map(Number);
        
        // Criar objeto Date com os valores extraídos (mês - 1 porque em JS os meses vão de 0 a 11)
        const dataFormatada = new Date(
          parseInt(ano, 10),
          parseInt(mes, 10) - 1,
          parseInt(dia, 10),
          12, // meio-dia para evitar problemas de timezone
          0,
          0
        );

        // Formatar o dia da semana
        const diaSemanaFormatado = dataFormatada.toLocaleString('pt-BR', { weekday: 'long' });

        // Capitalizar a primeira letra
        const diaSemanaCapitalizado = diaSemanaFormatado.charAt(0).toUpperCase() + diaSemanaFormatado.slice(1);
        setDiaSemana(diaSemanaCapitalizado);
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
      setError(`Erro ao buscar dados: ${error.message}`);
      setIsLoading(false);
    }
  };

  // Função para calcular estatísticas dos registros financeiros
  const calcularEstatisticas = (registros) => {
    const stats = {
      totalParticular: 0,
      totalConvenio: 0,
      totalCampanha: 0,
      totalExames: 0,
      totalRevisao: 0,
      totalGeral: 0,
      countParticular: 0,
      countConvenio: 0,
      countCampanha: 0,
      countExames: 0,
      countRevisao: 0,
      countTotal: 0,
      countDinheiro: 0,
      countCartao: 0,
      countPix: 0,
      totalDinheiro: 0,
      totalCartao: 0,
      totalPix: 0
    };
    
    for (const registro of registros) {
      if (!registro.valor || !registro.tipo) continue;
      
      const valor = parseFloat(registro.valor.replace(',', '.'));
      if (isNaN(valor)) continue;
      
      stats.totalGeral += valor;
      stats.countTotal++;
      
      // Contabilizar por tipo de atendimento
      switch (registro.tipo.toLowerCase()) {
        case 'particular':
          stats.totalParticular += valor;
          stats.countParticular++;
          break;
        case 'convênio':
        case 'convenio':
          stats.totalConvenio += valor;
          stats.countConvenio++;
          break;
        case 'campanha':
          stats.totalCampanha += valor;
          stats.countCampanha++;
          break;
        case 'exames':
          stats.totalExames += valor;
          stats.countExames++;
          break;
        case 'revisão':
        case 'revisao':
          stats.totalRevisao += valor;
          stats.countRevisao++;
          break;
      }
      
      // Contabilizar por forma de pagamento
      if (registro.formasPagamento && Array.isArray(registro.formasPagamento)) {
        // Para registros com pagamentos divididos
        for (const pagamento of registro.formasPagamento) {
          if (!pagamento.formaPagamento || !pagamento.valor) continue;
          
          const valorPagamento = parseFloat(pagamento.valor.replace(',', '.'));
          if (isNaN(valorPagamento)) continue;
          
          switch (pagamento.formaPagamento.toLowerCase()) {
            case 'dinheiro':
              stats.countDinheiro++;
              stats.totalDinheiro += valorPagamento;
              break;
            case 'cartão':
            case 'cartao':
              stats.countCartao++;
              stats.totalCartao += valorPagamento;
              break;
            case 'pix/pic pay':
            case 'pix':
            case 'pic pay':
              stats.countPix++;
              stats.totalPix += valorPagamento;
              break;
          }
        }
      } else {
        // Para registros com forma de pagamento única (compatibilidade)
        switch (registro.formaPagamento.toLowerCase()) {
          case 'dinheiro':
            stats.countDinheiro++;
            stats.totalDinheiro += valor;
            break;
          case 'cartão':
          case 'cartao':
            stats.countCartao++;
            stats.totalCartao += valor;
            break;
          case 'pix/pic pay':
          case 'pix':
          case 'pic pay':
            stats.countPix++;
            stats.totalPix += valor;
            break;
        }
      }
    }
    
    setEstatisticas(stats);
  };

  // Quando a cidade ou data mudar, buscar registros financeiros
  useEffect(() => {
    const buscarRegistros = async () => {
      if (cidadeSelecionada && dataSelecionada) {

        buscarDados();
      }
    };
    
    buscarRegistros();
  }, [cidadeSelecionada, dataSelecionada]);

  // Calcular estatísticas quando os registros financeiros mudarem
  useEffect(() => {
    if (registrosFinanceiros && registrosFinanceiros.length > 0) {
      calcularEstatisticas(registrosFinanceiros);
    } else {
      // Resetar estatísticas se não houver registros
      setEstatisticas({
        totalParticular: 0,
        totalConvenio: 0,
        totalCampanha: 0,
        totalGeral: 0,
        countParticular: 0,
        countConvenio: 0,
        countCampanha: 0,
        countTotal: 0,
        countDinheiro: 0,
        countCartao: 0,
        countPix: 0,
        totalDinheiro: 0,
        totalCartao: 0,
        totalPix: 0
      });
    }
  }, [registrosFinanceiros]);

  const handleChangeCidade = (e) => {
    try {
      const valor = e.target.value;

      setCidadeSelecionada(valor);
      setDataSelecionada('');
      setDiaSemana('');
      setRegistrosFinanceiros([]);
      setAgendamentos([]);
    } catch (error) {
      console.error('Erro ao selecionar cidade:', error);
    }
  };

  const handleChangeData = (e) => {
    try {
      const valor = e.target.value;

      setDataSelecionada(valor);
      
      if (valor) {
        // Encontrar a data selecionada para obter o dia da semana
        const dataObj = datas.find(d => d.id === valor);

        if (dataObj && dataObj.data) {
          try {
            // Converter a string de data para um objeto Date de forma segura
            // Formato: DD/MM/YYYY -> YYYY-MM-DD
            const partes = dataObj.data.split('/');
            // Usar o construtor com ano, mês, dia para evitar problemas de timezone
            // Nota: mês é 0-indexed no JavaScript, por isso o -1
            const dataFormatada = new Date(
              parseInt(partes[2], 10),
              parseInt(partes[1], 10) - 1,
              parseInt(partes[0], 10),
              12, // meio-dia para evitar problemas de timezone
              0,
              0
            );

            // Formatar o dia da semana
            const diaSemanaFormatado = dataFormatada.toLocaleString('pt-BR', { weekday: 'long' });

            // Capitalizar a primeira letra
            const diaSemanaCapitalizado = diaSemanaFormatado.charAt(0).toUpperCase() + diaSemanaFormatado.slice(1);
            setDiaSemana(diaSemanaCapitalizado);
          } catch (error) {
            console.error('Erro ao formatar data:', error);
            setDiaSemana('');
          }
          
          // Buscar registros financeiros e agendamentos para esta data
          buscarDados();
        }
      } else {
        setDiaSemana('');
        setRegistrosFinanceiros([]);
        setAgendamentos([]);
      }
    } catch (error) {
      console.error('Erro ao selecionar data:', error);
    }
  };

  const handleChangeRegistro = (id, campo, valor) => {
    setRegistrosFinanceiros(prev => {
      return prev.map(registro => {
        if (registro.id === id) {
          // Se o campo for valor, formatar como moeda
          if (campo === 'valor') {
            // Permitir apenas números, vírgula e ponto
            const valorLimpo = valor.replace(/[^\d,.]/g, '');
            // Substituir pontos por vírgulas (para garantir que só tenha uma vírgula)
            const valorFormatado = valorLimpo.replace(/\./g, ',').replace(/,/g, ',');
            
            return { ...registro, [campo]: valorFormatado };
          }
          
          return { ...registro, [campo]: valor };
        }
        return registro;
      });
    });
  };

  const gerarPDF = () => {
    try {

      // Verificar se há registros para gerar o PDF
      if (!registrosFinanceiros || registrosFinanceiros.length === 0) {
        alert('Não há registros financeiros para gerar o PDF.');
        return;
      }
      
      // Criar novo documento PDF com orientação paisagem
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });
      
      // Adicionar título
      const cidadeSelecionadaObj = cities.find(city => city.id === cidadeSelecionada);
      const nomeCidade = cidadeSelecionadaObj ? cidadeSelecionadaObj.name : 'Desconhecida';
      
      const dataObj = datas.find(d => d.id === dataSelecionada);
      const dataFormatada = dataObj ? dataObj.data : 'Data desconhecida';
      
      doc.setFontSize(18);
      doc.text(`Relatório Financeiro - ${nomeCidade}`, 14, 20);
      doc.setFontSize(14);
      doc.text(`Data: ${dataFormatada} (${diaSemana})`, 14, 30);
      
      // Função para converter horário para minutos (definida localmente para uso no PDF)
      const getMinutosLocal = (horario) => {
        if (!horario) return 0;
        const [horas, minutos] = horario.split(':').map(Number);
        return (horas * 60) + minutos;
      };
      
      // Ordenar registros por horário de agendamento (mesma lógica usada no frontend)
      const registrosOrdenados = [...registrosFinanceiros].sort((a, b) => {
        // Buscar agendamentos correspondentes
        const agendamentoA = agendamentos.find(ag => ag.id === a.agendamentoId);
        const agendamentoB = agendamentos.find(ag => ag.id === b.agendamentoId);
        
        // Converter horário para minutos
        const horaA = agendamentoA ? getMinutosLocal(agendamentoA.horario) : 0;
        const horaB = agendamentoB ? getMinutosLocal(agendamentoB.horario) : 0;
        
        return horaA - horaB;
      });
      
      // Configurar tabela manual
      let startY = 40;
      const lineHeight = 12; // Altura da linha
      const margin = 15;
      const pageWidth = doc.internal.pageSize.getWidth(); // Agora maior por causa da orientação paisagem
      // Ajustando as larguras das colunas com mais espaço disponível na orientação paisagem
      const colWidths = [60, 30, 40, 60, 40, 60]; // Larguras das colunas aumentadas e ajustadas para 6 colunas
      
      // Calcular a largura total e ajustar proporcionalmente
      const totalWidth = colWidths.reduce((a, b) => a + b, 0);
      const scaleFactor = (pageWidth - 2 * margin) / totalWidth;
      const scaledWidths = colWidths.map(w => w * scaleFactor);
      
      // Cabeçalho da tabela
      doc.setFillColor(220, 220, 220); // Cinza claro
      doc.setDrawColor(0, 0, 0); // Preto
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      
      // Desenhar cabeçalho
      let currentX = margin;
      const headers = ["Cliente", "R$", "Tipo", "Forma de Pagamento", "Situação", "Observações"];
      
      // Desenhar retângulo de fundo para o cabeçalho
      doc.rect(margin, startY, pageWidth - 2 * margin, lineHeight, 'FD');
      
      // Adicionar textos do cabeçalho
      headers.forEach((header, i) => {
        doc.text(header, currentX + 2, startY + lineHeight - 2); // +2 para padding, -2 para alinhar texto
        currentX += scaledWidths[i];
      });
      
      startY += lineHeight;
      
      // Adicionar linhas de dados
      doc.setFontSize(8);
      doc.setDrawColor(200, 200, 200); // Cinza mais claro para as linhas
      
      // Processar registros ordenados para o PDF
      registrosOrdenados.forEach((registro, rowIndex) => {
        const formaPagamentoDisplay = registro.formasPagamento && Array.isArray(registro.formasPagamento) ?
          registro.formasPagamento.map(p => `${p.formaPagamento}: R$ ${formatarValorMoeda(p.valor)}`).join(', ') :
          registro.formaPagamento;
        
        const rowData = [
          registro.cliente || '',
          `R$ ${formatarValorMoeda(registro.valor)}`,
          registro.tipo || '',
          formaPagamentoDisplay || '',
          registro.situacao || '',
          registro.observacoes || ''
        ];
        
        // Verificar se precisamos de uma nova página
        if (startY > doc.internal.pageSize.getHeight() - 20) {
          doc.addPage();
          startY = 20;
        }
        
        // Desenhar retângulo de fundo alternado para as linhas
        if (rowIndex % 2 === 0) {
          doc.setFillColor(245, 245, 245); // Cinza bem claro
          doc.rect(margin, startY, pageWidth - 2 * margin, lineHeight, 'FD');
        } else {
          doc.setFillColor(255, 255, 255); // Branco
          doc.rect(margin, startY, pageWidth - 2 * margin, lineHeight, 'FD');
        }
        
        // Adicionar textos da linha
        currentX = margin;
        rowData.forEach((cell, i) => {
          // Limitar o texto para caber na coluna e evitar sobreposição
          let cellText = cell;
          const maxLength = i === 0 ? 25 : // Cliente
                          i === 1 ? 10 : // R$
                          i === 2 ? 15 : // Tipo
                          i === 3 ? 18 : // Forma de Pagamento
                          i === 4 ? 12 : // Situação
                          30;            // Observações
          
          if (cellText.length > maxLength) {
            cellText = cellText.substring(0, maxLength - 3) + '...';
          }
          
          // Adicionar padding para evitar sobreposição com bordas
          doc.text(cellText, currentX + 3, startY + lineHeight - 3);
          currentX += scaledWidths[i];
        });
        
        startY += lineHeight;
      });
      
      // Adicionar espaço após a tabela principal
      startY += 10;
      
      // Verificar se precisamos de uma nova página para as estatísticas
      if (startY > doc.internal.pageSize.getHeight() - 80) { // Precisamos de pelo menos 80mm para as tabelas de estatísticas
        doc.addPage();
        startY = 20;
      }
      
      // Adicionar título para a seção de estatísticas
      doc.setFontSize(14);
      doc.text('Resumo Estatístico', margin, startY);
      startY += 10;
      
      // Configurar tabelas de estatísticas lado a lado
      const halfWidth = (pageWidth - 2 * margin - 10) / 2; // Largura de cada tabela (com 10mm de espaço entre elas)
      
      // Tabela 1: Por Tipo
      doc.setFontSize(12);
      doc.text('Por Tipo', margin, startY);
      startY += 5;
      
      // Cabeçalho da tabela de tipos
      doc.setFillColor(220, 220, 220); // Cinza claro
      doc.setDrawColor(0, 0, 0); // Preto
      doc.setFontSize(9);
      doc.rect(margin, startY, halfWidth, lineHeight, 'FD');
      
      // Cabeçalhos da tabela de tipos
      let tiposX = margin;
      const tiposHeaders = ["Tipo", "Quantidade", "Total (R$)"];
      const tiposColWidths = [halfWidth * 0.4, halfWidth * 0.3, halfWidth * 0.3]; // 40%, 30%, 30%
      
      tiposHeaders.forEach((header, i) => {
        doc.text(header, tiposX + 3, startY + lineHeight - 3);
        tiposX += tiposColWidths[i];
      });
      
      startY += lineHeight;
      
      // Dados da tabela de tipos
      doc.setFontSize(8);
      const tiposData = [
        { tipo: 'Particular', count: estatisticas.countParticular, total: formatarValorMoeda(estatisticas.totalParticular) },
        { tipo: 'Convênio', count: estatisticas.countConvenio, total: formatarValorMoeda(estatisticas.totalConvenio) },
        { tipo: 'Campanha', count: estatisticas.countCampanha, total: formatarValorMoeda(estatisticas.totalCampanha) },
        { tipo: 'Exames', count: estatisticas.countExames, total: formatarValorMoeda(estatisticas.totalExames) },
        { tipo: 'Revisão', count: estatisticas.countRevisao, total: formatarValorMoeda(estatisticas.totalRevisao) },
        { tipo: 'Total', count: estatisticas.countTotal, total: formatarValorMoeda(estatisticas.totalGeral) }
      ];
      
      tiposData.forEach((row, rowIndex) => {
        // Fundo alternado
        if (rowIndex % 2 === 0) {
          doc.setFillColor(245, 245, 245); // Cinza bem claro
        } else {
          doc.setFillColor(255, 255, 255); // Branco
        }
        
        // Destacar a linha de total
        if (rowIndex === tiposData.length - 1) {
          doc.setFillColor(230, 230, 230); // Cinza mais escuro para o total
          doc.setFontSize(9); // Texto maior para o total
        }
        
        doc.rect(margin, startY, halfWidth, lineHeight, 'FD');
        
        // Textos da linha
        tiposX = margin;
        [row.tipo, row.count.toString(), row.total].forEach((cell, i) => {
          doc.text(cell, tiposX + 3, startY + lineHeight - 3);
          tiposX += tiposColWidths[i];
        });
        
        startY += lineHeight;
        
        // Restaurar fonte normal após a linha de total
        if (rowIndex === tiposData.length - 1) {
          doc.setFontSize(8);
        }
      });
      
      // Tabela 2: Por Forma de Pagamento (ao lado da primeira)
      const pagamentoStartY = startY - (lineHeight * tiposData.length); // Mesma altura inicial da tabela de tipos
      const pagamentoX = margin + halfWidth + 10; // Posição X após a primeira tabela + espaço
      
      doc.setFontSize(12);
      doc.text('Por Forma de Pagamento', pagamentoX, pagamentoStartY - 5);
      
      // Cabeçalho da tabela de formas de pagamento
      doc.setFillColor(220, 220, 220); // Cinza claro
      doc.setDrawColor(0, 0, 0); // Preto
      doc.setFontSize(9);
      doc.rect(pagamentoX, pagamentoStartY, halfWidth, lineHeight, 'FD');
      
      // Cabeçalhos da tabela de formas de pagamento
      let pagamentoHeaderX = pagamentoX;
      const pagamentoHeaders = ["Forma de Pagamento", "Quantidade", "Total (R$)"];
      const pagamentoColWidths = [halfWidth * 0.4, halfWidth * 0.3, halfWidth * 0.3]; // 40%, 30%, 30%
      
      pagamentoHeaders.forEach((header, i) => {
        doc.text(header, pagamentoHeaderX + 3, pagamentoStartY + lineHeight - 3);
        pagamentoHeaderX += pagamentoColWidths[i];
      });
      
      let currentPagamentoY = pagamentoStartY + lineHeight;
      
      // Dados da tabela de formas de pagamento
      doc.setFontSize(8);
      const pagamentoData = [
        { forma: 'Dinheiro', count: estatisticas.countDinheiro, total: formatarValorMoeda(estatisticas.totalDinheiro) },
        { forma: 'Cartão', count: estatisticas.countCartao, total: formatarValorMoeda(estatisticas.totalCartao) },
        { forma: 'PIX', count: estatisticas.countPix, total: formatarValorMoeda(estatisticas.totalPix) }
      ];
      
      pagamentoData.forEach((row, rowIndex) => {
        // Fundo alternado
        if (rowIndex % 2 === 0) {
          doc.setFillColor(245, 245, 245); // Cinza bem claro
        } else {
          doc.setFillColor(255, 255, 255); // Branco
        }
        
        doc.rect(pagamentoX, currentPagamentoY, halfWidth, lineHeight, 'FD');
        
        // Textos da linha
        let currentPagamentoX = pagamentoX;
        [row.forma, row.count.toString(), row.total].forEach((cell, i) => {
          doc.text(cell, currentPagamentoX + 3, currentPagamentoY + lineHeight - 3);
          currentPagamentoX += pagamentoColWidths[i];
        });
        
        currentPagamentoY += lineHeight;
      });
      
      // Atualizar startY para o maior valor entre as duas tabelas
      startY = Math.max(startY, currentPagamentoY);
      
      // Adicionar rodapé
      startY += 10;
      doc.setFontSize(8);
      doc.text(`Relatório gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, margin, startY);
      
      // Salvar PDF
      doc.save(`Relatorio_Financeiro_${nomeCidade}_${dataFormatada}.pdf`);

    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      alert(`Erro ao gerar PDF: ${error.message}`);
    }
  };

  // Função para salvar edição de registro
  const salvarEdicaoRegistro = async (registro) => {
    try {
      // Verificar se todos os campos obrigatórios estão preenchidos
    if (!registro.cliente || !registro.valor || !registro.tipo || !registro.situacao) {
      alert('Por favor, preencha todos os campos obrigatórios: Cliente, Valor, Tipo e Situação.');
      return;
    }
    
    // Obter os pagamentos divididos para este registro
    const pagamentosRegistro = pagamentosDivididos[registro.id] || [];
    
    // Verificar se há pelo menos uma forma de pagamento
    if (pagamentosRegistro.length === 0 || !pagamentosRegistro[0].formaPagamento) {
      alert('Por favor, adicione pelo menos uma forma de pagamento.');
      return;
    }
    
    // Verificar se o total de pagamentos bate com o valor do registro
    const totalPagamentos = calcularTotalPagamentosDivididos(registro.id);
    const valorRegistro = parseFloat(registro.valor.replace(',', '.'));
    
    if (Math.abs(totalPagamentos - valorRegistro) > 0.01) {
      alert(`O total de pagamentos (R$ ${totalPagamentos.toFixed(2)}) não corresponde ao valor do registro (R$ ${valorRegistro.toFixed(2)}).`);
      return;
    }
    
    // Obter o nome da cidade
    const cidadeSelecionadaObj = cities.find(city => city.id === cidadeSelecionada);
    const nomeCidade = cidadeSelecionadaObj ? cidadeSelecionadaObj.name : 'Desconhecida';

    // Preparar as formas de pagamento
    const formasPagamento = pagamentosRegistro.map(p => ({
      formaPagamento: p.formaPagamento,
      valor: p.valor
    }));
    
    // Criar objeto para atualizar no Firestore
    const registroAtualizado = {
      cliente: registro.cliente,
      valor: registro.valor,
      tipo: registro.tipo,
      formaPagamento: pagamentosRegistro[0].formaPagamento, // Manter compatibilidade com registros antigos
      formasPagamento: formasPagamento, // Novo campo para pagamentos divididos
      situacao: registro.situacao,
      // O campo status foi removido, pois agora usamos apenas o campo tipo
      observacoes: registro.observacoes || '',
      cidade: nomeCidade, // Usar o nome da cidade em vez do ID
      cidadeId: cidadeSelecionada, // Manter o ID da cidade para referência
      data: registro.data,
      dataId: registro.dataId,
      agendamentoId: registro.agendamentoId || null,
      timestamp: new Date().toISOString()
    };
    
    // Atualizar no Firestore
    const registroRef = doc(db, 'registros_financeiros', registro.id);
    await updateDoc(registroRef, registroAtualizado);
    
    // Atualizar o estado do registro para sair do modo de edição
    setRegistrosFinanceiros(prev => 
      prev.map(r => 
        r.id === registro.id 
          ? { ...registroAtualizado, id: registro.id, editando: false } 
          : r
      )
    );

    alert('Registro atualizado com sucesso!');
  } catch (error) {
    console.error('Erro ao atualizar registro:', error);
    alert(`Erro ao atualizar registro: ${error.message}`);
  }
};

// Função para adicionar um novo registro em branco
const adicionarNovoRegistro = (agendamentoId, cliente, valor, id) => {
  try {
    const novoId = id || `novo-${Date.now()}`;
    const novoRegistro = {
      id: novoId,
      cliente: cliente || '',
      valor: valor || '',
      tipo: '',
      formaPagamento: '',
      situacao: '',
      observacoes: '',
      novo: true,
      editando: true,
      agendamentoId: agendamentoId,
      cidadeId: cidadeSelecionada,
      dataId: dataSelecionada
    };

    // Adicionar o novo registro à lista de registros
    setRegistrosFinanceiros(prev => [...prev, novoRegistro]);

    // Inicializar pagamentos divididos para este registro
    setPagamentosDivididos(prev => ({
      ...prev,
      [novoId]: [{ formaPagamento: '', valor: valor || '' }]
    }));

  } catch (error) {
    console.error('Erro ao adicionar novo registro:', error);
    alert(`Erro ao adicionar novo registro: ${error.message}`);
  }
};

// Função para salvar novo registro no Firestore
const salvarNovoRegistro = async (registro) => {
  try {
    // Verificar se todos os campos obrigatórios estão preenchidos
    if (!registro.cliente || !registro.valor || !registro.tipo || !registro.situacao) {
      alert('Por favor, preencha todos os campos obrigatórios: Cliente, Valor, Tipo e Situação.');
      return;
    }
    
    // Obter os pagamentos divididos para este registro
    const pagamentos = pagamentosDivididos[registro.id] || [];
    
    // Verificar se há pelo menos uma forma de pagamento
    if (pagamentos.length === 0 || !pagamentos[0].formaPagamento) {
      alert('Por favor, adicione pelo menos uma forma de pagamento.');
      return;
    }
    
    // Verificar se o total de pagamentos bate com o valor do registro
    const totalPagamentos = calcularTotalPagamentosDivididos(registro.id);
    const valorRegistro = parseFloat(registro.valor.replace(',', '.'));
    
    if (Math.abs(totalPagamentos - valorRegistro) > 0.01) {
      alert(`O total de pagamentos (R$ ${totalPagamentos.toFixed(2)}) não corresponde ao valor do registro (R$ ${valorRegistro.toFixed(2)}).`);
      return;
    }
    
    // Obter o nome da cidade
    const cidadeSelecionadaObj = cities.find(city => city.id === cidadeSelecionada);
    const nomeCidade = cidadeSelecionadaObj ? cidadeSelecionadaObj.name : 'Desconhecida';

    // Preparar as formas de pagamento
    const formasPagamento = pagamentos.map(p => ({
      formaPagamento: p.formaPagamento,
      valor: p.valor
    }));
    
    // Criar objeto para salvar no Firestore
    const novoRegistro = {
      cliente: registro.cliente,
      valor: registro.valor,
      tipo: registro.tipo,
      formaPagamento: pagamentos[0].formaPagamento, // Manter compatibilidade com registros antigos
      formasPagamento: formasPagamento, // Novo campo para pagamentos divididos
      situacao: registro.situacao,
      // O campo status foi removido, pois agora usamos apenas o campo tipo
      observacoes: registro.observacoes || '',
      cidade: nomeCidade, // Usar o nome da cidade em vez do ID
      cidadeId: cidadeSelecionada, // Manter o ID da cidade para referência
      data: dataSelecionada,
      dataId: dataSelecionada, // ID da data selecionada
      agendamentoId: registro.agendamentoId || null,
      timestamp: new Date().toISOString()
    };
    
    // Salvar no Firestore
    const registrosRef = collection(db, 'registros_financeiros');
    await addDoc(registrosRef, novoRegistro);
    
    // Remover o registro temporário da lista
    setRegistrosFinanceiros(prev => prev.filter(r => r.id !== registro.id));
    
    // Buscar dados atualizados
    buscarDados();

    alert('Registro salvo com sucesso!');
  } catch (error) {
    console.error('Erro ao salvar novo registro:', error);
    alert(`Erro ao salvar registro: ${error.message}`);
  }
};

  // Função para iniciar a edição de um registro
  const iniciarEdicaoRegistro = (id) => {
    // Atualizar o estado do registro para modo de edição
    setRegistrosFinanceiros(prev => 
      prev.map(registro => 
        registro.id === id 
          ? { ...registro, editando: true } 
          : registro
      )
    );
    
    // Inicializar pagamentos divididos se não existirem
    const registro = registrosFinanceiros.find(r => r.id === id);
    if (registro) {

      // Inicializar pagamentos divididos
      if (!pagamentosDivididos[id]) {
        if (registro.formasPagamento && Array.isArray(registro.formasPagamento)) {
          // Usar formas de pagamento existentes
          setPagamentosDivididos(prev => ({
            ...prev,
            [id]: registro.formasPagamento
          }));
        } else {
          // Criar forma de pagamento padrão
          setPagamentosDivididos(prev => ({
            ...prev,
            [id]: [{ formaPagamento: registro.formaPagamento || '', valor: registro.valor || '' }]
          }));
        }
      }
    }

  };
  
  // Função para cancelar a edição de um registro
  const cancelarEdicaoRegistro = (id) => {
    // Atualizar o estado do registro para sair do modo de edição
    setRegistrosFinanceiros(prev => 
      prev.map(registro => 
        registro.id === id 
          ? { ...registro, editando: false } 
          : registro
      )
    );

  };
  
  // Função para excluir um registro financeiro
  const excluirRegistro = async (id) => {
    try {
      // Confirmar com o usuário antes de excluir
      if (!window.confirm('Tem certeza que deseja excluir este registro? Esta ação não pode ser desfeita.')) {
        return; // Usuário cancelou a exclusão
      }
      
      // Excluir o registro do Firestore
      const registroRef = doc(db, 'registros_financeiros', id);
      await deleteDoc(registroRef);
      
      // Remover o registro do estado local
      setRegistrosFinanceiros(prev => prev.filter(registro => registro.id !== id));
      
      // Limpar os pagamentos divididos associados a este registro
      setPagamentosDivididos(prev => {
        const newState = { ...prev };
        delete newState[id];
        return newState;
      });

      alert('Registro excluído com sucesso!');
    } catch (error) {
      console.error('Erro ao excluir registro:', error);
      alert(`Erro ao excluir registro: ${error.message}`);
    }
  };
  
  const handlePagamentoDividido = (registroId, index, campo, valor) => {
    setPagamentosDivididos(prev => {
      const pagamentosRegistro = [...(prev[registroId] || [])];
      
      if (!pagamentosRegistro[index]) {
        pagamentosRegistro[index] = { formaPagamento: '', valor: '' };
      }
      
      pagamentosRegistro[index] = {
        ...pagamentosRegistro[index],
        [campo]: valor
      };
      
      return {
        ...prev,
        [registroId]: pagamentosRegistro
      };
    });
  };

  const adicionarPagamento = (id) => {

    // Verificar se o ID existe no objeto pagamentosDivididos
    if (!pagamentosDivididos[id]) {

      setPagamentosDivididos(prev => ({
        ...prev,
        [id]: [{ formaPagamento: '', valor: '' }]
      }));
    } else {

      setPagamentosDivididos(prev => {
        const novosPagamentos = {
          ...prev,
          [id]: [...prev[id], { formaPagamento: '', valor: '' }]
        };

        return novosPagamentos;
      });
    }
  };

  const removerPagamento = (id, index) => {

    if (pagamentosDivididos[id] && pagamentosDivididos[id].length > 1) {
      setPagamentosDivididos(prev => ({
        ...prev,
        [id]: prev[id].filter((_, i) => i !== index)
      }));
    }
  };

  const calcularTotalPagamentosDivididos = (registroId) => {
    const pagamentos = pagamentosDivididos[registroId] || [];
    return pagamentos.reduce((total, pagamento) => {
      const valor = pagamento.valor ? parseFloat(pagamento.valor.replace(',', '.')) : 0;
      return total + (isNaN(valor) ? 0 : valor);
    }, 0);
  };

  const atualizarPagamento = (id, index, campo, valor) => {

    if (!pagamentosDivididos[id]) {

      setPagamentosDivididos(prev => ({
        ...prev,
        [id]: [{ formaPagamento: '', valor: '' }]
      }));
      return;
    }
    
    try {
      const novosPagamentos = [...pagamentosDivididos[id]];
      
      if (!novosPagamentos[index]) {

        novosPagamentos[index] = { formaPagamento: '', valor: '' };
      }
      
      // Se o campo for valor, formatar como moeda
      if (campo === 'valor') {
        // Permitir apenas números, vírgula e ponto
        const valorLimpo = valor.replace(/[^\d,.]/g, '');
        // Substituir pontos por vírgulas (para garantir que só tenha uma vírgula)
        const valorFormatado = valorLimpo.replace(/\./g, ',').replace(/,/g, ',');
        
        novosPagamentos[index] = {
          ...novosPagamentos[index],
          [campo]: valorFormatado
        };
      } else {
        novosPagamentos[index] = {
          ...novosPagamentos[index],
          [campo]: valor
        };
      }

      setPagamentosDivididos(prev => ({
        ...prev,
        [id]: novosPagamentos
      }));
    } catch (error) {
      console.error('Erro ao atualizar pagamento:', error);
    }
  };

  // Função para formatar valor como moeda (R$ 0,00)
  const formatarValorMoeda = (valor) => {
    if (!valor) return '';
    
    // Converter para número
    let numero = 0;
    if (typeof valor === 'string') {
      // Remover caracteres não numéricos, exceto vírgula ou ponto
      const valorLimpo = valor.replace(/[^\d,.]/g, '');
      // Substituir vírgula por ponto para cálculos
      numero = parseFloat(valorLimpo.replace(',', '.'));
    } else {
      numero = parseFloat(valor);
    }
    
    if (isNaN(numero)) return '0,00';
    
    // Formatar com 2 casas decimais e vírgula
    return numero.toFixed(2).replace('.', ',');
  };

  // Verificar se tem permissão para ver dados financeiros
  if (!can(PERMISSIONS.FINANCIAL_VIEW)) {
    return (
      <Container>
        <Title>Acesso Negado</Title>
        <p>Você não tem permissão para visualizar dados financeiros.</p>
      </Container>
    );
  }

  return (
    <Container>
      <Title>Relatório Financeiro</Title>
      
      <FilterContainer>
        <SelectWrapper>
          <Label>Cidade:</Label>
          <Select
            value={cidadeSelecionada}
            onChange={(e) => handleChangeCidade(e)}
          >
            <option value="">Selecione uma cidade</option>
            {cities.map((cidade) => (
              <option key={cidade.id} value={cidade.id}>
                {cidade.name}
              </option>
            ))}
          </Select>
        </SelectWrapper>
        
        <FilterGroup>
          <Label>Data:</Label>
          <Select value={dataSelecionada} onChange={handleChangeData}>
            <option value="">Selecione uma data</option>
            {datasFiltradasPorCidade
              .filter(date => date && date.data && typeof date.data === 'string')
              .sort((a, b) => {
                try {
                  const partsA = a.data.split('/');
                  const partsB = b.data.split('/');
                  
                  if (partsA.length !== 3 || partsB.length !== 3) {
                    return 0;
                  }
                  const diaA = parseInt(partsA[0]);
                  const mesA = parseInt(partsA[1]);
                  const anoA = parseInt(partsA[2]);
                  const diaB = parseInt(partsB[0]);
                  const mesB = parseInt(partsB[1]);
                  const anoB = parseInt(partsB[2]);
                  
                  if (anoA !== anoB) {
                    return anoA - anoB;
                  } else if (mesA !== mesB) {
                    return mesA - mesB;
                  } else {
                    return diaA - diaB;
                  }
                } catch (error) {
                  console.error('Erro ao ordenar datas:', error);
                  return 0;
                }
              })
              .map((data) => (
                <option key={data.id} value={data.id}>
                  {data.data}
                </option>
              ))}
          </Select>
        </FilterGroup>
        
      </FilterContainer>
      
      {isLoading && <p>Carregando dados...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      
      {!isLoading && !error && cidadeSelecionada && dataSelecionada && (
        <>
          <div style={{ marginBottom: '20px' }}>
            <h2>Registros Financeiros - {diaSemana}</h2>
            
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Cliente</th>
                    <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>R$</th>
                    <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Tipo</th>
                    <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Forma de Pagamento</th>
                    <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Situação</th>
                    <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Observações</th>
                    <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {registrosFinanceiros.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>
                        Nenhum registro encontrado para esta data e cidade.
                      </td>
                    </tr>
                  ) : (
                    // Ordenar registros por horário de agendamento
                    [...registrosFinanceiros]
                      .sort((a, b) => {
                        // Buscar agendamentos correspondentes
                        const agendamentoA = agendamentos.find(ag => ag.id === a.agendamentoId);
                        const agendamentoB = agendamentos.find(ag => ag.id === b.agendamentoId);
                        
                        // Função para converter horário para minutos
                        const getMinutos = (horario) => {
                          if (!horario) return 0;
                          const [horas, minutos] = horario.split(':').map(Number);
                          return (horas * 60) + minutos;
                        };
                        
                        // Comparar horários
                        const minutosA = agendamentoA?.horario ? getMinutos(agendamentoA.horario) : 0;
                        const minutosB = agendamentoB?.horario ? getMinutos(agendamentoB.horario) : 0;
                        
                        return minutosA - minutosB;
                      })
                      .map((registro) => (
                        <tr key={registro.id}>
                          <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                            {registro.cliente}
                          </td>
                          <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                            {registro.editando || registro.novo ? (
                              <input
                                type="text"
                                value={registro.valor || ''}
                                onChange={(e) => handleChangeRegistro(registro.id, 'valor', e.target.value)}
                                style={{ width: '100%' }}
                              />
                            ) : (
                              formatarValorMoeda(registro.valor)
                            )}
                          </td>
                          <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                            {registro.editando || registro.novo ? (
                              <select
                                value={registro.tipo || ''}
                                onChange={(e) => handleChangeRegistro(registro.id, 'tipo', e.target.value)}
                                style={{ width: '100%' }}
                              >
                                <option value="">Selecione</option>
                                <option value="Particular">Particular</option>
                                <option value="Convênio">Convênio</option>
                                <option value="Campanha">Campanha</option>
                                <option value="Exames">Exames</option>
                                <option value="Revisão">Revisão</option>
                              </select>
                            ) : (
                              registro.tipo
                            )}
                          </td>
                          <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                            {registro.editando || registro.novo ? (
                              <div>
                                {(pagamentosDivididos[registro.id] || []).map((pagamento, idx) => (
                                  <div key={idx} style={{ marginBottom: '8px', display: 'flex', alignItems: 'center' }}>
                                    <select
                                      value={pagamento.formaPagamento || ''}
                                      onChange={(e) => atualizarPagamento(registro.id, idx, 'formaPagamento', e.target.value)}
                                      style={{ marginRight: '5px', flex: '1', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                                    >
                                      <option value="">Selecione</option>
                                      <option value="Dinheiro">Dinheiro</option>
                                      <option value="Cartão">Cartão</option>
                                      <option value="PIX">PIX</option>
                                    </select>
                                    <input
                                      type="text"
                                      placeholder="Valor"
                                      value={pagamento.valor || ''}
                                      onChange={(e) => atualizarPagamento(registro.id, idx, 'valor', e.target.value)}
                                      style={{ width: '80px', marginRight: '5px', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                                    />
                                    <button 
                                      onClick={() => removerPagamento(registro.id, idx)}
                                      disabled={pagamentosDivididos[registro.id].length <= 1}
                                      style={{ 
                                        background: pagamentosDivididos[registro.id].length <= 1 ? '#ccc' : '#ff4d4d', 
                                        border: 'none', 
                                        color: 'white', 
                                        cursor: pagamentosDivididos[registro.id].length <= 1 ? 'not-allowed' : 'pointer',
                                        borderRadius: '4px',
                                        padding: '8px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                      }}
                                    >
                                      <FaTrash />
                                    </button>
                                  </div>
                                ))}
                                <div style={{ marginTop: '5px' }}>
                                  <button 
                                    onClick={() => adicionarPagamento(registro.id)}
                                    style={{ 
                                      backgroundColor: '#000033', 
                                      color: 'white',
                                      border: 'none', 
                                      borderRadius: '4px',
                                      padding: '8px 12px',
                                      fontSize: '12px',
                                      cursor: 'pointer',
                                      display: 'flex',
                                      alignItems: 'center'
                                    }}
                                  >
                                    <FaPlus style={{ marginRight: '5px' }} /> Adicionar forma de pagamento
                                  </button>
                                </div>
                                <div style={{ 
                                  marginTop: '8px', 
                                  fontSize: '14px', 
                                  color: Math.abs(calcularTotalPagamentosDivididos(registro.id) - parseFloat(registro.valor?.replace(',', '.') || 0)) < 0.01 ? 'green' : 'red',
                                  fontWeight: 'bold'
                                }}>
                                  Total: R$ {formatarValorMoeda(calcularTotalPagamentosDivididos(registro.id))} / 
                                  R$ {formatarValorMoeda(registro.valor || '0,00')}
                                  {Math.abs(calcularTotalPagamentosDivididos(registro.id) - parseFloat(registro.valor?.replace(',', '.') || 0)) < 0.01 
                                    ? ' ✓' 
                                    : ' ✗'}
                                </div>
                              </div>
                            ) : (
                              <div>
                                {registro.formasPagamento && Array.isArray(registro.formasPagamento) ? (
                                  registro.formasPagamento.map((p, i) => (
                                    <div key={i} style={{ marginBottom: '4px' }}>
                                      <strong>{p.formaPagamento}:</strong> R$ {formatarValorMoeda(p.valor)}
                                    </div>
                                  ))
                                ) : (
                                  registro.formaPagamento
                                )}
                              </div>
                            )}
                          </td>
                          <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                            {registro.editando || registro.novo ? (
                              <select
                                value={registro.situacao || ''}
                                onChange={(e) => handleChangeRegistro(registro.id, 'situacao', e.target.value)}
                                style={{ width: '100%' }}
                              >
                                <option value="">Selecione</option>
                                <option value="Caso Clínico">Caso Clínico</option>
                                <option value="Efetivação">Efetivação</option>
                                <option value="Perda">Perda</option>
                              </select>
                            ) : (
                              registro.situacao
                            )}
                          </td>

                          <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                            {registro.editando || registro.novo ? (
                              <input
                                type="text"
                                value={registro.observacoes || ''}
                                onChange={(e) => handleChangeRegistro(registro.id, 'observacoes', e.target.value)}
                                style={{ width: '100%' }}
                              />
                            ) : (
                              registro.observacoes
                            )}
                          </td>
                          <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                            {registro.novo ? (
                              <Button 
                                onClick={() => salvarNovoRegistro(registro)}
                                style={{ 
                                  backgroundColor: '#000033', 
                                  marginBottom: '2px',
                                  width: '100px',
                                  textAlign: 'center'
                                }}
                              >
                                Salvar
                              </Button>
                            ) : (
                              <>
                                {registro.editando ? (
                                  <>
                                    <Button 
                                      onClick={() => salvarEdicaoRegistro(registro)}
                                      style={{ 
                                        backgroundColor: '#000033', 
                                        marginBottom: '2px',
                                        width: '100px',
                                        textAlign: 'center'
                                      }}
                                    >
                                      Salvar
                                    </Button>
                                    <Button 
                                      onClick={() => cancelarEdicaoRegistro(registro.id)}
                                      style={{ 
                                        backgroundColor: '#ff4d4d', 
                                        marginBottom: '2px',
                                        width: '100px',
                                        textAlign: 'center'
                                      }}
                                    >
                                      Cancelar
                                    </Button>
                                  </>
                                ) : (
                                  <>
                                    <Button 
                                      onClick={() => iniciarEdicaoRegistro(registro.id)}
                                      style={{ 
                                        backgroundColor: '#000033', 
                                        marginBottom: '2px',
                                        width: '100px',
                                        textAlign: 'center'
                                      }}
                                    >
                                      Editar
                                    </Button>
                                    <Button 
                                      onClick={() => excluirRegistro(registro.id)}
                                      style={{ 
                                        backgroundColor: '#ff4d4d', 
                                        marginBottom: '2px',
                                        width: '100px',
                                        textAlign: 'center'
                                      }}
                                    >
                                      Excluir
                                    </Button>
                                  </>
                                )}
                              </>
                            )}
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
          <div style={{ marginTop: '30px' }}>
            <h2>Resumo</h2>
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '200px' }}>
                <h3>Por Tipo</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Tipo</th>
                      <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Quantidade</th>
                      <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Total (R$)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ border: '1px solid #ddd', padding: '8px' }}>Particular</td>
                      <td style={{ border: '1px solid #ddd', padding: '8px' }}>{estatisticas.countParticular}</td>
                      <td style={{ border: '1px solid #ddd', padding: '8px' }}>{formatarValorMoeda(estatisticas.totalParticular)}</td>
                    </tr>
                    <tr>
                      <td style={{ border: '1px solid #ddd', padding: '8px' }}>Convênio</td>
                      <td style={{ border: '1px solid #ddd', padding: '8px' }}>{estatisticas.countConvenio}</td>
                      <td style={{ border: '1px solid #ddd', padding: '8px' }}>{formatarValorMoeda(estatisticas.totalConvenio)}</td>
                    </tr>
                    <tr>
                      <td style={{ border: '1px solid #ddd', padding: '8px' }}>Campanha</td>
                      <td style={{ border: '1px solid #ddd', padding: '8px' }}>{estatisticas.countCampanha}</td>
                      <td style={{ border: '1px solid #ddd', padding: '8px' }}>{formatarValorMoeda(estatisticas.totalCampanha)}</td>
                    </tr>
                    <tr>
                      <td style={{ border: '1px solid #ddd', padding: '8px' }}>Exames</td>
                      <td style={{ border: '1px solid #ddd', padding: '8px' }}>{estatisticas.countExames}</td>
                      <td style={{ border: '1px solid #ddd', padding: '8px' }}>{formatarValorMoeda(estatisticas.totalExames)}</td>
                    </tr>
                    <tr>
                      <td style={{ border: '1px solid #ddd', padding: '8px' }}>Revisão</td>
                      <td style={{ border: '1px solid #ddd', padding: '8px' }}>{estatisticas.countRevisao}</td>
                      <td style={{ border: '1px solid #ddd', padding: '8px' }}>{formatarValorMoeda(estatisticas.totalRevisao)}</td>
                    </tr>
                    <tr style={{ fontWeight: 'bold' }}>
                      <td style={{ border: '1px solid #ddd', padding: '8px' }}>Total</td>
                      <td style={{ border: '1px solid #ddd', padding: '8px' }}>{estatisticas.countTotal}</td>
                      <td style={{ border: '1px solid #ddd', padding: '8px' }}>{formatarValorMoeda(estatisticas.totalGeral)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div style={{ flex: 1, minWidth: '200px' }}>
                <h3>Por Forma de Pagamento</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Forma de Pagamento</th>
                      <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Quantidade</th>
                      <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Total (R$)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ border: '1px solid #ddd', padding: '8px' }}>Dinheiro</td>
                      <td style={{ border: '1px solid #ddd', padding: '8px' }}>{estatisticas.countDinheiro}</td>
                      <td style={{ border: '1px solid #ddd', padding: '8px' }}>{formatarValorMoeda(estatisticas.totalDinheiro)}</td>
                    </tr>
                    <tr>
                      <td style={{ border: '1px solid #ddd', padding: '8px' }}>Cartão</td>
                      <td style={{ border: '1px solid #ddd', padding: '8px' }}>{estatisticas.countCartao}</td>
                      <td style={{ border: '1px solid #ddd', padding: '8px' }}>{formatarValorMoeda(estatisticas.totalCartao)}</td>
                    </tr>
                    <tr>
                      <td style={{ border: '1px solid #ddd', padding: '8px' }}>PIX</td>
                      <td style={{ border: '1px solid #ddd', padding: '8px' }}>{estatisticas.countPix}</td>
                      <td style={{ border: '1px solid #ddd', padding: '8px' }}>{formatarValorMoeda(estatisticas.totalPix)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          
          <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
            {can(PERMISSIONS.FINANCIAL_REPORTS) && (
              <Button onClick={gerarPDF}>Gerar PDF</Button>
            )}
          </div>
        </>
      )}
    </Container>
  );
};

export default Financeiro;

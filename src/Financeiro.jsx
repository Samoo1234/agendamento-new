import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
// Removendo importações problemáticas de date-fns
// import { format } from 'date-fns';
// import { ptBR } from 'date-fns/locale';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { collection, getDocs, doc, getDoc, addDoc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import { db } from './config/firebase';
import * as firebaseService from './services/firebaseService';
import useStore from './store/useStore';
import { FaTrash, FaPlus } from 'react-icons/fa';

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
        console.log('Carregando cidades e datas...');
        
        // Carregar cidades usando o useStore
        console.log('Tentando carregar cidades via useStore...');
        await fetchCities();
        
        // Log único das cidades (sem causar loop)
        console.log('Cidades carregadas via useStore:', cities);
        if (cities && cities.length > 0) {
          console.log(`Total de ${cities.length} cidades encontradas`);
        }
        
        // Carregar datas disponíveis diretamente do Firestore
        console.log('Tentando carregar datas disponíveis...');
        try {
          const datasDisponiveisRef = collection(db, 'datas_disponiveis');
          const querySnapshot = await getDocs(datasDisponiveisRef);
          
          const todasDatas = querySnapshot.docs.map(doc => {
            const data = doc.data();
            console.log(`Data documento ${doc.id}:`, data);
            console.log(`Cidade da data: ${data.cidade}, Tipo: ${typeof data.cidade}`);
            return {
              id: doc.id,
              ...data,
              // Garantir que temos a cidade como string para comparação
              cidade: data.cidade || ''
            };
          });
          
          console.log('Datas disponíveis carregadas diretamente do Firestore:', todasDatas);
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
      console.log(`Cidade com ID ${cidadeSelecionada} não encontrada na lista de cidades`);
      setDatasFiltradasPorCidade([]);
      return;
    }
    
    const nomeCidadeSelecionada = cidadeSelecionadaObj.name;
    console.log(`Filtrando datas para a cidade: ${nomeCidadeSelecionada} (ID: ${cidadeSelecionada})`);
    
    // Filtrar datas que correspondem à cidade selecionada pelo nome
    const datasFiltradas = datas.filter(data => {
      // A cidade pode estar armazenada como nome (string)
      const nomeCidade = data.cidade;
      
      console.log(`Comparando: cidade da data="${nomeCidade}" com cidade selecionada="${nomeCidadeSelecionada}"`);
      
      // Verificar se o nome da cidade da data corresponde ao nome da cidade selecionada
      const cidadeCorresponde = nomeCidade === nomeCidadeSelecionada;
      if (cidadeCorresponde) {
        console.log(`Data correspondente encontrada: ${data.data} para cidade ${nomeCidadeSelecionada}`);
      }
      return cidadeCorresponde;
    });
    
    console.log(`Total de ${datasFiltradas.length} datas encontradas para a cidade ${nomeCidadeSelecionada}`);
    setDatasFiltradasPorCidade(datasFiltradas);
  }, [cidadeSelecionada, datas, cities]);

  // Função para buscar dados financeiros e agendamentos
  const buscarDados = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log(`Buscando dados para cidade ${cidadeSelecionada} e data ${dataSelecionada}`);
      
      // Verificar se temos cidade e data selecionadas
      if (!cidadeSelecionada || !dataSelecionada) {
        console.log('Cidade ou data não selecionada, não buscando dados');
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
      console.log(`Buscando registros para cidade ID: ${cidadeSelecionada} e data ID: ${dataSelecionada}`);
      
      // Criar query para buscar registros financeiros
      const q = query(
        collection(db, 'registros_financeiros'),
        where('cidadeId', '==', cidadeSelecionada),
        where('dataId', '==', dataSelecionada)
      );
      
      const querySnapshot = await getDocs(q);
      console.log(`Encontrados ${querySnapshot.size} registros`);
      
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
      console.log('Buscando agendamentos para a mesma cidade e data');
      
      // Obter o nome da cidade a partir do ID
      const cidadeObj = cities.find(city => city.id === cidadeSelecionada);
      if (!cidadeObj) {
        console.error('Cidade selecionada não encontrada');
        setIsLoading(false);
        return;
      }
      
      // Obter a data formatada
      const dataFormatada = dataObj.data;
      console.log(`Buscando agendamentos para cidade: ${cidadeObj.name} e data: ${dataFormatada}`);
      
      // Criar query para buscar agendamentos usando o nome da cidade e a data formatada
      const qAgendamentos = query(
        collection(db, 'agendamentos'),
        where('cidade', '==', cidadeObj.name),
        where('data', '==', dataFormatada)
      );
      
      const agendamentosSnapshot = await getDocs(qAgendamentos);
      console.log(`Encontrados ${agendamentosSnapshot.size} agendamentos`);
      
      // Processar agendamentos
      const agendamentosData = [];
      const registrosDeAgendamentos = [...registros]; // Cópia dos registros existentes
      
      console.log('Processando agendamentos encontrados:', agendamentosSnapshot.size);
      
      agendamentosSnapshot.forEach((doc) => {
        const agendamento = {
          id: doc.id,
          ...doc.data()
        };
        console.log('Agendamento encontrado:', agendamento);
        agendamentosData.push(agendamento);
        
        // Verificar se já existe um registro financeiro para este agendamento
        const registroExistente = registros.find(r => r.agendamentoId === agendamento.id);
        console.log('Registro existente para agendamento?', registroExistente ? 'Sim' : 'Não');
        
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
          
          console.log('Nome do cliente encontrado:', nomeCliente);
          
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
          
          console.log('Criando novo registro financeiro a partir do agendamento:', novoRegistro);
          registrosDeAgendamentos.push(novoRegistro);
          
          // Inicializar pagamentos divididos para este registro
          pagamentosTemp[novoRegistroId] = [{ formaPagamento: '', valor: agendamento.valor || '' }];
        }
      });
      
      console.log('Total de registros após processamento:', registrosDeAgendamentos.length);
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
        
        console.log('Data formatada:', dataFormatada, 'String original:', dataObj.data);
        
        // Formatar o dia da semana
        const diaSemanaFormatado = dataFormatada.toLocaleString('pt-BR', { weekday: 'long' });
        console.log('Dia da semana formatado:', diaSemanaFormatado);
        
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
        console.log(`Cidade selecionada: ${cidadeSelecionada}, Data selecionada: ${dataSelecionada}`);
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
      console.log('Cidade selecionada:', valor);
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
      console.log('Data selecionada:', valor);
      setDataSelecionada(valor);
      
      if (valor) {
        // Encontrar a data selecionada para obter o dia da semana
        const dataObj = datas.find(d => d.id === valor);
        console.log('Objeto da data selecionada:', dataObj);
        
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
            
            console.log('Data formatada:', dataFormatada, 'String original:', dataObj.data);
            
            // Formatar o dia da semana
            const diaSemanaFormatado = dataFormatada.toLocaleString('pt-BR', { weekday: 'long' });
            console.log('Dia da semana formatado:', diaSemanaFormatado);
            
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
      console.log('Gerando PDF...');
      
      // Verificar se há registros para gerar o PDF
      if (!registrosFinanceiros || registrosFinanceiros.length === 0) {
        alert('Não há registros financeiros para gerar o PDF.');
        return;
      }
      
      // Criar novo documento PDF
      const doc = new jsPDF();
      
      // Adicionar título
      const cidadeSelecionadaObj = cities.find(city => city.id === cidadeSelecionada);
      const nomeCidade = cidadeSelecionadaObj ? cidadeSelecionadaObj.name : 'Desconhecida';
      
      const dataObj = datas.find(d => d.id === dataSelecionada);
      const dataFormatada = dataObj ? dataObj.data : 'Data desconhecida';
      
      doc.setFontSize(18);
      doc.text(`Relatório Financeiro - ${nomeCidade}`, 14, 20);
      doc.setFontSize(14);
      doc.text(`Data: ${dataFormatada} (${diaSemana})`, 14, 30);
      
      // Adicionar tabela de registros
      const tableColumn = ["Cliente", "R$", "Tipo", "Forma de Pagamento", "Situação", "Observações"];
      const tableRows = [];
      
      registrosFinanceiros.forEach(registro => {
        // Formatar as formas de pagamento para exibição no PDF
        let formasPagamentoTexto = '';
        
        if (registro.formasPagamento && Array.isArray(registro.formasPagamento)) {
          formasPagamentoTexto = registro.formasPagamento
            .map(p => `${p.formaPagamento}: R$ ${p.valor}`)
            .join('\n');
        } else {
          formasPagamentoTexto = registro.formaPagamento;
        }
        
        const registroData = [
          registro.cliente,
          registro.valor,
          registro.tipo,
          formasPagamentoTexto,
          registro.situacao,
          registro.observacoes
        ];
        tableRows.push(registroData);
      });
      
      // Usar autoTable importado diretamente
      autoTable(doc, {
        startY: 40,
        head: [tableColumn],
        body: tableRows,
        theme: 'striped',
        headStyles: { fillColor: [75, 75, 75] },
        styles: { overflow: 'linebreak' },
        columnStyles: {
          3: { cellWidth: 40 } // Aumentar a largura da coluna de formas de pagamento
        }
      });
      
      // Adicionar resumo
      let finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY : 40;
      
      doc.setFontSize(14);
      doc.text('Resumo', 14, finalY + 10);
      
      // Tabela de resumo por tipo
      const resumoColumns = ["Tipo", "Quantidade", "Total (R$)"];
      const resumoRows = [
        ["Particular", estatisticas.countParticular.toString(), formatarValorMoeda(estatisticas.totalParticular)],
        ["Convênio", estatisticas.countConvenio.toString(), formatarValorMoeda(estatisticas.totalConvenio)],
        ["Campanha", estatisticas.countCampanha.toString(), formatarValorMoeda(estatisticas.totalCampanha)],
        ["Total", estatisticas.countTotal.toString(), formatarValorMoeda(estatisticas.totalGeral)]
      ];
      
      autoTable(doc, {
        startY: finalY + 15,
        head: [resumoColumns],
        body: resumoRows,
        theme: 'striped',
        headStyles: { fillColor: [75, 75, 75] }
      });
      
      // Adicionar resumo por forma de pagamento
      finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY : finalY + 15;
      
      doc.setFontSize(14);
      doc.text('Resumo por Forma de Pagamento', 14, finalY + 10);
      
      // Tabela de resumo por forma de pagamento
      const resumoPagamentoColumns = ["Forma de Pagamento", "Quantidade", "Total (R$)"];
      const resumoPagamentoRows = [
        ["Dinheiro", estatisticas.countDinheiro.toString(), formatarValorMoeda(estatisticas.totalDinheiro)],
        ["Cartão", estatisticas.countCartao.toString(), formatarValorMoeda(estatisticas.totalCartao)],
        ["PIX/Pic pay", estatisticas.countPix.toString(), formatarValorMoeda(estatisticas.totalPix)]
      ];
      
      autoTable(doc, {
        startY: finalY + 15,
        head: [resumoPagamentoColumns],
        body: resumoPagamentoRows,
        theme: 'striped',
        headStyles: { fillColor: [75, 75, 75] }
      });
      
      // Salvar o PDF
      doc.save(`relatorio_financeiro_${nomeCidade}_${dataFormatada.replace(/\//g, '-')}.pdf`);
      
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      alert(`Erro ao gerar PDF: ${error.message}`);
    }
  };

  const salvarNovoRegistro = async (registro) => {
    try {
      console.log('Tentando salvar novo registro:', registro);
      
      // Verificar se todos os campos obrigatórios estão preenchidos
      if (!registro.cliente || !registro.valor || !registro.tipo || !registro.situacao) {
        console.error('Campos obrigatórios não preenchidos');
        alert('Por favor, preencha todos os campos obrigatórios (Cliente, R$, Tipo e Situação)');
        return;
      }
      
      // Verificar pagamentos divididos
      const pagamentos = pagamentosDivididos[registro.id] || [];
      if (pagamentos.length === 0 || !pagamentos.every(p => p.formaPagamento && p.valor)) {
        alert('Por favor, preencha todas as formas de pagamento corretamente');
        return;
      }
      
      // Verificar se o total dos pagamentos divididos é igual ao valor total
      const totalPagamentos = calcularTotalPagamentosDivididos(registro.id);
      const valorTotal = parseFloat(registro.valor.replace(',', '.'));
      
      if (Math.abs(totalPagamentos - valorTotal) > 0.01) { // Tolerância para erros de arredondamento
        alert(`O total das formas de pagamento (R$ ${totalPagamentos.toFixed(2)}) deve ser igual ao valor total (R$ ${valorTotal.toFixed(2)})`);
        return;
      }
      
      // Obter a data formatada corretamente
      const dataObj = datas.find(d => d.id === dataSelecionada);
      if (!dataObj || !dataObj.data) {
        throw new Error('Data selecionada não encontrada');
      }
      
      // Obter o nome da cidade a partir do ID
      const cidadeObj = cities.find(city => city.id === cidadeSelecionada);
      if (!cidadeObj) {
        throw new Error('Cidade selecionada não encontrada');
      }
      const nomeCidade = cidadeObj.name;
      
      // Formatar as formas de pagamento para salvar no Firestore
      const formasPagamento = pagamentos.map(p => ({
        formaPagamento: p.formaPagamento,
        valor: p.valor
      }));
      
      // Criar objeto com os dados do registro
      const novoRegistro = {
        agendamentoId: registro.agendamentoId,
        cliente: registro.cliente,
        valor: registro.valor,
        tipo: registro.tipo,
        formaPagamento: pagamentos[0].formaPagamento, // Manter compatibilidade com registros antigos
        formasPagamento: formasPagamento, // Novo campo para pagamentos divididos
        situacao: registro.situacao,
        observacoes: registro.observacoes || '',
        cidade: nomeCidade, // Usar o nome da cidade em vez do ID
        cidadeId: cidadeSelecionada, // Manter o ID da cidade para referência
        data: dataObj.data, // Usar a data formatada em vez do ID
        dataId: dataSelecionada, // Manter o ID da data para referência
        timestamp: new Date().toISOString()
      };
      
      console.log('Objeto de novo registro a ser salvo:', novoRegistro);
      console.log('Salvando na coleção registros_financeiros');
      
      // Salvar no Firestore
      const registrosRef = collection(db, 'registros_financeiros');
      console.log('Referência da coleção:', registrosRef);
      
      const docRef = await addDoc(registrosRef, novoRegistro);
      console.log('Registro adicionado com sucesso! ID:', docRef.id);
      
      alert('Registro financeiro salvo com sucesso!');
      
      // Atualizar a lista de registros
      buscarDados();
    } catch (error) {
      console.error('Erro ao salvar novo registro:', error);
      alert(`Erro ao salvar registro: ${error.message}`);
    }
  };

  const testarConexaoFirebase = async () => {
    try {
      console.log('Testando conexão com o Firebase...');
      
      // Tentar criar uma coleção de teste
      const testeRef = collection(db, 'teste_conexao');
      const docRef = await addDoc(testeRef, {
        teste: true,
        timestamp: new Date().toISOString()
      });
      
      console.log('Teste de conexão bem-sucedido! ID do documento:', docRef.id);
      
      // Verificar a estrutura dos agendamentos
      console.log('Verificando a estrutura dos agendamentos...');
      const agendamentosRef = collection(db, 'agendamentos');
      const agendamentosSnapshot = await getDocs(agendamentosRef);
      
      console.log(`Total de ${agendamentosSnapshot.docs.length} agendamentos encontrados`);
      
      if (agendamentosSnapshot.docs.length > 0) {
        // Mostrar a estrutura de alguns agendamentos
        const amostra = agendamentosSnapshot.docs.slice(0, 3);
        amostra.forEach((doc, index) => {
          const dados = doc.data();
          console.log(`Agendamento ${index + 1} (ID: ${doc.id}):`, dados);
          console.log(`  - cidade: ${dados.cidade} (tipo: ${typeof dados.cidade})`);
          console.log(`  - data: ${dados.data} (tipo: ${typeof dados.data})`);
        });
      }
      
      // Verificar a estrutura das datas disponíveis
      console.log('Verificando a estrutura das datas disponíveis...');
      const datasRef = collection(db, 'datas_disponiveis');
      const datasSnapshot = await getDocs(datasRef);
      
      console.log(`Total de ${datasSnapshot.docs.length} datas disponíveis encontradas`);
      
      if (datasSnapshot.docs.length > 0) {
        // Mostrar a estrutura de algumas datas
        const amostra = datasSnapshot.docs.slice(0, 3);
        amostra.forEach((doc, index) => {
          const dados = doc.data();
          console.log(`Data ${index + 1} (ID: ${doc.id}):`, dados);
          console.log(`  - cidade: ${dados.cidade} (tipo: ${typeof dados.cidade})`);
          console.log(`  - data: ${dados.data} (tipo: ${typeof dados.data})`);
        });
      }
      
      alert('Conexão com o Firebase está funcionando! Documento de teste criado com ID: ' + docRef.id);
      
      // Excluir o documento de teste
      await deleteDoc(doc(db, 'teste_conexao', docRef.id));
      console.log('Documento de teste excluído');
    } catch (error) {
      console.error('Erro ao testar conexão com o Firebase:', error);
      alert(`Erro ao testar conexão: ${error.message}`);
    }
  };

  const iniciarEdicaoRegistro = (id) => {
    const registroIndex = registrosFinanceiros.findIndex(registro => registro.id === id);
    if (registroIndex >= 0) {
      const registro = registrosFinanceiros[registroIndex];
      const novosRegistros = [...registrosFinanceiros];
      novosRegistros[registroIndex] = { ...novosRegistros[registroIndex], editando: true };
      setRegistrosFinanceiros(novosRegistros);
      
      // Inicializar pagamentos divididos se ainda não existirem
      if (!pagamentosDivididos[id]) {
        if (registro.formasPagamento && Array.isArray(registro.formasPagamento)) {
          setPagamentosDivididos(prev => ({
            ...prev,
            [id]: registro.formasPagamento
          }));
        } else {
          // Compatibilidade com registros antigos
          setPagamentosDivididos(prev => ({
            ...prev,
            [id]: [{
              formaPagamento: registro.formaPagamento || '',
              valor: registro.valor || ''
            }]
          }));
        }
      }
    }
  };

  const cancelarEdicaoRegistro = (id) => {
    const registroIndex = registrosFinanceiros.findIndex(registro => registro.id === id);
    if (registroIndex >= 0) {
      const novosRegistros = [...registrosFinanceiros];
      novosRegistros[registroIndex] = { ...novosRegistros[registroIndex], editando: false };
      setRegistrosFinanceiros(novosRegistros);
      
      // Limpar pagamentos divididos temporários
      if (pagamentosDivididos[id]) {
        const novosPagamentos = { ...pagamentosDivididos };
        delete novosPagamentos[id];
        setPagamentosDivididos(novosPagamentos);
      }
    }
  };

  const salvarEdicaoRegistro = async (registro) => {
    try {
      console.log('Salvando edição do registro:', registro);
      
      // Verificar campos obrigatórios
      if (!registro.cliente || !registro.valor || !registro.tipo || !registro.situacao) {
        console.error('Campos obrigatórios não preenchidos');
        alert('Por favor, preencha todos os campos obrigatórios (Cliente, R$, Tipo e Situação)');
        return;
      }
      
      // Verificar pagamentos divididos
      const pagamentos = pagamentosDivididos[registro.id] || [];
      if (pagamentos.length === 0 || !pagamentos.every(p => p.formaPagamento && p.valor)) {
        alert('Por favor, preencha todas as formas de pagamento corretamente');
        return;
      }
      
      // Verificar se o total dos pagamentos divididos é igual ao valor total
      const totalPagamentos = calcularTotalPagamentosDivididos(registro.id);
      const valorTotal = parseFloat(registro.valor.replace(',', '.'));
      
      if (Math.abs(totalPagamentos - valorTotal) > 0.01) { // Tolerância para erros de arredondamento
        alert(`O total das formas de pagamento (R$ ${totalPagamentos.toFixed(2)}) deve ser igual ao valor total (R$ ${valorTotal.toFixed(2)})`);
        return;
      }
      
      // Obter a data formatada corretamente
      const dataObj = datas.find(d => d.id === registro.dataId || d.id === dataSelecionada);
      if (!dataObj || !dataObj.data) {
        throw new Error('Data selecionada não encontrada');
      }
      
      // Obter o nome da cidade a partir do ID
      const cidadeId = registro.cidadeId || cidadeSelecionada;
      const cidadeObj = cities.find(city => city.id === cidadeId);
      if (!cidadeObj) {
        throw new Error('Cidade selecionada não encontrada');
      }
      const nomeCidade = cidadeObj.name;
      
      // Formatar as formas de pagamento para salvar no Firestore
      const formasPagamento = pagamentos.map(p => ({
        formaPagamento: p.formaPagamento,
        valor: p.valor
      }));
      
      // Criar objeto com os dados atualizados
      const registroAtualizado = {
        agendamentoId: registro.agendamentoId,
        cliente: registro.cliente,
        valor: registro.valor,
        tipo: registro.tipo,
        formaPagamento: pagamentos[0].formaPagamento, // Manter compatibilidade com registros antigos
        formasPagamento: formasPagamento, // Novo campo para pagamentos divididos
        situacao: registro.situacao,
        observacoes: registro.observacoes || '',
        cidade: nomeCidade, // Usar o nome da cidade em vez do ID
        cidadeId: cidadeId, // Manter o ID da cidade para referência
        data: dataObj.data, // Usar a data formatada em vez do ID
        dataId: registro.dataId || dataSelecionada, // Manter o ID da data para referência
        timestamp: new Date().toISOString()
      };
      
      // Atualizar no Firestore
      const registroRef = doc(db, 'registros_financeiros', registro.id);
      await updateDoc(registroRef, registroAtualizado);
      
      console.log('Registro atualizado com sucesso!');
      alert('Registro financeiro atualizado com sucesso!');
      
      // Atualizar a lista de registros
      buscarDados();
    } catch (error) {
      console.error('Erro ao atualizar registro:', error);
      alert(`Erro ao atualizar registro: ${error.message}`);
    }
  };

  const excluirRegistro = async (id) => {
    try {
      if (window.confirm('Tem certeza que deseja excluir este registro?')) {
        console.log('Excluindo registro:', id);
        
        // Verificar se é um registro novo (que ainda não foi salvo no Firestore)
        if (id.startsWith('novo_')) {
          // Apenas remover da lista local
          const novosRegistros = registrosFinanceiros.filter(registro => registro.id !== id);
          setRegistrosFinanceiros(novosRegistros);
          return;
        }
        
        // Excluir do Firestore
        const registroRef = doc(db, 'registros_financeiros', id);
        await deleteDoc(registroRef);
        
        console.log('Registro excluído com sucesso!');
        alert('Registro financeiro excluído com sucesso!');
        
        // Atualizar a lista de registros
        buscarDados();
      }
    } catch (error) {
      console.error('Erro ao excluir registro:', error);
      alert(`Erro ao excluir registro: ${error.message}`);
    }
  };

  const adicionarNovoRegistro = (agendamentoId, cliente, valor, id) => {
    try {
      console.log('Adicionando novo registro');
      
      // Verificar se temos cidade e data selecionadas
      if (!cidadeSelecionada || !dataSelecionada) {
        alert('Por favor, selecione uma cidade e uma data antes de adicionar um registro.');
        return;
      }
      
      // Gerar ID temporário para o novo registro
      const novoId = id || `novo_${Date.now()}`;
      
      // Criar novo registro vazio
      const novoRegistro = {
        id: novoId,
        agendamentoId: agendamentoId,
        cliente: cliente || '',
        valor: valor || '',
        tipo: '',
        formaPagamento: '',
        situacao: '',
        observacoes: '',
        novo: true,
        editando: true,
        cidadeId: cidadeSelecionada,
        dataId: dataSelecionada
      };
      
      // Adicionar à lista de registros
      setRegistrosFinanceiros(prev => [...prev, novoRegistro]);
      
      // Inicializar pagamentos divididos para este registro
      setPagamentosDivididos(prev => ({
        ...prev,
        [novoId]: [{ formaPagamento: '', valor: valor || '' }]
      }));
      
      console.log('Novo registro adicionado:', novoRegistro);
    } catch (error) {
      console.error('Erro ao adicionar novo registro:', error);
      alert(`Erro ao adicionar novo registro: ${error.message}`);
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
    console.log('Adicionando pagamento para registro:', id);
    console.log('Estado atual dos pagamentos divididos:', pagamentosDivididos);
    
    // Verificar se o ID existe no objeto pagamentosDivididos
    if (!pagamentosDivididos[id]) {
      console.log('Inicializando pagamentos para o registro:', id);
      setPagamentosDivididos(prev => ({
        ...prev,
        [id]: [{ formaPagamento: '', valor: '' }]
      }));
    } else {
      console.log('Adicionando novo pagamento ao registro existente:', id);
      setPagamentosDivididos(prev => {
        const novosPagamentos = {
          ...prev,
          [id]: [...prev[id], { formaPagamento: '', valor: '' }]
        };
        console.log('Novos pagamentos após adição:', novosPagamentos);
        return novosPagamentos;
      });
    }
  };

  const removerPagamento = (id, index) => {
    console.log('Removendo pagamento:', id, index);
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
    console.log('Atualizando pagamento:', id, index, campo, valor);
    console.log('Estado atual dos pagamentos divididos:', pagamentosDivididos);
    
    if (!pagamentosDivididos[id]) {
      console.log('Inicializando pagamentos para o registro:', id);
      setPagamentosDivididos(prev => ({
        ...prev,
        [id]: [{ formaPagamento: '', valor: '' }]
      }));
      return;
    }
    
    try {
      const novosPagamentos = [...pagamentosDivididos[id]];
      
      if (!novosPagamentos[index]) {
        console.log('Pagamento não encontrado no índice:', index);
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
      
      console.log('Novos pagamentos após atualização:', novosPagamentos);
      
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
                                      <option value="PIX/Pic pay">PIX/Pic pay</option>
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
                      <td style={{ border: '1px solid #ddd', padding: '8px' }}>PIX/Pic pay</td>
                      <td style={{ border: '1px solid #ddd', padding: '8px' }}>{estatisticas.countPix}</td>
                      <td style={{ border: '1px solid #ddd', padding: '8px' }}>{formatarValorMoeda(estatisticas.totalPix)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          
          <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
            <Button onClick={gerarPDF}>Gerar PDF</Button>
          </div>
        </>
      )}
    </Container>
  );
};

export default Financeiro;

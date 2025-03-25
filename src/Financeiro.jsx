import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { collection, getDocs, doc, getDoc, addDoc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import { db } from './config/firebase';
import * as firebaseService from './services/firebaseService';
import useStore from './store/useStore';

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
    countCasosClinicos: 0,
    countEfetivacoes: 0,
    countPerdas: 0
  });
  const [mapaCidadeDatas, setMapaCidadeDatas] = useState(new Map());

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
    if (!cidadeSelecionada || !dataSelecionada) {
      console.log('Cidade ou data não selecionada');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log(`Buscando dados para cidade ${cidadeSelecionada} e data ${dataSelecionada}`);
      
      // Buscar a data selecionada para obter o formato correto (DD/MM/YYYY)
      const dataObj = datas.find(d => d.id === dataSelecionada);
      if (!dataObj || !dataObj.data) {
        throw new Error('Data selecionada não encontrada');
      }
      
      const dataFormatada = dataObj.data; // Formato DD/MM/YYYY
      console.log('Data formatada:', dataFormatada);
      
      // 1. Buscar registros financeiros existentes
      console.log('Buscando registros financeiros existentes...');
      
      // Obter o nome da cidade a partir do ID
      const cidadeObj = cities.find(city => city.id === cidadeSelecionada);
      if (!cidadeObj) {
        throw new Error('Cidade selecionada não encontrada');
      }
      const nomeCidade = cidadeObj.name;
      
      console.log(`Nome da cidade: ${nomeCidade}, Data formatada: ${dataFormatada}`);
      
      const registrosQuery = query(
        collection(db, 'registros_financeiros'),
        where('cidade', '==', nomeCidade),
        where('data', '==', dataFormatada)
      );
      
      console.log('Query de registros financeiros:', {
        cidade: nomeCidade,
        data: dataFormatada
      });
      
      const registrosSnapshot = await getDocs(registrosQuery);
      console.log(`Encontrados ${registrosSnapshot.docs.length} registros financeiros`);
      
      const registrosExistentes = registrosSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        editando: false // Adicionar flag para controle de edição
      }));
      
      console.log('Registros financeiros encontrados:', registrosExistentes);
      
      // 2. Buscar agendamentos para esta data e cidade
      console.log('Buscando agendamentos...');
      
      // Obter o nome da cidade a partir do ID
      const cidadeObj2 = cities.find(city => city.id === cidadeSelecionada);
      if (!cidadeObj2) {
        throw new Error('Cidade selecionada não encontrada');
      }
      const nomeCidade2 = cidadeObj2.name;
      
      console.log(`Nome da cidade: ${nomeCidade2}, Data formatada: ${dataFormatada}`);
      
      const agendamentosQuery = query(
        collection(db, 'agendamentos'),
        where('cidade', '==', nomeCidade2),
        where('data', '==', dataFormatada)
      );
      
      console.log('Query de agendamentos:', {
        cidade: nomeCidade2,
        data: dataFormatada
      });
      
      const agendamentosSnapshot = await getDocs(agendamentosQuery);
      console.log(`Encontrados ${agendamentosSnapshot.docs.length} agendamentos`);
      
      // Verificar a estrutura dos primeiros agendamentos (se houver)
      if (agendamentosSnapshot.docs.length > 0) {
        console.log('Estrutura do primeiro agendamento:', agendamentosSnapshot.docs[0].data());
      }
      
      // Verificar todos os agendamentos na coleção para entender a estrutura dos dados
      console.log('Verificando todos os agendamentos na coleção...');
      const todosAgendamentosQuery = query(collection(db, 'agendamentos'));
      const todosAgendamentosSnapshot = await getDocs(todosAgendamentosQuery);
      console.log(`Total de ${todosAgendamentosSnapshot.docs.length} agendamentos na coleção`);
      
      if (todosAgendamentosSnapshot.docs.length > 0) {
        const amostraAgendamentos = todosAgendamentosSnapshot.docs.slice(0, 3);
        console.log('Amostra de agendamentos:');
        amostraAgendamentos.forEach((doc, index) => {
          const dados = doc.data();
          console.log(`Agendamento ${index + 1}:`, {
            id: doc.id,
            cidade: dados.cidade,
            data: dados.data,
            // outros campos relevantes
          });
        });
      }
      
      const todosAgendamentos = agendamentosSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      console.log('Agendamentos encontrados:', todosAgendamentos.length);
      
      // 3. Criar registros financeiros vazios para agendamentos que não têm registro
      const agendamentosIds = new Set(registrosExistentes.map(r => r.agendamentoId));
      const novosRegistros = [...registrosExistentes];
      
      for (const agendamento of todosAgendamentos) {
        if (!agendamentosIds.has(agendamento.id)) {
          // Buscar o nome do paciente
          let nomePaciente = '';
          
          if (agendamento.paciente && agendamento.paciente.nome) {
            nomePaciente = agendamento.paciente.nome;
          } else if (agendamento.nomePaciente) {
            nomePaciente = agendamento.nomePaciente;
          } else if (agendamento.nome) {
            nomePaciente = agendamento.nome;
          }
          
          console.log(`Criando registro vazio para agendamento ${agendamento.id} - Paciente: ${nomePaciente}`);
          
          novosRegistros.push({
            id: `novo_${agendamento.id}`,
            agendamentoId: agendamento.id,
            cliente: nomePaciente,
            valor: '',
            tipo: '',
            formaPagamento: '',
            situacao: '',
            observacoes: '',
            cidade: cidadeSelecionada,
            data: dataSelecionada,
            novo: true,
            editando: true
          });
        }
      }
      
      setRegistrosFinanceiros(novosRegistros);
      setAgendamentos(todosAgendamentos);
      
      // 4. Calcular estatísticas
      calcularEstatisticas(novosRegistros);
      
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
      setError(`Erro ao buscar dados: ${error.message}`);
    } finally {
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
      countTotal: 0
    };
    
    for (const registro of registros) {
      if (!registro.valor || !registro.tipo) continue;
      
      const valor = parseFloat(registro.valor.replace(',', '.'));
      if (isNaN(valor)) continue;
      
      stats.totalGeral += valor;
      stats.countTotal++;
      
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
        countCasosClinicos: 0,
        countEfetivacoes: 0,
        countPerdas: 0
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
            const diaSemanaFormatado = format(dataFormatada, 'EEEE', { locale: ptBR });
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
        const registroData = [
          registro.cliente,
          registro.valor,
          registro.tipo,
          registro.formaPagamento,
          registro.situacao,
          registro.observacoes
        ];
        tableRows.push(registroData);
      });
      
      doc.autoTable({
        startY: 40,
        head: [tableColumn],
        body: tableRows,
        theme: 'striped',
        headStyles: { fillColor: [75, 75, 75] }
      });
      
      // Adicionar resumo
      const finalY = doc.lastAutoTable.finalY || 40;
      
      doc.setFontSize(14);
      doc.text('Resumo', 14, finalY + 10);
      
      // Tabela de resumo por tipo
      const resumoColumns = ["Tipo", "Quantidade", "Total (R$)"];
      const resumoRows = [
        ["Particular", estatisticas.countParticular.toString(), estatisticas.totalParticular.toFixed(2)],
        ["Convênio", estatisticas.countConvenio.toString(), estatisticas.totalConvenio.toFixed(2)],
        ["Campanha", estatisticas.countCampanha.toString(), estatisticas.totalCampanha.toFixed(2)],
        ["Total", estatisticas.countTotal.toString(), estatisticas.totalGeral.toFixed(2)]
      ];
      
      doc.autoTable({
        startY: finalY + 15,
        head: [resumoColumns],
        body: resumoRows,
        theme: 'striped',
        headStyles: { fillColor: [75, 75, 75] }
      });
      
      // Salvar o PDF
      doc.save(`Financeiro_${nomeCidade}_${dataFormatada.replace(/\//g, '-')}.pdf`);
      
      console.log('PDF gerado com sucesso!');
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      alert(`Erro ao gerar PDF: ${error.message}`);
    }
  };

  const handleChangeRegistro = (id, campo, valor) => {
    const registroIndex = registrosFinanceiros.findIndex(registro => registro.id === id);
    if (registroIndex >= 0) {
      const registro = registrosFinanceiros[registroIndex];
      const novoRegistro = { ...registro, [campo]: valor };
      const novosRegistros = [...registrosFinanceiros];
      novosRegistros[registroIndex] = novoRegistro;
      setRegistrosFinanceiros(novosRegistros);
    }
  };

  const salvarNovoRegistro = async (registro) => {
    try {
      console.log('Tentando salvar novo registro:', registro);
      
      // Verificar se todos os campos obrigatórios estão preenchidos
      if (!registro.cliente || !registro.valor || !registro.tipo || !registro.formaPagamento || !registro.situacao) {
        console.error('Campos obrigatórios não preenchidos');
        alert('Por favor, preencha todos os campos obrigatórios (Cliente, R$, Tipo, Forma de Pagamento e Situação)');
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
      
      // Criar objeto com os dados do registro
      const novoRegistro = {
        agendamentoId: registro.agendamentoId,
        cliente: registro.cliente,
        valor: registro.valor,
        tipo: registro.tipo,
        formaPagamento: registro.formaPagamento,
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
      const novosRegistros = [...registrosFinanceiros];
      novosRegistros[registroIndex] = { ...novosRegistros[registroIndex], editando: true };
      setRegistrosFinanceiros(novosRegistros);
    }
  };

  const cancelarEdicaoRegistro = (id) => {
    const registroIndex = registrosFinanceiros.findIndex(registro => registro.id === id);
    if (registroIndex >= 0) {
      const novosRegistros = [...registrosFinanceiros];
      novosRegistros[registroIndex] = { ...novosRegistros[registroIndex], editando: false };
      setRegistrosFinanceiros(novosRegistros);
    }
  };

  const salvarEdicaoRegistro = async (registro) => {
    try {
      console.log('Salvando edição do registro:', registro);
      
      // Verificar campos obrigatórios
      if (!registro.cliente || !registro.valor || !registro.tipo || !registro.formaPagamento || !registro.situacao) {
        console.error('Campos obrigatórios não preenchidos');
        alert('Por favor, preencha todos os campos obrigatórios (Cliente, R$, Tipo, Forma de Pagamento e Situação)');
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
      
      // Criar objeto com os dados atualizados
      const registroAtualizado = {
        agendamentoId: registro.agendamentoId,
        cliente: registro.cliente,
        valor: registro.valor,
        tipo: registro.tipo,
        formaPagamento: registro.formaPagamento,
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
        
        <Button onClick={testarConexaoFirebase}>Testar Conexão com o Firebase</Button>
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
                    registrosFinanceiros.map((registro) => (
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
                            registro.valor
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
                            <select
                              value={registro.formaPagamento || ''}
                              onChange={(e) => handleChangeRegistro(registro.id, 'formaPagamento', e.target.value)}
                              style={{ width: '100%' }}
                            >
                              <option value="">Selecione</option>
                              <option value="Dinheiro">Dinheiro</option>
                              <option value="Cartão">Cartão</option>
                              <option value="PIX/Pic pay">PIX/Pic pay</option>
                            </select>
                          ) : (
                            registro.formaPagamento
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
                            <Button onClick={() => salvarNovoRegistro(registro)}>Salvar</Button>
                          ) : (
                            <>
                              {registro.editando ? (
                                <>
                                  <Button onClick={() => salvarEdicaoRegistro(registro)}>Salvar</Button>
                                  <Button onClick={() => cancelarEdicaoRegistro(registro.id)}>Cancelar</Button>
                                </>
                              ) : (
                                <>
                                  <Button onClick={() => iniciarEdicaoRegistro(registro.id)}>Editar</Button>
                                  <Button onClick={() => excluirRegistro(registro.id)}>Excluir</Button>
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
                      <td style={{ border: '1px solid #ddd', padding: '8px' }}>{estatisticas.totalParticular.toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td style={{ border: '1px solid #ddd', padding: '8px' }}>Convênio</td>
                      <td style={{ border: '1px solid #ddd', padding: '8px' }}>{estatisticas.countConvenio}</td>
                      <td style={{ border: '1px solid #ddd', padding: '8px' }}>{estatisticas.totalConvenio.toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td style={{ border: '1px solid #ddd', padding: '8px' }}>Campanha</td>
                      <td style={{ border: '1px solid #ddd', padding: '8px' }}>{estatisticas.countCampanha}</td>
                      <td style={{ border: '1px solid #ddd', padding: '8px' }}>{estatisticas.totalCampanha.toFixed(2)}</td>
                    </tr>
                    <tr style={{ fontWeight: 'bold' }}>
                      <td style={{ border: '1px solid #ddd', padding: '8px' }}>Total</td>
                      <td style={{ border: '1px solid #ddd', padding: '8px' }}>{estatisticas.countTotal}</td>
                      <td style={{ border: '1px solid #ddd', padding: '8px' }}>{estatisticas.totalGeral.toFixed(2)}</td>
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

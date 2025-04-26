import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query,
  where,
  writeBatch,
  setDoc
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { sanitizeFirestoreData } from '../utils/firebaseUtils';

// Autenticação
export const authenticateUser = async (email, senha) => {
  try {
    const usersRef = collection(db, 'usuarios');
    const q = query(usersRef, where("email", "==", email));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      throw new Error('Usuário não encontrado');
    }

    const userDoc = querySnapshot.docs[0];
    const userData = sanitizeFirestoreData(userDoc.data());

    // Convertendo para string para garantir a comparação correta
    const senhaFornecida = String(senha);
    const senhaBanco = String(userData.password || userData.senha || '');

    // Removendo logs de senha por segurança
    // console.log('Senha fornecida:', senhaFornecida);
    // console.log('Senha no banco:', senhaBanco);

    if (senhaFornecida !== senhaBanco) {
      throw new Error('Senha incorreta');
    }

    return { id: userDoc.id, ...userData };
  } catch (error) {
    console.error('Erro na autenticação:', error.message);
    throw error;
  }
};

// Usuários
export const getUsers = async () => {
  const querySnapshot = await getDocs(collection(db, 'usuarios'));
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...sanitizeFirestoreData(doc.data()) }));
};

export const addUser = async (userData) => {
  const usersRef = collection(db, 'usuarios');
  const q = query(usersRef, where("email", "==", userData.email));
  const querySnapshot = await getDocs(q);
  
  if (!querySnapshot.empty) {
    throw new Error('Email já cadastrado');
  }
  
  const docRef = await addDoc(usersRef, userData);
  return { id: docRef.id, ...sanitizeFirestoreData(userData) };
};

export const updateUser = async (id, userData) => {
  const userRef = doc(db, 'usuarios', id);
  await updateDoc(userRef, userData);
  return { id, ...sanitizeFirestoreData(userData) };
};

export const deleteUser = async (id) => {
  const userRef = doc(db, 'usuarios', id);
  await deleteDoc(userRef);
};

// Médicos
export const getDoctors = async () => {
  const querySnapshot = await getDocs(collection(db, 'medicos'));
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...sanitizeFirestoreData(doc.data()) }));
};

export const getDoctorById = async (id) => {
  try {
    const docRef = doc(db, 'medicos', id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...sanitizeFirestoreData(docSnap.data()) };
    } else {
      console.log('Médico não encontrado com ID:', id);
      return null;
    }
  } catch (error) {
    console.error('Erro ao buscar médico por ID:', error);
    throw error;
  }
};

export const addDoctor = async (doctorData) => {
  const docRef = await addDoc(collection(db, 'medicos'), doctorData);
  return { id: docRef.id, ...sanitizeFirestoreData(doctorData) };
};

export const updateDoctor = async (id, doctorData) => {
  const doctorRef = doc(db, 'medicos', id);
  await updateDoc(doctorRef, doctorData);
  return { id, ...sanitizeFirestoreData(doctorData) };
};

export const deleteDoctor = async (id) => {
  const doctorRef = doc(db, 'medicos', id);
  await deleteDoc(doctorRef);
};

// Cidades
export const getCities = async () => {
  const querySnapshot = await getDocs(collection(db, 'cidades'));
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...sanitizeFirestoreData(doc.data()) }));
};

export const getCityById = async (id) => {
  try {
    const docRef = doc(db, 'cidades', id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...sanitizeFirestoreData(docSnap.data()) };
    } else {
      console.log('Cidade não encontrada com ID:', id);
      return null;
    }
  } catch (error) {
    console.error('Erro ao buscar cidade por ID:', error);
    throw error;
  }
};

export const addCity = async (cityData) => {
  const docRef = await addDoc(collection(db, 'cidades'), cityData);
  return { id: docRef.id, ...sanitizeFirestoreData(cityData) };
};

export const updateCity = async (id, cityData) => {
  // Garantir que estamos usando a propriedade 'name' consistentemente
  const normalizedData = {
    ...cityData,
    // Adicionar 'nome' como cópia de 'name' para compatibilidade
    nome: cityData.name || cityData.nome || ''
  };
  const cityRef = doc(db, 'cidades', id);
  await updateDoc(cityRef, normalizedData);
  return { id, ...sanitizeFirestoreData(normalizedData) };
};

export const deleteCity = async (id) => {
  const cityRef = doc(db, 'cidades', id);
  await deleteDoc(cityRef);
};

// Datas Disponíveis
export const getAvailableDates = async () => {
  console.log("Buscando datas disponíveis...");
  const querySnapshot = await getDocs(collection(db, 'datas_disponiveis'));
  console.log(`Total de datas encontradas no Firebase: ${querySnapshot.docs.length}`);
  
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Zerar horas para comparar apenas datas
  console.log(`Data atual para comparação: ${today.toLocaleDateString()}`);
  
  const batch = writeBatch(db);
  let updateNeeded = false;
  
  const dates = querySnapshot.docs.map(doc => {
    const data = sanitizeFirestoreData(doc.data());
    console.log(`Processando data: ${JSON.stringify(data)}`);
    
    // Verificar se a data possui o campo 'data'
    if (!data.data) {
      console.warn(`Documento ${doc.id} não possui o campo 'data'`, data);
      return { id: doc.id, ...data, status: 'Indisponível' };
    }
    
    const dateString = data.data; // Formato esperado: DD/MM/YYYY
    
    // Verificar formato da data
    if (!/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) {
      console.warn(`Formato de data inválido para o documento ${doc.id}: ${dateString}`);
      return { id: doc.id, ...data, status: 'Indisponível' };
    }
    
    // Converter string de data para objeto Date
    const [day, month, year] = dateString.split('/').map(Number);
    const dateObj = new Date(year, month - 1, day); // Mês em JS é 0-indexed
    
    // Verificar se a data é válida
    if (isNaN(dateObj.getTime())) {
      console.warn(`Data inválida para o documento ${doc.id}: ${dateString}`);
      return { id: doc.id, ...data, status: 'Indisponível' };
    }
    
    // Verificar se a data já chegou ao dia da consulta
    const isAvailable = dateObj > today && data.status === 'Disponível';
    console.log(`Data ${dateString} - É futura: ${dateObj > today}, Status original: ${data.status}, Status final: ${isAvailable ? 'Disponível' : 'Indisponível'}`);
    
    // Se a data já passou mas ainda está marcada como disponível no banco,
    // vamos atualizá-la automaticamente
    if (!isAvailable && data.status === 'Disponível') {
      batch.update(doc.ref, { status: 'Indisponível' });
      updateNeeded = true;
      console.log(`Marcando data ${dateString} como Indisponível no banco de dados`);
    }
    
    return { 
      id: doc.id, 
      ...data,
      // Atualizar status automaticamente se a data já chegou
      status: isAvailable ? 'Disponível' : 'Indisponível'
    };
  });
  
  console.log(`Total de datas após processamento: ${dates.length}`);
  console.log(`Datas disponíveis após processamento: ${dates.filter(d => d.status === 'Disponível').length}`);
  
  // Executar as atualizações em lote se necessário
  if (updateNeeded) {
    try {
      await batch.commit();
      console.log('Datas passadas foram atualizadas para Indisponível no banco de dados.');
    } catch (error) {
      console.error('Erro ao atualizar datas:', error);
    }
  }
  
  return dates;
};

export const getAvailableDateById = async (id) => {
  try {
    const docRef = doc(db, 'datas_disponiveis', id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...sanitizeFirestoreData(docSnap.data()) };
    } else {
      console.log('Data disponível não encontrada com ID:', id);
      return null;
    }
  } catch (error) {
    console.error('Erro ao buscar data disponível por ID:', error);
    throw error;
  }
};

export const addAvailableDate = async (dateData) => {
  const docRef = await addDoc(collection(db, 'datas_disponiveis'), dateData);
  return { id: docRef.id, ...sanitizeFirestoreData(dateData) };
};

export const updateAvailableDate = async (id, dateData) => {
  const dateRef = doc(db, 'datas_disponiveis', id);
  await updateDoc(dateRef, dateData);
  return { id, ...sanitizeFirestoreData(dateData) };
};

export const deleteAvailableDate = async (id) => {
  const dateRef = doc(db, 'datas_disponiveis', id);
  await deleteDoc(dateRef);
};

// Agendamentos
export const getAppointments = async () => {
  const querySnapshot = await getDocs(collection(db, 'agendamentos'));
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...sanitizeFirestoreData(doc.data()) }));
};

// Função para buscar apenas agendamentos ativos (data atual e futura)
export const getActiveAppointments = async () => {
  try {
    // Buscar todos os agendamentos
    const querySnapshot = await getDocs(collection(db, 'agendamentos'));
    const allAppointments = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...sanitizeFirestoreData(doc.data())
    }));
    
    // Obter a data atual
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0); // Zerar horas para comparar apenas datas
    
    // Filtrar apenas agendamentos ativos (data atual ou futura)
    const activeAppointments = allAppointments.filter(app => {
      if (!app.data) return false;
      
      // Converter a string de data (DD/MM/YYYY) para objeto Date
      const [day, month, year] = app.data.split('/').map(Number);
      const appDate = new Date(year, month - 1, day);
      appDate.setHours(0, 0, 0, 0);
      
      // Verificar se a data é atual ou futura
      return appDate >= currentDate;
    });
    
    console.log(`Total de agendamentos ativos encontrados: ${activeAppointments.length}`);
    return activeAppointments;
  } catch (error) {
    console.error('Erro ao buscar agendamentos ativos:', error);
    return [];
  }
};

export const checkTimeAvailability = async (cidade, data, horario) => {
  try {
    console.log(`Verificando disponibilidade para: Cidade=${cidade}, Data=${data}, Horário=${horario}`);
    
    // Consulta para verificar se já existe um agendamento com a mesma cidade, data e horário
    const appointmentsRef = collection(db, 'agendamentos');
    // Precisamos verificar se há agendamentos com status 'pendente' ou 'confirmado'
    // Como o Firestore não suporta OR em where diretamente, fazemos duas consultas
    const q1 = query(
      appointmentsRef,
      where('cidade', '==', cidade),
      where('data', '==', data),
      where('horario', '==', horario),
      where('status', '==', 'pendente')
    );
    
    const q2 = query(
      appointmentsRef,
      where('cidade', '==', cidade),
      where('data', '==', data),
      where('horario', '==', horario),
      where('status', '==', 'confirmado')
    );
    
    // Executar ambas as consultas
    const querySnapshot1 = await getDocs(q1);
    const querySnapshot2 = await getDocs(q2);
    
    // O horário está disponível apenas se ambas as consultas não retornarem resultados
    const isAvailable = querySnapshot1.empty && querySnapshot2.empty;
    
    console.log(`Horário ${isAvailable ? 'disponível' : 'já agendado'}`);
    return isAvailable;
  } catch (error) {
    console.error('Erro ao verificar disponibilidade de horário:', error);
    throw error;
  }
};

export const addAppointment = async (appointmentData) => {
  // Verificar se o horário está disponível antes de criar o agendamento
  const isAvailable = await checkTimeAvailability(
    appointmentData.cidade,
    appointmentData.data,
    appointmentData.horario
  );
  
  if (!isAvailable) {
    throw new Error('Este horário já está agendado. Por favor, escolha outro horário.');
  }
  
  const docRef = await addDoc(collection(db, 'agendamentos'), appointmentData);
  return { id: docRef.id, ...sanitizeFirestoreData(appointmentData) };
};

export const updateAppointment = async (id, appointmentData) => {
  const appointmentRef = doc(db, 'agendamentos', id);
  await updateDoc(appointmentRef, appointmentData);
  return { id, ...sanitizeFirestoreData(appointmentData) };
};

export const deleteAppointment = async (id) => {
  const appointmentRef = doc(db, 'agendamentos', id);
  await deleteDoc(appointmentRef);
};

// Configurações de Horários
export const getScheduleConfig = async (cityId) => {
  const docRef = doc(db, 'scheduleConfigs', cityId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...sanitizeFirestoreData(docSnap.data()) };
  }
  return null;
};

export const saveScheduleConfig = async (cityId, config) => {
  const docRef = doc(db, 'scheduleConfigs', cityId);
  await setDoc(docRef, config);
  return { id: cityId, ...sanitizeFirestoreData(config) };
};

export const getAllScheduleConfigs = async () => {
  const querySnapshot = await getDocs(collection(db, 'scheduleConfigs'));
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...sanitizeFirestoreData(doc.data())
  }));
};

export const getBookedTimes = async (cidade, data) => {
  try {
    console.log(`Buscando horários já agendados para: Cidade=${cidade}, Data=${data}`);
    
    // Consulta para buscar todos os agendamentos da mesma cidade e data
    const appointmentsRef = collection(db, 'agendamentos');
    
    // Consulta para agendamentos com status 'pendente'
    const q1 = query(
      appointmentsRef,
      where('cidade', '==', cidade),
      where('data', '==', data),
      where('status', '==', 'pendente')
    );
    
    // Consulta para agendamentos com status 'confirmado'
    const q2 = query(
      appointmentsRef,
      where('cidade', '==', cidade),
      where('data', '==', data),
      where('status', '==', 'confirmado')
    );
    
    // Executar ambas as consultas
    const querySnapshot1 = await getDocs(q1);
    const querySnapshot2 = await getDocs(q2);
    
    // Combinar os resultados de ambas as consultas
    const bookedTimes = [
      ...querySnapshot1.docs.map(doc => sanitizeFirestoreData(doc.data()).horario),
      ...querySnapshot2.docs.map(doc => sanitizeFirestoreData(doc.data()).horario)
    ];
    
    console.log(`Horários já agendados: ${bookedTimes.join(', ') || 'Nenhum'}`);
    return bookedTimes;
  } catch (error) {
    console.error('Erro ao buscar horários agendados:', error);
    return [];
  }
};

// Módulo Financeiro
export const getRegistrosFinanceiros = async (data, cidadeId) => {
  try {
    console.log(`Buscando registros financeiros para data ${data} e cidade ${cidadeId}`);
    
    let q = collection(db, 'registros_financeiros');
    
    // Filtrar por data e cidade se fornecidos
    if (data && cidadeId) {
      q = query(q, where('data', '==', data), where('cidade', '==', cidadeId));
    } else if (data) {
      q = query(q, where('data', '==', data));
    } else if (cidadeId) {
      q = query(q, where('cidade', '==', cidadeId));
    }
    
    const querySnapshot = await getDocs(q);
    const registros = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...sanitizeFirestoreData(doc.data())
    }));
    
    console.log(`Total de registros financeiros encontrados: ${registros.length}`);
    return registros;
  } catch (error) {
    console.error('Erro ao buscar registros financeiros:', error);
    return [];
  }
};

export const getRegistroFinanceiroById = async (id) => {
  try {
    const docRef = doc(db, 'registros_financeiros', id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...sanitizeFirestoreData(docSnap.data())
      };
    } else {
      console.log(`Registro financeiro com ID ${id} não encontrado`);
      return null;
    }
  } catch (error) {
    console.error('Erro ao buscar registro financeiro:', error);
    return null;
  }
};

export const salvarRegistroFinanceiro = async (registro) => {
  try {
    if (registro.id) {
      // Atualizar registro existente
      const docRef = doc(db, 'registros_financeiros', registro.id);
      await updateDoc(docRef, registro);
      console.log(`Registro financeiro ${registro.id} atualizado com sucesso`);
      return registro.id;
    } else {
      // Adicionar novo registro
      const docRef = await addDoc(collection(db, 'registros_financeiros'), registro);
      console.log(`Novo registro financeiro criado com ID: ${docRef.id}`);
      return docRef.id;
    }
  } catch (error) {
    console.error('Erro ao salvar registro financeiro:', error);
    throw error;
  }
};

export const excluirRegistroFinanceiro = async (id) => {
  try {
    await deleteDoc(doc(db, 'registros_financeiros', id));
    console.log(`Registro financeiro ${id} excluído com sucesso`);
    return true;
  } catch (error) {
    console.error('Erro ao excluir registro financeiro:', error);
    return false;
  }
};

export const getAgendamentosPorData = async (data, cidadeId) => {
  try {
    console.log(`Buscando agendamentos para data ${data} e cidade ${cidadeId}`);
    
    let q = collection(db, 'agendamentos');
    
    // Filtrar por data e cidade se fornecidos
    if (data && cidadeId) {
      q = query(q, where('data', '==', data), where('cidade', '==', cidadeId));
    } else if (data) {
      q = query(q, where('data', '==', data));
    } else if (cidadeId) {
      q = query(q, where('cidade', '==', cidadeId));
    }
    
    const querySnapshot = await getDocs(q);
    const agendamentos = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...sanitizeFirestoreData(doc.data())
    }));
    
    console.log(`Total de agendamentos encontrados: ${agendamentos.length}`);
    return agendamentos;
  } catch (error) {
    console.error('Erro ao buscar agendamentos:', error);
    return [];
  }
};

// Função para buscar agendamentos históricos com filtros avançados
export const getHistoricalAppointments = async (filters = {}) => {
  try {
    console.log('Buscando agendamentos históricos com filtros:', filters);
    const { startDate, endDate, cidade, status, searchTerm } = filters;
    
    // Primeiro, buscar todas as datas disponíveis para determinar quais datas são históricas
    const availableDatesSnapshot = await getDocs(collection(db, 'datas_disponiveis'));
    const availableDates = availableDatesSnapshot.docs.map(doc => {
      const data = sanitizeFirestoreData(doc.data());
      return {
        id: doc.id,
        data: data.data, // formato DD/MM/YYYY
        status: data.status
      };
    });
    
    // Extrair apenas as datas disponíveis (formato DD/MM/YYYY)
    const activeDates = availableDates
      .filter(date => date.status === 'Disponível')
      .map(date => date.data);
    
    console.log('Datas disponíveis para agendamento:', activeDates);
    
    // Construir a consulta base para agendamentos
    let appointmentsRef = collection(db, 'agendamentos');
    let constraints = [];
    
    // Adicionar filtros - apenas status, cidade será filtrada depois
    // para evitar problemas de compatibilidade com os filtros de data
    if (status) {
      constraints.push(where('status', '==', status));
    }
    
    // Status já foi adicionado acima
    
    // Criar a consulta com os filtros
    let q;
    
    if (constraints.length > 0) {
      q = query(appointmentsRef, ...constraints);
    } else {
      q = query(appointmentsRef);
    }
    
    // Executar a consulta
    const querySnapshot = await getDocs(q);
    let appointments = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...sanitizeFirestoreData(doc.data())
    }));
    
    // Obter a data atual para comparações
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0); // Zerar horas para comparar apenas datas
    
    // Filtrar apenas agendamentos históricos (datas anteriores à data atual)
    appointments = appointments.filter(app => {
      if (!app.data) return false;
      
      // Converter a string de data (DD/MM/YYYY) para objeto Date
      const [day, month, year] = app.data.split('/').map(Number);
      const appDate = new Date(year, month - 1, day);
      appDate.setHours(0, 0, 0, 0);
      
      // Um agendamento é considerado histórico se sua data é anterior à data atual
      return appDate < currentDate;
    });
    
    // Aplicar filtro de cidade manualmente para garantir compatibilidade com outros filtros
    if (cidade) {
      console.log('Filtrando manualmente por cidade ID:', cidade);
      console.log('Antes do filtro de cidade:', appointments.length, 'agendamentos');
      
      // Verificar o formato dos IDs de cidade nos agendamentos
      const cidadesNosAgendamentos = new Set();
      appointments.forEach(app => {
        if (app.cidade) {
          cidadesNosAgendamentos.add(app.cidade);
        }
      });
      console.log('IDs de cidades nos agendamentos:', Array.from(cidadesNosAgendamentos));
      
      // Primeiro, precisamos buscar o nome da cidade pelo ID
      try {
        // Buscar a cidade pelo ID para obter o nome
        const cityDoc = await getDoc(doc(db, 'cidades', cidade));
        if (cityDoc.exists()) {
          const cityData = sanitizeFirestoreData(cityDoc.data());
          const cityName = cityData.nome || cityData.name;
          console.log('Nome da cidade selecionada:', cityName);
          
          // Filtrar por nome da cidade em vez do ID
          appointments = appointments.filter(app => {
            // Verificar se o campo cidade do agendamento corresponde ao nome da cidade
            return app.cidade === cityName || 
                   (typeof app.cidade === 'string' && app.cidade.toLowerCase() === cityName.toLowerCase());
          });
        } else {
          console.log('Cidade não encontrada com ID:', cidade);
          // Se não encontrar a cidade, tentar filtrar pelo ID diretamente
          appointments = appointments.filter(app => app.cidade === cidade);
        }
      } catch (error) {
        console.error('Erro ao buscar cidade por ID:', error);
        // Em caso de erro, tentar filtrar pelo ID diretamente
        appointments = appointments.filter(app => app.cidade === cidade);
      }
      
      console.log('Após filtro de cidade:', appointments.length, 'agendamentos');
    }
    
    // Filtrar por período (client-side)
    if (startDate || endDate) {
      appointments = appointments.filter(app => {
        if (!app.data) return false;
        
        // Converter a string de data (DD/MM/YYYY) para objeto Date
        const [day, month, year] = app.data.split('/').map(Number);
        const appDate = new Date(year, month - 1, day);
        appDate.setHours(0, 0, 0, 0);
        
        let isAfterStart = true;
        let isBeforeEnd = true;
        
        if (startDate) {
          const start = new Date(startDate);
          start.setHours(0, 0, 0, 0);
          isAfterStart = appDate >= start;
        }
        
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          isBeforeEnd = appDate <= end;
        }
        
        return isAfterStart && isBeforeEnd;
      });
    }
    
    // Filtrar por termo de busca (client-side)
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      appointments = appointments.filter(app => 
        (app.nome && app.nome.toLowerCase().includes(term)) || 
        (app.telefone && app.telefone.includes(term))
      );
    }
    
    // Ordenar por data e horário (mais recentes primeiro)
    appointments.sort((a, b) => {
      // Primeiro comparar as datas
      if (a.data && b.data) {
        const [dayA, monthA, yearA] = a.data.split('/').map(Number);
        const [dayB, monthB, yearB] = b.data.split('/').map(Number);
        
        const dateA = new Date(yearA, monthA - 1, dayA);
        const dateB = new Date(yearB, monthB - 1, dayB);
        
        const dateDiff = dateB - dateA; // Ordem decrescente (mais recentes primeiro)
        
        if (dateDiff !== 0) return dateDiff;
      }
      
      // Se as datas forem iguais, comparar os horários
      if (a.horario && b.horario) {
        const [hoursA, minutesA] = a.horario.split(':').map(Number);
        const [hoursB, minutesB] = b.horario.split(':').map(Number);
        
        const minutesA_total = hoursA * 60 + minutesA;
        const minutesB_total = hoursB * 60 + minutesB;
        
        return minutesB_total - minutesA_total; // Ordem decrescente
      }
      
      return 0;
    });
    
    console.log(`Total de agendamentos históricos encontrados: ${appointments.length}`);
    return appointments;
  } catch (error) {
    console.error('Erro ao buscar agendamentos históricos:', error);
    return [];
  }
};

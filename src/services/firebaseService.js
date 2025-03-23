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
    const userData = userDoc.data();

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
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const addUser = async (userData) => {
  const usersRef = collection(db, 'usuarios');
  const q = query(usersRef, where("email", "==", userData.email));
  const querySnapshot = await getDocs(q);
  
  if (!querySnapshot.empty) {
    throw new Error('Email já cadastrado');
  }
  
  const docRef = await addDoc(usersRef, userData);
  return { id: docRef.id, ...userData };
};

export const updateUser = async (id, userData) => {
  const userRef = doc(db, 'usuarios', id);
  await updateDoc(userRef, userData);
  return { id, ...userData };
};

export const deleteUser = async (id) => {
  const userRef = doc(db, 'usuarios', id);
  await deleteDoc(userRef);
};

// Médicos
export const getDoctors = async () => {
  const querySnapshot = await getDocs(collection(db, 'medicos'));
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const getDoctorById = async (id) => {
  try {
    const docRef = doc(db, 'medicos', id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
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
  return { id: docRef.id, ...doctorData };
};

export const updateDoctor = async (id, doctorData) => {
  const doctorRef = doc(db, 'medicos', id);
  await updateDoc(doctorRef, doctorData);
  return { id, ...doctorData };
};

export const deleteDoctor = async (id) => {
  const doctorRef = doc(db, 'medicos', id);
  await deleteDoc(doctorRef);
};

// Cidades
export const getCities = async () => {
  const querySnapshot = await getDocs(collection(db, 'cidades'));
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const getCityById = async (id) => {
  try {
    const docRef = doc(db, 'cidades', id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
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
  return { id: docRef.id, ...cityData };
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
  return { id, ...normalizedData };
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
    const data = doc.data();
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
      return { id: docSnap.id, ...docSnap.data() };
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
  return { id: docRef.id, ...dateData };
};

export const updateAvailableDate = async (id, dateData) => {
  const dateRef = doc(db, 'datas_disponiveis', id);
  await updateDoc(dateRef, dateData);
  return { id, ...dateData };
};

export const deleteAvailableDate = async (id) => {
  const dateRef = doc(db, 'datas_disponiveis', id);
  await deleteDoc(dateRef);
};

// Agendamentos
export const getAppointments = async () => {
  const querySnapshot = await getDocs(collection(db, 'agendamentos'));
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const checkTimeAvailability = async (cidade, data, horario) => {
  try {
    console.log(`Verificando disponibilidade para: Cidade=${cidade}, Data=${data}, Horário=${horario}`);
    
    // Consulta para verificar se já existe um agendamento com a mesma cidade, data e horário
    const appointmentsRef = collection(db, 'agendamentos');
    const q = query(
      appointmentsRef,
      where('cidade', '==', cidade),
      where('data', '==', data),
      where('horario', '==', horario),
      where('status', '==', 'Agendado')
    );
    
    const querySnapshot = await getDocs(q);
    const isAvailable = querySnapshot.empty;
    
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
  return { id: docRef.id, ...appointmentData };
};

export const updateAppointment = async (id, appointmentData) => {
  const appointmentRef = doc(db, 'agendamentos', id);
  await updateDoc(appointmentRef, appointmentData);
  return { id, ...appointmentData };
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
    return { id: docSnap.id, ...docSnap.data() };
  }
  return null;
};

export const saveScheduleConfig = async (cityId, config) => {
  const docRef = doc(db, 'scheduleConfigs', cityId);
  await setDoc(docRef, config);
  return { id: cityId, ...config };
};

export const getAllScheduleConfigs = async () => {
  const querySnapshot = await getDocs(collection(db, 'scheduleConfigs'));
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
};

export const getBookedTimes = async (cidade, data) => {
  try {
    console.log(`Buscando horários já agendados para: Cidade=${cidade}, Data=${data}`);
    
    // Consulta para buscar todos os agendamentos da mesma cidade e data
    const appointmentsRef = collection(db, 'agendamentos');
    const q = query(
      appointmentsRef,
      where('cidade', '==', cidade),
      where('data', '==', data),
      where('status', '==', 'Agendado')
    );
    
    const querySnapshot = await getDocs(q);
    const bookedTimes = querySnapshot.docs.map(doc => doc.data().horario);
    
    console.log(`Horários já agendados: ${bookedTimes.join(', ') || 'Nenhum'}`);
    return bookedTimes;
  } catch (error) {
    console.error('Erro ao buscar horários agendados:', error);
    return [];
  }
};

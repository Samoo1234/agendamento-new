import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import useStore from '../store/useStore';
import toast from 'react-hot-toast';
import { FaTimes } from 'react-icons/fa';
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 10px;
  right: 10px;
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #333;
`;

const Title = styled.h2`
  margin-bottom: 20px;
  color: #000033;
  text-align: center;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 15px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
`;

const Label = styled.label`
  margin-bottom: 5px;
  font-weight: 500;
`;

const Select = styled.select`
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
`;

const Input = styled.input`
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
`;

const TextArea = styled.textarea`
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  min-height: 100px;
`;

const Button = styled.button`
  padding: 12px;
  background-color: #000033;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  margin-top: 10px;

  &:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.div`
  color: red;
  font-size: 14px;
  margin-top: 5px;
`;

const TimeGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: 10px;
  margin-top: 10px;
`;

const TimeButton = styled.button`
  padding: 8px;
  background-color: ${props => props.selected ? '#000033' : '#f0f0f0'};
  color: ${props => props.selected ? 'white' : '#333'};
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;

  &:disabled {
    background-color: #e0e0e0;
    color: #999;
    cursor: not-allowed;
  }
`;

function AgendamentoModal({ isOpen, onClose, onSuccess }) {
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [availableTimes, setAvailableTimes] = useState([]);
  const [errors, setErrors] = useState({});
  const [selectedCityDoctor, setSelectedCityDoctor] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [filteredAvailableDates, setFilteredAvailableDates] = useState([]);

  const { 
    cities, 
    availableDates,
    scheduleConfigs,
    fetchScheduleConfigs,
    createAppointment,
    doctors,
    fetchCities,
    fetchAvailableDates
  } = useStore();

  useEffect(() => {
    // Função para carregar todos os dados necessários
    const loadAllData = async () => {
      setIsLoading(true);
      try {
        console.log("Iniciando carregamento de dados no AgendamentoModal");
        
        // Carregar dados em paralelo para melhor performance
        await Promise.all([
          fetchScheduleConfigs(),
          fetchCities(),
          fetchAvailableDates()
        ]);
        
        console.log("Cidades carregadas:", cities);
        console.log("Datas disponíveis carregadas:", availableDates);
      } catch (error) {
        console.error("Erro ao carregar dados iniciais:", error);
        toast.error("Erro ao carregar dados. Por favor, recarregue a página.");
      } finally {
        setIsLoading(false);
      }
    };
    
    if (isOpen) {
      loadAllData();
    }
  }, [isOpen, fetchScheduleConfigs, fetchCities, fetchAvailableDates]);

  useEffect(() => {
    if (selectedCity && availableDates.length > 0) {
      // Buscar cidade pelo ID
      const cityObj = cities.find(city => city.id === selectedCity);
      
      if (cityObj) {
        const cityName = cityObj.name;
        
        // Filtrar todas as datas para esta cidade, incluindo as marcadas como indisponíveis
        // Diferente do AgendamentoForm, aqui não filtramos pelo status
        const filteredDates = availableDates.filter(date => {
          // Normalizar os nomes das cidades para comparação
          const normalizeString = (str) => {
            return str
              ? str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
              : '';
          };
          
          const normalizedDateCity = normalizeString(date.cidade);
          const normalizedSelectedCity = normalizeString(cityName);
          
          return normalizedDateCity === normalizedSelectedCity;
        });
        
        console.log(`Datas filtradas para a cidade ${cityName}:`, filteredDates);
        setFilteredAvailableDates(filteredDates);
      } else {
        setFilteredAvailableDates([]);
      }
    } else {
      setFilteredAvailableDates([]);
    }
  }, [selectedCity, availableDates, cities]);

  useEffect(() => {
    if (selectedCity && selectedDate) {
      // Encontrar o médico associado à cidade selecionada
      const cityObj = cities.find(city => city.id === selectedCity);
      const cityDoctor = doctors.find(doctor => doctor.city === selectedCity);
      setSelectedCityDoctor(cityDoctor?.name || '');
      
      // Gerar horários padrão baseados na configuração da cidade
      const cityConfig = {
        periodoManha: true,
        periodoTarde: true,
        horarios: {
          manhaInicio: '08:00',
          manhaFim: '12:00',
          tardeInicio: '14:00',
          tardeFim: '18:00'
        },
        intervalo: 10
      };
      
      const slots = [];
      const addTimeSlots = (start, end, interval) => {
        const startTime = new Date(`2000-01-01T${start}`);
        const endTime = new Date(`2000-01-01T${end}`);
        
        while (startTime < endTime) {
          slots.push(startTime.toLocaleTimeString('pt-BR', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false 
          }));
          startTime.setMinutes(startTime.getMinutes() + interval);
        }
      };
      
      if (cityConfig.periodoManha) {
        addTimeSlots(cityConfig.horarios.manhaInicio, cityConfig.horarios.manhaFim, cityConfig.intervalo);
      }
      if (cityConfig.periodoTarde) {
        addTimeSlots(cityConfig.horarios.tardeInicio, cityConfig.horarios.tardeFim, cityConfig.intervalo);
      }
      
      // Buscar horários já agendados e filtrar da lista
      const fetchBookedTimes = async () => {
        try {
          // Buscar cidade e data pelo ID
          const dateObj = availableDates.find(date => date.id === selectedDate);
          if (cityObj && dateObj) {
            const cityName = cityObj.name;
            const dateString = dateObj.data;
            
            console.log(`Buscando horários agendados para: Cidade=${cityName}, Data=${dateString}`);
            
            // Consulta para buscar todos os agendamentos da mesma cidade e data
            const appointmentsRef = collection(db, 'agendamentos');
            const q = query(
              appointmentsRef,
              where('cidade', '==', cityName),
              where('data', '==', dateString)
            );
            
            const querySnapshot = await getDocs(q);
            // Filtrar apenas agendamentos não cancelados
            const bookedTimes = querySnapshot.docs
              .filter(doc => doc.data().status !== 'cancelado')
              .map(doc => doc.data().horario);
            
            console.log(`Horários já agendados: ${bookedTimes.join(', ') || 'Nenhum'}`);
            
            // Filtrar os horários disponíveis, removendo os já agendados
            const availableSlots = slots.filter(slot => !bookedTimes.includes(slot));
            
            console.log(`Total de horários: ${slots.length}, Disponíveis: ${availableSlots.length}`);
            
            setAvailableTimes(availableSlots);
          } else {
            // Se não encontrou a cidade ou a data, mostrar todos os horários
            setAvailableTimes(slots);
          }
        } catch (error) {
          console.error('Erro ao buscar horários agendados:', error);
          // Em caso de erro, mostrar todos os horários
          setAvailableTimes(slots);
        }
      };
      
      fetchBookedTimes();
      
      // Limpar o horário selecionado quando mudar a cidade ou data
      setSelectedTime('');
    } else {
      setAvailableTimes([]);
      setSelectedTime('');
    }
  }, [selectedCity, selectedDate, availableDates, cities, doctors]);

  const validateForm = () => {
    const newErrors = {};
    
    if (!selectedCity) newErrors.city = "Por favor, selecione uma cidade";
    if (!selectedDate) newErrors.date = "Por favor, selecione uma data";
    if (!selectedTime) newErrors.time = "Por favor, selecione um horário";
    if (!name.trim()) newErrors.name = "Por favor, informe seu nome";
    if (!phone.trim()) newErrors.phone = "Por favor, informe seu telefone";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Encontrar o nome da cidade a partir do ID
      const cityObj = cities.find(city => city.id === selectedCity);
      const cityName = cityObj ? cityObj.name : '';
      
      // Encontrar a data formatada a partir do ID
      const dateObj = availableDates.find(date => date.id === selectedDate);
      const formattedDate = dateObj ? dateObj.data : '';
      
      if (!cityName || !formattedDate) {
        throw new Error("Não foi possível encontrar os dados completos da cidade ou data");
      }
      
      // Verificar se o horário já está agendado
      const bookedAppointmentsRef = collection(db, 'agendamentos');
      const q = query(
        bookedAppointmentsRef, 
        where('cidade', '==', cityName),
        where('data', '==', formattedDate),
        where('horario', '==', selectedTime)
      );
      
      const querySnapshot = await getDocs(q);
      
      // Verificar se existe algum agendamento não cancelado para este horário
      const existingAppointment = querySnapshot.docs.find(doc => doc.data().status !== 'cancelado');
      
      if (existingAppointment) {
        throw new Error("Este horário já está agendado. Por favor, escolha outro horário.");
      }
      
      // Criar o agendamento
      const agendamentoData = {
        paciente: name, // Campo principal para o nome do cliente
        cliente: name, // Campo alternativo para compatibilidade
        nome: name, // Campo alternativo para compatibilidade
        telefone: phone,
        cidade: cityName, // Armazenar o NOME da cidade (não o ID)
        cidadeId: selectedCity, // Armazenar também o ID da cidade para referência
        data: formattedDate, // Armazenar a data formatada (não o ID)
        dataId: selectedDate, // Armazenar também o ID da data para referência
        horario: selectedTime,
        medico: selectedCityDoctor,
        observacoes: additionalInfo,
        status: 'pendente',
        createdAt: serverTimestamp()
      };
      
      console.log("Criando agendamento com os dados:", agendamentoData);
      
      // Adicionar à coleção de agendamentos
      const docRef = await addDoc(collection(db, 'agendamentos'), agendamentoData);
      
      console.log("Agendamento criado com ID:", docRef.id);
      toast.success("Agendamento realizado com sucesso!");
      
      // Limpar o formulário
      setSelectedCity('');
      setSelectedDate('');
      setSelectedTime('');
      setName('');
      setPhone('');
      setAdditionalInfo('');
      
      // Fechar o modal e notificar o componente pai
      if (onSuccess) onSuccess();
      onClose();
      
    } catch (error) {
      console.error("Erro ao criar agendamento:", error);
      toast.error(error.message || "Erro ao criar agendamento. Por favor, tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <ModalOverlay>
      <ModalContent>
        <CloseButton onClick={onClose}>
          <FaTimes />
        </CloseButton>
        <Title>Novo Agendamento</Title>
        
        {isLoading ? (
          <div>Carregando...</div>
        ) : (
          <Form onSubmit={handleSubmit}>
            <FormGroup>
              <Label>Cidade</Label>
              <Select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
              >
                <option value="">Selecione uma cidade</option>
                {cities.map((city) => (
                  <option key={city.id} value={city.id}>
                    {city.name}
                  </option>
                ))}
              </Select>
              {errors.city && <ErrorMessage>{errors.city}</ErrorMessage>}
            </FormGroup>
            
            <FormGroup>
              <Label>Data</Label>
              <Select
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                disabled={!selectedCity}
              >
                <option value="">Selecione uma data</option>
                {filteredAvailableDates.map((date) => (
                  <option key={date.id} value={date.id}>
                    {date.data} {date.status !== 'Disponível' ? '(Indisponível)' : ''}
                  </option>
                ))}
              </Select>
              {errors.date && <ErrorMessage>{errors.date}</ErrorMessage>}
            </FormGroup>
            
            <FormGroup>
              <Label>Horário</Label>
              <Select
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                disabled={!selectedCity || !selectedDate}
              >
                <option value="">Selecione um horário</option>
                {availableTimes.map(time => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
              </Select>
              {errors.time && <ErrorMessage>{errors.time}</ErrorMessage>}
            </FormGroup>
            
            <FormGroup>
              <Label>Nome</Label>
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Digite seu nome completo"
              />
              {errors.name && <ErrorMessage>{errors.name}</ErrorMessage>}
            </FormGroup>
            
            <FormGroup>
              <Label>Telefone</Label>
              <Input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Digite seu telefone com DDD"
              />
              {errors.phone && <ErrorMessage>{errors.phone}</ErrorMessage>}
            </FormGroup>
            
            <FormGroup>
              <Label>Informações Adicionais (opcional)</Label>
              <TextArea
                value={additionalInfo}
                onChange={(e) => setAdditionalInfo(e.target.value)}
                placeholder="Informe detalhes adicionais se necessário"
              />
            </FormGroup>
            
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Processando..." : "Confirmar Agendamento"}
            </Button>
          </Form>
        )}
      </ModalContent>
    </ModalOverlay>
  );
}

export default AgendamentoModal;

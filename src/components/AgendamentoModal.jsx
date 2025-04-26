import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import useStore from '../store/useStore';
import toast from 'react-hot-toast';
import { FaTimes } from 'react-icons/fa';
import { collection, addDoc, serverTimestamp, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
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
  width: 100%;
  padding: 10px;
  margin-bottom: 15px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 16px;
  
  &:focus {
    outline: none;
    border-color: #007bff;
  }
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

function AgendamentoModal({ isOpen, onClose, onSuccess, appointmentToEdit }) {
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
      
      // Se estiver editando um agendamento existente, preencher os campos com os dados do agendamento
      if (appointmentToEdit) {
        setName(appointmentToEdit.nome || '');
        setPhone(appointmentToEdit.telefone || '');
        setAdditionalInfo(appointmentToEdit.observacoes || appointmentToEdit.informacoes || '');
        setSelectedCity(appointmentToEdit.cidadeId || '');
        setSelectedDate(appointmentToEdit.dataId || '');
        setSelectedTime(appointmentToEdit.horario || '');
      } else {
        // Limpar os campos se for um novo agendamento
        setName('');
        setPhone('');
        setAdditionalInfo('');
        setSelectedCity('');
        setSelectedDate('');
        setSelectedTime('');
      }
    }
  }, [isOpen, appointmentToEdit]);

  useEffect(() => {
    if (selectedCity) {
      // Filtrar datas disponíveis para a cidade selecionada
      const filteredDates = availableDates.filter(date => {
        // Normalizar os nomes das cidades para comparação (remover acentos, converter para minúsculas)
        const normalizeString = (str) => {
          return str
            ? str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
            : '';
        };
        
        const normalizedDateCity = normalizeString(date.cidade);
        const normalizedSelectedCity = normalizeString(cities.find(c => c.id === selectedCity)?.name);
        
        // Verificar se a data é para a cidade selecionada
        return normalizedDateCity === normalizedSelectedCity;
      });
      
      // Ordenar as datas em ordem crescente (da mais próxima para a mais distante)
      const sortedDates = [...filteredDates].sort((a, b) => {
        // Converter as strings de data para objetos Date para comparação
        const [dayA, monthA, yearA] = a.data.split('/').map(Number);
        const [dayB, monthB, yearB] = b.data.split('/').map(Number);
        
        const dateA = new Date(yearA, monthA - 1, dayA);
        const dateB = new Date(yearB, monthB - 1, dayB);
        
        return dateA - dateB; // Ordem crescente
      });
      
      setFilteredAvailableDates(sortedDates);
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
      
      // Verificar se há configuração específica para esta cidade
      if (Array.isArray(scheduleConfigs)) {
        const scheduleConfig = scheduleConfigs.find(config => config.cityId === selectedCity);
        if (scheduleConfig) {
          console.log('Usando configuração específica para a cidade:', scheduleConfig);
          cityConfig.periodoManha = scheduleConfig.periodoManha;
          cityConfig.periodoTarde = scheduleConfig.periodoTarde;
          
          // Garantir que o horário da manhã comece às 08:00 se não estiver explicitamente definido
          if (scheduleConfig.horarios) {
            cityConfig.horarios.manhaInicio = scheduleConfig.horarios.manhaInicio || '08:00';
            cityConfig.horarios.manhaFim = scheduleConfig.horarios.manhaFim || '12:00';
            cityConfig.horarios.tardeInicio = scheduleConfig.horarios.tardeInicio || '14:00';
            cityConfig.horarios.tardeFim = scheduleConfig.horarios.tardeFim || '18:00';
          }
          
          cityConfig.intervalo = scheduleConfig.intervalo || cityConfig.intervalo;
        }
      } else if (scheduleConfigs && scheduleConfigs[selectedCity]) {
        // Se scheduleConfigs for um objeto com chaves de cityId
        const scheduleConfig = scheduleConfigs[selectedCity];
        console.log('Usando configuração específica para a cidade (objeto):', scheduleConfig);
        cityConfig.periodoManha = scheduleConfig.periodoManha;
        cityConfig.periodoTarde = scheduleConfig.periodoTarde;
        
        // Garantir que o horário da manhã comece às 08:00 se não estiver explicitamente definido
        if (scheduleConfig.horarios) {
          cityConfig.horarios.manhaInicio = scheduleConfig.horarios.manhaInicio || '08:00';
          cityConfig.horarios.manhaFim = scheduleConfig.horarios.manhaFim || '12:00';
          cityConfig.horarios.tardeInicio = scheduleConfig.horarios.tardeInicio || '14:00';
          cityConfig.horarios.tardeFim = scheduleConfig.horarios.tardeFim || '18:00';
        }
        
        cityConfig.intervalo = scheduleConfig.intervalo || cityConfig.intervalo;
      }
      
      console.log('Configuração de horários usada:', cityConfig);
      
      // Gerar todos os horários possíveis
      const slots = [];
      
      // Função auxiliar para formatar horário
      const formatTime = (hours, minutes) => {
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      };
      
      // Função para adicionar horários em um intervalo
      const addTimeSlots = (start, end, interval) => {
        const [startHours, startMinutes] = start.split(':').map(Number);
        const [endHours, endMinutes] = end.split(':').map(Number);
        
        let currentHours = startHours;
        let currentMinutes = startMinutes;
        
        console.log(`Gerando horários de ${start} até ${end} com intervalo de ${interval} minutos`);
        
        while (
          currentHours < endHours || 
          (currentHours === endHours && currentMinutes < endMinutes)
        ) {
          const timeStr = formatTime(currentHours, currentMinutes);
          console.log(`Adicionando horário: ${timeStr}`);
          slots.push(timeStr);
          
          // Avançar para o próximo horário
          currentMinutes += interval;
          if (currentMinutes >= 60) {
            currentHours += Math.floor(currentMinutes / 60);
            currentMinutes %= 60;
          }
        }
      };
      
      if (cityConfig.periodoManha) {
        addTimeSlots(cityConfig.horarios.manhaInicio, cityConfig.horarios.manhaFim, cityConfig.intervalo);
      }
      if (cityConfig.periodoTarde) {
        addTimeSlots(cityConfig.horarios.tardeInicio, cityConfig.horarios.tardeFim, cityConfig.intervalo);
      }
      
      console.log(`Total de slots gerados: ${slots.length}`);
      console.log('Slots:', slots);
      
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
            console.log('Horários disponíveis:', availableSlots);
            
            // Ordenar os horários em ordem crescente
            const sortedSlots = [...availableSlots].sort((a, b) => {
              // Converter horários para minutos para facilitar a comparação
              const getMinutos = (horario) => {
                const [horas, minutos] = horario.split(':').map(Number);
                return (horas * 60) + minutos;
              };
              
              return getMinutos(a) - getMinutos(b);
            });
            
            console.log('Horários ordenados:', sortedSlots);
            
            setAvailableTimes(sortedSlots);
          } else {
            // Se não encontrou a cidade ou a data, mostrar todos os horários
            // Ordenar os horários em ordem crescente
            const sortedSlots = [...slots].sort((a, b) => {
              // Converter horários para minutos para facilitar a comparação
              const getMinutos = (horario) => {
                const [horas, minutos] = horario.split(':').map(Number);
                return (horas * 60) + minutos;
              };
              
              return getMinutos(a) - getMinutos(b);
            });
            
            setAvailableTimes(sortedSlots);
          }
        } catch (error) {
          console.error('Erro ao buscar horários agendados:', error);
          // Em caso de erro, mostrar todos os horários
          // Ordenar os horários em ordem crescente
          const sortedSlots = [...slots].sort((a, b) => {
            // Converter horários para minutos para facilitar a comparação
            const getMinutos = (horario) => {
              const [horas, minutos] = horario.split(':').map(Number);
              return (horas * 60) + minutos;
            };
            
            return getMinutos(a) - getMinutos(b);
          });
          
          setAvailableTimes(sortedSlots);
        }
      };
      
      fetchBookedTimes();
      
      // Limpar o horário selecionado quando mudar a cidade ou data
      setSelectedTime('');
    } else {
      setAvailableTimes([]);
      setSelectedTime('');
    }
  }, [selectedCity, selectedDate, availableDates, cities, doctors, scheduleConfigs]);

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
    
    // Validar formulário
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Encontrar o objeto da cidade selecionada
      const selectedCityObject = cities.find(city => city.id === selectedCity);
      const cityName = selectedCityObject ? selectedCityObject.name : '';
      
      // Encontrar o objeto da data selecionada
      const selectedDateObject = availableDates.find(date => date.id === selectedDate);
      const dateString = selectedDateObject ? selectedDateObject.data : '';
      
      // Encontrar o médico associado à cidade
      const doctor = doctors.find(doc => {
        const normalizedDocCity = normalizeString(doc.cidade || '');
        const normalizedCity = normalizeString(cityName || '');
        return normalizedDocCity === normalizedCity;
      });
      
      // Criar objeto de agendamento
      const appointmentData = {
        nome: name,
        telefone: phone,
        cidade: cityName,
        cidadeId: selectedCity,
        data: dateString,
        dataId: selectedDate,
        horario: selectedTime,
        status: appointmentToEdit ? appointmentToEdit.status : 'pendente',
        observacoes: additionalInfo, // Usar campo observacoes em vez de informacoes
        updatedAt: serverTimestamp(),
        medico: doctor ? doctor.nome : '',
        medicoId: doctor ? doctor.id : ''
      };
      
      // Se estiver editando, atualizar o agendamento existente
      if (appointmentToEdit) {
        await updateDoc(doc(db, 'agendamentos', appointmentToEdit.id), appointmentData);
        toast.success('Agendamento atualizado com sucesso!');
      } else {
        // Se for novo, adicionar createdAt
        appointmentData.createdAt = serverTimestamp();
        await createAppointment(appointmentData);
        toast.success('Agendamento criado com sucesso! Aguarde confirmação via WhatsApp.');
      }
      
      // Limpar formulário
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
      console.error("Erro ao ", appointmentToEdit ? "atualizar" : "criar", " agendamento:", error);
      toast.error(error.message || `Erro ao ${appointmentToEdit ? 'atualizar' : 'criar'} agendamento. Por favor, tente novamente.`);
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
        <Title>{appointmentToEdit ? 'Editar Agendamento' : 'Novo Agendamento'}</Title>
        
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
                disabled={!selectedCity || !selectedDate || availableTimes.length === 0}
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
              {isLoading ? "Processando..." : appointmentToEdit ? "Atualizar Agendamento" : "Confirmar Agendamento"}
            </Button>
          </Form>
        )}
      </ModalContent>
    </ModalOverlay>
  );
}

export default AgendamentoModal;

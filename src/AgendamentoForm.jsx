import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import useStore from './store/useStore';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import LogoImage from './assets/logo/logo new.png';
import { FaUser } from 'react-icons/fa';
import * as firebaseService from './services/firebaseService'; // Corrigindo o caminho de importação

const Container = styled.div`
  width: 100%;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f8f9fa;
  position: relative;
  overflow-x: hidden; /* Prevenir scroll horizontal */
`;

const LoginButton = styled.button`
  position: absolute;
  top: 20px;
  right: 20px;
  background-color: #000033;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
  color: white;
  font-size: 14px;
  padding: 10px 16px;
  border-radius: 8px;
  font-weight: 500;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 51, 0.2);
  
  &:hover {
    background-color: #000066;
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0, 0, 51, 0.3);
  }
  
  @media (max-width: 768px) {
    top: 15px;
    right: 15px;
    padding: 8px 12px;
    font-size: 13px;
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: flex-start;
  padding: 0;
  width: 100%;
  max-width: 400px;
  margin: 0 auto;
  background-color: transparent;
  
  @media (max-width: 480px) {
    max-width: 100%;
    padding: 0 10px;
  }
`;

const LogoContainer = styled.div`
  width: 400px;
  height: 120px;
  background-image: url(${LogoImage});
  background-size: contain;
  background-position: center;
  background-repeat: no-repeat;
  margin: 20px auto;
  background-color: transparent;
  padding: 0;
  
  @media (max-width: 480px) {
    width: calc(100% - 20px);
    height: 100px;
    margin: 15px auto;
  }
`;

const FormContainer = styled.div`
  max-width: 400px;
  margin: 10px auto 0 auto;
  padding: 30px;
  width: 100%;
  background-color: white;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  position: relative;
  
  @media (max-width: 480px) {
    padding: 20px;
    max-width: 100%;
    margin: 10px;
    border-radius: 12px;
  }
`;

const FormTitle = styled.h2`
  color: #333;
  text-align: left;
  margin-bottom: 15px;
  font-size: 1rem;
  font-weight: 500;
  
  @media (max-width: 480px) {
    font-size: 0.9rem;
    margin-bottom: 10px;
  }
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 10px;
  
  @media (max-width: 480px) {
    gap: 10px;
  }
`;

const Input = styled.input`
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  color: #000;
  &::placeholder {
    color: #666;
  }
  
  @media (max-width: 480px) {
    padding: 10px;
    font-size: 13px;
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  color: #000;
  background-color: white;
  appearance: none;
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 12px center;
  background-size: 16px;

  option {
    color: #000;
  }
  
  @media (max-width: 480px) {
    padding: 10px;
    font-size: 13px;
    background-position: right 10px center;
    background-size: 14px;
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  min-height: 100px;
  resize: vertical;
  color: #000;
  &::placeholder {
    color: #666;
  }
  
  @media (max-width: 480px) {
    padding: 10px;
    font-size: 13px;
    min-height: 80px;
  }
`;

const Button = styled.button`
  width: 100%;
  padding: 12px;
  background-color: #000033;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  text-transform: uppercase;
  margin-top: 4px;
  
  @media (max-width: 480px) {
    padding: 10px;
    font-size: 13px;
  }
`;

const ErrorText = styled.span`
  color: #ff4444;
  font-size: 12px;
  margin-top: -8px;
  margin-bottom: 8px;
  
  @media (max-width: 480px) {
    font-size: 11px;
    margin-top: -6px;
    margin-bottom: 6px;
  }
`;

const InfoText = styled.span`
  font-size: 14px;
  margin-bottom: 8px;
  display: block;
  
  @media (max-width: 480px) {
    font-size: 13px;
    margin-bottom: 6px;
  }
`;

function AgendamentoForm() {
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [availableTimes, setAvailableTimes] = useState([]);
  const [errors, setErrors] = useState({});
  const [selectedCityDoctor, setSelectedCityDoctor] = useState(''); // Estado para armazenar o médico da cidade selecionada
  const [isLoading, setIsLoading] = useState(true); // Estado para controlar o carregamento
  const [isEditMode, setIsEditMode] = useState(false); // Estado para controlar o modo de edição

  const { 
    cities, 
    availableDates,
    scheduleConfigs,
    fetchScheduleConfigs,
    createAppointment,
    doctors,
    fetchCities,
    fetchAvailableDates,
    notifyNewAppointment
  } = useStore();

  const navigate = useNavigate();

  useEffect(() => {
    // Verificar se estamos em modo de edição (se temos um ID de agendamento na URL)
    const urlParams = new URLSearchParams(window.location.search);
    const appointmentId = urlParams.get('id');
    setIsEditMode(!!appointmentId);
    
    // Função para carregar todos os dados necessários
    const loadAllData = async () => {
      setIsLoading(true);
      try {

        // Carregar dados em paralelo para melhor performance
        await Promise.all([
          fetchScheduleConfigs(),
          fetchCities(),
          fetchAvailableDates()
        ]);
        
        // Se estiver em modo de edição, carregar os dados do agendamento
        if (appointmentId) {
          try {
            const appointmentData = await firebaseService.getAppointmentById(appointmentId);
            if (appointmentData) {
              setName(appointmentData.nome || '');
              setPhone(appointmentData.telefone || '');
              setAdditionalInfo(appointmentData.observacoes || appointmentData.informacoes || '');
              setSelectedCity(appointmentData.cidadeId || '');
              setSelectedDate(appointmentData.dataId || '');
              setSelectedTime(appointmentData.horario || '');
            }
          } catch (error) {
            console.error("Erro ao carregar dados do agendamento:", error);
            toast.error("Erro ao carregar dados do agendamento.");
          }
        }

      } catch (error) {
        console.error("Erro ao carregar dados iniciais:", error);
        toast.error("Erro ao carregar dados. Por favor, recarregue a página.");
      } finally {
        setIsLoading(false);
      }
    };
    
    loadAllData();
  }, [fetchScheduleConfigs, fetchCities, fetchAvailableDates]);

  // useEffect(() => {
    // Carregar todas as configurações necessárias quando o componente montar
    // fetchScheduleConfigs();
    // fetchCities();
    // fetchAvailableDates();
    
    // Adicionar logs para depuração
    // }, []);

  useEffect(() => {
    if (selectedCity && selectedDate) {
      const cityConfig = scheduleConfigs[selectedCity];
      if (cityConfig) {
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

          while (
            currentHours < endHours || 
            (currentHours === endHours && currentMinutes < endMinutes)
          ) {
            const timeStr = formatTime(currentHours, currentMinutes);

            slots.push(timeStr);
            
            // Avançar para o próximo horário
            currentMinutes += interval;
            if (currentMinutes >= 60) {
              currentHours += Math.floor(currentMinutes / 60);
              currentMinutes %= 60;
            }
          }
        };

        // Garantir que o horário da manhã comece às 08:00
        const horarios = {
          manhaInicio: cityConfig.horarios?.manhaInicio || '08:00',
          manhaFim: cityConfig.horarios?.manhaFim || '12:00',
          tardeInicio: cityConfig.horarios?.tardeInicio || '14:00',
          tardeFim: cityConfig.horarios?.tardeFim || '18:00'
        };

        if (cityConfig.periodoManha) {

          addTimeSlots(horarios.manhaInicio, horarios.manhaFim, cityConfig.intervalo);
        }
        if (cityConfig.periodoTarde) {

          addTimeSlots(horarios.tardeInicio, horarios.tardeFim, cityConfig.intervalo);
        }

        // Buscar horários já agendados e filtrar da lista
        const fetchBookedTimes = async () => {
          try {
            // Buscar cidade e data pelo ID
            const cityDoc = await firebaseService.getCityById(selectedCity);
            const dateDoc = await firebaseService.getAvailableDateById(selectedDate);
            
            if (cityDoc && dateDoc) {
              const cityName = cityDoc.name || cityDoc.nome;
              const dateString = dateDoc.data;

              // Buscar horários já agendados
              const bookedTimes = await firebaseService.getBookedTimes(cityName, dateString);

              // Filtrar os horários disponíveis, removendo os já agendados
              const availableSlots = slots.filter(slot => !bookedTimes.includes(slot));

              setAvailableTimes(availableSlots);
            } else {
              setAvailableTimes(slots);
            }
          } catch (error) {
            console.error('[AgendamentoForm] Erro ao buscar horários agendados:', error);
            setAvailableTimes(slots);
          }
        };
        
        fetchBookedTimes();
      } else {
        setAvailableTimes([]);
      }
    } else {
      setAvailableTimes([]);
    }
  }, [selectedCity, selectedDate, scheduleConfigs]);

  // Efeito para buscar o médico associado à cidade selecionada
  useEffect(() => {
    const fetchCityDoctor = async () => {
      if (selectedCity) {
        try {
          // Buscar datas disponíveis para a cidade selecionada
          const cityDoc = await firebaseService.getCityById(selectedCity);
          if (!cityDoc) return;
          
          const cityName = cityDoc.name || cityDoc.nome;
          
          // Filtrar datas disponíveis para esta cidade
          const cityDates = availableDates.filter(date => {
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
          
          // Se encontrou alguma data para esta cidade, pegar o médico da primeira data
          if (cityDates.length > 0) {
            setSelectedCityDoctor(cityDates[0].medico);
          } else {
            setSelectedCityDoctor('');
          }
        } catch (error) {
          console.error('Erro ao buscar médico da cidade:', error);
          setSelectedCityDoctor('');
        }
      } else {
        setSelectedCityDoctor('');
      }
    };
    
    fetchCityDoctor();
  }, [selectedCity, availableDates]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = {};

    // Se não estiver em modo de edição, validar todos os campos
    if (!isEditMode) {
      if (!selectedCity) errors.city = 'Selecione uma cidade';
      if (!selectedDate) errors.date = 'Selecione uma data';
      if (!selectedTime) errors.time = 'Selecione um horário';
    }
    
    // Sempre validar nome e telefone
    if (!name.trim()) errors.name = 'Digite seu nome';
    
    // Validação de telefone
    if (!phone.trim()) {
      errors.phone = 'Digite seu telefone';
    } else {
      // Remove caracteres não numéricos para verificar o comprimento
      const phoneDigits = phone.replace(/\D/g, '');
      if (phoneDigits.length < 10 || phoneDigits.length > 11) {
        errors.phone = 'Telefone deve ter 10 ou 11 dígitos (com DDD)';
      }
    }

    if (Object.keys(errors).length > 0) {
      setErrors(errors);
      return;
    }

    try {
      // Obter o ID do agendamento da URL, se estiver em modo de edição
      const urlParams = new URLSearchParams(window.location.search);
      const appointmentId = urlParams.get('id');
      
      if (isEditMode && appointmentId) {
        // Se estiver em modo de edição, apenas atualizar nome, telefone e informações adicionais
        const appointmentData = {
          nome: name,
          telefone: phone,
          observacoes: additionalInfo || '',
          atualizadoEm: new Date().toISOString()
        };

        await firebaseService.updateAppointment(appointmentId, appointmentData);
        toast.success('Agendamento atualizado com sucesso!');
      } else {
        // Se for um novo agendamento

        // Buscar cidade e data diretamente do Firestore usando os IDs
        const cityDoc = await firebaseService.getCityById(selectedCity);
        const dateDoc = await firebaseService.getAvailableDateById(selectedDate);

        if (!cityDoc || !dateDoc) {
          throw new Error('Cidade ou data não encontrada');
        }
        
        const appointmentData = {
          cidade: cityDoc.name || cityDoc.nome,
          cidadeId: selectedCity,
          data: dateDoc.data,
          dataId: selectedDate,
          horario: selectedTime,
          nome: name,
          telefone: phone,
          informacoes: additionalInfo || '',
          status: 'pendente',
          criadoEm: new Date().toISOString()
        };

        await createAppointment(appointmentData);
        toast.success('Consulta agendada com sucesso! Aguarde a confirmação via WhatsApp.');
      }
      
      // Notificar sobre o novo agendamento para atualizar contadores em outros componentes
      notifyNewAppointment();

      toast.success('Consulta agendada com sucesso! Aguarde a confirmação via WhatsApp.');
      setSelectedCity('');
      setSelectedDate('');
      setSelectedTime('');
      setName('');
      setPhone('');
      setAdditionalInfo('');
      setErrors({});
    } catch (error) {
      console.error('Erro ao agendar consulta:', error);
      
      // Verificar se é um erro de horário já agendado
      if (error.message && error.message.includes('horário já está agendado')) {
        toast.error(error.message);
        // Destacar o campo de horário com erro
        setErrors(prev => ({ ...prev, time: 'Este horário já está agendado' }));
      } else {
        toast.error(error.message || 'Erro ao agendar consulta');
      }
    }
  };

  // Função para formatar o telefone
  const formatPhoneNumber = (value) => {
    // Remove todos os caracteres não numéricos
    const phoneDigits = value.replace(/\D/g, '');
    
    // Aplica a formatação dependendo do comprimento
    if (phoneDigits.length <= 2) {
      return phoneDigits;
    } else if (phoneDigits.length <= 6) {
      return `(${phoneDigits.slice(0, 2)}) ${phoneDigits.slice(2)}`;
    } else if (phoneDigits.length <= 10) {
      return `(${phoneDigits.slice(0, 2)}) ${phoneDigits.slice(2, 6)}-${phoneDigits.slice(6, 10)}`;
    } else {
      return `(${phoneDigits.slice(0, 2)}) ${phoneDigits.slice(2, 7)}-${phoneDigits.slice(7, 11)}`;
    }
  };
  
  // Handler para mudança no campo de telefone
  const handlePhoneChange = (e) => {
    const formattedPhone = formatPhoneNumber(e.target.value);
    setPhone(formattedPhone);
    
    // Limpa o erro se o campo for preenchido corretamente
    if (errors.phone && formattedPhone.replace(/\D/g, '').length >= 10) {
      setErrors(prev => ({ ...prev, phone: undefined }));
    }
  };

  return (
    <Container>
      <LoginButton onClick={() => navigate('/login')}>
        <FaUser style={{ fontSize: '16px' }} />
        Login
      </LoginButton>

      <Header>
        <LogoContainer />
      </Header>

      <FormContainer>
        <FormTitle>Agendar Consulta</FormTitle>
        
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <p>Carregando dados...</p>
          </div>
        ) : cities.length === 0 || availableDates.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <p>Não foi possível carregar os dados necessários.</p>
            <Button onClick={() => window.location.reload()}>
              Tentar Novamente
            </Button>
          </div>
        ) : (
          <Form onSubmit={handleSubmit}>
            <Select
              value={selectedCity}
              onChange={(e) => {
                setSelectedCity(e.target.value);
                // Limpar data e horário quando mudar a cidade
                setSelectedDate('');
                setSelectedTime('');
                setAvailableTimes([]);
                
                // Atualizar o nome da cidade selecionada
                if (e.target.value) {
                  const city = cities.find(c => c.id === e.target.value);
                  if (city) {
                    setSelectedCityName(city.name || city.nome);
                  }
                } else {
                  setSelectedCityName('');
                }
              }}
              error={errors.city}
              disabled={isEditMode} // Desabilitar se estiver em modo de edição
            >
              <option value="">Selecione uma cidade</option>
              {cities.map(city => (
                <option key={city.id} value={city.id}>
                  {city.name}
                </option>
              ))}
            </Select>
            {errors.city && <ErrorText>{errors.city}</ErrorText>}
            
            {selectedCityDoctor && (
              <InfoText>
                <strong>Médico:</strong> {selectedCityDoctor}
              </InfoText>
            )}

            <Select
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                setSelectedTime('');
              }}
              disabled={!selectedCity}
              error={errors.date}
            >
              <option value="">Selecione uma data</option>
              {availableDates
                .filter(date => {
                  const selectedCityName = cities.find(c => c.id.toString() === selectedCity)?.name;

                  // Normalizar os nomes das cidades para comparação (remover acentos, converter para minúsculas)
                  const normalizeString = (str) => {
                    return str
                      ? str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
                      : '';
                  };
                  
                  const normalizedDateCity = normalizeString(date.cidade);
                  const normalizedSelectedCity = normalizeString(selectedCityName);
                  
                  // Verificar se a data é para a cidade selecionada e ainda está disponível
                  const matchesCity = normalizedDateCity === normalizedSelectedCity;
                  const isAvailable = date.status === 'Disponível';

                  return matchesCity && isAvailable;
                  // Nota: A verificação da data já foi feita na função getAvailableDates
                  // Então aqui só precisamos verificar o status que já foi atualizado
                })
                // Ordenar as datas em ordem crescente (da mais próxima para a mais distante)
                .sort((a, b) => {
                  // Converter as strings de data para objetos Date para comparação
                  const [dayA, monthA, yearA] = a.data.split('/').map(Number);
                  const [dayB, monthB, yearB] = b.data.split('/').map(Number);
                  
                  const dateA = new Date(yearA, monthA - 1, dayA);
                  const dateB = new Date(yearB, monthB - 1, dayB);
                  
                  return dateA - dateB; // Ordem crescente
                })
                .map(date => {
                  // Adicionar o dia da semana à data
                  const [day, month, year] = date.data.split('/').map(Number);
                  const dateObj = new Date(year, month - 1, day);
                  
                  // Array com os nomes dos dias da semana em português
                  const weekdays = [
                    'Domingo', 'Segunda-feira', 'Terça-feira', 
                    'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'
                  ];
                  
                  const weekday = weekdays[dateObj.getDay()];
                  const formattedDate = `${date.data} ${weekday}`;
                  
                  return (
                    <option key={date.id} value={date.id}>
                      {formattedDate}
                    </option>
                  );
                })}
            </Select>
            {errors.date && <ErrorText>{errors.date}</ErrorText>}

            <Select
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
              error={errors.time}
              disabled={!selectedCity || !selectedDate || availableTimes.length === 0 || isEditMode} // Desabilitar se estiver em modo de edição
            >
              <option value="">Selecione um horário</option>
              {availableTimes.map(time => (
                <option key={time} value={time}>
                  {time}
                </option>
              ))}
            </Select>
            {errors.time && <ErrorText>{errors.time}</ErrorText>}

            <Input
              type="text"
              placeholder="Nome do paciente"
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={errors.name}
            />
            {errors.name && <ErrorText>{errors.name}</ErrorText>}

            <Input
              type="tel"
              placeholder="Telefone"
              value={phone}
              onChange={handlePhoneChange}
              error={errors.phone}
            />
            {errors.phone && <ErrorText>{errors.phone}</ErrorText>}

            <TextArea
              placeholder="Informações adicionais"
              value={additionalInfo}
              onChange={(e) => setAdditionalInfo(e.target.value)}
            />

            <Button type="submit">
              Agendar Consulta
            </Button>
          </Form>
        )}
      </FormContainer>
    </Container>
  );
}

export default AgendamentoForm;

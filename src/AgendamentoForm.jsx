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
  background-color: white;
  position: relative;
`;

const LoginButton = styled.button`
  position: absolute;
  top: 20px;
  right: 20px;
  background: none;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
  color: #000033;
  font-size: 14px;
  padding: 5px 10px;
  border-radius: 4px;

  &:hover {
    background-color: rgba(0, 0, 51, 0.1);
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
`;

const LogoContainer = styled.div`
  width: 100%;
  height: 200px;
  background-image: url(${LogoImage});
  background-size: contain;
  background-position: center;
  background-repeat: no-repeat;
  margin-bottom: 20px;
  background-color: #000033;
  border-radius: 4px;
  padding: 20px;
`;

const FormContainer = styled.div`
  max-width: 400px;
  margin: 0 auto;
  padding: 20px;
  width: 100%;
`;

const FormTitle = styled.h2`
  color: #333;
  text-align: left;
  margin-bottom: 15px;
  font-size: 1rem;
  font-weight: 500;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 12px;
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
`;

const ErrorText = styled.span`
  color: #ff4444;
  font-size: 12px;
  margin-top: -8px;
  margin-bottom: 8px;
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
  
  const { 
    cities, 
    availableDates,
    scheduleConfigs,
    fetchScheduleConfigs,
    createAppointment 
  } = useStore();

  const navigate = useNavigate();

  useEffect(() => {
    fetchScheduleConfigs();
  }, [fetchScheduleConfigs]);

  useEffect(() => {
    if (selectedCity && selectedDate) {
      const cityConfig = scheduleConfigs[selectedCity];
      if (cityConfig) {
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
            const cityDoc = await firebaseService.getCityById(selectedCity);
            const dateDoc = await firebaseService.getAvailableDateById(selectedDate);
            
            if (cityDoc && dateDoc) {
              const cityName = cityDoc.name || cityDoc.nome;
              const dateString = dateDoc.data;
              
              // Buscar horários já agendados
              const bookedTimes = await firebaseService.getBookedTimes(cityName, dateString);
              
              // Filtrar os horários disponíveis, removendo os já agendados
              const availableSlots = slots.filter(slot => !bookedTimes.includes(slot));
              
              console.log(`Total de horários: ${slots.length}, Disponíveis: ${availableSlots.length}`);
              setAvailableTimes(availableSlots);
            } else {
              setAvailableTimes(slots);
            }
          } catch (error) {
            console.error('Erro ao buscar horários agendados:', error);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = {};

    if (!selectedCity) errors.city = 'Selecione uma cidade';
    if (!selectedDate) errors.date = 'Selecione uma data';
    if (!selectedTime) errors.time = 'Selecione um horário';
    if (!name.trim()) errors.name = 'Digite seu nome';
    if (!phone.trim()) errors.phone = 'Digite seu telefone';

    if (Object.keys(errors).length > 0) {
      setErrors(errors);
      return;
    }

    try {
      console.log('Tentando agendar consulta com os seguintes dados:');
      console.log('Cidades disponíveis:', cities);
      console.log('Datas disponíveis:', availableDates);
      console.log('ID da cidade selecionada:', selectedCity);
      console.log('ID da data selecionada:', selectedDate);
      
      // Buscar cidade e data diretamente do Firestore usando os IDs
      const cityDoc = await firebaseService.getCityById(selectedCity);
      const dateDoc = await firebaseService.getAvailableDateById(selectedDate);
      
      console.log('Documento da cidade:', cityDoc);
      console.log('Documento da data:', dateDoc);
      
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
        status: 'Agendado',
        criadoEm: new Date().toISOString()
      };
      
      console.log('Dados do agendamento:', appointmentData);
      
      await createAppointment(appointmentData);

      toast.success('Consulta agendada com sucesso!');
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

  return (
    <Container>
      <LoginButton onClick={() => navigate('/login')}>
        <FaUser />
        Login
      </LoginButton>

      <Header>
        <LogoContainer />
      </Header>

      <FormContainer>
        <FormTitle>Agendar Consulta</FormTitle>
        <Form onSubmit={handleSubmit}>
          <Select 
            value={selectedCity}
            onChange={(e) => {
              setSelectedCity(e.target.value);
              setSelectedDate('');
              setSelectedTime('');
            }}
            error={errors.city}
          >
            <option value="">Selecione uma cidade</option>
            {cities.map(city => (
              <option key={city.id} value={city.id}>
                {city.name}
              </option>
            ))}
          </Select>
          {errors.city && <ErrorText>{errors.city}</ErrorText>}

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
                console.log(`Filtrando data: ${JSON.stringify(date)}, Cidade selecionada: ${selectedCityName}`);
                
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
                
                console.log(`Data ${date.data} - Cidade da data: ${normalizedDateCity}, Cidade selecionada: ${normalizedSelectedCity}, Corresponde: ${matchesCity}, Status: ${date.status}`);
                
                return matchesCity && isAvailable;
                // Nota: A verificação da data já foi feita na função getAvailableDates
                // Então aqui só precisamos verificar o status que já foi atualizado
              })
              .map(date => (
                <option key={date.id} value={date.id}>
                  {date.data}
                </option>
              ))}
          </Select>
          {errors.date && <ErrorText>{errors.date}</ErrorText>}

          <Select
            value={selectedTime}
            onChange={(e) => setSelectedTime(e.target.value)}
            error={errors.time}
            disabled={!selectedCity || !selectedDate}
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
            onChange={(e) => setPhone(e.target.value)}
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
      </FormContainer>
    </Container>
  );
}

export default AgendamentoForm;

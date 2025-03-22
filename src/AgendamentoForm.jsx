import React, { useState, useCallback } from 'react';
import styled from 'styled-components';
import useStore from './store/useStore';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import LogoImage from './assets/logo/logo new.png';
import { FaUser } from 'react-icons/fa';

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

const FormatText = styled.div`
  color: #666;
  font-size: 12px;
  margin-top: -8px;
  margin-bottom: 4px;
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

const ErrorMessage = styled.span`
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
  const [errors, setErrors] = useState({});
  
  const { 
    cities, 
    doctors, 
    availableDates,
    addAppointment,
    setIsLoading 
  } = useStore();

  const navigate = useNavigate();

  const filteredDates = availableDates.filter(date => {
    const selectedCityName = cities.find(c => c.id === parseInt(selectedCity))?.name;
    return date.cidade === selectedCityName && date.status === 'Disponível';
  });

  const selectedCityDoctor = filteredDates[0]?.medico || '';

  const validateForm = useCallback(() => {
    const newErrors = {};
    if (!selectedCity) newErrors.city = 'Selecione uma cidade';
    if (!selectedDate) newErrors.date = 'Selecione uma data';
    if (!selectedTime) newErrors.time = 'Selecione um horário';
    if (!name.trim()) newErrors.name = 'Digite seu nome';
    if (!phone.trim()) newErrors.phone = 'Digite seu telefone';
    if (phone.trim() && !/^\(\d{2}\) \d{4,5}-\d{4}$/.test(phone)) {
      newErrors.phone = 'Formato inválido. Use (99) 99999-9999';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [selectedCity, selectedDate, selectedTime, name, phone]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const selectedCityName = cities.find(c => c.id === parseInt(selectedCity))?.name;
      
      await addAppointment({
        cidade: selectedCityName,
        medico: selectedCityDoctor,
        data: filteredDates.find(date => date.id === parseInt(selectedDate))?.data,
        horario: selectedTime,
        paciente: name,
        telefone: phone,
        status: 'Agendado',
        infoAdicional: additionalInfo
      });

      toast.success('Consulta agendada com sucesso!');
      setSelectedCity('');
      setSelectedDate('');
      setSelectedTime('');
      setName('');
      setPhone('');
      setAdditionalInfo('');
      setErrors({});
    } catch (error) {
      toast.error('Erro ao agendar consulta');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhoneChange = (e) => {
    let value = e.target.value;
    value = value
      .replace(/\D/g, '')
      .replace(/^(\d{2})(\d)/g, '($1) $2')
      .replace(/(\d)(\d{4})$/, '$1-$2')
      .slice(0, 15);
    setPhone(value);
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
          {errors.city && <ErrorMessage>{errors.city}</ErrorMessage>}
          {selectedCity && selectedCityDoctor && (
            <p>Médico: {selectedCityDoctor}</p>
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
            {filteredDates.map(date => (
              <option key={date.id} value={date.id}>
                {date.data}
              </option>
            ))}
          </Select>
          {errors.date && <ErrorMessage>{errors.date}</ErrorMessage>}

          <Select 
            value={selectedTime}
            onChange={(e) => setSelectedTime(e.target.value)}
            disabled={!selectedDate}
            error={errors.time}
          >
            <option value="">Selecione um horário</option>
            {['08:00', '09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'].map(time => (
              <option key={time} value={time}>
                {time}
              </option>
            ))}
          </Select>
          {errors.time && <ErrorMessage>{errors.time}</ErrorMessage>}

          <Input
            type="text"
            placeholder="Nome do paciente"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={errors.name}
          />
          {errors.name && <ErrorMessage>{errors.name}</ErrorMessage>}

          <Input
            type="text"
            placeholder="Telefone"
            value={phone}
            onChange={handlePhoneChange}
            error={errors.phone}
          />
          {errors.phone && <ErrorMessage>{errors.phone}</ErrorMessage>}
          <FormatText>Formato: (99) 99999-9999</FormatText>

          <TextArea
            placeholder="Informações adicionais"
            value={additionalInfo}
            onChange={(e) => setAdditionalInfo(e.target.value)}
          />

          <Button type="submit">AGENDAR CONSULTA</Button>
        </Form>
      </FormContainer>
    </Container>
  );
}

export default AgendamentoForm;

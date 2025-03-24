import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FaTimes } from 'react-icons/fa';
import { isFirestoreTimestamp, timestampToDate } from '../utils/firebaseUtils';

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
  width: 500px;
  max-width: 90%;
`;

const ModalHeader = styled.div`
  margin-bottom: 20px;
  h2 {
    margin: 0;
    font-size: 1.5rem;
  }
`;

const PeriodSection = styled.div`
  margin-bottom: 20px;
`;

const TimeInputGroup = styled.div`
  display: flex;
  gap: 20px;
  margin-top: 10px;
`;

const TimeInput = styled.div`
  flex: 1;
  label {
    display: block;
    margin-bottom: 5px;
    color: #666;
    font-size: 14px;
  }
  input {
    width: 100%;
    padding: 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
  }
`;

const Switch = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;

  input[type="checkbox"] {
    appearance: none;
    width: 50px;
    height: 24px;
    background-color: #ddd;
    border-radius: 12px;
    position: relative;
    cursor: pointer;
    transition: background-color 0.3s;

    &:checked {
      background-color: #000080;
    }

    &:before {
      content: '';
      position: absolute;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      top: 2px;
      left: 2px;
      background-color: white;
      transition: transform 0.3s;
    }

    &:checked:before {
      transform: translateX(26px);
    }
  }

  span {
    font-weight: 500;
  }
`;

const IntervalSelect = styled.select`
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  margin-top: 10px;
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
`;

const Button = styled.button`
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  
  &.cancel {
    background-color: transparent;
    color: #666;
    &:hover {
      background-color: #f5f5f5;
    }
  }
  
  &.save {
    background-color: #000080;
    color: white;
    &:hover {
      background-color: #000066;
    }
  }
`;

const ConfigurarHorariosModal = ({ isOpen, onClose, cidade, onSave, initialConfig }) => {
  const [periodoManha, setPeriodoManha] = useState(true);
  const [periodoTarde, setPeriodoTarde] = useState(true);
  const [horarios, setHorarios] = useState({
    manhaInicio: '09:00',
    manhaFim: '12:00',
    tardeInicio: '14:00',
    tardeFim: '17:00'
  });
  const [intervalo, setIntervalo] = useState('10');

  useEffect(() => {
    // Verificação mais segura para evitar erros com objetos undefined
    if (initialConfig && 
        typeof initialConfig === 'object' && 
        initialConfig !== null) {
      
      // Verificar e definir periodoManha com valor padrão
      const periodoManhaValue = initialConfig.periodoManha !== undefined ? 
        initialConfig.periodoManha : true;
      setPeriodoManha(periodoManhaValue);
      
      // Verificar e definir periodoTarde com valor padrão
      const periodoTardeValue = initialConfig.periodoTarde !== undefined ? 
        initialConfig.periodoTarde : true;
      setPeriodoTarde(periodoTardeValue);
      
      // Verificar e definir horários com valores padrão
      const horariosObj = initialConfig.horarios && typeof initialConfig.horarios === 'object' ? 
        initialConfig.horarios : {};
        
      setHorarios({
        manhaInicio: horariosObj.manhaInicio || '09:00',
        manhaFim: horariosObj.manhaFim || '12:00',
        tardeInicio: horariosObj.tardeInicio || '14:00',
        tardeFim: horariosObj.tardeFim || '17:00'
      });
      
      // Verificar e definir intervalo com valor padrão
      const intervaloValue = initialConfig.intervalo || '10';
      setIntervalo(intervaloValue);
    }
  }, [initialConfig]);

  if (!isOpen) return null;

  const handleSave = () => {
    const configuracao = {
      cidade,
      periodoManha,
      periodoTarde,
      horarios,
      intervalo: parseInt(intervalo)
    };
    onSave(configuracao);
    onClose();
  };

  return (
    <ModalOverlay onClick={(e) => e.target === e.currentTarget && onClose()}>
      <ModalContent>
        <ModalHeader>
          <h2>Configurar Horários de Atendimento</h2>
          <p>{cidade} -</p>
        </ModalHeader>

        <PeriodSection>
          <Switch>
            <input
              type="checkbox"
              checked={periodoManha}
              onChange={(e) => setPeriodoManha(e.target.checked)}
            />
            <span>Período da Manhã</span>
          </Switch>
          {periodoManha && (
            <TimeInputGroup>
              <TimeInput>
                <label>Início</label>
                <input
                  type="time"
                  value={horarios.manhaInicio}
                  onChange={(e) => setHorarios(prev => ({
                    ...prev,
                    manhaInicio: e.target.value
                  }))}
                />
              </TimeInput>
              <TimeInput>
                <label>Fim</label>
                <input
                  type="time"
                  value={horarios.manhaFim}
                  onChange={(e) => setHorarios(prev => ({
                    ...prev,
                    manhaFim: e.target.value
                  }))}
                />
              </TimeInput>
            </TimeInputGroup>
          )}
        </PeriodSection>

        <PeriodSection>
          <Switch>
            <input
              type="checkbox"
              checked={periodoTarde}
              onChange={(e) => setPeriodoTarde(e.target.checked)}
            />
            <span>Período da Tarde</span>
          </Switch>
          {periodoTarde && (
            <TimeInputGroup>
              <TimeInput>
                <label>Início</label>
                <input
                  type="time"
                  value={horarios.tardeInicio}
                  onChange={(e) => setHorarios(prev => ({
                    ...prev,
                    tardeInicio: e.target.value
                  }))}
                />
              </TimeInput>
              <TimeInput>
                <label>Fim</label>
                <input
                  type="time"
                  value={horarios.tardeFim}
                  onChange={(e) => setHorarios(prev => ({
                    ...prev,
                    tardeFim: e.target.value
                  }))}
                />
              </TimeInput>
            </TimeInputGroup>
          )}
        </PeriodSection>

        <div>
          <label>Intervalo entre Horários</label>
          <IntervalSelect
            value={intervalo}
            onChange={(e) => setIntervalo(e.target.value)}
          >
            <option value="10">10 minutos</option>
            <option value="15">15 minutos</option>
            <option value="20">20 minutos</option>
            <option value="30">30 minutos</option>
            <option value="60">1 hora</option>
          </IntervalSelect>
        </div>

        <ButtonGroup>
          <Button className="cancel" onClick={onClose}>
            CANCELAR
          </Button>
          <Button className="save" onClick={handleSave}>
            SALVAR
          </Button>
        </ButtonGroup>
      </ModalContent>
    </ModalOverlay>
  );
};

export default ConfigurarHorariosModal;

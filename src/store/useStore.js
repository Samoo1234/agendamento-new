import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import * as firebaseService from '../services/firebaseService';

const useStore = create(
  persist(
    (set, get) => ({
      // Auth State
      isAuthenticated: false,
      user: null,
      login: (userData) => set({ isAuthenticated: true, user: userData }),
      logout: () => set({ isAuthenticated: false, user: null }),
      updateCurrentUser: (userData) => set({ user: userData }),

      // Usuários
      users: [],
      fetchUsers: async () => {
        try {
          set({ isLoading: true });
          const users = await firebaseService.getUsers();
          set({ users });
        } catch (error) {
          set({ error: error.message });
        } finally {
          set({ isLoading: false });
        }
      },
      addUser: async (userData) => {
        try {
          set({ isLoading: true });
          const newUser = await firebaseService.addUser(userData);
          set((state) => ({ users: [...state.users, newUser] }));
        } catch (error) {
          set({ error: error.message });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },
      updateUser: async (id, userData) => {
        try {
          set({ isLoading: true });
          const updatedUser = await firebaseService.updateUser(id, userData);
          set((state) => ({
            users: state.users.map(user => user.id === id ? updatedUser : user)
          }));
        } catch (error) {
          set({ error: error.message });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },
      deleteUser: async (id) => {
        try {
          set({ isLoading: true });
          await firebaseService.deleteUser(id);
          set((state) => ({
            users: state.users.filter(user => user.id !== id)
          }));
        } catch (error) {
          set({ error: error.message });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      // Médicos
      doctors: [],
      fetchDoctors: async () => {
        try {
          console.log('Buscando médicos...');
          set({ isLoading: true });
          const doctors = await firebaseService.getDoctors();
          console.log('Médicos encontrados:', doctors);
          set({ doctors });
        } catch (error) {
          console.error('Erro ao buscar médicos:', error);
          set({ error: error.message });
        } finally {
          set({ isLoading: false });
        }
      },
      addDoctor: async (doctorData) => {
        try {
          set({ isLoading: true });
          const newDoctor = await firebaseService.addDoctor(doctorData);
          set((state) => ({ doctors: [...state.doctors, newDoctor] }));
        } catch (error) {
          set({ error: error.message });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },
      updateDoctor: async (id, doctorData) => {
        try {
          set({ isLoading: true });
          const updatedDoctor = await firebaseService.updateDoctor(id, doctorData);
          set((state) => ({
            doctors: state.doctors.map(doctor => doctor.id === id ? updatedDoctor : doctor)
          }));
        } catch (error) {
          set({ error: error.message });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },
      deleteDoctor: async (id) => {
        try {
          set({ isLoading: true });
          await firebaseService.deleteDoctor(id);
          set((state) => ({
            doctors: state.doctors.filter(doctor => doctor.id !== id)
          }));
        } catch (error) {
          set({ error: error.message });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      // Cidades
      cities: [],
      fetchCities: async () => {
        try {
          console.log('Buscando cidades...');
          set({ isLoading: true });
          const cities = await firebaseService.getCities();
          console.log('Cidades encontradas:', cities);
          set({ cities });
        } catch (error) {
          console.error('Erro ao buscar cidades:', error);
          set({ error: error.message });
        } finally {
          set({ isLoading: false });
        }
      },
      addCity: async (cityData) => {
        try {
          set({ isLoading: true });
          const newCity = await firebaseService.addCity(cityData);
          set((state) => ({ cities: [...state.cities, newCity] }));
        } catch (error) {
          set({ error: error.message });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },
      updateCity: async (id, cityData) => {
        try {
          set({ isLoading: true });
          const updatedCity = await firebaseService.updateCity(id, cityData);
          set((state) => ({
            cities: state.cities.map(city => city.id === id ? updatedCity : city)
          }));
        } catch (error) {
          set({ error: error.message });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },
      deleteCity: async (id) => {
        try {
          set({ isLoading: true });
          await firebaseService.deleteCity(id);
          set((state) => ({
            cities: state.cities.filter(city => city.id !== id)
          }));
        } catch (error) {
          set({ error: error.message });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      // Datas Disponíveis
      availableDates: [],
      fetchAvailableDates: async () => {
        try {
          console.log('Buscando datas disponíveis...');
          set({ isLoading: true });
          const dates = await firebaseService.getAvailableDates();
          console.log('Datas encontradas:', dates);
          set({ availableDates: dates });
        } catch (error) {
          console.error('Erro ao buscar datas disponíveis:', error);
          set({ error: error.message });
        } finally {
          set({ isLoading: false });
        }
      },
      addAvailableDate: async (dateData) => {
        try {
          set({ isLoading: true });
          const newDate = await firebaseService.addAvailableDate(dateData);
          set((state) => ({ availableDates: [...state.availableDates, newDate] }));
        } catch (error) {
          set({ error: error.message });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },
      updateAvailableDate: async (id, dateData) => {
        try {
          set({ isLoading: true });
          const updatedDate = await firebaseService.updateAvailableDate(id, dateData);
          set((state) => ({
            availableDates: state.availableDates.map(date => date.id === id ? updatedDate : date)
          }));
        } catch (error) {
          set({ error: error.message });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },
      deleteAvailableDate: async (id) => {
        try {
          set({ isLoading: true });
          await firebaseService.deleteAvailableDate(id);
          set((state) => ({
            availableDates: state.availableDates.filter(date => date.id !== id)
          }));
        } catch (error) {
          set({ error: error.message });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      // Agendamentos
      appointments: [],
      // Contador para forçar atualizações quando novos agendamentos são criados
      appointmentUpdateCounter: 0,
      fetchAppointments: async () => {
        try {
          set({ isLoading: true });
          const appointments = await firebaseService.getAppointments();
          set({ appointments });
        } catch (error) {
          set({ error: error.message });
        } finally {
          set({ isLoading: false });
        }
      },
      
      // Notificar sobre novos agendamentos (usado para atualizar contadores)
      notifyNewAppointment: () => {
        console.log('Notificando sobre novo agendamento...');
        set((state) => ({
          appointmentUpdateCounter: state.appointmentUpdateCounter + 1
        }));
      },
      addAppointment: async (appointmentData) => {
        try {
          set({ isLoading: true });
          const newAppointment = await firebaseService.addAppointment(appointmentData);
          set((state) => ({ appointments: [...state.appointments, newAppointment] }));
        } catch (error) {
          set({ error: error.message });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },
      createAppointment: async (appointmentData) => {
        try {
          set({ isLoading: true });
          const newAppointment = await firebaseService.addAppointment(appointmentData);
          set((state) => ({ appointments: [...state.appointments, newAppointment] }));
          
          // Notificar sobre o novo agendamento para atualizar contadores
          get().notifyNewAppointment();
          
          return newAppointment;
        } catch (error) {
          console.error('Erro ao criar agendamento:', error);
          set({ error: error.message });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },
      updateAppointment: async (id, appointmentData) => {
        try {
          set({ isLoading: true });
          const updatedAppointment = await firebaseService.updateAppointment(id, appointmentData);
          set((state) => ({
            appointments: state.appointments.map(appointment => 
              appointment.id === id ? updatedAppointment : appointment
            )
          }));
        } catch (error) {
          set({ error: error.message });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },
      deleteAppointment: async (id) => {
        try {
          set({ isLoading: true });
          await firebaseService.deleteAppointment(id);
          set((state) => ({
            appointments: state.appointments.filter(appointment => appointment.id !== id)
          }));
        } catch (error) {
          set({ error: error.message });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      // Configurações de Horários
      scheduleConfigs: {},
      fetchScheduleConfigs: async () => {
        try {
          set({ isLoading: true });
          const configs = await firebaseService.getAllScheduleConfigs();
          const configsMap = configs.reduce((acc, config) => {
            acc[config.id] = config;
            return acc;
          }, {});
          set({ scheduleConfigs: configsMap });
        } catch (error) {
          set({ error: error.message });
        } finally {
          set({ isLoading: false });
        }
      },
      saveScheduleConfig: async (cityId, config) => {
        try {
          set({ isLoading: true });
          const savedConfig = await firebaseService.saveScheduleConfig(cityId, config);
          set((state) => ({
            scheduleConfigs: {
              ...state.scheduleConfigs,
              [cityId]: savedConfig
            }
          }));
        } catch (error) {
          set({ error: error.message });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },
      getScheduleConfig: async (cityId) => {
        try {
          set({ isLoading: true });
          const config = await firebaseService.getScheduleConfig(cityId);
          if (config) {
            set((state) => ({
              scheduleConfigs: {
                ...state.scheduleConfigs,
                [cityId]: config
              }
            }));
          }
          return config;
        } catch (error) {
          set({ error: error.message });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      // Estados de Loading e Error
      isLoading: false,
      setIsLoading: (isLoading) => set({ isLoading }),
      error: null,
      setError: (error) => set({ error }),

      // Módulo Financeiro
      registrosFinanceiros: [],
      registroFinanceiroSelecionado: null,
      cidadeFinanceiroSelecionada: null,
      dataFinanceiroSelecionada: null,
      
      setCidadeFinanceiroSelecionada: (cidadeId) => set({ cidadeFinanceiroSelecionada: cidadeId }),
      setDataFinanceiroSelecionada: (data) => set({ dataFinanceiroSelecionada: data }),
      
      fetchRegistrosFinanceiros: async (data, cidadeId) => {
        try {
          set({ isLoading: true });
          const registros = await firebaseService.getRegistrosFinanceiros(data, cidadeId);
          set({ 
            registrosFinanceiros: registros,
            dataFinanceiroSelecionada: data || get().dataFinanceiroSelecionada,
            cidadeFinanceiroSelecionada: cidadeId || get().cidadeFinanceiroSelecionada
          });
          return registros;
        } catch (error) {
          set({ error: error.message });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },
      
      getRegistroFinanceiroById: async (id) => {
        try {
          set({ isLoading: true });
          const registro = await firebaseService.getRegistroFinanceiroById(id);
          set({ registroFinanceiroSelecionado: registro });
          return registro;
        } catch (error) {
          set({ error: error.message });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },
      
      salvarRegistroFinanceiro: async (registro) => {
        try {
          set({ isLoading: true });
          const id = await firebaseService.salvarRegistroFinanceiro(registro);
          
          // Atualizar a lista de registros
          set((state) => {
            const registrosAtualizados = registro.id 
              ? state.registrosFinanceiros.map(r => r.id === registro.id ? { ...registro, id } : r)
              : [...state.registrosFinanceiros, { ...registro, id }];
              
            return { registrosFinanceiros: registrosAtualizados };
          });
          
          return id;
        } catch (error) {
          set({ error: error.message });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },
      
      excluirRegistroFinanceiro: async (id) => {
        try {
          set({ isLoading: true });
          await firebaseService.excluirRegistroFinanceiro(id);
          
          // Remover o registro da lista
          set((state) => ({
            registrosFinanceiros: state.registrosFinanceiros.filter(r => r.id !== id)
          }));
          
          return true;
        } catch (error) {
          set({ error: error.message });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },
      
      getAgendamentosPorData: async (data, cidadeId) => {
        try {
          set({ isLoading: true });
          const agendamentos = await firebaseService.getAgendamentosPorData(data, cidadeId);
          return agendamentos;
        } catch (error) {
          set({ error: error.message });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },
      
      // Função para buscar agendamentos históricos com filtros avançados
      getHistoricalAppointments: async (filters = {}) => {
        try {
          set({ isLoading: true });
          console.log('Buscando histórico de agendamentos com filtros:', filters);
          const appointments = await firebaseService.getHistoricalAppointments(filters);
          return appointments;
        } catch (error) {
          console.error('Erro ao buscar histórico de agendamentos:', error);
          set({ error: error.message });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },
      
      // Cálculos estatísticos para o relatório financeiro
      calcularEstatisticasFinanceiras: (registros) => {
        const estatisticas = {
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
        };
        
        registros.forEach(registro => {
          // Somar valores por tipo
          if (registro.valor) {
            estatisticas.totalGeral += Number(registro.valor);
            
            if (registro.tipo === 'Particular') {
              estatisticas.totalParticular += Number(registro.valor);
              estatisticas.countParticular++;
            } else if (registro.tipo === 'Convênio') {
              estatisticas.totalConvenio += Number(registro.valor);
              estatisticas.countConvenio++;
            } else if (registro.tipo === 'Campanha') {
              estatisticas.totalCampanha += Number(registro.valor);
              estatisticas.countCampanha++;
            }
            
            // Contar por forma de pagamento
            if (registro.formaPagamento === 'Dinheiro') {
              estatisticas.countDinheiro++;
            } else if (registro.formaPagamento === 'Cartão') {
              estatisticas.countCartao++;
            } else if (registro.formaPagamento === 'PIX/Pic pay') {
              estatisticas.countPix++;
            }
            
            // Contar por situação
            if (registro.situacao === 'Caso Clínico') {
              estatisticas.countCasosClinicos++;
            } else if (registro.situacao === 'ok') {
              estatisticas.countEfetivacoes++;
            } else {
              estatisticas.countPerdas++;
            }
            
            estatisticas.countTotal++;
          }
        });
        
        return estatisticas;
      }
    }),
    {
      name: 'agendamento-store'
    }
  )
);

export default useStore;
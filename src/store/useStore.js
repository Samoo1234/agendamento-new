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
          set({ isLoading: true });
          const doctors = await firebaseService.getDoctors();
          set({ doctors });
        } catch (error) {
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
          set({ isLoading: true });
          const cities = await firebaseService.getCities();
          set({ cities });
        } catch (error) {
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
          set({ isLoading: true });
          const dates = await firebaseService.getAvailableDates();
          set({ availableDates: dates });
        } catch (error) {
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
      setError: (error) => set({ error })
    }),
    {
      name: 'agendamento-store'
    }
  )
);

export default useStore;
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useStore = create(
  persist(
    (set) => ({
      // Auth State
      isAuthenticated: false,
      user: null,
      login: (userData) => set({ isAuthenticated: true, user: userData }),
      logout: () => set({ isAuthenticated: false, user: null }),

      // Users State
      users: [
        {
          id: 1,
          email: 'admin@admin.com',
          senha: 'admin123',
          cidade: 'Mantena',
          funcao: 'admin',
          status: true,
          dataCriacao: '20/03/2025'
        }
      ],
      addUser: (user) => set((state) => {
        const emailExists = state.users.some(u => u.email === user.email);
        if (emailExists) {
          throw new Error('Email já cadastrado');
        }
        return { users: [...state.users, user] };
      }),
      updateUser: (id, updatedUser) => set((state) => ({
        users: state.users.map(user =>
          user.id === id
            ? { ...user, ...updatedUser }
            : user
        )
      })),
      deleteUser: (id) => set((state) => {
        const user = state.users.find(u => u.id === id);
        if (user?.funcao === 'admin' && state.users.filter(u => u.funcao === 'admin').length === 1) {
          throw new Error('Não é possível excluir o último administrador');
        }
        return { users: state.users.filter(user => user.id !== id) };
      }),

      // Doctors State
      doctors: [],
      setDoctors: (doctors) => set({ doctors }),
      addDoctor: (doctor) => set((state) => ({ 
        doctors: [...state.doctors, {
          ...doctor,
          id: Date.now()
        }]
      })),
      updateDoctor: (id, updatedDoctor) => set((state) => ({
        doctors: state.doctors.map(doctor =>
          doctor.id === id
            ? { ...doctor, ...updatedDoctor }
            : doctor
        )
      })),
      deleteDoctor: (id) => set((state) => ({
        doctors: state.doctors.filter(doctor => doctor.id !== id)
      })),

      // Cities State
      cities: [],
      setCities: (cities) => set({ cities }),
      addCity: (city) => set((state) => ({ 
        cities: [...state.cities, { ...city, doctorIds: [] }]
      })),
      updateCity: (id, updatedCity) => set((state) => ({
        cities: state.cities.map(city =>
          city.id === id
            ? { ...city, ...updatedCity }
            : city
        )
      })),
      deleteCity: (id) => set((state) => ({
        cities: state.cities.filter(city => city.id !== id)
      })),

      // Available Dates State
      availableDates: [],
      setAvailableDates: (dates) => set({ availableDates: dates }),
      addAvailableDate: (date) => set((state) => ({
        availableDates: [...state.availableDates, {
          ...date,
          id: Date.now()
        }]
      })),
      updateAvailableDate: (id, updatedDate) => set((state) => ({
        availableDates: state.availableDates.map(date =>
          date.id === id
            ? { ...date, ...updatedDate }
            : date
        )
      })),
      deleteAvailableDate: (id) => set((state) => ({
        availableDates: state.availableDates.filter(date => date.id !== id)
      })),

      // Appointments State
      appointments: [],
      setAppointments: (appointments) => set({ appointments }),
      addAppointment: (appointment) => set((state) => ({
        appointments: [...state.appointments, {
          ...appointment,
          id: Date.now(),
          status: appointment.status || 'Pendente'
        }]
      })),
      updateAppointment: (id, updatedAppointment) => set((state) => ({
        appointments: state.appointments.map(appointment =>
          appointment.id === id
            ? { ...appointment, ...updatedAppointment }
            : appointment
        )
      })),
      deleteAppointment: (id) => set((state) => ({
        appointments: state.appointments.filter(appointment => appointment.id !== id)
      })),

      // Loading States
      isLoading: false,
      setIsLoading: (isLoading) => set({ isLoading }),

      // Error State
      error: null,
      setError: (error) => set({ error }),

      // Doctor-City Relationship
      assignDoctorToCity: (doctorId, cityId) => set((state) => ({
        cities: state.cities.map(city =>
          city.id === cityId
            ? { ...city, doctorIds: [...new Set([...city.doctorIds, doctorId])] }
            : city
        )
      })),
      removeDoctorFromCity: (doctorId, cityId) => set((state) => ({
        cities: state.cities.map(city =>
          city.id === cityId
            ? { ...city, doctorIds: city.doctorIds.filter(id => id !== doctorId) }
            : city
        )
      }))
    }),
    {
      name: 'agendamento-store',
      getStorage: () => localStorage,
    }
  )
);

export default useStore;
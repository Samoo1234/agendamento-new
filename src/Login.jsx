import React, { useState } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import useStore from './store/useStore';
import toast from 'react-hot-toast';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from './config/firebase';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 100vh;
  background-color: #f5f5f5;
  padding: 20px;
`;

const FormContainer = styled.div`
  background-color: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
  margin-top: 2rem;
`;

const Title = styled.h2`
  color: #333;
  text-align: center;
  margin-bottom: 2rem;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.8rem;
  margin-bottom: 1rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
`;

const Button = styled.button`
  width: 100%;
  padding: 1rem;
  background-color: #000080;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.3s;

  &:hover {
    background-color: #000066;
  }
`;

function Login() {
  const navigate = useNavigate();
  const { login, setIsLoading } = useStore();
  const [formData, setFormData] = useState({
    email: '',
    senha: ''
  });
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // Buscar usuário no Firestore
      const usersRef = collection(db, 'usuarios');
      const q = query(usersRef, where("email", "==", formData.email));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        throw new Error('Usuário não encontrado');
      }

      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data();

      // Verificar se é um usuário admin
      if (userData.role !== 'admin') {
        throw new Error('Acesso não autorizado');
      }

      // Como não temos senha no Firestore, vamos usar uma senha temporária
      if (formData.senha === '25346245') {
        const userDataToSave = { 
          id: userDoc.id, 
          ...userData 
        };
        login(userDataToSave);
        toast.success('Login realizado com sucesso!');
        navigate('/dashboard');
      } else {
        throw new Error('Senha incorreta');
      }
    } catch (error) {
      toast.error(error.message);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container>
      <FormContainer>
        <Title>Login Administrativo</Title>
        {error && <div style={{ color: 'red', marginBottom: '1rem', textAlign: 'center' }}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <Input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleInputChange}
            required
          />
          <Input
            type="password"
            name="senha"
            placeholder="Senha"
            value={formData.senha}
            onChange={handleInputChange}
            required
          />
          <Button type="submit">Entrar</Button>
        </form>
      </FormContainer>
    </Container>
  );
}

export default Login;
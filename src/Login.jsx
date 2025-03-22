import React, { useState } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import useStore from './store/useStore';
import toast from 'react-hot-toast';

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
      // Credenciais temporárias
      if (formData.email === 'admin@admin.com' && formData.senha === 'admin123') {
        const userData = { email: formData.email, role: 'admin' };
        login(userData);
        toast.success('Login realizado com sucesso!');
        navigate('/dashboard');
      } else {
        toast.error('Credenciais inválidas');
        setError('Credenciais inválidas');
      }
    } catch (error) {
      toast.error('Erro ao realizar login');
      setError('Erro ao realizar login');
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
            placeholder="E-mail"
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
        <div style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.9rem', color: '#666' }}>
          Use: admin@admin.com / admin123
        </div>
      </FormContainer>
    </Container>
  );
}

export default Login;
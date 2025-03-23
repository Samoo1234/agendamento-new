import React, { useState } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import useStore from './store/useStore';
import toast from 'react-hot-toast';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { db, auth } from './config/firebase';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background-color: #f5f5f5;
`;

const LoginCard = styled.div`
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
`;

const Title = styled.h1`
  text-align: center;
  color: #333;
  margin-bottom: 1.5rem;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const Input = styled.input`
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
`;

const Button = styled.button`
  padding: 0.75rem;
  background-color: #000080;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.3s;

  &:hover {
    background-color: #000066;
  }
`;

const ErrorMessage = styled.p`
  color: #e74c3c;
  text-align: center;
  margin: 0.5rem 0;
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
    setError('');
    
    try {
      // Primeiro, autenticar com Firebase Authentication
      const userCredential = await signInWithEmailAndPassword(
        auth, 
        formData.email, 
        formData.senha
      );
      
      // Se chegou aqui, a autenticação foi bem-sucedida
      // Agora, buscar dados adicionais do usuário no Firestore
      const usersRef = collection(db, 'usuarios');
      const q = query(usersRef, where("email", "==", formData.email));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        // Usuário autenticado, mas não encontrado no Firestore
        // Isso não deveria acontecer em uso normal, mas vamos tratar
        await auth.signOut(); // Fazer logout
        throw new Error('Usuário não encontrado no sistema');
      }

      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data();

      // Verificar se é um usuário admin
      if (userData.role !== 'admin' && userData.role !== 'administrador') {
        // Usuário não é admin, fazer logout
        await auth.signOut();
        throw new Error('Acesso não autorizado. Apenas administradores podem acessar este sistema.');
      }

      // Verificar se o usuário está desativado
      if (userData.disabled) {
        await auth.signOut();
        throw new Error('Sua conta está desativada. Entre em contato com o administrador.');
      }

      // Login bem-sucedido - salvar dados do usuário no estado
      const userDataToSave = { 
        id: userDoc.id, 
        uid: userCredential.user.uid,
        ...userData 
      };
      
      login(userDataToSave);
      toast.success('Login realizado com sucesso!');
      navigate('/dashboard');
      
    } catch (error) {
      console.error('Erro no login:', error);
      
      // Tratar diferentes tipos de erro de autenticação
      let errorMessage = 'Erro ao fazer login';
      
      switch(error.code) {
        case 'auth/invalid-email':
          errorMessage = 'E-mail inválido';
          break;
        case 'auth/user-disabled':
          errorMessage = 'Usuário desativado';
          break;
        case 'auth/user-not-found':
          errorMessage = 'Usuário não encontrado';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Senha incorreta';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Muitas tentativas de login. Tente novamente mais tarde.';
          break;
        default:
          errorMessage = error.message;
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container>
      <LoginCard>
        <Title>Login Administrativo</Title>
        {error && <ErrorMessage>{error}</ErrorMessage>}
        <Form onSubmit={handleSubmit}>
          <Input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder="E-mail"
            required
          />
          <Input
            type="password"
            name="senha"
            value={formData.senha}
            onChange={handleInputChange}
            placeholder="Senha"
            required
          />
          <Button type="submit">Entrar</Button>
        </Form>
      </LoginCard>
    </Container>
  );
}

export default Login;
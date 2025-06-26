import React, { useState } from 'react';
import styled from 'styled-components';
import toast from 'react-hot-toast';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from './config/firebase';
import { PERMISSIONS } from './config/permissions';

const Container = styled.div`
  padding: 20px;
  max-width: 600px;
  margin: 0 auto;
`;

const Button = styled.button`
  padding: 12px 24px;
  background-color: #dc3545;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  font-weight: bold;

  &:hover {
    background-color: #c82333;
  }

  &:disabled {
    background-color: #6c757d;
    cursor: not-allowed;
  }
`;

const Status = styled.div`
  padding: 15px;
  margin: 15px 0;
  border-radius: 4px;
  background-color: ${props => props.$type === 'success' ? '#d4edda' : '#f8d7da'};
  color: ${props => props.$type === 'success' ? '#155724' : '#721c24'};
  border: 1px solid ${props => props.$type === 'success' ? '#c3e6cb' : '#f5c6cb'};
`;

const FixAdminUser = () => {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');

  const fixAdminUser = async () => {
    setLoading(true);
    setStatus('');

    try {
      console.log('🔍 Procurando usuário samtecsolucoes@gmail.com...');
      
      // Buscar o usuário
      const usersRef = collection(db, 'usuarios');
      const q = query(usersRef, where("email", "==", "samtecsolucoes@gmail.com"));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        setStatus('❌ Usuário samtecsolucoes@gmail.com não encontrado!');
        return;
      }
      
      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data();
      
      console.log('📋 Dados atuais do usuário:');
      console.log('- Email:', userData.email);
      console.log('- Role atual:', userData.role);
      console.log('- Permissões atuais:', userData.permissions?.length || 0);
      
      // Atualizar para admin com todas as permissões
      const updateData = {
        role: 'admin',
        permissions: Object.values(PERMISSIONS),
        updatedAt: new Date(),
        updatedBy: 'emergency_fix'
      };
      
      await updateDoc(doc(db, 'usuarios', userDoc.id), updateData);
      
      setStatus(`✅ USUÁRIO CORRIGIDO COM SUCESSO!
- Email: ${userData.email}
- Role: admin (era: ${userData.role})
- Permissões: ${Object.values(PERMISSIONS).length} (todas)
- Status: Acesso total e irrestrito

🎉 Agora você pode fazer logout e login novamente!`);
      
      toast.success('Usuário admin corrigido! Faça logout e login novamente.');
      
    } catch (error) {
      console.error('❌ Erro ao corrigir usuário:', error);
      setStatus(`❌ Erro ao corrigir usuário: ${error.message}`);
      toast.error('Erro ao corrigir usuário');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <h1>🚨 Correção Emergencial - Usuário Admin</h1>
      <p>Este componente corrige o problema do usuário <strong>samtecsolucoes@gmail.com</strong> que está sem acesso admin.</p>
      
      <Button 
        onClick={fixAdminUser} 
        disabled={loading}
      >
        {loading ? '⏳ Corrigindo...' : '🔧 CORRIGIR USUÁRIO ADMIN'}
      </Button>

      {status && (
        <Status $type={status.includes('✅') ? 'success' : 'error'}>
          <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>
            {status}
          </pre>
        </Status>
      )}

      <div style={{ marginTop: '30px', padding: '15px', backgroundColor: '#fff3cd', border: '1px solid #ffeaa7', borderRadius: '4px' }}>
        <h3>📝 Instruções:</h3>
        <ol>
          <li>Clique no botão "CORRIGIR USUÁRIO ADMIN"</li>
          <li>Aguarde a confirmação de sucesso</li>
          <li>Faça logout do sistema</li>
          <li>Faça login novamente com samtecsolucoes@gmail.com</li>
          <li>Agora você terá acesso total como admin</li>
        </ol>
      </div>
    </Container>
  );
};

export default FixAdminUser; 
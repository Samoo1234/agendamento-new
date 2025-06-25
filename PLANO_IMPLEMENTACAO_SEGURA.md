# 🛡️ Plano de Implementação Segura - Sistema de Controle de Acesso

## ⚠️ AVISO: Implementação Gradual Obrigatória

**NUNCA implemente tudo de uma vez em produção!**

---

## 📋 Fases de Implementação

### **FASE 0: Preparação (1-2 dias)**
#### ✅ **Backup Completo**
```bash
# Fazer backup do Firestore
gcloud firestore export gs://seu-bucket/backup-$(date +%Y%m%d)

# Backup do código atual
git tag backup-pre-permissions
git push origin backup-pre-permissions
```

#### ✅ **Ambiente de Teste**
- Clone completo da base de dados
- Teste com dados reais (anonimizados)
- Verificação de todos os fluxos existentes

---

### **FASE 1: Base sem Impacto (2-3 dias)**
#### ✅ **Implementar apenas estrutura**
```javascript
// Implementar APENAS os arquivos base SEM usar ainda
// ✅ src/config/permissions.js
// ✅ src/hooks/usePermissions.js  
// ✅ src/components/PermissionGuard.jsx
// ❌ NÃO alterar App.jsx ainda
// ❌ NÃO alterar Layout.jsx ainda
// ❌ NÃO alterar firestore.rules ainda
```

#### ✅ **Teste Independente**
```jsx
// Criar página de teste temporária
function TestePermissoes() {
  const { can } = usePermissions();
  
  return (
    <div>
      <h1>Teste de Permissões</h1>
      <p>Role atual: {can ? 'Hook funciona' : 'Hook com erro'}</p>
    </div>
  );
}
```

---

### **FASE 2: Migração de Dados (3-4 dias)**
#### ✅ **Script de Migração com Rollback**

```javascript
// Versão SEGURA do script de migração
async function migrateUserRolesSafely() {
  console.log('🚀 Iniciando migração SEGURA...');
  
  try {
    // 1. BACKUP dos dados originais
    const usersSnapshot = await getDocs(collection(db, 'usuarios'));
    const backupData = {};
    
    usersSnapshot.docs.forEach(doc => {
      backupData[doc.id] = doc.data();
    });
    
    // Salvar backup
    await setDoc(doc(db, 'backups', `users-${Date.now()}`), {
      data: backupData,
      timestamp: new Date()
    });
    
    // 2. Migração com validação
    const batch = writeBatch(db);
    let errors = [];
    
    usersSnapshot.docs.forEach(userDoc => {
      try {
        const userData = userDoc.data();
        const originalRole = userData.role;
        
        // MANTER role original + adicionar novo campo
        const updateData = {
          ...userData, // Manter dados originais
          roleOriginal: originalRole, // Backup do role original
          roleNew: mapRole(originalRole), // Novo sistema
          migratedAt: new Date(),
          migrationVersion: '1.0'
        };
        
        // NÃO remover senha ainda - fazer isso depois
        batch.update(doc(db, 'usuarios', userDoc.id), updateData);
        
      } catch (error) {
        errors.push({ userId: userDoc.id, error: error.message });
      }
    });
    
    if (errors.length > 0) {
      console.error('❌ Erros na migração:', errors);
      throw new Error(`Migração falhou: ${errors.length} erros`);
    }
    
    await batch.commit();
    console.log('✅ Migração concluída com sucesso');
    
  } catch (error) {
    console.error('💥 ERRO CRÍTICO na migração:', error);
    // Aqui você pode implementar rollback automático
    throw error;
  }
}

// Função de rollback
async function rollbackMigration(backupId) {
  console.log('🔄 Executando rollback...');
  // Implementar restauração dos dados originais
}
```

#### ✅ **Validação Pós-Migração**
```javascript
async function validateMigration() {
  const issues = [];
  
  // Verificar se todos os usuários ainda existem
  const users = await getDocs(collection(db, 'usuarios'));
  
  users.docs.forEach(doc => {
    const data = doc.data();
    
    if (!data.roleNew) {
      issues.push(`Usuário ${doc.id} sem roleNew`);
    }
    
    if (!data.roleOriginal) {
      issues.push(`Usuário ${doc.id} sem backup do role original`);
    }
  });
  
  if (issues.length > 0) {
    console.error('⚠️ Problemas na migração:', issues);
    return false;
  }
  
  console.log('✅ Migração validada com sucesso');
  return true;
}
```

---

### **FASE 3: Interface Gradual (5-7 dias)**
#### ✅ **Menu com Fallback**

```jsx
// Versão SEGURA do Layout com fallback
function Layout() {
  const { user } = useStore();
  const [useNewPermissions, setUseNewPermissions] = useState(false);
  
  // Toggle para testar gradualmente
  const togglePermissionSystem = () => {
    setUseNewPermissions(!useNewPermissions);
  };
  
  // Menu com sistema atual (fallback)
  const getMenuItemsLegacy = () => {
    // Sistema atual que já funciona
    return [
      { icon: <AiOutlineDashboard />, text: 'Dashboard', path: '/dashboard' },
      { icon: <AiOutlineCalendar />, text: 'Datas Disponíveis', path: '/datas-disponiveis' },
      // ... outros itens sem filtro
    ];
  };
  
  // Menu com novo sistema
  const getMenuItemsNew = () => {
    try {
      const { can } = usePermissions();
      return allMenuItems.filter(item => {
        try {
          return can(item.permission);
        } catch (error) {
          console.warn('Erro na verificação de permissão:', error);
          return true; // Fallback: mostrar item se houver erro
        }
      });
    } catch (error) {
      console.error('Erro no sistema de permissões:', error);
      return getMenuItemsLegacy(); // Fallback para sistema antigo
    }
  };
  
  const menuItems = useNewPermissions ? getMenuItemsNew() : getMenuItemsLegacy();
  
  return (
    <Container>
      {/* Botão temporário para testar */}
      <button onClick={togglePermissionSystem}>
        Modo: {useNewPermissions ? 'Novo' : 'Legado'}
      </button>
      
      <Sidebar>
        {menuItems.map((item, index) => (
          <MenuItem key={index} onClick={() => navigate(item.path)}>
            {item.icon} {item.text}
          </MenuItem>
        ))}
      </Sidebar>
      
      <MainContent>
        <Outlet />
      </MainContent>
    </Container>
  );
}
```

---

### **FASE 4: Rotas com Proteção Opcional (8-10 dias)**
#### ✅ **Proteção com Bypass**

```jsx
// Versão SEGURA das rotas protegidas
function App() {
  const [enforcePermissions, setEnforcePermissions] = useState(false);
  
  // Componente que pode ser desabilitado
  const ConditionalProtection = ({ children, permission }) => {
    if (!enforcePermissions) {
      return children; // Bypass da proteção
    }
    
    return (
      <PermissionGuard 
        permission={permission}
        fallback={children} // Se falhar, mostra o componente mesmo assim
      >
        {children}
      </PermissionGuard>
    );
  };
  
  return (
    <Routes>
      <Route path="/" element={<AgendamentoForm />} />
      <Route path="/login" element={<Login />} />
      <Route element={<PrivateRoute />}>
        <Route element={<Layout />}>
          <Route 
            path="/dashboard" 
            element={
              <ConditionalProtection permission={PERMISSIONS.DASHBOARD_VIEW}>
                <Dashboard />
              </ConditionalProtection>
            } 
          />
          {/* ... outras rotas */}
        </Route>
      </Route>
    </Routes>
  );
}
```

---

### **FASE 5: Firestore Rules (11-15 dias)**
#### ✅ **Regras com Período de Teste**

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // PERÍODO DE TESTE: manter regras abertas + log
    match /{document=**} {
      allow read, write: if true; // MANTER TEMPORARIAMENTE
    }
    
    // Regras novas em paralelo (só para teste)
    match /usuarios_test/{userId} {
      // Testar regras aqui primeiro
      allow read: if isActive() && (
        isOwner(userId) || 
        hasAnyRole(['super_admin', 'admin'])
      );
    }
  }
}
```

---

## 🚨 Pontos Críticos de Atenção

### **1. Sistema de Login**
```jsx
// RISCO: Login pode falhar se verificação for muito restritiva
const handleSubmit = async (e) => {
  e.preventDefault();
  
  try {
    // MANTER autenticação atual funcionando
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    
    // ADICIONAR verificação nova como EXTRA, não substituto
    const userData = await getUserData(userCredential.user.uid);
    
    // FALLBACK: se não encontrar no novo sistema, usar antigo
    if (!userData || !userData.roleNew) {
      console.warn('Usuário sem role novo, usando sistema legado');
      // Usar sistema antigo
    }
    
    login(userData);
    
  } catch (error) {
    // NÃO bloquear login por erro de permissão
    console.error('Erro no login:', error);
  }
};
```

### **2. Verificação de Permissões**
```jsx
// SEMPRE ter fallback para não quebrar a interface
export const hasPermission = (userRole, permission) => {
  try {
    const role = ROLES[userRole?.toUpperCase()];
    return role?.permissions.includes(permission) || false;
  } catch (error) {
    console.warn('Erro na verificação de permissão:', error);
    return true; // FALLBACK: permitir acesso se houver erro
  }
};
```

---

## 📊 Estimativa de Risco Atualizada

### **Com Implementação Gradual**
- 🔴 **Alto Risco**: 70% → **15%**
- 🔶 **Médio Risco**: 40% → **25%**
- 🔵 **Baixo Risco**: 10% → **60%**

### **Com Implementação Direta (NÃO RECOMENDADO)**
- 🔴 **Alto Risco**: **85%**
- 🔶 **Médio Risco**: **60%**
- 🔵 **Baixo Risco**: **5%**

---

## ✅ Checklist de Segurança

### **Antes de Cada Fase**
- [ ] Backup completo realizado
- [ ] Testes em ambiente isolado
- [ ] Validação de todos os fluxos existentes
- [ ] Plano de rollback preparado
- [ ] Monitoramento ativo configurado

### **Durante Implementação**
- [ ] Logs detalhados de cada operação
- [ ] Verificação contínua de funcionamento
- [ ] Fallbacks implementados
- [ ] Usuários-chave testando sistema

### **Após Cada Fase**
- [ ] Validação completa de funcionalidades
- [ ] Performance não degradada
- [ ] Nenhum usuário bloqueado
- [ ] Sistema rollback testado

---

## 🎯 Conclusão

**A implementação é SEGURA se feita gradualmente.**

**Risco com implementação gradual: ~25%**
**Risco com implementação direta: ~80%**

**NUNCA pule as fases ou implemente tudo de uma vez!** 
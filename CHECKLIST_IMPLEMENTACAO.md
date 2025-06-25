# ✅ Checklist de Implementação Segura - Sistema de Controle de Acesso

## 🎯 **Script de Teste Automático**

### **Como Executar o Script:**

#### **Opção 1: No Terminal**
```bash
# Navegar até o projeto
cd /d/agend

# Executar script de testes
node scripts/testPermissionSystem.js
```

#### **Opção 2: No Browser (Mais Fácil)**
```javascript
// 1. Abrir o Console do navegador (F12)
// 2. Colar e executar o script
// 3. Ver resultados em tempo real

// Já disponível como window.runPermissionTests()
await window.runPermissionTests();
```

#### **Opção 3: Integrado ao React**
```jsx
// Criar componente de teste temporário
import { runAllTests } from '../scripts/testPermissionSystem.js';

function TestPage() {
  const [results, setResults] = useState(null);
  
  const runTests = async () => {
    const report = await runAllTests();
    setResults(report);
  };
  
  return (
    <div>
      <button onClick={runTests}>🧪 Executar Testes</button>
      {results && <pre>{JSON.stringify(results, null, 2)}</pre>}
    </div>
  );
}
```

---

## 📋 **FASE 0: Preparação (Obrigatória)**

### **✅ Backup Completo**
- [ ] **Backup do Firestore**
  ```bash
  # Se tiver gcloud CLI instalado
  gcloud firestore export gs://seu-bucket/backup-$(date +%Y%m%d)
  
  # OU fazer backup via Console Firebase
  # Firebase Console > Firestore > Importar/Exportar
  ```

- [ ] **Backup do Código**
  ```bash
  git add .
  git commit -m "Backup antes implementação sistema permissões"
  git tag backup-pre-permissions
  git push origin master
  git push origin backup-pre-permissions
  ```

- [ ] **Documentar Estado Atual**
  ```
  - Quantos usuários ativos: ___
  - Quantos admins: ___
  - Última alteração importante: ___
  - Sistema funcionando 100%: [ ] Sim [ ] Não
  ```

### **✅ Ambiente de Teste**
- [ ] **Clonar base para teste**
  - Criar projeto Firebase de teste
  - Importar dados anonimizados
  - Configurar credenciais de teste

- [ ] **Validar funcionamento atual**
  - [ ] Login funciona
  - [ ] Todos os menus carregam
  - [ ] Agendamentos funcionam
  - [ ] Dashboard exibe dados

---

## 📋 **FASE 1: Implementação Base (2-3 dias)**

### **✅ Implementar APENAS Estrutura**
- [ ] **Criar arquivos SEM usar ainda**
  - [ ] `src/config/permissions.js` ✅ (já criado)
  - [ ] `src/hooks/usePermissions.js` ✅ (já criado)
  - [ ] `src/components/PermissionGuard.jsx` ✅ (já criado)

- [ ] **NÃO ALTERAR ainda:**
  - [ ] ❌ `src/App.jsx`
  - [ ] ❌ `src/Layout.jsx`
  - [ ] ❌ `firestore.rules`

### **✅ Testes de Integração**
- [ ] **Executar script de teste**
  ```bash
  node scripts/testPermissionSystem.js
  ```
  
- [ ] **Resultado esperado:**
  - Testes de permissões: 100% ✅
  - Testes de dados: 80%+ ✅
  - Testes de segurança: 100% ✅
  - Testes de compatibilidade: 100% ✅
  - Performance: 80%+ ✅

- [ ] **Se falhar:**
  - Revisar código
  - Corrigir problemas
  - Repetir testes

### **✅ Teste Manual Isolado**
- [ ] **Criar página de teste**
  ```jsx
  // src/TestPermissions.jsx
  import { usePermissions } from './hooks/usePermissions';
  import { PERMISSIONS } from './config/permissions';
  
  function TestPermissions() {
    const { can, getRole } = usePermissions();
    
    return (
      <div style={{ padding: '20px', background: '#f0f0f0' }}>
        <h2>🧪 Teste de Permissões</h2>
        <p><strong>Role atual:</strong> {getRole()}</p>
        <p><strong>Pode ver usuários:</strong> {can(PERMISSIONS.USERS_VIEW) ? '✅' : '❌'}</p>
        <p><strong>Pode ver financeiro:</strong> {can(PERMISSIONS.FINANCIAL_VIEW) ? '✅' : '❌'}</p>
        <p><strong>Hook funcionando:</strong> {can ? '✅' : '❌'}</p>
      </div>
    );
  }
  ```

- [ ] **Adicionar rota temporária**
  ```jsx
  // Em App.jsx, adicionar temporariamente:
  <Route path="/test-permissions" element={<TestPermissions />} />
  ```

- [ ] **Testar navegando para `/test-permissions`**
  - Hook carrega sem erro: [ ]
  - Permissões calculam corretamente: [ ]
  - Nenhum erro no console: [ ]

---

## 📋 **FASE 2: Migração de Dados (3-4 dias)**

### **✅ Preparar Script de Migração Seguro**
- [ ] **Validar script em ambiente de teste**
  ```bash
  # Executar primeiro em dados de teste
  node scripts/migrateUserRoles.js --test-mode
  ```

- [ ] **Verificar mapeamentos**
  ```
  admin → admin ✅
  administrador → admin ✅
  usuario → receptionist ✅
  medico → doctor ✅
  Roles sem mapeamento: ___
  ```

### **✅ Executar Migração em Produção**
- [ ] **Horário de menor movimento**
  - Data/hora planejada: ___
  - Usuários notificados: [ ]
  - Backup feito há menos de 1h: [ ]

- [ ] **Migração com monitoramento**
  ```bash
  # Executar com logs detalhados
  node scripts/migrateUserRoles.js --verbose
  ```

- [ ] **Validação pós-migração**
  - [ ] Todos os usuários ainda existem
  - [ ] Campo `roleNew` preenchido
  - [ ] Campo `roleOriginal` preservado
  - [ ] Senhas em texto plano removidas
  - [ ] Nenhum usuário perdeu acesso

### **✅ Teste de Rollback**
- [ ] **Preparar procedimento**
  ```sql
  -- Script para reverter se necessário
  -- (adaptar para Firestore)
  UPDATE usuarios SET role = roleOriginal WHERE roleOriginal IS NOT NULL;
  ```

- [ ] **Testar rollback em ambiente de teste**
- [ ] **Cronometrar tempo de rollback: ___ minutos**

---

## 📋 **FASE 3: Interface Gradual (5-7 dias)**

### **✅ Implementar Menu com Toggle**
- [ ] **Atualizar Layout.jsx com fallback**
  - [ ] Menu com sistema antigo (padrão)
  - [ ] Toggle para sistema novo
  - [ ] Fallback automático em caso de erro

- [ ] **Testar com diferentes roles**
  - [ ] Admin vê todos os itens: [ ]
  - [ ] Receptionist vê itens limitados: [ ]
  - [ ] Menu nunca fica vazio: [ ]
  - [ ] Toggle funciona sem erro: [ ]

### **✅ Testes com Usuários Reais**
- [ ] **Teste com admin principal**
  - Login funciona: [ ]
  - Menu carrega: [ ]
  - Toggle entre sistemas: [ ]
  - Sem erros no console: [ ]

- [ ] **Teste com usuário limitado**
  - Login funciona: [ ]
  - Menu adequado ao role: [ ]
  - Sem acesso a áreas restritas: [ ]
  - Experiência estável: [ ]

### **✅ Monitoramento de Erros**
- [ ] **Configurar logs**
  ```javascript
  // Adicionar em usePermissions.js
  if (error) {
    console.error('Erro permissão:', error);
    // Enviar para sistema de monitoramento
  }
  ```

- [ ] **Métricas para acompanhar**
  - Erros de permissão por hora: ___
  - Usuários afetados: ___
  - Taxa de fallback ativado: ___%

---

## 📋 **FASE 4: Rotas Protegidas (8-10 dias)**

### **✅ Implementar Proteção Opcional**
- [ ] **Atualizar App.jsx com bypass**
  - [ ] Componente `ConditionalProtection`
  - [ ] Flag `enforcePermissions` (iniciar false)
  - [ ] Fallback para componente original

- [ ] **Teste de proteção**
  - [ ] Com `enforcePermissions=false`: tudo funciona
  - [ ] Com `enforcePermissions=true`: filtros funcionam
  - [ ] Transição suave entre modos

### **✅ Ativação Gradual**
- [ ] **Ativar para admin principal primeiro**
  ```javascript
  const isMainAdmin = user?.email === 'admin@principal.com';
  const [enforcePermissions, setEnforcePermissions] = useState(isMainAdmin);
  ```

- [ ] **Ativar para outros usuários progressivamente**
  - Dia 1: Admin principal ✅
  - Dia 2: Outros admins
  - Dia 3: Gerentes
  - Dia 4: Demais usuários

### **✅ Plano de Rollback Rápido**
- [ ] **Preparar hot-fix**
  ```javascript
  // Emergency fallback
  const EMERGENCY_DISABLE = localStorage.getItem('emergency_disable_permissions');
  if (EMERGENCY_DISABLE) {
    return <Component {...props} />; // Bypass total
  }
  ```

---

## 📋 **FASE 5: Firestore Rules (11-15 dias)**

### **✅ Preparação das Regras**
- [ ] **Testar regras em coleção separada**
  ```javascript
  // Criar match /usuarios_test/{userId}
  // Testar todas as regras primeiro
  ```

- [ ] **Validar queries existentes**
  - [ ] Dashboard carrega: [ ]
  - [ ] Agendamentos listam: [ ]
  - [ ] Filtros funcionam: [ ]

### **✅ Implementação com Janela de Teste**
- [ ] **Ativar regras fora do horário comercial**
  - Data/hora: ___
  - Rollback preparado: [ ]
  - Monitoramento ativo: [ ]

- [ ] **Período de observação (24h)**
  - [ ] Erros de acesso: ___
  - [ ] Usuários bloqueados: ___
  - [ ] Performance impactada: [ ] Sim [ ] Não

### **✅ Validação Final**
- [ ] **Testes de segurança**
  - [ ] Usuário não pode alterar próprio role
  - [ ] Receptionist não acessa dados financeiros
  - [ ] Doctor não vê outros agendamentos
  - [ ] Regras são aplicadas no backend

---

## 📋 **VALIDAÇÃO FINAL (16-20 dias)**

### **✅ Testes de Carga**
- [ ] **Múltiplos usuários simultâneos**
  - 10 usuários: [ ] OK
  - 50 usuários: [ ] OK
  - Performance aceitável: [ ]

### **✅ Testes de Segurança**
- [ ] **Penetration testing básico**
  - Tentativa de escalação de privilégios: [ ] Bloqueada
  - Acesso direto via URL: [ ] Bloqueado
  - Manipulação de requests: [ ] Bloqueada

### **✅ Documentação e Treinamento**
- [ ] **Atualizar documentação**
  - Manual do usuário: [ ]
  - Guia do administrador: [ ]
  - Troubleshooting: [ ]

- [ ] **Treinar equipe**
  - Administradores: [ ]
  - Usuários finais: [ ]
  - Suporte técnico: [ ]

---

## 🚨 **Procedimentos de Emergência**

### **Em Caso de Problema Crítico:**

#### **🔴 Rollback Imediato (< 5 minutos)**
```bash
# 1. Desativar sistema novo
localStorage.setItem('emergency_disable_permissions', 'true');

# 2. Reverter regras Firestore
# Firebase Console > Firestore > Rules > Versão anterior

# 3. Reverter código (se necessário)
git reset --hard backup-pre-permissions
```

#### **📞 Escalação**
1. **Problema Técnico**: Desenvolvedor principal
2. **Usuários Bloqueados**: Admin principal
3. **Dados Perdidos**: Backup e restore

#### **📝 Comunicação**
- Template de email para usuários
- Status page para informar problemas
- Canal de comunicação interna

---

## 📊 **Métricas de Sucesso**

### **KPIs para Acompanhar:**
- [ ] **Funcionalidade**: 100% das funções atuais mantidas
- [ ] **Performance**: <10% degradação
- [ ] **Segurança**: 0 vulnerabilidades críticas
- [ ] **Usabilidade**: <5% de reclamações de usuários
- [ ] **Estabilidade**: >99% uptime

### **Critérios de Aprovação:**
- [ ] ✅ Script de teste: >95% sucesso
- [ ] ✅ Feedback usuários: Positivo ou neutro
- [ ] ✅ Logs: <1 erro por 1000 operações
- [ ] ✅ Performance: Mantida ou melhorada
- [ ] ✅ Segurança: Auditoria aprovada

---

## 🎯 **Resumo Executivo**

**Tempo total estimado**: 15-20 dias úteis
**Risco com este plano**: 15-25% (baixo)
**Benefícios**: Segurança robusta + escalabilidade

**Aprovações necessárias**:
- [ ] Backup realizado e testado
- [ ] Janela de manutenção agendada
- [ ] Equipe treinada
- [ ] Plano de rollback validado

---

**📌 LEMBRE-SE: Nunca pule etapas ou implemente tudo de uma vez. Cada fase deve ser completamente validada antes da próxima!** 
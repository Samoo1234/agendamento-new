# Solução para Email Duplicado no Firebase Authentication

## Problema
O email `oticadavicm@gmail.com` foi deletado da coleção `usuarios` no Firestore, mas ainda existe no Firebase Authentication. Por isso, ao tentar criar um novo usuário com este email, aparece o erro "Email já está em uso".

## Soluções Disponíveis

### ✅ Solução 1: Deletar Manualmente (MAIS RÁPIDO - RECOMENDADO)

1. Acesse o [Firebase Console](https://console.firebase.google.com)
2. Selecione o projeto **oticadavi-113e0**
3. No menu lateral, clique em **Authentication**
4. Clique na aba **Users**
5. Procure por `oticadavicm@gmail.com`
6. Clique nos 3 pontos (⋮) ao lado do usuário
7. Selecione **Delete account**
8. Confirme a exclusão

Após isso, você poderá criar o usuário novamente no sistema.

---

### 🔧 Solução 2: Usar a Cloud Function (Requer Deploy)

Criei uma Cloud Function chamada `deleteUserByEmail` que pode deletar usuários do Authentication.

#### Passo 1: Fazer Deploy da Cloud Function

```bash
cd f:\agend
npx firebase-tools deploy --only functions:deleteUserByEmail
```

Ou se tiver o Firebase CLI instalado globalmente:

```bash
firebase deploy --only functions:deleteUserByEmail
```

#### Passo 2: Usar o arquivo HTML

Após o deploy, abra o arquivo `delete-user-auth.html` no navegador:

1. Abra o arquivo `f:\agend\delete-user-auth.html` no navegador
2. O email `oticadavicm@gmail.com` já está preenchido
3. Clique em "Deletar Usuário do Authentication"
4. Aguarde a confirmação

---

### 🛠️ Solução 3: Chamar a API Diretamente

Após fazer o deploy da Cloud Function, você pode chamar diretamente via cURL ou Postman:

```bash
curl -X POST https://us-central1-oticadavi-113e0.cloudfunctions.net/deleteUserByEmail \
  -H "Content-Type: application/json" \
  -d '{"email": "oticadavicm@gmail.com"}'
```

---

## Prevenção Futura

Para evitar este problema no futuro, o código em `GerenciarUsuarios.jsx` precisa ser atualizado para deletar o usuário tanto do Firestore quanto do Authentication.

### Código Atual (Problema)
O código atual só deleta do Firestore:

```javascript
const handleDelete = async (id) => {
  // ... código ...
  await deleteDoc(doc(db, 'usuarios', id)); // ❌ Só deleta do Firestore
  // ... código ...
};
```

### Solução Proposta
Atualizar o código para chamar a Cloud Function ao deletar:

```javascript
const handleDelete = async (id) => {
  if (window.confirm('Tem certeza que deseja excluir este usuário?')) {
    try {
      const userDoc = users.find(user => user.id === id);
      const userEmail = userDoc?.email;

      // 1. Deletar do Firestore
      await deleteDoc(doc(db, 'usuarios', id));
      
      // 2. Deletar do Authentication via Cloud Function
      if (userEmail) {
        try {
          const response = await fetch(
            'https://us-central1-oticadavi-113e0.cloudfunctions.net/deleteUserByEmail',
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email: userEmail })
            }
          );
          
          if (response.ok) {
            toast.success('Usuário excluído completamente!');
          } else {
            toast.warning('Usuário excluído do sistema, mas pode ainda estar no Authentication');
          }
        } catch (error) {
          console.error('Erro ao deletar do Authentication:', error);
        }
      }
      
      fetchUsers();
    } catch (error) {
      toast.error('Erro ao excluir usuário');
      console.error('Erro:', error);
    }
  }
};
```

---

## Resumo

**Para resolver AGORA:**
- Use a **Solução 1** (deletar manualmente no Firebase Console) - é a mais rápida!

**Para resolver no futuro:**
- Faça o deploy da Cloud Function
- Atualize o código do `GerenciarUsuarios.jsx` para chamar a Cloud Function ao deletar usuários

---

## Arquivos Criados

- ✅ `functions/index.js` - Cloud Function `deleteUserByEmail` adicionada
- ✅ `delete-user-auth.html` - Interface HTML para deletar usuários
- ✅ `delete-user-script.js` - Script Node.js alternativo (requer serviceAccountKey.json)
- ✅ `SOLUCAO-EMAIL-DUPLICADO.md` - Este arquivo de documentação

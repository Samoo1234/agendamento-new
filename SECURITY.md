# Guia de Segurança para Deploy

Este documento contém instruções importantes de segurança para o sistema de agendamento de consultas médicas antes do deploy em produção.

## Configuração de Variáveis de Ambiente

1. Execute o script `setup-env.js` para configurar as variáveis de ambiente:
   ```
   node setup-env.js
   ```

2. Verifique se o arquivo `.env` foi criado corretamente com as credenciais do Firebase.

3. **IMPORTANTE**: Nunca inclua o arquivo `.env` no controle de versão.

## Regras de Segurança do Firestore

As regras de segurança do Firestore foram atualizadas para:
- Negar acesso por padrão
- Permitir leitura pública apenas para coleções necessárias ao agendamento (cidades, médicos, datas disponíveis)
- Restringir operações de escrita apenas a usuários autenticados com papel de administrador
- Permitir que usuários não autenticados criem agendamentos

Verifique se estas regras estão aplicadas corretamente no console do Firebase.

## Recomendações Adicionais de Segurança

### Autenticação
- Considere migrar para o Firebase Authentication em vez da autenticação personalizada atual
- Implemente hash de senhas para não armazenar senhas em texto puro no banco de dados
- Adicione autenticação de dois fatores para contas administrativas

### Proteção de Dados
- Implemente validação de entrada em todos os formulários
- Sanitize todas as entradas de usuário antes de armazená-las no banco de dados
- Considere criptografar dados sensíveis de pacientes

### Monitoramento e Logs
- Configure alertas de segurança no Firebase
- Implemente logs de auditoria para ações administrativas
- Monitore tentativas de login mal-sucedidas

### HTTPS e Cabeçalhos de Segurança
- Certifique-se de que o site está sendo servido apenas via HTTPS
- Configure cabeçalhos de segurança apropriados:
  - Content-Security-Policy
  - X-XSS-Protection
  - X-Content-Type-Options
  - Referrer-Policy

## Antes do Deploy em Produção

1. Execute testes de segurança automatizados
2. Considere uma auditoria de segurança profissional
3. Implemente um plano de backup e recuperação de dados
4. Verifique a conformidade com regulamentações de dados de saúde (como LGPD no Brasil)

## Contato para Questões de Segurança

Se você encontrar vulnerabilidades de segurança, entre em contato imediatamente com o administrador do sistema.

https://cdpe.criadordigital.cloud/webhook/envio de template
https://cdpe.criadordigital.cloud/webhook-test/envio%20de%20template
// Script de debug para investigar permissões do usuário davicartaomantenopolis@gmail.com
console.log('=== DEBUG DE PERMISSÕES ===');

// Adicione este código temporariamente no componente Financeiro.jsx para debug
const debugPermissions = () => {
  const { user, can, getAll, getRole, isAdmin } = usePermissions();
  
  console.log('=== DADOS DO USUÁRIO ===');
  console.log('user:', user);
  console.log('user.email:', user?.email);
  console.log('user.role:', user?.role);
  console.log('user.perfil:', user?.perfil);
  console.log('user.permissions:', user?.permissions);
  console.log('user.disabled:', user?.disabled);
  
  console.log('=== VERIFICAÇÕES DO HOOK ===');
  console.log('getRole():', getRole());
  console.log('isAdmin():', isAdmin());
  console.log('getAll():', getAll());
  
  console.log('=== VERIFICAÇÕES ESPECÍFICAS ===');
  console.log('can(PERMISSIONS.FINANCIAL_REPORTS):', can(PERMISSIONS.FINANCIAL_REPORTS));
  console.log('can(PERMISSIONS.FINANCIAL_VIEW):', can(PERMISSIONS.FINANCIAL_VIEW));
  console.log('can(PERMISSIONS.EXPORT_DATA):', can(PERMISSIONS.EXPORT_DATA));
  
  console.log('=== VALORES DAS PERMISSÕES ===');
  console.log('PERMISSIONS.FINANCIAL_REPORTS:', PERMISSIONS.FINANCIAL_REPORTS);
  console.log('PERMISSIONS.FINANCIAL_VIEW:', PERMISSIONS.FINANCIAL_VIEW);
  console.log('PERMISSIONS.EXPORT_DATA:', PERMISSIONS.EXPORT_DATA);
  
  console.log('=== VERIFICAÇÃO MANUAL ===');
  if (user?.permissions && Array.isArray(user.permissions)) {
    console.log('user.permissions.includes(PERMISSIONS.FINANCIAL_REPORTS):', 
      user.permissions.includes(PERMISSIONS.FINANCIAL_REPORTS));
    console.log('user.permissions array:', user.permissions);
  }
};

// Para usar: chame debugPermissions() no componente Financeiro
export default debugPermissions; 
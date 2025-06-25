// Função para obter todos os agendamentos com base no status fornecido
exports.getAppointmentsByStatus = functions.https.onRequest(async (req, res) => {
  console.log('Função getAppointmentsByStatus acionada');
  console.log('Método HTTP:', req.method);
  console.log('Query params:', JSON.stringify(req.query));
  
  // Permitir CORS
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  
  // Lidar com requisições OPTIONS (preflight)
  if (req.method === 'OPTIONS') {
    return res.status(204).send('');
  }
  
  // Verificar método
  if (req.method !== 'GET' && req.method !== 'POST') {
    console.log('Método não permitido:', req.method);
    return res.status(405).json({ error: 'Método não permitido. Use GET ou POST.' });
  }
  
  // Obter o status da query (GET) ou do body (POST)
  let status;
  if (req.method === 'GET') {
    status = req.query.status;
  } else {
    status = req.body.status;
  }
  
  // Validar o status
  if (!status) {
    console.log('Status não fornecido');
    return res.status(400).json({ 
      error: 'Status é obrigatório. Forneça um status válido como parâmetro de consulta ou no corpo da requisição.',
      validStatus: ['pendente', 'confirmado', 'cancelado', 'todos']
    });
  }
  
  try {
    const db = admin.firestore();
    let appointmentsQuery = db.collection('agendamentos');
    
    // Aplicar filtro por status, exceto se for 'todos'
    if (status !== 'todos') {
      appointmentsQuery = appointmentsQuery.where('status', '==', status);
    }
    
    // Executar a consulta
    const appointmentsSnapshot = await appointmentsQuery.get();
    
    if (appointmentsSnapshot.empty) {
      console.log(`Nenhum agendamento com status "${status}" encontrado`);
      return res.status(200).json({
        status: status,
        count: 0,
        message: `Nenhum agendamento com status "${status}" encontrado`,
        appointments: []
      });
    }
    
    // Processar os resultados
    const appointments = [];
    appointmentsSnapshot.forEach(doc => {
      appointments.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    console.log(`Encontrados ${appointments.length} agendamentos com status "${status}"`);
    
    // Ordenar por data e horário (se disponíveis)
    appointments.sort((a, b) => {
      // Primeiro comparar por data
      if (a.data && b.data) {
        const [dayA, monthA, yearA] = a.data.split('/').map(Number);
        const [dayB, monthB, yearB] = b.data.split('/').map(Number);
        
        const dateA = new Date(yearA, monthA - 1, dayA);
        const dateB = new Date(yearB, monthB - 1, dayB);
        
        if (dateA.getTime() !== dateB.getTime()) {
          return dateA - dateB;
        }
      }
      
      // Se as datas forem iguais, comparar por horário
      if (a.horario && b.horario) {
        const getMinutos = (horario) => {
          const [hora, minuto] = horario.split(':').map(Number);
          return hora * 60 + minuto;
        };
        
        return getMinutos(a.horario) - getMinutos(b.horario);
      }
      
      return 0;
    });
    
    return res.status(200).json({
      status: status,
      count: appointments.length,
      appointments: appointments
    });
  } catch (error) {
    console.error(`Erro ao buscar agendamentos com status "${status}":`, error);
    return res.status(500).json({
      error: 'Erro interno ao buscar agendamentos',
      details: error.message
    });
  }
});

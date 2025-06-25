const functions = require('firebase-functions');
const admin = require('firebase-admin');
const fetch = require('node-fetch');
admin.initializeApp();

/**
 * Cloud Function que executa diariamente à meia-noite para atualizar
 * o status das datas que chegaram ao dia da consulta.
 * Marca automaticamente como "Indisponível" as datas que já passaram.
 */
exports.updateDateAvailability = functions.pubsub.schedule('0 0 * * *').onRun(async (context) => {
  const db = admin.firestore();
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Zerar horas para comparar apenas datas
  
  console.log(`Executando atualização automática de datas em: ${today.toISOString()}`);
  
  try {
    const querySnapshot = await db.collection('datas_disponiveis').get();
    
    if (querySnapshot.empty) {
      console.log('Nenhuma data disponível encontrada para verificar.');
      return null;
    }
    
    const batch = db.batch();
    let updateCount = 0;
    
    querySnapshot.docs.forEach(doc => {
      const data = doc.data();
      const dateString = data.data; // Formato esperado: DD/MM/YYYY
      
      // Converter string de data para objeto Date
      const [day, month, year] = dateString.split('/').map(Number);
      const dateObj = new Date(year, month - 1, day); // Mês em JS é 0-indexed
      
      // Se a data já chegou ao dia da consulta e ainda está marcada como disponível
      if (dateObj <= today && data.status === 'Disponível') {
        console.log(`Atualizando data ${dateString} para Indisponível`);
        batch.update(doc.ref, { status: 'Indisponível' });
        updateCount++;
      }
    });
    
    if (updateCount > 0) {
      await batch.commit();
      console.log(`${updateCount} datas foram atualizadas para Indisponível.`);
    } else {
      console.log('Nenhuma data precisou ser atualizada.');
    }
    
    return null;
  } catch (error) {
    console.error('Erro ao atualizar datas:', error);
    return null;
  }
});

/**
 * Cloud Function que é acionada quando um novo agendamento é criado.
 * Envia os dados do agendamento para um webhook do n8n para processamento
 * e envio de notificação via WhatsApp.
 */
exports.notifyAppointment = functions.firestore
  .document('agendamentos/{appointmentId}')
  .onCreate(async (snapshot, context) => {
    console.log('Função notifyAppointment acionada para o documento:', context.params.appointmentId);
    
    try {
      const appointmentData = snapshot.data();
      console.log('Dados do agendamento:', JSON.stringify(appointmentData));
      
      const { telefone, nome, cidade, data, horario, medico } = appointmentData;
      
      // Verificar se temos um número de telefone válido
      if (!telefone) {
        console.log('Agendamento sem telefone válido, pulando notificação');
        return null;
      }
      
      // Formatar número de telefone (remover caracteres não numéricos)
      const phoneDigits = telefone.replace(/\D/g, '');
      console.log('Dígitos do telefone após remoção de caracteres não numéricos:', phoneDigits);
      
      // Verificar se o número tem o formato correto (10 ou 11 dígitos)
      if (phoneDigits.length < 10 || phoneDigits.length > 11) {
        console.log(`Número de telefone inválido: ${telefone}, pulando notificação`);
        return null;
      }
      
      // Adicionar código do país se necessário (assumindo Brasil - 55)
      // Garantir que não estamos adicionando 55 duas vezes
      const fullPhoneNumber = phoneDigits.startsWith('55') 
        ? phoneDigits 
        : `55${phoneDigits}`;
      
      console.log(`Número de telefone formatado: ${fullPhoneNumber}`);
      
      // Preparar dados para enviar ao webhook do n8n
      const webhookData = {
        nomeacaoID: context.params.appointmentId,
        telefone: fullPhoneNumber,
        nome: nome || 'Paciente',
        cidade: cidade || '',
        data: data || '',
        horario: horario || '',
        medico: medico || '',
        timestamp: new Date().toISOString()
      };
      
      const webhookUrl = functions.config().n8n?.webhook_url || 
                        'https://webhook.samtecsolucoes.com.br/webhook/template';
      
      console.log('URL do webhook:', webhookUrl);
      
      // Enviar dados para o webhook do n8n
      try {
        console.log('Iniciando requisição para o webhook...');
        console.log('Dados sendo enviados:', JSON.stringify(webhookData, null, 2));
        console.log('URL do webhook:', webhookUrl);
        
        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(webhookData),
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Erro na resposta do webhook: ${response.status} ${response.statusText}`);
          console.error('Detalhes do erro:', errorText);
          throw new Error(`Erro na resposta do webhook: ${response.status} ${response.statusText}`);
        }
        
        const responseData = await response.json();
        console.log('Resposta do webhook:', JSON.stringify(responseData, null, 2));
        
        // Atualizar o documento do agendamento com a confirmação de envio
        await snapshot.ref.update({
          notificacaoEnviada: true,
          notificacaoEnviadaEm: admin.firestore.FieldValue.serverTimestamp(),
          notificacaoResposta: responseData
        });
        
        console.log('Notificação enviada com sucesso e documento atualizado.');
        return null;
      } catch (fetchError) {
        console.error('Erro na requisição fetch:', fetchError.message);
        throw fetchError; // Re-throw para ser capturado pelo catch externo
      }
    } catch (error) {
      console.error('Erro ao enviar notificação de agendamento:', error);
      console.error('Stack trace:', error.stack);
      
      try {
        // Registrar o erro no documento para facilitar a depuração
        await snapshot.ref.update({
          notificacaoErro: {
            mensagem: error.message,
            timestamp: admin.firestore.FieldValue.serverTimestamp()
          }
        });
        console.log('Documento atualizado com informações de erro.');
      } catch (updateError) {
        console.error('Erro ao atualizar documento com erro:', updateError);
      }
      
      return null;
    }
  });


/**
 * Cloud Function que permite atualizar o status de um agendamento via HTTP.
 * Esta função é projetada para ser chamada pelo n8n quando um cliente responde a um template de WhatsApp.
 */
exports.updateAppointmentStatus = functions.https.onRequest(async (req, res) => {
  console.log('Função updateAppointmentStatus acionada');
  console.log('Método HTTP:', req.method);
  console.log('Headers:', JSON.stringify(req.headers));
  console.log('Body:', JSON.stringify(req.body));
  
  // Verificar se a requisição é POST
  if (req.method !== 'POST') {
    console.log('Método não permitido:', req.method);
    return res.status(405).json({ error: 'Método não permitido. Use POST.' });
  }
  
  // Verificar se o corpo da requisição contém os dados necessários
  const { appointmentId, status, token } = req.body;
  
  // Validar token de segurança (opcional, mas recomendado)
  const expectedToken = functions.config().webhook?.security_token || 'samtecsolucoes_token';
  if (token !== expectedToken) {
    console.error('Token de segurança inválido');
    return res.status(403).json({ error: 'Token de segurança inválido' });
  }
  
  if (!appointmentId) {
    console.error('ID do agendamento não fornecido');
    return res.status(400).json({ error: 'ID do agendamento é obrigatório' });
  }
  
  if (!status || !['pendente', 'confirmado', 'cancelado'].includes(status)) {
    console.error('Status inválido:', status);
    return res.status(400).json({ 
      error: 'Status inválido. Use "pendente", "confirmado" ou "cancelado".' 
    });
  }
  
  try {
    const db = admin.firestore();
    const appointmentRef = db.collection('agendamentos').doc(appointmentId);
    
    // Verificar se o agendamento existe
    const appointmentDoc = await appointmentRef.get();
    if (!appointmentDoc.exists) {
      console.error(`Agendamento com ID ${appointmentId} não encontrado`);
      return res.status(404).json({ error: 'Agendamento não encontrado' });
    }
    
    // Atualizar o status do agendamento
    await appointmentRef.update({
      status: status,
      statusAtualizadoEm: admin.firestore.FieldValue.serverTimestamp(),
      statusAtualizadoPor: 'webhook-n8n'
    });
    
    console.log(`Status do agendamento ${appointmentId} atualizado para ${status}`);
    
    // Retornar resposta de sucesso
    return res.status(200).json({
      success: true,
      message: `Status do agendamento atualizado para ${status}`,
      appointmentId: appointmentId,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erro ao atualizar status do agendamento:', error);
    return res.status(500).json({
      error: 'Erro interno ao atualizar status',
      details: error.message
    });
  }
});

// Função para verificar a estrutura da coleção de agendamentos
exports.checkAppointmentsCollection = functions.https.onRequest(async (req, res) => {
  console.log('Função checkAppointmentsCollection acionada');
  
  try {
    const db = admin.firestore();
    const appointmentsSnapshot = await db.collection('agendamentos').where('status', '==', 'pendente').get();
    
    if (appointmentsSnapshot.empty) {
      console.log('Nenhum agendamento encontrado na coleção');
      return res.status(200).json({
        message: 'Nenhum agendamento encontrado na coleção'
      });
    }
    
    const appointments = [];
    appointmentsSnapshot.forEach(doc => {
      appointments.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    console.log(`Encontrados ${appointments.length} agendamentos na coleção`);
    console.log('Exemplo de agendamento:', JSON.stringify(appointments[0]));
    
    return res.status(200).json({
      count: appointments.length,
      sample: appointments
    });
  } catch (error) {
    console.error('Erro ao verificar coleção de agendamentos:', error);
    return res.status(500).json({
      error: error.message
    });
  }
});

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

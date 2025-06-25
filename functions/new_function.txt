// Função para atualizar o status de agendamentos futuros para "pendente"
exports.updateFutureAppointmentsStatus = functions.https.onRequest(async (req, res) => {
  console.log('Função updateFutureAppointmentsStatus acionada');
  
  try {
    const db = admin.firestore();
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Zerar horas para comparar apenas datas
    
    console.log(`Data atual para comparação: ${today.toISOString()}`);
    
    // Buscar todos os agendamentos
    const appointmentsSnapshot = await db.collection('agendamentos').get();
    
    if (appointmentsSnapshot.empty) {
      console.log('Nenhum agendamento encontrado na coleção');
      return res.status(200).json({
        message: 'Nenhum agendamento encontrado na coleção'
      });
    }
    
    const batch = db.batch();
    let updateCount = 0;
    const updatedAppointments = [];
    
    appointmentsSnapshot.forEach(doc => {
      const appointmentData = doc.data();
      const dateString = appointmentData.data; // Formato esperado: DD/MM/YYYY
      
      // Verificar se temos uma data válida
      if (!dateString) {
        console.log(`Agendamento ${doc.id} não possui data válida, pulando`);
        return;
      }
      
      // Converter string de data para objeto Date
      const [day, month, year] = dateString.split('/').map(Number);
      const appointmentDate = new Date(year, month - 1, day); // Mês em JS é 0-indexed
      
      // Se a data do agendamento é no futuro (maior que hoje)
      if (appointmentDate > today) {
        console.log(`Agendamento ${doc.id} com data ${dateString} é futuro, atualizando para pendente`);
        batch.update(doc.ref, { status: 'pendente' });
        updateCount++;
        updatedAppointments.push({
          id: doc.id,
          data: dateString,
          status: 'pendente'
        });
      }
    });
    
    if (updateCount > 0) {
      await batch.commit();
      console.log(`${updateCount} agendamentos foram atualizados para pendente.`);
    } else {
      console.log('Nenhum agendamento precisou ser atualizado.');
    }
    
    return res.status(200).json({
      message: `${updateCount} agendamentos foram atualizados para pendente.`,
      updatedAppointments: updatedAppointments
    });
  } catch (error) {
    console.error('Erro ao atualizar status dos agendamentos:', error);
    return res.status(500).json({
      error: error.message
    });
  }
});

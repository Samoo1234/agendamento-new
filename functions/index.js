const functions = require('firebase-functions');
const admin = require('firebase-admin');
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

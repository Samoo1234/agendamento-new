/**
 * Utilitários para trabalhar com dados do Firebase
 */

/**
 * Converte um timestamp do Firestore para um objeto Date do JavaScript
 * @param {Object} timestamp - Objeto timestamp do Firestore com seconds e nanoseconds
 * @returns {Date|null} - Objeto Date ou null se o timestamp for inválido
 */
export const timestampToDate = (timestamp) => {
  // Verificar se o timestamp é um objeto válido com seconds
  if (timestamp && typeof timestamp === 'object' && 'seconds' in timestamp) {
    try {
      // Converter seconds para milissegundos e criar um objeto Date
      return new Date(timestamp.seconds * 1000);
    } catch (error) {
      console.error('Erro ao converter timestamp:', error);
      return null;
    }
  }
  
  // Se já for um objeto Date, retornar como está
  if (timestamp instanceof Date) {
    return timestamp;
  }
  
  // Se for uma string de data válida, converter para Date
  if (typeof timestamp === 'string') {
    try {
      const date = new Date(timestamp);
      if (!isNaN(date.getTime())) {
        return date;
      }
    } catch (error) {
      console.error('Erro ao converter string para data:', error);
    }
  }
  
  // Caso não seja possível converter, retornar null
  return null;
};

/**
 * Verifica se um valor é um timestamp do Firestore
 * @param {any} value - Valor a ser verificado
 * @returns {boolean} - True se for um timestamp do Firestore
 */
export const isFirestoreTimestamp = (value) => {
  return value && 
         typeof value === 'object' && 
         'seconds' in value && 
         'nanoseconds' in value;
};

/**
 * Sanitiza um objeto removendo timestamps do Firestore e convertendo-os para strings ISO
 * @param {Object} obj - Objeto a ser sanitizado
 * @returns {Object} - Objeto sanitizado
 */
export const sanitizeFirestoreData = (obj) => {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }
  
  // Se for um array, mapear cada item
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeFirestoreData(item));
  }
  
  // Se for um timestamp do Firestore, converter para string ISO
  if (isFirestoreTimestamp(obj)) {
    const date = timestampToDate(obj);
    return date ? date.toISOString() : null;
  }
  
  // Para objetos regulares, processar cada propriedade
  const result = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      result[key] = sanitizeFirestoreData(obj[key]);
    }
  }
  
  return result;
};

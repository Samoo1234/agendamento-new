import { 
  collection, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query,
  where
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { sanitizeFirestoreData } from '../utils/firebaseUtils';

// Função para buscar todos os templates enviados
export const getTemplatesEnviados = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'templates_enviados'));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...sanitizeFirestoreData(doc.data()) }));
  } catch (error) {
    console.error('Erro ao buscar templates enviados:', error);
    return [];
  }
};

// Função para buscar um template enviado específico pelo ID
export const getTemplateEnviadoById = async (id) => {
  try {
    const docRef = doc(db, 'templates_enviados', id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...sanitizeFirestoreData(docSnap.data()) };
    } else {
      console.log('Template enviado não encontrado com ID:', id);
      return null;
    }
  } catch (error) {
    console.error('Erro ao buscar template enviado por ID:', error);
    throw error;
  }
};

// Função para adicionar um novo template enviado
export const addTemplateEnviado = async (templateData) => {
  try {
    // Garantir que o campo active seja um booleano
    const dataToSave = {
      ...templateData,
      active: Boolean(templateData.active)
    };
    
    const docRef = await addDoc(collection(db, 'templates_enviados'), dataToSave);
    console.log('Template enviado adicionado com ID:', docRef.id);
    return { id: docRef.id, ...sanitizeFirestoreData(dataToSave) };
  } catch (error) {
    console.error('Erro ao adicionar template enviado:', error);
    throw error;
  }
};

// Função para atualizar um template enviado existente
export const updateTemplateEnviado = async (id, templateData) => {
  try {
    // Garantir que o campo active seja um booleano
    const dataToUpdate = {
      ...templateData
    };
    
    if (templateData.active !== undefined) {
      dataToUpdate.active = Boolean(templateData.active);
    }
    
    const templateRef = doc(db, 'templates_enviados', id);
    await updateDoc(templateRef, dataToUpdate);
    console.log('Template enviado atualizado com ID:', id);
    return { id, ...sanitizeFirestoreData(dataToUpdate) };
  } catch (error) {
    console.error('Erro ao atualizar template enviado:', error);
    throw error;
  }
};

// Função para excluir um template enviado
export const deleteTemplateEnviado = async (id) => {
  try {
    const templateRef = doc(db, 'templates_enviados', id);
    await deleteDoc(templateRef);
    console.log('Template enviado excluído com ID:', id);
    return true;
  } catch (error) {
    console.error('Erro ao excluir template enviado:', error);
    throw error;
  }
};

// Função para buscar templates enviados por id_documento
export const getTemplatesByDocumento = async (idDocumento) => {
  try {
    const templatesRef = collection(db, 'templates_enviados');
    const q = query(templatesRef, where("id_documento", "==", idDocumento));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...sanitizeFirestoreData(doc.data()) }));
  } catch (error) {
    console.error('Erro ao buscar templates por id_documento:', error);
    return [];
  }
};

// Função para buscar templates enviados por id_template
export const getTemplatesByTemplate = async (idTemplate) => {
  try {
    const templatesRef = collection(db, 'templates_enviados');
    const q = query(templatesRef, where("id_template", "==", idTemplate));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...sanitizeFirestoreData(doc.data()) }));
  } catch (error) {
    console.error('Erro ao buscar templates por id_template:', error);
    return [];
  }
};

// Função para buscar templates enviados ativos
export const getActiveTemplates = async () => {
  try {
    const templatesRef = collection(db, 'templates_enviados');
    const q = query(templatesRef, where("active", "==", true));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...sanitizeFirestoreData(doc.data()) }));
  } catch (error) {
    console.error('Erro ao buscar templates ativos:', error);
    return [];
  }
};

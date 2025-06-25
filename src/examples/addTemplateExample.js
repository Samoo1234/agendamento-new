import { addTemplateEnviado } from '../services/templatesService';

// Função para adicionar um exemplo de template enviado
const addExampleTemplate = async () => {
  try {
    // Dados do template a ser adicionado
    const templateData = {
      id_documento: 'doc123', // ID do documento relacionado
      id_template: 'template456', // ID do template usado
      active: true // Status ativo (true) ou inativo (false)
    };
    
    // Adicionar o template ao Firebase
    const result = await addTemplateEnviado(templateData);
    
    console.log('Template adicionado com sucesso:', result);
    return result;
  } catch (error) {
    console.error('Erro ao adicionar template:', error);
    throw error;
  }
};

export default addExampleTemplate;

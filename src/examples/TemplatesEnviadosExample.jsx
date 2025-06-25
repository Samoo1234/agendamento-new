import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import * as templatesService from '../services/templatesService';
import toast from 'react-hot-toast';

const Container = styled.div`
  padding: 20px;
`;

const Title = styled.h2`
  color: #333;
  margin-bottom: 20px;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 15px;
  max-width: 500px;
  margin-bottom: 30px;
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background-color: #f9f9f9;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 5px;
`;

const Label = styled.label`
  font-weight: 500;
`;

const Input = styled.input`
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
`;

const CheckboxContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const Button = styled.button`
  padding: 10px;
  background-color: #000080;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;

  &:hover {
    opacity: 0.9;
  }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
`;

const Th = styled.th`
  padding: 12px;
  text-align: left;
  background-color: #f8f9fa;
  border-bottom: 2px solid #dee2e6;
`;

const Td = styled.td`
  padding: 12px;
  border-bottom: 1px solid #dee2e6;
`;

const ActionButton = styled.button`
  padding: 5px 10px;
  background-color: ${props => props.$variant === 'edit' ? '#28a745' : '#dc3545'};
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-right: 5px;

  &:hover {
    opacity: 0.9;
  }
`;

const StatusBadge = styled.span`
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  background-color: ${props => props.$active ? '#28a745' : '#dc3545'};
  color: white;
`;

const TemplatesEnviadosExample = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    id_documento: '',
    id_template: '',
    active: true
  });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const data = await templatesService.getTemplatesEnviados();
      setTemplates(data);
    } catch (error) {
      console.error('Erro ao carregar templates:', error);
      toast.error('Erro ao carregar templates');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingId) {
        await templatesService.updateTemplateEnviado(editingId, formData);
        toast.success('Template atualizado com sucesso!');
      } else {
        await templatesService.addTemplateEnviado(formData);
        toast.success('Template adicionado com sucesso!');
      }
      
      resetForm();
      loadTemplates();
    } catch (error) {
      console.error('Erro ao salvar template:', error);
      toast.error('Erro ao salvar template');
    }
  };

  const handleEdit = async (id) => {
    try {
      const template = await templatesService.getTemplateEnviadoById(id);
      if (template) {
        setFormData({
          id_documento: template.id_documento || '',
          id_template: template.id_template || '',
          active: template.active || false
        });
        setEditingId(id);
      }
    } catch (error) {
      console.error('Erro ao carregar template para edição:', error);
      toast.error('Erro ao carregar template para edição');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir este template?')) {
      try {
        await templatesService.deleteTemplateEnviado(id);
        toast.success('Template excluído com sucesso!');
        loadTemplates();
      } catch (error) {
        console.error('Erro ao excluir template:', error);
        toast.error('Erro ao excluir template');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      id_documento: '',
      id_template: '',
      active: true
    });
    setEditingId(null);
  };

  return (
    <Container>
      <Title>Gerenciar Templates Enviados</Title>
      
      <Form onSubmit={handleSubmit}>
        <h3>{editingId ? 'Editar Template' : 'Novo Template'}</h3>
        
        <FormGroup>
          <Label htmlFor="id_documento">ID do Documento</Label>
          <Input
            type="text"
            id="id_documento"
            name="id_documento"
            value={formData.id_documento}
            onChange={handleChange}
            required
          />
        </FormGroup>
        
        <FormGroup>
          <Label htmlFor="id_template">ID do Template</Label>
          <Input
            type="text"
            id="id_template"
            name="id_template"
            value={formData.id_template}
            onChange={handleChange}
            required
          />
        </FormGroup>
        
        <FormGroup>
          <CheckboxContainer>
            <Input
              type="checkbox"
              id="active"
              name="active"
              checked={formData.active}
              onChange={handleChange}
            />
            <Label htmlFor="active">Ativo</Label>
          </CheckboxContainer>
        </FormGroup>
        
        <div style={{ display: 'flex', gap: '10px' }}>
          <Button type="submit">
            {editingId ? 'Atualizar' : 'Adicionar'}
          </Button>
          
          {editingId && (
            <Button 
              type="button" 
              onClick={resetForm}
              style={{ backgroundColor: '#6c757d' }}
            >
              Cancelar
            </Button>
          )}
        </div>
      </Form>
      
      {loading ? (
        <div>Carregando...</div>
      ) : templates.length === 0 ? (
        <div>Nenhum template encontrado.</div>
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>ID do Documento</Th>
              <Th>ID do Template</Th>
              <Th>Status</Th>
              <Th>Ações</Th>
            </tr>
          </thead>
          <tbody>
            {templates.map(template => (
              <tr key={template.id}>
                <Td>{template.id_documento}</Td>
                <Td>{template.id_template}</Td>
                <Td>
                  <StatusBadge $active={template.active}>
                    {template.active ? 'Ativo' : 'Inativo'}
                  </StatusBadge>
                </Td>
                <Td>
                  <ActionButton 
                    $variant="edit" 
                    onClick={() => handleEdit(template.id)}
                  >
                    Editar
                  </ActionButton>
                  <ActionButton 
                    $variant="delete" 
                    onClick={() => handleDelete(template.id)}
                  >
                    Excluir
                  </ActionButton>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </Container>
  );
};

export default TemplatesEnviadosExample;

import { apiClient } from './client';
import type {
  Lead,
  LeadWithInteractions,
  LeadFormData,
  Interaction,
  Message,
  MessageGeneration,
  LeadScoreResponse,
  PipelineStats,
  PipelineStage,
} from '../types';

export const leadsApi = {
  // Get all leads
  getLeads: async (params?: {
    skip?: number;
    limit?: number;
    stage?: PipelineStage;
    search?: string;
  }): Promise<Lead[]> => {
    const { data } = await apiClient.get('/leads', { params });
    return data;
  },

  // Get single lead with interactions
  getLead: async (id: number): Promise<LeadWithInteractions> => {
    const { data } = await apiClient.get(`/leads/${id}`);
    return data;
  },

  // Create new lead
  createLead: async (leadData: LeadFormData): Promise<Lead> => {
    const { data } = await apiClient.post('/leads', leadData);
    return data;
  },

  // Update lead
  updateLead: async (id: number, leadData: Partial<LeadFormData>): Promise<Lead> => {
    const { data } = await apiClient.put(`/leads/${id}`, leadData);
    return data;
  },

  // Delete lead
  deleteLead: async (id: number): Promise<void> => {
    await apiClient.delete(`/leads/${id}`);
  },

  // Qualify lead
  qualifyLead: async (id: number): Promise<any> => {
    const { data } = await apiClient.post(`/leads/${id}/qualify`);
    return data;
  },

  // Score lead
  scoreLead: async (id: number, criteriaIds?: number[]): Promise<LeadScoreResponse> => {
    const { data } = await apiClient.post(`/leads/${id}/score`, {
      lead_id: id,
      criteria_ids: criteriaIds,
    });
    return data;
  },

  // Add interaction
  addInteraction: async (
    leadId: number,
    interaction: Omit<Interaction, 'id' | 'lead_id' | 'created_at'>
  ): Promise<Interaction> => {
    const { data } = await apiClient.post(`/leads/${leadId}/interactions`, {
      ...interaction,
      lead_id: leadId,
    });
    return data;
  },

  // Get lead interactions
  getInteractions: async (leadId: number): Promise<Interaction[]> => {
    const { data } = await apiClient.get(`/leads/${leadId}/interactions`);
    return data;
  },

  // Generate message
  generateMessage: async (
    leadId: number,
    messageData: MessageGeneration
  ): Promise<Message> => {
    const { data } = await apiClient.post(`/leads/${leadId}/messages/generate`, {
      ...messageData,
      lead_id: leadId,
    });
    return data;
  },

  // Get lead messages
  getMessages: async (leadId: number): Promise<Message[]> => {
    const { data } = await apiClient.get(`/leads/${leadId}/messages`);
    return data;
  },

  // Get pipeline stats
  getPipelineStats: async (): Promise<PipelineStats> => {
    const { data } = await apiClient.get('/leads/stats/pipeline');
    return data;
  },
};

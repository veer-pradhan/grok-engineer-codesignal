export interface Lead {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  company_name: string;
  job_title?: string;
  company_size?: string;
  industry?: string;
  company_website?: string;
  linkedin_url?: string;
  notes?: string;
  lead_score: number;
  pipeline_stage: PipelineStage;
  created_at: string;
  updated_at: string;
}

export interface LeadWithInteractions extends Lead {
  interactions: Interaction[];
  messages: Message[];
}

export interface Interaction {
  id: number;
  lead_id: number;
  interaction_type: InteractionType;
  subject?: string;
  content: string;
  created_at: string;
}

export interface Message {
  id: number;
  lead_id: number;
  message_type: string;
  subject?: string;
  content: string;
  prompt_used?: string;
  created_at: string;
  sent_at?: string;
}

export interface ScoringCriteria {
  id: number;
  name: string;
  description?: string;
  weight: number;
  criteria_rules: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface Evaluation {
  id: number;
  test_name: string;
  prompt_template: string;
  test_input: string;
  expected_output?: string;
  actual_output: string;
  score?: number;
  passed: boolean;
  created_at: string;
  execution_time_ms?: number;
}

export interface EvaluationSummary {
  total_tests: number;
  passed_tests: number;
  failed_tests: number;
  average_score?: number;
  average_execution_time_ms?: number;
}

export interface SearchResult {
  id: number;
  type: string;
  title: string;
  content: string;
  score: number;
}

export enum PipelineStage {
  NEW = 'new',
  QUALIFIED = 'qualified',
  CONTACTED = 'contacted',
  MEETING_SCHEDULED = 'meeting_scheduled',
  PROPOSAL_SENT = 'proposal_sent',
  NEGOTIATION = 'negotiation',
  CLOSED_WON = 'closed_won',
  CLOSED_LOST = 'closed_lost',
}

export enum InteractionType {
  EMAIL = 'email',
  CALL = 'call',
  MEETING = 'meeting',
  LINKEDIN = 'linkedin',
  NOTE = 'note',
}

export interface LeadFormData {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  company_name: string;
  job_title?: string;
  company_size?: string;
  industry?: string;
  company_website?: string;
  linkedin_url?: string;
  notes?: string;
}

export interface MessageGeneration {
  message_type: string;
  custom_instructions?: string;
}

export interface LeadScoreResponse {
  lead_id: number;
  total_score: number;
  criteria_scores: Record<string, number>;
  recommendations: string[];
}

export interface PipelineStats {
  [key: string]: number;
}

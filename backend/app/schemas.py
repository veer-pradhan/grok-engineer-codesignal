from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, EmailStr, validator

from app.models import PipelineStage, InteractionType


# Lead Schemas
class LeadBase(BaseModel):
    """Base lead schema."""
    first_name: str
    last_name: str
    email: EmailStr
    phone: Optional[str] = None
    company_name: str
    job_title: Optional[str] = None
    company_size: Optional[str] = None
    industry: Optional[str] = None
    company_website: Optional[str] = None
    linkedin_url: Optional[str] = None
    notes: Optional[str] = None


class LeadCreate(LeadBase):
    """Lead creation schema."""
    pass


class LeadUpdate(BaseModel):
    """Lead update schema."""
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    company_name: Optional[str] = None
    job_title: Optional[str] = None
    company_size: Optional[str] = None
    industry: Optional[str] = None
    company_website: Optional[str] = None
    linkedin_url: Optional[str] = None
    notes: Optional[str] = None
    lead_score: Optional[float] = None
    pipeline_stage: Optional[PipelineStage] = None


class Lead(LeadBase):
    """Lead response schema."""
    id: int
    lead_score: float
    pipeline_stage: PipelineStage
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class LeadWithInteractions(Lead):
    """Lead with interactions schema."""
    interactions: List['Interaction'] = []
    messages: List['Message'] = []


# Interaction Schemas
class InteractionBase(BaseModel):
    """Base interaction schema."""
    interaction_type: InteractionType
    subject: Optional[str] = None
    content: str


class InteractionCreate(InteractionBase):
    """Interaction creation schema."""
    lead_id: int


class Interaction(InteractionBase):
    """Interaction response schema."""
    id: int
    lead_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True


# Message Schemas
class MessageBase(BaseModel):
    """Base message schema."""
    message_type: str
    subject: Optional[str] = None
    content: str


class MessageCreate(MessageBase):
    """Message creation schema."""
    lead_id: int


class MessageGenerate(BaseModel):
    """Message generation request schema."""
    lead_id: int
    message_type: str
    custom_instructions: Optional[str] = None


class Message(MessageBase):
    """Message response schema."""
    id: int
    lead_id: int
    prompt_used: Optional[str] = None
    created_at: datetime
    sent_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


# Scoring Schemas
class ScoringCriteriaBase(BaseModel):
    """Base scoring criteria schema."""
    name: str
    description: Optional[str] = None
    weight: float = 1.0
    criteria_rules: str


class ScoringCriteriaCreate(ScoringCriteriaBase):
    """Scoring criteria creation schema."""
    pass


class ScoringCriteria(ScoringCriteriaBase):
    """Scoring criteria response schema."""
    id: int
    created_at: datetime
    updated_at: datetime
    is_active: bool
    
    class Config:
        from_attributes = True


class LeadScoreRequest(BaseModel):
    """Lead scoring request schema."""
    lead_id: int
    criteria_ids: Optional[List[int]] = None


class LeadScoreResponse(BaseModel):
    """Lead scoring response schema."""
    lead_id: int
    total_score: float
    criteria_scores: Dict[str, float]
    recommendations: List[str]


# Evaluation Schemas
class EvaluationBase(BaseModel):
    """Base evaluation schema."""
    test_name: str
    prompt_template: str
    test_input: str
    expected_output: Optional[str] = None


class EvaluationCreate(EvaluationBase):
    """Evaluation creation schema."""
    pass


class EvaluationRun(BaseModel):
    """Evaluation run request schema."""
    test_cases: List[EvaluationCreate]


class Evaluation(EvaluationBase):
    """Evaluation response schema."""
    id: int
    actual_output: str
    score: Optional[float] = None
    passed: bool
    created_at: datetime
    execution_time_ms: Optional[int] = None
    
    class Config:
        from_attributes = True


class EvaluationSummary(BaseModel):
    """Evaluation summary schema."""
    total_tests: int
    passed_tests: int
    failed_tests: int
    average_score: Optional[float] = None
    average_execution_time_ms: Optional[float] = None


# General Response Schemas
class MessageResponse(BaseModel):
    """General message response schema."""
    message: str
    success: bool = True


class ErrorResponse(BaseModel):
    """Error response schema."""
    detail: str
    error_code: Optional[str] = None


# Grok API Schemas
class GrokRequest(BaseModel):
    """Grok API request schema."""
    prompt: str
    max_tokens: Optional[int] = 1000
    temperature: Optional[float] = 0.7


class GrokResponse(BaseModel):
    """Grok API response schema."""
    content: str
    usage: Optional[Dict[str, Any]] = None
    model: Optional[str] = None


# Search Schemas
class SearchRequest(BaseModel):
    """Search request schema."""
    query: str
    filters: Optional[Dict[str, Any]] = None
    limit: Optional[int] = 10


class SearchResult(BaseModel):
    """Search result schema."""
    id: int
    type: str  # 'lead', 'interaction', 'message'
    title: str
    content: str
    score: float

from datetime import datetime
from enum import Enum
from typing import Optional

from sqlalchemy import Column, Integer, String, Text, DateTime, Float, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship

from app.database import Base


class PipelineStage(str, Enum):
    """Sales pipeline stages."""
    NEW = "new"
    QUALIFIED = "qualified"
    CONTACTED = "contacted"
    MEETING_SCHEDULED = "meeting_scheduled"
    PROPOSAL_SENT = "proposal_sent"
    NEGOTIATION = "negotiation"
    CLOSED_WON = "closed_won"
    CLOSED_LOST = "closed_lost"


class InteractionType(str, Enum):
    """Types of lead interactions."""
    EMAIL = "email"
    CALL = "call"
    MEETING = "meeting"
    LINKEDIN = "linkedin"
    NOTE = "note"


class Lead(Base):
    """Lead model."""
    __tablename__ = "leads"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Basic Information
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    phone = Column(String(20), nullable=True)
    
    # Company Information
    company_name = Column(String(255), nullable=False)
    job_title = Column(String(255), nullable=True)
    company_size = Column(String(50), nullable=True)
    industry = Column(String(100), nullable=True)
    company_website = Column(String(255), nullable=True)
    
    # Lead Qualification
    lead_score = Column(Float, default=0.0)
    pipeline_stage = Column(SQLEnum(PipelineStage), default=PipelineStage.NEW)
    
    # Additional Data
    linkedin_url = Column(String(255), nullable=True)
    notes = Column(Text, nullable=True)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    interactions = relationship("Interaction", back_populates="lead", cascade="all, delete-orphan")
    messages = relationship("Message", back_populates="lead", cascade="all, delete-orphan")
    
    @property
    def full_name(self) -> str:
        """Get full name."""
        return f"{self.first_name} {self.last_name}"


class Interaction(Base):
    """Lead interaction model."""
    __tablename__ = "interactions"
    
    id = Column(Integer, primary_key=True, index=True)
    lead_id = Column(Integer, ForeignKey("leads.id"), nullable=False)
    
    # Interaction Details
    interaction_type = Column(SQLEnum(InteractionType), nullable=False)
    subject = Column(String(255), nullable=True)
    content = Column(Text, nullable=False)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    lead = relationship("Lead", back_populates="interactions")


class Message(Base):
    """Generated messages model."""
    __tablename__ = "messages"
    
    id = Column(Integer, primary_key=True, index=True)
    lead_id = Column(Integer, ForeignKey("leads.id"), nullable=False)
    
    # Message Details
    message_type = Column(String(50), nullable=False)  # email, linkedin, etc.
    subject = Column(String(255), nullable=True)
    content = Column(Text, nullable=False)
    
    # Grok Details
    prompt_used = Column(Text, nullable=True)
    grok_response_raw = Column(Text, nullable=True)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    sent_at = Column(DateTime, nullable=True)
    
    # Relationships
    lead = relationship("Lead", back_populates="messages")


class ScoringCriteria(Base):
    """Lead scoring criteria model."""
    __tablename__ = "scoring_criteria"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Criteria Details
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    weight = Column(Float, default=1.0)
    
    # Scoring Rules (stored as JSON-like text for simplicity)
    criteria_rules = Column(Text, nullable=False)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_active = Column(Integer, default=1)  # Using Integer for boolean compatibility


class Evaluation(Base):
    """Grok evaluation results model."""
    __tablename__ = "evaluations"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Evaluation Details
    test_name = Column(String(255), nullable=False)
    prompt_template = Column(Text, nullable=False)
    test_input = Column(Text, nullable=False)
    expected_output = Column(Text, nullable=True)
    actual_output = Column(Text, nullable=False)
    
    # Scoring
    score = Column(Float, nullable=True)
    passed = Column(Integer, default=0)  # Boolean as integer
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    execution_time_ms = Column(Integer, nullable=True)

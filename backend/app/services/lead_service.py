import logging
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models import Lead, Interaction, Message, ScoringCriteria, PipelineStage
from app.schemas import LeadCreate, LeadUpdate, InteractionCreate, MessageCreate
from app.services.grok_service import GrokService

logger = logging.getLogger(__name__)


class LeadService:
    """Service for lead management operations."""
    
    def __init__(self, db: Session):
        self.db = db
    
    def create_lead(self, lead_data: LeadCreate) -> Lead:
        """Create a new lead."""
        lead = Lead(**lead_data.model_dump())
        self.db.add(lead)
        self.db.commit()
        self.db.refresh(lead)
        logger.info(f"Created lead: {lead.id} - {lead.full_name}")
        return lead
    
    def get_lead(self, lead_id: int) -> Optional[Lead]:
        """Get a lead by ID."""
        return self.db.query(Lead).filter(Lead.id == lead_id).first()
    
    def get_leads(
        self,
        skip: int = 0,
        limit: int = 100,
        stage: Optional[PipelineStage] = None,
        search: Optional[str] = None
    ) -> List[Lead]:
        """Get leads with optional filtering."""
        query = self.db.query(Lead)
        
        if stage:
            query = query.filter(Lead.pipeline_stage == stage)
        
        if search:
            search_term = f"%{search}%"
            query = query.filter(
                (Lead.first_name.ilike(search_term)) |
                (Lead.last_name.ilike(search_term)) |
                (Lead.company_name.ilike(search_term)) |
                (Lead.email.ilike(search_term))
            )
        
        return query.offset(skip).limit(limit).all()
    
    def update_lead(self, lead_id: int, lead_data: LeadUpdate) -> Optional[Lead]:
        """Update a lead."""
        lead = self.get_lead(lead_id)
        if not lead:
            return None
        
        update_data = lead_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(lead, field, value)
        
        self.db.commit()
        self.db.refresh(lead)
        logger.info(f"Updated lead: {lead.id} - {lead.full_name}")
        return lead
    
    def delete_lead(self, lead_id: int) -> bool:
        """Delete a lead."""
        lead = self.get_lead(lead_id)
        if not lead:
            return False
        
        self.db.delete(lead)
        self.db.commit()
        logger.info(f"Deleted lead: {lead_id}")
        return True
    
    def add_interaction(self, interaction_data: InteractionCreate) -> Interaction:
        """Add an interaction to a lead."""
        interaction = Interaction(**interaction_data.model_dump())
        self.db.add(interaction)
        self.db.commit()
        self.db.refresh(interaction)
        logger.info(f"Added interaction for lead: {interaction.lead_id}")
        return interaction
    
    def get_lead_interactions(self, lead_id: int) -> List[Interaction]:
        """Get all interactions for a lead."""
        return self.db.query(Interaction).filter(
            Interaction.lead_id == lead_id
        ).order_by(Interaction.created_at.desc()).all()
    
    def add_message(self, message_data: MessageCreate) -> Message:
        """Add a message to a lead."""
        message = Message(**message_data.model_dump())
        self.db.add(message)
        self.db.commit()
        self.db.refresh(message)
        logger.info(f"Added message for lead: {message.lead_id}")
        return message
    
    def get_lead_messages(self, lead_id: int) -> List[Message]:
        """Get all messages for a lead."""
        return self.db.query(Message).filter(
            Message.lead_id == lead_id
        ).order_by(Message.created_at.desc()).all()
    
    async def qualify_lead(self, lead_id: int) -> Dict[str, Any]:
        """Qualify a lead using Grok."""
        lead = self.get_lead(lead_id)
        if not lead:
            raise ValueError("Lead not found")
        
        lead_data = {
            "first_name": lead.first_name,
            "last_name": lead.last_name,
            "email": lead.email,
            "company_name": lead.company_name,
            "job_title": lead.job_title,
            "industry": lead.industry,
            "company_size": lead.company_size,
            "company_website": lead.company_website
        }
        
        async with GrokService() as grok:
            qualification = await grok.qualify_lead(lead_data)
        
        # Update lead based on qualification
        if qualification.get("recommended_stage"):
            stage_mapping = {
                "new": PipelineStage.NEW,
                "qualified": PipelineStage.QUALIFIED,
                "contacted": PipelineStage.CONTACTED
            }
            new_stage = stage_mapping.get(qualification["recommended_stage"])
            if new_stage:
                lead.pipeline_stage = new_stage
        
        # Update lead score if provided
        if qualification.get("qualification_score"):
            lead.lead_score = qualification["qualification_score"] / 10.0  # Convert to 0-10 scale
        
        self.db.commit()
        self.db.refresh(lead)
        
        return qualification
    
    async def generate_message(
        self,
        lead_id: int,
        message_type: str,
        custom_instructions: Optional[str] = None
    ) -> Message:
        """Generate a personalized message for a lead."""
        lead = self.get_lead(lead_id)
        if not lead:
            raise ValueError("Lead not found")
        
        lead_data = {
            "first_name": lead.first_name,
            "last_name": lead.last_name,
            "email": lead.email,
            "company_name": lead.company_name,
            "job_title": lead.job_title,
            "industry": lead.industry,
            "company_size": lead.company_size,
            "company_website": lead.company_website
        }
        
        async with GrokService() as grok:
            content = await grok.generate_personalized_message(
                lead_data, message_type, custom_instructions
            )
        
        # Create message record
        message = Message(
            lead_id=lead_id,
            message_type=message_type,
            content=content,
            prompt_used=f"Generated {message_type} message with custom instructions: {custom_instructions or 'None'}"
        )
        
        self.db.add(message)
        self.db.commit()
        self.db.refresh(message)
        
        logger.info(f"Generated {message_type} message for lead: {lead_id}")
        return message
    
    async def score_lead(
        self,
        lead_id: int,
        criteria_ids: Optional[List[int]] = None
    ) -> Dict[str, Any]:
        """Score a lead based on criteria."""
        lead = self.get_lead(lead_id)
        if not lead:
            raise ValueError("Lead not found")
        
        # Get scoring criteria
        query = self.db.query(ScoringCriteria).filter(ScoringCriteria.is_active == 1)
        if criteria_ids:
            query = query.filter(ScoringCriteria.id.in_(criteria_ids))
        
        criteria = query.all()
        if not criteria:
            raise ValueError("No active scoring criteria found")
        
        lead_data = {
            "first_name": lead.first_name,
            "last_name": lead.last_name,
            "email": lead.email,
            "company_name": lead.company_name,
            "job_title": lead.job_title,
            "industry": lead.industry,
            "company_size": lead.company_size,
            "company_website": lead.company_website
        }
        
        criteria_data = [
            {
                "name": c.name,
                "description": c.description,
                "weight": c.weight,
                "rules": c.criteria_rules
            }
            for c in criteria
        ]
        
        async with GrokService() as grok:
            scoring_result = await grok.score_lead(lead_data, criteria_data)
        
        # Update lead score
        if scoring_result.get("total_score"):
            lead.lead_score = scoring_result["total_score"]
            self.db.commit()
            self.db.refresh(lead)
        
        return {
            "lead_id": lead_id,
            "total_score": scoring_result.get("total_score", 0),
            "criteria_scores": scoring_result.get("criteria_scores", {}),
            "recommendations": scoring_result.get("recommendations", [])
        }
    
    def get_pipeline_stats(self) -> Dict[str, int]:
        """Get pipeline statistics."""
        stats = {}
        for stage in PipelineStage:
            count = self.db.query(Lead).filter(Lead.pipeline_stage == stage).count()
            stats[stage.value] = count
        return stats
    
    def search_leads(self, query: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Search leads and related data."""
        # Search leads
        search_term = f"%{query}%"
        leads = self.db.query(Lead).filter(
            (Lead.first_name.ilike(search_term)) |
            (Lead.last_name.ilike(search_term)) |
            (Lead.company_name.ilike(search_term)) |
            (Lead.email.ilike(search_term)) |
            (Lead.job_title.ilike(search_term)) |
            (Lead.industry.ilike(search_term))
        ).limit(limit).all()
        
        # Search interactions
        interactions = self.db.query(Interaction).filter(
            (Interaction.subject.ilike(search_term)) |
            (Interaction.content.ilike(search_term))
        ).limit(limit).all()
        
        # Search messages
        messages = self.db.query(Message).filter(
            (Message.subject.ilike(search_term)) |
            (Message.content.ilike(search_term))
        ).limit(limit).all()
        
        results = []
        
        # Format lead results
        for lead in leads:
            results.append({
                "id": lead.id,
                "type": "lead",
                "title": f"{lead.full_name} - {lead.company_name}",
                "content": f"{lead.job_title} at {lead.company_name}",
                "score": 1.0
            })
        
        # Format interaction results
        for interaction in interactions:
            lead = self.get_lead(interaction.lead_id)
            results.append({
                "id": interaction.id,
                "type": "interaction",
                "title": f"Interaction with {lead.full_name if lead else 'Unknown'}",
                "content": interaction.content[:200] + "..." if len(interaction.content) > 200 else interaction.content,
                "score": 0.8
            })
        
        # Format message results
        for message in messages:
            lead = self.get_lead(message.lead_id)
            results.append({
                "id": message.id,
                "type": "message",
                "title": f"Message to {lead.full_name if lead else 'Unknown'}",
                "content": message.content[:200] + "..." if len(message.content) > 200 else message.content,
                "score": 0.6
            })
        
        # Sort by score descending
        results.sort(key=lambda x: x["score"], reverse=True)
        
        return results[:limit]

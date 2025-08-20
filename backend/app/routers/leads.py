from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import PipelineStage
from app.schemas import (
    Lead, LeadCreate, LeadUpdate, LeadWithInteractions,
    Interaction, InteractionCreate,
    Message, MessageGenerate,
    LeadScoreRequest, LeadScoreResponse,
    MessageResponse
)
from app.services.lead_service import LeadService

router = APIRouter(prefix="/leads", tags=["leads"])


@router.post("/", response_model=Lead)
def create_lead(lead: LeadCreate, db: Session = Depends(get_db)):
    """Create a new lead."""
    service = LeadService(db)
    return service.create_lead(lead)


@router.get("/", response_model=List[Lead])
def get_leads(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    stage: Optional[PipelineStage] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get leads with optional filtering."""
    service = LeadService(db)
    return service.get_leads(skip=skip, limit=limit, stage=stage, search=search)


@router.get("/{lead_id}", response_model=LeadWithInteractions)
def get_lead(lead_id: int, db: Session = Depends(get_db)):
    """Get a specific lead with interactions and messages."""
    service = LeadService(db)
    lead = service.get_lead(lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    # Get interactions and messages
    interactions = service.get_lead_interactions(lead_id)
    messages = service.get_lead_messages(lead_id)
    
    # Convert to response model
    lead_data = Lead.model_validate(lead)
    return LeadWithInteractions(
        **lead_data.model_dump(),
        interactions=[Interaction.model_validate(i) for i in interactions],
        messages=[Message.model_validate(m) for m in messages]
    )


@router.put("/{lead_id}", response_model=Lead)
def update_lead(lead_id: int, lead: LeadUpdate, db: Session = Depends(get_db)):
    """Update a lead."""
    service = LeadService(db)
    updated_lead = service.update_lead(lead_id, lead)
    if not updated_lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    return updated_lead


@router.delete("/{lead_id}")
def delete_lead(lead_id: int, db: Session = Depends(get_db)):
    """Delete a lead."""
    service = LeadService(db)
    if not service.delete_lead(lead_id):
        raise HTTPException(status_code=404, detail="Lead not found")
    return MessageResponse(message="Lead deleted successfully")


@router.post("/{lead_id}/qualify")
async def qualify_lead(lead_id: int, db: Session = Depends(get_db)):
    """Qualify a lead using Grok AI."""
    service = LeadService(db)
    try:
        qualification = await service.qualify_lead(lead_id)
        return qualification
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error qualifying lead: {str(e)}")


@router.post("/{lead_id}/score", response_model=LeadScoreResponse)
async def score_lead(
    lead_id: int,
    request: LeadScoreRequest,
    db: Session = Depends(get_db)
):
    """Score a lead based on criteria."""
    service = LeadService(db)
    try:
        score_result = await service.score_lead(lead_id, request.criteria_ids)
        return LeadScoreResponse(**score_result)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error scoring lead: {str(e)}")


@router.post("/{lead_id}/interactions", response_model=Interaction)
def add_interaction(
    lead_id: int,
    interaction: InteractionCreate,
    db: Session = Depends(get_db)
):
    """Add an interaction to a lead."""
    # Ensure lead_id matches
    interaction.lead_id = lead_id
    
    service = LeadService(db)
    
    # Verify lead exists
    if not service.get_lead(lead_id):
        raise HTTPException(status_code=404, detail="Lead not found")
    
    return service.add_interaction(interaction)


@router.get("/{lead_id}/interactions", response_model=List[Interaction])
def get_lead_interactions(lead_id: int, db: Session = Depends(get_db)):
    """Get all interactions for a lead."""
    service = LeadService(db)
    
    # Verify lead exists
    if not service.get_lead(lead_id):
        raise HTTPException(status_code=404, detail="Lead not found")
    
    return service.get_lead_interactions(lead_id)


@router.post("/{lead_id}/messages/generate", response_model=Message)
async def generate_message(
    lead_id: int,
    request: MessageGenerate,
    db: Session = Depends(get_db)
):
    """Generate a personalized message for a lead."""
    # Ensure lead_id matches
    request.lead_id = lead_id
    
    service = LeadService(db)
    try:
        message = await service.generate_message(
            lead_id,
            request.message_type,
            request.custom_instructions
        )
        return message
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating message: {str(e)}")


@router.get("/{lead_id}/messages", response_model=List[Message])
def get_lead_messages(lead_id: int, db: Session = Depends(get_db)):
    """Get all messages for a lead."""
    service = LeadService(db)
    
    # Verify lead exists
    if not service.get_lead(lead_id):
        raise HTTPException(status_code=404, detail="Lead not found")
    
    return service.get_lead_messages(lead_id)


@router.get("/stats/pipeline")
def get_pipeline_stats(db: Session = Depends(get_db)):
    """Get pipeline statistics."""
    service = LeadService(db)
    return service.get_pipeline_stats()

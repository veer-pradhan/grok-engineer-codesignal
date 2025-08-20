import json
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import ScoringCriteria as ScoringCriteriaModel
from app.schemas import ScoringCriteria, ScoringCriteriaCreate, MessageResponse

router = APIRouter(prefix="/scoring", tags=["scoring"])


@router.post("/criteria", response_model=ScoringCriteria)
def create_scoring_criteria(
    criteria: ScoringCriteriaCreate,
    db: Session = Depends(get_db)
):
    """Create new scoring criteria."""
    db_criteria = ScoringCriteriaModel(**criteria.model_dump())
    db.add(db_criteria)
    db.commit()
    db.refresh(db_criteria)
    return db_criteria


@router.get("/criteria", response_model=List[ScoringCriteria])
def get_scoring_criteria(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    active_only: bool = Query(True),
    db: Session = Depends(get_db)
):
    """Get scoring criteria."""
    query = db.query(ScoringCriteriaModel)
    
    if active_only:
        query = query.filter(ScoringCriteriaModel.is_active == 1)
    
    return query.offset(skip).limit(limit).all()


@router.get("/criteria/{criteria_id}", response_model=ScoringCriteria)
def get_scoring_criteria_by_id(criteria_id: int, db: Session = Depends(get_db)):
    """Get specific scoring criteria."""
    criteria = db.query(ScoringCriteriaModel).filter(
        ScoringCriteriaModel.id == criteria_id
    ).first()
    
    if not criteria:
        raise HTTPException(status_code=404, detail="Scoring criteria not found")
    
    return criteria


@router.put("/criteria/{criteria_id}", response_model=ScoringCriteria)
def update_scoring_criteria(
    criteria_id: int,
    criteria_update: ScoringCriteriaCreate,
    db: Session = Depends(get_db)
):
    """Update scoring criteria."""
    criteria = db.query(ScoringCriteriaModel).filter(
        ScoringCriteriaModel.id == criteria_id
    ).first()
    
    if not criteria:
        raise HTTPException(status_code=404, detail="Scoring criteria not found")
    
    for field, value in criteria_update.model_dump().items():
        setattr(criteria, field, value)
    
    db.commit()
    db.refresh(criteria)
    return criteria


@router.delete("/criteria/{criteria_id}")
def delete_scoring_criteria(criteria_id: int, db: Session = Depends(get_db)):
    """Delete scoring criteria (soft delete by setting inactive)."""
    criteria = db.query(ScoringCriteriaModel).filter(
        ScoringCriteriaModel.id == criteria_id
    ).first()
    
    if not criteria:
        raise HTTPException(status_code=404, detail="Scoring criteria not found")
    
    criteria.is_active = 0
    db.commit()
    
    return MessageResponse(message="Scoring criteria deactivated successfully")


@router.post("/criteria/defaults")
def create_default_scoring_criteria(db: Session = Depends(get_db)):
    """Create default scoring criteria."""
    default_criteria = [
        {
            "name": "Company Size",
            "description": "Score based on company size and potential budget",
            "weight": 3.0,
            "criteria_rules": json.dumps({
                "enterprise": 10,
                "large": 8,
                "medium": 6,
                "small": 3,
                "startup": 2
            })
        },
        {
            "name": "Job Title Authority",
            "description": "Score based on decision-making authority",
            "weight": 2.5,
            "criteria_rules": json.dumps({
                "c_level": 10,
                "vp_director": 8,
                "manager": 6,
                "individual_contributor": 3,
                "intern": 1
            })
        },
        {
            "name": "Industry Fit",
            "description": "Score based on industry alignment with our solution",
            "weight": 2.0,
            "criteria_rules": json.dumps({
                "technology": 10,
                "finance": 8,
                "healthcare": 7,
                "manufacturing": 6,
                "retail": 5,
                "other": 3
            })
        },
        {
            "name": "Engagement Level",
            "description": "Score based on lead engagement and responsiveness",
            "weight": 1.5,
            "criteria_rules": json.dumps({
                "high": 10,
                "medium": 6,
                "low": 3,
                "none": 1
            })
        }
    ]
    
    created_criteria = []
    for criteria_data in default_criteria:
        # Check if criteria already exists
        existing = db.query(ScoringCriteriaModel).filter(
            ScoringCriteriaModel.name == criteria_data["name"]
        ).first()
        
        if not existing:
            criteria = ScoringCriteriaModel(**criteria_data)
            db.add(criteria)
            created_criteria.append(criteria)
    
    db.commit()
    
    for criteria in created_criteria:
        db.refresh(criteria)
    
    return {
        "message": f"Created {len(created_criteria)} default scoring criteria",
        "criteria": created_criteria
    }

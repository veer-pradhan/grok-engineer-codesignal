from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas import (
    Evaluation, EvaluationCreate, EvaluationRun, EvaluationSummary,
    MessageResponse
)
from app.services.evaluation_service import EvaluationService

router = APIRouter(prefix="/evaluations", tags=["evaluations"])


@router.post("/run", response_model=List[Evaluation])
async def run_evaluations(
    request: EvaluationRun,
    db: Session = Depends(get_db)
):
    """Run evaluation test cases."""
    service = EvaluationService(db)
    try:
        results = await service.run_evaluation(request.test_cases)
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error running evaluations: {str(e)}")


@router.post("/run-defaults", response_model=List[Evaluation])
async def run_default_evaluations(db: Session = Depends(get_db)):
    """Run default evaluation test cases."""
    service = EvaluationService(db)
    try:
        results = await service.run_default_evaluations()
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error running default evaluations: {str(e)}")


@router.get("/", response_model=List[Evaluation])
def get_evaluations(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    test_name: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get evaluation results with optional filtering."""
    service = EvaluationService(db)
    return service.get_evaluations(skip=skip, limit=limit, test_name=test_name)


@router.get("/summary", response_model=EvaluationSummary)
def get_evaluation_summary(
    limit: Optional[int] = Query(None, ge=1),
    db: Session = Depends(get_db)
):
    """Get evaluation summary statistics."""
    service = EvaluationService(db)
    return service.get_evaluation_summary(limit=limit)


@router.delete("/{evaluation_id}")
def delete_evaluation(evaluation_id: int, db: Session = Depends(get_db)):
    """Delete an evaluation record."""
    service = EvaluationService(db)
    if not service.delete_evaluation(evaluation_id):
        raise HTTPException(status_code=404, detail="Evaluation not found")
    return MessageResponse(message="Evaluation deleted successfully")

from typing import List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas import SearchRequest, SearchResult
from app.services.lead_service import LeadService

router = APIRouter(prefix="/search", tags=["search"])


@router.get("/", response_model=List[SearchResult])
def search(
    query: str = Query(..., description="Search query"),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Search across leads, interactions, and messages."""
    service = LeadService(db)
    return service.search_leads(query, limit)


@router.post("/", response_model=List[SearchResult])
def search_advanced(request: SearchRequest, db: Session = Depends(get_db)):
    """Advanced search with filters."""
    service = LeadService(db)
    return service.search_leads(request.query, request.limit or 10)

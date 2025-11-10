from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from datetime import datetime

from app.core.database import get_db
from app.models.models import CV
from app.services.progress_tracker import ProgressTracker

router = APIRouter(prefix="/progress", tags=["Progress"])


# Pydantic models
class SnapshotResponse(BaseModel):
    snapshot_id: int
    date: str
    skills_count: int
    top_match_score: float
    new_skills: List[str]
    metrics: Dict[str, Any]


class TimelineEntry(BaseModel):
    id: int
    date: str
    skills_count: int
    top_match_score: float
    skills_learned: List[str]
    metrics: Dict[str, Any]


class AnalyticsResponse(BaseModel):
    skill_velocity: float
    match_improvement_rate: float
    total_skills_gained: int
    total_snapshots: int
    average_match_score: float
    best_match_pathway: str
    growth_trend: str
    skill_velocity_trend: List[Dict[str, Any]]
    match_score_trend: List[Dict[str, Any]]
    category_growth: List[Dict[str, Any]]
    learning_velocity: Dict[str, Any]
    recommendations_evolution: List[Dict[str, Any]]


class LearnedSkillCreate(BaseModel):
    skill_name: str
    proficiency_level: str = "beginner"
    status: str = "learning"


class LearnedSkillResponse(BaseModel):
    id: int
    skill_name: str
    date_learned: str
    proficiency_level: str
    status: str


@router.post("/{cv_id}/snapshot", response_model=SnapshotResponse)
def capture_progress_snapshot(cv_id: int, db: Session = Depends(get_db)):
    """
    Capture a snapshot of current CV state for progress tracking.
    
    Args:
        cv_id: CV ID
        db: Database session
        
    Returns:
        Snapshot data
    """
    # Verify CV exists
    cv = db.query(CV).filter(CV.id == cv_id).first()
    if not cv:
        raise HTTPException(status_code=404, detail="CV not found")
    
    # Capture snapshot
    tracker = ProgressTracker(db)
    try:
        snapshot = tracker.capture_snapshot(cv_id)
        return snapshot
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{cv_id}/timeline", response_model=List[TimelineEntry])
def get_progress_timeline(cv_id: int, db: Session = Depends(get_db)):
    """
    Get historical progress timeline for a CV.
    
    Args:
        cv_id: CV ID
        db: Database session
        
    Returns:
        List of progress entries over time
    """
    # Verify CV exists
    cv = db.query(CV).filter(CV.id == cv_id).first()
    if not cv:
        raise HTTPException(status_code=404, detail="CV not found")
    
    # Get timeline
    tracker = ProgressTracker(db)
    timeline = tracker.get_progress_timeline(cv_id)
    
    return timeline


@router.get("/{cv_id}/analytics", response_model=AnalyticsResponse)
def get_analytics(cv_id: int, db: Session = Depends(get_db)):
    """
    Get career analytics and growth metrics.
    
    Args:
        cv_id: CV ID
        db: Database session
        
    Returns:
        Analytics data
    """
    # Verify CV exists
    cv = db.query(CV).filter(CV.id == cv_id).first()
    if not cv:
        raise HTTPException(status_code=404, detail="CV not found")
    
    # Calculate analytics
    tracker = ProgressTracker(db)
    analytics = tracker.calculate_analytics(cv_id)
    
    return analytics


@router.post("/{cv_id}/learned-skills", response_model=LearnedSkillResponse)
def add_learned_skill(
    cv_id: int,
    skill_data: LearnedSkillCreate,
    db: Session = Depends(get_db)
):
    """
    Track a newly learned skill.
    
    Args:
        cv_id: CV ID
        skill_data: Learned skill data
        db: Database session
        
    Returns:
        Learned skill data
    """
    # Verify CV exists
    cv = db.query(CV).filter(CV.id == cv_id).first()
    if not cv:
        raise HTTPException(status_code=404, detail="CV not found")
    
    # Track skill
    tracker = ProgressTracker(db)
    learned_skill = tracker.track_learned_skill(
        cv_id=cv_id,
        skill_name=skill_data.skill_name,
        proficiency_level=skill_data.proficiency_level,
        status=skill_data.status
    )
    
    return learned_skill


@router.get("/{cv_id}/learned-skills", response_model=List[LearnedSkillResponse])
def get_learned_skills(cv_id: int, db: Session = Depends(get_db)):
    """
    Get all learned skills for a CV.
    
    Args:
        cv_id: CV ID
        db: Database session
        
    Returns:
        List of learned skills
    """
    # Verify CV exists
    cv = db.query(CV).filter(CV.id == cv_id).first()
    if not cv:
        raise HTTPException(status_code=404, detail="CV not found")
    
    # Get learned skills
    tracker = ProgressTracker(db)
    skills = tracker.get_learned_skills(cv_id)
    
    return skills


@router.delete("/{cv_id}/learned-skills/{skill_id}")
def delete_learned_skill(
    cv_id: int,
    skill_id: int,
    db: Session = Depends(get_db)
):
    """
    Delete a learned skill.
    
    Args:
        cv_id: CV ID
        skill_id: Learned skill ID
        db: Database session
        
    Returns:
        Success message
    """
    # Verify CV exists
    cv = db.query(CV).filter(CV.id == cv_id).first()
    if not cv:
        raise HTTPException(status_code=404, detail="CV not found")
    
    # Delete skill
    from app.models.models import LearnedSkill
    skill = db.query(LearnedSkill).filter(
        LearnedSkill.id == skill_id,
        LearnedSkill.cv_id == cv_id
    ).first()
    
    if not skill:
        raise HTTPException(status_code=404, detail="Learned skill not found")
    
    db.delete(skill)
    db.commit()
    
    return {"message": "Learned skill deleted successfully"}


@router.put("/{cv_id}/learned-skills/{skill_id}", response_model=LearnedSkillResponse)
def update_learned_skill(
    cv_id: int,
    skill_id: int,
    skill_data: LearnedSkillCreate,
    db: Session = Depends(get_db)
):
    """
    Update a learned skill.
    
    Args:
        cv_id: CV ID
        skill_id: Learned skill ID
        skill_data: Updated skill data
        db: Database session
        
    Returns:
        Updated learned skill data
    """
    # Verify CV exists
    cv = db.query(CV).filter(CV.id == cv_id).first()
    if not cv:
        raise HTTPException(status_code=404, detail="CV not found")
    
    # Update skill
    from app.models.models import LearnedSkill
    skill = db.query(LearnedSkill).filter(
        LearnedSkill.id == skill_id,
        LearnedSkill.cv_id == cv_id
    ).first()
    
    if not skill:
        raise HTTPException(status_code=404, detail="Learned skill not found")
    
    skill.skill_name = skill_data.skill_name
    skill.proficiency_level = skill_data.proficiency_level
    skill.status = skill_data.status
    
    db.commit()
    db.refresh(skill)
    
    return {
        "id": skill.id,
        "skill_name": skill.skill_name,
        "date_learned": skill.date_learned.isoformat(),
        "proficiency_level": skill.proficiency_level,
        "status": skill.status
    }


from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import json

from app.core.database import get_db
from app.models.models import CV, Skill
from app.services.roadmap_generator import RoadmapGenerator

router = APIRouter(prefix="/roadmap", tags=["Roadmap"])


# Pydantic models
class RoadmapResponse(BaseModel):
    pathway: str
    description: str
    current_progress: Dict[str, Any]
    phases: List[Dict[str, Any]]
    timeline: Dict[str, Any]
    certifications: List[Dict[str, Any]]
    resources: Dict[str, List[Dict[str, str]]]
    milestones: List[Dict[str, Any]]
    estimated_time_to_proficiency: int


class CertificationResponse(BaseModel):
    name: str
    provider: str
    cost: str
    duration: str
    url: str
    skills: List[str]
    difficulty: str
    recommended_timing: Optional[str] = None


@router.get("/{cv_id}/pathway/{pathway}", response_model=RoadmapResponse)
def get_learning_roadmap(
    cv_id: int,
    pathway: str,
    db: Session = Depends(get_db)
):
    """
    Get a personalized learning roadmap for a specific career pathway.
    
    Args:
        cv_id: CV ID
        pathway: Career pathway name
        db: Database session
        
    Returns:
        Personalized learning roadmap
    """
    # Get CV and skills
    cv = db.query(CV).filter(CV.id == cv_id).first()
    if not cv:
        raise HTTPException(status_code=404, detail="CV not found")
    
    skills = db.query(Skill).filter(Skill.cv_id == cv_id).all()
    current_skills = [skill.skill_name for skill in skills]
    
    # Generate roadmap
    roadmap_generator = RoadmapGenerator()
    roadmap = roadmap_generator.generate_roadmap(
        pathway=pathway,
        current_skills=current_skills,
        work_experience_years=cv.years_experience or 0
    )
    
    return roadmap


@router.get("/pathway/{pathway}/certifications", response_model=List[CertificationResponse])
def get_certifications(pathway: str):
    """
    Get relevant certifications for a career pathway.
    
    Args:
        pathway: Career pathway name
        
    Returns:
        List of relevant certifications
    """
    roadmap_generator = RoadmapGenerator()
    
    # Get certifications for this pathway
    certs = roadmap_generator.certifications.get(pathway, [])
    
    if not certs:
        # Try to find similar pathway
        for key in roadmap_generator.certifications.keys():
            if pathway.lower() in key.lower() or key.lower() in pathway.lower():
                certs = roadmap_generator.certifications[key]
                break
    
    return certs


@router.get("/pathways/all")
def get_all_pathways():
    """
    Get list of all available career pathways.
    
    Returns:
        List of pathway names
    """
    roadmap_generator = RoadmapGenerator()
    
    # Get pathways from pathways data
    pathways = [path.get("name") for path in roadmap_generator.pathways_data.get("pathways", [])]
    
    # Also get pathways from certifications
    cert_pathways = list(roadmap_generator.certifications.keys())
    
    # Combine and deduplicate
    all_pathways = list(set(pathways + cert_pathways))
    all_pathways.sort()
    
    return {"pathways": all_pathways}


@router.get("/{cv_id}/recommended-pathways")
def get_recommended_pathways(cv_id: int, db: Session = Depends(get_db)):
    """
    Get recommended learning pathways based on CV skills.
    
    Args:
        cv_id: CV ID
        db: Database session
        
    Returns:
        List of recommended pathways
    """
    # Get CV
    cv = db.query(CV).filter(CV.id == cv_id).first()
    if not cv:
        raise HTTPException(status_code=404, detail="CV not found")
    
    # Get recommendations (if they exist)
    from app.models.models import Recommendation
    recommendations = db.query(Recommendation).filter(
        Recommendation.cv_id == cv_id
    ).order_by(Recommendation.match_score.desc()).limit(5).all()
    
    if not recommendations:
        return {"pathways": []}
    
    # Return pathway names with match scores
    return {
        "pathways": [
            {
                "name": rec.pathway,
                "match_score": rec.match_score
            }
            for rec in recommendations
        ]
    }


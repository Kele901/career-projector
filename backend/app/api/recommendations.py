from fastapi import APIRouter, Depends, HTTPException, status, Query, Header
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime

from app.core.database import get_db
from app.core.security import decode_access_token
from app.core.config import settings
from app.models.models import User, CV, Skill, Recommendation, WorkExperience
from app.services.recommender import CareerRecommender
from app.services.ai_enhancer import AIEnhancer

router = APIRouter(prefix="/recommendations", tags=["Recommendations"])


# Pydantic models
class RecommendationResponse(BaseModel):
    id: int
    pathway: str
    match_score: float
    reasoning: Optional[str]
    recommended_skills: Optional[str]
    is_ai_enhanced: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


class RecommendationRequest(BaseModel):
    cv_id: int
    use_ai: bool = False
    top_n: int = 10  # Increased from 5 to show more options


class PathwayRecommendation(BaseModel):
    pathway: str
    description: str
    match_score: float
    reasoning: str
    recommended_skills: List[str]
    roadmap_url: str
    ai_insight: Optional[Dict[str, Any]] = None
    is_ai_enhanced: bool = False
    experience_relevance: Optional[float] = 0.0
    career_progression_score: Optional[float] = 0.0
    company_context_match: Optional[float] = 0.0
    recency_boost: Optional[float] = 0.0


class RecommendationResult(BaseModel):
    cv_id: int
    recommendations: List[PathwayRecommendation]
    total_skills: int


@router.post("/generate", response_model=RecommendationResult)
def generate_recommendations(
    request: RecommendationRequest,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    """Generate career pathway recommendations for a CV (supports guest access)"""
    
    # Get current user if authenticated
    current_user = None
    if authorization and authorization.startswith("Bearer "):
        token = authorization.replace("Bearer ", "")
        email = decode_access_token(token)
        if email:
            current_user = db.query(User).filter(User.email == email).first()
    
    # Get CV (for authenticated users, verify ownership; for guests, allow any CV)
    if current_user:
        cv = db.query(CV).filter(CV.id == request.cv_id, CV.user_id == current_user.id).first()
    else:
        cv = db.query(CV).filter(CV.id == request.cv_id).first()
    
    if not cv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="CV not found"
        )
    
    # Get skills for this CV
    skills = db.query(Skill).filter(Skill.cv_id == request.cv_id).all()
    
    if not skills:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No skills found for this CV. Please upload and analyze a CV first."
        )
    
    # Get work experiences for this CV
    work_experiences = db.query(WorkExperience).filter(WorkExperience.cv_id == request.cv_id).all()
    
    # Convert skills to dictionary format
    skill_dicts = [
        {
            'name': skill.skill_name,
            'category': skill.skill_category,
            'level': skill.skill_level,
            'confidence': skill.confidence_score
        }
        for skill in skills
    ]
    
    # Convert work experiences to dictionary format
    work_exp_dicts = [
        {
            'job_title': exp.job_title,
            'company_name': exp.company_name,
            'start_date': exp.start_date,
            'end_date': exp.end_date,
            'duration_months': exp.duration_months,
            'description': exp.description,
            'technologies_used': exp.technologies_used,
            'is_current': exp.is_current
        }
        for exp in work_experiences
    ]
    
    # Generate base recommendations (now with work experience)
    recommender = CareerRecommender()
    # Very lenient threshold to show more career options
    recommendations = recommender.recommend_pathways(
        skill_dicts, 
        work_experiences=work_exp_dicts, 
        top_n=request.top_n,
        min_score=0.05  # Very lenient - show paths with even 5% match
    )
    
    # Enhance with AI if requested
    if request.use_ai and settings.USE_AI_ENHANCEMENT:
        enhancer = AIEnhancer()
        recommendations = enhancer.enhance_recommendations(
            cv.raw_text or "",
            skill_dicts,
            recommendations
        )
    
    # Save recommendations to database
    # First, delete old recommendations for this CV
    db.query(Recommendation).filter(Recommendation.cv_id == request.cv_id).delete()
    
    # Save new recommendations
    for rec_data in recommendations:
        recommendation = Recommendation(
            cv_id=request.cv_id,
            pathway=rec_data['pathway'],
            match_score=rec_data['match_score'],
            reasoning=rec_data.get('reasoning', ''),
            recommended_skills=','.join(rec_data.get('recommended_skills', [])),
            is_ai_enhanced=rec_data.get('is_ai_enhanced', False)
        )
        db.add(recommendation)
    
    db.commit()
    
    return {
        "cv_id": request.cv_id,
        "recommendations": recommendations,
        "total_skills": len(skills)
    }


@router.get("/cv/{cv_id}", response_model=List[RecommendationResponse])
def get_cv_recommendations(
    cv_id: int,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    """Get saved recommendations for a CV (supports guest access)"""
    
    # Get current user if authenticated
    current_user = None
    if authorization and authorization.startswith("Bearer "):
        token = authorization.replace("Bearer ", "")
        email = decode_access_token(token)
        if email:
            current_user = db.query(User).filter(User.email == email).first()
    
    # Verify CV exists (for authenticated users, verify ownership; for guests, allow any CV)
    if current_user:
        cv = db.query(CV).filter(CV.id == cv_id, CV.user_id == current_user.id).first()
    else:
        cv = db.query(CV).filter(CV.id == cv_id).first()
    
    if not cv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="CV not found"
        )
    
    recommendations = db.query(Recommendation).filter(
        Recommendation.cv_id == cv_id
    ).order_by(Recommendation.match_score.desc()).all()
    
    return recommendations


@router.get("/pathways", response_model=List[Dict[str, Any]])
def get_all_pathways():
    """Get all available career pathways"""
    recommender = CareerRecommender()
    pathways = recommender.get_all_pathways()
    
    return pathways


@router.get("/pathway/{pathway_name}", response_model=Dict[str, Any])
def get_pathway_details(pathway_name: str):
    """Get details about a specific career pathway"""
    recommender = CareerRecommender()
    pathway = recommender.get_pathway_by_name(pathway_name)
    
    if not pathway:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pathway not found"
        )
    
    return pathway


@router.post("/ai/learning-path")
def generate_learning_path(
    cv_id: int,
    target_pathway: str,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    """Generate AI-powered learning path (requires OpenAI API key, supports guest access)"""
    
    if not settings.USE_AI_ENHANCEMENT:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="AI enhancement is not enabled"
        )
    
    # Get current user if authenticated
    current_user = None
    if authorization and authorization.startswith("Bearer "):
        token = authorization.replace("Bearer ", "")
        email = decode_access_token(token)
        if email:
            current_user = db.query(User).filter(User.email == email).first()
    
    # Verify CV exists (for authenticated users, verify ownership; for guests, allow any CV)
    if current_user:
        cv = db.query(CV).filter(CV.id == cv_id, CV.user_id == current_user.id).first()
    else:
        cv = db.query(CV).filter(CV.id == cv_id).first()
    
    if not cv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="CV not found"
        )
    
    # Get skills
    skills = db.query(Skill).filter(Skill.cv_id == cv_id).all()
    current_skills = [skill.skill_name for skill in skills]
    
    # Get target pathway
    recommender = CareerRecommender()
    pathway = recommender.get_pathway_by_name(target_pathway)
    
    if not pathway:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pathway not found"
        )
    
    # Get missing skills
    all_pathway_skills = pathway.get('required_skills', []) + pathway.get('optional_skills', [])
    current_skills_lower = [s.lower() for s in current_skills]
    missing_skills = [s for s in all_pathway_skills if s.lower() not in current_skills_lower]
    
    # Generate learning path with AI
    enhancer = AIEnhancer()
    learning_path = enhancer.generate_learning_path(
        current_skills[:15],
        target_pathway,
        missing_skills[:10]
    )
    
    if not learning_path:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate learning path"
        )
    
    return {
        "target_pathway": target_pathway,
        "current_skills": current_skills,
        "missing_skills": missing_skills,
        "learning_path": learning_path
    }

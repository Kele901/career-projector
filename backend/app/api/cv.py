from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Header
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
import os
import aiofiles
from pathlib import Path
from datetime import datetime

from app.core.database import get_db
from app.core.security import get_current_user_optional, decode_access_token
from app.core.config import settings
from app.models.models import User, CV, Skill, WorkExperience
from app.services.cv_parser import CVParser
from app.services.skill_extractor import SkillExtractor

router = APIRouter(prefix="/cv", tags=["CV"])

# Ensure upload directory exists
UPLOAD_DIR = Path(settings.UPLOAD_DIR)
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


# Pydantic models
class CVResponse(BaseModel):
    id: int
    filename: str
    upload_date: datetime
    years_experience: Optional[float]
    education_level: Optional[str]
    
    class Config:
        from_attributes = True


class SkillResponse(BaseModel):
    id: int
    skill_name: str
    skill_category: Optional[str]
    skill_level: Optional[str]
    confidence_score: float
    
    class Config:
        from_attributes = True


class WorkExperienceResponse(BaseModel):
    id: int
    job_title: str
    company_name: Optional[str]
    start_date: Optional[str]
    end_date: Optional[str]
    duration_months: Optional[int]
    description: Optional[str]
    technologies_used: Optional[str]
    is_current: bool
    seniority_level: Optional[str] = None
    company_size: Optional[str] = None
    company_industry: Optional[str] = None
    
    class Config:
        from_attributes = True


class CVDetailResponse(BaseModel):
    cv: CVResponse
    skills: List[SkillResponse]
    work_experiences: List[WorkExperienceResponse]
    parsed_content: Optional[str]


class CVAnalysisResponse(BaseModel):
    cv_id: int
    filename: str
    skills_found: int
    skills: List[SkillResponse]
    work_experiences: List[WorkExperienceResponse]
    work_experience_count: int
    years_experience: Optional[float]
    education_level: Optional[str]
    sections: dict


@router.post("/upload", response_model=CVAnalysisResponse, status_code=status.HTTP_201_CREATED)
async def upload_cv(
    file: UploadFile = File(...),
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    """Upload and analyze a CV (supports guest access)"""
    
    # Get current user if authenticated
    current_user = None
    if authorization and authorization.startswith("Bearer "):
        token = authorization.replace("Bearer ", "")
        email = decode_access_token(token)
        if email:
            current_user = db.query(User).filter(User.email == email).first()
    
    # Validate file extension
    file_ext = Path(file.filename).suffix.lower()
    if file_ext not in settings.ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type {file_ext} not allowed. Use PDF or DOCX."
        )
    
    # Check file size
    contents = await file.read()
    if len(contents) > settings.MAX_UPLOAD_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size exceeds maximum allowed size (10MB)"
        )
    
    # Save file
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    user_prefix = current_user.id if current_user else "guest"
    safe_filename = f"{user_prefix}_{timestamp}_{file.filename}"
    file_path = UPLOAD_DIR / safe_filename
    
    async with aiofiles.open(file_path, 'wb') as f:
        await f.write(contents)
    
    try:
        # Parse CV
        parser = CVParser()
        parsed_data = parser.parse_file(str(file_path))
        sections = parser.extract_sections(parsed_data['raw_text'])
        
        # Extract skills
        extractor = SkillExtractor()
        skills = extractor.extract_skills(parsed_data['raw_text'])
        
        # Extract work experience
        work_experiences = parser.extract_work_experience(parsed_data['raw_text'])
        
        # Save to database (with optional user_id for guest access)
        cv = CV(
            user_id=current_user.id if current_user else None,
            filename=file.filename,
            raw_text=parsed_data['raw_text'],
            parsed_content=str(sections),
            years_experience=parsed_data.get('years_experience'),
            education_level=parsed_data.get('education_level')
        )
        db.add(cv)
        db.commit()
        db.refresh(cv)
        
        # Save skills (using add_all for better performance while maintaining session)
        skill_objects = []
        for skill_data in skills:
            skill = Skill(
                cv_id=cv.id,
                skill_name=skill_data['name'],
                skill_category=skill_data.get('category'),
                skill_level=skill_data.get('level'),
                confidence_score=skill_data.get('confidence', 0.8)
            )
            skill_objects.append(skill)
        
        # Save work experiences with enhanced fields
        work_experience_objects = []
        for exp_data in work_experiences:
            work_exp = WorkExperience(
                cv_id=cv.id,
                job_title=exp_data.get('job_title', ''),
                company_name=exp_data.get('company_name'),
                start_date=exp_data.get('start_date'),
                end_date=exp_data.get('end_date'),
                duration_months=exp_data.get('duration_months'),
                description=exp_data.get('description'),
                technologies_used=exp_data.get('technologies_used'),
                is_current=exp_data.get('is_current', False),
                seniority_level=exp_data.get('seniority_level'),
                company_size=exp_data.get('company_size'),
                company_industry=exp_data.get('company_industry')
            )
            work_experience_objects.append(work_exp)
        
        # Add all objects at once and commit (faster than individual adds)
        db.add_all(skill_objects + work_experience_objects)
        db.commit()
        
        # Refresh to get IDs (objects are in session, so this works)
        for skill in skill_objects:
            db.refresh(skill)
        for work_exp in work_experience_objects:
            db.refresh(work_exp)
        
        return {
            "cv_id": cv.id,
            "filename": cv.filename,
            "skills_found": len(skill_objects),
            "skills": skill_objects,
            "work_experiences": work_experience_objects,
            "work_experience_count": len(work_experience_objects),
            "years_experience": cv.years_experience,
            "education_level": cv.education_level,
            "sections": sections
        }
        
    except Exception as e:
        # Clean up file on error
        if file_path.exists():
            file_path.unlink()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing CV: {str(e)}"
        )


@router.get("/list", response_model=List[CVResponse])
def list_cvs(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    """List all CVs for current user (requires authentication)"""
    # Get current user if authenticated
    current_user = None
    if authorization and authorization.startswith("Bearer "):
        token = authorization.replace("Bearer ", "")
        email = decode_access_token(token)
        if email:
            current_user = db.query(User).filter(User.email == email).first()
    
    if not current_user:
        # Guest users don't have a CV list
        return []
    
    cvs = db.query(CV).filter(CV.user_id == current_user.id).order_by(CV.upload_date.desc()).all()
    return cvs


@router.get("/{cv_id}", response_model=CVDetailResponse)
def get_cv_detail(
    cv_id: int,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    """Get detailed information about a specific CV (supports guest access)"""
    # Get current user if authenticated
    current_user = None
    if authorization and authorization.startswith("Bearer "):
        token = authorization.replace("Bearer ", "")
        email = decode_access_token(token)
        if email:
            current_user = db.query(User).filter(User.email == email).first()
    
    # For authenticated users, only show their own CVs
    # For guests, allow viewing any CV by ID
    if current_user:
        cv = db.query(CV).filter(CV.id == cv_id, CV.user_id == current_user.id).first()
    else:
        cv = db.query(CV).filter(CV.id == cv_id).first()
    
    if not cv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="CV not found"
        )
    
    skills = db.query(Skill).filter(Skill.cv_id == cv_id).all()
    work_experiences = db.query(WorkExperience).filter(WorkExperience.cv_id == cv_id).all()
    
    return {
        "cv": cv,
        "skills": skills,
        "work_experiences": work_experiences,
        "parsed_content": cv.parsed_content
    }


@router.delete("/{cv_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_cv(
    cv_id: int,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    """Delete a CV (requires authentication)"""
    # Get current user if authenticated
    current_user = None
    if authorization and authorization.startswith("Bearer "):
        token = authorization.replace("Bearer ", "")
        email = decode_access_token(token)
        if email:
            current_user = db.query(User).filter(User.email == email).first()
    
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required to delete CVs"
        )
    
    cv = db.query(CV).filter(CV.id == cv_id, CV.user_id == current_user.id).first()
    
    if not cv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="CV not found"
        )
    
    # Delete associated file
    # (Skills and recommendations will be deleted via cascade)
    db.delete(cv)
    db.commit()
    
    return None

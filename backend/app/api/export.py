from fastapi import APIRouter, Depends, HTTPException, status, Response
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime, timedelta
import secrets

from app.core.database import get_db
from app.models.models import CV, Skill, Recommendation, WorkExperience, SharedReport
from app.services.pdf_exporter import PDFExporter

router = APIRouter(prefix="/export", tags=["Export"])


# Pydantic models
class ShareRequest(BaseModel):
    expires_in_days: Optional[int] = 30


class ShareResponse(BaseModel):
    share_code: str
    share_url: str
    created_at: str
    expires_at: Optional[str]
    view_count: int


class SharedReportResponse(BaseModel):
    cv_filename: str
    recommendations: list
    skills: list
    work_experiences: list
    generated_at: str


@router.post("/{cv_id}/pdf")
def export_pdf(cv_id: int, db: Session = Depends(get_db)):
    """
    Generate and download a PDF report of career recommendations.
    
    Args:
        cv_id: CV ID
        db: Database session
        
    Returns:
        PDF file as streaming response
    """
    # Get CV
    cv = db.query(CV).filter(CV.id == cv_id).first()
    if not cv:
        raise HTTPException(status_code=404, detail="CV not found")
    
    # Get skills
    skills = db.query(Skill).filter(Skill.cv_id == cv_id).all()
    
    # Get recommendations
    recommendations = db.query(Recommendation).filter(
        Recommendation.cv_id == cv_id
    ).order_by(Recommendation.match_score.desc()).all()
    
    if not recommendations:
        raise HTTPException(
            status_code=400,
            detail="No recommendations found. Please generate recommendations first."
        )
    
    # Get work experiences
    work_experiences = db.query(WorkExperience).filter(
        WorkExperience.cv_id == cv_id
    ).all()
    
    # Prepare data
    cv_data = {
        "filename": cv.filename,
        "upload_date": cv.upload_date.strftime("%Y-%m-%d"),
        "years_experience": cv.years_experience,
        "education_level": cv.education_level,
        "skills": [
            {
                "skill_name": skill.skill_name,
                "skill_category": skill.skill_category,
                "confidence_score": skill.confidence_score
            }
            for skill in skills
        ],
        "work_experiences": [
            {
                "job_title": exp.job_title,
                "company_name": exp.company_name,
                "duration_months": exp.duration_months
            }
            for exp in work_experiences
        ]
    }
    
    recommendations_data = {
        "recommendations": [
            {
                "pathway": rec.pathway,
                "match_score": rec.match_score,
                "reasoning": rec.reasoning,
                "recommended_skills": rec.recommended_skills.split(",") if rec.recommended_skills else [],
                "description": ""
            }
            for rec in recommendations
        ]
    }
    
    # Generate PDF
    exporter = PDFExporter()
    try:
        pdf_buffer = exporter.generate_recommendations_report(
            recommendations_data=recommendations_data,
            cv_data=cv_data
        )
        
        # Return as streaming response
        return StreamingResponse(
            pdf_buffer,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename=career_recommendations_{cv.filename.split('.')[0]}.pdf"
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate PDF: {str(e)}")


@router.post("/{cv_id}/share", response_model=ShareResponse)
def create_share_link(
    cv_id: int,
    db: Session = Depends(get_db),
    share_request: Optional[ShareRequest] = None
):
    """
    Create a shareable link for recommendations.
    
    Args:
        cv_id: CV ID
        share_request: Share configuration
        db: Database session
        
    Returns:
        Share link information
    """
    # Get CV
    cv = db.query(CV).filter(CV.id == cv_id).first()
    if not cv:
        raise HTTPException(status_code=404, detail="CV not found")
    
    # Check if recommendations exist
    recommendations = db.query(Recommendation).filter(
        Recommendation.cv_id == cv_id
    ).first()
    
    if not recommendations:
        raise HTTPException(
            status_code=400,
            detail="No recommendations found. Please generate recommendations first."
        )
    
    # Use default if no request provided
    if share_request is None:
        share_request = ShareRequest()
    
    # Check if a share link already exists for this CV
    existing_share = db.query(SharedReport).filter(
        SharedReport.cv_id == cv_id
    ).first()
    
    if existing_share:
        # Update expiration date if needed
        if share_request.expires_in_days:
            existing_share.expires_at = datetime.utcnow() + timedelta(days=share_request.expires_in_days)
            db.commit()
            db.refresh(existing_share)
        
        return {
            "share_code": existing_share.share_token,
            "share_url": f"/shared/{existing_share.share_token}",
            "created_at": existing_share.created_at.isoformat(),
            "expires_at": existing_share.expires_at.isoformat() if existing_share.expires_at else None,
            "view_count": existing_share.view_count
        }
    
    # Generate unique share token
    share_token = secrets.token_urlsafe(32)
    
    # Calculate expiration date
    expires_at = None
    if share_request.expires_in_days:
        expires_at = datetime.utcnow() + timedelta(days=share_request.expires_in_days)
    
    # Create shared report
    shared_report = SharedReport(
        cv_id=cv_id,
        share_token=share_token,
        created_at=datetime.utcnow(),
        expires_at=expires_at,
        view_count=0
    )
    
    db.add(shared_report)
    db.commit()
    db.refresh(shared_report)
    
    return {
        "share_code": shared_report.share_token,
        "share_url": f"/shared/{shared_report.share_token}",
        "created_at": shared_report.created_at.isoformat(),
        "expires_at": shared_report.expires_at.isoformat() if shared_report.expires_at else None,
        "view_count": shared_report.view_count
    }


@router.get("/shared/{token}", response_model=SharedReportResponse)
def get_shared_report(token: str, db: Session = Depends(get_db)):
    """
    Get a shared report by token (public access).
    
    Args:
        token: Share token
        db: Database session
        
    Returns:
        Public view of recommendations
    """
    # Find shared report
    shared_report = db.query(SharedReport).filter(
        SharedReport.share_token == token
    ).first()
    
    if not shared_report:
        raise HTTPException(status_code=404, detail="Shared report not found")
    
    # Check if expired
    if shared_report.expires_at and shared_report.expires_at < datetime.utcnow():
        raise HTTPException(status_code=410, detail="This shared link has expired")
    
    # Increment view count
    shared_report.view_count += 1
    db.commit()
    
    # Get CV data
    cv = db.query(CV).filter(CV.id == shared_report.cv_id).first()
    if not cv:
        raise HTTPException(status_code=404, detail="CV not found")
    
    # Get skills
    skills = db.query(Skill).filter(Skill.cv_id == shared_report.cv_id).all()
    
    # Get recommendations
    recommendations = db.query(Recommendation).filter(
        Recommendation.cv_id == shared_report.cv_id
    ).order_by(Recommendation.match_score.desc()).all()
    
    # Get work experiences (optional, for context)
    work_experiences = db.query(WorkExperience).filter(
        WorkExperience.cv_id == shared_report.cv_id
    ).all()
    
    return {
        "cv_filename": cv.filename,
        "recommendations": [
            {
                "pathway": rec.pathway,
                "match_score": rec.match_score,
                "reasoning": rec.reasoning,
                "recommended_skills": rec.recommended_skills.split(",") if rec.recommended_skills else []
            }
            for rec in recommendations
        ],
        "skills": [
            {
                "skill_name": skill.skill_name,
                "skill_category": skill.skill_category
            }
            for skill in skills
        ],
        "work_experiences": [
            {
                "job_title": exp.job_title,
                "company_name": exp.company_name,
                "years": round(exp.duration_months / 12, 1) if exp.duration_months else 0
            }
            for exp in work_experiences
        ],
        "generated_at": shared_report.created_at.isoformat()
    }


@router.delete("/{cv_id}/share")
def delete_share_link(cv_id: int, db: Session = Depends(get_db)):
    """
    Delete a shared link.
    
    Args:
        cv_id: CV ID
        db: Database session
        
    Returns:
        Success message
    """
    # Find shared report
    shared_report = db.query(SharedReport).filter(
        SharedReport.cv_id == cv_id
    ).first()
    
    if not shared_report:
        raise HTTPException(status_code=404, detail="No shared link found for this CV")
    
    db.delete(shared_report)
    db.commit()
    
    return {"message": "Shared link deleted successfully"}


@router.get("/{cv_id}/share/stats")
def get_share_stats(cv_id: int, db: Session = Depends(get_db)):
    """
    Get statistics for a shared link.
    
    Args:
        cv_id: CV ID
        db: Database session
        
    Returns:
        Share statistics
    """
    # Find shared report
    shared_report = db.query(SharedReport).filter(
        SharedReport.cv_id == cv_id
    ).first()
    
    if not shared_report:
        return {"exists": False}
    
    is_expired = shared_report.expires_at and shared_report.expires_at < datetime.utcnow()
    
    return {
        "exists": True,
        "share_token": shared_report.share_token,
        "created_at": shared_report.created_at.isoformat(),
        "expires_at": shared_report.expires_at.isoformat() if shared_report.expires_at else None,
        "is_expired": is_expired,
        "view_count": shared_report.view_count
    }


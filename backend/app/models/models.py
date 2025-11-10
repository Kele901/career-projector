from sqlalchemy import Column, Integer, String, DateTime, Text, Float, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base


class User(Base):
    """User model"""
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    cvs = relationship("CV", back_populates="user", cascade="all, delete-orphan")


class CV(Base):
    """CV model"""
    __tablename__ = "cvs"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # Made nullable for guest users
    filename = Column(String, nullable=False)
    upload_date = Column(DateTime, default=datetime.utcnow)
    parsed_content = Column(Text, nullable=True)
    raw_text = Column(Text, nullable=True)
    
    # Analysis results
    years_experience = Column(Float, nullable=True)
    education_level = Column(String, nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="cvs")
    skills = relationship("Skill", back_populates="cv", cascade="all, delete-orphan")
    recommendations = relationship("Recommendation", back_populates="cv", cascade="all, delete-orphan")
    work_experiences = relationship("WorkExperience", back_populates="cv", cascade="all, delete-orphan")
    versions = relationship("CVVersion", back_populates="cv", cascade="all, delete-orphan")
    progress_entries = relationship("ProgressEntry", back_populates="cv", cascade="all, delete-orphan")
    learned_skills = relationship("LearnedSkill", back_populates="cv", cascade="all, delete-orphan")
    shared_reports = relationship("SharedReport", back_populates="cv", cascade="all, delete-orphan")


class Skill(Base):
    """Skill model"""
    __tablename__ = "skills"
    
    id = Column(Integer, primary_key=True, index=True)
    cv_id = Column(Integer, ForeignKey("cvs.id"), nullable=False)
    skill_name = Column(String, nullable=False)
    skill_category = Column(String, nullable=True)  # e.g., "frontend", "backend", "devops"
    skill_level = Column(String, nullable=True)  # e.g., "beginner", "intermediate", "expert"
    confidence_score = Column(Float, default=0.0)  # How confident we are about this skill
    
    # Relationships
    cv = relationship("CV", back_populates="skills")


class WorkExperience(Base):
    """Work Experience model"""
    __tablename__ = "work_experiences"
    
    id = Column(Integer, primary_key=True, index=True)
    cv_id = Column(Integer, ForeignKey("cvs.id"), nullable=False)
    job_title = Column(String, nullable=False)
    company_name = Column(String, nullable=True)
    start_date = Column(String, nullable=True)  # Stored as string since we parse from CVs
    end_date = Column(String, nullable=True)  # Can be "Present" or a date
    duration_months = Column(Integer, nullable=True)  # Calculated duration in months
    description = Column(Text, nullable=True)
    technologies_used = Column(Text, nullable=True)  # Comma-separated list
    is_current = Column(Boolean, default=False)
    
    # Enhanced fields for career analysis
    seniority_level = Column(String, nullable=True)  # intern, junior, mid, senior, lead, principal, director
    company_size = Column(String, nullable=True)  # startup, small, medium, large, enterprise
    company_industry = Column(String, nullable=True)  # tech, finance, healthcare, consulting, other
    
    # Relationships
    cv = relationship("CV", back_populates="work_experiences")


class Recommendation(Base):
    """Career pathway recommendation model"""
    __tablename__ = "recommendations"
    
    id = Column(Integer, primary_key=True, index=True)
    cv_id = Column(Integer, ForeignKey("cvs.id"), nullable=False)
    pathway = Column(String, nullable=False)  # e.g., "Frontend Developer", "DevOps Engineer"
    match_score = Column(Float, nullable=False)  # 0.0 to 1.0
    reasoning = Column(Text, nullable=True)
    recommended_skills = Column(Text, nullable=True)  # JSON string of skills to learn
    created_at = Column(DateTime, default=datetime.utcnow)
    is_ai_enhanced = Column(Boolean, default=False)
    
    # Relationships
    cv = relationship("CV", back_populates="recommendations")


class CareerPathway(Base):
    """Career pathway reference data model"""
    __tablename__ = "career_pathways"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    description = Column(Text, nullable=True)
    required_skills = Column(Text, nullable=False)  # JSON string of required skills
    optional_skills = Column(Text, nullable=True)  # JSON string of optional skills
    experience_level = Column(String, nullable=True)  # e.g., "junior", "mid", "senior"
    roadmap_url = Column(String, nullable=True)  # Link to roadmap.sh


class CVVersion(Base):
    """CV Version tracking model"""
    __tablename__ = "cv_versions"
    
    id = Column(Integer, primary_key=True, index=True)
    cv_id = Column(Integer, ForeignKey("cvs.id"), nullable=False)
    version_number = Column(Integer, nullable=False)
    upload_date = Column(DateTime, default=datetime.utcnow)
    filename = Column(String, nullable=False)
    snapshot_data = Column(Text, nullable=True)  # JSON snapshot of skills, recommendations
    
    # Relationships
    cv = relationship("CV", back_populates="versions")


class ProgressEntry(Base):
    """Progress tracking model"""
    __tablename__ = "progress_entries"
    
    id = Column(Integer, primary_key=True, index=True)
    cv_id = Column(Integer, ForeignKey("cvs.id"), nullable=False)
    date = Column(DateTime, default=datetime.utcnow)
    skills_count = Column(Integer, nullable=False)
    top_match_score = Column(Float, nullable=True)
    skills_learned = Column(Text, nullable=True)  # JSON array of new skills
    metrics = Column(Text, nullable=True)  # JSON with various metrics
    
    # Relationships
    cv = relationship("CV", back_populates="progress_entries")


class LearnedSkill(Base):
    """Learned skills tracking model"""
    __tablename__ = "learned_skills"
    
    id = Column(Integer, primary_key=True, index=True)
    cv_id = Column(Integer, ForeignKey("cvs.id"), nullable=False)
    skill_name = Column(String, nullable=False)
    date_learned = Column(DateTime, default=datetime.utcnow)
    proficiency_level = Column(String, nullable=True)  # beginner, intermediate, advanced, expert
    status = Column(String, nullable=False, default="learning")  # learning, completed, mastered
    
    # Relationships
    cv = relationship("CV", back_populates="learned_skills")


class SharedReport(Base):
    """Shared report links model"""
    __tablename__ = "shared_reports"
    
    id = Column(Integer, primary_key=True, index=True)
    cv_id = Column(Integer, ForeignKey("cvs.id"), nullable=False)
    share_token = Column(String, unique=True, index=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=True)
    view_count = Column(Integer, default=0)
    
    # Relationships
    cv = relationship("CV", back_populates="shared_reports")

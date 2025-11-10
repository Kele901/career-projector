"""
Helper script to find recent CV IDs
"""
import sys
sys.path.insert(0, 'app')

from sqlalchemy.orm import Session
from core.database import SessionLocal
from models.models import CV
from datetime import datetime


def list_recent_cvs():
    """List the 10 most recent CVs"""
    db = SessionLocal()
    
    try:
        cvs = db.query(CV).order_by(CV.upload_date.desc()).limit(10).all()
        
        print("=" * 80)
        print("RECENT CVs")
        print("=" * 80)
        print(f"\n{'ID':<6} {'Filename':<40} {'Upload Date':<20} {'Skills':<8}")
        print("-" * 80)
        
        for cv in cvs:
            skill_count = len(cv.skills) if cv.skills else 0
            upload_date = cv.upload_date.strftime("%Y-%m-%d %H:%M") if cv.upload_date else "N/A"
            filename = cv.filename[:37] + "..." if len(cv.filename) > 40 else cv.filename
            print(f"{cv.id:<6} {filename:<40} {upload_date:<20} {skill_count:<8}")
        
        print("\n" + "=" * 80)
        print("To debug a specific CV, run:")
        print("  python debug_recommendations.py <CV_ID>")
        print("=" * 80)
        
    finally:
        db.close()


if __name__ == "__main__":
    list_recent_cvs()


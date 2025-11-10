"""
Debug script to see what's happening with recommendations for a specific CV.
Usage: python debug_recommendations.py <cv_id>
"""
import sys
sys.path.insert(0, 'app')

from sqlalchemy.orm import Session
from core.database import SessionLocal, engine
from models.models import CV, Skill, WorkExperience
from services.recommender import CareerRecommender


def debug_cv_recommendations(cv_id: int):
    """Debug recommendations for a specific CV"""
    db = SessionLocal()
    
    try:
        # Get CV
        cv = db.query(CV).filter(CV.id == cv_id).first()
        if not cv:
            print(f"❌ CV with ID {cv_id} not found")
            return
        
        print("=" * 70)
        print(f"DEBUGGING RECOMMENDATIONS FOR CV: {cv.filename}")
        print("=" * 70)
        
        # Get skills
        skills = db.query(Skill).filter(Skill.cv_id == cv_id).all()
        print(f"\n📊 SKILLS DETECTED: {len(skills)}")
        if skills:
            skill_categories = {}
            for skill in skills:
                cat = skill.skill_category or 'general'
                skill_categories[cat] = skill_categories.get(cat, 0) + 1
                print(f"  • {skill.skill_name:30s} [{cat:12s}] (confidence: {skill.confidence_score:.2f})")
            
            print(f"\n📈 SKILL CATEGORIES:")
            for cat, count in sorted(skill_categories.items(), key=lambda x: x[1], reverse=True):
                print(f"  • {cat:15s}: {count} skills")
        else:
            print("  ⚠️  No skills detected!")
        
        # Get work experiences
        work_exps = db.query(WorkExperience).filter(WorkExperience.cv_id == cv_id).all()
        print(f"\n💼 WORK EXPERIENCE: {len(work_exps)}")
        for exp in work_exps:
            print(f"  • {exp.job_title:40s} @ {exp.company_name or 'N/A'}")
            print(f"    {exp.start_date or '?'} → {exp.end_date or '?'} ({exp.duration_months or 0} months)")
            if exp.seniority_level:
                print(f"    Level: {exp.seniority_level}, Company: {exp.company_size or 'unknown'} / {exp.company_industry or 'unknown'}")
        
        # Generate recommendations
        print(f"\n🎯 GENERATING RECOMMENDATIONS...")
        print("=" * 70)
        
        skill_dicts = [
            {
                'name': skill.skill_name,
                'category': skill.skill_category,
                'level': skill.skill_level,
                'confidence': skill.confidence_score
            }
            for skill in skills
        ]
        
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
            for exp in work_exps
        ]
        
        recommender = CareerRecommender()
        
        # Test with very lenient threshold to see ALL possible matches
        all_recs = recommender.recommend_pathways(skill_dicts, work_exp_dicts, top_n=20, min_score=0.01)
        
        print(f"\n✨ FOUND {len(all_recs)} RECOMMENDATIONS (min 1% match):\n")
        
        for i, rec in enumerate(all_recs, 1):
            print(f"{i:2d}. {rec['pathway']:30s} → {rec['match_score']:.1%}")
            print(f"    Experience Relevance: {rec.get('experience_relevance', 0):.2f}")
            print(f"    Career Progression:   {rec.get('career_progression_score', 0):.2f}")
            print(f"    Company Context:      {rec.get('company_context_match', 0):.2f}")
            print(f"    Recency Boost:        {rec.get('recency_boost', 0):.2f}")
            print(f"    Reasoning: {rec['reasoning'][:100]}...")
            print()
        
        # Show what would be returned with default settings
        default_recs = [r for r in all_recs if r['match_score'] >= 0.05]
        print("=" * 70)
        print(f"📌 WITH DEFAULT SETTINGS (5% threshold): {len(default_recs)} recommendations")
        print("=" * 70)
        
        if len(default_recs) < 3:
            print("\n⚠️  ISSUE: Not enough recommendations!")
            print("\nPOSSIBLE REASONS:")
            if len(skills) < 5:
                print("  • Too few skills detected from CV (need more technical keywords)")
            if len(work_exps) == 0:
                print("  • No work experience found in CV")
            if all_recs and all_recs[0]['match_score'] < 0.1:
                print("  • Skills don't strongly match any career pathway")
                print("  • Consider adding more technical skills to CV or trying AI enhancement")
        
    finally:
        db.close()


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python debug_recommendations.py <cv_id>")
        print("\nTo find CV IDs, check the database or look at the upload response.")
        sys.exit(1)
    
    try:
        cv_id = int(sys.argv[1])
        debug_cv_recommendations(cv_id)
    except ValueError:
        print("❌ CV ID must be a number")
        sys.exit(1)


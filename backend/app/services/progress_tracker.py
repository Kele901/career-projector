"""
Progress Tracker Service
Tracks career development progress over time.
"""

import json
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.models.models import CV, ProgressEntry, Skill, Recommendation, LearnedSkill


class ProgressTracker:
    """Service for tracking career development progress"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def capture_snapshot(self, cv_id: int) -> Dict[str, Any]:
        """
        Capture a snapshot of current CV state for progress tracking.
        
        Args:
            cv_id: CV ID to capture snapshot for
            
        Returns:
            Dictionary with snapshot data
        """
        cv = self.db.query(CV).filter(CV.id == cv_id).first()
        if not cv:
            raise ValueError(f"CV with id {cv_id} not found")
        
        # Get current skills
        skills = self.db.query(Skill).filter(Skill.cv_id == cv_id).all()
        
        # Get latest recommendations
        recommendations = self.db.query(Recommendation).filter(
            Recommendation.cv_id == cv_id
        ).order_by(Recommendation.created_at.desc()).limit(10).all()
        
        # Calculate top match score
        top_match_score = max([r.match_score for r in recommendations]) if recommendations else 0.0
        
        # Identify new skills (compare with previous snapshot)
        previous_entry = self.db.query(ProgressEntry).filter(
            ProgressEntry.cv_id == cv_id
        ).order_by(ProgressEntry.date.desc()).first()
        
        new_skills = []
        if previous_entry:
            previous_skills_data = json.loads(previous_entry.skills_learned or "[]")
            previous_skills = set(previous_skills_data)
            current_skills = set(skill.skill_name for skill in skills)
            new_skills = list(current_skills - previous_skills)
        
        # Create metrics snapshot
        metrics = {
            "total_skills": len(skills),
            "skill_categories": self._count_skill_categories(skills),
            "top_match_score": top_match_score,
            "recommendations_count": len(recommendations),
            "years_experience": cv.years_experience or 0,
            "education_level": cv.education_level,
            "skills_list": [skill.skill_name for skill in skills]
        }
        
        # Create progress entry
        progress_entry = ProgressEntry(
            cv_id=cv_id,
            date=datetime.utcnow(),
            skills_count=len(skills),
            top_match_score=top_match_score,
            skills_learned=json.dumps(new_skills),
            metrics=json.dumps(metrics)
        )
        
        self.db.add(progress_entry)
        self.db.commit()
        self.db.refresh(progress_entry)
        
        return {
            "snapshot_id": progress_entry.id,
            "date": progress_entry.date.isoformat(),
            "skills_count": progress_entry.skills_count,
            "top_match_score": progress_entry.top_match_score,
            "new_skills": new_skills,
            "metrics": metrics
        }
    
    def get_progress_timeline(self, cv_id: int) -> List[Dict[str, Any]]:
        """
        Get historical progress timeline for a CV.
        
        Args:
            cv_id: CV ID
            
        Returns:
            List of progress entries over time
        """
        entries = self.db.query(ProgressEntry).filter(
            ProgressEntry.cv_id == cv_id
        ).order_by(ProgressEntry.date.asc()).all()
        
        timeline = []
        for entry in entries:
            metrics = json.loads(entry.metrics) if entry.metrics else {}
            skills_learned = json.loads(entry.skills_learned) if entry.skills_learned else []
            
            timeline.append({
                "id": entry.id,
                "date": entry.date.isoformat(),
                "skills_count": entry.skills_count,
                "top_match_score": entry.top_match_score,
                "skills_learned": skills_learned,
                "metrics": metrics
            })
        
        return timeline
    
    def calculate_analytics(self, cv_id: int) -> Dict[str, Any]:
        """
        Calculate career analytics and growth metrics.
        
        Args:
            cv_id: CV ID
            
        Returns:
            Dictionary with analytics data formatted for frontend
        """
        entries = self.db.query(ProgressEntry).filter(
            ProgressEntry.cv_id == cv_id
        ).order_by(ProgressEntry.date.asc()).all()
        
        if len(entries) < 2:
            # Return empty/default analytics if not enough data
            return {
                "skill_velocity": 0.0,
                "match_improvement_rate": 0.0,
                "total_skills_gained": 0,
                "total_snapshots": len(entries),
                "average_match_score": entries[0].top_match_score if entries else 0.0,
                "best_match_pathway": "N/A",
                "growth_trend": "insufficient_data",
                "skill_velocity_trend": [],
                "match_score_trend": [],
                "category_growth": [],
                "learning_velocity": {},
                "recommendations_evolution": []
            }
        
        # Calculate skill velocity (skills per month)
        time_span_days = (entries[-1].date - entries[0].date).days
        time_span_months = max(time_span_days / 30, 1)
        total_skills_gained = entries[-1].skills_count - entries[0].skills_count
        skill_velocity = total_skills_gained / time_span_months
        
        # Calculate match improvement rate
        match_scores = [e.top_match_score for e in entries]
        if len(match_scores) > 1:
            improvements = [match_scores[i] - match_scores[i-1] for i in range(1, len(match_scores))]
            match_improvement_rate = sum(improvements) / len(improvements)
        else:
            match_improvement_rate = 0.0
        
        # Calculate average match score
        average_match_score = sum(match_scores) / len(match_scores)
        
        # Determine growth trend
        if len(entries) >= 3:
            recent_velocity = (entries[-1].skills_count - entries[-2].skills_count) / max((entries[-1].date - entries[-2].date).days / 30, 1)
            early_velocity = (entries[1].skills_count - entries[0].skills_count) / max((entries[1].date - entries[0].date).days / 30, 1)
            if recent_velocity > early_velocity * 1.2:
                growth_trend = "accelerating"
            elif recent_velocity < early_velocity * 0.8:
                growth_trend = "declining"
            else:
                growth_trend = "steady"
        else:
            growth_trend = "steady"
        
        # Get best match pathway from recommendations
        recommendations = self.db.query(Recommendation).filter(
            Recommendation.cv_id == cv_id
        ).order_by(Recommendation.match_score.desc()).first()
        best_match_pathway = recommendations.pathway if recommendations else "N/A"
        
        # Build skill velocity trend
        skill_velocity_trend = []
        for i in range(1, len(entries)):
            period_days = (entries[i].date - entries[i-1].date).days
            period_months = max(period_days / 30, 1)
            velocity = (entries[i].skills_count - entries[i-1].skills_count) / period_months
            skill_velocity_trend.append({
                "period": f"{entries[i-1].date.strftime('%b %Y')} - {entries[i].date.strftime('%b %Y')}",
                "velocity": round(velocity, 2)
            })
        
        # Build match score trend
        match_score_trend = []
        for entry in entries:
            match_score_trend.append({
                "date": entry.date.strftime('%Y-%m-%d'),
                "score": round(entry.top_match_score * 100, 1)
            })
        
        # Category growth (from skills data)
        category_growth = []
        skills = self.db.query(Skill).filter(Skill.cv_id == cv_id).all()
        category_counts = {}
        for skill in skills:
            cat = skill.skill_category or "Other"
            category_counts[cat] = category_counts.get(cat, 0) + 1
        
        for category, count in category_counts.items():
            category_growth.append({
                "category": category,
                "count": count
            })
        
        # Learning velocity by category
        learning_velocity = {}
        for category, count in category_counts.items():
            learning_velocity[category] = round(count / time_span_months, 2)
        
        # Recommendations evolution
        recommendations_evolution = []
        for entry in entries:
            recs = self.db.query(Recommendation).filter(
                Recommendation.cv_id == cv_id
            ).order_by(Recommendation.match_score.desc()).limit(5).all()
            
            data_point = {"date": entry.date.strftime('%b %d')}
            for rec in recs:
                data_point[rec.pathway] = round(rec.match_score * 100, 1)
            recommendations_evolution.append(data_point)
        
        return {
            "skill_velocity": round(skill_velocity, 2),
            "match_improvement_rate": round(match_improvement_rate, 4),
            "total_skills_gained": total_skills_gained,
            "total_snapshots": len(entries),
            "average_match_score": round(average_match_score, 4),
            "best_match_pathway": best_match_pathway,
            "growth_trend": growth_trend,
            "skill_velocity_trend": skill_velocity_trend,
            "match_score_trend": match_score_trend,
            "category_growth": category_growth,
            "learning_velocity": learning_velocity,
            "recommendations_evolution": recommendations_evolution
        }
    
    def track_learned_skill(
        self,
        cv_id: int,
        skill_name: str,
        proficiency_level: str = "beginner",
        status: str = "learning"
    ) -> Dict[str, Any]:
        """
        Track a newly learned skill.
        
        Args:
            cv_id: CV ID
            skill_name: Name of the skill
            proficiency_level: Proficiency level (beginner, intermediate, advanced, expert)
            status: Learning status (learning, completed, mastered)
            
        Returns:
            Dictionary with learned skill data
        """
        learned_skill = LearnedSkill(
            cv_id=cv_id,
            skill_name=skill_name,
            date_learned=datetime.utcnow(),
            proficiency_level=proficiency_level,
            status=status
        )
        
        self.db.add(learned_skill)
        self.db.commit()
        self.db.refresh(learned_skill)
        
        return {
            "id": learned_skill.id,
            "skill_name": learned_skill.skill_name,
            "date_learned": learned_skill.date_learned.isoformat(),
            "proficiency_level": learned_skill.proficiency_level,
            "status": learned_skill.status
        }
    
    def get_learned_skills(self, cv_id: int) -> List[Dict[str, Any]]:
        """Get all learned skills for a CV"""
        skills = self.db.query(LearnedSkill).filter(
            LearnedSkill.cv_id == cv_id
        ).order_by(LearnedSkill.date_learned.desc()).all()
        
        return [{
            "id": skill.id,
            "skill_name": skill.skill_name,
            "date_learned": skill.date_learned.isoformat(),
            "proficiency_level": skill.proficiency_level,
            "status": skill.status
        } for skill in skills]
    
    def _count_skill_categories(self, skills: List[Skill]) -> Dict[str, int]:
        """Count skills by category"""
        categories = {}
        for skill in skills:
            category = skill.skill_category or "Other"
            categories[category] = categories.get(category, 0) + 1
        return categories
    
    def _calculate_skills_growth(self, entries: List[ProgressEntry]) -> Dict[str, Any]:
        """Calculate skills growth over time"""
        if len(entries) < 2:
            return {"total_growth": 0, "growth_rate": 0, "timeline": []}
        
        first_count = entries[0].skills_count
        last_count = entries[-1].skills_count
        total_growth = last_count - first_count
        
        # Calculate growth rate (skills per month)
        time_diff = (entries[-1].date - entries[0].date).days / 30
        growth_rate = total_growth / time_diff if time_diff > 0 else 0
        
        timeline = [{
            "date": entry.date.isoformat(),
            "skills_count": entry.skills_count
        } for entry in entries]
        
        return {
            "total_growth": total_growth,
            "growth_rate": round(growth_rate, 2),
            "growth_rate_description": f"{round(growth_rate, 1)} skills per month",
            "timeline": timeline
        }
    
    def _calculate_match_score_improvement(self, entries: List[ProgressEntry]) -> Dict[str, Any]:
        """Calculate match score improvement"""
        if len(entries) < 2:
            return {"improvement": 0, "current_score": entries[0].top_match_score if entries else 0}
        
        first_score = entries[0].top_match_score or 0
        last_score = entries[-1].top_match_score or 0
        improvement = last_score - first_score
        
        timeline = [{
            "date": entry.date.isoformat(),
            "top_match_score": entry.top_match_score or 0
        } for entry in entries]
        
        return {
            "improvement": round(improvement, 3),
            "improvement_percentage": round(improvement * 100, 1),
            "first_score": first_score,
            "current_score": last_score,
            "timeline": timeline
        }
    
    def _calculate_learning_velocity(self, entries: List[ProgressEntry]) -> Dict[str, Any]:
        """Calculate learning velocity (skills learned over time)"""
        if len(entries) < 2:
            return {"velocity": 0, "velocity_trend": "insufficient_data"}
        
        # Calculate recent velocity (last 3 months)
        three_months_ago = datetime.utcnow() - timedelta(days=90)
        recent_entries = [e for e in entries if e.date >= three_months_ago]
        
        if len(recent_entries) >= 2:
            skills_gained = recent_entries[-1].skills_count - recent_entries[0].skills_count
            time_diff = (recent_entries[-1].date - recent_entries[0].date).days / 30
            velocity = skills_gained / time_diff if time_diff > 0 else 0
        else:
            velocity = 0
        
        # Determine trend
        if len(entries) >= 3:
            recent_velocity = velocity
            older_entries = entries[:-len(recent_entries)] if len(recent_entries) > 0 else entries
            if len(older_entries) >= 2:
                older_skills_gained = older_entries[-1].skills_count - older_entries[0].skills_count
                older_time_diff = (older_entries[-1].date - older_entries[0].date).days / 30
                older_velocity = older_skills_gained / older_time_diff if older_time_diff > 0 else 0
                
                if recent_velocity > older_velocity * 1.2:
                    trend = "accelerating"
                elif recent_velocity < older_velocity * 0.8:
                    trend = "decelerating"
                else:
                    trend = "steady"
            else:
                trend = "steady"
        else:
            trend = "insufficient_data"
        
        return {
            "velocity": round(velocity, 2),
            "velocity_description": f"{round(velocity, 1)} skills per month",
            "velocity_trend": trend
        }
    
    def _get_valuable_skills(self, cv_id: int) -> List[Dict[str, Any]]:
        """Get most valuable skills based on match score impact"""
        # Get skills and their categories
        skills = self.db.query(Skill).filter(Skill.cv_id == cv_id).all()
        
        # Sort by confidence score as a proxy for value
        valuable = sorted(skills, key=lambda s: s.confidence_score, reverse=True)[:10]
        
        return [{
            "skill_name": skill.skill_name,
            "category": skill.skill_category,
            "confidence_score": skill.confidence_score,
            "value_indicator": "high" if skill.confidence_score > 0.7 else "medium"
        } for skill in valuable]
    
    def _estimate_time_to_proficiency(self, entries: List[ProgressEntry]) -> Dict[str, Any]:
        """Estimate time to reach proficiency milestones"""
        if len(entries) < 2:
            return {
                "junior_level": "12-18 months",
                "mid_level": "24-36 months",
                "senior_level": "48-60 months"
            }
        
        # Calculate average learning rate
        skills_gained = entries[-1].skills_count - entries[0].skills_count
        time_elapsed = (entries[-1].date - entries[0].date).days / 30  # months
        
        if time_elapsed == 0 or skills_gained <= 0:
            return {
                "junior_level": "12-18 months",
                "mid_level": "24-36 months",
                "senior_level": "48-60 months"
            }
        
        learning_rate = skills_gained / time_elapsed
        
        # Estimate time to skill milestones
        junior_skills_needed = max(20 - entries[-1].skills_count, 0)
        mid_skills_needed = max(40 - entries[-1].skills_count, 0)
        senior_skills_needed = max(60 - entries[-1].skills_count, 0)
        
        junior_months = junior_skills_needed / learning_rate if learning_rate > 0 else 12
        mid_months = mid_skills_needed / learning_rate if learning_rate > 0 else 24
        senior_months = senior_skills_needed / learning_rate if learning_rate > 0 else 48
        
        return {
            "junior_level": f"{int(junior_months)}-{int(junior_months * 1.2)} months",
            "mid_level": f"{int(mid_months)}-{int(mid_months * 1.2)} months",
            "senior_level": f"{int(senior_months)}-{int(senior_months * 1.2)} months",
            "learning_rate": round(learning_rate, 2)
        }
    
    def _generate_insights(
        self,
        entries: List[ProgressEntry],
        skills_growth: Dict,
        match_score_improvement: Dict
    ) -> List[Dict[str, str]]:
        """Generate insights based on progress data"""
        insights = []
        
        if skills_growth["total_growth"] > 10:
            insights.append({
                "type": "positive",
                "message": f"Great progress! You've gained {skills_growth['total_growth']} new skills."
            })
        elif skills_growth["total_growth"] > 5:
            insights.append({
                "type": "neutral",
                "message": f"Good progress! You've added {skills_growth['total_growth']} skills to your profile."
            })
        else:
            insights.append({
                "type": "suggestion",
                "message": "Consider adding more skills to increase your career opportunities."
            })
        
        if match_score_improvement["improvement_percentage"] > 10:
            insights.append({
                "type": "positive",
                "message": f"Your match scores have improved by {match_score_improvement['improvement_percentage']}%!"
            })
        
        if len(entries) >= 3:
            insights.append({
                "type": "positive",
                "message": "You're consistently tracking your progress. Keep it up!"
            })
        
        return insights
    
    def _generate_empty_analytics(self) -> Dict[str, Any]:
        """Generate empty analytics when no data is available"""
        return {
            "summary": {
                "total_snapshots": 0,
                "current_skills": 0,
                "skills_gained": 0,
                "top_match_score": 0.0
            },
            "skills_growth": {"total_growth": 0, "growth_rate": 0, "timeline": []},
            "match_score_improvement": {"improvement": 0, "current_score": 0},
            "learning_velocity": {"velocity": 0, "velocity_trend": "insufficient_data"},
            "valuable_skills": [],
            "proficiency_estimates": {
                "junior_level": "12-18 months",
                "mid_level": "24-36 months",
                "senior_level": "48-60 months"
            },
            "insights": [{
                "type": "info",
                "message": "Start tracking your progress by uploading your CV and generating recommendations."
            }]
        }


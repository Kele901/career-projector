from typing import List, Dict, Optional
import json
from app.core.config import settings

try:
    from openai import OpenAI
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False


class AIEnhancer:
    """Service for AI-enhanced career recommendations using OpenAI"""
    
    def __init__(self):
        self.enabled = settings.USE_AI_ENHANCEMENT and OPENAI_AVAILABLE
        
        if self.enabled and settings.OPENAI_API_KEY:
            self.client = OpenAI(api_key=settings.OPENAI_API_KEY)
        else:
            self.client = None
    
    def enhance_recommendations(
        self,
        cv_text: str,
        skills: List[Dict],
        base_recommendations: List[Dict]
    ) -> List[Dict]:
        """
        Enhance recommendations using AI
        
        Args:
            cv_text: Raw CV text
            skills: Extracted skills
            base_recommendations: Rule-based recommendations
            
        Returns:
            Enhanced recommendations with AI insights
        """
        if not self.enabled or not self.client:
            # Return base recommendations if AI is not enabled
            return base_recommendations
        
        try:
            # Prepare context for AI
            skill_list = ", ".join([s['name'] for s in skills[:20]])
            pathway_list = "\n".join([
                f"- {r['pathway']} (Score: {r['match_score']})"
                for r in base_recommendations[:5]
            ])
            
            prompt = f"""Based on the following CV information, provide career insights and recommendations.

Skills identified: {skill_list}

Top career pathways matched:
{pathway_list}

CV Summary: {cv_text[:1000]}...

Please provide:
1. A brief analysis of the candidate's career profile
2. Which of the suggested pathways seems most suitable and why
3. Any additional career paths that might be worth considering
4. Key skills they should focus on developing next

Format your response as JSON with keys: profile_analysis, best_pathway, additional_pathways, development_focus"""

            response = self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are an expert career counselor helping people find the right career path based on their skills and experience."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=500
            )
            
            ai_insight = response.choices[0].message.content
            
            # Try to parse as JSON, fallback to text
            try:
                ai_data = json.loads(ai_insight)
            except json.JSONDecodeError:
                ai_data = {"raw_insight": ai_insight}
            
            # Enhance the top recommendation with AI insights
            if base_recommendations:
                base_recommendations[0]['ai_insight'] = ai_data
                base_recommendations[0]['is_ai_enhanced'] = True
            
            return base_recommendations
            
        except Exception as e:
            print(f"AI enhancement failed: {e}")
            # Return base recommendations on error
            return base_recommendations
    
    def generate_learning_path(
        self,
        current_skills: List[str],
        target_pathway: str,
        missing_skills: List[str]
    ) -> Optional[Dict]:
        """Generate a personalized learning path"""
        
        if not self.enabled or not self.client:
            return None
        
        try:
            prompt = f"""Create a learning roadmap for someone who wants to become a {target_pathway}.

Current skills: {', '.join(current_skills[:15])}
Skills needed: {', '.join(missing_skills[:10])}

Provide a structured 6-month learning plan with:
1. Month-by-month focus areas
2. Recommended resources (courses, books, projects)
3. Practical projects to build
4. Estimated time commitment per week

Format as JSON with structure: {{months: [{{month: 1, focus: "...", resources: [], projects: [], hours_per_week: N}}]}}"""

            response = self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are an expert tech educator who creates practical learning paths."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=700
            )
            
            learning_path = response.choices[0].message.content
            
            try:
                return json.loads(learning_path)
            except json.JSONDecodeError:
                return {"raw_plan": learning_path}
                
        except Exception as e:
            print(f"Learning path generation failed: {e}")
            return None
    
    def analyze_career_gap(
        self,
        current_role: str,
        target_pathway: str,
        skills: List[Dict]
    ) -> Optional[str]:
        """Analyze the gap between current position and target career"""
        
        if not self.enabled or not self.client:
            return None
        
        try:
            skill_summary = self._summarize_skills(skills)
            
            prompt = f"""Analyze the career transition from "{current_role}" to "{target_pathway}".

Current skills profile:
{skill_summary}

Provide:
1. How realistic is this transition?
2. What's the typical timeline for this transition?
3. What are the biggest gaps to address?
4. Any alternative paths to consider?

Keep response concise (200 words max)."""

            response = self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are a career transition advisor."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=300
            )
            
            return response.choices[0].message.content
            
        except Exception as e:
            print(f"Career gap analysis failed: {e}")
            return None
    
    def _summarize_skills(self, skills: List[Dict]) -> str:
        """Create a summary of skills by category"""
        from collections import defaultdict
        
        by_category = defaultdict(list)
        for skill in skills:
            category = skill.get('category', 'general')
            by_category[category].append(skill['name'])
        
        summary_parts = []
        for category, skill_list in by_category.items():
            summary_parts.append(f"{category.title()}: {', '.join(skill_list[:5])}")
        
        return "\n".join(summary_parts)

"""
Learning Roadmap Generator Service
Generates personalized learning roadmaps based on skill gaps and career pathways.
"""

import json
from typing import List, Dict, Any, Set
from pathlib import Path
from datetime import datetime, timedelta


class RoadmapGenerator:
    """Service for generating personalized learning roadmaps"""
    
    def __init__(self):
        # Load career pathways data
        pathways_file = Path(__file__).parent.parent / "data" / "career_pathways.json"
        with open(pathways_file, 'r') as f:
            self.pathways_data = json.load(f)
        
        # Load certifications data
        certs_file = Path(__file__).parent.parent / "data" / "certifications.json"
        with open(certs_file, 'r') as f:
            self.certifications = json.load(f)
        
        # Skill difficulty levels
        self.skill_difficulty = {
            "beginner": ["HTML", "CSS", "Git", "SQL", "JavaScript basics"],
            "intermediate": ["React", "Node.js", "Python", "Docker", "REST API"],
            "advanced": ["Kubernetes", "AWS", "System Design", "Machine Learning", "Microservices"]
        }
    
    def generate_roadmap(
        self,
        pathway: str,
        current_skills: List[str],
        work_experience_years: float = 0
    ) -> Dict[str, Any]:
        """
        Generate a personalized learning roadmap for a specific career pathway.
        
        Args:
            pathway: Target career pathway name
            current_skills: List of skills the user currently has
            work_experience_years: Years of relevant work experience
            
        Returns:
            Dictionary containing the structured roadmap
        """
        # Normalize inputs
        current_skills_set = set(skill.lower() for skill in current_skills)
        
        # Get pathway requirements
        pathway_info = self._get_pathway_info(pathway)
        if not pathway_info:
            return self._generate_generic_roadmap(pathway, current_skills)
        
        required_skills = set(skill.lower() for skill in pathway_info.get("required_skills", []))
        optional_skills = set(skill.lower() for skill in pathway_info.get("optional_skills", []))
        
        # Calculate skill gaps
        missing_required = required_skills - current_skills_set
        missing_optional = optional_skills - current_skills_set
        
        # Organize skills by learning phase
        phases = self._organize_into_phases(missing_required, missing_optional, work_experience_years)
        
        # Get relevant certifications
        relevant_certs = self._get_relevant_certifications(pathway, phases)
        
        # Calculate timeline
        timeline = self._calculate_timeline(phases, work_experience_years)
        
        # Get learning resources
        resources = self._get_learning_resources(phases)
        
        return {
            "pathway": pathway,
            "description": pathway_info.get("description", ""),
            "current_progress": {
                "skills_you_have": len(current_skills),
                "required_skills_remaining": len(missing_required),
                "optional_skills_remaining": len(missing_optional),
                "completion_percentage": self._calculate_completion(
                    len(current_skills_set),
                    len(required_skills),
                    len(optional_skills)
                )
            },
            "phases": phases,
            "timeline": timeline,
            "certifications": relevant_certs,
            "resources": resources,
            "milestones": self._generate_milestones(phases, timeline),
            "estimated_time_to_proficiency": timeline["total_weeks"]
        }
    
    def _get_pathway_info(self, pathway: str) -> Dict[str, Any]:
        """Get pathway information from the pathways database"""
        for path_data in self.pathways_data.get("pathways", []):
            if path_data.get("name", "").lower() == pathway.lower():
                return path_data
        return {}
    
    def _organize_into_phases(
        self,
        missing_required: Set[str],
        missing_optional: Set[str],
        experience_years: float
    ) -> List[Dict[str, Any]]:
        """Organize missing skills into learning phases"""
        phases = []
        
        # Determine starting phase based on experience
        if experience_years < 1:
            start_phase = "fundamentals"
        elif experience_years < 3:
            start_phase = "intermediate"
        else:
            start_phase = "advanced"
        
        # Phase 1: Fundamentals (if needed)
        fundamentals = self._categorize_skills_by_difficulty(missing_required, "beginner")
        if fundamentals or start_phase == "fundamentals":
            phases.append({
                "phase_number": 1,
                "name": "Fundamentals",
                "description": "Build a strong foundation with essential skills",
                "skills": list(fundamentals),
                "estimated_weeks": len(fundamentals) * 2 if fundamentals else 4,
                "priority": "critical"
            })
        
        # Phase 2: Core Skills
        intermediate = self._categorize_skills_by_difficulty(missing_required, "intermediate")
        if intermediate:
            phases.append({
                "phase_number": len(phases) + 1,
                "name": "Core Skills",
                "description": "Master the key technical skills for this role",
                "skills": list(intermediate),
                "estimated_weeks": len(intermediate) * 3,
                "priority": "high"
            })
        
        # Phase 3: Advanced Concepts
        advanced = self._categorize_skills_by_difficulty(missing_required, "advanced")
        if advanced:
            phases.append({
                "phase_number": len(phases) + 1,
                "name": "Advanced Concepts",
                "description": "Develop expertise in advanced topics",
                "skills": list(advanced),
                "estimated_weeks": len(advanced) * 4,
                "priority": "high"
            })
        
        # Phase 4: Specialization (optional skills)
        if missing_optional:
            phases.append({
                "phase_number": len(phases) + 1,
                "name": "Specialization",
                "description": "Expand your skillset with complementary technologies",
                "skills": list(missing_optional)[:10],  # Limit to top 10
                "estimated_weeks": min(len(missing_optional), 10) * 2,
                "priority": "medium"
            })
        
        return phases
    
    def _categorize_skills_by_difficulty(self, skills: Set[str], difficulty: str) -> Set[str]:
        """Categorize skills by difficulty level"""
        difficulty_keywords = self.skill_difficulty.get(difficulty, [])
        categorized = set()
        
        for skill in skills:
            for keyword in difficulty_keywords:
                if keyword.lower() in skill.lower():
                    categorized.add(skill)
                    break
        
        # If no skills matched, return some skills anyway
        if not categorized and skills:
            return set(list(skills)[:3])
        
        return categorized
    
    def _calculate_completion(
        self,
        skills_have: int,
        required_total: int,
        optional_total: int
    ) -> float:
        """Calculate completion percentage"""
        if required_total == 0:
            return 100.0
        
        # Weight required skills more heavily (80% vs 20%)
        required_weight = 0.8
        optional_weight = 0.2
        
        required_completion = (skills_have / required_total) if required_total > 0 else 1.0
        optional_completion = (skills_have / optional_total) if optional_total > 0 else 0.0
        
        total_completion = (required_completion * required_weight) + (optional_completion * optional_weight)
        
        return round(min(total_completion * 100, 100), 1)
    
    def _calculate_timeline(self, phases: List[Dict], experience_years: float) -> Dict[str, Any]:
        """Calculate learning timeline"""
        total_weeks = sum(phase["estimated_weeks"] for phase in phases)
        
        # Adjust based on experience (more experience = faster learning)
        if experience_years > 3:
            total_weeks = int(total_weeks * 0.7)
        elif experience_years > 1:
            total_weeks = int(total_weeks * 0.85)
        
        start_date = datetime.now()
        estimated_completion = start_date + timedelta(weeks=total_weeks)
        
        return {
            "total_weeks": total_weeks,
            "total_months": round(total_weeks / 4.33, 1),
            "start_date": start_date.strftime("%Y-%m-%d"),
            "estimated_completion": estimated_completion.strftime("%Y-%m-%d"),
            "hours_per_week_recommended": 10 if experience_years < 2 else 5
        }
    
    def _get_relevant_certifications(self, pathway: str, phases: List[Dict]) -> List[Dict[str, Any]]:
        """Get relevant certifications for the pathway"""
        certs = self.certifications.get(pathway, [])
        
        # Add difficulty level based on phases
        for cert in certs:
            phase_count = len(phases)
            if phase_count <= 2 and cert.get("difficulty") == "Beginner":
                cert["recommended_timing"] = "Start learning"
            elif cert.get("difficulty") == "Intermediate":
                cert["recommended_timing"] = "After fundamentals"
            else:
                cert["recommended_timing"] = "After core skills"
        
        return certs[:5]  # Return top 5 most relevant
    
    def _get_learning_resources(self, phases: List[Dict]) -> Dict[str, List[Dict[str, str]]]:
        """Get learning resources organized by type"""
        return {
            "free_courses": [
                {
                    "name": "freeCodeCamp",
                    "url": "https://www.freecodecamp.org/",
                    "description": "Free coding tutorials and certifications"
                },
                {
                    "name": "Codecademy (Free Tier)",
                    "url": "https://www.codecademy.com/",
                    "description": "Interactive coding lessons"
                },
                {
                    "name": "Khan Academy",
                    "url": "https://www.khanacademy.org/computing",
                    "description": "Computer science fundamentals"
                }
            ],
            "paid_platforms": [
                {
                    "name": "Udemy",
                    "url": "https://www.udemy.com/",
                    "description": "Affordable courses on specific skills"
                },
                {
                    "name": "Pluralsight",
                    "url": "https://www.pluralsight.com/",
                    "description": "Professional tech skills platform"
                },
                {
                    "name": "LinkedIn Learning",
                    "url": "https://www.linkedin.com/learning/",
                    "description": "Business and tech courses"
                }
            ],
            "practice_platforms": [
                {
                    "name": "LeetCode",
                    "url": "https://leetcode.com/",
                    "description": "Coding challenges and interview prep"
                },
                {
                    "name": "HackerRank",
                    "url": "https://www.hackerrank.com/",
                    "description": "Programming challenges"
                },
                {
                    "name": "GitHub",
                    "url": "https://github.com/",
                    "description": "Build projects and collaborate"
                }
            ],
            "documentation": [
                {
                    "name": "MDN Web Docs",
                    "url": "https://developer.mozilla.org/",
                    "description": "Web technology documentation"
                },
                {
                    "name": "roadmap.sh",
                    "url": "https://roadmap.sh/",
                    "description": "Career path roadmaps"
                }
            ]
        }
    
    def _generate_milestones(self, phases: List[Dict], timeline: Dict) -> List[Dict[str, Any]]:
        """Generate learning milestones"""
        milestones = []
        weeks_elapsed = 0
        start_date = datetime.strptime(timeline["start_date"], "%Y-%m-%d")
        
        for phase in phases:
            weeks_elapsed += phase["estimated_weeks"]
            milestone_date = start_date + timedelta(weeks=weeks_elapsed)
            
            milestones.append({
                "name": f"Complete {phase['name']}",
                "description": f"Finish learning all skills in the {phase['name']} phase",
                "estimated_date": milestone_date.strftime("%Y-%m-%d"),
                "skills_count": len(phase["skills"]),
                "priority": phase["priority"]
            })
        
        return milestones
    
    def _generate_generic_roadmap(self, pathway: str, current_skills: List[str]) -> Dict[str, Any]:
        """Generate a generic roadmap when pathway data is not available"""
        return {
            "pathway": pathway,
            "description": f"Learn the skills needed for {pathway}",
            "current_progress": {
                "skills_you_have": len(current_skills),
                "required_skills_remaining": 10,
                "optional_skills_remaining": 5,
                "completion_percentage": 20.0
            },
            "phases": [
                {
                    "phase_number": 1,
                    "name": "Foundation",
                    "description": "Build fundamental skills",
                    "skills": ["Core concepts", "Basic tools", "Best practices"],
                    "estimated_weeks": 8,
                    "priority": "critical"
                }
            ],
            "timeline": {
                "total_weeks": 24,
                "total_months": 6,
                "start_date": datetime.now().strftime("%Y-%m-%d"),
                "estimated_completion": (datetime.now() + timedelta(weeks=24)).strftime("%Y-%m-%d"),
                "hours_per_week_recommended": 10
            },
            "certifications": [],
            "resources": self._get_learning_resources([]),
            "milestones": [],
            "estimated_time_to_proficiency": 24
        }


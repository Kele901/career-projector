import json
from typing import List, Dict, Optional, Tuple
from pathlib import Path
from collections import defaultdict
from datetime import datetime
import re


class CareerRecommender:
    """Service for recommending career pathways based on skills"""
    
    def __init__(self):
        self.pathways = self._load_pathways()
    
    def _load_pathways(self) -> List[Dict]:
        """Load career pathways from JSON file"""
        pathways_file = Path(__file__).parent.parent / "data" / "career_pathways.json"
        
        if not pathways_file.exists():
            # Return empty list if file doesn't exist
            return []
        
        with open(pathways_file, 'r') as f:
            data = json.load(f)
            return data.get('pathways', [])
    
    def recommend_pathways(
        self, 
        skills: List[Dict[str, any]], 
        work_experiences: Optional[List[Dict[str, any]]] = None,
        top_n: int = 5,
        min_score: float = 0.2
    ) -> List[Dict[str, any]]:
        """
        Recommend career pathways based on user skills and work experience
        
        Args:
            skills: List of skill dictionaries with 'name', 'category', 'level'
            work_experiences: List of work experience dictionaries
            top_n: Number of top recommendations to return
            min_score: Minimum match score to include in results
            
        Returns:
            List of pathway recommendations with scores and reasoning
        """
        if not skills:
            return []
        
        # Extract skill names and categories
        skill_names = [s['name'].lower() for s in skills]
        skill_categories = defaultdict(int)
        
        for skill in skills:
            category = skill.get('category', 'general')
            skill_categories[category] += 1
        
        # Process work experience
        experience_data = self._process_work_experience(work_experiences or [])
        
        recommendations = []
        
        for pathway in self.pathways:
            score, reasoning = self._calculate_pathway_match(
                pathway, 
                skill_names, 
                skill_categories,
                skills,
                experience_data
            )
            
            if score >= min_score:
                # Get recommended skills to learn
                recommended_skills = self._get_missing_skills(pathway, skill_names)
                
                # Calculate additional scoring metrics
                pathway_name_lower = pathway['name'].lower()
                experience_relevance = experience_data.get('relevance_scores', {}).get(pathway_name_lower, 0)
                
                # Career progression score
                career_trajectory = experience_data.get('career_trajectory', {})
                career_progression_score = career_trajectory.get('progression_score', 0.5)
                
                # Company context match (tech ratio for tech roles)
                tech_ratio = experience_data.get('tech_experience_ratio', 0.0)
                tech_roles = ['frontend developer', 'backend developer', 'full stack developer', 
                              'devops engineer', 'data scientist', 'android developer', 'ios developer',
                              'react native developer', 'software architect', 'blockchain developer']
                company_context_match = tech_ratio if pathway_name_lower in tech_roles else 0.5
                
                # Recency boost - calculate from most recent relevant experience
                relevant_roles = experience_data.get('relevant_roles', {}).get(pathway_name_lower, [])
                recency_boost = 0.0
                if relevant_roles:
                    most_recent = sorted(relevant_roles, key=lambda x: (x.get('is_current', False), x.get('end_date', '')), reverse=True)[0]
                    recency_boost = self._calculate_recency_weight(most_recent.get('end_date', ''), most_recent.get('is_current', False))
                
                recommendations.append({
                    'pathway': pathway['name'],
                    'description': pathway['description'],
                    'match_score': round(score, 2),
                    'reasoning': reasoning,
                    'recommended_skills': recommended_skills[:10],  # Top 10 skills to learn
                    'roadmap_url': pathway.get('roadmap_url', ''),
                    'experience_relevance': round(experience_relevance, 2),
                    'career_progression_score': round(career_progression_score, 2),
                    'company_context_match': round(company_context_match, 2),
                    'recency_boost': round(recency_boost, 2)
                })
        
        # Sort by score and return top N
        recommendations.sort(key=lambda x: x['match_score'], reverse=True)
        return recommendations[:top_n]
    
    def _calculate_pathway_match(
        self, 
        pathway: Dict, 
        skill_names: List[str],
        skill_categories: Dict[str, int],
        all_skills: List[Dict],
        experience_data: Dict
    ) -> Tuple[float, str]:
        """Calculate how well skills and experience match a pathway with enhanced scoring"""
        
        # Required skills matching
        required_skills = [s.lower() for s in pathway.get('required_skills', [])]
        required_matches = sum(1 for skill in required_skills if skill in skill_names)
        required_score = required_matches / len(required_skills) if required_skills else 0
        
        # Optional skills matching
        optional_skills = [s.lower() for s in pathway.get('optional_skills', [])]
        optional_matches = sum(1 for skill in optional_skills if skill in skill_names)
        optional_score = optional_matches / len(optional_skills) if optional_skills else 0
        
        # Category weight matching
        category_score = 0
        weight_categories = pathway.get('weight_categories', {})
        
        if weight_categories:
            total_weight = sum(weight_categories.values())
            for category, weight in weight_categories.items():
                if category in skill_categories:
                    normalized_weight = weight / total_weight
                    category_score += normalized_weight * min(skill_categories[category] / 5, 1)
        
        # Experience relevance score (already recency-weighted)
        pathway_name_lower = pathway['name'].lower()
        experience_score = experience_data.get('relevance_scores', {}).get(pathway_name_lower, 0)
        
        # Experience duration bonus
        experience_years_bonus = min(experience_data.get('total_months', 0) / 120, 0.15)  # Max 15% bonus for 10+ years
        
        # Career progression bonus (up to 10% bonus for upward trajectory)
        career_trajectory = experience_data.get('career_trajectory', {})
        progression_score = career_trajectory.get('progression_score', 0.5)
        progression_bonus = (progression_score - 0.5) * 0.1  # Range: -0.05 to +0.05 (centered at 0)
        
        # Company context bonus (tech experience bonus for tech roles)
        tech_ratio = experience_data.get('tech_experience_ratio', 0.0)
        tech_roles = ['frontend developer', 'backend developer', 'full stack developer', 
                      'devops engineer', 'data scientist', 'android developer', 'ios developer',
                      'react native developer', 'software architect', 'blockchain developer']
        company_context_bonus = 0.0
        if pathway_name_lower in tech_roles and tech_ratio > 0.5:
            company_context_bonus = 0.05  # 5% bonus for significant tech experience
        
        # Calculate final score with weights (adjusted to be more lenient)
        # Base: 35% required skills, 15% optional skills, 30% category alignment, 20% experience
        base_score = (
            required_score * 0.35 +      # 35% weight on required skills (reduced from 45%)
            optional_score * 0.15 +       # 15% weight on optional skills
            category_score * 0.30         # 30% weight on category alignment (increased from 25%)
        )
        
        # Experience components: 15% relevance + 15% duration/progression/context
        experience_component = (experience_score * 0.15) + experience_years_bonus + progression_bonus + company_context_bonus
        
        final_score = base_score + experience_component
        final_score = min(max(final_score, 0.0), 1.0)  # Clamp between 0 and 1
        
        # Generate reasoning with enhanced context
        reasoning = self._generate_reasoning(
            pathway['name'],
            required_matches,
            len(required_skills),
            optional_matches,
            skill_categories,
            weight_categories,
            experience_data
        )
        
        return final_score, reasoning
    
    def _generate_reasoning(
        self,
        pathway_name: str,
        required_matches: int,
        total_required: int,
        optional_matches: int,
        skill_categories: Dict[str, int],
        weight_categories: Dict[str, str],
        experience_data: Dict
    ) -> str:
        """Generate human-readable reasoning for the match with enhanced context"""
        
        reasons = []
        
        # Required skills
        if total_required > 0:
            percentage = int((required_matches / total_required) * 100)
            reasons.append(f"You have {percentage}% of required skills ({required_matches}/{total_required})")
        
        # Optional skills
        if optional_matches > 0:
            reasons.append(f"Plus {optional_matches} optional/advanced skills")
        
        # Career trajectory insight
        career_trajectory = experience_data.get('career_trajectory', {})
        trajectory_type = career_trajectory.get('type', '')
        trajectory_desc = career_trajectory.get('description', '')
        
        if trajectory_type in ['strong_upward', 'upward'] and trajectory_desc:
            reasons.append(trajectory_desc)
        elif trajectory_type == 'pivot':
            reasons.append("Your career transition shows adaptability and growth mindset")
        
        # Work experience with recency context
        relevant_roles = experience_data.get('relevant_roles', {}).get(pathway_name.lower(), [])
        if relevant_roles:
            # Sort by recency (current jobs first)
            sorted_roles = sorted(relevant_roles, key=lambda x: (x.get('is_current', False), x.get('end_date', '')), reverse=True)
            most_recent = sorted_roles[0]
            
            years = sum(r.get('duration_months', 0) for r in relevant_roles) / 12
            roles_text = most_recent.get('job_title', 'related role')
            
            # Check if recent experience
            is_recent = most_recent.get('is_current', False) or \
                       (most_recent.get('end_date', '') and 
                        re.search(r'(202[3-9]|present)', most_recent.get('end_date', '').lower()))
            
            if is_recent and len(relevant_roles) > 1:
                reasons.append(f"Currently building on {years:.1f} years of relevant experience as {roles_text}")
            elif is_recent:
                reasons.append(f"Your recent work as {roles_text} aligns strongly with this path")
            elif len(relevant_roles) > 1:
                reasons.append(f"{years:.1f} years of relevant experience in roles like {roles_text}")
            else:
                reasons.append(f"{years:.1f} years as {roles_text}")
        elif experience_data.get('total_months', 0) > 0:
            total_years = experience_data.get('total_months', 0) / 12
            reasons.append(f"{total_years:.1f} years of professional experience")
        
        # Company context insight
        tech_ratio = experience_data.get('tech_experience_ratio', 0.0)
        company_contexts = experience_data.get('company_contexts', [])
        
        if tech_ratio > 0.7 and company_contexts:
            # Check for notable companies
            has_enterprise = any(c.get('size') == 'enterprise' for c in company_contexts)
            has_startup = any(c.get('size') == 'startup' for c in company_contexts)
            
            if has_enterprise and has_startup:
                reasons.append("Your diverse experience across enterprise and startup environments is valuable")
            elif has_enterprise:
                reasons.append("Your experience at established tech companies provides strong foundations")
            elif has_startup:
                reasons.append("Your startup experience demonstrates versatility and rapid learning")
            else:
                reasons.append("Your technology industry experience is highly relevant")
        
        # Strong category alignment
        top_categories = sorted(
            [(cat, count) for cat, count in skill_categories.items() if cat in weight_categories],
            key=lambda x: x[1],
            reverse=True
        )[:2]
        
        if top_categories:
            cat_names = ", ".join([cat for cat, _ in top_categories])
            reasons.append(f"Strong background in {cat_names}")
        
        # Combine reasoning
        if reasons:
            return ". ".join(reasons) + "."
        else:
            return f"Some foundational skills for {pathway_name}."
    
    def _get_missing_skills(self, pathway: Dict, current_skills: List[str]) -> List[str]:
        """Get skills that are in the pathway but not in current skills"""
        required = set(s.lower() for s in pathway.get('required_skills', []))
        optional = set(s.lower() for s in pathway.get('optional_skills', []))
        current = set(current_skills)
        
        # Prioritize missing required skills, then optional
        missing_required = list(required - current)
        missing_optional = list(optional - current)
        
        # Return with capitalization
        missing = missing_required + missing_optional
        return [s.title() for s in missing]
    
    def get_pathway_by_name(self, name: str) -> Optional[Dict]:
        """Get a specific pathway by name"""
        for pathway in self.pathways:
            if pathway['name'].lower() == name.lower():
                return pathway
        return None
    
    def get_all_pathways(self) -> List[Dict]:
        """Get all available pathways"""
        return self.pathways
    
    def _process_work_experience(self, work_experiences: List[Dict]) -> Dict:
        """Process work experience data to extract relevance scores, trajectory, and context"""
        if not work_experiences:
            return {
                'total_months': 0,
                'relevance_scores': {},
                'relevant_roles': {},
                'career_trajectory': {'type': 'insufficient_data', 'progression_score': 0.0, 'levels': [], 'description': ''},
                'company_contexts': [],
                'tech_experience_ratio': 0.0
            }
        
        # Calculate total experience
        total_months = sum(exp.get('duration_months', 0) or 0 for exp in work_experiences)
        
        # Analyze career trajectory
        career_trajectory = self._analyze_career_trajectory(work_experiences)
        
        # Extract company contexts and calculate tech experience ratio
        company_contexts = []
        tech_months = 0
        for exp in work_experiences:
            context = self._extract_company_context(
                exp.get('company_name', ''),
                exp.get('description', '')
            )
            company_contexts.append(context)
            
            if context['is_tech']:
                tech_months += exp.get('duration_months', 0) or 0
        
        tech_experience_ratio = tech_months / total_months if total_months > 0 else 0.0
        
        # Enhanced keyword mapping for career pathways with comprehensive terms
        pathway_keywords = {
            'frontend developer': [
                'frontend', 'front-end', 'front end', 'ui developer', 'ui engineer',
                'react', 'react.js', 'reactjs', 'vue', 'vue.js', 'vuejs', 
                'angular', 'angularjs', 'svelte', 'next.js', 'nextjs',
                'javascript developer', 'js developer', 'typescript developer',
                'web developer', 'web ui', 'html', 'css', 'sass', 'less',
                'responsive design', 'web design', 'ux developer', 'ui/ux developer',
                'junior frontend', 'senior frontend', 'lead frontend', 'staff frontend'
            ],
            'backend developer': [
                'backend', 'back-end', 'back end', 'server-side', 'server side',
                'api developer', 'rest api', 'graphql', 'api engineer',
                'node', 'node.js', 'nodejs', 'express', 'nest.js',
                'python', 'django', 'flask', 'fastapi', 'python engineer',
                'java', 'spring', 'spring boot', 'java engineer',
                'c#', '.net', 'asp.net', 'dotnet',
                'go', 'golang', 'go developer', 'rust developer',
                'php', 'laravel', 'symfony',
                'ruby', 'rails', 'ruby on rails',
                'database', 'sql', 'postgresql', 'mysql', 'mongodb',
                'microservices', 'distributed systems',
                'junior backend', 'senior backend', 'lead backend', 'staff backend'
            ],
            'full stack developer': [
                'full stack', 'fullstack', 'full-stack', 'full stack engineer',
                'mern', 'mean', 'mevn', 'lamp', 'jamstack',
                'web application', 'application developer',
                'software developer', 'software engineer',
                'junior full stack', 'senior full stack', 'lead full stack'
            ],
            'devops engineer': [
                'devops', 'dev ops', 'devsecops', 'site reliability', 'sre',
                'infrastructure', 'infrastructure engineer', 'platform engineer',
                'cloud', 'cloud engineer', 'cloud architect',
                'aws', 'amazon web services', 'azure', 'microsoft azure', 'gcp', 'google cloud',
                'kubernetes', 'k8s', 'docker', 'containerization', 'containers',
                'ci/cd', 'continuous integration', 'jenkins', 'gitlab ci', 'github actions',
                'terraform', 'ansible', 'chef', 'puppet', 'infrastructure as code',
                'monitoring', 'prometheus', 'grafana', 'elk', 'datadog',
                'linux', 'unix', 'systems engineer', 'systems administrator',
                'junior devops', 'senior devops', 'lead devops', 'staff devops'
            ],
            'data scientist': [
                'data scientist', 'data science', 'data analyst', 'analytics',
                'machine learning', 'ml engineer', 'ml', 'ai engineer', 'artificial intelligence',
                'deep learning', 'neural network', 'computer vision', 'nlp',
                'python', 'r', 'pandas', 'numpy', 'scikit-learn', 'tensorflow', 'pytorch',
                'statistics', 'statistical', 'quantitative', 'research scientist',
                'data mining', 'predictive modeling', 'data modeling',
                'bi', 'business intelligence', 'tableau', 'power bi',
                'junior data scientist', 'senior data scientist', 'lead data scientist'
            ],
            'android developer': [
                'android', 'android developer', 'android engineer',
                'kotlin', 'java android', 'android studio',
                'mobile app', 'mobile application', 'mobile engineer',
                'jetpack compose', 'android sdk', 'google play',
                'junior android', 'senior android', 'lead android'
            ],
            'ios developer': [
                'ios', 'ios developer', 'ios engineer',
                'swift', 'objective-c', 'objective c',
                'xcode', 'app store', 'apple',
                'swiftui', 'uikit', 'cocoa',
                'mobile app', 'mobile application', 'mobile engineer',
                'junior ios', 'senior ios', 'lead ios'
            ],
            'react native developer': [
                'react native', 'react-native', 'cross-platform mobile',
                'mobile developer', 'hybrid app', 'expo',
                'junior react native', 'senior react native'
            ],
            'software architect': [
                'architect', 'software architect', 'solution architect', 'enterprise architect',
                'technical architect', 'system architect', 'cloud architect',
                'principal engineer', 'principal', 'distinguished engineer',
                'staff engineer', 'staff software engineer',
                'technical lead', 'tech lead', 'engineering lead',
                'system design', 'architecture', 'design patterns'
            ],
            'qa engineer': [
                'qa', 'quality assurance', 'qa engineer', 'quality engineer',
                'tester', 'test engineer', 'testing', 'software tester',
                'automation', 'test automation', 'automation engineer',
                'selenium', 'cypress', 'jest', 'pytest', 'junit',
                'manual testing', 'automated testing', 'performance testing',
                'load testing', 'api testing', 'integration testing',
                'junior qa', 'senior qa', 'lead qa', 'qa lead'
            ],
            'blockchain developer': [
                'blockchain', 'blockchain developer', 'blockchain engineer',
                'solidity', 'ethereum', 'web3', 'smart contract',
                'crypto', 'cryptocurrency', 'defi', 'nft',
                'hyperledger', 'truffle', 'hardhat',
                'junior blockchain', 'senior blockchain'
            ],
            'game developer': [
                'game', 'game developer', 'game engineer', 'game designer',
                'unity', 'unreal', 'unreal engine', 'game engine',
                'c++', 'c#', '3d', 'graphics', 'gameplay',
                'junior game developer', 'senior game developer'
            ],
            'cyber security specialist': [
                'security', 'cybersecurity', 'cyber security', 'infosec', 'information security',
                'security engineer', 'security analyst', 'security specialist',
                'penetration testing', 'pentesting', 'ethical hacking', 'security testing',
                'threat', 'vulnerability', 'compliance', 'risk',
                'soc', 'security operations', 'incident response',
                'cissp', 'ceh', 'security+',
                'junior security', 'senior security', 'lead security'
            ],
            'product manager': [
                'product manager', 'product owner', 'pm', 'po',
                'product', 'product lead', 'senior product manager',
                'technical product manager', 'tpm',
                'product strategy', 'product development'
            ],
            'data analyst': [
                'data analyst', 'business analyst', 'analytics',
                'sql analyst', 'reporting analyst', 'bi analyst',
                'excel', 'tableau', 'power bi', 'looker', 'sql',
                'junior data analyst', 'senior data analyst'
            ]
        }
        
        relevance_scores = {}
        relevant_roles = {}
        
        for pathway, keywords in pathway_keywords.items():
            matching_experiences = []
            total_relevance = 0
            
            for idx, exp in enumerate(work_experiences):
                job_title = (exp.get('job_title', '') or '').lower()
                company = (exp.get('company_name', '') or '').lower()
                description = (exp.get('description', '') or '').lower()
                
                # Check for keyword matches
                match_score = 0
                for keyword in keywords:
                    if keyword in job_title:
                        match_score += 1.0
                    elif keyword in description:
                        match_score += 0.3
                    elif keyword in company:
                        match_score += 0.2
                
                if match_score > 0:
                    # Weight by duration
                    duration_weight = min((exp.get('duration_months', 0) or 0) / 12, 1.0)  # Up to 1 year max weight
                    
                    # Apply recency weight
                    recency_weight = self._calculate_recency_weight(
                        exp.get('end_date', ''),
                        exp.get('is_current', False)
                    )
                    
                    # Apply company context boost (tech companies get bonus for tech roles)
                    company_context = company_contexts[idx] if idx < len(company_contexts) else {}
                    context_boost = 1.0
                    if company_context.get('is_tech') and pathway in ['frontend developer', 'backend developer', 
                                                                       'full stack developer', 'devops engineer',
                                                                       'mobile developer', 'data scientist']:
                        context_boost = 1.2
                    
                    total_relevance += match_score * duration_weight * recency_weight * context_boost
                    matching_experiences.append(exp)
            
            # Normalize relevance score (0-1)
            if total_relevance > 0:
                relevance_scores[pathway] = min(total_relevance / 3, 1.0)  # Cap at 1.0
                relevant_roles[pathway] = matching_experiences
        
        return {
            'total_months': total_months,
            'relevance_scores': relevance_scores,
            'relevant_roles': relevant_roles,
            'career_trajectory': career_trajectory,
            'company_contexts': company_contexts,
            'tech_experience_ratio': tech_experience_ratio
        }
    
    def _detect_seniority_level(self, job_title: str) -> int:
        """
        Detect seniority level from job title.
        Returns a score from 0 (entry) to 5 (executive)
        """
        if not job_title:
            return 1  # Default to entry level
        
        title_lower = job_title.lower()
        
        # Executive/Director level (5)
        if any(keyword in title_lower for keyword in ['cto', 'cio', 'vp', 'vice president', 'director', 'head of', 'chief']):
            return 5
        
        # Principal/Staff level (4)
        if any(keyword in title_lower for keyword in ['principal', 'staff', 'distinguished', 'fellow']):
            return 4
        
        # Lead/Senior level (3)
        if any(keyword in title_lower for keyword in ['lead', 'senior', 'sr.', 'sr ']):
            return 3
        
        # Mid level (2)
        if any(keyword in title_lower for keyword in ['engineer', 'developer', 'analyst', 'designer', 'architect']) and \
           not any(keyword in title_lower for keyword in ['junior', 'jr', 'associate', 'intern', 'entry']):
            return 2
        
        # Junior/Entry level (1)
        if any(keyword in title_lower for keyword in ['junior', 'jr.', 'jr ', 'associate', 'entry']):
            return 1
        
        # Intern level (0)
        if any(keyword in title_lower for keyword in ['intern', 'trainee', 'apprentice']):
            return 0
        
        return 1  # Default to entry level
    
    def _analyze_career_trajectory(self, work_experiences: List[Dict]) -> Dict:
        """
        Analyze career progression from work experiences.
        Returns trajectory type and score.
        """
        if not work_experiences or len(work_experiences) < 2:
            return {
                'type': 'insufficient_data',
                'progression_score': 0.0,
                'levels': [],
                'description': ''
            }
        
        # Sort experiences by date (most recent first, then by is_current)
        sorted_exp = sorted(
            work_experiences,
            key=lambda x: (x.get('is_current', False), x.get('end_date', ''), x.get('start_date', '')),
            reverse=True
        )
        
        # Detect seniority levels
        levels = []
        for exp in sorted_exp:
            level = self._detect_seniority_level(exp.get('job_title', ''))
            levels.append({
                'title': exp.get('job_title', ''),
                'level': level,
                'duration_months': exp.get('duration_months', 0)
            })
        
        # Analyze progression (reverse to go chronological)
        levels_reverse = list(reversed(levels))
        level_values = [l['level'] for l in levels_reverse]
        
        # Calculate trajectory
        if len(level_values) < 2:
            trajectory_type = 'stable'
            progression_score = 0.5
        else:
            # Check for upward progression
            increases = sum(1 for i in range(1, len(level_values)) if level_values[i] > level_values[i-1])
            decreases = sum(1 for i in range(1, len(level_values)) if level_values[i] < level_values[i-1])
            stable = len(level_values) - 1 - increases - decreases
            
            level_change = level_values[-1] - level_values[0]  # Most recent - oldest
            
            if level_change >= 2:
                trajectory_type = 'strong_upward'
                progression_score = 1.0
            elif level_change == 1 or increases > decreases:
                trajectory_type = 'upward'
                progression_score = 0.8
            elif level_change == 0 and stable >= len(level_values) - 1:
                trajectory_type = 'stable'
                progression_score = 0.5
            elif level_change < 0:
                trajectory_type = 'pivot'  # Career change/pivot
                progression_score = 0.4
            else:
                trajectory_type = 'mixed'
                progression_score = 0.6
        
        # Generate description
        descriptions = {
            'strong_upward': f'Strong career growth from {levels_reverse[0]["title"]} to {levels_reverse[-1]["title"]}',
            'upward': f'Steady progression in your career',
            'stable': f'Consistent experience at {levels_reverse[-1]["title"]} level',
            'pivot': f'Career transition detected',
            'mixed': f'Diverse career experiences'
        }
        
        return {
            'type': trajectory_type,
            'progression_score': progression_score,
            'levels': levels,
            'description': descriptions.get(trajectory_type, '')
        }
    
    def _calculate_recency_weight(self, end_date: str, is_current: bool) -> float:
        """
        Calculate recency weight using exponential decay.
        Recent experience (last 2-3 years) weighted more heavily.
        Returns weight between 0.3 (old) and 1.0 (current/recent)
        """
        if is_current:
            return 1.0
        
        if not end_date or end_date.lower() == 'present':
            return 1.0
        
        try:
            # Try to extract year from end_date
            year_match = re.search(r'(\d{4})', end_date)
            if year_match:
                end_year = int(year_match.group(1))
                current_year = datetime.now().year
                years_ago = current_year - end_year
                
                # Exponential decay: weight = e^(-0.3 * years_ago)
                # Current: 1.0, 1 year: 0.74, 2 years: 0.55, 3 years: 0.41, 5 years: 0.22
                import math
                weight = math.exp(-0.3 * years_ago)
                
                # Clamp between 0.3 and 1.0
                return max(0.3, min(1.0, weight))
        except Exception:
            pass
        
        # Default to moderate weight if we can't parse
        return 0.6
    
    def _extract_company_context(self, company_name: str, description: str) -> Dict:
        """
        Extract company context (size, industry) from company name and description.
        Returns dictionary with company metadata.
        """
        context = {
            'size': 'unknown',
            'industry': 'unknown',
            'is_tech': False
        }
        
        if not company_name and not description:
            return context
        
        company_lower = (company_name or '').lower()
        desc_lower = (description or '').lower()
        combined = f"{company_lower} {desc_lower}"
        
        # Detect company size
        enterprise_keywords = ['corporation', 'corp', 'international', 'global', 'worldwide', 'inc.', 
                              'limited', 'ltd', 'enterprise', 'fortune 500', 'fortune 1000']
        startup_keywords = ['startup', 'start-up', 'seed', 'series a', 'series b', 'venture']
        
        if any(keyword in combined for keyword in ['google', 'microsoft', 'amazon', 'apple', 'meta', 
                                                     'facebook', 'netflix', 'ibm', 'oracle', 'salesforce']):
            context['size'] = 'enterprise'
            context['is_tech'] = True
        elif any(keyword in combined for keyword in enterprise_keywords):
            context['size'] = 'large'
        elif any(keyword in combined for keyword in startup_keywords):
            context['size'] = 'startup'
        else:
            context['size'] = 'medium'
        
        # Detect industry
        tech_keywords = ['software', 'technology', 'tech', 'saas', 'cloud', 'data', 'ai', 'ml',
                        'mobile', 'web', 'internet', 'digital', 'computing', 'cybersecurity',
                        'fintech', 'edtech', 'healthtech']
        
        finance_keywords = ['bank', 'financial', 'finance', 'investment', 'trading', 'capital']
        healthcare_keywords = ['health', 'medical', 'hospital', 'pharma', 'clinical']
        consulting_keywords = ['consulting', 'consultant', 'advisory', 'services']
        
        if any(keyword in combined for keyword in tech_keywords):
            context['industry'] = 'tech'
            context['is_tech'] = True
        elif any(keyword in combined for keyword in finance_keywords):
            context['industry'] = 'finance'
        elif any(keyword in combined for keyword in healthcare_keywords):
            context['industry'] = 'healthcare'
        elif any(keyword in combined for keyword in consulting_keywords):
            context['industry'] = 'consulting'
        else:
            context['industry'] = 'other'
        
        return context

import re
from typing import List, Dict, Set, Tuple
from collections import defaultdict


class SkillExtractor:
    """Service for extracting skills from CV text"""
    
    def __init__(self):
        # Comprehensive skill database categorized by domain
        self.skill_database = {
            'frontend': {
                'languages': ['javascript', 'typescript', 'html', 'css', 'html5', 'css3'],
                'frameworks': ['react', 'vue', 'angular', 'svelte', 'next.js', 'nextjs', 'nuxt', 
                             'gatsby', 'ember', 'backbone'],
                'tools': ['webpack', 'vite', 'babel', 'sass', 'scss', 'less', 'tailwind', 
                         'bootstrap', 'material-ui', 'mui', 'styled-components'],
                'skills': ['responsive design', 'web design', 'ui/ux', 'accessibility', 'seo']
            },
            'backend': {
                'languages': ['python', 'java', 'c#', 'csharp', 'ruby', 'php', 'go', 'golang', 
                            'rust', 'node.js', 'nodejs', 'scala', 'kotlin'],
                'frameworks': ['django', 'flask', 'fastapi', 'spring', 'spring boot', 'express', 
                             'nest.js', 'nestjs', 'rails', 'laravel', '.net', 'dotnet', 'asp.net'],
                'databases': ['postgresql', 'mysql', 'mongodb', 'redis', 'elasticsearch', 
                            'dynamodb', 'cassandra', 'sqlite', 'oracle', 'sql server'],
                'tools': ['rest api', 'graphql', 'grpc', 'microservices', 'websockets']
            },
            'devops': {
                'tools': ['docker', 'kubernetes', 'jenkins', 'gitlab ci', 'github actions', 
                        'circleci', 'terraform', 'ansible', 'chef', 'puppet'],
                'cloud': ['aws', 'azure', 'gcp', 'google cloud', 'heroku', 'digitalocean', 
                        'cloudflare', 'vercel', 'netlify'],
                'monitoring': ['prometheus', 'grafana', 'elk', 'datadog', 'new relic', 'splunk'],
                'skills': ['ci/cd', 'infrastructure as code', 'containerization', 'orchestration']
            },
            'data': {
                'languages': ['python', 'r', 'sql', 'scala', 'julia'],
                'tools': ['pandas', 'numpy', 'scikit-learn', 'tensorflow', 'pytorch', 'keras',
                        'spark', 'hadoop', 'airflow', 'kafka', 'tableau', 'power bi'],
                'skills': ['machine learning', 'deep learning', 'data analysis', 'data visualization',
                         'statistics', 'big data', 'etl', 'data mining', 'nlp', 'computer vision']
            },
            'mobile': {
                'languages': ['swift', 'objective-c', 'kotlin', 'java', 'dart'],
                'frameworks': ['react native', 'flutter', 'ionic', 'xamarin', 'swiftui'],
                'skills': ['ios development', 'android development', 'mobile ui/ux']
            },
            'general': {
                'version_control': ['git', 'github', 'gitlab', 'bitbucket', 'svn'],
                'methodologies': ['agile', 'scrum', 'kanban', 'devops', 'tdd', 'bdd'],
                'soft_skills': ['leadership', 'team management', 'project management', 
                              'communication', 'problem solving'],
                'testing': ['jest', 'pytest', 'junit', 'selenium', 'cypress', 'mocha', 
                          'unit testing', 'integration testing', 'e2e testing']
            }
        }
        
        # Flatten skill database for quick lookup
        self.all_skills = self._flatten_skills()
        
        # Common certifications
        self.certifications = [
            'aws certified', 'azure certified', 'gcp certified', 'google cloud certified',
            'pmp', 'scrum master', 'csm', 'cissp', 'ceh', 'comptia', 'ccna', 'ccnp',
            'oracle certified', 'microsoft certified', 'cka', 'ckad', 'terraform certified'
        ]
    
    def _flatten_skills(self) -> Dict[str, str]:
        """Flatten the skill database for easier lookup"""
        flat_skills = {}
        for category, subcategories in self.skill_database.items():
            for subcategory, skills in subcategories.items():
                for skill in skills:
                    flat_skills[skill.lower()] = category
        return flat_skills
    
    def extract_skills(self, text: str) -> List[Dict[str, any]]:
        """Extract skills from text"""
        text_lower = text.lower()
        found_skills = []
        seen_skills = set()
        
        # Extract skills using keyword matching
        for skill, category in self.all_skills.items():
            # Use word boundaries for better matching
            pattern = r'\b' + re.escape(skill) + r'\b'
            if re.search(pattern, text_lower, re.IGNORECASE):
                if skill not in seen_skills:
                    found_skills.append({
                        'name': skill.title(),
                        'category': category,
                        'level': self._estimate_skill_level(text_lower, skill),
                        'confidence': 0.8
                    })
                    seen_skills.add(skill)
        
        return found_skills
    
    def extract_certifications(self, text: str) -> List[str]:
        """Extract certifications from text"""
        text_lower = text.lower()
        found_certs = []
        
        for cert in self.certifications:
            if cert.lower() in text_lower:
                found_certs.append(cert)
        
        return found_certs
    
    def _estimate_skill_level(self, text: str, skill: str) -> str:
        """Estimate skill level based on context"""
        # Look for experience indicators near the skill mention
        skill_context = self._get_skill_context(text, skill)
        
        if any(word in skill_context for word in ['expert', 'advanced', 'senior', 'lead', 'architect']):
            return 'expert'
        elif any(word in skill_context for word in ['intermediate', 'proficient', 'experienced', 'mid']):
            return 'intermediate'
        elif any(word in skill_context for word in ['beginner', 'junior', 'learning', 'basic', 'familiar']):
            return 'beginner'
        else:
            return 'intermediate'  # Default
    
    def _get_skill_context(self, text: str, skill: str, window: int = 100) -> str:
        """Get surrounding context for a skill mention"""
        pattern = r'\b' + re.escape(skill) + r'\b'
        match = re.search(pattern, text, re.IGNORECASE)
        
        if match:
            start = max(0, match.start() - window)
            end = min(len(text), match.end() + window)
            return text[start:end].lower()
        
        return ""
    
    def categorize_skills(self, skills: List[Dict[str, any]]) -> Dict[str, List[Dict]]:
        """Categorize skills by domain"""
        categorized = defaultdict(list)
        
        for skill in skills:
            category = skill.get('category', 'general')
            categorized[category].append(skill)
        
        return dict(categorized)
    
    def get_skill_summary(self, skills: List[Dict[str, any]]) -> Dict[str, any]:
        """Get a summary of skills"""
        categorized = self.categorize_skills(skills)
        
        return {
            'total_skills': len(skills),
            'by_category': {cat: len(skills) for cat, skills in categorized.items()},
            'top_categories': sorted(
                categorized.items(), 
                key=lambda x: len(x[1]), 
                reverse=True
            )[:3],
            'skills_by_level': {
                'expert': len([s for s in skills if s.get('level') == 'expert']),
                'intermediate': len([s for s in skills if s.get('level') == 'intermediate']),
                'beginner': len([s for s in skills if s.get('level') == 'beginner'])
            }
        }

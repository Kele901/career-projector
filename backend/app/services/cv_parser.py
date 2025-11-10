import re
from typing import Dict, Any, Optional, List
from datetime import datetime
import PyPDF2
import pdfplumber
from docx import Document
from pathlib import Path


class CVParser:
    """Service for parsing CV files (PDF and DOCX)"""
    
    def __init__(self):
        self.email_pattern = re.compile(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b')
        self.phone_pattern = re.compile(r'[\+\(]?[1-9][0-9 .\-\(\)]{8,}[0-9]')
        self.years_pattern = re.compile(r'(\d+)\+?\s*years?', re.IGNORECASE)
        self.date_pattern = re.compile(r'(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s*\d{4}|(\d{1,2}/\d{4})|(\d{4})', re.IGNORECASE)
        
        # Common job title keywords
        self.job_title_keywords = [
            'developer', 'engineer', 'architect', 'designer', 'manager', 'lead', 'senior', 
            'junior', 'analyst', 'consultant', 'specialist', 'coordinator', 'director',
            'administrator', 'programmer', 'scientist', 'researcher', 'technician', 'intern'
        ]
        
        # Company context keywords
        self.enterprise_keywords = ['corporation', 'corp', 'international', 'global', 'worldwide', 
                                   'inc.', 'limited', 'ltd', 'enterprise', 'fortune']
        self.startup_keywords = ['startup', 'start-up', 'seed', 'series a', 'series b', 'venture']
        self.tech_keywords = ['software', 'technology', 'tech', 'saas', 'cloud', 'data', 
                             'ai', 'ml', 'mobile', 'web', 'internet', 'digital']
        
    def parse_file(self, file_path: str) -> Dict[str, Any]:
        """Parse a CV file and extract information"""
        file_path = Path(file_path)
        
        if not file_path.exists():
            raise FileNotFoundError(f"File not found: {file_path}")
        
        # Extract text based on file type
        if file_path.suffix.lower() == '.pdf':
            raw_text = self._parse_pdf(file_path)
        elif file_path.suffix.lower() == '.docx':
            raw_text = self._parse_docx(file_path)
        else:
            raise ValueError(f"Unsupported file type: {file_path.suffix}")
        
        # Extract structured information
        parsed_data = self._extract_information(raw_text)
        parsed_data['raw_text'] = raw_text
        
        return parsed_data
    
    def _parse_pdf(self, file_path: Path) -> str:
        """Extract text from PDF file"""
        text = ""
        
        try:
            # Try pdfplumber first (better for complex layouts)
            with pdfplumber.open(file_path) as pdf:
                for page in pdf.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text += page_text + "\n"
        except Exception as e:
            print(f"pdfplumber failed: {e}, trying PyPDF2")
            
            # Fallback to PyPDF2
            try:
                with open(file_path, 'rb') as file:
                    pdf_reader = PyPDF2.PdfReader(file)
                    for page in pdf_reader.pages:
                        page_text = page.extract_text()
                        if page_text:
                            text += page_text + "\n"
            except Exception as e:
                print(f"PyPDF2 also failed: {e}")
                raise ValueError(f"Could not extract text from PDF: {e}")
        
        return text.strip()
    
    def _parse_docx(self, file_path: Path) -> str:
        """Extract text from DOCX file"""
        try:
            doc = Document(file_path)
            text = "\n".join([paragraph.text for paragraph in doc.paragraphs])
            return text.strip()
        except Exception as e:
            raise ValueError(f"Could not extract text from DOCX: {e}")
    
    def _extract_information(self, text: str) -> Dict[str, Any]:
        """Extract structured information from raw text"""
        info = {
            'email': None,
            'phone': None,
            'years_experience': None,
            'education_level': None
        }
        
        # Extract email
        email_match = self.email_pattern.search(text)
        if email_match:
            info['email'] = email_match.group()
        
        # Extract phone
        phone_match = self.phone_pattern.search(text)
        if phone_match:
            info['phone'] = phone_match.group()
        
        # Extract years of experience
        years_match = self.years_pattern.search(text)
        if years_match:
            try:
                info['years_experience'] = float(years_match.group(1))
            except ValueError:
                pass
        
        # Detect education level
        text_lower = text.lower()
        if 'phd' in text_lower or 'doctorate' in text_lower:
            info['education_level'] = 'PhD'
        elif 'master' in text_lower or 'msc' in text_lower or 'ma ' in text_lower:
            info['education_level'] = 'Masters'
        elif 'bachelor' in text_lower or 'bsc' in text_lower or 'ba ' in text_lower or 'degree' in text_lower:
            info['education_level'] = 'Bachelors'
        elif 'diploma' in text_lower or 'certificate' in text_lower:
            info['education_level'] = 'Diploma/Certificate'
        
        return info
    
    def extract_sections(self, text: str) -> Dict[str, str]:
        """Extract common CV sections"""
        sections = {
            'experience': '',
            'education': '',
            'skills': '',
            'certifications': ''
        }
        
        text_lower = text.lower()
        lines = text.split('\n')
        
        current_section = None
        section_content = []
        
        for line in lines:
            line_lower = line.lower().strip()
            
            # Detect section headers
            if any(keyword in line_lower for keyword in ['work experience', 'professional experience', 'employment']):
                if current_section and section_content:
                    sections[current_section] = '\n'.join(section_content)
                current_section = 'experience'
                section_content = []
            elif any(keyword in line_lower for keyword in ['education', 'academic']):
                if current_section and section_content:
                    sections[current_section] = '\n'.join(section_content)
                current_section = 'education'
                section_content = []
            elif any(keyword in line_lower for keyword in ['skills', 'technical skills', 'competencies']):
                if current_section and section_content:
                    sections[current_section] = '\n'.join(section_content)
                current_section = 'skills'
                section_content = []
            elif any(keyword in line_lower for keyword in ['certifications', 'certificates', 'licenses']):
                if current_section and section_content:
                    sections[current_section] = '\n'.join(section_content)
                current_section = 'certifications'
                section_content = []
            elif current_section and line.strip():
                section_content.append(line)
        
        # Save the last section
        if current_section and section_content:
            sections[current_section] = '\n'.join(section_content)
        
        return sections
    
    def extract_work_experience(self, text: str) -> List[Dict[str, Any]]:
        """Extract work experience entries from CV text"""
        experiences = []
        sections = self.extract_sections(text)
        experience_text = sections.get('experience', '')
        
        if not experience_text:
            # Try to find experience section manually
            lines = text.split('\n')
            in_experience_section = False
            experience_lines = []
            
            for line in lines:
                line_lower = line.lower().strip()
                if any(keyword in line_lower for keyword in ['work experience', 'professional experience', 'employment history', 'career history']):
                    in_experience_section = True
                    continue
                elif in_experience_section and any(keyword in line_lower for keyword in ['education', 'skills', 'certifications', 'projects']):
                    break
                elif in_experience_section:
                    experience_lines.append(line)
            
            experience_text = '\n'.join(experience_lines)
        
        if not experience_text:
            return experiences
        
        # Parse work experiences
        experiences = self._parse_experience_entries(experience_text)
        return experiences
    
    def _parse_experience_entries(self, experience_text: str) -> List[Dict[str, Any]]:
        """Parse individual work experience entries"""
        experiences = []
        lines = experience_text.split('\n')
        
        current_experience = None
        current_description = []
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
            
            # Check if line looks like a job title (contains job keywords)
            line_lower = line.lower()
            is_job_title = any(keyword in line_lower for keyword in self.job_title_keywords)
            has_dates = self.date_pattern.search(line)
            
            if is_job_title or (has_dates and len(line.split()) >= 2):
                # Save previous experience
                if current_experience:
                    current_experience['description'] = '\n'.join(current_description).strip()
                    experiences.append(current_experience)
                
                # Start new experience
                current_experience = self._parse_experience_line(line)
                current_description = []
            elif current_experience:
                # Add to description
                current_description.append(line)
        
        # Save last experience
        if current_experience:
            current_experience['description'] = '\n'.join(current_description).strip()
            
            # Add enhanced fields
            current_experience['seniority_level'] = self._detect_seniority_level(current_experience.get('job_title', ''))
            current_experience['company_size'] = self._detect_company_size(
                current_experience.get('company_name', ''),
                current_experience.get('description', '')
            )
            current_experience['company_industry'] = self._detect_company_industry(
                current_experience.get('company_name', ''),
                current_experience.get('description', '')
            )
            
            experiences.append(current_experience)
        
        # Add enhanced fields to all experiences
        for exp in experiences:
            if 'seniority_level' not in exp:
                exp['seniority_level'] = self._detect_seniority_level(exp.get('job_title', ''))
            if 'company_size' not in exp:
                exp['company_size'] = self._detect_company_size(
                    exp.get('company_name', ''),
                    exp.get('description', '')
                )
            if 'company_industry' not in exp:
                exp['company_industry'] = self._detect_company_industry(
                    exp.get('company_name', ''),
                    exp.get('description', '')
                )
        
        return experiences
    
    def _parse_experience_line(self, line: str) -> Dict[str, Any]:
        """Parse a single experience line (job title, company, dates)"""
        experience = {
            'job_title': '',
            'company_name': '',
            'start_date': '',
            'end_date': '',
            'is_current': False,
            'duration_months': None,
            'technologies_used': ''
        }
        
        # Extract dates
        dates = self.date_pattern.findall(line)
        if dates:
            # Flatten the tuple results
            date_strings = []
            for date_tuple in dates:
                for d in date_tuple:
                    if d:
                        date_strings.append(d)
            
            if len(date_strings) >= 2:
                experience['start_date'] = date_strings[0]
                experience['end_date'] = date_strings[1]
            elif len(date_strings) == 1:
                experience['start_date'] = date_strings[0]
        
        # Check for "Present" or "Current"
        if re.search(r'\bpresent\b|\bcurrent\b', line, re.IGNORECASE):
            experience['is_current'] = True
            experience['end_date'] = 'Present'
        
        # Calculate duration if possible
        experience['duration_months'] = self._calculate_duration(
            experience['start_date'], 
            experience['end_date']
        )
        
        # Remove dates from line to extract title and company
        line_without_dates = re.sub(self.date_pattern, '', line)
        line_without_dates = re.sub(r'\bpresent\b|\bcurrent\b', '', line_without_dates, flags=re.IGNORECASE)
        line_without_dates = line_without_dates.strip(' -–—|')
        
        # Split by common separators
        parts = re.split(r'\s+[-–—|@]\s+|\s+at\s+', line_without_dates, maxsplit=1)
        
        if len(parts) >= 2:
            experience['job_title'] = parts[0].strip()
            experience['company_name'] = parts[1].strip()
        elif len(parts) == 1:
            experience['job_title'] = parts[0].strip()
        
        return experience
    
    def _calculate_duration(self, start_date: str, end_date: str) -> Optional[int]:
        """Calculate duration in months between dates"""
        if not start_date:
            return None
        
        try:
            # Try to parse years
            start_year_match = re.search(r'(\d{4})', start_date)
            if not start_year_match:
                return None
            
            start_year = int(start_year_match.group(1))
            
            if end_date and end_date.lower() != 'present':
                end_year_match = re.search(r'(\d{4})', end_date)
                if end_year_match:
                    end_year = int(end_year_match.group(1))
                else:
                    return None
            else:
                end_year = datetime.now().year
            
            # Rough calculation (assuming mid-year for both)
            duration_years = end_year - start_year
            duration_months = duration_years * 12
            
            return max(duration_months, 1)  # At least 1 month
        except Exception:
            return None
    
    def _detect_seniority_level(self, job_title: str) -> str:
        """Detect seniority level from job title"""
        if not job_title:
            return 'mid'
        
        title_lower = job_title.lower()
        
        # Executive/Director level
        if any(keyword in title_lower for keyword in ['cto', 'cio', 'vp', 'vice president', 'director', 'head of', 'chief']):
            return 'director'
        
        # Principal/Staff level
        if any(keyword in title_lower for keyword in ['principal', 'staff', 'distinguished', 'fellow']):
            return 'principal'
        
        # Lead/Senior level
        if any(keyword in title_lower for keyword in ['lead', 'senior', 'sr.', 'sr ']):
            return 'senior'
        
        # Junior/Entry level
        if any(keyword in title_lower for keyword in ['junior', 'jr.', 'jr ', 'associate', 'entry']):
            return 'junior'
        
        # Intern level
        if any(keyword in title_lower for keyword in ['intern', 'trainee', 'apprentice']):
            return 'intern'
        
        # Default to mid level
        return 'mid'
    
    def _detect_company_size(self, company_name: str, description: str) -> str:
        """Detect company size from name and description"""
        if not company_name:
            return 'unknown'
        
        company_lower = company_name.lower()
        desc_lower = (description or '').lower()
        combined = f"{company_lower} {desc_lower}"
        
        # Known large tech companies
        if any(keyword in combined for keyword in ['google', 'microsoft', 'amazon', 'apple', 'meta', 
                                                    'facebook', 'netflix', 'ibm', 'oracle', 'salesforce']):
            return 'enterprise'
        
        # Enterprise indicators
        if any(keyword in combined for keyword in self.enterprise_keywords):
            return 'large'
        
        # Startup indicators
        if any(keyword in combined for keyword in self.startup_keywords):
            return 'startup'
        
        return 'medium'
    
    def _detect_company_industry(self, company_name: str, description: str) -> str:
        """Detect company industry from name and description"""
        if not company_name:
            return 'unknown'
        
        company_lower = company_name.lower()
        desc_lower = (description or '').lower()
        combined = f"{company_lower} {desc_lower}"
        
        # Tech industry
        if any(keyword in combined for keyword in self.tech_keywords):
            return 'tech'
        
        # Finance
        if any(keyword in combined for keyword in ['bank', 'financial', 'finance', 'investment', 'trading', 'capital']):
            return 'finance'
        
        # Healthcare
        if any(keyword in combined for keyword in ['health', 'medical', 'hospital', 'pharma', 'clinical']):
            return 'healthcare'
        
        # Consulting
        if any(keyword in combined for keyword in ['consulting', 'consultant', 'advisory', 'services']):
            return 'consulting'
        
        return 'other'

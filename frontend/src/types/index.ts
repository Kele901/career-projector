export interface User {
  id: number;
  email: string;
  full_name?: string;
}

export interface LoginCredentials {
  username: string; // email
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  full_name?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}

export interface CV {
  id: number;
  filename: string;
  upload_date: string;
  years_experience?: number;
  education_level?: string;
}

export interface Skill {
  id: number;
  skill_name: string;
  skill_category?: string;
  skill_level?: string;
  confidence_score: number;
}

export interface WorkExperience {
  id: number;
  job_title: string;
  company_name?: string;
  start_date?: string;
  end_date?: string;
  duration_months?: number;
  description?: string;
  technologies_used?: string;
  is_current: boolean;
  seniority_level?: string;
  company_size?: string;
  company_industry?: string;
}

export interface CVDetail {
  cv: CV;
  skills: Skill[];
  work_experiences: WorkExperience[];
  parsed_content?: string;
}

export interface CVAnalysis {
  cv_id: number;
  filename: string;
  skills_found: number;
  skills: Skill[];
  work_experiences: WorkExperience[];
  work_experience_count: number;
  years_experience?: number;
  education_level?: string;
  sections: Record<string, string>;
}

export interface PathwayRecommendation {
  pathway: string;
  description: string;
  match_score: number;
  reasoning: string;
  recommended_skills: string[];
  roadmap_url: string;
  ai_insight?: any;
  is_ai_enhanced: boolean;
  experience_relevance?: number;
  career_progression_score?: number;
  company_context_match?: number;
  recency_boost?: number;
}

export interface RecommendationResult {
  cv_id: number;
  recommendations: PathwayRecommendation[];
  total_skills: number;
}

export interface CareerPathway {
  name: string;
  description: string;
  roadmap_url: string;
  required_skills: string[];
  optional_skills: string[];
}


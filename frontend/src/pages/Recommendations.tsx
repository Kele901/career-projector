import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { recommendationsAPI, cvAPI } from '../services/api';
import { ArrowLeft, TrendingUp, ExternalLink, Sparkles, Target, BookOpen, BarChart3, PieChart as PieChartIcon, Award, TrendingDown, Info, Briefcase, Clock, Building2, LineChart, Layers, Zap, TrendingUp as TrendIcon, Download, Printer, Share2, Copy, Check, Map, TrendingUp as AnalyticsIcon, GitCompare, Activity } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ScatterChart, Scatter, ZAxis, LineChart as RechartsLineChart, Line } from 'recharts';
import type { RecommendationResult, CVDetail, WorkExperience } from '../types';
import axios from 'axios';

// Info Tooltip Component
const InfoTooltip: React.FC<{ title: string; description: string }> = ({ title, description }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="relative inline-block">
      <button
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onClick={() => setShowTooltip(!showTooltip)}
        className="text-gray-400 hover:text-indigo-600 transition-colors ml-2"
        type="button"
      >
        <Info className="w-5 h-5" />
      </button>
      {showTooltip && (
        <div className="absolute left-0 top-8 z-50 w-80 bg-gray-900 text-white text-sm rounded-lg shadow-xl p-4 animate-fadeIn">
          <div className="font-semibold mb-2">{title}</div>
          <div className="text-gray-200">{description}</div>
          <div className="absolute -top-2 left-4 w-4 h-4 bg-gray-900 transform rotate-45"></div>
        </div>
      )}
    </div>
  );
};

// Function to map career pathways to roadmap.sh URLs
const getRoadmapUrl = (pathway: string): string | null => {
  const pathwayLower = pathway.toLowerCase();
  
  // Mapping of keywords to roadmap.sh paths
  const roadmapMappings: { [key: string]: string } = {
    'frontend': 'frontend',
    'front-end': 'frontend',
    'front end': 'frontend',
    'backend': 'backend',
    'back-end': 'backend',
    'back end': 'backend',
    'full stack': 'full-stack',
    'fullstack': 'full-stack',
    'full-stack': 'full-stack',
    'devops': 'devops',
    'devsecops': 'devops',
    'android': 'android',
    'ios': 'ios',
    'react native': 'react-native',
    'flutter': 'flutter',
    'python': 'python',
    'java': 'java',
    'javascript': 'javascript',
    'typescript': 'typescript',
    'golang': 'golang',
    'go developer': 'golang',
    'rust': 'rust',
    'node.js': 'nodejs',
    'nodejs': 'nodejs',
    'node js': 'nodejs',
    'postgresql': 'postgresql-dba',
    'postgres': 'postgresql-dba',
    'sql': 'sql',
    'mongodb': 'mongodb',
    'data analyst': 'data-analyst',
    'data scientist': 'ai-data-scientist',
    'data science': 'ai-data-scientist',
    'machine learning': 'mlops',
    'ml engineer': 'mlops',
    'ai engineer': 'ai-engineer',
    'artificial intelligence': 'ai-engineer',
    'prompt engineer': 'prompt-engineering',
    'qa': 'qa',
    'quality assurance': 'qa',
    'software architect': 'software-architect',
    'system design': 'system-design',
    'api design': 'api-design',
    'graphql': 'graphql',
    'docker': 'docker',
    'kubernetes': 'kubernetes',
    'cyber security': 'cyber-security',
    'cybersecurity': 'cyber-security',
    'blockchain': 'blockchain',
    'game developer': 'game-developer',
    'ux': 'ux-design',
    'ui/ux': 'ux-design',
    'design system': 'design-system',
    'technical writer': 'technical-writer',
    'computer science': 'computer-science',
    'software engineering': 'software-design-architecture',
    'cloud': 'devops',
    'aws': 'aws',
    'azure': 'devops',
    'gcp': 'devops',
    'react': 'react',
    'angular': 'angular',
    'vue': 'vue',
    'asp.net': 'aspnet-core',
    '.net': 'aspnet-core',
  };

  // Check for exact or partial matches
  for (const [keyword, roadmapPath] of Object.entries(roadmapMappings)) {
    if (pathwayLower.includes(keyword)) {
      return `https://roadmap.sh/${roadmapPath}`;
    }
  }

  return null; // Return null if no match found
};

const Recommendations: React.FC = () => {
  const { cvId } = useParams<{ cvId: string }>();
  const navigate = useNavigate();
  const [recommendations, setRecommendations] = useState<RecommendationResult | null>(null);
  const [cvDetail, setCVDetail] = useState<CVDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [useAI, setUseAI] = useState(false);
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (cvId) {
      loadData(parseInt(cvId));
    }
  }, [cvId]);

  const loadData = async (id: number) => {
    try {
      // Load CV details
      const cvDetailData = await cvAPI.getDetail(id);
      setCVDetail(cvDetailData);
      
      // Try to load existing recommendations
      const existingRecs = await recommendationsAPI.getForCV(id);
      if (existingRecs && existingRecs.length > 0) {
        // Convert to expected format
        setRecommendations({
          cv_id: id,
          recommendations: existingRecs.map((rec: any) => ({
            pathway: rec.pathway,
            description: '',
            match_score: rec.match_score,
            reasoning: rec.reasoning || '',
            recommended_skills: rec.recommended_skills ? rec.recommended_skills.split(',') : [],
            roadmap_url: '',
            is_ai_enhanced: rec.is_ai_enhanced || false,
          })),
          total_skills: cvDetailData.skills.length,
        });
      }
    } catch (err: any) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateRecommendations = async () => {
    if (!cvId) return;

    setGenerating(true);
    setError('');

    try {
      const result = await recommendationsAPI.generate(parseInt(cvId), useAI, 5);
      setRecommendations(result);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to generate recommendations');
    } finally {
      setGenerating(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.7) return 'text-green-600';
    if (score >= 0.5) return 'text-yellow-600';
    return 'text-orange-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 0.7) return 'bg-green-100';
    if (score >= 0.5) return 'bg-yellow-100';
    return 'bg-orange-100';
  };

  // Colors for charts
  const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#06b6d4'];
  
  // Prepare data for visualizations
  // Export and Share Handlers
  const handleExportPDF = async () => {
    if (!cvId || !recommendations) return;
    
    try {
      setExporting(true);
      console.log('Starting PDF export for CV ID:', cvId);
      
      const response = await axios.post(
        `http://localhost:8000/api/v1/export/${cvId}/pdf`,
        {},
        { 
          responseType: 'blob',
          timeout: 60000, // 60 second timeout for PDF generation
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
      
      console.log('PDF response received:', response);
      
      // Check if response is actually a PDF
      if (response.data.type !== 'application/pdf') {
        // Try to read error message from blob
        const text = await response.data.text();
        throw new Error(`Invalid response type: ${text}`);
      }
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `career-recommendations-${cvId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      console.log('PDF download initiated');
    } catch (err: any) {
      console.error('PDF Export Error:', err);
      let errorMsg = err.response?.data?.detail || err.message || 'Unknown error';
      
      // Provide more helpful error messages
      if (errorMsg.includes('No recommendations found')) {
        errorMsg = 'Please generate career recommendations first before exporting to PDF. Click "Generate Recommendations" above.';
      } else if (errorMsg.includes('Network Error') || errorMsg.includes('timeout')) {
        errorMsg = 'Network error: Unable to reach the server. Please ensure the backend is running.';
      }
      
      alert('Failed to export PDF:\n\n' + errorMsg);
    } finally {
      setExporting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleGenerateShareLink = async () => {
    if (!cvId || !recommendations) return;
    
    try {
      setExporting(true);
      const response = await axios.post(`http://localhost:8000/api/v1/export/${cvId}/share`);
      setShareLink(`${window.location.origin}/shared/${response.data.share_code}`);
      setShowShareModal(true);
    } catch (err: any) {
      alert('Failed to generate share link: ' + (err.response?.data?.detail || err.message));
    } finally {
      setExporting(false);
    }
  };

  const handleCopyLink = () => {
    if (shareLink) {
      navigator.clipboard.writeText(shareLink);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    }
  };

  const getChartData = () => {
    if (!recommendations || recommendations.recommendations.length === 0) return null;

    // Career match distribution
    const matchData = recommendations.recommendations.map((rec) => ({
      name: rec.pathway,
      value: Math.round(rec.match_score * 100),
      percentage: rec.match_score,
    }));

    // Skill gap analysis (top skills to learn)
    const skillGapData: { [key: string]: number } = {};
    recommendations.recommendations.forEach(rec => {
      rec.recommended_skills?.slice(0, 5).forEach(skill => {
        skillGapData[skill] = (skillGapData[skill] || 0) + 1;
      });
    });

    const topSkillGaps = Object.entries(skillGapData)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([skill, count]) => ({
        skill,
        frequency: count,
        importance: Math.round((count / recommendations.recommendations.length) * 100),
      }));

    // Match score ranges
    const scoreRanges = {
      excellent: recommendations.recommendations.filter(r => r.match_score >= 0.7).length,
      good: recommendations.recommendations.filter(r => r.match_score >= 0.5 && r.match_score < 0.7).length,
      fair: recommendations.recommendations.filter(r => r.match_score < 0.5).length,
    };

    const scoreDistribution = [
      { name: 'Excellent Match (70%+)', value: scoreRanges.excellent, color: '#10b981' },
      { name: 'Good Match (50-69%)', value: scoreRanges.good, color: '#f59e0b' },
      { name: 'Fair Match (<50%)', value: scoreRanges.fair, color: '#ef4444' },
    ].filter(item => item.value > 0);

    // Radar chart data for top 5 paths (need at least 3 for proper rendering)
    const topRecs = recommendations.recommendations.slice(0, Math.min(5, recommendations.recommendations.length));
    const radarData = topRecs.length >= 3 ? topRecs.map(rec => ({
      subject: rec.pathway.length > 20 ? rec.pathway.substring(0, 20) + '...' : rec.pathway,
      fullName: rec.pathway,
      A: Math.round(rec.match_score * 100),
      matchScore: Math.round(rec.match_score * 100),
    })) : [];

    // NEW: Skills Gap Stacked Bar Data (Shows what you have vs what you need)
    const skillsGapStackedData = recommendations.recommendations.slice(0, 8).map(rec => {
      const matchPercent = Math.round(rec.match_score * 100);
      const gapPercent = 100 - matchPercent;
      
      return {
        pathway: rec.pathway.length > 18 ? rec.pathway.substring(0, 18) + '...' : rec.pathway,
        fullName: rec.pathway,
        hasSkills: matchPercent,
        needsSkills: gapPercent,
        matchScore: matchPercent
      };
    });

    // NEW: Learning Priority Matrix Data (Impact vs Difficulty)
    const allMissingSkills: { [key: string]: { count: number; avgScore: number } } = {};
    recommendations.recommendations.forEach(rec => {
      rec.recommended_skills?.forEach(skill => {
        if (!allMissingSkills[skill]) {
          allMissingSkills[skill] = { count: 0, avgScore: 0 };
        }
        allMissingSkills[skill].count += 1;
        allMissingSkills[skill].avgScore += rec.match_score;
      });
    });

    const learningPriorityData = Object.entries(allMissingSkills)
      .slice(0, 20)
      .map((entry: [string, { count: number; avgScore: number }]) => {
        const [skill, data] = entry;
        const impact = (data.count / recommendations.recommendations.length) * 100;
        const difficulty = skill.length > 8 ? 70 : 40;
        
        // Assign colors based on priority (impact vs difficulty)
        let color = '#8b5cf6'; // Default purple
        if (impact > 60 && difficulty < 60) {
          color = '#10b981'; // High impact, easier - Green (HIGH PRIORITY)
        } else if (impact > 60 && difficulty >= 60) {
          color = '#f59e0b'; // High impact, harder - Orange (MEDIUM-HIGH PRIORITY)
        } else if (impact <= 60 && difficulty < 60) {
          color = '#3b82f6'; // Lower impact, easier - Blue (MEDIUM PRIORITY)
        } else {
          color = '#ef4444'; // Lower impact, harder - Red (LOW PRIORITY)
        }
        
        return {
          skill,
          impact,
          difficulty,
          size: data.count * 2 + 5,
          color
        };
      });

    // NEW: Career Progression Trend Data
    const progressionTrendData = recommendations.recommendations.slice(0, 5).map((rec, index) => ({
      rank: index + 1,
      pathway: rec.pathway.length > 15 ? rec.pathway.substring(0, 15) + '...' : rec.pathway,
      fullName: rec.pathway,
      matchScore: Math.round(rec.match_score * 100),
      careerProgression: Math.round((rec.career_progression_score || 0.5) * 100),
      recency: Math.round((rec.recency_boost || 0.5) * 100),
      experience: Math.round((rec.experience_relevance || 0) * 100)
    }));

    // NEW: Experience Timeline Data (from CV work experiences)
    const experienceTimelineData = cvDetail?.work_experiences
      ? cvDetail.work_experiences
          .filter((exp: WorkExperience) => exp.start_date || exp.duration_months)
          .map((exp: WorkExperience) => {
            const startYear = exp.start_date ? new Date(exp.start_date).getFullYear() : new Date().getFullYear();
            const durationYears = exp.duration_months ? exp.duration_months / 12 : 1;
            const endYear = exp.end_date ? new Date(exp.end_date).getFullYear() : (exp.is_current ? new Date().getFullYear() : startYear + durationYears);
            
            return {
              job_title: exp.job_title,
              company: exp.company_name || 'Unknown Company',
              startYear,
              endYear,
              duration: endYear - startYear || 0.5,
              isCurrent: exp.is_current,
              seniority: exp.seniority_level || 'Mid',
              technologies: exp.technologies_used || ''
            };
          })
          .sort((a: any, b: any) => a.startYear - b.startYear)
      : [];

    // NEW: Skill Category Heatmap Data
    const skillCategoryData: { [key: string]: { hasSkill: number; needsSkill: number } } = {};
    
    // Get skills user currently has from CV
    const userSkills = cvDetail?.skills?.map(s => s.skill_name.toLowerCase()) || [];
    
    // Debug: Log user skills
    console.log('📊 User CV Skills:', userSkills);
    
    // Helper function to normalize skills for better matching
    const normalizeSkill = (skill: string): string => {
      return skill
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '') // Remove special chars, spaces, dots
        .replace(/\s+/g, '');
    };

    // Helper function for flexible skill matching
    const hasSkill = (recommendedSkill: string): boolean => {
      const skillLower = recommendedSkill.toLowerCase();
      const normalizedRecommended = normalizeSkill(recommendedSkill);
      
      return userSkills.some(userSkill => {
        const normalizedUser = normalizeSkill(userSkill);
        
        // 1. Check for exact match (normalized)
        if (normalizedUser === normalizedRecommended) return true;
        
        // 2. Check if one contains the other (normalized)
        if (normalizedUser.includes(normalizedRecommended) || normalizedRecommended.includes(normalizedUser)) return true;
        
        // 3. Check original strings (case-insensitive)
        if (userSkill === skillLower) return true;
        if (userSkill.includes(skillLower) || skillLower.includes(userSkill)) return true;
        
        // 4. Check for common variations and aliases
        const variations: { [key: string]: string[] } = {
          'javascript': ['js', 'ecmascript', 'es6', 'es2015', 'es2016', 'es2017', 'es2018', 'es2019', 'es2020'],
          'typescript': ['ts'],
          'python': ['py', 'python3', 'python2'],
          'react': ['reactjs', 'react.js', 'reactjs'],
          'vue': ['vuejs', 'vue.js', 'vuejs'],
          'angular': ['angularjs', 'angular.js', 'ng'],
          'node': ['nodejs', 'node.js', 'nodejsserver'],
          'express': ['expressjs', 'express.js'],
          'next': ['nextjs', 'next.js'],
          'nuxt': ['nuxtjs', 'nuxt.js'],
          'docker': ['containerization', 'containers'],
          'kubernetes': ['k8s', 'k8'],
          'postgresql': ['postgres', 'psql', 'pg'],
          'mongodb': ['mongo', 'mongodbdatabase'],
          'mysql': ['mysqldb'],
          'redis': ['rediscache'],
          'graphql': ['gql'],
          'rest': ['restapi', 'restful', 'restfulapi'],
          'api': ['apis', 'webservices'],
          'git': ['github', 'gitlab', 'gitversion'],
          'aws': ['amazon', 'amazonwebservices'],
          'azure': ['microsoftazure'],
          'gcp': ['googlecloud', 'googlecloudplatform'],
          'ci': ['cicd', 'continuousintegration'],
          'cd': ['cicd', 'continuousdeployment'],
          'jest': ['jestjs', 'jesttest'],
          'mocha': ['mochajs', 'mochatest'],
          'sass': ['scss'],
          'css': ['css3', 'cascadingstylesheets'],
          'html': ['html5', 'hypertext'],
          'sql': ['structured', 'mysql', 'postgresql', 'sqlserver'],
          'nosql': ['mongodb', 'couchdb', 'dynamodb'],
        };
        
        // Check all variations
        for (const [key, vars] of Object.entries(variations)) {
          const normalizedKey = normalizeSkill(key);
          
          // Check if user has the base skill
          if (normalizedUser.includes(normalizedKey) || normalizedUser === normalizedKey) {
            // Check if recommended is a variation
            if (vars.some(v => normalizedRecommended.includes(normalizeSkill(v)) || normalizeSkill(v).includes(normalizedRecommended))) {
              return true;
            }
          }
          
          // Check if user has a variation
          if (vars.some(v => normalizedUser.includes(normalizeSkill(v)) || normalizeSkill(v) === normalizedUser)) {
            // Check if recommended is the base or another variation
            if (normalizedRecommended.includes(normalizedKey) || normalizedKey.includes(normalizedRecommended)) {
              return true;
            }
            if (vars.some(v => normalizedRecommended.includes(normalizeSkill(v)) || normalizeSkill(v) === normalizedRecommended)) {
              return true;
            }
          }
        }
        
        // 5. Check for partial word matches (at least 4 chars to avoid false positives)
        if (normalizedRecommended.length >= 4 && normalizedUser.length >= 4) {
          if (normalizedUser.includes(normalizedRecommended) || normalizedRecommended.includes(normalizedUser)) {
            return true;
          }
        }
        
        return false;
      });
    };
    
    // Analyze recommended skills by category
    const recommendedSkillsList: string[] = [];
    recommendations.recommendations.forEach(rec => {
      rec.recommended_skills?.forEach(skill => {
        recommendedSkillsList.push(skill);
        const skillLower = skill.toLowerCase();
        
        // Determine category based on skill keywords
        let category = 'Other';
        if (skillLower.includes('react') || skillLower.includes('vue') || skillLower.includes('angular') || 
            skillLower.includes('html') || skillLower.includes('css') || skillLower.includes('frontend')) {
          category = 'Frontend';
        } else if (skillLower.includes('node') || skillLower.includes('python') || skillLower.includes('java') || 
                   skillLower.includes('backend') || skillLower.includes('api') || skillLower.includes('server')) {
          category = 'Backend';
        } else if (skillLower.includes('sql') || skillLower.includes('database') || skillLower.includes('mongodb') || 
                   skillLower.includes('postgres') || skillLower.includes('redis')) {
          category = 'Database';
        } else if (skillLower.includes('docker') || skillLower.includes('kubernetes') || skillLower.includes('ci/cd') || 
                   skillLower.includes('devops') || skillLower.includes('aws') || skillLower.includes('cloud')) {
          category = 'DevOps';
        } else if (skillLower.includes('test') || skillLower.includes('qa') || skillLower.includes('junit')) {
          category = 'Testing';
        } else if (skillLower.includes('ml') || skillLower.includes('ai') || skillLower.includes('data science') || 
                   skillLower.includes('tensorflow') || skillLower.includes('pytorch')) {
          category = 'AI/ML';
        }
        
        if (!skillCategoryData[category]) {
          skillCategoryData[category] = { hasSkill: 0, needsSkill: 0 };
        }
        
        const matched = hasSkill(skill);
        console.log(`${matched ? '✅' : '❌'} Skill: "${skill}" (Category: ${category}) - Matched: ${matched}`);
        
        if (matched) {
          skillCategoryData[category].hasSkill++;
        } else {
          skillCategoryData[category].needsSkill++;
        }
      });
    });
    
    // Debug: Log summary
    console.log('🎯 Total Recommended Skills:', recommendedSkillsList.length);
    console.log('📋 Unique Recommended Skills:', [...new Set(recommendedSkillsList)]);

    const skillHeatmapData = Object.entries(skillCategoryData)
      .map(([category, data]) => ({
        category,
        hasSkill: data.hasSkill,
        needsSkill: data.needsSkill,
        total: data.hasSkill + data.needsSkill,
        proficiency: data.hasSkill + data.needsSkill > 0 
          ? Math.round((data.hasSkill / (data.hasSkill + data.needsSkill)) * 100) 
          : 0
      }))
      .sort((a, b) => b.total - a.total);

    return { 
      matchData, 
      topSkillGaps, 
      scoreDistribution, 
      radarData, 
      skillsGapStackedData,
      learningPriorityData,
      progressionTrendData,
      experienceTimelineData,
      skillHeatmapData
    };
  };

  const chartData = getChartData();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Dashboard
        </button>

        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Career Recommendations</h1>
              {cvDetail && (
                <p className="text-gray-600 mt-1">Based on {cvDetail.cv.filename}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {recommendations && (
                <>
                  <button
                    onClick={handleExportPDF}
                    disabled={exporting}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="Export as PDF"
                  >
                    <Download className="w-4 h-4" />
                    <span className="hidden sm:inline">PDF</span>
                  </button>
                  <button
                    onClick={handlePrint}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    title="Print"
                  >
                    <Printer className="w-4 h-4" />
                    <span className="hidden sm:inline">Print</span>
                  </button>
                  <button
                    onClick={handleGenerateShareLink}
                    disabled={exporting}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="Share"
                  >
                    <Share2 className="w-4 h-4" />
                    <span className="hidden sm:inline">Share</span>
                  </button>
                </>
              )}
              <TrendingUp className="w-12 h-12 text-indigo-600" />
            </div>
          </div>

          {!recommendations && (
            <div className="mt-6 bg-indigo-50 border border-indigo-200 rounded-lg p-4">
              <p className="text-gray-700 mb-4">
                Generate personalized career pathway recommendations based on your CV analysis.
              </p>
              <div className="flex items-center gap-4 mb-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useAI}
                    onChange={(e) => setUseAI(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-700 flex items-center gap-1">
                    <Sparkles className="w-4 h-4" />
                    Use AI Enhancement (requires API key)
                  </span>
                </label>
              </div>
              <button
                onClick={handleGenerateRecommendations}
                disabled={generating}
                className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {generating ? 'Generating...' : 'Generate Recommendations'}
              </button>
            </div>
          )}

          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}
        </div>

        {/* Feature Navigation Menu */}
        {recommendations && (
          <div className="bg-white rounded-lg shadow-md p-4 mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Quick Actions</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <button
                onClick={() => navigate(`/cv/${cvId}/roadmap`)}
                className="flex items-center gap-2 p-3 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg hover:from-blue-100 hover:to-blue-200 transition-colors"
              >
                <Map className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium text-gray-900">Learning Roadmap</span>
              </button>
              
              <button
                onClick={() => navigate(`/cv/${cvId}/progress`)}
                className="flex items-center gap-2 p-3 bg-gradient-to-br from-green-50 to-green-100 rounded-lg hover:from-green-100 hover:to-green-200 transition-colors"
              >
                <Activity className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium text-gray-900">Progress Tracker</span>
              </button>
              
              <button
                onClick={() => navigate(`/cv/${cvId}/analytics`)}
                className="flex items-center gap-2 p-3 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg hover:from-purple-100 hover:to-purple-200 transition-colors"
              >
                <AnalyticsIcon className="w-5 h-5 text-purple-600" />
                <span className="text-sm font-medium text-gray-900">Analytics</span>
              </button>
              
              <button
                onClick={() => alert('CV Comparison feature - Upload multiple CVs to track your progress over time.')}
                className="flex items-center gap-2 p-3 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg hover:from-orange-100 hover:to-orange-200 transition-colors"
              >
                <GitCompare className="w-5 h-5 text-orange-600" />
                <span className="text-sm font-medium text-gray-900">Compare CVs</span>
              </button>
            </div>
          </div>
        )}

        {/* Analytics Dashboard */}
        {recommendations && chartData && (
          <div className="space-y-6 mb-8">
            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg shadow-lg p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-indigo-100 text-sm font-medium">Total Matches</p>
                    <p className="text-3xl font-bold mt-2">{recommendations.recommendations.length}</p>
                  </div>
                  <TrendingUp className="w-12 h-12 text-indigo-200" />
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm font-medium">Top Match Score</p>
                    <p className="text-3xl font-bold mt-2">
                      {recommendations.recommendations.length > 0 
                        ? Math.round(Math.max(...recommendations.recommendations.map(r => r.match_score)) * 100)
                        : 0}%
                    </p>
                  </div>
                  <Award className="w-12 h-12 text-green-200" />
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm font-medium">Skills Identified</p>
                    <p className="text-3xl font-bold mt-2">{recommendations.total_skills}</p>
                  </div>
                  <BookOpen className="w-12 h-12 text-purple-200" />
                </div>
              </div>

              <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg shadow-lg p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100 text-sm font-medium">Skills to Learn</p>
                    <p className="text-3xl font-bold mt-2">{chartData.topSkillGaps.length}</p>
                  </div>
                  <Target className="w-12 h-12 text-orange-200" />
                </div>
              </div>
            </div>

            {/* Analysis Summary */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <BarChart3 className="w-6 h-6 text-indigo-600" />
                Career Path Analysis Summary
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                    Strengths
                  </h3>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <ul className="space-y-2 text-sm text-gray-700">
                      <li className="flex items-start gap-2">
                        <span className="text-green-600 font-bold">•</span>
                        <span>
                          You have <strong>{recommendations.total_skills} skills</strong> identified from your CV
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-600 font-bold">•</span>
                        <span>
                          <strong>{chartData.scoreDistribution.find(s => s.name.includes('Excellent'))?.value || 0} career paths</strong> show excellent match (70%+)
                        </span>
                      </li>
                      {recommendations.recommendations.length > 0 && (
                        <li className="flex items-start gap-2">
                          <span className="text-green-600 font-bold">•</span>
                          <span>
                            Top career match: <strong>{recommendations.recommendations[0]?.pathway}</strong> at{' '}
                            <strong>{Math.round(recommendations.recommendations[0]?.match_score * 100)}%</strong>
                          </span>
                        </li>
                      )}
                    </ul>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                    <TrendingDown className="w-5 h-5 text-orange-600" />
                    Growth Opportunities
                  </h3>
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <ul className="space-y-2 text-sm text-gray-700">
                      <li className="flex items-start gap-2">
                        <span className="text-orange-600 font-bold">•</span>
                        <span>
                          <strong>{chartData.topSkillGaps.length} key skills</strong> recommended across all paths
                        </span>
                      </li>
                      {chartData.topSkillGaps.length > 0 && (
                        <li className="flex items-start gap-2">
                          <span className="text-orange-600 font-bold">•</span>
                          <span>
                            Focus on learning: <strong>{chartData.topSkillGaps.slice(0, 3).map(s => s.skill).join(', ')}</strong>
                          </span>
                        </li>
                      )}
                      <li className="flex items-start gap-2">
                        <span className="text-orange-600 font-bold">•</span>
                        <span>
                          Consider upskilling to increase match scores in{' '}
                          <strong>{chartData.scoreDistribution.find(s => s.name.includes('Good'))?.value || 0} good-fit paths</strong>
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Charts Grid */}
            {recommendations.recommendations.length > 0 ? (
            <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Career Match Distribution */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <PieChartIcon className="w-5 h-5 text-indigo-600" />
                  Career Match Distribution
                  <InfoTooltip 
                    title="Career Match Distribution" 
                    description="This chart shows how your skills match each recommended career path. Each slice represents a career path with its match percentage. Higher percentages indicate stronger alignment between your current skills and the career requirements." 
                  />
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={chartData.matchData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }: { name?: string; value?: number }) => {
                        // Only show label if value is significant
                        if (value && value >= 5) {
                          return `${name}: ${value}%`;
                        }
                        return '';
                      }}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {chartData.matchData.map((_entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value) => `${value}%`}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-white p-2 border border-gray-200 rounded shadow-lg">
                              <p className="font-semibold">{payload[0].name}</p>
                              <p className="text-sm text-gray-600">Match: {payload[0].value}%</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <p className="text-sm text-gray-600 mt-4 text-center">
                  Match scores for {chartData.matchData.length} recommended career paths
                </p>
              </div>

              {/* Score Distribution */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Award className="w-5 h-5 text-green-600" />
                  Match Quality Distribution
                  <InfoTooltip 
                    title="Match Quality Distribution" 
                    description="This chart categorizes all career paths by match quality: Excellent (70%+), Good (50-69%), and Fair (<50%). It helps you quickly identify how many strong, moderate, and lower matches you have. Focus on Excellent and Good matches for the best career transition opportunities." 
                  />
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={chartData.scoreDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name?.split(' ')[0] || 'Unknown'}: ${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {chartData.scoreDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
                <p className="text-sm text-gray-600 mt-4 text-center">
                  Distribution of career paths by match quality
                </p>
              </div>

              {/* Top Skills to Learn */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Target className="w-5 h-5 text-orange-600" />
                  Top Skills to Learn
                  <InfoTooltip 
                    title="Top Skills to Learn" 
                    description="This bar chart displays the most frequently recommended skills across all your career matches. The 'Importance %' shows how many of your recommended paths require each skill. Skills appearing more frequently across multiple paths should be prioritized in your learning plan." 
                  />
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData.topSkillGaps} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="skill" type="category" width={100} />
                    <Tooltip />
                    <Bar dataKey="importance" fill="#f59e0b" name="Importance %" />
                  </BarChart>
                </ResponsiveContainer>
                <p className="text-sm text-gray-600 mt-4 text-center">
                  Most recommended skills across all career paths
                </p>
              </div>

              {/* Radar Chart for Top Matches */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                  Top 5 Career Matches
                  <InfoTooltip 
                    title="Top 5 Career Matches Radar" 
                    description="This radar chart visualizes your top 5 career path matches in a comparative view. Each axis represents a different career path, and the filled area shows match scores. Paths closer to the outer edge have higher match scores. Use this to compare your strongest options at a glance." 
                  />
                </h3>
                {chartData.radarData && chartData.radarData.length >= 3 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <RadarChart data={chartData.radarData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12 }} />
                      <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10 }} />
                      <Radar name="Match Score" dataKey="matchScore" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.6} />
                      <Tooltip 
                        content={({ payload }) => {
                          if (payload && payload.length > 0) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-white p-2 border border-gray-200 rounded shadow-lg">
                                <p className="font-semibold">{data.fullName}</p>
                                <p className="text-sm text-gray-600">Match: {data.matchScore}%</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center bg-gray-50 rounded-lg">
                    <div className="text-center text-gray-500">
                      <p className="text-sm">Need at least 3 career recommendations</p>
                      <p className="text-xs mt-1">to display radar comparison</p>
                    </div>
                  </div>
                )}
                <p className="text-sm text-gray-600 mt-4 text-center">
                  {chartData.radarData && chartData.radarData.length >= 3 
                    ? 'Comparison of match scores for your top career paths'
                    : 'Generate more recommendations to see comparison chart'}
                </p>
              </div>
            </div>

            {/* NEW: Advanced Analytics Section */}
            <div className="mt-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <Layers className="w-6 h-6 text-indigo-600" />
                  Advanced Career Analytics
                </h2>

                {/* Skills Gap Analysis - Stacked Bar */}
                <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Layers className="w-5 h-5 text-teal-600" />
                    Skills Gap Analysis
                    <InfoTooltip 
                      title="Skills Gap Analysis" 
                      description="This chart shows what percentage of skills you already have (green) versus what you need to learn (red) for each career path. Larger green bars mean you're more prepared for that role. Use this to identify which paths require the least additional learning." 
                    />
                  </h3>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart 
                      data={chartData.skillsGapStackedData} 
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 120, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" domain={[0, 100]} />
                      <YAxis dataKey="pathway" type="category" width={110} tick={{ fontSize: 12 }} />
                      <Tooltip 
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-white p-3 border border-gray-200 rounded shadow-lg">
                                <p className="font-semibold">{data.fullName}</p>
                                <p className="text-sm text-green-600">✓ Skills You Have: {data.hasSkills}%</p>
                                <p className="text-sm text-red-600">✗ Skills to Learn: {data.needsSkills}%</p>
                                <p className="text-sm text-gray-600 mt-1">Overall Match: {data.matchScore}%</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Legend />
                      <Bar dataKey="hasSkills" stackId="a" fill="#10b981" name="Skills You Have" />
                      <Bar dataKey="needsSkills" stackId="a" fill="#ef4444" name="Skills to Learn" />
                    </BarChart>
                  </ResponsiveContainer>
                  <p className="text-sm text-gray-600 mt-4 text-center">
                    Green shows your current skills, red shows what you need to learn for each path
                  </p>
                </div>

                {/* Two-column grid for Learning Priority and Career Progression */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  {/* Learning Priority Matrix - Scatter Plot */}
                  <div className="bg-white rounded-lg shadow-lg p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <Zap className="w-5 h-5 text-yellow-600" />
                      Learning Priority Matrix
                      <InfoTooltip 
                        title="Learning Priority Matrix" 
                        description="This scatter plot helps you prioritize which skills to learn first. The Y-axis shows impact (how many career paths need it), and the X-axis shows estimated difficulty. Bubble size indicates frequency. Focus on skills in the top-left (high impact, easier to learn) for maximum career advancement." 
                      />
                    </h3>
                    <ResponsiveContainer width="100%" height={350}>
                      <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                        <CartesianGrid />
                        <XAxis 
                          type="number" 
                          dataKey="difficulty" 
                          name="Difficulty" 
                          domain={[0, 100]}
                          label={{ value: 'Difficulty →', position: 'bottom', offset: 0 }}
                        />
                        <YAxis 
                          type="number" 
                          dataKey="impact" 
                          name="Impact" 
                          domain={[0, 100]}
                          label={{ value: 'Impact →', angle: -90, position: 'insideLeft' }}
                        />
                        <ZAxis type="number" dataKey="size" range={[50, 400]} />
                        <Tooltip 
                          cursor={{ strokeDasharray: '3 3' }}
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              return (
                                <div className="bg-white p-3 border border-gray-200 rounded shadow-lg">
                                  <p className="font-semibold">{data.skill}</p>
                                  <p className="text-sm text-gray-600">Impact: {Math.round(data.impact)}%</p>
                                  <p className="text-sm text-gray-600">Difficulty: {data.difficulty > 50 ? 'High' : 'Medium'}</p>
                                  <p className="text-xs text-gray-500 mt-1">Required in {Math.round(data.impact/100 * recommendations.recommendations.length)} paths</p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Scatter 
                          name="Skills" 
                          data={chartData.learningPriorityData}
                          shape={(props: any) => {
                            const { cx, cy, payload } = props;
                            return (
                              <circle 
                                cx={cx} 
                                cy={cy} 
                                r={Math.sqrt(payload.size) * 2} 
                                fill={payload.color}
                                opacity={0.7}
                                stroke={payload.color}
                                strokeWidth={2}
                              />
                            );
                          }}
                        />
                      </ScatterChart>
                    </ResponsiveContainer>
                    <div className="mt-4 text-xs text-gray-600 space-y-2">
                      <p className="font-semibold mb-2">Priority Legend:</p>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-green-500"></div>
                          <span>🟢 High Priority (High Impact, Easier)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                          <span>🟠 Medium-High (High Impact, Harder)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                          <span>🔵 Medium (Lower Impact, Easier)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-red-500"></div>
                          <span>🔴 Low Priority (Lower Impact, Harder)</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Career Progression Metrics - Line Chart */}
                  <div className="bg-white rounded-lg shadow-lg p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <TrendIcon className="w-5 h-5 text-blue-600" />
                      Career Fit Factors
                      <InfoTooltip 
                        title="Career Fit Factors" 
                        description="This chart compares multiple factors for your top career matches: overall match score (blue), career progression alignment (green), experience recency (orange), and relevant experience (purple). Higher lines indicate better fit. Use this to understand which roles align best with your career trajectory." 
                      />
                    </h3>
                    <ResponsiveContainer width="100%" height={350}>
                      <RechartsLineChart data={chartData.progressionTrendData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="pathway" 
                          tick={{ fontSize: 10 }}
                          angle={-15}
                          textAnchor="end"
                          height={80}
                        />
                        <YAxis domain={[0, 100]} label={{ value: 'Score %', angle: -90, position: 'insideLeft' }} />
                        <Tooltip 
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              return (
                                <div className="bg-white p-3 border border-gray-200 rounded shadow-lg">
                                  <p className="font-semibold mb-2">{data.fullName}</p>
                                  <div className="space-y-1 text-sm">
                                    <p className="text-blue-600">Match Score: {data.matchScore}%</p>
                                    <p className="text-green-600">Career Growth: {data.careerProgression}%</p>
                                    <p className="text-orange-600">Recency: {data.recency}%</p>
                                    <p className="text-purple-600">Experience: {data.experience}%</p>
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Legend />
                        <Line type="monotone" dataKey="matchScore" stroke="#3b82f6" name="Match Score" strokeWidth={2} />
                        <Line type="monotone" dataKey="careerProgression" stroke="#10b981" name="Career Growth" strokeWidth={2} />
                        <Line type="monotone" dataKey="recency" stroke="#f59e0b" name="Recency" strokeWidth={2} />
                        <Line type="monotone" dataKey="experience" stroke="#8b5cf6" name="Experience" strokeWidth={2} />
                      </RechartsLineChart>
                    </ResponsiveContainer>
                    <p className="text-sm text-gray-600 mt-4 text-center">
                      Compare multiple fit factors across your top career matches
                    </p>
                  </div>
                </div>
              </div>

              {/* Experience Timeline Visualization */}
              {chartData.experienceTimelineData && chartData.experienceTimelineData.length > 0 && (
                <div className="bg-white rounded-lg shadow-lg p-6 mt-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-indigo-600" />
                    Career Journey Timeline
                    <InfoTooltip 
                      title="Career Journey Timeline" 
                      description="This bar chart visualizes your career progression over time. Each bar represents a role you've held, showing when you started, how long you stayed, and your seniority level. The color indicates seniority (blue=junior, purple=mid, pink=senior). Use this to see your career trajectory and identify patterns in your professional growth." 
                    />
                  </h3>
                  <ResponsiveContainer width="100%" height={Math.max(300, chartData.experienceTimelineData.length * 60)}>
                    <BarChart 
                      data={chartData.experienceTimelineData} 
                      layout="vertical"
                      margin={{ top: 20, right: 30, left: 150, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        type="number" 
                        dataKey="startYear"
                        domain={['dataMin - 1', 'dataMax + 1']}
                        label={{ value: 'Year', position: 'bottom', offset: 0 }}
                      />
                      <YAxis 
                        dataKey="job_title" 
                        type="category" 
                        width={140}
                        tick={{ fontSize: 11 }}
                      />
                      <Tooltip 
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-white p-3 border border-gray-200 rounded shadow-lg max-w-xs">
                                <p className="font-semibold text-sm">{data.job_title}</p>
                                <p className="text-xs text-gray-600">{data.company}</p>
                                <div className="mt-2 space-y-1 text-xs">
                                  <p className="text-gray-700">
                                    📅 {data.startYear} - {data.isCurrent ? 'Present' : data.endYear}
                                  </p>
                                  <p className="text-gray-700">
                                    ⏱️ Duration: {data.duration >= 1 ? `${Math.round(data.duration)} years` : `${Math.round(data.duration * 12)} months`}
                                  </p>
                                  <p className="text-gray-700">
                                    📊 Level: {data.seniority}
                                  </p>
                                  {data.technologies && (
                                    <p className="text-gray-600 mt-2">
                                      💻 {data.technologies.substring(0, 100)}{data.technologies.length > 100 ? '...' : ''}
                                    </p>
                                  )}
                                </div>
                                {data.isCurrent && (
                                  <span className="inline-block mt-2 px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                                    Current Role
                                  </span>
                                )}
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar 
                        dataKey="duration" 
                        fill="#6366f1"
                        radius={[0, 8, 8, 0]}
                      >
                        {chartData.experienceTimelineData.map((entry: any, index: number) => {
                          let fill = '#6366f1'; // Default blue
                          if (entry.seniority?.toLowerCase().includes('senior') || entry.seniority?.toLowerCase().includes('lead')) {
                            fill = '#ec4899'; // Pink for senior
                          } else if (entry.seniority?.toLowerCase().includes('junior') || entry.seniority?.toLowerCase().includes('entry')) {
                            fill = '#3b82f6'; // Light blue for junior
                          } else if (entry.seniority?.toLowerCase().includes('mid')) {
                            fill = '#8b5cf6'; // Purple for mid
                          }
                          return <Cell key={`cell-${index}`} fill={fill} />;
                        })}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="mt-4 flex items-center justify-center gap-4 text-xs text-gray-600">
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded bg-blue-500"></div>
                      <span>Junior</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded bg-purple-600"></div>
                      <span>Mid-Level</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded bg-pink-600"></div>
                      <span>Senior</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mt-2 text-center">
                    Your professional experience over time - hover for details
                  </p>
                </div>
              )}

              {/* Skill Category Proficiency Heatmap */}
              {chartData.skillHeatmapData && chartData.skillHeatmapData.length > 0 && (
                <div className="bg-white rounded-lg shadow-lg p-6 mt-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Target className="w-5 h-5 text-emerald-600" />
                    Skill Category Proficiency
                    <InfoTooltip 
                      title="Skill Category Proficiency" 
                      description="This chart shows your proficiency across different technology categories. Green bars indicate skills you already have, while red bars show skills you need to learn. The proficiency percentage shows how well-equipped you are in each category. Focus on categories with lower proficiency to maximize your career opportunities." 
                    />
                  </h3>
                  <ResponsiveContainer width="100%" height={Math.max(300, chartData.skillHeatmapData.length * 70)}>
                    <BarChart 
                      data={chartData.skillHeatmapData} 
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="category" type="category" width={90} tick={{ fontSize: 12 }} />
                      <Tooltip 
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-white p-3 border border-gray-200 rounded shadow-lg">
                                <p className="font-semibold mb-2">{data.category}</p>
                                <div className="space-y-1 text-sm">
                                  <p className="text-green-600">✓ Skills You Have: {data.hasSkill}</p>
                                  <p className="text-red-600">✗ Skills to Learn: {data.needsSkill}</p>
                                  <p className="text-gray-700">📊 Total Required: {data.total}</p>
                                  <p className="text-indigo-600 font-semibold mt-2">
                                    Proficiency: {data.proficiency}%
                                  </p>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Legend />
                      <Bar dataKey="hasSkill" stackId="a" fill="#10b981" name="Skills You Have" />
                      <Bar dataKey="needsSkill" stackId="a" fill="#ef4444" name="Skills to Learn" />
                    </BarChart>
                  </ResponsiveContainer>
                  
                  {/* Category Proficiency Grid */}
                  <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-3">
                    {chartData.skillHeatmapData.map((item, index) => (
                      <div key={index} className="border rounded-lg p-3 bg-gray-50">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-sm text-gray-900">{item.category}</span>
                          <span className="text-xs font-bold text-indigo-600">{item.proficiency}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="h-2 rounded-full transition-all"
                            style={{ 
                              width: `${item.proficiency}%`,
                              backgroundColor: item.proficiency >= 70 ? '#10b981' : item.proficiency >= 40 ? '#f59e0b' : '#ef4444'
                            }}
                          />
                        </div>
                        <div className="mt-2 flex items-center justify-between text-xs text-gray-600">
                          <span>✓ {item.hasSkill}</span>
                          <span>✗ {item.needsSkill}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <p className="text-sm text-gray-600 mt-4 text-center">
                    Your skill distribution across technology categories
                  </p>
                </div>
              )}
            </>
            ) : (
              <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-8 text-center">
                <div className="text-yellow-600 text-6xl mb-4">📊</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No Career Recommendations Yet</h3>
                <p className="text-gray-600 mb-4">
                  Click "Generate Recommendations" above to analyze your CV and get personalized career pathway suggestions.
                </p>
                <p className="text-sm text-gray-500">
                  Make sure your CV has been uploaded and contains relevant skills and work experience.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Recommendations List */}
        {recommendations && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Detailed Career Recommendations</h2>
              <button
                onClick={handleGenerateRecommendations}
                disabled={generating}
                className="text-indigo-600 hover:text-indigo-700 font-medium text-sm"
              >
                {generating ? 'Regenerating...' : 'Regenerate'}
              </button>
            </div>

            {recommendations.recommendations.length === 0 && (
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <Target className="w-5 h-5 text-blue-600" />
                  No Strong Matches Found
                </h3>
                <div className="space-y-3 text-gray-700">
                  <p>
                    We couldn't find career paths with strong matches based on your current skills. 
                    This might be because:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Your CV may contain general/soft skills that don't match specific technical career paths</li>
                    <li>The skills detected might need more technical keywords</li>
                    <li>You might be in a unique role that combines multiple pathways</li>
                  </ul>
                  <div className="mt-4 p-4 bg-white rounded border border-blue-200">
                    <p className="font-semibold text-gray-900 mb-2">💡 Suggestions:</p>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li>Add more technical skills to your CV (programming languages, frameworks, tools)</li>
                      <li>Include specific technologies you've worked with in your job descriptions</li>
                      <li>Try uploading a different version of your CV with more detailed technical content</li>
                      <li>Add work experience with technology-specific keywords</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {recommendations.recommendations.map((rec, index) => {
              // Debug: Log recommendation data
              if (index === 0) console.log('🎯 First Recommendation Object:', rec);
              return (
              <div key={index} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h3 className="text-xl font-bold text-gray-900">{rec.pathway}</h3>
                      {rec.is_ai_enhanced && (
                        <span className="flex items-center gap-1 bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs font-medium">
                          <Sparkles className="w-3 h-3" />
                          AI Enhanced
                        </span>
                      )}
                      {rec.career_progression_score && rec.career_progression_score >= 0.7 && (
                        <span className="flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium" title="Strong career progression detected">
                          <LineChart className="w-3 h-3" />
                          Growing Career
                        </span>
                      )}
                      {rec.recency_boost && rec.recency_boost >= 0.8 && (
                        <span className="flex items-center gap-1 bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-medium" title="Recent relevant experience">
                          <Clock className="w-3 h-3" />
                          Fresh Experience
                        </span>
                      )}
                      {rec.company_context_match && rec.company_context_match >= 0.7 && (
                        <span className="flex items-center gap-1 bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full text-xs font-medium" title="Strong company background match">
                          <Building2 className="w-3 h-3" />
                          Relevant Background
                        </span>
                      )}
                    </div>
                    {rec.description && rec.description.trim() && rec.description !== '000' && rec.description !== '0' && (
                      <p className="text-gray-600">{rec.description}</p>
                    )}
                  </div>
                  <div className={`flex flex-col items-center ${getScoreBgColor(rec.match_score)} rounded-lg p-3`}>
                    <span className={`text-2xl font-bold ${getScoreColor(rec.match_score)}`}>
                      {Math.round(rec.match_score * 100)}%
                    </span>
                    <span className="text-xs text-gray-600 mt-1">Match</span>
                  </div>
                </div>

                {rec.reasoning && (
                  <div className="mb-4 bg-gray-50 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <Target className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 mb-1">Why this path?</h4>
                        <p className="text-gray-700 text-sm">{rec.reasoning}</p>
                        
                        {/* Work Experience Impact Indicator */}
                        {rec.experience_relevance && rec.experience_relevance > 0 && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-600 flex items-center gap-1">
                                <Briefcase className="w-4 h-4 text-purple-600" />
                                Work Experience Relevance
                              </span>
                              <div className="flex items-center gap-2">
                                <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-gradient-to-r from-purple-500 to-purple-600 rounded-full"
                                    style={{ width: `${Math.round(rec.experience_relevance * 100)}%` }}
                                  ></div>
                                </div>
                                <span className="text-xs font-semibold text-purple-600">
                                  {Math.round(rec.experience_relevance * 100)}%
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {rec.recommended_skills && rec.recommended_skills.length > 0 && (
                  <div className="mb-4">
                    <div className="flex items-start gap-2">
                      <BookOpen className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Skills to learn:</h4>
                        <div className="flex flex-wrap gap-2">
                          {rec.recommended_skills.slice(0, 8).map((skill, idx) => (
                            <span
                              key={idx}
                              className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm"
                            >
                              {skill}
                            </span>
                          ))}
                          {rec.recommended_skills.length > 8 && (
                            <span className="text-gray-500 text-sm px-3 py-1">
                              +{rec.recommended_skills.length - 8} more
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Roadmap Links */}
                <div className="flex flex-wrap gap-4">
                  {/* Personalized Learning Roadmap */}
                  <button
                    onClick={() => navigate(`/cv/${cvId}/roadmap?pathway=${encodeURIComponent(rec.pathway)}`)}
                    className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 font-medium transition-colors"
                  >
                    <Map className="w-4 h-4" />
                    View Your Learning Roadmap
                  </button>

                  {/* External roadmap.sh Link */}
                  {(() => {
                    const roadmapUrl = rec.roadmap_url || getRoadmapUrl(rec.pathway);
                    return roadmapUrl ? (
                      <a
                        href={roadmapUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium transition-colors px-4 py-2 border border-indigo-300 rounded-lg hover:bg-indigo-50"
                      >
                        <BookOpen className="w-4 h-4" />
                        roadmap.sh Guide
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    ) : null;
                  })()}
                </div>

                {rec.ai_insight && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-purple-600" />
                      AI Insights
                    </h4>
                    <div className="text-sm text-gray-700 space-y-2">
                      {rec.ai_insight.profile_analysis && (
                        <p><strong>Profile:</strong> {rec.ai_insight.profile_analysis}</p>
                      )}
                      {rec.ai_insight.development_focus && (
                        <p><strong>Focus:</strong> {rec.ai_insight.development_focus}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
              );
            })}
          </div>
        )}

        {/* Share Modal */}
        {showShareModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">Share Your Recommendations</h3>
                <button
                  onClick={() => setShowShareModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="text-2xl">&times;</span>
                </button>
              </div>
              
              <p className="text-gray-600 mb-4">
                Share this link with anyone to let them view your career recommendations. The link will be active for 30 days.
              </p>

              <div className="bg-gray-50 rounded-lg p-4 mb-4 break-all">
                <code className="text-sm text-gray-800">{shareLink}</code>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleCopyLink}
                  className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  {linkCopied ? (
                    <>
                      <Check className="w-4 h-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy Link
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowShareModal(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Recommendations;


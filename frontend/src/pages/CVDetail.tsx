import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { cvAPI } from '../services/api';
import { ArrowLeft, FileText, Briefcase, GraduationCap, TrendingUp, PieChart as PieChartIcon, Calendar, MapPin, Clock } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { CVDetail as CVDetailType, Skill } from '../types';

const CVDetail: React.FC = () => {
  const { cvId } = useParams<{ cvId: string }>();
  const navigate = useNavigate();
  const [cvDetail, setCvDetail] = useState<CVDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (cvId) {
      loadCVDetail(parseInt(cvId));
    }
  }, [cvId]);

  const loadCVDetail = async (id: number) => {
    try {
      const data = await cvAPI.getDetail(id);
      setCvDetail(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load CV details');
    } finally {
      setLoading(false);
    }
  };

  const groupSkillsByCategory = (skills: Skill[]) => {
    const grouped: Record<string, Skill[]> = {};
    skills.forEach(skill => {
      const category = skill.skill_category || 'Other';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(skill);
    });
    return grouped;
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      frontend: 'bg-blue-100 text-blue-800',
      backend: 'bg-green-100 text-green-800',
      devops: 'bg-purple-100 text-purple-800',
      data: 'bg-orange-100 text-orange-800',
      mobile: 'bg-pink-100 text-pink-800',
      general: 'bg-gray-100 text-gray-800',
    };
    return colors[category.toLowerCase()] || 'bg-gray-100 text-gray-800';
  };

  const getCategoryChartColor = (category: string) => {
    const colors: Record<string, string> = {
      frontend: '#3b82f6',
      backend: '#10b981',
      devops: '#8b5cf6',
      data: '#f59e0b',
      mobile: '#ec4899',
      general: '#6b7280',
    };
    return colors[category.toLowerCase()] || '#6b7280';
  };

  const prepareChartData = (skills: Skill[]) => {
    const grouped = groupSkillsByCategory(skills);
    return Object.entries(grouped).map(([category, skillList]) => ({
      category: category.charAt(0).toUpperCase() + category.slice(1),
      count: skillList.length,
      fill: getCategoryChartColor(category),
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading CV details...</p>
        </div>
      </div>
    );
  }

  if (error || !cvDetail) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full text-center">
          <FileText className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Error Loading CV</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const groupedSkills = groupSkillsByCategory(cvDetail.skills);

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

        {/* CV Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <FileText className="w-12 h-12 text-indigo-600 flex-shrink-0" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{cvDetail.cv.filename}</h1>
                <p className="text-gray-600 mt-1">
                  Uploaded on {new Date(cvDetail.cv.upload_date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
                <div className="flex gap-4 mt-3">
                  {cvDetail.cv.years_experience && (
                    <div className="flex items-center gap-2 text-gray-700">
                      <Briefcase className="w-4 h-4" />
                      <span>{cvDetail.cv.years_experience} years experience</span>
                    </div>
                  )}
                  {cvDetail.cv.education_level && (
                    <div className="flex items-center gap-2 text-gray-700">
                      <GraduationCap className="w-4 h-4" />
                      <span>{cvDetail.cv.education_level}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={() => navigate(`/recommendations/${cvDetail.cv.id}`)}
              className="flex items-center gap-2 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              <TrendingUp className="w-5 h-5" />
              Get Recommendations
            </button>
          </div>
        </div>

        {/* Work Experience Section */}
        {cvDetail.work_experiences && cvDetail.work_experiences.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Briefcase className="w-6 h-6 text-indigo-600" />
              Work Experience ({cvDetail.work_experiences.length})
            </h2>
            
            {/* Experience Timeline */}
            <div className="space-y-6">
              {cvDetail.work_experiences.map((exp) => (
                <div key={exp.id} className="relative pl-8 pb-8 border-l-2 border-indigo-200 last:pb-0">
                  {/* Timeline dot */}
                  <div className="absolute left-0 top-0 -translate-x-1/2 w-4 h-4 rounded-full bg-indigo-600 border-4 border-white"></div>
                  
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900">{exp.job_title}</h3>
                        {exp.company_name && (
                          <div className="flex items-center gap-2 text-gray-700 mt-1">
                            <MapPin className="w-4 h-4" />
                            <span className="font-medium">{exp.company_name}</span>
                          </div>
                        )}
                      </div>
                      {exp.is_current && (
                        <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-semibold">
                          Current
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-600 mt-2 mb-3">
                      {(exp.start_date || exp.end_date) && (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>
                            {exp.start_date || 'N/A'} - {exp.is_current ? 'Present' : (exp.end_date || 'N/A')}
                          </span>
                        </div>
                      )}
                      {exp.duration_months && (
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>
                            {exp.duration_months >= 12
                              ? `${Math.floor(exp.duration_months / 12)} year${Math.floor(exp.duration_months / 12) > 1 ? 's' : ''} ${exp.duration_months % 12 > 0 ? `${exp.duration_months % 12} month${exp.duration_months % 12 > 1 ? 's' : ''}` : ''}`
                              : `${exp.duration_months} month${exp.duration_months > 1 ? 's' : ''}`
                            }
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {exp.description && (
                      <p className="text-gray-700 text-sm mb-3 whitespace-pre-line">{exp.description}</p>
                    )}
                    
                    {exp.technologies_used && (
                      <div className="flex flex-wrap gap-2">
                        {exp.technologies_used.split(',').map((tech, idx) => (
                          <span
                            key={idx}
                            className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded text-xs font-medium"
                          >
                            {tech.trim()}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Experience Summary */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-indigo-50 rounded-lg p-4 text-center">
                  <p className="text-indigo-600 text-2xl font-bold">
                    {cvDetail.work_experiences.length}
                  </p>
                  <p className="text-gray-600 text-sm mt-1">Total Positions</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <p className="text-green-600 text-2xl font-bold">
                    {(cvDetail.work_experiences.reduce((sum, exp) => sum + (exp.duration_months || 0), 0) / 12).toFixed(1)}
                  </p>
                  <p className="text-gray-600 text-sm mt-1">Years of Experience</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4 text-center">
                  <p className="text-purple-600 text-2xl font-bold">
                    {cvDetail.work_experiences.filter(exp => exp.is_current).length}
                  </p>
                  <p className="text-gray-600 text-sm mt-1">Current Role{cvDetail.work_experiences.filter(exp => exp.is_current).length !== 1 ? 's' : ''}</p>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* Skills Analytics */}
        {cvDetail.skills.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Skill Distribution Chart */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <PieChartIcon className="w-5 h-5 text-indigo-600" />
                Skill Distribution by Category
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={prepareChartData(cvDetail.skills)}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ category, count }) => `${category}: ${count}`}
                    outerRadius={100}
                    dataKey="count"
                  >
                    {prepareChartData(cvDetail.skills).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <p className="text-sm text-gray-600 mt-4 text-center">
                Total of {cvDetail.skills.length} skills across {Object.keys(groupSkillsByCategory(cvDetail.skills)).length} categories
              </p>
            </div>

            {/* Category Breakdown */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-green-600" />
                Skills by Category
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={prepareChartData(cvDetail.skills)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" name="Number of Skills">
                    {prepareChartData(cvDetail.skills).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <p className="text-sm text-gray-600 mt-4 text-center">
                Visual breakdown of your skill portfolio
              </p>
            </div>
          </div>
        )}

        {/* Skills Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Skills Detected ({cvDetail.skills.length})
          </h2>
          
          {Object.keys(groupedSkills).length === 0 ? (
            <p className="text-gray-600">No skills detected in this CV.</p>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedSkills).map(([category, skills]) => (
                <div key={category}>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3 capitalize">
                    {category} Skills ({skills.length})
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {skills.map((skill) => (
                      <div
                        key={skill.id}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium ${getCategoryColor(category)}`}
                      >
                        <span>{skill.skill_name}</span>
                        {skill.skill_level && (
                          <span className="ml-2 text-xs opacity-75">
                            ({skill.skill_level})
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CVDetail;


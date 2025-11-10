import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, BookOpen, Clock, CheckCircle, Circle, Target, Award, ExternalLink, TrendingUp } from 'lucide-react';
import axios from 'axios';

interface Phase {
  phase_number: number;
  name: string;
  description: string;
  skills: string[];
  estimated_weeks: number;
  priority: string;
}

interface Certification {
  name: string;
  provider: string;
  cost: string;
  duration: string;
  url: string;
  skills: string[];
  difficulty: string;
  recommended_timing?: string;
}

interface Roadmap {
  pathway: string;
  description: string;
  current_progress: {
    skills_you_have: number;
    required_skills_remaining: number;
    optional_skills_remaining: number;
    completion_percentage: number;
  };
  phases: Phase[];
  timeline: {
    total_weeks: number;
    total_months: number;
    start_date: string;
    estimated_completion: string;
    hours_per_week_recommended: number;
  };
  certifications: Certification[];
  resources: {
    free_courses: Array<{name: string; url: string; description: string}>;
    paid_platforms: Array<{name: string; url: string; description: string}>;
    practice_platforms: Array<{name: string; url: string; description: string}>;
    documentation: Array<{name: string; url: string; description: string}>;
  };
  milestones: Array<{name: string; description: string; estimated_date: string; skills_count: number; priority: string}>;
  estimated_time_to_proficiency: number;
}

const LearningRoadmap: React.FC = () => {
  const { cvId } = useParams<{ cvId: string }>();
  const [searchParams] = useSearchParams();
  const pathway = searchParams.get('pathway') || '';
  const navigate = useNavigate();
  
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [completedSkills, setCompletedSkills] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (cvId && pathway) {
      fetchRoadmap();
    } else if (cvId) {
      // No pathway provided, stop loading and show selector
      setLoading(false);
    }
  }, [cvId, pathway]);

  const fetchRoadmap = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await axios.get(
        `http://localhost:8000/api/v1/roadmap/${cvId}/pathway/${encodeURIComponent(pathway)}`
      );
      setRoadmap(response.data);
    } catch (err: any) {
      console.error('Roadmap error:', err);
      setError(err.response?.data?.detail || 'Failed to load roadmap');
    } finally {
      setLoading(false);
    }
  };

  const toggleSkillCompletion = (skill: string) => {
    setCompletedSkills(prev => {
      const newSet = new Set(prev);
      if (newSet.has(skill)) {
        newSet.delete(skill);
      } else {
        newSet.add(skill);
      }
      return newSet;
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your learning roadmap...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
          <div className="text-red-600 text-5xl mb-4 text-center">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">Error</h2>
          <p className="text-gray-600 text-center mb-6">{error}</p>
          <button
            onClick={() => navigate(`/cv/${cvId}/recommendations`)}
            className="w-full bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
          >
            Back to Recommendations
          </button>
        </div>
      </div>
    );
  }

  // Show pathway selector if no pathway provided
  if (!pathway) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => navigate(`/cv/${cvId}/recommendations`)}
            className="flex items-center text-indigo-600 hover:text-indigo-800 mb-6"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Recommendations
          </button>

          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-center mb-8">
              <div className="text-6xl mb-4">🗺️</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Select a Career Pathway</h2>
              <p className="text-gray-600">
                Choose a career pathway to view your personalized learning roadmap
              </p>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-gray-600 mb-4">
                To view a learning roadmap, please go back to your recommendations page and click on the
                "View Roadmap" button for any recommended career path.
              </p>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <TrendingUp className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">How to Access Roadmaps:</h4>
                    <ol className="text-sm text-gray-600 list-decimal list-inside space-y-1">
                      <li>Go back to your Recommendations page</li>
                      <li>Find a career pathway you're interested in</li>
                      <li>Click the "View Roadmap" button on that recommendation card</li>
                      <li>You'll see a personalized learning plan with skills, timeline, and resources</li>
                    </ol>
                  </div>
                </div>
              </div>

              <button
                onClick={() => navigate(`/cv/${cvId}/recommendations`)}
                className="w-full bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors font-semibold"
              >
                View Recommendations
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!roadmap) return null;

  const overallProgress = (completedSkills.size / roadmap.phases.reduce((sum, p) => sum + p.skills.length, 0)) * 100;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <button
          onClick={() => navigate(`/cv/${cvId}/recommendations`)}
          className="flex items-center text-indigo-600 hover:text-indigo-800 mb-6"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Recommendations
        </button>

        {/* Title Section */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg shadow-lg p-8 mb-8 text-white">
          <h1 className="text-3xl font-bold mb-2">{roadmap.pathway} Learning Roadmap</h1>
          <p className="text-indigo-100 mb-4">{roadmap.description}</p>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-white/10 rounded-lg p-4">
              <div className="text-indigo-200 text-sm">Skills You Have</div>
              <div className="text-2xl font-bold">{roadmap.current_progress.skills_you_have}</div>
            </div>
            <div className="bg-white/10 rounded-lg p-4">
              <div className="text-indigo-200 text-sm">To Learn</div>
              <div className="text-2xl font-bold">{roadmap.current_progress.required_skills_remaining}</div>
            </div>
            <div className="bg-white/10 rounded-lg p-4">
              <div className="text-indigo-200 text-sm">Est. Time</div>
              <div className="text-2xl font-bold">{roadmap.timeline.total_months}m</div>
            </div>
            <div className="bg-white/10 rounded-lg p-4">
              <div className="text-indigo-200 text-sm">Completion</div>
              <div className="text-2xl font-bold">{Math.round(roadmap.current_progress.completion_percentage)}%</div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Your Learning Progress</span>
            <span className="text-sm font-medium text-indigo-600">{Math.round(overallProgress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div
              className="bg-gradient-to-r from-indigo-600 to-purple-600 h-4 rounded-full transition-all duration-500"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
        </div>

        {/* Learning Phases */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-indigo-600" />
            Learning Phases
          </h2>

          <div className="space-y-6">
            {roadmap.phases.map((phase) => (
              <div key={phase.phase_number} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className={`p-6 border-l-4 ${
                  phase.priority === 'critical' ? 'border-red-500' :
                  phase.priority === 'high' ? 'border-orange-500' :
                  'border-yellow-500'
                }`}>
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="text-2xl font-bold text-gray-400">Phase {phase.phase_number}</span>
                        <h3 className="text-xl font-bold text-gray-900">{phase.name}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getPriorityColor(phase.priority)}`}>
                          {phase.priority.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-gray-600 mt-2">{phase.description}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-500">Estimated Time</div>
                      <div className="text-lg font-semibold text-indigo-600">{phase.estimated_weeks} weeks</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {phase.skills.map((skill, idx) => (
                      <button
                        key={idx}
                        onClick={() => toggleSkillCompletion(skill)}
                        className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                          completedSkills.has(skill)
                            ? 'bg-green-50 border-green-500 text-green-900'
                            : 'bg-gray-50 border-gray-200 text-gray-700 hover:border-indigo-300'
                        }`}
                      >
                        {completedSkills.has(skill) ? (
                          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                        ) : (
                          <Circle className="w-5 h-5 text-gray-400 flex-shrink-0" />
                        )}
                        <span className="text-sm font-medium">{skill}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Certifications */}
        {roadmap.certifications.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Award className="w-6 h-6 text-indigo-600" />
              Recommended Certifications
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {roadmap.certifications.map((cert, idx) => (
                <div key={idx} className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-gray-900">{cert.name}</h3>
                      <p className="text-sm text-gray-600">{cert.provider}</p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      cert.difficulty === 'Beginner' ? 'bg-green-100 text-green-800' :
                      cert.difficulty === 'Intermediate' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {cert.difficulty}
                    </span>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">Duration: {cert.duration}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <TrendingUp className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">Cost: {cert.cost}</span>
                    </div>
                    {cert.recommended_timing && (
                      <div className="text-sm text-indigo-600 font-medium">
                        ⏰ {cert.recommended_timing}
                      </div>
                    )}
                  </div>

                  <a
                    href={cert.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                  >
                    Learn More <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Learning Resources */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Target className="w-6 h-6 text-indigo-600" />
            Learning Resources
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Free Courses */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="text-green-600">Free</span> Courses
              </h3>
              <ul className="space-y-3">
                {roadmap.resources.free_courses.map((resource, idx) => (
                  <li key={idx}>
                    <a
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block hover:bg-gray-50 p-3 rounded-lg transition-colors"
                    >
                      <div className="font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-2">
                        {resource.name}
                        <ExternalLink className="w-4 h-4" />
                      </div>
                      <div className="text-sm text-gray-600">{resource.description}</div>
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Paid Platforms */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="text-orange-600">Paid</span> Platforms
              </h3>
              <ul className="space-y-3">
                {roadmap.resources.paid_platforms.map((resource, idx) => (
                  <li key={idx}>
                    <a
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block hover:bg-gray-50 p-3 rounded-lg transition-colors"
                    >
                      <div className="font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-2">
                        {resource.name}
                        <ExternalLink className="w-4 h-4" />
                      </div>
                      <div className="text-sm text-gray-600">{resource.description}</div>
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Practice Platforms */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="text-blue-600">Practice</span> Platforms
              </h3>
              <ul className="space-y-3">
                {roadmap.resources.practice_platforms.map((resource, idx) => (
                  <li key={idx}>
                    <a
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block hover:bg-gray-50 p-3 rounded-lg transition-colors"
                    >
                      <div className="font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-2">
                        {resource.name}
                        <ExternalLink className="w-4 h-4" />
                      </div>
                      <div className="text-sm text-gray-600">{resource.description}</div>
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Documentation */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="text-purple-600">Documentation</span>
              </h3>
              <ul className="space-y-3">
                {roadmap.resources.documentation.map((resource, idx) => (
                  <li key={idx}>
                    <a
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block hover:bg-gray-50 p-3 rounded-lg transition-colors"
                    >
                      <div className="font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-2">
                        {resource.name}
                        <ExternalLink className="w-4 h-4" />
                      </div>
                      <div className="text-sm text-gray-600">{resource.description}</div>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Timeline & Milestones */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Clock className="w-6 h-6 text-indigo-600" />
            Timeline & Milestones
          </h2>

          <div className="mb-6 p-4 bg-indigo-50 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-indigo-600">{roadmap.timeline.total_months} months</div>
                <div className="text-sm text-gray-600">Total Duration</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-indigo-600">{roadmap.timeline.hours_per_week_recommended} hrs/week</div>
                <div className="text-sm text-gray-600">Recommended</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-indigo-600">{new Date(roadmap.timeline.estimated_completion).toLocaleDateString()}</div>
                <div className="text-sm text-gray-600">Est. Completion</div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {roadmap.milestones.map((milestone, idx) => (
              <div key={idx} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex-shrink-0 w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold">
                  {idx + 1}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">{milestone.name}</h4>
                  <p className="text-sm text-gray-600">{milestone.description}</p>
                  <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                    <span>📅 {new Date(milestone.estimated_date).toLocaleDateString()}</span>
                    <span>📚 {milestone.skills_count} skills</span>
                    <span className={`px-2 py-1 rounded ${getPriorityColor(milestone.priority)}`}>
                      {milestone.priority}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LearningRoadmap;


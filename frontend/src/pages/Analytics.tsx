import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingUp, TrendingDown, Zap, Award, Target } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';
import axios from 'axios';

interface AnalyticsData {
  skill_velocity: number;
  match_improvement_rate: number;
  total_skills_gained: number;
  total_snapshots: number;
  average_match_score: number;
  best_match_pathway: string;
  growth_trend: string;
  skill_velocity_trend: any[];
  match_score_trend: any[];
  category_growth: any[];
  learning_velocity: any;
  recommendations_evolution: any[];
}

const Analytics: React.FC = () => {
  const { cvId } = useParams<{ cvId: string }>();
  const navigate = useNavigate();
  
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (cvId) {
      fetchAnalytics();
    }
  }, [cvId]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:8000/api/v1/progress/${cvId}/analytics`);
      setAnalytics(response.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Analyzing your data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={() => navigate(`/cv/${cvId}/recommendations`)}
            className="flex items-center text-indigo-600 hover:text-indigo-800 mb-6"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Recommendations
          </button>
          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-8 text-center">
            <div className="text-red-600 text-6xl mb-4">⚠️</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Unable to Load Analytics</h3>
            <p className="text-gray-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!analytics || analytics.total_snapshots < 2) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={() => navigate(`/cv/${cvId}/recommendations`)}
            className="flex items-center text-indigo-600 hover:text-indigo-800 mb-6"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Recommendations
          </button>
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-8 text-center">
            <div className="text-yellow-600 text-6xl mb-4">📊</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Not Enough Data</h3>
            <p className="text-gray-600 mb-4">
              You need at least 2 progress snapshots to view analytics. 
              Go to the Progress Dashboard to capture more snapshots.
            </p>
            <button
              onClick={() => navigate(`/cv/${cvId}/progress`)}
              className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700"
            >
              Go to Progress Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'accelerating':
        return <TrendingUp className="w-6 h-6 text-green-600" />;
      case 'declining':
        return <TrendingDown className="w-6 h-6 text-red-600" />;
      default:
        return <TrendingUp className="w-6 h-6 text-gray-600" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'accelerating': return 'text-green-600';
      case 'declining': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <button
          onClick={() => navigate(`/cv/${cvId}/recommendations`)}
          className="flex items-center text-indigo-600 hover:text-indigo-800 mb-6"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Recommendations
        </button>

        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Personal Analytics</h1>
          <p className="text-gray-600">Deep insights into your career growth and learning patterns</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-md p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <Zap className="w-8 h-8" />
              {getTrendIcon(analytics.growth_trend)}
            </div>
            <div className="text-3xl font-bold">{analytics.skill_velocity.toFixed(1)}</div>
            <div className="text-sm opacity-90">Skills/Month</div>
            <div className={`text-xs mt-2 ${getTrendColor(analytics.growth_trend)}`}>
              {analytics.growth_trend}
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-md p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-8 h-8" />
            </div>
            <div className="text-3xl font-bold">{(analytics.match_improvement_rate * 100).toFixed(1)}%</div>
            <div className="text-sm opacity-90">Match Improvement</div>
            <div className="text-xs mt-2 opacity-75">per snapshot</div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-md p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <Award className="w-8 h-8" />
            </div>
            <div className="text-3xl font-bold">{analytics.total_skills_gained}</div>
            <div className="text-sm opacity-90">Total Skills Gained</div>
            <div className="text-xs mt-2 opacity-75">since tracking</div>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg shadow-md p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <Target className="w-8 h-8" />
            </div>
            <div className="text-3xl font-bold">{Math.round(analytics.average_match_score * 100)}%</div>
            <div className="text-sm opacity-90">Avg Match Score</div>
            <div className="text-xs mt-2 opacity-75">{analytics.best_match_pathway}</div>
          </div>
        </div>

        {/* Skill Velocity Trend */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Skill Acquisition Velocity</h2>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={analytics.skill_velocity_trend}>
              <defs>
                <linearGradient id="colorVelocity" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" />
              <YAxis />
              <Tooltip />
              <Area 
                type="monotone" 
                dataKey="velocity" 
                stroke="#3b82f6" 
                fillOpacity={1} 
                fill="url(#colorVelocity)" 
                name="Skills per Month"
              />
            </AreaChart>
          </ResponsiveContainer>
          <div className="mt-4 text-sm text-gray-600">
            <p>
              <strong>Interpretation:</strong> Your current skill acquisition rate is{' '}
              <span className={`font-semibold ${getTrendColor(analytics.growth_trend)}`}>
                {analytics.skill_velocity.toFixed(1)} skills per month
              </span>
              . This shows how quickly you're expanding your skill set.
            </p>
          </div>
        </div>

        {/* Match Score Evolution */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Match Score Evolution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analytics.match_score_trend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="score" 
                stroke="#10b981" 
                strokeWidth={3}
                name="Top Match Score (%)"
              />
            </LineChart>
          </ResponsiveContainer>
          <div className="mt-4 text-sm text-gray-600">
            <p>
              <strong>Interpretation:</strong> Your career match scores are{' '}
              {analytics.match_improvement_rate > 0 ? (
                <span className="font-semibold text-green-600">improving by {(analytics.match_improvement_rate * 100).toFixed(1)}% per update</span>
              ) : (
                <span className="font-semibold text-gray-600">stabilizing</span>
              )}
              . This indicates how well your skills align with your target career paths.
            </p>
          </div>
        </div>

        {/* Category Growth Radar */}
        {analytics.category_growth && analytics.category_growth.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Skill Category Growth</h2>
            <ResponsiveContainer width="100%" height={400}>
              <RadarChart data={analytics.category_growth}>
                <PolarGrid />
                <PolarAngleAxis dataKey="category" />
                <PolarRadiusAxis angle={90} domain={[0, 'auto']} />
                <Radar 
                  name="Skills Count" 
                  dataKey="count" 
                  stroke="#8b5cf6" 
                  fill="#8b5cf6" 
                  fillOpacity={0.6} 
                />
                <Tooltip />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
            <div className="mt-4 text-sm text-gray-600">
              <p>
                <strong>Interpretation:</strong> This radar chart shows your skill distribution across different categories.
                Larger areas indicate more developed skill sets in those domains.
              </p>
            </div>
          </div>
        )}

        {/* Learning Velocity Breakdown */}
        {analytics.learning_velocity && Object.keys(analytics.learning_velocity).length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Learning Velocity by Category</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={Object.entries(analytics.learning_velocity).map(([category, velocity]) => ({
                category,
                velocity: Number(velocity)
              }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="velocity" fill="#f59e0b" name="Skills/Month" />
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-4 text-sm text-gray-600">
              <p>
                <strong>Interpretation:</strong> This shows which skill categories you're learning fastest. 
                Focus areas with higher bars indicate rapid skill development.
              </p>
            </div>
          </div>
        )}

        {/* Recommendations Evolution */}
        {analytics.recommendations_evolution && analytics.recommendations_evolution.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Top Career Match Evolution</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics.recommendations_evolution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                {analytics.recommendations_evolution[0] && Object.keys(analytics.recommendations_evolution[0])
                  .filter(key => key !== 'date')
                  .slice(0, 5)
                  .map((pathway, idx) => {
                    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'];
                    return (
                      <Line 
                        key={pathway}
                        type="monotone" 
                        dataKey={pathway} 
                        stroke={colors[idx]} 
                        strokeWidth={2}
                      />
                    );
                  })}
              </LineChart>
            </ResponsiveContainer>
            <div className="mt-4 text-sm text-gray-600">
              <p>
                <strong>Interpretation:</strong> Track how your match scores for different career paths evolve over time.
                Rising lines indicate growing alignment with those career trajectories.
              </p>
            </div>
          </div>
        )}

        {/* Insights Panel */}
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Key Insights</h2>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center text-white font-bold">
                1
              </div>
              <p className="text-gray-700">
                You're acquiring skills at a rate of <strong>{analytics.skill_velocity.toFixed(1)} per month</strong>, 
                which is {analytics.growth_trend === 'accelerating' ? 'accelerating' : analytics.growth_trend === 'declining' ? 'slowing down' : 'steady'}.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center text-white font-bold">
                2
              </div>
              <p className="text-gray-700">
                Your career match scores improve by an average of <strong>{(analytics.match_improvement_rate * 100).toFixed(1)}%</strong> with each update.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center text-white font-bold">
                3
              </div>
              <p className="text-gray-700">
                Your best career match is <strong>{analytics.best_match_pathway}</strong> with an average score of {Math.round(analytics.average_match_score * 100)}%.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center text-white font-bold">
                4
              </div>
              <p className="text-gray-700">
                You've gained <strong>{analytics.total_skills_gained} new skills</strong> since you started tracking your progress.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;


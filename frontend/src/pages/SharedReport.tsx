import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { TrendingUp, Award, Target, Clock, Calendar, Lock } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import axios from 'axios';

interface SharedRecommendation {
  pathway: string;
  match_score: number;
  recommended_skills: string[];
  reasoning: string;
}

interface SharedReportData {
  share_code: string;
  cv_filename: string;
  total_skills: number;
  recommendations: SharedRecommendation[];
  created_at: string;
  expires_at: string;
}

const SharedReport: React.FC = () => {
  const { shareCode } = useParams<{ shareCode: string }>();
  const [reportData, setReportData] = useState<SharedReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (shareCode) {
      fetchSharedReport();
    }
  }, [shareCode]);

  const fetchSharedReport = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:8000/api/v1/export/shared/${shareCode}`);
      setReportData(response.data);
    } catch (err: any) {
      if (err.response?.status === 404) {
        setError('This shared report does not exist or has expired.');
      } else {
        setError('Failed to load shared report. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading shared report...</p>
        </div>
      </div>
    );
  }

  if (error || !reportData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <Lock className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Report Not Available</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <a
            href="/"
            className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Go to Homepage
          </a>
        </div>
      </div>
    );
  }

  // Prepare chart data
  const matchData = reportData.recommendations
    .slice(0, 8)
    .map(rec => ({
      name: rec.pathway.length > 20 ? rec.pathway.substring(0, 20) + '...' : rec.pathway,
      fullName: rec.pathway,
      value: Math.round(rec.match_score * 100)
    }));

  const scoreRanges = {
    excellent: reportData.recommendations.filter(r => r.match_score >= 0.7).length,
    good: reportData.recommendations.filter(r => r.match_score >= 0.5 && r.match_score < 0.7).length,
    fair: reportData.recommendations.filter(r => r.match_score < 0.5).length,
  };

  const scoreDistribution = [
    { name: 'Excellent (70%+)', value: scoreRanges.excellent, color: '#10b981' },
    { name: 'Good (50-69%)', value: scoreRanges.good, color: '#f59e0b' },
    { name: 'Fair (<50%)', value: scoreRanges.fair, color: '#ef4444' },
  ].filter(item => item.value > 0);

  const daysUntilExpiry = Math.ceil(
    (new Date(reportData.expires_at).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg shadow-lg p-8 mb-8 text-white">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Award className="w-8 h-8" />
                <h1 className="text-3xl font-bold">Career Recommendations Report</h1>
              </div>
              <p className="text-indigo-100 mb-4">Shared from: {reportData.cv_filename}</p>
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>Shared: {new Date(reportData.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>Expires in: {daysUntilExpiry} day{daysUntilExpiry !== 1 ? 's' : ''}</span>
                </div>
              </div>
            </div>
            <TrendingUp className="w-16 h-16 text-indigo-200" />
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <Target className="w-8 h-8 text-indigo-600" />
            </div>
            <div className="text-3xl font-bold text-gray-900">{reportData.recommendations.length}</div>
            <div className="text-sm text-gray-600">Career Matches</div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <Award className="w-8 h-8 text-green-600" />
            </div>
            <div className="text-3xl font-bold text-gray-900">{reportData.total_skills}</div>
            <div className="text-sm text-gray-600">Skills Identified</div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-8 h-8 text-purple-600" />
            </div>
            <div className="text-3xl font-bold text-gray-900">
              {reportData.recommendations.length > 0 ? Math.round(reportData.recommendations[0].match_score * 100) : 0}%
            </div>
            <div className="text-sm text-gray-600">Top Match Score</div>
          </div>
        </div>

        {/* Charts */}
        {reportData.recommendations.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Career Match Scores */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Top Career Matches</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={matchData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                  <YAxis label={{ value: 'Match %', angle: -90, position: 'insideLeft' }} />
                  <Tooltip 
                    content={({ payload }) => {
                      if (payload && payload.length > 0) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white p-3 border border-gray-200 rounded shadow-lg">
                            <p className="font-semibold text-gray-900">{data.fullName}</p>
                            <p className="text-indigo-600">{data.value}% Match</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="value" fill="#6366f1" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Score Distribution */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Match Quality Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={scoreDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {scoreDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Detailed Recommendations */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900">Detailed Career Recommendations</h2>
          
          {reportData.recommendations.slice(0, 10).map((rec, index) => (
            <div key={index} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="flex items-center justify-center w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full font-bold">
                      {index + 1}
                    </span>
                    <h3 className="text-xl font-bold text-gray-900">{rec.pathway}</h3>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-indigo-600">
                    {Math.round(rec.match_score * 100)}%
                  </div>
                  <div className="text-sm text-gray-600">Match</div>
                </div>
              </div>

              {rec.reasoning && (
                <div className="mb-4 p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
                  <p className="text-sm text-gray-700">{rec.reasoning}</p>
                </div>
              )}

              {rec.recommended_skills && rec.recommended_skills.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    Key Skills to Learn
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {rec.recommended_skills.slice(0, 10).map((skill, skillIdx) => (
                      <span
                        key={skillIdx}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800 border border-gray-300"
                      >
                        {skill}
                      </span>
                    ))}
                    {rec.recommended_skills.length > 10 && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-200 text-gray-600">
                        +{rec.recommended_skills.length - 10} more
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-12 bg-gray-100 rounded-lg p-6 text-center">
          <p className="text-gray-600 mb-4">
            Want to create your own personalized career recommendations?
          </p>
          <a
            href="/"
            className="inline-block bg-indigo-600 text-white px-8 py-3 rounded-lg hover:bg-indigo-700 transition-colors font-semibold"
          >
            Try Career Projector
          </a>
        </div>
      </div>
    </div>
  );
};

export default SharedReport;


import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingUp, Calendar, Award, Plus, CheckCircle, Clock, Target } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import axios from 'axios';

interface TimelineEntry {
  id: number;
  date: string;
  skills_count: number;
  top_match_score: number;
  skills_learned: string[];
  metrics: any;
}

interface LearnedSkill {
  id: number;
  skill_name: string;
  date_learned: string;
  proficiency_level: string;
  status: string;
}

const ProgressDashboard: React.FC = () => {
  const { cvId } = useParams<{ cvId: string }>();
  const navigate = useNavigate();
  
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [learnedSkills, setLearnedSkills] = useState<LearnedSkill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddSkill, setShowAddSkill] = useState(false);
  const [newSkill, setNewSkill] = useState({
    skill_name: '',
    proficiency_level: 'beginner',
    status: 'learning'
  });

  useEffect(() => {
    if (cvId) {
      fetchProgress();
    }
  }, [cvId]);

  const fetchProgress = async () => {
    try {
      setLoading(true);
      const [timelineRes, skillsRes] = await Promise.all([
        axios.get(`http://localhost:8000/api/v1/progress/${cvId}/timeline`),
        axios.get(`http://localhost:8000/api/v1/progress/${cvId}/learned-skills`)
      ]);
      setTimeline(timelineRes.data);
      setLearnedSkills(skillsRes.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load progress data');
    } finally {
      setLoading(false);
    }
  };

  const captureSnapshot = async () => {
    try {
      await axios.post(`http://localhost:8000/api/v1/progress/${cvId}/snapshot`);
      fetchProgress();
      alert('Progress snapshot captured successfully!');
    } catch (err: any) {
      alert('Failed to capture snapshot: ' + (err.response?.data?.detail || err.message));
    }
  };

  const addLearnedSkill = async () => {
    if (!newSkill.skill_name.trim()) {
      alert('Please enter a skill name');
      return;
    }

    try {
      await axios.post(`http://localhost:8000/api/v1/progress/${cvId}/learned-skills`, newSkill);
      setNewSkill({ skill_name: '', proficiency_level: 'beginner', status: 'learning' });
      setShowAddSkill(false);
      fetchProgress();
    } catch (err: any) {
      alert('Failed to add skill: ' + (err.response?.data?.detail || err.message));
    }
  };

  const updateSkillStatus = async (skillId: number, status: string) => {
    try {
      const skill = learnedSkills.find(s => s.id === skillId);
      if (!skill) return;

      await axios.put(`http://localhost:8000/api/v1/progress/${cvId}/learned-skills/${skillId}`, {
        skill_name: skill.skill_name,
        proficiency_level: skill.proficiency_level,
        status
      });
      fetchProgress();
    } catch (err: any) {
      alert('Failed to update skill: ' + (err.response?.data?.detail || err.message));
    }
  };

  const deleteSkill = async (skillId: number) => {
    if (!confirm('Are you sure you want to delete this skill?')) return;

    try {
      await axios.delete(`http://localhost:8000/api/v1/progress/${cvId}/learned-skills/${skillId}`);
      fetchProgress();
    } catch (err: any) {
      alert('Failed to delete skill: ' + (err.response?.data?.detail || err.message));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'mastered': return 'bg-green-100 text-green-800 border-green-200';
      case 'completed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'learning': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getProficiencyColor = (level: string) => {
    switch (level) {
      case 'expert': return 'bg-purple-500';
      case 'advanced': return 'bg-indigo-500';
      case 'intermediate': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your progress...</p>
        </div>
      </div>
    );
  }

  // Prepare chart data
  const chartData = timeline.map(entry => ({
    date: new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    skills: entry.skills_count,
    matchScore: Math.round(entry.top_match_score * 100)
  }));

  const skillsByStatus = {
    learning: learnedSkills.filter(s => s.status === 'learning'),
    completed: learnedSkills.filter(s => s.status === 'completed'),
    mastered: learnedSkills.filter(s => s.status === 'mastered')
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Progress Dashboard</h1>
              <p className="text-gray-600">Track your career development journey</p>
            </div>
            <button
              onClick={captureSnapshot}
              className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 flex items-center gap-2"
            >
              <Camera className="w-5 h-5" />
              Capture Snapshot
            </button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <Calendar className="w-8 h-8 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{timeline.length}</div>
            <div className="text-sm text-gray-600">Total Snapshots</div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <Target className="w-8 h-8 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{learnedSkills.length}</div>
            <div className="text-sm text-gray-600">Skills Tracked</div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="w-8 h-8 text-purple-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{skillsByStatus.mastered.length}</div>
            <div className="text-sm text-gray-600">Skills Mastered</div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-8 h-8 text-orange-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {timeline.length > 0 ? Math.round(timeline[timeline.length - 1].top_match_score * 100) : 0}%
            </div>
            <div className="text-sm text-gray-600">Current Top Match</div>
          </div>
        </div>

        {/* Progress Timeline Chart */}
        {timeline.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Progress Over Time</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="skills"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  name="Skills Count"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="matchScore"
                  stroke="#10b981"
                  strokeWidth={2}
                  name="Top Match Score (%)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Learning Skills Tracker */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Learning Tracker</h2>
            <button
              onClick={() => setShowAddSkill(!showAddSkill)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Skill
            </button>
          </div>

          {/* Add Skill Form */}
          {showAddSkill && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <input
                  type="text"
                  placeholder="Skill name..."
                  value={newSkill.skill_name}
                  onChange={(e) => setNewSkill({...newSkill, skill_name: e.target.value})}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                />
                <select
                  value={newSkill.proficiency_level}
                  onChange={(e) => setNewSkill({...newSkill, proficiency_level: e.target.value})}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                  <option value="expert">Expert</option>
                </select>
                <select
                  value={newSkill.status}
                  onChange={(e) => setNewSkill({...newSkill, status: e.target.value})}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="learning">Learning</option>
                  <option value="completed">Completed</option>
                  <option value="mastered">Mastered</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={addLearnedSkill}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
                >
                  Add Skill
                </button>
                <button
                  onClick={() => setShowAddSkill(false)}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Skills by Status */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Learning */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Clock className="w-5 h-5 text-yellow-600" />
                Learning ({skillsByStatus.learning.length})
              </h3>
              <div className="space-y-2">
                {skillsByStatus.learning.map(skill => (
                  <div key={skill.id} className={`p-3 rounded-lg border ${getStatusColor(skill.status)}`}>
                    <div className="font-medium">{skill.skill_name}</div>
                    <div className="text-xs mt-1">
                      <span className={`inline-block px-2 py-1 rounded ${getProficiencyColor(skill.proficiency_level)} text-white`}>
                        {skill.proficiency_level}
                      </span>
                    </div>
                    <div className="mt-2 flex gap-2">
                      <button
                        onClick={() => updateSkillStatus(skill.id, 'completed')}
                        className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                      >
                        Complete
                      </button>
                      <button
                        onClick={() => deleteSkill(skill.id)}
                        className="text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Completed */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-blue-600" />
                Completed ({skillsByStatus.completed.length})
              </h3>
              <div className="space-y-2">
                {skillsByStatus.completed.map(skill => (
                  <div key={skill.id} className={`p-3 rounded-lg border ${getStatusColor(skill.status)}`}>
                    <div className="font-medium">{skill.skill_name}</div>
                    <div className="text-xs mt-1">
                      <span className={`inline-block px-2 py-1 rounded ${getProficiencyColor(skill.proficiency_level)} text-white`}>
                        {skill.proficiency_level}
                      </span>
                    </div>
                    <div className="mt-2 flex gap-2">
                      <button
                        onClick={() => updateSkillStatus(skill.id, 'mastered')}
                        className="text-xs bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600"
                      >
                        Master
                      </button>
                      <button
                        onClick={() => deleteSkill(skill.id)}
                        className="text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Mastered */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Award className="w-5 h-5 text-green-600" />
                Mastered ({skillsByStatus.mastered.length})
              </h3>
              <div className="space-y-2">
                {skillsByStatus.mastered.map(skill => (
                  <div key={skill.id} className={`p-3 rounded-lg border ${getStatusColor(skill.status)}`}>
                    <div className="font-medium">{skill.skill_name}</div>
                    <div className="text-xs mt-1">
                      <span className={`inline-block px-2 py-1 rounded ${getProficiencyColor(skill.proficiency_level)} text-white`}>
                        {skill.proficiency_level}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {new Date(skill.date_learned).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {timeline.length === 0 && (
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-8 text-center">
            <div className="text-yellow-600 text-6xl mb-4">📊</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Start Tracking Your Progress</h3>
            <p className="text-gray-600 mb-4">
              Capture your first progress snapshot to start tracking your career development.
            </p>
            <button
              onClick={captureSnapshot}
              className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700"
            >
              Capture First Snapshot
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Add Camera icon
const Camera: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

export default ProgressDashboard;


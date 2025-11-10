import React, { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, TrendingUp, TrendingDown, Minus, Plus, X } from 'lucide-react';
import { cvStorage, CVSnapshot } from '../utils/localStorage';

interface CVComparisonProps {
  onClose?: () => void;
}

const CVComparison: React.FC<CVComparisonProps> = ({ onClose }) => {
  const [cvHistory, setCVHistory] = useState<CVSnapshot[]>([]);
  const [selectedCV1, setSelectedCV1] = useState<CVSnapshot | null>(null);
  const [selectedCV2, setSelectedCV2] = useState<CVSnapshot | null>(null);

  useEffect(() => {
    loadCVHistory();
  }, []);

  const loadCVHistory = () => {
    const history = cvStorage.getCVHistory();
    setCVHistory(history);
    
    // Auto-select most recent two if available
    if (history.length >= 2 && !selectedCV1 && !selectedCV2) {
      setSelectedCV1(history[history.length - 2]);
      setSelectedCV2(history[history.length - 1]);
    }
  };

  const getSkillsDifference = () => {
    if (!selectedCV1 || !selectedCV2) return { added: [], removed: [], common: [] };
    
    const skills1 = new Set(selectedCV1.skills.map(s => s.name));
    const skills2 = new Set(selectedCV2.skills.map(s => s.name));
    
    const added = selectedCV2.skills.filter(s => !skills1.has(s.name));
    const removed = selectedCV1.skills.filter(s => !skills2.has(s.name));
    const common = selectedCV1.skills.filter(s => skills2.has(s.name));
    
    return { added, removed, common };
  };

  const getRecommendationsDifference = () => {
    if (!selectedCV1 || !selectedCV2) return { improved: [], declined: [], new: [], lost: [] };
    
    const recs1Map = new Map(selectedCV1.recommendations.map(r => [r.pathway, r.matchScore]));
    const recs2Map = new Map(selectedCV2.recommendations.map(r => [r.pathway, r.matchScore]));
    
    const improved = selectedCV2.recommendations.filter(r => {
      const oldScore = recs1Map.get(r.pathway);
      return oldScore !== undefined && r.matchScore > oldScore;
    });
    
    const declined = selectedCV2.recommendations.filter(r => {
      const oldScore = recs1Map.get(r.pathway);
      return oldScore !== undefined && r.matchScore < oldScore;
    });
    
    const newRecs = selectedCV2.recommendations.filter(r => !recs1Map.has(r.pathway));
    const lostRecs = selectedCV1.recommendations.filter(r => !recs2Map.has(r.pathway));
    
    return { improved, declined, new: newRecs, lost: lostRecs };
  };

  if (cvHistory.length < 2) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="text-center">
          <div className="text-6xl mb-4">📊</div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Not Enough CV Versions</h3>
          <p className="text-gray-600 mb-4">
            You need at least 2 CV versions to compare. Upload another CV to see comparisons.
          </p>
          {onClose && (
            <button
              onClick={onClose}
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700"
            >
              Close
            </button>
          )}
        </div>
      </div>
    );
  }

  const skillsDiff = getSkillsDifference();
  const recsDiff = getRecommendationsDifference();
  const scoreChange = selectedCV1 && selectedCV2 ? selectedCV2.topMatchScore - selectedCV1.topMatchScore : 0;

  return (
    <div className="bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="border-b border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">CV Comparison</h2>
          {onClose && (
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-6 h-6" />
            </button>
          )}
        </div>

        {/* CV Selectors */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">CV Version 1</label>
            <select
              value={selectedCV1?.cvId || ''}
              onChange={(e) => {
                const cv = cvHistory.find(c => c.cvId === parseInt(e.target.value));
                setSelectedCV1(cv || null);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">Select a CV...</option>
              {cvHistory.map(cv => (
                <option key={cv.cvId} value={cv.cvId}>
                  {cv.filename} ({new Date(cv.uploadDate).toLocaleDateString()})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">CV Version 2</label>
            <select
              value={selectedCV2?.cvId || ''}
              onChange={(e) => {
                const cv = cvHistory.find(c => c.cvId === parseInt(e.target.value));
                setSelectedCV2(cv || null);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">Select a CV...</option>
              {cvHistory.map(cv => (
                <option key={cv.cvId} value={cv.cvId}>
                  {cv.filename} ({new Date(cv.uploadDate).toLocaleDateString()})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {selectedCV1 && selectedCV2 ? (
        <div className="p-6 space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
              <div className="text-sm text-blue-600 mb-1">Skills Change</div>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-gray-900">
                  {selectedCV1.skillsCount} → {selectedCV2.skillsCount}
                </span>
                <span className={`flex items-center gap-1 ${
                  selectedCV2.skillsCount > selectedCV1.skillsCount ? 'text-green-600' : 
                  selectedCV2.skillsCount < selectedCV1.skillsCount ? 'text-red-600' : 'text-gray-600'
                }`}>
                  {selectedCV2.skillsCount > selectedCV1.skillsCount ? (
                    <><TrendingUp className="w-5 h-5" /> +{selectedCV2.skillsCount - selectedCV1.skillsCount}</>
                  ) : selectedCV2.skillsCount < selectedCV1.skillsCount ? (
                    <><TrendingDown className="w-5 h-5" /> {selectedCV2.skillsCount - selectedCV1.skillsCount}</>
                  ) : (
                    <><Minus className="w-5 h-5" /> 0</>
                  )}
                </span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4">
              <div className="text-sm text-purple-600 mb-1">Match Score</div>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-gray-900">
                  {Math.round(selectedCV1.topMatchScore * 100)}% → {Math.round(selectedCV2.topMatchScore * 100)}%
                </span>
                <span className={`flex items-center gap-1 ${
                  scoreChange > 0 ? 'text-green-600' : 
                  scoreChange < 0 ? 'text-red-600' : 'text-gray-600'
                }`}>
                  {scoreChange > 0 ? (
                    <><TrendingUp className="w-5 h-5" /> +{Math.round(scoreChange * 100)}%</>
                  ) : scoreChange < 0 ? (
                    <><TrendingDown className="w-5 h-5" /> {Math.round(scoreChange * 100)}%</>
                  ) : (
                    <><Minus className="w-5 h-5" /> 0%</>
                  )}
                </span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4">
              <div className="text-sm text-green-600 mb-1">New Skills</div>
              <div className="text-2xl font-bold text-gray-900">{skillsDiff.added.length}</div>
            </div>
          </div>

          {/* Skills Comparison */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Skills Comparison</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Added Skills */}
              {skillsDiff.added.length > 0 && (
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Plus className="w-5 h-5 text-green-600" />
                    <h4 className="font-semibold text-green-900">Added ({skillsDiff.added.length})</h4>
                  </div>
                  <div className="space-y-2">
                    {skillsDiff.added.map((skill, idx) => (
                      <div key={idx} className="text-sm text-green-800 bg-green-100 px-3 py-1 rounded">
                        {skill.name}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Removed Skills */}
              {skillsDiff.removed.length > 0 && (
                <div className="bg-red-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Minus className="w-5 h-5 text-red-600" />
                    <h4 className="font-semibold text-red-900">Removed ({skillsDiff.removed.length})</h4>
                  </div>
                  <div className="space-y-2">
                    {skillsDiff.removed.map((skill, idx) => (
                      <div key={idx} className="text-sm text-red-800 bg-red-100 px-3 py-1 rounded">
                        {skill.name}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Common Skills */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <ArrowRight className="w-5 h-5 text-gray-600" />
                  <h4 className="font-semibold text-gray-900">Unchanged ({skillsDiff.common.length})</h4>
                </div>
                <div className="text-sm text-gray-600">
                  {skillsDiff.common.length} skills remain the same
                </div>
              </div>
            </div>
          </div>

          {/* Recommendations Comparison */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Career Recommendations Changes</h3>
            
            <div className="space-y-4">
              {/* Improved */}
              {recsDiff.improved.length > 0 && (
                <div className="bg-green-50 rounded-lg p-4">
                  <h4 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Improved Matches ({recsDiff.improved.length})
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {recsDiff.improved.map((rec, idx) => (
                      <div key={idx} className="bg-white rounded p-3">
                        <div className="font-medium text-gray-900">{rec.pathway}</div>
                        <div className="text-sm text-green-600">
                          Match improved to {Math.round(rec.matchScore * 100)}%
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* New Recommendations */}
              {recsDiff.new.length > 0 && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                    <Plus className="w-5 h-5" />
                    New Opportunities ({recsDiff.new.length})
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {recsDiff.new.map((rec, idx) => (
                      <div key={idx} className="bg-white rounded p-3">
                        <div className="font-medium text-gray-900">{rec.pathway}</div>
                        <div className="text-sm text-blue-600">
                          {Math.round(rec.matchScore * 100)}% match
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Declined */}
              {recsDiff.declined.length > 0 && (
                <div className="bg-orange-50 rounded-lg p-4">
                  <h4 className="font-semibold text-orange-900 mb-3 flex items-center gap-2">
                    <TrendingDown className="w-5 h-5" />
                    Declined Matches ({recsDiff.declined.length})
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {recsDiff.declined.map((rec, idx) => (
                      <div key={idx} className="bg-white rounded p-3">
                        <div className="font-medium text-gray-900">{rec.pathway}</div>
                        <div className="text-sm text-orange-600">
                          Match decreased to {Math.round(rec.matchScore * 100)}%
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {recsDiff.improved.length === 0 && recsDiff.new.length === 0 && recsDiff.declined.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No significant changes in career recommendations
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="p-8 text-center text-gray-500">
          Please select two CV versions to compare
        </div>
      )}
    </div>
  );
};

export default CVComparison;


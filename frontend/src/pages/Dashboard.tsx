import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { cvAPI } from '../services/api';
import { Upload, FileText, LogOut, TrendingUp } from 'lucide-react';
import type { CV } from '../types';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [cvs, setCvs] = useState<CV[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCVs();
  }, []);

  const loadCVs = async () => {
    try {
      const data = await cvAPI.list();
      setCvs(data);
    } catch (error) {
      console.error('Failed to load CVs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">CV Career Recommender</h1>
              <p className="text-gray-600">Welcome, {user?.full_name || user?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Upload Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Upload Your CV</h2>
          <p className="text-gray-600 mb-4">
            Upload your CV in PDF or DOCX format to get personalized career recommendations
          </p>
          <button
            onClick={() => navigate('/upload')}
            className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Upload className="w-5 h-5" />
            Upload CV
          </button>
        </div>

        {/* CVs List */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Your CVs</h2>
          
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading your CVs...</p>
            </div>
          ) : cvs.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No CVs uploaded yet</p>
              <button
                onClick={() => navigate('/upload')}
                className="mt-4 text-indigo-600 hover:text-indigo-700 font-medium"
              >
                Upload your first CV
              </button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {cvs.map((cv) => (
                <div
                  key={cv.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => navigate(`/cv/${cv.id}`)}
                >
                  <div className="flex items-start gap-3">
                    <FileText className="w-8 h-8 text-indigo-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 truncate">{cv.filename}</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        Uploaded {formatDate(cv.upload_date)}
                      </p>
                      {cv.years_experience && (
                        <p className="text-sm text-gray-600 mt-2">
                          Experience: {cv.years_experience} years
                        </p>
                      )}
                      {cv.education_level && (
                        <p className="text-sm text-gray-600">
                          Education: {cv.education_level}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/recommendations/${cv.id}`);
                    }}
                    className="mt-4 w-full flex items-center justify-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-lg hover:bg-green-100 transition-colors"
                  >
                    <TrendingUp className="w-4 h-4" />
                    View Recommendations
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;


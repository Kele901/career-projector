import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { TrendingUp, FileText, Target, Sparkles } from 'lucide-react';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-indigo-600">CV Career Recommender</h1>
          <div className="flex gap-3">
            {isAuthenticated ? (
              <button
                onClick={() => navigate('/dashboard')}
                className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Dashboard
              </button>
            ) : (
              <>
                <button
                  onClick={() => navigate('/login')}
                  className="text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Login
                </button>
                <button
                  onClick={() => navigate('/register')}
                  className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Sign Up
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-gray-900 mb-6">
            Discover Your Perfect Career Path
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Upload your CV and get AI-powered career recommendations based on your skills,
            experience, and certifications. Powered by roadmap.sh insights.
          </p>
          <div className="flex gap-4 justify-center items-center">
            <button
              onClick={() => navigate('/upload')}
              className="bg-indigo-600 text-white px-8 py-4 rounded-lg text-lg font-medium hover:bg-indigo-700 transition-colors shadow-lg"
            >
              Try as Guest
            </button>
            {!isAuthenticated && (
              <button
                onClick={() => navigate('/register')}
                className="bg-white text-indigo-600 border-2 border-indigo-600 px-8 py-4 rounded-lg text-lg font-medium hover:bg-indigo-50 transition-colors"
              >
                Sign Up Free
              </button>
            )}
          </div>
          {!isAuthenticated && (
            <p className="mt-4 text-sm text-gray-500">
              No account needed to try! Sign up to save your results.
            </p>
          )}
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mt-16">
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">CV Analysis</h3>
            <p className="text-gray-600">
              Upload your CV in PDF or DOCX format for intelligent parsing and analysis
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <Target className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Skill Extraction</h3>
            <p className="text-gray-600">
              Advanced NLP technology identifies and categorizes your technical and soft skills
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
              <TrendingUp className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Career Matching</h3>
            <p className="text-gray-600">
              Get personalized recommendations for 13+ career pathways based on roadmap.sh
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mb-4">
              <Sparkles className="w-8 h-8 text-orange-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">AI Enhancement</h3>
            <p className="text-gray-600">
              Optional AI-powered insights for nuanced recommendations and learning paths
            </p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-16 bg-white rounded-lg shadow-xl p-12 text-center">
          <h3 className="text-3xl font-bold text-gray-900 mb-4">
            Ready to Find Your Path?
          </h3>
          <p className="text-lg text-gray-600 mb-6">
            Upload your CV now and get instant career recommendations - no account required!
          </p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => navigate('/upload')}
              className="bg-indigo-600 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-indigo-700 transition-colors"
            >
              Upload CV Now
            </button>
            {!isAuthenticated && (
              <button
                onClick={() => navigate('/register')}
                className="bg-white text-indigo-600 border-2 border-indigo-600 px-8 py-3 rounded-lg text-lg font-medium hover:bg-indigo-50 transition-colors"
              >
                Create Account
              </button>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center text-gray-600">
          <p>© 2025 CV Career Recommender. Powered by roadmap.sh insights.</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;


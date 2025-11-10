import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { cvAPI } from '../services/api';
import { Upload as UploadIcon, FileText, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';

const Upload: React.FC = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [cvId, setCvId] = useState<number | null>(null);
  const [uploadProgress, setUploadProgress] = useState<string>('');

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelection(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileSelection = (selectedFile: File) => {
    setError('');
    const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    
    if (!validTypes.includes(selectedFile.type)) {
      setError('Please upload a PDF or DOCX file');
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    setFile(selectedFile);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelection(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setError('');
    setUploadProgress('Uploading file...');

    try {
      // Simulate progress updates
      setTimeout(() => setUploadProgress('Processing CV...'), 500);
      setTimeout(() => setUploadProgress('Extracting skills...'), 1500);
      setTimeout(() => setUploadProgress('Analyzing work experience...'), 2500);
      
      const result = await cvAPI.upload(file);
      
      setUploadProgress('Complete!');
      setCvId(result.cv_id);
      setSuccess(true);
    } catch (err: any) {
      console.error('Upload error:', err);
      const errorMessage = err.response?.data?.detail 
        || err.message 
        || 'Upload failed. Please try again.';
      setError(typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage));
      setUploadProgress('');
    } finally {
      setUploading(false);
    }
  };

  const reset = () => {
    setFile(null);
    setSuccess(false);
    setError('');
    setCvId(null);
  };

  if (success && cvId) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">CV Uploaded Successfully!</h2>
            <p className="text-gray-600 mb-6">
              Your CV has been analyzed and skills have been extracted.
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => navigate(`/cv/${cvId}`)}
                className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                View Details
              </button>
              <button
                onClick={() => navigate(`/recommendations/${cvId}`)}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                Get Recommendations
              </button>
              <button
                onClick={reset}
                className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Upload Another
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Dashboard
        </button>

        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Upload Your CV</h1>
          <p className="text-gray-600 mb-6">
            Upload your CV in PDF or DOCX format. We'll analyze it and provide career recommendations.
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              {error}
            </div>
          )}

          <div
            className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
              dragActive
                ? 'border-indigo-500 bg-indigo-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              type="file"
              id="file-upload"
              className="hidden"
              accept=".pdf,.docx"
              onChange={handleFileInput}
            />

            {file ? (
              <div className="space-y-4">
                <FileText className="w-16 h-16 text-indigo-600 mx-auto" />
                <div>
                  <p className="font-medium text-gray-900">{file.name}</p>
                  <p className="text-sm text-gray-500">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <div className="space-y-3">
                  {uploading && uploadProgress && (
                    <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
                      <div className="flex items-center gap-3">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
                        <span className="text-indigo-700 font-medium">{uploadProgress}</span>
                      </div>
                    </div>
                  )}
                  <div className="flex gap-3 justify-center">
                    <button
                      onClick={handleUpload}
                      disabled={uploading}
                      className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {uploading ? 'Processing...' : 'Upload & Analyze'}
                    </button>
                    <button
                      onClick={reset}
                      disabled={uploading}
                      className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Choose Different File
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <UploadIcon className="w-16 h-16 text-gray-400 mx-auto" />
                <div>
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer text-indigo-600 hover:text-indigo-700 font-medium"
                  >
                    Click to upload
                  </label>
                  <span className="text-gray-600"> or drag and drop</span>
                </div>
                <p className="text-sm text-gray-500">PDF or DOCX (max 10MB)</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Upload;


import axios from 'axios';
import type {
  AuthResponse,
  LoginCredentials,
  RegisterData,
  User,
  CV,
  CVDetail,
  CVAnalysis,
  RecommendationResult,
  CareerPathway
} from '../types';

const API_BASE_URL = 'http://localhost:8000/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000, // 60 second timeout for regular requests
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Server responded with error
      console.error('API Error:', error.response.status, error.response.data);
    } else if (error.request) {
      // Request was made but no response
      console.error('Network Error: No response from server', error.request);
    } else {
      // Something else happened
      console.error('Error:', error.message);
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: async (data: RegisterData): Promise<User> => {
    const response = await api.post<User>('/auth/register', data);
    return response.data;
  },

  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const formData = new FormData();
    formData.append('username', credentials.username);
    formData.append('password', credentials.password);
    
    const response = await api.post<AuthResponse>('/auth/login', formData);
    return response.data;
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await api.get<User>('/auth/me');
    return response.data;
  },

  logout: async (): Promise<void> => {
    await api.post('/auth/logout');
  }
};

// CV API
export const cvAPI = {
  upload: async (file: File): Promise<CVAnalysis> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post<CVAnalysis>('/cv/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 120000, // 2 minute timeout for uploads (larger files need more time)
    });
    return response.data;
  },

  list: async (): Promise<CV[]> => {
    const response = await api.get<CV[]>('/cv/list');
    return response.data;
  },

  getDetail: async (cvId: number): Promise<CVDetail> => {
    const response = await api.get<CVDetail>(`/cv/${cvId}`);
    return response.data;
  },

  delete: async (cvId: number): Promise<void> => {
    await api.delete(`/cv/${cvId}`);
  }
};

// Recommendations API
export const recommendationsAPI = {
  generate: async (
    cvId: number,
    useAI: boolean = false,
    topN: number = 5
  ): Promise<RecommendationResult> => {
    const response = await api.post<RecommendationResult>('/recommendations/generate', {
      cv_id: cvId,
      use_ai: useAI,
      top_n: topN,
    });
    return response.data;
  },

  getForCV: async (cvId: number): Promise<any[]> => {
    const response = await api.get(`/recommendations/cv/${cvId}`);
    return response.data;
  },

  getAllPathways: async (): Promise<CareerPathway[]> => {
    const response = await api.get<CareerPathway[]>('/recommendations/pathways');
    return response.data;
  },

  getPathway: async (name: string): Promise<CareerPathway> => {
    const response = await api.get<CareerPathway>(`/recommendations/pathway/${name}`);
    return response.data;
  },

  generateLearningPath: async (cvId: number, targetPathway: string): Promise<any> => {
    const response = await api.post('/recommendations/ai/learning-path', null, {
      params: { cv_id: cvId, target_pathway: targetPathway }
    });
    return response.data;
  }
};

export default api;


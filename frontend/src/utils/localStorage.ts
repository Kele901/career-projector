/**
 * Local Storage Utility for Career Projector
 * Manages CV comparisons and progress tracking in browser storage
 */

export interface CVSnapshot {
  cvId: number;
  filename: string;
  uploadDate: string;
  skillsCount: number;
  topMatchScore: number;
  skills: Array<{ name: string; category: string }>;
  recommendations: Array<{ pathway: string; matchScore: number }>;
}

export interface ProgressSnapshot {
  date: string;
  cvId: number;
  skillsCount: number;
  topMatchScore: number;
  newSkills: string[];
}

const CV_HISTORY_KEY = 'career_projector_cv_history';
const PROGRESS_HISTORY_KEY = 'career_projector_progress';
const COMPARISON_KEY = 'career_projector_comparison';

export const cvStorage = {
  /**
   * Save a CV snapshot for comparison
   */
  saveCVSnapshot: (snapshot: CVSnapshot): void => {
    try {
      const history = cvStorage.getCVHistory();
      // Check if CV already exists
      const existingIndex = history.findIndex(cv => cv.cvId === snapshot.cvId);
      
      if (existingIndex >= 0) {
        // Update existing
        history[existingIndex] = snapshot;
      } else {
        // Add new
        history.push(snapshot);
      }
      
      // Keep only last 10 CVs
      if (history.length > 10) {
        history.shift();
      }
      
      localStorage.setItem(CV_HISTORY_KEY, JSON.stringify(history));
    } catch (error) {
      console.error('Failed to save CV snapshot:', error);
    }
  },

  /**
   * Get all CV snapshots
   */
  getCVHistory: (): CVSnapshot[] => {
    try {
      const data = localStorage.getItem(CV_HISTORY_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to get CV history:', error);
      return [];
    }
  },

  /**
   * Get a specific CV snapshot
   */
  getCVSnapshot: (cvId: number): CVSnapshot | null => {
    const history = cvStorage.getCVHistory();
    return history.find(cv => cv.cvId === cvId) || null;
  },

  /**
   * Set CVs for comparison
   */
  setComparison: (cv1Id: number, cv2Id: number): void => {
    try {
      localStorage.setItem(COMPARISON_KEY, JSON.stringify({ cv1Id, cv2Id }));
    } catch (error) {
      console.error('Failed to set comparison:', error);
    }
  },

  /**
   * Get current comparison
   */
  getComparison: (): { cv1Id: number; cv2Id: number } | null => {
    try {
      const data = localStorage.getItem(COMPARISON_KEY);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Failed to get comparison:', error);
      return null;
    }
  },

  /**
   * Clear comparison
   */
  clearComparison: (): void => {
    localStorage.removeItem(COMPARISON_KEY);
  },

  /**
   * Delete a CV snapshot
   */
  deleteCVSnapshot: (cvId: number): void => {
    try {
      const history = cvStorage.getCVHistory();
      const filtered = history.filter(cv => cv.cvId !== cvId);
      localStorage.setItem(CV_HISTORY_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('Failed to delete CV snapshot:', error);
    }
  },

  /**
   * Save progress snapshot
   */
  saveProgressSnapshot: (snapshot: ProgressSnapshot): void => {
    try {
      const history = cvStorage.getProgressHistory();
      history.push(snapshot);
      
      // Keep only last 50 snapshots
      if (history.length > 50) {
        history.shift();
      }
      
      localStorage.setItem(PROGRESS_HISTORY_KEY, JSON.stringify(history));
    } catch (error) {
      console.error('Failed to save progress snapshot:', error);
    }
  },

  /**
   * Get progress history
   */
  getProgressHistory: (): ProgressSnapshot[] => {
    try {
      const data = localStorage.getItem(PROGRESS_HISTORY_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to get progress history:', error);
      return [];
    }
  },

  /**
   * Get progress history for specific CV
   */
  getProgressForCV: (cvId: number): ProgressSnapshot[] => {
    const allProgress = cvStorage.getProgressHistory();
    return allProgress.filter(p => p.cvId === cvId);
  },

  /**
   * Clear all local storage data
   */
  clearAll: (): void => {
    localStorage.removeItem(CV_HISTORY_KEY);
    localStorage.removeItem(PROGRESS_HISTORY_KEY);
    localStorage.removeItem(COMPARISON_KEY);
  },

  /**
   * Export data as JSON
   */
  exportData: (): string => {
    return JSON.stringify({
      cvHistory: cvStorage.getCVHistory(),
      progressHistory: cvStorage.getProgressHistory(),
      exportDate: new Date().toISOString()
    });
  },

  /**
   * Import data from JSON
   */
  importData: (jsonData: string): boolean => {
    try {
      const data = JSON.parse(jsonData);
      if (data.cvHistory) {
        localStorage.setItem(CV_HISTORY_KEY, JSON.stringify(data.cvHistory));
      }
      if (data.progressHistory) {
        localStorage.setItem(PROGRESS_HISTORY_KEY, JSON.stringify(data.progressHistory));
      }
      return true;
    } catch (error) {
      console.error('Failed to import data:', error);
      return false;
    }
  }
};


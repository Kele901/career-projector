# Career Projector 🚀

An intelligent CV analysis and career recommendation platform that helps professionals discover optimal career paths based on their skills, experience, and career trajectory.

## 🌟 Features

### Core Features
- **CV Upload & Analysis**: Upload PDF/DOCX CVs with automatic parsing and skill extraction
- **Smart Career Recommendations**: AI-powered career pathway matching based on skills and experience
- **Career Trajectory Analysis**: Detects seniority levels, career progression, and company context
- **Skill Gap Analysis**: Identifies missing skills for target career paths

### Advanced Analytics
- **Learning Roadmap Generator**: Personalized step-by-step learning plans with timelines
- **Progress Tracking Dashboard**: Monitor skill acquisition and career growth over time
- **Personal Analytics**: Skill velocity, match improvement rates, and growth trends
- **CV Comparison Tool**: Compare different CV versions to track progress
- **Certification Recommendations**: Relevant certifications mapped to career pathways

### Visualization & Insights
- **Interactive Charts**: Pie charts, bar charts, radar plots, scatter plots, and line graphs
- **Learning Priority Matrix**: Color-coded skill prioritization (impact vs difficulty)
- **Skills Gap Analysis**: Visual breakdown of current vs required skills
- **Career Journey Timeline**: Experience visualization with seniority tracking
- **Skill Category Proficiency**: Heatmap of skills across categories

### Export & Sharing
- **PDF Export**: Generate professional career recommendation reports
- **Share Links**: Create shareable links (valid for 30 days)
- **Print View**: Browser-friendly print layouts

## 🏗️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **React Router** for navigation
- **Recharts** for data visualization
- **Tailwind CSS** for styling
- **Axios** for API communication
- **Lucide React** for icons

### Backend
- **FastAPI** (Python) for high-performance API
- **SQLAlchemy** ORM with SQLite database
- **Pydantic** for data validation
- **ReportLab** for PDF generation
- **python-docx** for DOCX parsing
- **PyPDF2** for PDF parsing
- **CORS** middleware for cross-origin requests

## 📋 Prerequisites

- **Node.js** 16+ and npm/yarn
- **Python** 3.11+ (Note: Python 3.13 has known issues with uvicorn)
- **Git**

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/career-projector.git
cd career-projector
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run database migrations
python migrate_career_features.py

# Start the backend server
python run_server.py
```

The backend will run on `http://localhost:8000`

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

The frontend will run on `http://localhost:5173`

## 📖 Usage

### 1. Upload Your CV
- Navigate to the Upload page
- Drag & drop or click to select your CV (PDF or DOCX)
- Wait for automatic parsing and skill extraction

### 2. Generate Recommendations
- Go to the Recommendations page
- Click "Generate Recommendations"
- View your personalized career pathway matches

### 3. Explore Features
- **Learning Roadmap**: Click "View Your Learning Roadmap" on any career path
- **Progress Tracker**: Capture snapshots to track your growth over time
- **Analytics**: View detailed analytics (requires 2+ progress snapshots)
- **Export**: Download PDF reports or create shareable links

## 🎯 Key Algorithms

### Career Matching Algorithm
- **Skills Matching**: 35% weight - Keyword-based with extensive variations
- **Category Alignment**: 30% weight - Career domain matching
- **Experience Relevance**: 15% weight - Work history analysis
- **Experience Duration**: 15% weight - Years of relevant experience
- **Career Progression Bonus**: Detects upward/lateral/pivot moves
- **Recency Weighting**: Recent experience (2-3 years) weighted more heavily
- **Company Context**: Startup vs enterprise, tech vs non-tech factors

### Learning Prioritization
- **Impact Score**: Percentage of career paths requiring the skill
- **Difficulty Estimate**: Based on skill complexity heuristics
- **Color Coding**:
  - 🟢 Green: High priority (high impact, easier)
  - 🟠 Orange: Medium-high (high impact, harder)
  - 🔵 Blue: Medium (lower impact, easier)
  - 🔴 Red: Low priority (lower impact, harder)

## 📊 Database Schema

### Core Tables
- `cvs`: Uploaded CVs and metadata
- `skills`: Extracted skills with categories and confidence scores
- `work_experiences`: Job history with seniority and company context
- `recommendations`: Generated career pathway recommendations

### Feature Tables
- `progress_entries`: Progress tracking snapshots
- `learned_skills`: Manually tracked skills with proficiency
- `shared_reports`: Shareable link management
- `cv_versions`: CV comparison history

## 🔧 Configuration

### Backend Configuration (`backend/app/core/config.py`)
- Database path
- Upload directory
- API settings
- CORS origins

### Frontend Configuration
- API base URL in `frontend/src/services/api.ts`
- Timeout settings for large file uploads

## 🐛 Known Issues

- **Python 3.13**: Has compatibility issues with uvicorn's reload feature
  - Solution: Use Python 3.11 or 3.12
- **Large CVs**: Files >5MB may take longer to process
- **Analytics**: Requires at least 2 progress snapshots to display data

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

This project is licensed under the MIT License.

## 👤 Author

**Kelechi Okoye-Ahaneku**

## 🙏 Acknowledgments

- roadmap.sh for career learning paths
- ReportLab for PDF generation
- Recharts for beautiful data visualizations
- FastAPI community for excellent documentation

## 📞 Support

For issues, questions, or suggestions, please open an issue on GitHub.

---

**Built with ❤️ using React, FastAPI, and modern web technologies**

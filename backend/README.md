# CV Career Recommender - Backend

FastAPI-based backend for analyzing CVs and recommending career pathways.

## Features

- **User Authentication**: JWT-based authentication with secure password hashing
- **CV Parsing**: Extract text from PDF and DOCX files
- **Skill Extraction**: NLP-based skill identification and categorization
- **Career Recommendations**: Match skills to career pathways based on roadmap.sh
- **AI Enhancement**: Optional OpenAI integration for advanced recommendations
- **RESTful API**: Clean, documented API endpoints

## Setup

### Prerequisites

- Python 3.8 or higher
- pip or conda

### Installation

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Download spaCy language model (optional, for advanced NLP):
```bash
python -m spacy download en_core_web_sm
```

3. Create a `.env` file (copy from `env.example`):
```bash
cp env.example .env
```

4. Update `.env` with your settings:
```
DATABASE_URL=sqlite:///./career_projector.db
SECRET_KEY=your-secret-key-change-this
OPENAI_API_KEY=your-openai-key (optional)
USE_AI_ENHANCEMENT=false
```

### Running the Server

```bash
# Development mode with auto-reload
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Or using Python
python -m app.main
```

The API will be available at `http://localhost:8000`

API documentation: `http://localhost:8000/docs`

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login and get token
- `GET /api/v1/auth/me` - Get current user info

### CV Management
- `POST /api/v1/cv/upload` - Upload and analyze CV
- `GET /api/v1/cv/list` - List user's CVs
- `GET /api/v1/cv/{cv_id}` - Get CV details
- `DELETE /api/v1/cv/{cv_id}` - Delete CV

### Recommendations
- `POST /api/v1/recommendations/generate` - Generate career recommendations
- `GET /api/v1/recommendations/cv/{cv_id}` - Get saved recommendations
- `GET /api/v1/recommendations/pathways` - List all career pathways
- `GET /api/v1/recommendations/pathway/{name}` - Get pathway details
- `POST /api/v1/recommendations/ai/learning-path` - Generate AI learning path

## Project Structure

```
backend/
├── app/
│   ├── api/              # API endpoints
│   │   ├── auth.py
│   │   ├── cv.py
│   │   └── recommendations.py
│   ├── core/             # Core functionality
│   │   ├── config.py
│   │   ├── database.py
│   │   └── security.py
│   ├── models/           # Database models
│   │   └── models.py
│   ├── services/         # Business logic
│   │   ├── cv_parser.py
│   │   ├── skill_extractor.py
│   │   ├── recommender.py
│   │   └── ai_enhancer.py
│   ├── data/             # Static data
│   │   └── career_pathways.json
│   └── main.py           # Application entry point
├── requirements.txt
└── README.md
```

## Career Pathways

The system supports 13 major career pathways inspired by roadmap.sh:

1. Frontend Developer
2. Backend Developer
3. Full Stack Developer
4. DevOps Engineer
5. Data Scientist
6. Android Developer
7. iOS Developer
8. React Native Developer
9. Software Architect
10. QA Engineer
11. Blockchain Developer
12. Game Developer
13. Cyber Security Specialist

## AI Enhancement

To enable AI-enhanced recommendations:

1. Get an OpenAI API key from https://platform.openai.com/
2. Set in `.env`:
   ```
   OPENAI_API_KEY=sk-...
   USE_AI_ENHANCEMENT=true
   ```

AI features include:
- Enhanced career analysis
- Personalized learning paths
- Career transition advice

## Testing

```bash
# Run with test data
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "test123", "full_name": "Test User"}'
```

## License

MIT


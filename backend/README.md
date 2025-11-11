# Career Projector Backend

FastAPI backend service for Career Projector - AI-powered career recommendation system.

## Features

- CV parsing (PDF, DOCX)
- Skill extraction and analysis
- Career pathway recommendations
- Learning roadmap generation
- Progress tracking
- PDF report generation

## Local Development

### Prerequisites

- Python 3.9+
- pip

### Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Create `.env` file:
```bash
cp .env.example .env
```

3. Run the server:
```bash
python run_server.py
```

4. Access the API:
- API: http://localhost:8000
- Docs: http://localhost:8000/docs

## Deployment

### Railway.app

1. Push to GitHub
2. Connect Railway to your repo
3. Set root directory to `backend`
4. Add environment variables from `.env.example`
5. Deploy!

### Environment Variables

Required:
- `SECRET_KEY` - JWT secret key
- `ALGORITHM` - JWT algorithm (HS256)
- `ACCESS_TOKEN_EXPIRE_MINUTES` - Token expiration (30)

Optional:
- `DATABASE_URL` - Database connection string
- `OPENAI_API_KEY` - For AI-enhanced features

## API Documentation

Once running, visit `/docs` for interactive API documentation (Swagger UI).

## Tech Stack

- **Framework:** FastAPI
- **Database:** SQLAlchemy (SQLite/PostgreSQL)
- **Auth:** JWT (python-jose)
- **CV Parsing:** PyPDF2, pdfplumber, python-docx
- **PDF Generation:** ReportLab

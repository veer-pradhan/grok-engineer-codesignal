# Grok-Powered SDR System

A comprehensive Sales Development Representative (SDR) system powered by Grok AI for intelligent lead qualification, personalized outreach, and performance evaluation.

## 🚀 Features

### Core Functionality
- **AI-Powered Lead Qualification**: Automatically assess and score potential leads using Grok's intelligence
- **Personalized Messaging**: Generate customized outreach messages for email, LinkedIn, and cold calls
- **Pipeline Management**: Track leads through defined sales pipeline stages with automated progression
- **Interaction Logging**: Comprehensive activity history and interaction tracking
- **Performance Evaluation**: Built-in framework for testing and optimizing Grok's performance

### User Experience
- **Modern Web Interface**: Intuitive React-based dashboard for sales teams
- **Real-time Updates**: Live pipeline statistics and lead status updates
- **Search & Filtering**: Advanced search capabilities across leads, interactions, and messages
- **Responsive Design**: Works seamlessly on desktop and mobile devices

### Technical Excellence
- **Scalable Architecture**: FastAPI backend with React frontend
- **Robust API Integration**: Comprehensive error handling and response validation for Grok API
- **Database Management**: PostgreSQL with SQLAlchemy ORM for reliable data storage
- **Containerized Deployment**: Docker and docker-compose for easy setup and reproducibility

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Frontend │    │  FastAPI Backend│    │   PostgreSQL    │
│   (Port 3000)   │◄──►│   (Port 8000)   │◄──►│   (Port 5432)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │   Grok API      │
                       │  (api.x.ai)     │
                       └─────────────────┘
```

### Backend (FastAPI)
- **API Routes**: RESTful endpoints for leads, evaluations, scoring, and search
- **Services**: Business logic for lead management, Grok integration, and evaluations
- **Models**: SQLAlchemy models for data persistence
- **Database**: PostgreSQL with automated migrations

### Frontend (React + TypeScript)
- **Pages**: Dashboard, Leads Management, Lead Details, Evaluations, Settings
- **Components**: Reusable UI components with Tailwind CSS styling
- **State Management**: React Query for server state management
- **API Client**: Axios-based client with interceptors for error handling

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose
- Grok API key from X.AI

### 1. Clone and Setup
```bash
git clone <repository-url>
cd grok-engineer-codesignal
```

### 2. Configure Environment
```bash
# Copy environment template
cp backend/env.example backend/.env

# Edit the environment file with your Grok API key
# Replace "INSERT-API-KEY-HERE" with your actual Grok API key
nano backend/.env
```

### 3. Start the Application
```bash
# Start all services
docker-compose up -d

# Check service status
docker-compose ps

# View logs
docker-compose logs -f
```

### 4. Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

### 5. Initialize Data (Optional)
```bash
# Create default scoring criteria
curl -X POST "http://localhost:8000/api/scoring/criteria/defaults"

# Run default evaluations
curl -X POST "http://localhost:8000/api/evaluations/run-defaults"
```

## 📖 User Guide

### Managing Leads

#### Adding New Leads
1. Navigate to the **Leads** page
2. Click **"Add Lead"** button
3. Fill in the lead information:
   - Personal details (name, email, phone)
   - Company information (name, size, industry)
   - Job title and LinkedIn profile
4. Click **"Create Lead"**

#### Lead Qualification
1. Open a lead's detail page
2. Click **"Qualify Lead"** to run AI analysis
3. Review the qualification results:
   - Qualification score (0-100)
   - Recommended pipeline stage
   - Suggested next actions
   - Identified pain points

#### Generating Messages
1. Go to lead details page
2. Click **"Generate Message"**
3. Select message type (Email, LinkedIn, Cold Call Script)
4. Add custom instructions (optional)
5. Review and use the generated content

#### Scoring Leads
1. Configure scoring criteria in **Settings**
2. Use **"Score Lead"** to evaluate based on criteria
3. Review weighted scores and recommendations

### Pipeline Management
- Leads automatically progress through stages based on interactions
- Track conversion rates and pipeline velocity
- Monitor lead distribution across stages

### Performance Evaluation
1. Go to **Evaluations** page
2. Run **"Default Tests"** to evaluate Grok performance
3. Review test results and success rates
4. Analyze response quality and execution times

## 🔧 Configuration

### Grok API Settings
Edit `backend/.env`:
```bash
GROK_API_KEY=your-actual-api-key-here
GROK_API_BASE_URL=https://api.x.ai/v1
```

### Database Configuration
```bash
DATABASE_URL=postgresql://postgres:password@db:5432/sdr_system
```

### Security Settings
```bash
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

## 🛠️ Development

### Development Setup
```bash
# Start development environment
docker-compose -f docker-compose.dev.yml up -d

# Or run services individually:

# Backend development
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload

# Frontend development
cd frontend
npm install
npm run dev
```

### Project Structure
```
grok-engineer-codesignal/
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── main.py         # Application entry point
│   │   ├── config.py       # Configuration settings
│   │   ├── database.py     # Database connection
│   │   ├── models.py       # SQLAlchemy models
│   │   ├── schemas.py      # Pydantic schemas
│   │   ├── routers/        # API route handlers
│   │   └── services/       # Business logic
│   ├── requirements.txt    # Python dependencies
│   └── Dockerfile         # Backend container
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── api/           # API client
│   │   ├── types/         # TypeScript types
│   │   └── App.tsx        # Main application
│   ├── package.json       # Node dependencies
│   └── Dockerfile        # Frontend container
├── docker-compose.yml     # Production setup
├── docker-compose.dev.yml # Development setup
└── README.md             # This file
```

### API Documentation
Once running, visit http://localhost:8000/docs for interactive API documentation.

### Testing
```bash
# Backend tests
cd backend
pytest

# Frontend tests
cd frontend
npm test
```

## 🐛 Troubleshooting

### Common Issues

#### "Service Unhealthy" Error
```bash
# Check service logs
docker-compose logs backend
docker-compose logs frontend
docker-compose logs db

# Restart services
docker-compose restart
```

#### Database Connection Issues
```bash
# Check database status
docker-compose exec db pg_isready -U postgres

# Reset database
docker-compose down -v
docker-compose up -d
```

#### Grok API Issues
1. Verify your API key is correct in `.env`
2. Check API key permissions and quotas
3. Review backend logs for detailed error messages

#### Frontend Not Loading
1. Check if backend is running and healthy
2. Verify API proxy configuration in nginx.conf
3. Clear browser cache and reload

### Performance Optimization

#### Backend Performance
- Monitor API response times in evaluations
- Adjust Grok API parameters (temperature, max_tokens)
- Scale database connections if needed

#### Frontend Performance
- Use React Query caching effectively
- Implement pagination for large datasets
- Optimize bundle size with code splitting

## 🔒 Security Considerations

### Production Deployment
1. **Change default passwords** in environment files
2. **Use strong secret keys** for JWT tokens
3. **Enable HTTPS** with proper SSL certificates
4. **Configure firewall rules** to restrict database access
5. **Monitor API usage** and implement rate limiting
6. **Regularly update dependencies** for security patches

### API Security
- Input validation on all endpoints
- SQL injection prevention with SQLAlchemy ORM
- CORS configuration for frontend-backend communication
- Request size limits and timeout configurations

## 📊 Monitoring & Analytics

### Application Metrics
- Lead conversion rates by pipeline stage
- Grok API response times and success rates
- User engagement and feature usage
- Database performance and query optimization

### Logging
- Application logs available via `docker-compose logs`
- Error tracking and exception monitoring
- API request/response logging for debugging

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create feature branch: `git checkout -b feature/new-feature`
3. Make changes and test thoroughly
4. Commit with descriptive messages
5. Push to your fork and create pull request

### Code Standards
- **Backend**: Follow PEP 8 for Python code
- **Frontend**: Use TypeScript strict mode
- **Documentation**: Update README for new features
- **Testing**: Include tests for new functionality

## 📝 License

This project is developed for demonstration purposes. Please ensure compliance with all relevant terms of service for third-party APIs used.

## 🆘 Support

For technical support or questions:
1. Check the troubleshooting section above
2. Review application logs for error details
3. Consult API documentation at `/docs` endpoint
4. Create an issue in the repository for bugs or feature requests

---

**Built with ❤️ using Grok AI, FastAPI, React, and modern development practices.**
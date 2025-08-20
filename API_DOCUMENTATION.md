# API Documentation

This document provides comprehensive documentation for the Grok-powered SDR System API.

## 🔗 Base URL

- **Local Development**: `http://localhost:8000`
- **Production**: `https://your-domain.com`

## 📋 API Overview

The API is built with FastAPI and provides RESTful endpoints for:
- Lead management and qualification
- Message generation and personalization  
- Performance evaluation and testing
- Scoring criteria configuration
- Search functionality

### Interactive Documentation
- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

## 🔐 Authentication

Currently, the API uses internal authentication. For production deployments, consider implementing:
- API keys for external access
- JWT tokens for user sessions
- OAuth2 for third-party integrations

## 📊 Response Format

All API responses follow a consistent format:

### Success Response
```json
{
  "data": { ... },
  "message": "Success",
  "success": true
}
```

### Error Response
```json
{
  "detail": "Error description",
  "error_code": "ERROR_CODE",
  "success": false
}
```

## 🎯 Endpoints

### Health Check

#### `GET /health`
Check API health status.

**Response:**
```json
{
  "status": "healthy",
  "app": "SDR System",
  "version": "1.0.0"
}
```

---

## 👥 Leads Management

### Get All Leads

#### `GET /api/leads`
Retrieve leads with optional filtering.

**Query Parameters:**
- `skip` (int, optional): Number of records to skip (default: 0)
- `limit` (int, optional): Maximum records to return (default: 100)
- `stage` (string, optional): Filter by pipeline stage
- `search` (string, optional): Search term for name, email, or company

**Response:**
```json
[
  {
    "id": 1,
    "first_name": "John",
    "last_name": "Doe",
    "email": "john@example.com",
    "phone": "+1-555-0123",
    "company_name": "Example Corp",
    "job_title": "VP of Sales",
    "company_size": "100-500",
    "industry": "Technology",
    "company_website": "https://example.com",
    "linkedin_url": "https://linkedin.com/in/johndoe",
    "notes": "High priority lead",
    "lead_score": 8.5,
    "pipeline_stage": "qualified",
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T15:45:00Z"
  }
]
```

### Get Single Lead

#### `GET /api/leads/{lead_id}`
Retrieve a specific lead with interactions and messages.

**Path Parameters:**
- `lead_id` (int): Lead ID

**Response:**
```json
{
  "id": 1,
  "first_name": "John",
  "last_name": "Doe",
  // ... all lead fields
  "interactions": [
    {
      "id": 1,
      "lead_id": 1,
      "interaction_type": "email",
      "subject": "Follow-up on demo",
      "content": "Thanks for your interest...",
      "created_at": "2024-01-15T14:20:00Z"
    }
  ],
  "messages": [
    {
      "id": 1,
      "lead_id": 1,
      "message_type": "email",
      "subject": "Personalized outreach",
      "content": "Hi John, I noticed your company...",
      "created_at": "2024-01-15T12:00:00Z",
      "sent_at": null
    }
  ]
}
```

### Create Lead

#### `POST /api/leads`
Create a new lead.

**Request Body:**
```json
{
  "first_name": "Jane",
  "last_name": "Smith",
  "email": "jane@company.com",
  "phone": "+1-555-0456",
  "company_name": "Tech Innovations",
  "job_title": "CTO",
  "company_size": "50-200",
  "industry": "Software",
  "company_website": "https://techinnovations.com",
  "linkedin_url": "https://linkedin.com/in/janesmith",
  "notes": "Interested in AI solutions"
}
```

**Response:** Lead object (see Get Single Lead)

### Update Lead

#### `PUT /api/leads/{lead_id}`
Update an existing lead.

**Path Parameters:**
- `lead_id` (int): Lead ID

**Request Body:** Partial lead object (only fields to update)

**Response:** Updated lead object

### Delete Lead

#### `DELETE /api/leads/{lead_id}`
Delete a lead and all associated data.

**Path Parameters:**
- `lead_id` (int): Lead ID

**Response:**
```json
{
  "message": "Lead deleted successfully",
  "success": true
}
```

---

## 🤖 AI-Powered Operations

### Qualify Lead

#### `POST /api/leads/{lead_id}/qualify`
Use Grok AI to qualify a lead.

**Path Parameters:**
- `lead_id` (int): Lead ID

**Response:**
```json
{
  "qualification_score": 85,
  "qualification_reasons": [
    "Large company with established budget",
    "Decision maker in technology role",
    "Industry alignment with our solutions"
  ],
  "recommended_stage": "qualified",
  "next_actions": [
    "Schedule discovery call",
    "Send technical documentation",
    "Connect on LinkedIn"
  ],
  "pain_points": [
    "Manual processes causing inefficiency",
    "Difficulty scaling current solution",
    "Need for better analytics"
  ]
}
```

### Score Lead

#### `POST /api/leads/{lead_id}/score`
Score a lead based on defined criteria.

**Path Parameters:**
- `lead_id` (int): Lead ID

**Request Body:**
```json
{
  "lead_id": 1,
  "criteria_ids": [1, 2, 3]  // Optional: specific criteria to use
}
```

**Response:**
```json
{
  "lead_id": 1,
  "total_score": 7.8,
  "criteria_scores": {
    "Company Size": 8.5,
    "Job Title Authority": 9.0,
    "Industry Fit": 6.5,
    "Engagement Level": 7.2
  },
  "recommendations": [
    "High priority lead - schedule call within 24 hours",
    "Technical decision maker - prepare detailed demo",
    "Large company - involve enterprise sales team"
  ]
}
```

### Generate Message

#### `POST /api/leads/{lead_id}/messages/generate`
Generate personalized message using Grok AI.

**Path Parameters:**
- `lead_id` (int): Lead ID

**Request Body:**
```json
{
  "message_type": "email",  // email, linkedin, cold_call_script
  "custom_instructions": "Focus on ROI and cost savings"
}
```

**Response:**
```json
{
  "id": 5,
  "lead_id": 1,
  "message_type": "email",
  "subject": "Streamline Your Sales Process - 40% Efficiency Gain",
  "content": "Hi John,\n\nI noticed Example Corp has been expanding rapidly in the tech space. With growth comes the challenge of scaling sales processes efficiently.\n\nOur AI-powered SDR platform has helped similar companies like yours achieve:\n• 40% increase in lead qualification efficiency\n• 60% reduction in manual follow-up tasks\n• 25% higher conversion rates\n\nWould you be open to a 15-minute call this week to explore how we could help Example Corp optimize your sales pipeline?\n\nBest regards,\n[Your Name]",
  "prompt_used": "Generated email message with custom instructions: Focus on ROI and cost savings",
  "created_at": "2024-01-15T16:30:00Z",
  "sent_at": null
}
```

---

## 💬 Interactions Management

### Add Interaction

#### `POST /api/leads/{lead_id}/interactions`
Log an interaction with a lead.

**Path Parameters:**
- `lead_id` (int): Lead ID

**Request Body:**
```json
{
  "interaction_type": "call",  // email, call, meeting, linkedin, note
  "subject": "Discovery call",
  "content": "30-minute discovery call. Key points discussed: current challenges with lead qualification, budget allocated for Q2, decision timeline is 6-8 weeks."
}
```

**Response:**
```json
{
  "id": 3,
  "lead_id": 1,
  "interaction_type": "call",
  "subject": "Discovery call",
  "content": "30-minute discovery call. Key points discussed...",
  "created_at": "2024-01-15T14:00:00Z"
}
```

### Get Lead Interactions

#### `GET /api/leads/{lead_id}/interactions`
Get all interactions for a specific lead.

**Path Parameters:**
- `lead_id` (int): Lead ID

**Response:** Array of interaction objects

### Get Lead Messages

#### `GET /api/leads/{lead_id}/messages`
Get all generated messages for a specific lead.

**Path Parameters:**
- `lead_id` (int): Lead ID

**Response:** Array of message objects

---

## 📊 Pipeline Analytics

### Get Pipeline Statistics

#### `GET /api/leads/stats/pipeline`
Get lead distribution across pipeline stages.

**Response:**
```json
{
  "new": 15,
  "qualified": 8,
  "contacted": 12,
  "meeting_scheduled": 5,
  "proposal_sent": 3,
  "negotiation": 2,
  "closed_won": 4,
  "closed_lost": 6
}
```

---

## ⚡ Performance Evaluation

### Run Evaluations

#### `POST /api/evaluations/run`
Run custom evaluation test cases.

**Request Body:**
```json
{
  "test_cases": [
    {
      "test_name": "Lead Qualification Test",
      "prompt_template": "Qualify lead for enterprise software sales",
      "test_input": "Lead: John Smith, VP Engineering at Microsoft...",
      "expected_output": "High qualification score expected"
    }
  ]
}
```

**Response:** Array of evaluation results

### Run Default Evaluations

#### `POST /api/evaluations/run-defaults`
Run predefined evaluation test cases.

**Response:**
```json
[
  {
    "id": 1,
    "test_name": "Lead Qualification - High Value Prospect",
    "prompt_template": "Qualify lead for enterprise software sales",
    "test_input": "Lead Information: John Smith, VP of Engineering at Microsoft...",
    "expected_output": "{\"qualification_score\": 85}",
    "actual_output": "{\"qualification_score\": 87, \"recommended_stage\": \"qualified\"}",
    "score": 0.95,
    "passed": true,
    "created_at": "2024-01-15T10:00:00Z",
    "execution_time_ms": 1250
  }
]
```

### Get Evaluations

#### `GET /api/evaluations`
Retrieve evaluation results with optional filtering.

**Query Parameters:**
- `skip` (int, optional): Number of records to skip
- `limit` (int, optional): Maximum records to return
- `test_name` (string, optional): Filter by test name

**Response:** Array of evaluation objects

### Get Evaluation Summary

#### `GET /api/evaluations/summary`
Get evaluation summary statistics.

**Query Parameters:**
- `limit` (int, optional): Limit to recent N evaluations

**Response:**
```json
{
  "total_tests": 25,
  "passed_tests": 22,
  "failed_tests": 3,
  "average_score": 0.87,
  "average_execution_time_ms": 1450.5
}
```

---

## 🎯 Scoring Configuration

### Get Scoring Criteria

#### `GET /api/scoring/criteria`
Get all scoring criteria.

**Query Parameters:**
- `skip` (int, optional): Records to skip
- `limit` (int, optional): Maximum records
- `active_only` (bool, optional): Only active criteria (default: true)

**Response:**
```json
[
  {
    "id": 1,
    "name": "Company Size",
    "description": "Score based on company size and potential budget",
    "weight": 3.0,
    "criteria_rules": "{\"enterprise\": 10, \"large\": 8, \"medium\": 6, \"small\": 3}",
    "created_at": "2024-01-10T09:00:00Z",
    "updated_at": "2024-01-10T09:00:00Z",
    "is_active": true
  }
]
```

### Create Scoring Criteria

#### `POST /api/scoring/criteria`
Create new scoring criteria.

**Request Body:**
```json
{
  "name": "Geographic Location",
  "description": "Score based on target geographic markets",
  "weight": 1.5,
  "criteria_rules": "{\"north_america\": 10, \"europe\": 8, \"asia_pacific\": 6, \"other\": 3}"
}
```

### Update Scoring Criteria

#### `PUT /api/scoring/criteria/{criteria_id}`
Update existing scoring criteria.

**Path Parameters:**
- `criteria_id` (int): Criteria ID

**Request Body:** Scoring criteria object

### Create Default Criteria

#### `POST /api/scoring/criteria/defaults`
Create default scoring criteria set.

**Response:**
```json
{
  "message": "Created 4 default scoring criteria",
  "criteria": [
    // Array of created criteria objects
  ]
}
```

---

## 🔍 Search

### Search Leads and Data

#### `GET /api/search`
Search across leads, interactions, and messages.

**Query Parameters:**
- `query` (string): Search term
- `limit` (int, optional): Maximum results (default: 10)

**Response:**
```json
[
  {
    "id": 1,
    "type": "lead",
    "title": "John Doe - Example Corp",
    "content": "VP of Sales at Example Corp",
    "score": 1.0
  },
  {
    "id": 3,
    "type": "interaction",
    "title": "Interaction with Jane Smith",
    "content": "Follow-up call discussing implementation timeline...",
    "score": 0.8
  }
]
```

### Advanced Search

#### `POST /api/search`
Advanced search with filters.

**Request Body:**
```json
{
  "query": "enterprise software",
  "filters": {
    "type": "lead",
    "stage": "qualified"
  },
  "limit": 20
}
```

---

## 📝 Error Codes

| Code | Description |
|------|-------------|
| `LEAD_NOT_FOUND` | Lead with specified ID not found |
| `GROK_API_ERROR` | Error communicating with Grok API |
| `INVALID_CREDENTIALS` | Authentication failed |
| `VALIDATION_ERROR` | Request data validation failed |
| `RATE_LIMIT_EXCEEDED` | API rate limit exceeded |
| `DATABASE_ERROR` | Database operation failed |

## 🔄 Rate Limiting

- **Default Limit**: 100 requests per minute per IP
- **Burst Limit**: Up to 20 requests in a 10-second window
- **Headers**: Rate limit info included in response headers

## 📋 Example Usage

### Python Client Example
```python
import requests

BASE_URL = "http://localhost:8000/api"

# Create a new lead
lead_data = {
    "first_name": "Alice",
    "last_name": "Johnson",
    "email": "alice@startup.com",
    "company_name": "AI Startup",
    "job_title": "Founder",
    "industry": "Technology"
}

response = requests.post(f"{BASE_URL}/leads", json=lead_data)
lead = response.json()
lead_id = lead["id"]

# Qualify the lead
qualification = requests.post(f"{BASE_URL}/leads/{lead_id}/qualify")
print(f"Qualification score: {qualification.json()['qualification_score']}")

# Generate personalized email
message_request = {
    "message_type": "email",
    "custom_instructions": "Emphasize innovation and growth potential"
}
message = requests.post(
    f"{BASE_URL}/leads/{lead_id}/messages/generate", 
    json=message_request
)
print(f"Generated message: {message.json()['content']}")
```

### JavaScript/Node.js Example
```javascript
const axios = require('axios');

const API_BASE = 'http://localhost:8000/api';

async function createAndQualifyLead() {
  try {
    // Create lead
    const leadData = {
      first_name: 'Bob',
      last_name: 'Wilson',
      email: 'bob@enterprise.com',
      company_name: 'Enterprise Solutions',
      job_title: 'CTO'
    };
    
    const { data: lead } = await axios.post(`${API_BASE}/leads`, leadData);
    console.log(`Created lead: ${lead.id}`);
    
    // Qualify lead
    const { data: qualification } = await axios.post(
      `${API_BASE}/leads/${lead.id}/qualify`
    );
    console.log(`Qualification score: ${qualification.qualification_score}`);
    
    // Generate LinkedIn message
    const messageRequest = {
      message_type: 'linkedin',
      custom_instructions: 'Keep it brief and professional'
    };
    
    const { data: message } = await axios.post(
      `${API_BASE}/leads/${lead.id}/messages/generate`,
      messageRequest
    );
    console.log(`Generated message: ${message.content}`);
    
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

createAndQualifyLead();
```

---

For more examples and detailed integration guides, see the [main documentation](README.md).

import json
import logging
from typing import Dict, Any, Optional, List
import httpx
from app.config import settings
from app.schemas import GrokRequest, GrokResponse

logger = logging.getLogger(__name__)


class GrokService:
    """Service for interacting with Grok API."""
    
    def __init__(self):
        self.api_key = settings.grok_api_key
        self.base_url = settings.grok_api_base_url
        self.client = httpx.AsyncClient(
            timeout=30.0,
            headers={
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }
        )
    
    async def __aenter__(self):
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.client.aclose()
    
    async def generate_completion(
        self,
        prompt: str,
        max_tokens: int = 1000,
        temperature: float = 0.7,
        model: str = "grok-beta"
    ) -> GrokResponse:
        """Generate completion using Grok API."""
        try:
            payload = {
                "model": model,
                "messages": [
                    {"role": "user", "content": prompt}
                ],
                "max_tokens": max_tokens,
                "temperature": temperature
            }
            
            logger.info(f"Sending request to Grok API: {self.base_url}/chat/completions")
            
            response = await self.client.post(
                f"{self.base_url}/chat/completions",
                json=payload
            )
            
            response.raise_for_status()
            data = response.json()
            
            content = data["choices"][0]["message"]["content"]
            usage = data.get("usage", {})
            
            return GrokResponse(
                content=content,
                usage=usage,
                model=data.get("model", model)
            )
            
        except httpx.HTTPStatusError as e:
            logger.error(f"HTTP error from Grok API: {e.response.status_code} - {e.response.text}")
            raise Exception(f"Grok API error: {e.response.status_code}")
        except httpx.RequestError as e:
            logger.error(f"Request error to Grok API: {str(e)}")
            raise Exception("Failed to connect to Grok API")
        except Exception as e:
            logger.error(f"Unexpected error calling Grok API: {str(e)}")
            raise Exception("Unexpected error with Grok API")
    
    async def qualify_lead(self, lead_data: Dict[str, Any]) -> Dict[str, Any]:
        """Qualify a lead using Grok."""
        prompt = self._build_qualification_prompt(lead_data)
        
        response = await self.generate_completion(
            prompt=prompt,
            max_tokens=500,
            temperature=0.3
        )
        
        try:
            # Parse JSON response
            result = json.loads(response.content)
            return result
        except json.JSONDecodeError:
            # Fallback: extract key information from text response
            return self._parse_qualification_text(response.content)
    
    async def generate_personalized_message(
        self,
        lead_data: Dict[str, Any],
        message_type: str,
        custom_instructions: Optional[str] = None
    ) -> str:
        """Generate personalized outreach message."""
        prompt = self._build_message_prompt(lead_data, message_type, custom_instructions)
        
        response = await self.generate_completion(
            prompt=prompt,
            max_tokens=800,
            temperature=0.7
        )
        
        return response.content.strip()
    
    async def score_lead(
        self,
        lead_data: Dict[str, Any],
        scoring_criteria: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Score a lead based on criteria."""
        prompt = self._build_scoring_prompt(lead_data, scoring_criteria)
        
        response = await self.generate_completion(
            prompt=prompt,
            max_tokens=600,
            temperature=0.2
        )
        
        try:
            result = json.loads(response.content)
            return result
        except json.JSONDecodeError:
            return self._parse_scoring_text(response.content, scoring_criteria)
    
    def _build_qualification_prompt(self, lead_data: Dict[str, Any]) -> str:
        """Build prompt for lead qualification."""
        return f"""
You are an expert Sales Development Representative (SDR) AI assistant. Analyze the following lead information and provide a qualification assessment.

Lead Information:
- Name: {lead_data.get('first_name', '')} {lead_data.get('last_name', '')}
- Email: {lead_data.get('email', '')}
- Company: {lead_data.get('company_name', '')}
- Job Title: {lead_data.get('job_title', 'N/A')}
- Industry: {lead_data.get('industry', 'N/A')}
- Company Size: {lead_data.get('company_size', 'N/A')}
- Website: {lead_data.get('company_website', 'N/A')}

Please provide your assessment in the following JSON format:
{{
    "qualification_score": <number between 0-100>,
    "qualification_reasons": [
        "reason 1",
        "reason 2"
    ],
    "recommended_stage": "<new|qualified|contacted>",
    "next_actions": [
        "action 1",
        "action 2"
    ],
    "pain_points": [
        "potential pain point 1",
        "potential pain point 2"
    ]
}}

Focus on factors like company size, industry fit, job title relevance, and potential budget/decision-making authority.
"""
    
    def _build_message_prompt(
        self,
        lead_data: Dict[str, Any],
        message_type: str,
        custom_instructions: Optional[str] = None
    ) -> str:
        """Build prompt for personalized message generation."""
        base_prompt = f"""
You are an expert Sales Development Representative (SDR) writing personalized outreach messages. 

Lead Information:
- Name: {lead_data.get('first_name', '')} {lead_data.get('last_name', '')}
- Company: {lead_data.get('company_name', '')}
- Job Title: {lead_data.get('job_title', 'N/A')}
- Industry: {lead_data.get('industry', 'N/A')}
- Company Size: {lead_data.get('company_size', 'N/A')}
- Website: {lead_data.get('company_website', 'N/A')}

Message Type: {message_type}

Write a personalized {message_type} message that:
1. Addresses the lead by name
2. Shows you've researched their company/role
3. Identifies a relevant pain point or opportunity
4. Offers clear value proposition
5. Has a specific call-to-action
6. Maintains a professional but friendly tone
7. Keeps it concise (under 150 words for email, under 300 characters for LinkedIn)
"""
        
        if custom_instructions:
            base_prompt += f"\n\nAdditional Instructions: {custom_instructions}"
        
        base_prompt += "\n\nGenerate ONLY the message content, no subject line or signatures unless specifically requested."
        
        return base_prompt
    
    def _build_scoring_prompt(
        self,
        lead_data: Dict[str, Any],
        scoring_criteria: List[Dict[str, Any]]
    ) -> str:
        """Build prompt for lead scoring."""
        criteria_text = "\n".join([
            f"- {criteria['name']} (Weight: {criteria['weight']}): {criteria['description']}"
            for criteria in scoring_criteria
        ])
        
        return f"""
You are an expert Sales Development Representative (SDR) AI assistant. Score the following lead based on the provided criteria.

Lead Information:
- Name: {lead_data.get('first_name', '')} {lead_data.get('last_name', '')}
- Email: {lead_data.get('email', '')}
- Company: {lead_data.get('company_name', '')}
- Job Title: {lead_data.get('job_title', 'N/A')}
- Industry: {lead_data.get('industry', 'N/A')}
- Company Size: {lead_data.get('company_size', 'N/A')}
- Website: {lead_data.get('company_website', 'N/A')}

Scoring Criteria:
{criteria_text}

Please provide your assessment in the following JSON format:
{{
    "total_score": <calculated weighted total score>,
    "criteria_scores": {{
        "criteria_name_1": <score for this criteria>,
        "criteria_name_2": <score for this criteria>
    }},
    "recommendations": [
        "recommendation 1",
        "recommendation 2"
    ]
}}

Score each criteria from 0-10, then calculate the weighted total score.
"""
    
    def _parse_qualification_text(self, text: str) -> Dict[str, Any]:
        """Parse qualification assessment from text response."""
        # Fallback parsing for non-JSON responses
        return {
            "qualification_score": 50,
            "qualification_reasons": ["Analysis pending"],
            "recommended_stage": "new",
            "next_actions": ["Manual review required"],
            "pain_points": ["To be determined"]
        }
    
    def _parse_scoring_text(
        self,
        text: str,
        scoring_criteria: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Parse scoring assessment from text response."""
        # Fallback parsing for non-JSON responses
        criteria_scores = {criteria['name']: 5.0 for criteria in scoring_criteria}
        total_score = sum(criteria_scores.values()) / len(criteria_scores) if criteria_scores else 0.0
        
        return {
            "total_score": total_score,
            "criteria_scores": criteria_scores,
            "recommendations": ["Manual review required"]
        }

import json
import logging
import time
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session

from app.models import Evaluation
from app.schemas import EvaluationCreate, EvaluationSummary
from app.services.grok_service import GrokService

logger = logging.getLogger(__name__)


class EvaluationService:
    """Service for evaluating Grok performance."""
    
    def __init__(self, db: Session):
        self.db = db
    
    async def run_evaluation(self, test_cases: List[EvaluationCreate]) -> List[Evaluation]:
        """Run evaluation test cases."""
        results = []
        
        async with GrokService() as grok:
            for test_case in test_cases:
                start_time = time.time()
                
                try:
                    # Generate response using Grok
                    response = await grok.generate_completion(
                        prompt=test_case.test_input,
                        max_tokens=1000,
                        temperature=0.7
                    )
                    actual_output = response.content
                    
                    execution_time_ms = int((time.time() - start_time) * 1000)
                    
                    # Calculate score if expected output provided
                    score = None
                    passed = False
                    
                    if test_case.expected_output:
                        score = self._calculate_similarity_score(
                            test_case.expected_output,
                            actual_output
                        )
                        passed = score >= 0.7  # 70% threshold
                    
                    # Create evaluation record
                    evaluation = Evaluation(
                        test_name=test_case.test_name,
                        prompt_template=test_case.prompt_template,
                        test_input=test_case.test_input,
                        expected_output=test_case.expected_output,
                        actual_output=actual_output,
                        score=score,
                        passed=1 if passed else 0,
                        execution_time_ms=execution_time_ms
                    )
                    
                    self.db.add(evaluation)
                    results.append(evaluation)
                    
                    logger.info(f"Completed evaluation: {test_case.test_name} - Score: {score}")
                    
                except Exception as e:
                    logger.error(f"Error in evaluation {test_case.test_name}: {str(e)}")
                    
                    # Create failed evaluation record
                    evaluation = Evaluation(
                        test_name=test_case.test_name,
                        prompt_template=test_case.prompt_template,
                        test_input=test_case.test_input,
                        expected_output=test_case.expected_output,
                        actual_output=f"ERROR: {str(e)}",
                        score=0.0,
                        passed=0,
                        execution_time_ms=int((time.time() - start_time) * 1000)
                    )
                    
                    self.db.add(evaluation)
                    results.append(evaluation)
        
        self.db.commit()
        
        # Refresh all objects
        for evaluation in results:
            self.db.refresh(evaluation)
        
        return results
    
    def get_evaluation_summary(self, limit: Optional[int] = None) -> EvaluationSummary:
        """Get evaluation summary statistics."""
        query = self.db.query(Evaluation)
        if limit:
            query = query.order_by(Evaluation.created_at.desc()).limit(limit)
        
        evaluations = query.all()
        
        if not evaluations:
            return EvaluationSummary(
                total_tests=0,
                passed_tests=0,
                failed_tests=0
            )
        
        total_tests = len(evaluations)
        passed_tests = sum(1 for e in evaluations if e.passed)
        failed_tests = total_tests - passed_tests
        
        # Calculate average score (only for tests with scores)
        scored_tests = [e for e in evaluations if e.score is not None]
        average_score = sum(e.score for e in scored_tests) / len(scored_tests) if scored_tests else None
        
        # Calculate average execution time
        timed_tests = [e for e in evaluations if e.execution_time_ms is not None]
        average_execution_time_ms = (
            sum(e.execution_time_ms for e in timed_tests) / len(timed_tests) 
            if timed_tests else None
        )
        
        return EvaluationSummary(
            total_tests=total_tests,
            passed_tests=passed_tests,
            failed_tests=failed_tests,
            average_score=average_score,
            average_execution_time_ms=average_execution_time_ms
        )
    
    def get_evaluations(
        self,
        skip: int = 0,
        limit: int = 100,
        test_name: Optional[str] = None
    ) -> List[Evaluation]:
        """Get evaluation results with optional filtering."""
        query = self.db.query(Evaluation)
        
        if test_name:
            query = query.filter(Evaluation.test_name.ilike(f"%{test_name}%"))
        
        return query.order_by(Evaluation.created_at.desc()).offset(skip).limit(limit).all()
    
    def delete_evaluation(self, evaluation_id: int) -> bool:
        """Delete an evaluation record."""
        evaluation = self.db.query(Evaluation).filter(Evaluation.id == evaluation_id).first()
        if not evaluation:
            return False
        
        self.db.delete(evaluation)
        self.db.commit()
        return True
    
    def _calculate_similarity_score(self, expected: str, actual: str) -> float:
        """Calculate similarity score between expected and actual output."""
        # Simple similarity calculation - can be enhanced with more sophisticated methods
        expected_lower = expected.lower().strip()
        actual_lower = actual.lower().strip()
        
        # Exact match
        if expected_lower == actual_lower:
            return 1.0
        
        # Check if actual contains expected key phrases
        expected_words = set(expected_lower.split())
        actual_words = set(actual_lower.split())
        
        if len(expected_words) == 0:
            return 0.0
        
        # Calculate word overlap
        common_words = expected_words.intersection(actual_words)
        similarity = len(common_words) / len(expected_words)
        
        # Bonus for length similarity
        length_ratio = min(len(actual), len(expected)) / max(len(actual), len(expected))
        
        # Weighted score
        final_score = (similarity * 0.8) + (length_ratio * 0.2)
        
        return min(final_score, 1.0)
    
    async def run_default_evaluations(self) -> List[Evaluation]:
        """Run a set of default evaluation test cases."""
        default_tests = [
            EvaluationCreate(
                test_name="Lead Qualification - High Value Prospect",
                prompt_template="Qualify lead for enterprise software sales",
                test_input="""
You are an expert Sales Development Representative (SDR) AI assistant. Analyze the following lead information and provide a qualification assessment.

Lead Information:
- Name: John Smith
- Email: john.smith@microsoft.com
- Company: Microsoft
- Job Title: VP of Engineering
- Industry: Technology
- Company Size: 100,000+
- Website: microsoft.com

Please provide your assessment in the following JSON format with a qualification score between 0-100.
""",
                expected_output='{"qualification_score": 85}'
            ),
            EvaluationCreate(
                test_name="Lead Qualification - Low Value Prospect",
                prompt_template="Qualify lead for enterprise software sales",
                test_input="""
You are an expert Sales Development Representative (SDR) AI assistant. Analyze the following lead information and provide a qualification assessment.

Lead Information:
- Name: Jane Doe
- Email: jane@smallstartup.com
- Company: Small Startup
- Job Title: Intern
- Industry: Unknown
- Company Size: 1-10
- Website: N/A

Please provide your assessment in the following JSON format with a qualification score between 0-100.
""",
                expected_output='{"qualification_score": 25}'
            ),
            EvaluationCreate(
                test_name="Email Generation - Enterprise Prospect",
                prompt_template="Generate personalized email for enterprise prospect",
                test_input="""
Write a personalized email message for:
- Name: Sarah Johnson
- Company: Amazon
- Job Title: Director of Operations
- Industry: E-commerce

Keep it under 150 words, professional tone, focus on operational efficiency.
""",
                expected_output="Hi Sarah"
            ),
            EvaluationCreate(
                test_name="LinkedIn Message Generation",
                prompt_template="Generate personalized LinkedIn message",
                test_input="""
Write a personalized LinkedIn message for:
- Name: Mike Chen
- Company: Google
- Job Title: Product Manager
- Industry: Technology

Keep it under 300 characters, mention their company and role.
""",
                expected_output="Hi Mike"
            ),
            EvaluationCreate(
                test_name="Lead Scoring - Technology Company",
                prompt_template="Score lead based on criteria",
                test_input="""
Score this lead based on company size, job title authority, and industry fit:
- Name: David Wilson
- Company: Salesforce
- Job Title: CTO
- Industry: Software
- Company Size: 10,000+

Provide scores from 0-10 for each criteria and total weighted score.
""",
                expected_output="total_score"
            )
        ]
        
        return await self.run_evaluation(default_tests)

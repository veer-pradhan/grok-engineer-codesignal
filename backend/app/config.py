import os
from typing import Optional
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings."""
    
    # Database
    database_url: str = "sqlite:///./sdr_system.db"
    
    # Grok API
    grok_api_key: str = "INSERT-API-KEY-HERE"
    grok_api_base_url: str = "https://api.x.ai/v1"
    
    # Security
    secret_key: str = "your-secret-key-here"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    
    # App
    app_name: str = "SDR System"
    debug: bool = False
    
    class Config:
        env_file = ".env"


settings = Settings()

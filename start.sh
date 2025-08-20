#!/bin/bash

# Grok-powered SDR System Startup Script
# This script helps you get started quickly with the SDR system

set -e

echo "🚀 Starting Grok-powered SDR System..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    echo "Visit: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    echo "Visit: https://docs.docker.com/compose/install/"
    exit 1
fi

# Check if .env file exists
if [ ! -f "backend/.env" ]; then
    echo "⚙️ Creating environment configuration..."
    cp backend/env.example backend/.env
    echo "📝 Please edit backend/.env with your Grok API key:"
    echo "   - Replace 'INSERT-API-KEY-HERE' with your actual Grok API key"
    echo "   - You can get a Grok API key from: https://x.ai/"
    echo ""
    read -p "Press Enter after updating your API key, or Ctrl+C to exit..."
fi

# Start the services
echo "🏗️ Building and starting services..."
docker-compose up -d --build

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 10

# Check service health
echo "🏥 Checking service health..."
BACKEND_HEALTH=$(curl -s http://localhost:8000/health 2>/dev/null || echo "unhealthy")
FRONTEND_HEALTH=$(curl -s http://localhost:3000/health 2>/dev/null || echo "unhealthy")

if [[ $BACKEND_HEALTH == *"healthy"* ]]; then
    echo "✅ Backend service is healthy"
else
    echo "❌ Backend service is not responding"
    echo "   Check logs with: docker-compose logs backend"
fi

if [[ $FRONTEND_HEALTH == *"healthy"* ]]; then
    echo "✅ Frontend service is healthy"
else
    echo "❌ Frontend service is not responding"
    echo "   Check logs with: docker-compose logs frontend"
fi

# Initialize default data
echo "📊 Setting up default data..."
echo "Creating default scoring criteria..."
curl -s -X POST "http://localhost:8000/api/scoring/criteria/defaults" > /dev/null 2>&1 || echo "⚠️ Could not create default criteria (this is normal on first run)"

echo ""
echo "🎉 SDR System is ready!"
echo ""
echo "📱 Access the application:"
echo "   • Frontend: http://localhost:3000"
echo "   • Backend API: http://localhost:8000"
echo "   • API Documentation: http://localhost:8000/docs"
echo ""
echo "🛠️ Useful commands:"
echo "   • View logs: docker-compose logs -f"
echo "   • Stop services: docker-compose down"
echo "   • Restart: docker-compose restart"
echo "   • Update: docker-compose pull && docker-compose up -d --build"
echo ""
echo "📚 Documentation:"
echo "   • User Guide: README.md"
echo "   • API Reference: API_DOCUMENTATION.md"
echo "   • Deployment Guide: DEPLOYMENT.md"
echo ""
echo "Happy selling with AI! 🤖💼"

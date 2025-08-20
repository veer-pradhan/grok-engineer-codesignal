# Deployment Guide

This guide covers deploying the Grok-powered SDR System in different environments.

## 🚀 Quick Deployment with Docker

### Prerequisites
- Docker 20.10+ and Docker Compose 2.0+
- Grok API key from X.AI
- 4GB+ RAM and 2+ CPU cores recommended

### 1. Environment Setup

```bash
# Clone the repository
git clone <repository-url>
cd grok-engineer-codesignal

# Copy environment template
cp backend/env.example backend/.env

# Edit with your Grok API key
nano backend/.env
```

Required environment variables:
```bash
GROK_API_KEY=your-actual-grok-api-key
DATABASE_URL=postgresql://postgres:password@db:5432/sdr_system
SECRET_KEY=change-this-in-production
```

### 2. Start Services

```bash
# Production deployment
docker-compose up -d

# Development deployment with hot reload
docker-compose -f docker-compose.dev.yml up -d
```

### 3. Verify Deployment

```bash
# Check service status
docker-compose ps

# Test health endpoints
curl http://localhost:8000/health
curl http://localhost:3000/health

# Access application
open http://localhost:3000
```

## 🏭 Production Deployment

### Cloud Deployment Options

#### AWS EC2 / Digital Ocean / Google Cloud VM

1. **Launch VM Instance**
   - Ubuntu 22.04 LTS
   - Minimum: 2 vCPU, 4GB RAM, 20GB SSD
   - Recommended: 4 vCPU, 8GB RAM, 50GB SSD

2. **Install Dependencies**
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Logout and login to refresh group membership
```

3. **Deploy Application**
```bash
# Clone repository
git clone <repository-url>
cd grok-engineer-codesignal

# Configure environment
cp backend/env.example backend/.env
nano backend/.env

# Start services
docker-compose up -d

# Enable automatic restart
sudo systemctl enable docker
```

4. **Setup Reverse Proxy (Nginx)**
```bash
# Install Nginx
sudo apt install nginx -y

# Configure Nginx
sudo nano /etc/nginx/sites-available/sdr-system
```

Nginx configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api/ {
        proxy_pass http://localhost:8000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/sdr-system /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

5. **SSL Certificate (Let's Encrypt)**
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### Docker Swarm Deployment

1. **Initialize Swarm**
```bash
docker swarm init
```

2. **Create Stack File** (`docker-stack.yml`)
```yaml
version: '3.8'

services:
  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: sdr_system
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    deploy:
      replicas: 1
      restart_policy:
        condition: on-failure

  backend:
    image: your-registry/sdr-backend:latest
    environment:
      DATABASE_URL: postgresql://postgres:password@db:5432/sdr_system
      GROK_API_KEY: ${GROK_API_KEY}
    deploy:
      replicas: 2
      restart_policy:
        condition: on-failure
    depends_on:
      - db

  frontend:
    image: your-registry/sdr-frontend:latest
    ports:
      - "80:80"
    deploy:
      replicas: 2
      restart_policy:
        condition: on-failure
    depends_on:
      - backend

volumes:
  postgres_data:
```

3. **Deploy Stack**
```bash
docker stack deploy -c docker-stack.yml sdr-system
```

### Kubernetes Deployment

1. **Create Namespace**
```yaml
# namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: sdr-system
```

2. **Database Deployment**
```yaml
# postgres.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: postgres
  namespace: sdr-system
spec:
  replicas: 1
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
      - name: postgres
        image: postgres:15-alpine
        env:
        - name: POSTGRES_DB
          value: sdr_system
        - name: POSTGRES_USER
          value: postgres
        - name: POSTGRES_PASSWORD
          value: password
        ports:
        - containerPort: 5432
        volumeMounts:
        - name: postgres-storage
          mountPath: /var/lib/postgresql/data
      volumes:
      - name: postgres-storage
        persistentVolumeClaim:
          claimName: postgres-pvc
---
apiVersion: v1
kind: Service
metadata:
  name: postgres
  namespace: sdr-system
spec:
  selector:
    app: postgres
  ports:
  - port: 5432
```

3. **Backend Deployment**
```yaml
# backend.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend
  namespace: sdr-system
spec:
  replicas: 3
  selector:
    matchLabels:
      app: backend
  template:
    metadata:
      labels:
        app: backend
    spec:
      containers:
      - name: backend
        image: your-registry/sdr-backend:latest
        env:
        - name: DATABASE_URL
          value: postgresql://postgres:password@postgres:5432/sdr_system
        - name: GROK_API_KEY
          valueFrom:
            secretKeyRef:
              name: grok-secret
              key: api-key
        ports:
        - containerPort: 8000
---
apiVersion: v1
kind: Service
metadata:
  name: backend
  namespace: sdr-system
spec:
  selector:
    app: backend
  ports:
  - port: 8000
```

4. **Frontend Deployment**
```yaml
# frontend.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: frontend
  namespace: sdr-system
spec:
  replicas: 3
  selector:
    matchLabels:
      app: frontend
  template:
    metadata:
      labels:
        app: frontend
    spec:
      containers:
      - name: frontend
        image: your-registry/sdr-frontend:latest
        ports:
        - containerPort: 80
---
apiVersion: v1
kind: Service
metadata:
  name: frontend
  namespace: sdr-system
spec:
  selector:
    app: frontend
  ports:
  - port: 80
  type: LoadBalancer
```

## 🔧 Configuration Management

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `GROK_API_KEY` | Your Grok API key | `INSERT-API-KEY-HERE` | Yes |
| `GROK_API_BASE_URL` | Grok API endpoint | `https://api.x.ai/v1` | No |
| `DATABASE_URL` | PostgreSQL connection string | SQLite fallback | No |
| `SECRET_KEY` | JWT signing key | Development key | Yes (Production) |
| `ALGORITHM` | JWT algorithm | `HS256` | No |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Token expiration | `30` | No |

### Secrets Management

#### Docker Secrets
```bash
# Create secrets
echo "your-grok-api-key" | docker secret create grok_api_key -
echo "your-secret-key" | docker secret create jwt_secret -

# Update docker-compose.yml
services:
  backend:
    secrets:
      - grok_api_key
      - jwt_secret

secrets:
  grok_api_key:
    external: true
  jwt_secret:
    external: true
```

#### Kubernetes Secrets
```bash
# Create secret
kubectl create secret generic grok-secret \
  --from-literal=api-key=your-grok-api-key \
  --namespace=sdr-system
```

## 📊 Monitoring & Logging

### Health Checks
```bash
# Application health
curl http://localhost:8000/health
curl http://localhost:3000/health

# Database health
docker-compose exec db pg_isready -U postgres
```

### Logs
```bash
# View all logs
docker-compose logs -f

# Specific service logs
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f db

# With timestamps
docker-compose logs -f -t backend
```

### Monitoring Setup

#### Prometheus + Grafana
```yaml
# monitoring/docker-compose.yml
version: '3.8'

services:
  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana_data:/var/lib/grafana

volumes:
  grafana_data:
```

## 🛡️ Security Hardening

### Database Security
```bash
# Change default passwords
export POSTGRES_PASSWORD=$(openssl rand -base64 32)

# Enable SSL
# Update DATABASE_URL with sslmode=require
```

### API Security
```bash
# Generate strong secret key
export SECRET_KEY=$(openssl rand -base64 64)

# Enable rate limiting (nginx)
# Add to nginx config:
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;

location /api/ {
    limit_req zone=api burst=20;
    # ... other config
}
```

### Container Security
```dockerfile
# Use non-root user in Dockerfiles
RUN adduser --disabled-password --gecos '' appuser
USER appuser

# Scan images for vulnerabilities
docker scan your-image:tag
```

## 🔄 Backup & Recovery

### Database Backup
```bash
# Create backup
docker-compose exec db pg_dump -U postgres sdr_system > backup.sql

# Automated backup script
#!/bin/bash
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
docker-compose exec db pg_dump -U postgres sdr_system > "${BACKUP_DIR}/sdr_backup_${DATE}.sql"

# Keep only last 7 days
find ${BACKUP_DIR} -name "sdr_backup_*.sql" -mtime +7 -delete
```

### Database Restore
```bash
# Restore from backup
docker-compose exec -T db psql -U postgres sdr_system < backup.sql
```

### Volume Backup
```bash
# Backup PostgreSQL data volume
docker run --rm -v sdr-system_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres_data.tar.gz -C /data .

# Restore volume
docker run --rm -v sdr-system_postgres_data:/data -v $(pwd):/backup alpine tar xzf /backup/postgres_data.tar.gz -C /data
```

## 🚨 Troubleshooting

### Common Deployment Issues

#### Port Conflicts
```bash
# Check port usage
sudo netstat -tulpn | grep :8000
sudo netstat -tulpn | grep :3000

# Change ports in docker-compose.yml
```

#### Memory Issues
```bash
# Check memory usage
docker stats

# Increase memory limits
services:
  backend:
    deploy:
      resources:
        limits:
          memory: 1G
        reservations:
          memory: 512M
```

#### Database Connection Issues
```bash
# Check database logs
docker-compose logs db

# Test connection
docker-compose exec backend python -c "
from app.database import engine
print('Database connection successful')
"
```

### Performance Tuning

#### Database Optimization
```sql
-- PostgreSQL optimization
-- Add to postgresql.conf or environment
POSTGRES_SHARED_BUFFERS=256MB
POSTGRES_EFFECTIVE_CACHE_SIZE=1GB
POSTGRES_WORK_MEM=4MB
```

#### Application Optimization
```bash
# Backend workers
uvicorn app.main:app --workers 4 --host 0.0.0.0 --port 8000

# Frontend build optimization
npm run build -- --analyze
```

---

For additional support, refer to the main [README.md](README.md) or check the application logs for specific error messages.

# CareFlow - Docker Deployment Guide

## 🚀 Quick Start

This guide will help you run the complete CareFlow application (Frontend + Backend + Database + Storage) using Docker.

## 📋 Prerequisites

- Docker Desktop installed and running
- Docker Compose v2 or higher
- At least 4GB of free RAM
- Ports 3000, 8000, 9000, 9001, and 27017 available

## 🏗️ Project Structure

```
jenkis-workshop/
├── docker-compose.yml          # Main orchestration file (USE THIS)
├── CareFlow-BackEnd/
│   ├── Dockerfile
│   ├── docker-compose.yaml     # Backend only
│   └── .env
└── CareFlow-FrontEnd/
    ├── Dockerfile
    ├── docker-compose.yml      # Frontend only
    └── nginx.conf
```

## 🛠️ Setup Instructions

### 1. Create Backend Environment File

```powershell
cd CareFlow-BackEnd
cp .env.example .env
```

Edit `.env` and update the values if needed (especially JWT_SECRET in production).

### 2. Build and Run All Services

From the **root directory** (`jenkis-workshop`):

```powershell
# Build all images
docker-compose build

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f
```

### 3. Access the Applications

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **MinIO Console**: http://localhost:9001 (admin/minioadmin)
- **MongoDB**: localhost:27017 (admin/admin123)

### 4. Initialize MinIO Bucket (First Time Only)

1. Open MinIO Console: http://localhost:9001
2. Login: `minioadmin` / `minioadmin`
3. Create bucket named: `careflow-bucket`
4. Set bucket policy to public or configure as needed

## 📦 Individual Service Commands

### Run Backend Only
```powershell
cd CareFlow-BackEnd
docker-compose up -d
```

### Run Frontend Only
```powershell
cd CareFlow-FrontEnd
docker-compose up -d
```

## 🔍 Useful Commands

### Check Service Status
```powershell
docker-compose ps
```

### View Logs
```powershell
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Stop Services
```powershell
docker-compose down
```

### Stop and Remove Volumes (CAREFUL: This deletes database data!)
```powershell
docker-compose down -v
```

### Rebuild After Code Changes
```powershell
# Rebuild specific service
docker-compose build backend
docker-compose up -d backend

# Rebuild all
docker-compose build
docker-compose up -d
```

## 🐛 Troubleshooting

### Port Already in Use
If you get port conflict errors:
```powershell
# Check what's using the port
netstat -ano | findstr :3000
netstat -ano | findstr :8000

# Kill the process or change port in docker-compose.yml
```

### Cannot Connect to Backend from Frontend
- Make sure all services are running: `docker-compose ps`
- Check backend logs: `docker-compose logs backend`
- Verify network connectivity: `docker network ls`

### MongoDB Connection Failed
```powershell
# Wait for MongoDB to be ready
docker-compose logs mongodb

# Restart the backend after MongoDB is ready
docker-compose restart backend
```

### MinIO Bucket Not Found
1. Access MinIO Console: http://localhost:9001
2. Create bucket: `careflow-bucket`
3. Restart backend: `docker-compose restart backend`

## 🔄 Development Workflow

### Update Backend Code
```powershell
cd CareFlow-BackEnd
# Make your changes
docker-compose build backend
docker-compose up -d backend
```

### Update Frontend Code
```powershell
cd CareFlow-FrontEnd
# Make your changes
docker-compose build frontend
docker-compose up -d frontend
```

## 🧹 Cleanup

### Remove Everything
```powershell
docker-compose down -v --rmi all
```

### Remove Only Containers (Keep Images)
```powershell
docker-compose down
```

## 📊 Health Checks

All services include health checks. Check their status:
```powershell
docker-compose ps
```

Look for "healthy" status for mongodb and minio services.

## 🔐 Production Deployment Notes

Before deploying to production:

1. ✅ Change `JWT_SECRET` in backend `.env`
2. ✅ Use strong passwords for MongoDB and MinIO
3. ✅ Configure proper CORS settings
4. ✅ Enable HTTPS/SSL
5. ✅ Set up proper backup for MongoDB data
6. ✅ Configure MinIO with proper access policies
7. ✅ Use environment-specific configurations

## 📝 Environment Variables

### Backend (.env)
- `MONGO_URL`: MongoDB connection string
- `JWT_SECRET`: Secret for JWT token generation
- `S3_ENDPOINT`: MinIO/S3 endpoint
- `S3_KEY`, `S3_SECRET`: MinIO credentials
- `PORT`: Backend server port

### Frontend
- `VITE_API_URL`: Backend API URL (configured in docker-compose.yml)

## 🆘 Need Help?

Check the logs first:
```powershell
docker-compose logs -f [service-name]
```

Common issues:
- Services not starting → Check ports are available
- Cannot connect → Check Docker network configuration
- Database errors → Ensure MongoDB is healthy before starting backend

---

**Happy Coding! 🎉**

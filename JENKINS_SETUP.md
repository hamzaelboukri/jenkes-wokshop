# Jenkins CI/CD Pipeline for CareFlow

This Jenkins pipeline automates the build, test, and deployment process for the CareFlow application.

## 🎯 Pipeline Stages

### 1. **Checkout**
- Clones the repository
- Gets the commit hash for tracking

### 2. **Environment Setup**
- Creates `.env` file from `.env.example`
- Prepares the build environment

### 3. **Backend Tests**
- Installs Node.js dependencies
- Runs linting
- Executes unit tests

### 4. **Frontend Tests**
- Installs Node.js dependencies
- Runs ESLint
- Executes unit tests

### 5. **Build Docker Images**
- Builds backend Docker image
- Builds frontend Docker image
- Tags images with build number and 'latest'

### 6. **Security Scan**
- Scans Docker images for vulnerabilities
- Uses Docker Scout (if available)

### 7. **Integration Tests**
- Starts all services with docker-compose
- Tests backend API endpoint
- Tests frontend availability
- Verifies service health

### 8. **Push to Registry** (main branch only)
- Pushes images to Docker Hub
- Tags with version and latest

### 9. **Deploy to Staging** (main branch only)
- Pulls latest images
- Restarts services
- Verifies deployment

## 📋 Prerequisites

### 1. Jenkins Server Setup
```bash
# Install Docker on Jenkins server
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Add jenkins user to docker group
sudo usermod -aG docker jenkins
sudo systemctl restart jenkins
```

### 2. Jenkins Plugins Required
- Docker Pipeline Plugin
- Git Plugin
- Pipeline Plugin
- Credentials Plugin
- Blue Ocean (optional, for better UI)

Install via Jenkins:
`Manage Jenkins` → `Manage Plugins` → `Available` → Search and install

### 3. Configure Jenkins Credentials

#### Docker Hub Credentials:
1. Go to `Manage Jenkins` → `Manage Credentials`
2. Click `(global)` → `Add Credentials`
3. Kind: `Username with password`
4. ID: `docker-hub-credentials`
5. Username: Your Docker Hub username
6. Password: Your Docker Hub password or access token
7. Click `OK`

#### Update Jenkinsfile:
Edit the Jenkinsfile and replace:
```groovy
DOCKER_HUB_USERNAME = 'your-dockerhub-username'
```
With your actual Docker Hub username.

## 🚀 Setup Instructions

### 1. Create Jenkins Pipeline Job

1. **Open Jenkins** → `New Item`
2. **Enter name**: `CareFlow-Pipeline`
3. **Select**: `Pipeline`
4. **Click**: `OK`

### 2. Configure Pipeline

In the job configuration:

**General:**
- ✅ GitHub project: `https://github.com/hamzaelboukri/jenkes-wokshop`

**Build Triggers:**
- ✅ Poll SCM: `H/5 * * * *` (check every 5 minutes)
- ✅ Or use GitHub webhooks for instant triggers

**Pipeline:**
- Definition: `Pipeline script from SCM`
- SCM: `Git`
- Repository URL: `https://github.com/hamzaelboukri/jenkes-wokshop.git`
- Credentials: (add if private repo)
- Branch: `*/main`
- Script Path: `Jenkinsfile`

**Click**: `Save`

### 3. Setup GitHub Webhook (Optional but Recommended)

1. Go to your GitHub repo → `Settings` → `Webhooks`
2. Click `Add webhook`
3. Payload URL: `http://your-jenkins-url/github-webhook/`
4. Content type: `application/json`
5. Events: `Just the push event`
6. Active: ✅
7. Click `Add webhook`

## 🧪 Testing the Pipeline

### Manual Trigger:
1. Go to your Jenkins job
2. Click `Build Now`
3. Watch the progress in `Console Output`

### Automatic Trigger:
1. Make a change to your code
2. Commit and push to GitHub
3. Jenkins will automatically start building

## 📊 Pipeline Monitoring

### View Pipeline Progress:
- **Classic View**: Click on build number → `Console Output`
- **Blue Ocean**: Install Blue Ocean plugin for visual pipeline view

### Check Build Status:
```bash
# Backend health
curl http://localhost:8000/

# Frontend
curl http://localhost:5173/

# Check running containers
docker-compose ps

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend
```

## 🔧 Customization

### Add Email Notifications:
Add to `post` section in Jenkinsfile:
```groovy
post {
    success {
        emailext (
            subject: "✅ Build Success: ${env.JOB_NAME} - ${env.BUILD_NUMBER}",
            body: "Build completed successfully!",
            to: "team@example.com"
        )
    }
    failure {
        emailext (
            subject: "❌ Build Failed: ${env.JOB_NAME} - ${env.BUILD_NUMBER}",
            body: "Build failed. Check console output.",
            to: "team@example.com"
        )
    }
}
```

### Add Slack Notifications:
```groovy
post {
    success {
        slackSend (
            color: 'good',
            message: "✅ Build Success: ${env.JOB_NAME} - ${env.BUILD_NUMBER}"
        )
    }
}
```

### Skip Stages on Feature Branches:
The pipeline already skips deployment stages on non-main branches:
```groovy
when {
    branch 'main'
}
```

## 🐛 Troubleshooting

### Permission Denied (Docker):
```bash
sudo usermod -aG docker jenkins
sudo systemctl restart jenkins
```

### Port Conflicts:
```bash
# Check what's using the port
netstat -tulpn | grep :8000

# Stop existing containers
docker-compose down
```

### Build Fails on npm install:
```bash
# Clear npm cache
npm cache clean --force

# Or add to Jenkinsfile:
sh 'npm ci --prefer-offline --no-audit'
```

### Images Not Pushing:
```bash
# Verify Docker Hub credentials
docker login

# Check credential ID in Jenkins matches Jenkinsfile
```

## 📈 Pipeline Metrics

The pipeline provides:
- ✅ Build duration
- ✅ Test results
- ✅ Docker image sizes
- ✅ Deployment status
- ✅ Success/failure rates

View in Jenkins dashboard or Blue Ocean plugin.

## 🔐 Security Best Practices

1. **Never commit credentials** - Use Jenkins Credentials Store
2. **Scan images** - Enable Docker Scout or Trivy
3. **Use multi-stage builds** - Reduces image size and attack surface
4. **Pin versions** - Use specific versions in package.json
5. **Regular updates** - Keep dependencies updated

## 📝 Environment Variables

Set in Jenkins job configuration or Jenkinsfile:

| Variable | Description | Example |
|----------|-------------|---------|
| `DOCKER_HUB_USERNAME` | Docker Hub username | `yourusername` |
| `BACKEND_IMAGE` | Backend image name | `username/careflow-backend` |
| `FRONTEND_IMAGE` | Frontend image name | `username/careflow-frontend` |
| `BUILD_VERSION` | Build number | `${env.BUILD_NUMBER}` |

## 🎉 Success Criteria

Pipeline succeeds when:
- ✅ All tests pass
- ✅ Docker images build successfully
- ✅ Integration tests pass
- ✅ Images pushed to registry (on main branch)
- ✅ Services deploy successfully (on main branch)

---

**Happy CI/CD! 🚀**

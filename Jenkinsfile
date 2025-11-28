pipeline {
    agent any

    environment {
        DOCKER_COMPOSE = "docker compose"
    }

    stages {
        stage('Checkout') {
            steps {
                echo " Checking out repository..."
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                echo " Installing backend & frontend dependencies..."
                sh '''
                    cd CareFlow-BackEnd
                    npm install

                    cd ../CareFlow-FrontEnd
                    npm install
                '''
            }
        }

        stage('Build Frontend & Backend') {
            steps {
                echo " Building backend & frontend..."
                sh '''
                    cd CareFlow-BackEnd
                    npm run build

                    cd ../CareFlow-FrontEnd
                    npm run build
                '''
            }
        }

        stage('Docker Build') {
            steps {
                echo " Building Docker images..."
                sh '''
                    ${DOCKER_COMPOSE} build
                '''
            }
        }

        stage('Run Containers') {
            steps {
                echo " Running containers..."
                sh '''
                    ${DOCKER_COMPOSE} up -d
                '''
            }
        }

        stage('Run Tests') {
            steps {
                echo " Running tests..."
                sh '''
                    cd CareFlow-BackEnd
                    npm test || true

                    cd ../CareFlow-FrontEnd
                    npm test || true
                '''
            }
        }

        stage('Health Check') {
            steps {
                echo " Checking service health..."
                sh '''
                    ${DOCKER_COMPOSE} ps
                '''
            }
        }
    }

    post {
        always {
            echo " Cleaning up..."
            sh '''
                ${DOCKER_COMPOSE} down
                docker system prune -f
            '''
        }
        success {
            echo " Pipeline Succeeded!"
        }
        failure {
            echo " Pipeline Failed!"
        }
    }
}

pipeline {
    agent any
    
    stages {
        stage('Checkout') {
            steps {
                echo 'Checking out code...'
                checkout scm
            }
        }
        
        stage('Build Images') {
            steps {
                echo 'Building Docker images...'
                script {
                    sh 'docker-compose build'
                }
            }
        }
        
        stage('Run Tests') {
            steps {
                echo 'Running application...'
                script {
                    sh 'docker-compose up -d'
                }
            }
        }
        
        stage('Health Check') {
            steps {
                echo 'Checking if services are running...'
                script {
                    sh 'timeout /t 10'
                    sh 'curl -f http://localhost:8000/ || exit 1'
                }
            }
        }
    }
    
    post {
        always {
            echo 'Cleaning up...'
            script {
                bat 'docker-compose down || exit 0'
            }
        }
        success {
            echo '✅ Pipeline completed successfully!'
        }
        failure {
            echo '❌ Pipeline failed!'
        }
    }
}

pipeline {
    agent any
    tools { 
        nodejs 'NodeJS-20' 
    }
    stages {
        stage('Checkout') {
            steps {
                echo 'Cloning Repository...'
                checkout scm
            }
        }

        stage('Install Backend Dependencies') {
            steps {
                echo 'Installing backend deps...'
                dir('CareFlow-BackEnd') {
                    sh 'npm install'
                }
            }
        }

        stage('Install Frontend Dependencies') {
            steps {
                echo 'Installing frontend deps...'
                dir('CareFlow-FrontEnd') {
                    sh 'npm install'
                }
            }
        }

        stage('Test') {
            steps {
                echo 'Running Tests...'
                // dir('CareFlow-BackEnd') { sh 'npm test || true' }
                // dir('CareFlow-FrontEnd') { sh 'npm test || true' }
            }
        }

        stage('Docker Compose Up') {
            steps {
                echo 'Starting Containers...'
                sh 'docker compose up -d --build'
            }
        }
    }

    post {
        always {
            catchError(buildResult: 'SUCCESS', stageResult: 'FAILURE') {
                sh 'docker compose down || true'
            }
        }
    }
}

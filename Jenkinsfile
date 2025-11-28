pipeline {
    agent any

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
                sh '''
                    cd CareFlow-BackEnd
                    npm install
                '''
            }
        }

        stage('Install Frontend Dependencies') {
            steps {
                echo 'Installing frontend deps...'
                sh '''
                    cd CareFlow-FrontEnd
                    npm install
                '''
            }
        }

        stage('Test') {
            steps {
                echo 'Running Tests...'
                sh '''
                    cd CareFlow-BackEnd
                    npm test || true
                    cd ../CareFlow-FrontEnd
                    npm test || true
                '''
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
            node {
                sh '''
                    echo 'Cleaning Up...'
                    docker compose down || true
                '''
            }
        }
    }
}
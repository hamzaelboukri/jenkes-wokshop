pipeline {
    agent any

    stages {

        stage('Checkout') {
            steps {
                echo " Cloning Repository..."
                checkout scm
            }
        }

        stage('Install Backend Dependencies') {
            steps {
                echo " Installing backend deps..."
                sh '''
                    cd CareFlow-BackEnd
                    npm install
                '''
            }
        }

        stage('Install Frontend Dependencies') {
            steps {
                echo " Installing frontend deps..."
                sh '''
                    cd CareFlow-FrontEnd
                    npm install
                    npm run build
                '''
            }
        }

        stage('Docker Compose Up') {
            steps {
                echo " Building & Starting Containers..."
                sh 'docker compose up -d --build'
            }
        }

        stage('test') {
            steps {
                echo " Test is running..."
              
            }
        }
    }

    post {
        success {
            echo "🎉 Pipeline completed successfully!"
        }
        failure {
            echo "❌ Pipeline failed!"
        }
    }
}
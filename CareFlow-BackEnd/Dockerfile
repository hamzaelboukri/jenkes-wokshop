# Étape 1 : Image de base Node
FROM node:18

# Étape 2 : Définir l'environnement
ENV NODE_ENV=production

# Étape 3 : Dossier de travail dans le conteneur
WORKDIR /usr/src/app

# Étape 4 : Copier les fichiers de configuration
COPY package*.json ./

# Étape 5 : Installer les dépendances
RUN npm install --omit=dev

# Étape 6 : Copier tout le reste du code
COPY . .

# Étape 7 : Exposer le port sur lequel ton app tourne
EXPOSE 8000

# Étape 8 : Lancer ton application
CMD ["node", "index.js"]

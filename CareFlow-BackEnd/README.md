# CareFlow — API Documentation

Version: 1.0  
Base URL (dev): `http://localhost:8000` (use `PORT` from .env)

## Table des matières
- Présentation
- Installation & variables d'environnement
- Auth (authRouter)
- Users (userRouter)
- Patients (patientRouter)
- Appointments (appointmentRouter)
- Authentification & rôles
- Erreurs et codes HTTP
- Tests rapides avec Postman
- Remarques / Debug

---

## Présentation
API REST pour la gestion d'un système de soins (utilisateurs, patients, rendez‑vous).  
Routes principales (mount point) :  
- `/api/auth` — authentification / vérification par e‑mail  
- `/api/users` — gestion des comptes utilisateurs  
- `/api/patients` — gestion des dossiers patients  
- `/api/appointments` — gestion des rendez‑vous

---

## Installation & variables d'environnement
1. Copier le projet puis installer les dépendances :
```powershell
cd "C:\Users\Youcode\Desktop\2ème annèe\CareFlow"
npm install
npm run start
```
2. Variables .env recommandées :
- `PORT` (ex: 3000)
- `MONGO_URI` (ex: mongodb+srv://user:pass@cluster0.xxxx.mongodb.net/myDB?retryWrites=true&w=majority)
- `JWT_SECRET` (chaine secrète)
- `MAIL_USER`, `MAIL_PASS` (optionnel, pour envoi d'e-mails)

Vérifier que la console affiche `DATABASE CONNECTED` avant d'appeler les routes.

---

## Auth — endpoints courants
Remarque : les routes exactes dépendent de `routers/authRouter.js`. Voici les endpoints généralement disponibles et attendus.

1) POST /api/auth/register
- Description : créer un user
- Headers: `Content-Type: application/json`
- Body exemple:
```json
{
  "name": "Alice",
  "email": "alice@example.com",
  "password": "Password123!",
  "role": "patient"
}
```
- Réponses:
  - 201 : user créé (id + éventuellement token)
  - 400 : validation

2) POST /api/auth/login
- Description : connexion -> retourne JWT
- Body:
```json
{ "email": "alice@example.com", "password": "Password123!" }
```
- Réponses:
  - 200 : { token, user }
  - 401/400 : credentials invalides

3) POST /api/auth/sendVerificationCode
- Description : envoi d'un code de vérification par mail (utilisé pour validation d'email)
- Body:
```json
{ "email": "alice@example.com" }
```
- Réponses:
  - 200 : success (vérifier logs / preview URL si Ethereal)
  - 400/500 : erreur mail / user introuvable

(Autres routes possibles : verify code, forgot-password, reset-password — vérifier `authRouter.js`)

---

## Users — endpoints (exemples)
(Consulte `routers/userRouter.js` pour routes exactes)

- GET /api/users
  - Rôle : admin généralement
  - Query : `page`, `limit`, `search`
  - Réponse: liste paginée d'utilisateurs

- GET /api/users/:id
  - Rôle : admin ou user lui-même
  - Réponse : user detail

- PUT /api/users/:id
  - Rôle : admin ou user (auto-update)
  - Body: champs modifiables (email, name, role, etc.)

- DELETE /api/users/:id
  - Rôle : admin

---

## Patients — endpoints (documentés d'après patientRouter.js / patientController.js)

En-têtes à ajouter sur routes protégées:
- `Authorization: Bearer <token>`
- `Content-Type: application/json`

1) POST /api/patients
- Roles autorisés : admin, medecin, infirmier, secretaire
- Body (exemple):
```json
{
  "userId": "64f...abc",
  "firstName": "Jean",
  "lastName": "Dupont",
  "dob": "1980-01-01",
  "email": "jean.dupont@example.com",
  "phone": "0123456789",
  "address": "1 rue Exemple",
  "medicalInfo": { "bloodType": "A+" }
}
```
- Réponses:
  - 201 : patient (populated user)
  - 400 : validation / userId invalide
  - 409 : patient déjà existant pour ce user

2) GET /api/patients
- Roles : admin, medecin, infirmier, secretaire
- Query params: `page`, `limit`, `search`, `bloodType`
- Réponse: paginated list

3) GET /api/patients/me
- Role : patient
- Usage: récupère le dossier du patient lié au token
- Réponse: 200 patient | 404 si non trouvé

4) GET /api/patients/:id
- Roles : admin, medecin, infirmier, secretaire
- Réponse: patient detail ou 404

5) PUT /api/patients/:id
- Roles : admin, medecin, infirmier, secretaire, patient (si owner)
- Body: champs modifiables (vérification via `updatePatientSchema`)
- Réponse: 200 updated patient | 403 si pas autorisé

6) DELETE /api/patients/:id
- Roles : admin
- Réponse: 200 deleted | 404 if not found

---

## Appointments — endpoints (d'après Controllers/appointmentController.js)

En-têtes:
- `Authorization: Bearer <token>`
- `Content-Type: application/json`

1) POST /api/appointments
- Roles permis : admin, medecin, infirmier, secretaire (vérifier router)
- Body exemple:
```json
{
  "patientId": "64f...p",
  "doctorId": "64f...d",
  "appointmentDate": "2025-10-20",
  "startTime": "09:30",
  "endTime": "10:00",
  "reason": "Consultation",
  "type": "consultation",
  "notes": "Premier RDV"
}
```
- Validations:
  - `appointmentDate` ne peut pas être dans le passé
  - `startTime`/`endTime` format `HH:mm`
  - Vérification conflit via `Appointment.checkConflict`
- Réponses:
  - 201 : appointment créé (populated)
  - 400 : validation error
  - 404 : patient/doctor introuvable
  - 409 : conflit horaire

2) GET /api/appointments
- Query: `page`, `limit`, `status`, `doctorId`, `patientId`, `date`
- Réponse: liste paginée + pagination meta

3) GET /api/appointments/me
- Role : patient
- Query: `status`, `upcoming` (ex: upcoming=true)
- Réponse: RDV pour le patient connecté

4) GET /api/appointments/doctor/:doctorId
- Query: `date`, `status`
- Réponse: RDV filtrés pour un docteur

5) GET /api/appointments/availability?doctorId=<id>&date=YYYY-MM-DD
- Description: renvoie créneaux réservés et heures de travail (ex: 08:00–18:00)
- Réponse: objects de créneaux réservés

6) GET /api/appointments/:id
- Réponse: appointment detail ou 404

7) PUT /api/appointments/:id
- Usage: modifier date/heure/notes — contrôles de conflit similaires
- Réponse: 200 updated | 409 conflit

8) POST /api/appointments/:id/cancel  (ou autre route selon router)
- Body exemple: `{ "reason": "Patient indisponible" }`
- Action: met à jour `status: cancelled`, set `cancelledBy`, `cancelledAt`
- Réponse: 200

9) POST /api/appointments/:id/complete
- Body: diagnosis/prescription/notes
- Action: set `status: completed`, save compte‑rendu
- Réponse: 200

(Vérifier `routers/appointmentRouter.js` pour verb exact et chemins d'actions cancel/complete)

---

## Authentification & rôles
- JWT dans header `Authorization: Bearer <token>`
- Roles courants: `admin`, `medecin`, `infirmier`, `secretaire`, `patient`
- Middleware:
  - `verifyToken` : vérifie JWT et attache `req.user` (ex: `{ userId, role }`)
  - `authorize(...roles)` : vérifie si `req.user.role` est autorisé

---

## Erreurs & codes HTTP
- 200 OK — réussite générique
- 201 Created — ressource créée
- 400 Bad Request — validation / données invalides
- 401 Unauthorized — token manquant ou invalide
- 403 Forbidden — rôle non autorisé
- 404 Not Found — ressource introuvable
- 409 Conflict — conflit (ex: créneau déjà pris, patient déjà lié)
- 500 Server Error — exception serveur (vérifier logs Node)

Les réponses successées dans le projet suivent ce format typique :
```json
{ "success": true, "message": "...", "data": { ... } }
```
ou erreurs :
```json
{ "success": false, "message": "Error message" }
```

---

## Tests rapides avec Postman (séquence conseillée)
1. Démarrer le serveur (`npm run start`) et vérifier DB connectée.
2. Auth:
   - POST /api/auth/register (si besoin)
   - POST /api/auth/login -> copier `token` dans env Postman
3. Créer utilisateur docteur/patient (ou utiliser existants).
4. Patients:
   - POST /api/patients -> sauvegarder `patientId`
   - GET /api/patients
   - GET /api/patients/:id
   - GET /api/patients/me (avec token patient)
   - PUT /api/patients/:id
   - DELETE /api/patients/:id (admin)
5. Appointments:
   - POST /api/appointments -> sauvegarder `appointmentId`
   - GET /api/appointments?page=1&limit=10
   - GET /api/appointments/me (token patient)
   - GET /api/appointments/doctor/:doctorId?date=YYYY-MM-DD
   - GET /api/appointments/availability?doctorId=&date=
   - PUT /api/appointments/:id
   - POST /api/appointments/:id/cancel
   - POST /api/appointments/:id/complete

Postman snippets pour sauvegarder valeurs:
```javascript
// save token
pm.environment.set("token", pm.response.json().token || "");
// save id
pm.environment.set("appointmentId", pm.response.json().appointment._id || "");
```

---

## Remarques / Debug
- Si Mongo ne se connecte pas : vérifier `MONGO_URI`, IP whitelist (Atlas), user/password, logs du serveur.
- Pour les problèmes d'email : si pas de `MAIL_USER`/`MAIL_PASS`, vérifier si le projet fallback vers Ethereal et regarder la preview URL logguée.
- Pour conflits d'heures : vérifier la logique `Appointment.checkConflict` dans le modèle des appointments.
- Pour erreurs d'autorisation : décoder le token sur jwt.io pour vérifier champ `role` et `userId`.

---

## Fichiers utiles à consulter pour détails
- `index.js` — configuration app / mongoose
- `routers/*.js` — routes et permissions
- `Controllers/*.js` — logique métier
- `Models/*.js` — schémas, méthodes statiques (ex: checkConflict)
- `middlewares/authMiddleware.js` — verifyToken + authorize

---

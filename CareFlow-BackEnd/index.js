import express from 'express';
import dotenv from 'dotenv';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import authRouter from './routers/authRouter.js';
import userRouter from './routers/userRouter.js';
import patientRouter from './routers/patientRouter.js';
import appointmentRouter from './routers/appointmentRouter.js';
import consultationRouter from './routers/consultationRouter.js';
import prescriptionRouter from './routers/prescriptionRouter.js';
import pharmacyRouter from './routers/pharmacyRouter.js';
import labOrderRouter from './routers/labOrderRouter.js';
import documentRouter from './routers/documentRouter.js';

dotenv.config();
const app = express();
app.use(cors());
app.use(helmet());
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


mongoose.mongoose.connect(process.env.MONGO_URL).then(() => {
    console.log("DATABASE CONNECETED");
}).catch((error) => {
    console.log(error);
});

app.use('/api/auth', authRouter);
app.use('/api/users', userRouter);
app.use('/api/patients', patientRouter);
app.use('/api/appointments', appointmentRouter);
app.use('/api/consultations', consultationRouter);
app.use('/api/prescriptions', prescriptionRouter);
app.use('/api/pharmacies', pharmacyRouter);
app.use('/api/lab-orders', labOrderRouter);
app.use('/api/documents', documentRouter);

app.get('/', (req, res) => {
    res.json({ message: 'CareFlow API is running' });
});

app.listen(process.env.PORT, () => {
    console.log("listning.....");
});
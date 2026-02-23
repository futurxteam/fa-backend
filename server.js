import express from 'express';
import connectDB from './config/db.js';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import adminRoutes from './routes/adminRoutes.js';
import courseRoutes from './routes/courseRoutes.js';
import moduleRoutes from './routes/moduleRoutes.js';
import contentRoutes from './routes/contentRoutes.js';
import assessmentRoutes from './routes/assessmentRoutes.js';
import studentAssessmentRoutes from './routes/studentAssessmentRoutes.js';
import batchRoutes from './routes/batchRoutes.js'
import batchContentRoutes from './routes/batchContentRoutes.js';
import studentLiveRoute from './routes/studentLiveRoute.js';
import meetRoutes from './routes/meetRoutes.js';
dotenv.config();

const app = express();

// Connect Database
connectDB();

// Init Middleware
app.use(express.json({ extended: false }));
app.use(cors());

// Define Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/modules', moduleRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/assessments', assessmentRoutes);
app.use('/api/student/assessments', studentAssessmentRoutes);
app.use('/api/batch', batchRoutes);
app.use('/api/batch-content', batchContentRoutes);
app.use('/api/student', studentLiveRoute);
app.use('/api/meet', meetRoutes);
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));

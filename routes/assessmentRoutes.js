import express from 'express';
import {
    createAssessment,
    getAssessmentsByCourse,
    getAssessmentById,
    updateAssessment,
    deleteAssessment
} from '../controllers/AssessmentController.js';

import { authenticate, authorize } from '../middleware/roleAuth.js';

const router = express.Router();

/*
========================================
FACULTY / ADMIN ROUTES
========================================
*/

// Create assessment
router.post(
    '/',
    authenticate,
    authorize('faculty', 'admin'),
    createAssessment
);

// Get all assessments for a course
router.get(
    '/course/:courseId',
    authenticate,
    authorize('faculty', 'admin'),
    getAssessmentsByCourse
);

// Get single assessment (full view with correct answers)
router.get(
    '/:id',
    authenticate,
    authorize('faculty', 'admin'),
    getAssessmentById
);

// Update assessment
router.put(
    '/:id',
    authenticate,
    authorize('faculty', 'admin'),
    updateAssessment
);

// Delete assessment
router.delete(
    '/:id',
    authenticate,
    authorize('faculty', 'admin'),
    deleteAssessment
);

export default router;

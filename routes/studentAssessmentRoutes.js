import express from 'express';
import {
    getAssessmentForStudent,
    submitAssessment,
    getStudentResults,getStudentAssessmentsByCourse
} from '../controllers/AssessmentController.js';

import { authenticate, authorize } from '../middleware/roleAuth.js';

const router = express.Router();
// Get all assessments for a course (student view)
router.get(
    "/course/:courseId",
    authenticate,
    authorize("student"),
    getStudentAssessmentsByCourse
);

/*
========================================
STUDENT ROUTES
========================================
*/

// Get assessment (safe version without correct answers)
router.get(
    '/:id',
    authenticate,
    authorize('student'),
    getAssessmentForStudent
);

// Submit assessment
router.post(
    '/:id/submit',
    authenticate,
    authorize('student'),
    submitAssessment
);

// Get student's results
router.get(
    '/results/all',
    authenticate,
    authorize('student'),
    getStudentResults
);

export default router;

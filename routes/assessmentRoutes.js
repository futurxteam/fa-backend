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

// All routes require faculty or admin role
router.post('/', authenticate, authorize('faculty', 'admin'), createAssessment);
router.get('/course/:courseId', authenticate, authorize('faculty', 'admin'), getAssessmentsByCourse);
router.get('/:id', authenticate, authorize('faculty', 'admin'), getAssessmentById);
router.put('/:id', authenticate, authorize('faculty', 'admin'), updateAssessment);
router.delete('/:id', authenticate, authorize('faculty', 'admin'), deleteAssessment);

export default router;

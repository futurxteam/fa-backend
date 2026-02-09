import express from 'express';
import {
    createOrUpdateStep1,
    updateStep2,
    submitForReview,
    getCoursesByStatus,
    getCourseById,
    approveCourse,
    rejectCourse,
    getPublishedCourses,
    getStudentCourseDetails,
    enrollInCourse
} from '../controllers/CourseController.js';
import { authenticate, authorize } from '../middleware/roleAuth.js';

const router = express.Router();

// Public route - get published courses
router.get('/published', getPublishedCourses);

// Student routes - authenticated
router.get('/student/:courseId', authenticate, getStudentCourseDetails);
router.post('/enroll', authenticate, enrollInCourse);

// Faculty/Admin routes - course creation
router.post('/step-1', authenticate, authorize('faculty', 'admin'), createOrUpdateStep1);
router.post('/step-2', authenticate, authorize('faculty', 'admin'), updateStep2);
router.post('/:id/submit', authenticate, authorize('faculty', 'admin'), submitForReview);

// Faculty/Admin routes - view courses
router.get('/', authenticate, authorize('faculty', 'admin'), getCoursesByStatus);
router.get('/:id', authenticate, authorize('faculty', 'admin'), getCourseById);

// Admin only routes - approval workflow
router.patch('/admin/:id/approve', authenticate, authorize('admin'), approveCourse);
router.patch('/admin/:id/reject', authenticate, authorize('admin'), rejectCourse);

export default router;

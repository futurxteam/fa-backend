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
    enrollInCourse,
    createOrUpdateTemplateStep1,
    updateTemplatePayment,
    getAllTemplates,
    getTemplateById,
    submitTemplateForReview
} from '../controllers/CourseController.js';
import { authenticate, authorize } from '../middleware/roleAuth.js';

const router = express.Router();

// Public route - get published courses
// Public route
router.get('/published', getPublishedCourses);

// Student routes
router.get('/student/:courseId', authenticate, getStudentCourseDetails);
router.post('/enroll', authenticate, enrollInCourse);

// ================= TEMPLATE ROUTES (MOVE THESE UP) =================

router.post(
  "/template/step-1",
  authenticate,
  authorize("faculty", "admin"),
  createOrUpdateTemplateStep1
);

router.post(
  "/template/step-2",
  authenticate,
  authorize("faculty", "admin"),
  updateTemplatePayment
);

router.get(
  "/templates",
  authenticate,
  authorize("faculty", "admin"),
  getAllTemplates
);

router.get(
  "/templates/:id",
  authenticate,
  authorize("faculty", "admin"),
  getTemplateById
);

router.post(
  "/templates/:id/submit",
  authenticate,
  authorize("faculty", "admin"),
  submitTemplateForReview
);

// ================= NORMAL COURSE ROUTES =================

router.post('/step-1', authenticate, authorize('faculty', 'admin'), createOrUpdateStep1);
router.post('/step-2', authenticate, authorize('faculty', 'admin'), updateStep2);
router.post('/:id/submit', authenticate, authorize('faculty', 'admin'), submitForReview);

router.get('/', authenticate, authorize('faculty', 'admin'), getCoursesByStatus);
router.get('/:id', authenticate, authorize('faculty', 'admin'), getCourseById);

// Admin approval routes
router.patch('/admin/:id/approve', authenticate, authorize('admin'), approveCourse);
router.patch('/admin/:id/reject', authenticate, authorize('admin'), rejectCourse);

export default router;

import express from 'express';
import {
    createModule,
    getModulesByCourse,
    updateModule,
    deleteModule
} from '../controllers/ModuleController.js';
import { authenticate, authorize } from '../middleware/roleAuth.js';

const router = express.Router();

// All routes require faculty or admin role
router.post('/', authenticate, authorize('faculty', 'admin'), createModule);
router.get('/course/:courseId', authenticate, authorize('faculty', 'admin'), getModulesByCourse);
router.put('/:id', authenticate, authorize('faculty', 'admin'), updateModule);
router.delete('/:id', authenticate, authorize('faculty', 'admin'), deleteModule);

export default router;

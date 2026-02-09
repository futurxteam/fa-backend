import express from 'express';
import {
    createContent,
    getContentByModule,
    updateContent,
    deleteContent
} from '../controllers/ContentController.js';
import { authenticate, authorize } from '../middleware/roleAuth.js';

const router = express.Router();

// All routes require faculty or admin role
router.post('/', authenticate, authorize('faculty', 'admin'), createContent);
router.get('/module/:moduleId', authenticate, authorize('faculty', 'admin'), getContentByModule);
router.put('/:id', authenticate, authorize('faculty', 'admin'), updateContent);
router.delete('/:id', authenticate, authorize('faculty', 'admin'), deleteContent);

export default router;

import express from 'express';
import {
    createContent,
    getContentByModule,
    updateContent,
    deleteContent
} from '../controllers/ContentController.js';
import { authenticate, authorize } from '../middleware/roleAuth.js';
import videoUpload from '../middleware/videoUpload.js';
import { saveProgress,getProgress } from '../controllers/ProgressController.js';
const router = express.Router();

// Create content (video or link)
router.post(
    '/',
    authenticate,
    authorize('faculty', 'admin'),
    videoUpload.single('video'),
    createContent
);

// Get module content
router.get(
    '/module/:moduleId',
    authenticate,
    authorize('faculty', 'admin'),
    getContentByModule
);

// Update content
router.put(
    '/:id',
    authenticate,
    authorize('faculty', 'admin'),
    updateContent
);

// Delete content
router.delete(
    '/:id',
    authenticate,
    authorize('faculty', 'admin'),
    deleteContent
);
router.post(
    '/progress',
    authenticate,
    authorize('student'),
    saveProgress
);

router.get(
    '/progress/:contentId',
    authenticate,
    authorize('student'),
    getProgress
);

export default router;

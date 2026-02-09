import express from 'express';
import { addFaculty, getFaculties } from '../controllers/AdminController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// @route   POST api/admin/add-faculty
// @desc    Add a new faculty user
// @access  Private/Admin
router.post('/add-faculty', protect, admin, addFaculty);

// @route   GET api/admin/faculties
// @desc    Get all faculty users
// @access  Private/Admin
router.get('/faculties', protect, admin, getFaculties);

export default router;

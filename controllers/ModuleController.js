import Module from '../models/Module.js';
import Course from '../models/Course.js';

// Create Module (Step 3)
export const createModule = async (req, res) => {
    try {
        const {
            courseId,
            title,
            description,
            order,
            moduleType,
            isFree,
            unlockRule,
            passingScore
        } = req.body;

        // Verify course exists and is editable
        const course = await Course.findById(courseId);

        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        if (course.status !== 'draft' && course.status !== 'rejected') {
            return res.status(400).json({
                message: 'Cannot edit course in current status'
            });
        }

        const module = new Module({
            course: courseId,
            title,
            description,
            order,
            moduleType,
            isFree,
            unlockRule,
            passingScore
        });

        await module.save();

        // Update course step
        course.currentStep = Math.max(course.currentStep, 3);
        await course.save();

        res.json({
            message: 'Module created successfully',
            module
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get Modules for a Course
export const getModulesByCourse = async (req, res) => {
    try {
        const { courseId } = req.params;

        const modules = await Module.find({ course: courseId })
            .sort({ order: 1 })
            .populate({
                path: 'content',
                options: { sort: { order: 1 } }
            });

        res.json({ modules });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Update Module
export const updateModule = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const module = await Module.findById(id).populate('course');

        if (!module) {
            return res.status(404).json({ message: 'Module not found' });
        }

        // Check if course is editable
        if (module.course.status !== 'draft' && module.course.status !== 'rejected') {
            return res.status(400).json({
                message: 'Cannot edit module - course is not in draft status'
            });
        }

        Object.assign(module, updates);
        await module.save();

        res.json({
            message: 'Module updated successfully',
            module
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Delete Module
export const deleteModule = async (req, res) => {
    try {
        const { id } = req.params;

        const module = await Module.findById(id).populate('course');

        if (!module) {
            return res.status(404).json({ message: 'Module not found' });
        }

        // Check if course is editable
        if (module.course.status !== 'draft' && module.course.status !== 'rejected') {
            return res.status(400).json({
                message: 'Cannot delete module - course is not in draft status'
            });
        }

        await Module.findByIdAndDelete(id);

        res.json({ message: 'Module deleted successfully' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

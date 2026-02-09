import Content from '../models/Content.js';
import Module from '../models/Module.js';
import Course from '../models/Course.js';

// Create Content (Step 4)
export const createContent = async (req, res) => {
    try {
        const {
            moduleId,
            title,
            contentType,
            contentUrl,
            scheduledDate,
            duration,
            order
        } = req.body;

        // Verify module exists
        const module = await Module.findById(moduleId).populate('course');

        if (!module) {
            return res.status(404).json({ message: 'Module not found' });
        }

        // Check if course is editable
        if (module.course.status !== 'draft' && module.course.status !== 'rejected') {
            return res.status(400).json({
                message: 'Cannot edit course in current status'
            });
        }

        const content = new Content({
            module: moduleId,
            title,
            contentType,
            contentUrl,
            scheduledDate,
            duration,
            order
        });

        await content.save();

        // Update course step
        const course = await Course.findById(module.course._id);
        course.currentStep = Math.max(course.currentStep, 4);
        await course.save();

        res.json({
            message: 'Content created successfully',
            content
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get Content by Module
export const getContentByModule = async (req, res) => {
    try {
        const { moduleId } = req.params;

        const contents = await Content.find({ module: moduleId }).sort({ order: 1 });

        res.json({ contents });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Update Content
export const updateContent = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const content = await Content.findById(id).populate({
            path: 'module',
            populate: { path: 'course' }
        });

        if (!content) {
            return res.status(404).json({ message: 'Content not found' });
        }

        // Check if course is editable
        if (content.module.course.status !== 'draft' && content.module.course.status !== 'rejected') {
            return res.status(400).json({
                message: 'Cannot edit content - course is not in draft status'
            });
        }

        Object.assign(content, updates);
        await content.save();

        res.json({
            message: 'Content updated successfully',
            content
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Delete Content
export const deleteContent = async (req, res) => {
    try {
        const { id } = req.params;

        const content = await Content.findById(id).populate({
            path: 'module',
            populate: { path: 'course' }
        });

        if (!content) {
            return res.status(404).json({ message: 'Content not found' });
        }

        // Check if course is editable
        if (content.module.course.status !== 'draft' && content.module.course.status !== 'rejected') {
            return res.status(400).json({
                message: 'Cannot delete content - course is not in draft status'
            });
        }

        await Content.findByIdAndDelete(id);

        res.json({ message: 'Content deleted successfully' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

import Content from '../models/Content.js';
import Module from '../models/Module.js';
import Course from '../models/Course.js';

// Create Content (Step 4)

export const createContent = async (req, res) => {
    try {
        let {
            moduleId,
            title,
            contentType,
            scheduledDate,
            duration,
            order
        } = req.body;

        // Basic validation
        if (!moduleId || !title) {
            return res.status(400).json({
                message: 'Module ID and title are required'
            });
        }

        // Verify module exists
        const module = await Module.findById(moduleId).populate('course');

        if (!module) {
            return res.status(404).json({ message: 'Module not found' });
        }

        // Check if course is editable
if (!['draft', 'rejected', 'published'].includes(module.course.status)) {
            return res.status(400).json({
                message: 'Cannot edit course in current status'
            });
        }

        let contentUrl = '';

        // Case 1: Video uploaded via Cloudinary
        if (req.file) {
            contentUrl = req.file.path;
            contentType = 'video'; // force correct type
        }

        // Case 2: URL-based content
        else if (req.body.contentUrl) {
            contentUrl = req.body.contentUrl;
        }

        // If still empty → reject
        if (!contentUrl) {
            return res.status(400).json({
                message: 'Content URL or video file is required'
            });
        }

        const content = new Content({
            module: moduleId,
            title,
            contentType,
            contentUrl,
            scheduledDate,
            duration: duration || 0,
            order: order || 1
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

        const contents = await Content.find({ module: moduleId })
            .sort({ order: 1 })
            .lean();

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
        const { title, contentUrl, duration, order } = req.body;

        const content = await Content.findById(id).populate({
            path: 'module',
            populate: { path: 'course' }
        });

        if (!content) {
            return res.status(404).json({ message: 'Content not found' });
        }

        if (content.module.course.status !== 'draft' &&
            content.module.course.status !== 'rejected') {
            return res.status(400).json({
                message: 'Cannot edit content - course is not editable'
            });
        }

        // Only allow safe fields
        if (title !== undefined) content.title = title;
        if (contentUrl !== undefined) content.contentUrl = contentUrl;
        if (duration !== undefined) content.duration = duration;
        if (order !== undefined) content.order = order;

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

        if (content.module.course.status !== 'draft' &&
            content.module.course.status !== 'rejected') {
            return res.status(400).json({
                message: 'Cannot delete content - course is not editable'
            });
        }

        await content.deleteOne();

        res.json({ message: 'Content deleted successfully' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

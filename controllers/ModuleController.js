import Module from '../models/Module.js';
import Course from '../models/Course.js';
import Content from '../models/Content.js';
// Create Module (Step 3)
export const createModule = async (req, res) => {
    try {
        let {
            courseId,
            title,
            description,
            order,
            moduleType,
            weekNumber,
            estimatedDuration,
            isFree,
            unlockRule,
            passingScore
        } = req.body;

        const course = await Course.findById(courseId);

        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        if (!['draft', 'rejected'].includes(course.status)) {
            return res.status(400).json({
                message: 'Cannot edit course in current status'
            });
        }

        // ===============================
        // 🔥 AUTO ORDER IF NOT PROVIDED
        // ===============================
        if (!order) {
            const lastModule = await Module.findOne({ course: courseId })
                .sort({ order: -1 });

            order = lastModule ? lastModule.order + 1 : 1;
        }

        // ===============================
        // 🔥 LIVE TEMPLATE VALIDATION
        // ===============================
        
     // ===============================
// 🔥 LIVE TEMPLATE VALIDATION
// ===============================
if (course.courseType === "live") {

    if (!weekNumber) {
        return res.status(400).json({
            message: "weekNumber is required for live modules"
        });
    }

    weekNumber = Number(weekNumber);
    estimatedDuration = Number(estimatedDuration) || 1;

    const newStart = weekNumber;
    const newEnd = weekNumber + estimatedDuration - 1;

    const existingModules = await Module.find({ course: courseId });

    for (let mod of existingModules) {

        const existingStart = mod.weekNumber;
        const existingEnd =
            mod.weekNumber + (mod.estimatedDuration || 1) - 1;

        const isOverlapping =
            newStart <= existingEnd &&
            newEnd >= existingStart;

        if (isOverlapping) {
            return res.status(400).json({
                message: `Module overlaps with "${mod.title}" (Weeks ${existingStart}-${existingEnd})`
            });
        }
    }
}

        // ===============================
        // 🔐 GRADED RULE ENFORCEMENT
        // ===============================
        if (course.unlockMode === "graded_unlock") {

            if (order === 1) {
                unlockRule = "none";
                passingScore = 0;
            } else {
                unlockRule = "pass_assessment";
                passingScore = passingScore || 50;
            }
        }

        const module = new Module({
            course: courseId,
            title,
            description,
            order,
            moduleType,
            weekNumber: course.courseType === "live" ? weekNumber : undefined,
            estimatedDuration: course.courseType === "live" ? estimatedDuration : undefined,
            isFree,
            unlockRule,
            passingScore
        });

        await module.save();

        course.currentStep = Math.max(course.currentStep, 3);
        await course.save();

        res.json({
            message: 'Module created successfully',
            module
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Server error',
            error: error.message
        });
    }
};

// Get Modules for a Course

export const getModulesByCourse = async (req, res) => {
    try {
        const { courseId } = req.params;

        // Get modules first
        const modules = await Module.find({ course: courseId })
            .sort({ order: 1 })
            .lean();

        const moduleIds = modules.map(m => m._id);

        // Get content by module IDs
        const contents = await Content.find({
            module: { $in: moduleIds }
        })
            .sort({ order: 1 })
            .lean();

        // Group content by module
        const contentMap = {};

        contents.forEach(c => {
            const key = c.module.toString();
            if (!contentMap[key]) contentMap[key] = [];
            contentMap[key].push(c);
        });

        // Attach content to modules
        modules.forEach(module => {
            module.content = contentMap[module._id.toString()] || [];
        });

        return res.json({ modules });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: 'Server error',
            error: error.message
        });
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

        if (!['draft', 'rejected', 'published'].includes(module.course.status)) {
            return res.status(400).json({
                message: 'Cannot edit module - course not editable'
            });
        }

        // 🔐 ENFORCE GRADED RULES ON UPDATE
        if (module.course.unlockMode === "graded_unlock") {

            if (module.order === 1) {
                updates.unlockRule = "none";
                updates.passingScore = 0;
            } else {
                updates.unlockRule = "pass_assessment";
                updates.passingScore = updates.passingScore || 50;
            }
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

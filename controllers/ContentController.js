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
            duration,
            order,
            pushOthers,
            dayNumber
        } = req.body;

        if (!moduleId || !title) {
            return res.status(400).json({
                message: 'Module ID and title are required'
            });
        }

        const module = await Module.findById(moduleId).populate('course');

        if (!module) {
            return res.status(404).json({ message: 'Module not found' });
        }

        if (!['draft', 'rejected', 'published'].includes(module.course.status)) {
            return res.status(400).json({
                message: 'Cannot edit course in current status'
            });
        }

        let contentUrl = '';

        // ================= FILE UPLOAD =================
        if (req.file) {
            contentUrl = req.file.path;

            if (req.file.mimetype === "application/pdf") {
                contentType = "pdf";
            } else if (req.file.mimetype.startsWith("video/")) {
                contentType = "video";
            }
        }
        // ================= LINK =================
        else if (req.body.contentUrl) {
            contentUrl = req.body.contentUrl;
            contentType = "link";
        }

        if (
  !contentUrl &&
  !req.file &&
  contentType !== "live_session"
) {
  return res.status(400).json({
    message: 'Content URL or file is required'
  });
}

        // ===================================================
        // 🔥 LIVE COURSE DAY VALIDATION
        // ===================================================
        let parsedDayNumber;

        if (module.course.courseType === "live") {

            parsedDayNumber = Number(dayNumber);

if (isNaN(parsedDayNumber) || parsedDayNumber < 1) {
    return res.status(400).json({
        message: "dayNumber must be a number >= 1"
    });
}


            // module duration in weeks → convert to total days
            const maxDays = (module.estimatedDuration || 1) * 7;

            if (parsedDayNumber > maxDays) {
                return res.status(400).json({
                    message: `dayNumber cannot exceed ${maxDays} for this module`
                });
            }
        }

        // ===================================================
        // ✅ ORDER LOGIC
        // ===================================================
        if (!order) {
            const lastContent = await Content.findOne({ module: moduleId })
                .sort({ order: -1 });

            order = lastContent ? lastContent.order + 1 : 1;
        } else {
            order = Number(order);

            const existing = await Content.findOne({
                module: moduleId,
                order
            });

            if (existing && !pushOthers) {
                return res.status(400).json({
                    message: 'Order already used. Set pushOthers=true to shift others.'
                });
            }

            if (existing && pushOthers) {
                await Content.updateMany(
                    {
                        module: moduleId,
                        order: { $gte: order }
                    },
                    { $inc: { order: 1 } }
                );
            }
        }

        // ===================================================
        // ✅ CREATE CONTENT
        // ===================================================
        const content = new Content({
            module: moduleId,
            title,
            contentType,
            contentUrl,
            duration: duration || 0,
            order,
            dayNumber: module.course.courseType === "live"
                ? parsedDayNumber
                : undefined
        });

        await content.save();

        module.course.currentStep = Math.max(module.course.currentStep, 4);
        await module.course.save();

        res.json({
            message: 'Content created successfully',
            content
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Server error',
            error: error.message
        });
    }
};



// Get Content by Module

export const getContentByModule = async (req, res) => {
    try {
        const { moduleId } = req.params;

        const contents = await Content.find({ module: moduleId })
            .sort({
                dayNumber: 1,   // first group by day
                order: 1        // then by order inside that day
            })
            .lean();

        res.json({ contents });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Server error',
            error: error.message
        });
    }
};



// Update Content
export const updateContent = async (req, res) => {
    try {
        const { id } = req.params;

        const {
            title,
            contentUrl,
            duration,
            order,
            pushOthers,
            dayNumber,
            unlocked
        } = req.body;

        const content = await Content.findById(id).populate({
            path: "module",
            populate: { path: "course" }
        });

        if (!content) {
            return res.status(404).json({ message: "Content not found" });
        }

        if (!["draft", "rejected"].includes(content.module.course.status)) {
            return res.status(400).json({
                message: "Cannot edit content - course is not editable"
            });
        }

        // ================= ORDER LOGIC =================
        if (order !== undefined && Number(order) !== content.order) {

            const parsedOrder = Number(order);

            const existing = await Content.findOne({
                module: content.module._id,
                order: parsedOrder,
                _id: { $ne: content._id }
            });

            if (existing && !pushOthers) {
                return res.status(400).json({
                    message: "Order already used. Set pushOthers=true to shift others."
                });
            }

            if (existing && pushOthers) {
                await Content.updateMany(
                    {
                        module: content.module._id,
                        order: { $gte: parsedOrder }
                    },
                    { $inc: { order: 1 } }
                );
            }

            content.order = parsedOrder;
        }

        // ================= SAFE UPDATES =================
        if (title !== undefined) content.title = title;
        if (contentUrl !== undefined) content.contentUrl = contentUrl;
        if (duration !== undefined) content.duration = Number(duration);
        if (dayNumber !== undefined) content.dayNumber = Number(dayNumber);
        if (unlocked !== undefined) content.unlocked = unlocked;

        await content.save();

        res.json({
            message: "Content updated successfully",
            content
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Server error",
            error: error.message
        });
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

        if (!['draft', 'rejected', 'published'].includes(content.module.course.status)) {
            return res.status(400).json({
                message: 'Cannot delete content - course is not editable'
            });
        }

        const moduleId = content.module._id;

        // 1️⃣ Delete content
        await content.deleteOne();

        // 2️⃣ Reorder remaining contents
        const remainingContents = await Content.find({ module: moduleId })
            .sort({ order: 1 });

        for (let i = 0; i < remainingContents.length; i++) {
            remainingContents[i].order = i + 1;
            await remainingContents[i].save();
        }

        res.json({ message: 'Content deleted successfully and reordered' });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Server error',
            error: error.message
        });
    }
};

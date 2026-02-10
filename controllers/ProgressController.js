import ContentProgress from '../models/ContentProgress.js';

export const saveProgress = async (req, res) => {
    try {
        const { contentId, watchedSeconds, duration } = req.body;
        const studentId = req.user._id;

        let progress = await ContentProgress.findOne({
            student: studentId,
            content: contentId
        });

        if (!progress) {
            progress = new ContentProgress({
                student: studentId,
                content: contentId,
                watchedSeconds,
                duration
            });
        } else {
            progress.watchedSeconds = Math.max(
                progress.watchedSeconds,
                watchedSeconds
            );
            progress.duration = duration;
        }

        // Completion logic (90%)
        const percentage = progress.watchedSeconds / duration;

        if (percentage >= 0.9) {
            progress.completed = true;
        }

        await progress.save();

        res.json({ progress });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};



// Get progress for a specific content
export const getProgress = async (req, res) => {
    try {
        const { contentId } = req.params;
        const studentId = req.user._id;

        const progress = await ContentProgress.findOne({
            student: studentId,
            content: contentId
        });

        if (!progress) {
            return res.json({
                watchedSeconds: 0,
                completed: false
            });
        }

        return res.json({
            watchedSeconds: progress.watchedSeconds,
            completed: progress.completed
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: 'Server error',
            error: error.message
        });
    }
};

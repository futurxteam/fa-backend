import ContentProgress from '../models/ContentProgress.js';

// Helper function to merge overlapping time segments
const mergeSegments = (segments) => {
    if (segments.length === 0) return [];

    // Sort segments by start time
    const sorted = segments.sort((a, b) => a[0] - b[0]);
    const merged = [sorted[0]];

    for (let i = 1; i < sorted.length; i++) {
        const current = sorted[i];
        const lastMerged = merged[merged.length - 1];

        // If current segment overlaps with last merged segment
        if (current[0] <= lastMerged[1]) {
            // Merge by extending the end time
            lastMerged[1] = Math.max(lastMerged[1], current[1]);
        } else {
            // No overlap, add as new segment
            merged.push(current);
        }
    }

    return merged;
};

// Calculate total watch time from segments
const calculateTotalWatchTime = (segments) => {
    const merged = mergeSegments(segments);
    return merged.reduce((total, segment) => {
        return total + (segment[1] - segment[0]);
    }, 0);
};
export const saveProgress = async (req, res) => {
    try {
        const { contentId, currentTime, duration, watchedSegment } = req.body;
        const studentId = req.user._id;

        // Build update operations
        const update = {
            lastPosition: currentTime,
            duration: duration
        };

        // If we have a segment, add it to the array
        if (watchedSegment && Array.isArray(watchedSegment) && watchedSegment.length === 2) {
            update.$push = { watchedSegments: watchedSegment };
        }

        // Use findOneAndUpdate with upsert for atomic operation
        let progress = await ContentProgress.findOneAndUpdate(
            { student: studentId, content: contentId },
            update,
            { new: true, upsert: true, runValidators: true }
        );

        // Calculate merged segments and total watch time
        const mergedSegments = mergeSegments(progress.watchedSegments || []);
        const totalWatchTime = calculateTotalWatchTime(mergedSegments);
        const percentage = duration > 0 ? totalWatchTime / duration : 0;
        const completed = percentage >= 0.7;

        // Update calculated fields in a separate atomic operation
        progress = await ContentProgress.findByIdAndUpdate(
            progress._id,
            {
                watchedSegments: mergedSegments,
                totalWatchTime: totalWatchTime,
                watchedSeconds: totalWatchTime,
                completed: completed
            },
            { new: true }
        );

        res.json({
            progress: {
                lastPosition: progress.lastPosition,
                totalWatchTime: progress.totalWatchTime,
                completed: progress.completed,
                percentage: Math.round(percentage * 100)
            }
        });

    } catch (error) {
        console.error('Progress save error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
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
                lastPosition: 0,
                totalWatchTime: 0,
                watchedSeconds: 0,
                completed: false
            });
        }

        return res.json({
            lastPosition: progress.lastPosition,
            totalWatchTime: progress.totalWatchTime,
            watchedSeconds: progress.watchedSeconds || progress.totalWatchTime,
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

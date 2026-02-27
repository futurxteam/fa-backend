import Content from "../models/Content.js";
import ContentProgress from "../models/ContentProgress.js";
import Module from "../models/Module.js";
import Enrollment from "../models/Enrollment.js";
import BatchContent from "../models/BatchContent.js";
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
const {
  contentId,
  batchContentId,
  batchModuleId,
  currentTime,
  duration,
  watchedSegment
} = req.body;    const studentId = req.user._id;

let content;

if (batchContentId) {
  content = await BatchContent.findById(batchContentId);
} else {
  content = await Content.findById(contentId);
}

if (!content) {
  return res.status(404).json({ message: "Content not found" });
}
    // =========================
    // 1️⃣ SAVE BASIC PROGRESS
    // =========================
 
const isLive = !!batchContentId;
const query = isLive
  ?{ student: studentId, batchContent: batchContentId }
  : { student: studentId, content: contentId };

let progress = await ContentProgress.findOneAndUpdate(
  query,
  {
    student: studentId,
    content: isLive ? null : contentId,
    batchContent: isLive ? batchContentId : null,
    batchModule: isLive ? batchModuleId : null,
    lastPosition: currentTime,
    duration,
    ...(watchedSegment ? { $push: { watchedSegments: watchedSegment } } : {})
  },
  { new: true, upsert: true }
);


    // =========================
    // 2️⃣ MERGE SEGMENTS
    // =========================
    const mergedSegments = mergeSegments(progress.watchedSegments || []);
    const totalWatchTime = calculateTotalWatchTime(mergedSegments);
    const percentage = duration > 0 ? totalWatchTime / duration : 0;
    const completed = percentage >= 0.7;

    progress = await ContentProgress.findByIdAndUpdate(
      progress._id,
      {
        watchedSegments: mergedSegments,
        totalWatchTime,
        watchedSeconds: totalWatchTime,
        completed
      },
      { new: true }
    );

    // =====================================================
    // 3️⃣ MODULE COMPLETION CHECK (ONLY WHEN VIDEO COMPLETES)
    // =====================================================
    if (completed && content.contentType === "video") {
let moduleVideos;

if (content.module) {
  // recorded
  moduleVideos = await Content.find({
    module: content.module,
    contentType: "video"
  });
} else if (content.batchModule) {
  // ⭐ live
 moduleVideos = await BatchContent.find({
  batch: content.batch,
  batchModule: content.batchModule,
  contentType: "video"
});
}

      const videoIds = moduleVideos.map(v => v._id);

    const completedVideos = await ContentProgress.find({
  student: studentId,
  ...(content.module
    ? { content: { $in: videoIds } }
    : { batchContent: { $in: videoIds } }),
  completed: true
});

      if (
        moduleVideos.length > 0 &&
        completedVideos.length === moduleVideos.length
      ) {

       // ⭐ RECORDED
if (content.module) {
  const moduleDoc = await Module.findById(content.module);

  await Enrollment.updateOne(
    { student: studentId, course: moduleDoc.course },
    { $addToSet: { completedModules: content.module } }
  );
}

// ⭐ LIVE
if (content.batchModule) {
  await Enrollment.updateOne(
    { student: studentId, batch: content.batch },
    { $addToSet: { completedBatchModules: content.batchModule } }
  );
}

      }
    }

    // =========================
    // 4️⃣ RESPONSE
    // =========================
    res.json({
      progress: {
        lastPosition: progress.lastPosition,
        totalWatchTime: progress.totalWatchTime,
        completed: progress.completed,
        percentage: Math.round(percentage * 100)
      }
    });

  } catch (error) {
    console.error("Progress save error:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message
    });
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

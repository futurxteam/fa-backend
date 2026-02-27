import mongoose from 'mongoose';

const ContentProgressSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    content: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Content',
        required: true
    },
      /* ⭐ LIVE (IMPORTANT) */
  batchContent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BatchContent'
  },

  batchModule: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BatchModule'
  },
    lastPosition: {
        type: Number,
        default: 0,
        description: 'Last watched position in seconds (for resume)'
    },
    totalWatchTime: {
        type: Number,
        default: 0,
        description: 'Total cumulative unique seconds watched'
    },
    watchedSegments: {
        type: [[Number]],
        default: [],
        description: 'Array of [start, end] time ranges that have been watched'
    },
    duration: {
        type: Number,
        default: 0
    },
    completed: {
        type: Boolean,
        default: false
    },
    // Keep for backward compatibility
    watchedSeconds: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

export default mongoose.model('ContentProgress', ContentProgressSchema);

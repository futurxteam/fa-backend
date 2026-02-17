import mongoose from 'mongoose';

const ContentSchema = new mongoose.Schema({
    module: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Module",
        required: true
    },

    title: {
        type: String,
        required: true
    },

    contentType: {
        type: String,
        enum: ["video", "pdf", "link", "notes", "live_session"],
        required: true
    },

    contentUrl: {
        type: String
    },

    duration: {
        type: Number  // minutes
    },

    order: {
        type: Number,
        required: true
    },

    // 🔥 Used only for live template scheduling logic
    weekOffset: {
        type: Number,   // which week inside module (0,1,2...)
        default: 0
    },

    dayOfWeek: {
        type: Number,   // 0-6 (Sunday-Saturday)
    }

}, { timestamps: true });

export default mongoose.model('Content', ContentSchema);

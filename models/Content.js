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

    contentUrl: String,

    duration: Number,

    order: {
        type: Number,
        required: true
    },

    // 🔥 Only for live courses
    dayNumber: {
        type: Number
    },

 

}, { timestamps: true });

export default mongoose.model('Content', ContentSchema);

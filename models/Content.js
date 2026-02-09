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
    // For live sessions
    scheduledDate: {
        type: Date
    },
    duration: {
        type: Number // in minutes
    },
    order: {
        type: Number,
        required: true
    }
});

export default mongoose.model('Content', ContentSchema);

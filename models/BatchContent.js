import mongoose from 'mongoose';

const BatchContentSchema = new mongoose.Schema({

    batch: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Batch",
        required: true
    },

    batchModule: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "BatchModule",
        required: true
    },

    templateContent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Content",
        required: true
    },

    scheduledDate: {
        type: Date
    },

    zoomMeetingId: String,
    zoomJoinUrl: String,
    zoomStartUrl: String,

    recordingUrl: String,

    contentStatus: {
        type: String,
        enum: ["scheduled", "live", "completed", "cancelled"],
        default: "scheduled"
    }

}, { timestamps: true });

export default mongoose.model('BatchContent', BatchContentSchema);

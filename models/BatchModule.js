import mongoose from 'mongoose';

const BatchModuleSchema = new mongoose.Schema({

    batch: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Batch",
        required: true
    },

    templateModule: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Module",
        required: true
    },

    weekNumber: {
        type: Number,
        required: true
    },

    status: {
        type: String,
        enum: ["upcoming", "ongoing", "completed"],
        default: "upcoming"
    }

}, { timestamps: true });

export default mongoose.model('BatchModule', BatchModuleSchema);

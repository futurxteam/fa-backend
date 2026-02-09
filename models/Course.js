import mongoose from 'mongoose';

const CourseSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String
    },
    courseType: {
        type: String,
        enum: ["recorded", "live"],
        required: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    faculty: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    price: {
        type: Number,
        default: 0
    },
    // Global course policies
    unlockMode: {
        type: String,
        enum: ["free_flow", "sequential", "graded_unlock"],
        default: "sequential"
    },
    finalAssessmentRequired: {
        type: Boolean,
        default: false
    },
    // WORKFLOW FIELDS
    status: {
        type: String,
        enum: ["draft", "in_review", "published", "rejected"],
        default: "draft"
    },
    currentStep: {
        type: Number,
        default: 1
    },
    isComplete: {
        type: Boolean,
        default: false
    },
    reviewNotes: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.model('Course', CourseSchema);

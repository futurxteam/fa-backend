import mongoose from 'mongoose';

const ModuleSchema = new mongoose.Schema({
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
        required: true
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String
    },
    order: {
        type: Number,
        required: true
    },
    moduleType: {
        type: String,
        enum: ["recorded", "live"],
        required: true
    },
    // Access control
    isFree: {
        type: Boolean,
        default: false
    },
    unlockRule: {
        type: String,
        enum: [
            "none",            // always unlocked
            "previous_module", // sequential
            "pass_assessment"  // must pass test
        ],
        default: "previous_module"
    },
    passingScore: {
        type: Number,
        default: 0
    }
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual populate for content
ModuleSchema.virtual('content', {
    ref: 'Content',
    localField: '_id',
    foreignField: 'module'
});

export default mongoose.model('Module', ModuleSchema);

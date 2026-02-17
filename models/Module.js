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

    description: String,

    order: {
        type: Number,
        required: true
    },

    moduleType: {
        type: String,
        enum: ["recorded", "live"],
        required: true
    },

    // 🔥 For live template mapping
    weekNumber: {
        type: Number  // starting week of this module
    },

    estimatedDuration: {
        type: Number  // number of weeks this module runs
    },

    // Access control
    isFree: {
        type: Boolean,
        default: false
    },

    unlockRule: {
        type: String,
        enum: ["none", "previous_module", "pass_assessment"],
        default: "previous_module"
    },

    passingScore: {
        type: Number,
        default: 0
    }

}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

ModuleSchema.virtual('content', {
    ref: 'Content',
    localField: '_id',
    foreignField: 'module'
});

export default mongoose.model('Module', ModuleSchema);

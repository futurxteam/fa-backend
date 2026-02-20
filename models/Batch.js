import mongoose from 'mongoose';

const BatchSchema = new mongoose.Schema({

    courseTemplate: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
        required: true
    },

    batchName: {
        type: String,
        required: true
    },

    startDate: {
        type: Date,
        required: true
    },

    endDate: {
        type: Date
    },

    weeklySchedule: [{
        dayOfWeek: Number,
        startTime: String,
        duration: Number
    }],

    faculty: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    maxStudents: {
        type: Number,
        default: 0
    },

    status: {
        type: String,
        enum: ["upcoming", "ongoing", "completed", "cancelled"],
        default: "upcoming"
    },
    isPublished: {
  type: Boolean,
  default: false,
  index: true
},

    currentWeek: {
        type: Number,
        default: 1
    }
    ,
    executionGenerated: {
  type: Boolean,
  default: false
}


}, { timestamps: true });

export default mongoose.model('Batch', BatchSchema);

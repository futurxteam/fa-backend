import mongoose from 'mongoose';

const EnrollmentSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
        required: true
    },
    paymentStatus: {
        type: String,
        enum: ["pending", "paid", "free"],
        default: "pending"
    },
    // Track module progress
    completedModules: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Module"
        }
    ],
    enrolledAt: {
        type: Date,
        default: Date.now
    }
});

// Ensure a student can only enroll once per course
EnrollmentSchema.index({ student: 1, course: 1 }, { unique: true });

export default mongoose.model('Enrollment', EnrollmentSchema);

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

    // 🔥 NEW — required for live courses
    batch: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Batch",
        default: null
    },

    paymentStatus: {
        type: String,
        enum: ["pending", "paid", "free"],
        default: "pending"
    },

    paymentPlan: {
        type: String,
        enum: ["full", "installment"],
        default: "full"
    },

    modulePayments: [{
        moduleNumber: Number,
        amount: Number,
        is_paid: { type: Boolean, default: false },
        transactionId: String,
        paidAt: Date,
        dueDate: Date
    }],

    completedModules: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Module"
    }],

    attendance: [{
        batchContentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "BatchContent"
        },
        attended: Boolean,
        joinedAt: Date,
        duration: Number
    }],

    currentWeek: {
        type: Number,
        default: 1
    },

    overallProgress: {
        type: Number,
        default: 0
    },

    enrolledAt: {
        type: Date,
        default: Date.now
    }

}, { timestamps: true });

EnrollmentSchema.index({ student: 1, course: 1, batch: 1 }, { unique: true });

export default mongoose.model('Enrollment', EnrollmentSchema);

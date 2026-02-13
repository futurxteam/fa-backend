import mongoose from 'mongoose';
const SubmissionSchema = new mongoose.Schema({
    assessment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Assessment"
    },

    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },

    answers: [Number], // index-based answers

    score: Number,
    totalMarks: Number,
    passed: Boolean,

    attemptNumber: Number

}, { timestamps: true });

export default mongoose.model('Submission', SubmissionSchema);

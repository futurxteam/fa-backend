import mongoose from 'mongoose';

const SubmissionSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    assessment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Assessment",
        required: true
    },
    answers: [
        {
            questionId: {
                type: String,
                required: true
            },
            selectedAnswer: {
                type: String
            }
        }
    ],
    score: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ["submitted", "graded"],
        default: "submitted"
    },
    submittedAt: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.model('Submission', SubmissionSchema);

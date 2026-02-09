import mongoose from 'mongoose';

const AssessmentSchema = new mongoose.Schema({
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
        required: true
    },
    module: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Module",
        default: null // null = final exam
    },
    title: {
        type: String,
        required: true
    },
    assessmentType: {
        type: String,
        enum: ["quiz", "assignment", "final"],
        required: true
    },
    totalMarks: {
        type: Number,
        required: true
    },
    passingMarks: {
        type: Number,
        required: true
    },
    questions: [
        {
            questionText: {
                type: String,
                required: true
            },
            options: [String],
            correctAnswer: {
                type: String
            },
            marks: {
                type: Number,
                default: 1
            }
        }
    ]
});

export default mongoose.model('Assessment', AssessmentSchema);

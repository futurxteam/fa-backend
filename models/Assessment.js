import mongoose from 'mongoose';

const QuestionSchema = new mongoose.Schema({
    questionText: {
        type: String,
        required: true
    },

    options: [
        {
            text: { type: String, required: true }
        }
    ],

    correctOptionIndex: {
        type: Number,
        required: true
    },

    marks: {
        type: Number,
        default: 1
    }
}, { _id: false });

const AssessmentSchema = new mongoose.Schema({
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
        required: false   
    },

    module: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Module",
        default: null
    },

    batch: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Batch",
  default: null
},

batchModule: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "BatchModule",
  default: null
},

gradingMode: {
  type: String,
  enum: ["auto", "manual"],
  default: "auto"
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

    passingMarks: {
        type: Number,
        required: true
    },

    attemptsAllowed: {
        type: Number,
        default: 1
    },

    timeLimit: {
        type: Number, // in minutes
        default: null
    },

    shuffleQuestions: {
        type: Boolean,
        default: false
    },

    questions: [QuestionSchema]

}, { timestamps: true });

export default mongoose.model('Assessment', AssessmentSchema);

import mongoose from "mongoose";

const SubmissionSchema = new mongoose.Schema({
  assessment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Assessment",
    required: true
  },

  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  answers: {
    type: [Number],
    required: true
  },

  score: {
    type: Number,
    required: true
  },

  totalMarks: {
    type: Number,
    required: true
  },

  percentage: {
    type: Number,
    required: true
  },

  passed: {
    type: Boolean,
    required: true
  },

  attemptNumber: {
    type: Number,
    required: true
  }

}, { timestamps: true });

export default mongoose.model("Submission", SubmissionSchema);

import mongoose from "mongoose";

const assignmentSubmissionSchema = new mongoose.Schema(
{
  assignment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Assignment",
    required: true
  },

  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  /* auto from assignment */
  batch: { type: mongoose.Schema.Types.ObjectId, ref: "Batch" },
  batchModule: { type: mongoose.Schema.Types.ObjectId, ref: "BatchModule" },
  batchContent: { type: mongoose.Schema.Types.ObjectId, ref: "BatchContent" },

  fileUrl: String,      // cloudinary
  textSubmission: String,

  submittedAt: {
    type: Date,
    default: Date.now
  },

  isLate: Boolean

},
{ timestamps: true }
);

assignmentSubmissionSchema.index(
  { assignment: 1, student: 1 },
  { unique: true } // prevent duplicate unless resubmission logic
);

export default mongoose.model("AssignmentSubmission", assignmentSubmissionSchema);
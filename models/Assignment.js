import mongoose from "mongoose";

const assignmentSchema = new mongoose.Schema(
{
  title: { type: String, required: true },
  description: String,

  expiryAt: { type: Date, required: true }, // ⭐ date + time

  /* ⭐ RELATIONS */
  batch: { type: mongoose.Schema.Types.ObjectId, ref: "Batch", required: true },
  batchModule: { type: mongoose.Schema.Types.ObjectId, ref: "BatchModule", required: true },
  batchContent: { type: mongoose.Schema.Types.ObjectId, ref: "BatchContent", required: true },

  /* optional */
  maxMarks: Number,
  allowLateSubmission: { type: Boolean, default: false },
  attachmentLink: String,

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }

},
{ timestamps: true });

export default mongoose.model("Assignment", assignmentSchema);
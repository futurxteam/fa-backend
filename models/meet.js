import mongoose from "mongoose";

const meetSchema = new mongoose.Schema(
  {
    batch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Batch",
      required: true,
        unique: true
    },

    batchModule: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BatchModule"
    },

    batchContent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BatchContent",
      required: true
    },

    topic: String, // snapshot name

    provider: {
      type: String,
      default: "zoom"
    },
 startTime: Date,
  endTime: Date,

    meetingNumber: String,
    password: String,
    joinUrl: String,
    startUrl: String,

    scheduledAt: Date,
    duration: Number,

    status: {
      type: String,
      enum: ["scheduled", "live", "ended"],
      default: "scheduled"
    }
  },
  { timestamps: true }
);

export default mongoose.model("Meet", meetSchema);
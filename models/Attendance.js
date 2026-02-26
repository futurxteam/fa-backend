import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema(
{
  /* ⭐ CORE RELATION */
  batch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Batch",
    required: true
  },

  batchModule: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "BatchModule",
    required: true
  },

  /* ⭐ LESSON (MOST IMPORTANT) */
  batchContent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "BatchContent",
    required: true
  },

  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  /* ⭐ SOURCE */
  source: {
    type: String,
    enum: ["live", "recorded", "manual"],
    required: true
  },

  /* ⭐ OPTIONAL — LIVE CLASS */
  meet: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Meet",
    default: null
  },

  /* ⭐ LIVE TIMINGS */
  joinTime: Date,
  leaveTime: Date,
  liveDurationSeconds: {
    type: Number,
    default: 0
  },

  /* ⭐ RECORDED PROGRESS */
  watchTimeSeconds: {
    type: Number,
    default: 0
  },

  completionPercent: {
    type: Number,
    default: 0
  },

  /* ⭐ FINAL STATUS */
  status: {
    type: String,
    enum: ["present", "partial", "absent"],
    default: "present"
  },

  /* ⭐ FLAGS */
  countedForCertificate: {
    type: Boolean,
    default: true
  }

},
{ timestamps: true }
);


/* ⭐ VERY IMPORTANT — SINGLE ATTENDANCE PER LESSON */
attendanceSchema.index(
  { student: 1, batchContent: 1 },
  { unique: true }
);

export default mongoose.model("Attendance", attendanceSchema);
import mongoose from "mongoose";

const studentAttendanceSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  status: {
    type: String,
    enum: ["present", "partial", "absent"],
    default: "present"
  },

  source: {
    type: String,
    enum: ["live", "recorded", "manual"],
    required: true
  },

  meet: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Meet",
    default: null
  },
  joinTime: Date,
leaveTime: Date,
recordedAt: Date,

  watchTimeSeconds: { type: Number, default: 0 },
  liveDurationSeconds: { type: Number, default: 0 }

}, { _id: false });


const attendanceSchema = new mongoose.Schema({
  batch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Batch",
    required: true
  },

  date: {
    type: Date,
    required: true
  },

  batchModule: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "BatchModule",
    required: true
  },

  batchContent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "BatchContent",
    required: true
  },

  sessionNo: Number,

  students: [studentAttendanceSchema]

}, { timestamps: true });

attendanceSchema.index(
  { batch: 1, date: 1, batchContent: 1 },
  { unique: true }
);

export default mongoose.model("Attendance", attendanceSchema);
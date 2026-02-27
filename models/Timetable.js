import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema({
  sessionNo: Number,

  batchModule: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "BatchModule"
  },

  batchContent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "BatchContent"
  },

  attendance: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Attendance"   // ⭐ reference
  }

}, { _id: false });


const timetableSchema = new mongoose.Schema({
  batch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Batch",
    required: true
  },

  date: {
    type: Date,
    required: true
  },

  sessions: [sessionSchema]

}, { timestamps: true });

timetableSchema.index(
  { batch: 1, date: 1 },
  { unique: true }
);

export default mongoose.model("Timetable", timetableSchema);
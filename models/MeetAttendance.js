import mongoose from 'mongoose';

const MeetAttendanceSchema = new mongoose.Schema({
  meet: { type: mongoose.Schema.Types.ObjectId, ref: "Meet", required: true },
  batch: { type: mongoose.Schema.Types.ObjectId, ref: "Batch", required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
batchContent: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "BatchContent"
},
  email: String,

  sessions: [
    {
      joinTime: Date,
      leaveTime: Date,
      duration: Number
    }
  ],

  totalDuration: {
    type: Number,
    default: 0
  }

}, { timestamps: true });

MeetAttendanceSchema.index({ meet: 1, student: 1 }, { unique: true });

export default mongoose.model('MeetAttendance', MeetAttendanceSchema);
import mongoose from "mongoose";

const EnrollmentSchema = new mongoose.Schema({

  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Course",
    required: true
  },

  batch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Batch",
    default: null
  },

  paymentStatus: {
    type: String,
    enum: ["pending", "partial", "paid", "failed", "free"],
    default: "pending"
  },

  paymentPlan: {
    type: String,
    enum: ["full", "module"],
    default: "full"
  },

  modulePayments: [
    {
      module: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "BatchModule",
        required: true
      },
      status: {
        type: String,
        enum: ["pending", "paid", "failed"],
        default: "pending"
      },
      amount: Number,
      paidAt: Date,
      razorpay: {
        orderId: String,
        paymentId: String,
        signature: String
      }
    }
  ],

  blockedModules: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BatchModule"
    }
  ],

  completedModules: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Module"
  }],

  currentWeek: { type: Number, default: 1 },
  overallProgress: { type: Number, default: 0 },
  completedAt: Date,

  attendance: [{
    batchContentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BatchContent"
    },
    attended: Boolean,
    status: {
      type: String,
      enum: ["present", "absent", "late", "left_early"],
      default: "present"
    },
    joinedAt: Date,
    duration: Number
  }],

  certificateIssued: { type: Boolean, default: false },

  enrolledAt: { type: Date, default: Date.now }

}, { timestamps: true });

EnrollmentSchema.index(
  { student: 1, course: 1, batch: 1 },
  { unique: true }
);

export default mongoose.model("Enrollment", EnrollmentSchema);
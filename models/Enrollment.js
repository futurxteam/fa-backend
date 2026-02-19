import mongoose from "mongoose";

const EnrollmentSchema = new mongoose.Schema({

  /* ================= CORE ================= */

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

  // live courses
  batch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Batch",
    default: null
  },

  /* ================= PAYMENT ================= */

  paymentStatus: {
    type: String,
    enum: ["pending", "paid", "free"],
    default: "pending"
  },

  paymentPlan: {
    type: String,
    enum: ["full", "installment"],
    default: "full"
  },

  // ⭐ module level payment (installments)
  modulePayments: [{
    module: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Module"
    },
    amount: Number,
    is_paid: { type: Boolean, default: false },
    transactionId: String,
    paidAt: Date,
    dueDate: Date
  }],

  /* ================= PROGRESSION ================= */

  completedModules: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Module"
  }],

  blockedModules: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Module"
  }],

  currentWeek: {
    type: Number,
    default: 1
  },

  overallProgress: {
    type: Number,
    default: 0
  },

  completedAt: Date,

  /* ================= ATTENDANCE ================= */

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

  /* ================= CERTIFICATION ================= */

  certificateIssued: {
    type: Boolean,
    default: false
  },

  /* ================= META ================= */

  enrolledAt: {
    type: Date,
    default: Date.now
  }

}, { timestamps: true });

/* ================= INDEX ================= */

EnrollmentSchema.index(
  { student: 1, course: 1, batch: 1 },
  { unique: true }
);

export default mongoose.model("Enrollment", EnrollmentSchema);

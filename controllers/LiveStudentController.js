import Batch from "../models/Batch.js";
import Module from "../models/Module.js";
import Content from "../models/Content.js";
import BatchModule from "../models/BatchModule.js";
import Assessment from "../models/Assessment.js";

import Enrollment from "../models/Enrollment.js";

import BatchContent from "../models/BatchContent.js";
export const getPublishedLiveCourses = async (req, res) => {
  try {
    const batches = await Batch.find({
      isPublished: true,
      executionGenerated: true,
      status: { $ne: "cancelled" }
    })
      .populate({
        path: "courseTemplate",
        select: "title description price duration courseType thumbnail",
        match: { courseType: "live" }
      })
      .populate("faculty", "name")
      .sort({ startDate: 1 })
      .lean();

    // remove non-live filtered results + flatten for UI
    const result = batches
      .filter(b => b.courseTemplate)
      .map(b => ({
        _id: b._id,
        batchName: b.batchName,
        startDate: b.startDate,
        weeklySchedule: b.weeklySchedule,
        faculty: b.faculty,

        // ⭐ flattened for StudentCourses.jsx (no UI change needed)
        title: b.courseTemplate.title,
        description: b.courseTemplate.description,
        price: b.courseTemplate.price,
        duration: b.courseTemplate.duration,
        courseType: b.courseTemplate.courseType,
        thumbnail: b.courseTemplate.thumbnail
      }));

    res.json({
      success: true,
      courses: result
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};
export const getPublishedBatchDetails = async (req, res) => {
  try {
    const { batchId } = req.params;

    /* ================= BATCH ================= */
    const batch = await Batch.findOne({
      _id: batchId,
      isPublished: true
    })
      .populate("faculty", "name email")
      .populate("courseTemplate", "title description price courseType thumbnail")
      .lean();

    if (!batch) {
      return res.status(404).json({ message: "Batch not found" });
    }
const studentId = req.user?.id; // works if auth middleware present

let isEnrolled = false;

if (studentId) {
  const enrollment = await Enrollment.findOne({
    student: studentId,
    batch: batchId
  }).lean();

  isEnrolled = !!enrollment;
}
    /* ================= BATCH MODULES ================= */
    const modules = await BatchModule.find({ batch: batchId })
      .populate("templateModule", "title description")
      .sort({ weekNumber: 1 })
      .lean();

    const moduleIds = modules.map(m => m._id);

    /* ================= BATCH CONTENT ================= */
    const contents = await BatchContent.find({
      batchModule: { $in: moduleIds }
    })
      .populate(
        "templateContent",
        "title contentType duration contentUrl dayNumber order"
      ) // ⭐ FIX 1 → include missing fields
      .sort({ createdAt: 1 })
      .lean();

    /* ================= GROUP CONTENT ================= */
const map = {};

contents.forEach(c => {

  /* 🚫 RULE 1 → NOT UNLOCKED → SKIP COMPLETELY */
  if (!c.unlocked) return;

  const primaryMaterial =
    c.materials?.find(m => m.isPrimary) ||
    c.materials?.[0] ||
    null;

  let normalized;

  /* 🚫 RULE 2 → TEMPLATE HIDDEN → ONLY MATERIALS */
  if (c.isTemplateHidden) {

    normalized = {
      _id: c._id,
      batch: c.batch,
      batchModule: c.batchModule,
      materials: c.materials || [],
      contentStatus: c.contentStatus,
      unlocked: c.unlocked
    };

  } else {

    const contentUrl =
      primaryMaterial?.url ||
      c.templateContent?.contentUrl ||
      null;

    const contentType =
      primaryMaterial?.type ||
      c.templateContent?.contentType ||
      null;

    const duration =
      primaryMaterial?.duration ||
      c.templateContent?.duration ||
      0;

    normalized = {
      _id: c._id,
      batch: c.batch,
      batchModule: c.batchModule,
      title: c.title,
      contentUrl,
      contentType,
      duration,
      materials: c.materials || [],
      contentStatus: c.contentStatus,
      unlocked: c.unlocked
    };
  }

  const key = c.batchModule.toString();
  if (!map[key]) map[key] = [];
  map[key].push(normalized);
});

const modulesWithContent = modules.map(m => ({
  ...m,
  contents: isEnrolled ? (map[m._id.toString()] || []) : []   // ⭐ key change
}));
    /* ================= RESPONSE ================= */
    res.json({
      batch,
      modules: modulesWithContent,
      isEnrolled   
    });

  } catch (err) {
    res.status(500).json({
      message: err.message
    });
  }
};
export const enrollInBatch = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { batchId } = req.params;
    const { plan = "full", coupon } = req.body;

    const batch = await Batch.findById(batchId).populate("courseTemplate");
    if (!batch) return res.status(404).json({ message: "Batch not found" });

    const existing = await Enrollment.findOne({ student: studentId, batch: batchId });
    if (existing) return res.status(400).json({ message: "Already enrolled" });

    const modules = await BatchModule.find({ batch: batchId }).sort({ weekNumber: 1 });

    let blockedModules = [];
    let modulePayments = [];

    /* ================= MODULE PLAN ================= */
    if (plan === "module") {

      modulePayments = modules.map(m => ({
        module: m._id,
        status: m.status === "ongoing" ? "paid" : "pending", // ⭐ ONGOING AUTO PAID
        amount: batch.courseTemplate.price / (modules.length || 1),
        paidAt: m.status === "ongoing" ? new Date() : null
      }));

      blockedModules = modules
        .filter(m => m.status !== "ongoing") // ⭐ lock except ongoing
        .map(m => m._id);
    }

    /* ================= FULL PLAN ================= */
    else {

      blockedModules = modules
        .filter(m => m.status === "upcoming") // ⭐ ONLY FUTURE LOCKED
        .map(m => m._id);
    }

    const enrollment = await Enrollment.create({
      student: studentId,
      course: batch.courseTemplate._id,
      batch: batchId,

      paymentPlan: plan,
      paymentStatus:
        plan === "module"
          ? "pending"
          : batch.courseTemplate.price === 0
          ? "free"
          : "paid",

      blockedModules,
      modulePayments
    });

    res.json({ success: true, enrollment });

  } catch (err) {
    console.error("Batch enroll error:", err);
    res.status(500).json({ message: "Batch enrollment failed" });
  }
};
export const getStudentBatchAssessments = async (req, res) => {
  try {
    const { batchId } = req.params;

    /* ⭐ 1. batch must be published */
    const batch = await Batch.findById(batchId).lean();

    if (!batch || !batch.isPublished) {
      return res.json([]); // hidden batch → no exams
    }

    /* ⭐ 2. enrollment */
    const enrollment = await Enrollment.findOne({
      student: req.user.id,
      batch: batchId
    }).lean();

    if (!enrollment) return res.json([]);

    /* ⭐ 3. paid modules */
    const paidModules = new Set(
      (enrollment.modulePayments || [])
        .filter(p => p.status === "paid")
        .map(p => p.module.toString())
    );

    /* ⭐ 4. fetch assessments */
    let assessments = await Assessment.find({
      batch: batchId,
      $or: [
        { isPublished: { $exists: false } }, // backward safe
        { isPublished: true }
      ]
    })
      .populate("batchModule")
      .lean();

    /* ⭐ 5. module payment gating */
    if (enrollment.paymentPlan === "module") {
      assessments = assessments.filter(a => {
        if (!a.batchModule) return true; // final exam
        return paidModules.has(a.batchModule._id.toString());
      });
    }

    res.json(assessments);

  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};
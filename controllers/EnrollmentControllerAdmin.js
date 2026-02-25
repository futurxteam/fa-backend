// controllers/enrollmentController.js
import Enrollment from "../models/Enrollment.js";
import Batch from "../models/Batch.js";
import Module from "../models/Module.js";

export const toggleModuleAvailability = async (req, res) => {
  try {
    const { enrollmentId, moduleId } = req.body;

    if (!enrollmentId || !moduleId) {
      return res.status(400).json({ message: "Missing params" });
    }

    const enrollment = await Enrollment.findById(enrollmentId);

    if (!enrollment) {
      return res.status(404).json({ message: "Enrollment not found" });
    }

    const exists = enrollment.blockedModules.some(
      m => m.toString() === moduleId
    );

    if (exists) {
      // ⭐ remove → make available
      enrollment.blockedModules = enrollment.blockedModules.filter(
        m => m.toString() !== moduleId
      );
    } else {
      // ⭐ block
      enrollment.blockedModules.push(moduleId);
    }

    await enrollment.save();

    res.json({
      success: true,
      blocked: !exists
    });

  } catch (e) {
    res.status(500).json({ message: "Toggle failed" });
  }
  
};
export const getEnrollmentsByBatch = async (req, res) => {
  try {
    const { batchId } = req.params;

    const enrollments = await Enrollment.find({ batch: batchId })
      .populate("student", "name email")
      .select("student paymentPlan paymentStatus blockedModules modulePayments");

    res.json(enrollments);
  } catch (e) {
    res.status(500).json({ message: "Failed to load batch students" });
  }
};
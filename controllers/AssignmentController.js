import Assignment from "../models/Assignment.js";
import BatchContent from "../models/BatchContent.js";

export const createAssignment = async (req, res) => {
  try {
    const facultyId = req.user.id;

    const {
      title,
      description,
      expiryAt,
      batchContentId,
      maxMarks,
      allowLateSubmission,
      attachmentLink
    } = req.body;

    if (!title || !expiryAt || !batchContentId) {
      return res.status(400).json({
        message: "title, expiryAt, batchContentId required"
      });
    }

    /* ⭐ SOURCE OF TRUTH */
    const content = await BatchContent.findById(batchContentId);

    if (!content) {
      return res.status(404).json({ message: "BatchContent not found" });
    }

    /* ⭐ AUTO derive relations */
    const assignment = await Assignment.create({
      title,
      description,
      expiryAt: new Date(expiryAt),

      batch: content.batch,               // ⭐ auto
      batchModule: content.batchModule,   // ⭐ auto
      batchContent: content._id,

      maxMarks,
      allowLateSubmission,
      attachmentLink,
      createdBy: facultyId
    });

    res.json({
      success: true,
      message: "Assignment created",
      data: assignment
    });

  } catch (err) {
    console.error("Create assignment error:", err);
    res.status(500).json({ message: "Failed to create assignment" });
  }
};
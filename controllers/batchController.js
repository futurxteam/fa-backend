

import Batch from "../models/Batch.js";
import BatchModule from "../models/BatchModule.js";
import BatchContent from "../models/BatchContent.js";
import Module from "../models/Module.js";
import Content from "../models/Content.js";
import Course from "../models/Course.js";
import Enrollment from "../models/Enrollment.js";

export const createBatch = async (req, res) => {
  try {
    const {
      courseTemplate,
      batchName,
      startDate,
      endDate,
      weeklySchedule,
      faculty,
      maxStudents
    } = req.body;

    if (!courseTemplate || !batchName || !startDate || !faculty) {
      return res.status(400).json({
        message: "Required fields missing"
      });
    }

    const course = await Course.findById(courseTemplate);

    if (!course) {
      return res.status(404).json({
        message: "Course template not found"
      });
    }

    if (course.courseType !== "live") {
      return res.status(400).json({
        message: "Batch can only be created for live courses"
      });
    }

    const batch = await Batch.create({
      courseTemplate,
      batchName,
      startDate,
      endDate,
      weeklySchedule,
      faculty,
      maxStudents,
      executionGenerated: false // ⭐ important
    });

    res.status(201).json({
      message: "Batch created successfully",
      batch
    });

  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
};


export const getAllBatches = async (req, res) => {
  try {
    const { courseId, status } = req.query;

    let filter = {};

    if (courseId) filter.courseTemplate = courseId;
    if (status) filter.status = status;

    const batches = await Batch.find(filter)
      .populate("courseTemplate", "title")
      .populate("faculty", "name email")
      .sort({ createdAt: -1 });

    res.json({ batches });

  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
};


export const getBatchById = async (req, res) => {
  try {
    const { id } = req.params;

    const batch = await Batch.findById(id)
      .populate("faculty", "name email")
      .populate("courseTemplate", "title");

    if (!batch) {
      return res.status(404).json({ message: "Batch not found" });
    }

    res.json(batch);

  } catch (err) {
    console.error("getBatchById error:", err); // ⭐ see real error
    res.status(500).json({
      message: "Server error",
      error: err.message
    });
  }
};



export const updateBatch = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      batchName,
      startDate,
      endDate,
      weeklySchedule,
      faculty,
      maxStudents,
      status
    } = req.body;

    const batch = await Batch.findById(id);

    if (!batch) {
      return res.status(404).json({
        message: "Batch not found"
      });
    }

    if (batchName !== undefined) batch.batchName = batchName;
    if (startDate !== undefined) batch.startDate = startDate;
    if (endDate !== undefined) batch.endDate = endDate;
    if (weeklySchedule !== undefined) batch.weeklySchedule = weeklySchedule;
    if (faculty !== undefined) batch.faculty = faculty;
    if (maxStudents !== undefined) batch.maxStudents = maxStudents;
    if (status !== undefined) batch.status = status;

    await batch.save();

    res.json({
      message: "Batch updated successfully",
      batch
    });

  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
};



export const deleteBatch = async (req, res) => {
  try {
    const { batchId } = req.params;

    const batch = await Batch.findById(batchId);

    if (!batch) {
      return res.status(404).json({
        message: "Batch not found"
      });
    }

    await BatchModule.deleteMany({ batch: batchId });
    await BatchContent.deleteMany({ batch: batchId });
    await Enrollment.updateMany(
      { batch: batchId },
      { $set: { batch: null } }
    );

    await batch.deleteOne();

    res.json({
      message: "Batch deleted successfully"
    });

  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
};
export const generateBatch = async (req, res) => {
  try {
    const { batchId } = req.params;

    const batch = await Batch.findById(batchId).populate("courseTemplate");

    if (!batch) {
      return res.status(404).json({ message: "Batch not found" });
    }

    if (batch.executionGenerated) {
      return res.json({
        message: "Batch already generated",
        alreadyGenerated: true
      });
    }

    /* ===== GET TEMPLATE MODULES ===== */

    const modules = await Module.find({
      course: batch.courseTemplate._id
    }).sort({ weekNumber: 1 });

    for (const module of modules) {

      /* ===== CREATE BATCH MODULE ===== */

      const batchModule = await BatchModule.create({
        batch: batch._id,
        templateModule: module._id,
        weekNumber: module.weekNumber,
        status: "upcoming"
      });

      /* ===== GET TEMPLATE CONTENT ===== */

      const contents = await Content.find({
        module: module._id
      }).sort({ dayNumber: 1, order: 1 });

      if (!contents.length) continue;

      /* ===== CREATE SESSIONS ===== */

      const batchContents = contents.map(content => ({
        batch: batch._id,
        batchModule: batchModule._id,

        templateContent: content._id,

        title: content.title,     // ⭐ session title
        materials: [],            // ⭐ required for your schema

        unlocked: false,
        isFromTemplate: true,
        contentStatus: "scheduled"
      }));

      await BatchContent.insertMany(batchContents);
    }

    batch.executionGenerated = true;
    await batch.save();

    return res.json({
      message: "Batch generated successfully",
      generated: true
    });

  } catch (error) {
    console.error("Generate batch error:", error);
    return res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
};


export const getBatchStructure = async (req, res) => {
  try {
    const { batchId } = req.params;

    /* ===== batch ===== */
    const batch = await Batch.findById(batchId)
      .populate("faculty", "name email")
      .populate("courseTemplate", "title");

    if (!batch) {
      return res.status(404).json({ message: "Batch not found" });
    }

    /* ===== batch modules + template ===== */
    const modules = await BatchModule.find({ batch: batchId })
      .populate("templateModule") // ⭐ IMPORTANT
      .sort({ weekNumber: 1 })
      .lean();

    const moduleIds = modules.map(m => m._id);

    /* ===== batch contents + template ===== */
    const contents = await BatchContent.find({
      batchModule: { $in: moduleIds }
    })
      .populate("templateContent") // ⭐ IMPORTANT
      .lean();

    /* ===== group contents ===== */
    const contentMap = {};

    contents.forEach(c => {
      const key = c.batchModule.toString();
      if (!contentMap[key]) contentMap[key] = [];
      contentMap[key].push(c);
    });

    const modulesWithContent = modules.map(m => ({
      ...m,
      contents: contentMap[m._id.toString()] || []
    }));

    res.json({
      batch,
      modules: modulesWithContent
    });

  } catch (error) {
    console.error("getBatchStructure error:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
};


export const toggleUnlockBatchContent = async (req, res) => {
  try {
    const { id } = req.params;
    const { unlocked } = req.body;

    const content = await BatchContent.findByIdAndUpdate(
      id,
      { unlocked },
      { new: true }
    );

    if (!content) {
      return res.status(404).json({ message: "Batch content not found" });
    }

    res.json(content);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};




export const setTemplateVisibility = async (req, res) => {
  try {
    const { id } = req.params;
    const { isTemplateHidden } = req.body;

    if (typeof isTemplateHidden !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "isTemplateHidden must be boolean"
      });
    }

    const item = await BatchContent.findByIdAndUpdate(
      id,
      { isTemplateHidden },
      { new: true }
    );

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "BatchContent not found"
      });
    }

    return res.json({
      success: true,
      data: item
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


export const addBatchContent = async (req, res) => {
  try {
    let {
      batch,
      batchModule,
      batchContentId,
      title,
      contentType,
      duration
    } = req.body;

    if (!title) {
      return res.status(400).json({
        message: "title required"
      });
    }

    let url = "";

    /* FILE */
    if (req.file) {
      url = req.file.path;

      if (req.file.mimetype === "application/pdf") {
        contentType = "pdf";
      } else if (req.file.mimetype.startsWith("video/")) {
        contentType = "video";
      }
    }

    /* LINK */
    if (!url && req.body.contentUrl) {
      url = req.body.contentUrl;
      contentType = "link";
    }

    if (!url && contentType !== "live_session") {
      return res.status(400).json({
        message: "Material required"
      });
    }

    /* =====================================================
       ⭐ CASE 1 → ADD MATERIAL TO EXISTING SESSION
    ====================================================== */

    if (batchContentId) {

      const session = await BatchContent.findById(batchContentId);

      if (!session) {
        return res.status(404).json({ message: "Batch content not found" });
      }

      session.materials.push({
        title,
        type: contentType || "link",
        url,
        duration: duration || 0
      });

      await session.save();

      return res.json({
        message: "Material added",
        content: session
      });
    }

    /* =====================================================
       ⭐ CASE 2 → CREATE NEW SESSION
    ====================================================== */

    if (!batch || !batchModule) {
      return res.status(400).json({
        message: "batch and batchModule required to create session"
      });
    }

    const newSession = await BatchContent.create({
      batch,
      batchModule,
      title,
      materials: [
        {
          title,
          type: contentType || "link",
          url,
          duration: duration || 0,
          isPrimary: true
        }
      ],
      isFromTemplate: false,
      unlocked: false,
      contentStatus: "scheduled"
    });

    res.json({
      message: "Batch session created",
      content: newSession
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};


export const updateBatchContentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { contentStatus } = req.body;

    const allowed = ["scheduled","live","completed","cancelled"];

    if (!allowed.includes(contentStatus)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const content = await BatchContent.findByIdAndUpdate(
      id,
      { contentStatus },
      { new: true }
    );

    res.json(content);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};




export const setBatchPublishStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isPublished } = req.body;

    if (typeof isPublished !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "isPublished must be boolean"
      });
    }

    const batch = await Batch.findByIdAndUpdate(
      id,
      { isPublished },
      { new: true }
    );

    if (!batch) {
      return res.status(404).json({
        success: false,
        message: "Batch not found"
      });
    }

    res.json({
      success: true,
      data: batch
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};



// controllers/batchModuleController.js

export const updateBatchModuleStatus = async (req, res) => {
  try {
    const { batchId, moduleId } = req.params;
    const { status } = req.body;

    // validate status
    if (!["upcoming", "ongoing", "completed"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    // ensure module belongs to batch (important security)
    const module = await BatchModule.findOne({
      _id: moduleId,
      batch: batchId
    });

    if (!module) {
      return res.status(404).json({ message: "Batch module not found in this batch" });
    }

    module.status = status;
    await module.save();

    res.json(module);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
export const getOngoingModule = async (req, res) => {
  try {
    const { batchId } = req.query;   // ⭐ FIX HERE

    if (!batchId) {
      return res.status(400).json({ message: "batchId required" });
    }

    const module = await BatchModule.findOne({
      batch: batchId,
      status: "ongoing"
    }).populate("templateModule", "title");

    res.json(module);

  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};


export const getContentsByModule = async (req, res) => {
  try {
    const { moduleId } = req.params;

    const contents = await BatchContent.find({
      batchModule: moduleId
    })
      .select("_id title contentStatus")
      .sort({ createdAt: 1 });

    res.json(contents);

  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};


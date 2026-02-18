

import Batch from "../models/Batch.js";
import BatchModule from "../models/BatchModule.js";
import BatchContent from "../models/BatchContent.js";
import Module from "../models/Module.js";
import Content from "../models/Content.js";
import Course from "../models/Course.js";

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
      maxStudents
    });

    res.status(201).json({
      message: "Batch created successfully",
      batch
    });

  } catch (error) {
    console.error(error);
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
      .populate("courseTemplate", "title description")
      .populate("faculty", "name email");

    if (!batch) {
      return res.status(404).json({
        message: "Batch not found"
      });
    }

    const modules = await BatchModule.find({ batch: id })
      .populate("templateModule", "title weekNumber")
      .sort({ weekNumber: 1 });

    const contents = await BatchContent.find({ batch: id })
      .populate("templateContent", "title contentType dayNumber")
      .sort({ scheduledDate: 1 });

    const studentCount = await Enrollment.countDocuments({
      batch: id,
      paymentStatus: { $in: ["paid", "free"] }
    });

    res.json({
      batch,
      modules,
      contents,
      studentCount
    });

  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message
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
    const { id } = req.params;

    const batch = await Batch.findById(id);

    if (!batch) {
      return res.status(404).json({
        message: "Batch not found"
      });
    }

    await BatchModule.deleteMany({ batch: id });
    await BatchContent.deleteMany({ batch: id });
    await Enrollment.updateMany(
      { batch: id },
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

    const batch = await Batch.findById(batchId)
      .populate("courseTemplate");

    if (!batch) {
      return res.status(404).json({ message: "Batch not found" });
    }

    const modules = await Module.find({
      course: batch.courseTemplate._id
    }).sort({ weekNumber: 1 });

    for (const module of modules) {

      const batchModule = await BatchModule.create({
        batch: batch._id,
        templateModule: module._id,
        weekNumber: module.weekNumber
      });

      const contents = await Content.find({
        module: module._id
      }).sort({ dayNumber: 1, order: 1 });

      for (const content of contents) {

        await BatchContent.create({
          batch: batch._id,
          batchModule: batchModule._id,
          templateContent: content._id,
          scheduledDate: null, // 🔥 manual
          contentStatus: "scheduled"
        });
      }
    }

    res.json({ message: "Batch generated successfully" });

  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
};

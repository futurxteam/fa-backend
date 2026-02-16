import Course from "../models/Course.js";
import Enrollment from "../models/Enrollment.js";
import Module from "../models/Module.js";
import Content from "../models/Content.js";
import Assessment from "../models/Assessment.js";
import Submission from "../models/Submission.js";

// Step 1: Create/Update Basic Details
export const createOrUpdateStep1 = async (req, res) => {
    try {
        const { courseId, title, description, courseType, price, faculty } = req.body;

        console.log('Received course data:', { courseId, title, description, courseType, price, faculty });
        console.log('Price type:', typeof price, 'Value:', price);

        // Ensure price is a number
        const parsedPrice = Number(price) || 0;

        let course;

        if (courseId) {
            // Update existing draft
            course = await Course.findById(courseId);
            if (!course) {
                return res.status(404).json({ message: 'Course not found' });
            }

            // Only allow updates if in draft or rejected status
            if (course.status !== 'draft' && course.status !== 'rejected') {
                return res.status(400).json({
                    message: 'Cannot edit course in current status'
                });
            }

            course.title = title;
            course.description = description;
            course.courseType = courseType;
            course.price = parsedPrice;
            course.faculty = faculty;
            course.currentStep = Math.max(course.currentStep, 1);

        } else {
            // Create new course
            course = new Course({
                title,
                description,
                courseType,
                price: parsedPrice,
                faculty,
                createdBy: req.user._id,
                currentStep: 1,
                status: 'draft'
            });
        }

        await course.save();

        res.json({
            message: 'Step 1 saved successfully',
            course
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Step 2: Update Course Policies
export const updateStep2 = async (req, res) => {
    try {
        const { courseId, unlockMode, finalAssessmentRequired } = req.body;

        const course = await Course.findById(courseId);

        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        if (course.status !== 'draft' && course.status !== 'rejected') {
            return res.status(400).json({
                message: 'Cannot edit course in current status'
            });
        }

        course.unlockMode = unlockMode;
        course.finalAssessmentRequired = finalAssessmentRequired;
        course.currentStep = Math.max(course.currentStep, 2);

        await course.save();

        res.json({
            message: 'Step 2 saved successfully',
            course
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Submit Course for Review
export const submitForReview = async (req, res) => {
    try {
        const { id } = req.params;

        const course = await Course.findById(id);

        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        // Only allow submission from draft or rejected
        if (course.status !== 'draft' && course.status !== 'rejected') {
            return res.status(400).json({
                message: 'Course already submitted or published'
            });
        }
if (course.unlockMode === "graded_unlock") {

    const modules = await Module.find({ course: course._id });

    for (let module of modules) {

        if (module.order > 1) {

            const previousModule = await Module.findOne({
                course: course._id,
                order: module.order - 1
            });

            const assessment = await Assessment.findOne({
                module: previousModule?._id
            });

            if (!assessment) {
                return res.status(400).json({
                    message: `Module "${module.title}" cannot unlock because previous module has no assessment`
                });
            }
        }
    }
}

        course.status = 'in_review';
        course.isComplete = true;
        course.reviewNotes = ''; // Clear previous rejection notes

        await course.save();

        res.json({
            message: 'Course submitted for admin review',
            course
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get Courses by Status (for faculty/admin)
export const getCoursesByStatus = async (req, res) => {
    try {
        const { status } = req.query;

        let filter = {};

        if (status) {
            filter.status = status;
        }

        // If faculty, only show their courses
        if (req.user.role === 'faculty') {
            filter.$or = [
                { createdBy: req.user._id },
                { faculty: req.user._id }
            ];
        }

        const courses = await Course.find(filter)
            .populate('faculty', 'name email')
            .populate('createdBy', 'name email')
            .sort({ createdAt: -1 });

        res.json({ courses });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get Single Course
export const getCourseById = async (req, res) => {
    try {
        const { id } = req.params;

        const course = await Course.findById(id)
            .populate('faculty', 'name email')
            .populate('createdBy', 'name email');

        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        res.json({ course });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Admin: Approve Course
export const approveCourse = async (req, res) => {
    try {
        const { id } = req.params;

        const course = await Course.findById(id);

        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        if (course.status !== 'in_review') {
            return res.status(400).json({
                message: 'Course is not in review status'
            });
        }

        course.status = 'published';
        course.reviewNotes = '';

        await course.save();

        res.json({
            message: 'Course approved and published',
            course
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Admin: Reject Course
export const rejectCourse = async (req, res) => {
    try {
        const { id } = req.params;
        const { reviewNotes } = req.body;

        const course = await Course.findById(id);

        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        if (course.status !== 'in_review') {
            return res.status(400).json({
                message: 'Course is not in review status'
            });
        }

        course.status = 'rejected';
        course.reviewNotes = reviewNotes || 'Course needs corrections';

        await course.save();

        res.json({
            message: 'Course rejected',
            course
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// ========== STUDENT APIs ==========

// Get all published courses (public access)
export const getPublishedCourses = async (req, res) => {
    try {
        const courses = await Course.find({ status: 'published' })
            .populate('faculty', 'name email')
            .select('title description courseType price thumbnail createdAt')
            .sort({ createdAt: -1 });

        res.json({ courses });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const getStudentCourseDetails = async (req, res) => {
  try {
    const { courseId } = req.params;
    const studentId = req.user._id;

    const course = await Course.findById(courseId)
      .populate("faculty", "name email");

    if (!course || course.status !== "published") {
      return res.status(404).json({ message: "Course not found" });
    }

    const enrollment = await Enrollment.findOne({
      student: studentId,
      course: courseId
    });

    const isEnrolled = !!enrollment;

    let modules = await Module.find({ course: courseId })
      .sort({ order: 1 });

    if (!isEnrolled) {
      modules = modules.filter(module => module.isFree);
    }

    const modulesWithContent = [];

    for (let i = 0; i < modules.length; i++) {

      const module = modules[i];
      let isLocked = false;

      // 🔥 CHECK IF MODULE COMPLETED
      const isCompleted = enrollment?.completedModules?.some(
        m => m.toString() === module._id.toString()
      ) || false;

      // ================= LOCK LOGIC =================
      if (isEnrolled && module.order !== 1) {

        const previousModule = modules.find(
          m => m.order === module.order - 1
        );

        if (previousModule) {

          // FREEFLOW → always unlocked
          if (course.unlockMode === "freeflow") {
            isLocked = false;
          }

          // SEQUENTIAL → unlock if previous module completed
          if (course.unlockMode === "sequential") {

            const previousCompleted = enrollment?.completedModules?.some(
              m => m.toString() === previousModule._id.toString()
            );

            if (!previousCompleted) {
              isLocked = true;
            }
          }

          // GRADED UNLOCK → unlock only if passed assessment
          if (course.unlockMode === "graded_unlock") {

            const previousAssessment = await Assessment.findOne({
              module: previousModule._id
            });

            // 🔥 If previous module has NO assessment → unlock
            if (!previousAssessment) {
              isLocked = false;
            } else {
              const passedAttempt = await Submission.findOne({
                student: studentId,
                assessment: previousAssessment._id,
                passed: true
              });

              if (!passedAttempt) {
                isLocked = true;
              }
            }
          }
        }
      }

      const content = await Content.find({
        module: module._id
      }).sort({ order: 1 });

      modulesWithContent.push({
        ...module.toObject(),
        isLocked,
        isCompleted, // 🔥 SEND THIS TO FRONTEND
        content: (!isLocked && (isEnrolled || module.isFree)) ? content : []
      });
    }

    res.json({
      course,
      modules: modulesWithContent,
      isEnrolled,
      enrollment
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
};

// Enroll student in course
export const enrollInCourse = async (req, res) => {
    try {
        const { courseId } = req.body;
        const studentId = req.user._id;

        // Check if course exists and is published
        const course = await Course.findById(courseId);
        if (!course || course.status !== 'published') {
            return res.status(404).json({ message: 'Course not found or not available' });
        }

        // Check if already enrolled
        const Enrollment = (await import('../models/Enrollment.js')).default;
        const existingEnrollment = await Enrollment.findOne({
            student: studentId,
            course: courseId
        });

        if (existingEnrollment) {
            return res.status(400).json({ message: 'Already enrolled in this course' });
        }

        // Create enrollment
        const enrollment = new Enrollment({
            student: studentId,
            course: courseId,
            paymentStatus: course.price === 0 ? 'free' : 'paid' // For now, auto-approve
        });

        await enrollment.save();

        res.json({
            message: 'Successfully enrolled in course',
            enrollment
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

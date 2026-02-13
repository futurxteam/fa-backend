import Assessment from '../models/Assessment.js';
import Submission from '../models/Submission.js';


// ===============================
// FACULTY CONTROLLERS
// ===============================


// ✅ Create Assessment
export const createAssessment = async (req, res) => {
    try {
        const assessment = await Assessment.create(req.body);

        res.status(201).json({
            message: "Assessment created successfully",
            assessment
        });

    } catch (error) {
  console.error(error);  // 🔥 VERY IMPORTANT
  res.status(500).json({ message: error.message });
}

};


// ✅ Get Assessments By Course
export const getAssessmentsByCourse = async (req, res) => {
    try {
        const { courseId } = req.params;

        const assessments = await Assessment.find({ course: courseId })
            .sort({ createdAt: -1 });

        res.json(assessments);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


// ✅ Get Assessment (Faculty Full View)
export const getAssessmentById = async (req, res) => {
    try {
        const assessment = await Assessment.findById(req.params.id);

        if (!assessment) {
            return res.status(404).json({ message: "Assessment not found" });
        }

        res.json(assessment);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


// ✅ Update Assessment
export const updateAssessment = async (req, res) => {
    try {
        const updated = await Assessment.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!updated) {
            return res.status(404).json({ message: "Assessment not found" });
        }

        res.json({
            message: "Assessment updated successfully",
            assessment: updated
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


// ✅ Delete Assessment
export const deleteAssessment = async (req, res) => {
    try {
        const assessment = await Assessment.findById(req.params.id);

        if (!assessment) {
            return res.status(404).json({ message: "Assessment not found" });
        }

        await assessment.deleteOne();

        res.json({ message: "Assessment deleted successfully" });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};



// ===============================
// STUDENT CONTROLLERS
// ===============================


// ✅ Get Assessment (Student Safe Version)
export const getAssessmentForStudent = async (req, res) => {
    try {
        const assessment = await Assessment.findById(req.params.id);

        if (!assessment) {
            return res.status(404).json({ message: "Assessment not found" });
        }

        const safeAssessment = assessment.toObject();

        // Remove correct answers
        safeAssessment.questions = safeAssessment.questions.map(q => {
            delete q.correctOptionIndex;
            return q;
        });

        res.json(safeAssessment);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


// ✅ Submit Assessment (Auto Grade)
export const submitAssessment = async (req, res) => {
    try {
        const { answers } = req.body;
        const studentId = req.user.id;
        const assessmentId = req.params.id;

        const assessment = await Assessment.findById(assessmentId);

        if (!assessment) {
            return res.status(404).json({ message: "Assessment not found" });
        }

        // Check attempt limit
        const previousAttempts = await Submission.countDocuments({
            assessment: assessmentId,
            student: studentId
        });

        if (previousAttempts >= assessment.attemptsAllowed) {
            return res.status(400).json({
                message: "Maximum attempts reached"
            });
        }

        // 🔥 Auto Grade
        let score = 0;
        let totalMarks = 0;

        assessment.questions.forEach((question, index) => {
            totalMarks += question.marks;

            if (answers[index] === question.correctOptionIndex) {
                score += question.marks;
            }
        });

        const passed = score >= assessment.passingMarks;

        const submission = await Submission.create({
            assessment: assessmentId,
            student: studentId,
            answers,
            score,
            totalMarks,
            passed,
            attemptNumber: previousAttempts + 1
        });

        res.json({
            message: "Assessment submitted successfully",
            score,
            totalMarks,
            passed,
            attemptNumber: submission.attemptNumber
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


// ✅ Get Student Results
export const getStudentResults = async (req, res) => {
    try {
        const studentId = req.user.id;

        const results = await Submission.find({
            student: studentId
        }).populate("assessment", "title assessmentType");

        res.json(results);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};



// ✅ Get Assessments By Course (Student Safe List)
export const getStudentAssessmentsByCourse = async (req, res) => {
    try {
        const { courseId } = req.params;

        const assessments = await Assessment.find({
            course: courseId
        }).select("-questions.correctOptionIndex"); // hide answers

        res.json(assessments);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

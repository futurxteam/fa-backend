import Assessment from '../models/Assessment.js';
import Course from '../models/Course.js';

// Create Assessment (Step 5)
export const createAssessment = async (req, res) => {
    try {
        const {
            courseId,
            moduleId,
            title,
            assessmentType,
            totalMarks,
            passingMarks,
            questions
        } = req.body;

        // Verify course exists and is editable
        const course = await Course.findById(courseId);

        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        if (course.status !== 'draft' && course.status !== 'rejected') {
            return res.status(400).json({
                message: 'Cannot edit course in current status'
            });
        }

        const assessment = new Assessment({
            course: courseId,
            module: moduleId || null,
            title,
            assessmentType,
            totalMarks,
            passingMarks,
            questions
        });

        await assessment.save();

        // Update course step
        course.currentStep = Math.max(course.currentStep, 5);
        await course.save();

        res.json({
            message: 'Assessment created successfully',
            assessment
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get Assessments by Course
export const getAssessmentsByCourse = async (req, res) => {
    try {
        const { courseId } = req.params;

        const assessments = await Assessment.find({ course: courseId })
            .populate('module', 'title order');

        res.json({ assessments });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get Assessment by ID
export const getAssessmentById = async (req, res) => {
    try {
        const { id } = req.params;

        const assessment = await Assessment.findById(id)
            .populate('course', 'title')
            .populate('module', 'title');

        if (!assessment) {
            return res.status(404).json({ message: 'Assessment not found' });
        }

        res.json({ assessment });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Update Assessment
export const updateAssessment = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const assessment = await Assessment.findById(id).populate('course');

        if (!assessment) {
            return res.status(404).json({ message: 'Assessment not found' });
        }

        // Check if course is editable
        if (assessment.course.status !== 'draft' && assessment.course.status !== 'rejected') {
            return res.status(400).json({
                message: 'Cannot edit assessment - course is not in draft status'
            });
        }

        Object.assign(assessment, updates);
        await assessment.save();

        res.json({
            message: 'Assessment updated successfully',
            assessment
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Delete Assessment
export const deleteAssessment = async (req, res) => {
    try {
        const { id } = req.params;

        const assessment = await Assessment.findById(id).populate('course');

        if (!assessment) {
            return res.status(404).json({ message: 'Assessment not found' });
        }

        // Check if course is editable
        if (assessment.course.status !== 'draft' && assessment.course.status !== 'rejected') {
            return res.status(400).json({
                message: 'Cannot delete assessment - course is not in draft status'
            });
        }

        await Assessment.findByIdAndDelete(id);

        res.json({ message: 'Assessment deleted successfully' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

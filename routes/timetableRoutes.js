import express from "express";
import { authenticate, authorize } from "../middleware/roleAuth.js";
import {
    createOrUpdateTimetable,
    getTimetableByBatch,
    toggleAttendance,
    removeStudentAttendance,
    getStudentAttendanceSummary
} from "../controllers/timetableController.js";

const router = express.Router();

// Create or update a timetable entry (date + sessions)
router.post(
    "/",
    authenticate, authorize("admin", "faculty"),
    createOrUpdateTimetable
);

// Get all timetable entries for a batch
router.get(
    "/batch/:batchId",
    authenticate, authorize("admin", "faculty"),
    getTimetableByBatch
);

// Toggle a student's attendance on a session
router.post(
    "/attendance/toggle",
    authenticate, authorize("admin", "faculty"),
    toggleAttendance
);

// Remove a student from attendance
router.post(
    "/attendance/remove",
    authenticate, authorize("admin", "faculty"),
    removeStudentAttendance
);

// Get attendance summary for a student in a batch (for View tab)
router.get(
    "/attendance/student/:batchId/:studentId",
    authenticate, authorize("admin", "faculty"),
    getStudentAttendanceSummary
);

export default router;

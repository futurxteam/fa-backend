import express from "express";
import { getPublishedLiveCourses,getPublishedBatchDetails,enrollInBatch,getStudentBatchAssessments,getAttendanceByStudentAndBatch,
    getMeetAttendanceByStudentAndDate,getBatchModuleProgress,markAttendance
} from "../controllers/LiveStudentController.js";
import { authenticate, authorize } from '../middleware/roleAuth.js';

const router = express.Router();

router.get("/courses/live",authenticate,authorize("student"), getPublishedLiveCourses);
router.get("/batches/:batchId",authenticate,authorize("student"), getPublishedBatchDetails);
router.post("/batches/:batchId/enroll", authenticate, authorize("student"), enrollInBatch);
router.get("/batches/:batchId/assessments", authenticate,authorize("student"), getStudentBatchAssessments);
router.get(
  "/student/:studentId/batch/:batchId",authenticate,authorize("student","admin","faculty"),
  getAttendanceByStudentAndBatch
);
router.get(
  "/meet-attendance/:studentId",authenticate,authorize("admin","faculty"),
  getMeetAttendanceByStudentAndDate
);
router.get(
  "/progress/module/:batchModuleId",
  authenticate,authorize("admin","faculty"),
  getBatchModuleProgress
);
router.post("/attendance/mark", authenticate,authorize("admin","faculty"), markAttendance);
export default router;
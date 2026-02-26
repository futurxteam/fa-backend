import express from "express";
import { getPublishedLiveCourses,getPublishedBatchDetails,enrollInBatch,getStudentBatchAssessments} from "../controllers/LiveStudentController.js";
import { authenticate, authorize } from '../middleware/roleAuth.js';

const router = express.Router();

router.get("/courses/live",authenticate,authorize("student"), getPublishedLiveCourses);
router.get("/batches/:batchId",authenticate,authorize("student"), getPublishedBatchDetails);
router.post("/batches/:batchId/enroll", authenticate, authorize("student"), enrollInBatch);
router.get("/batches/:batchId/assessments", authenticate,authorize("student"), getStudentBatchAssessments);
export default router;
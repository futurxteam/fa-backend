import express from "express";
import { getPublishedLiveCourses,getPublishedBatchDetails,enrollInBatch } from "../controllers/LiveStudentController.js";
import { authenticate, authorize } from '../middleware/roleAuth.js';

const router = express.Router();

router.get("/courses/live",authenticate,authorize("student"), getPublishedLiveCourses);
router.get("/batches/:batchId",authenticate,authorize("student"), getPublishedBatchDetails);
router.post("/batches/:batchId/enroll", authenticate, authorize("student"), enrollInBatch);
export default router;
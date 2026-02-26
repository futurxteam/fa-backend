import express from "express";
import {
  createBatch,
  getAllBatches,
  getBatchById,
  updateBatch,
  deleteBatch,
  generateBatch,
  getBatchStructure,
  setBatchPublishStatus,
  updateBatchModuleStatus,
  getContentsByModule,
  getOngoingModule,
  toggleBatchStatus,
  createLiveAssessment,
  getBatchModuleAssessments,
  getAssessmentWithSubmissions
} from "../controllers/batchController.js";
import { authenticate, authorize } from '../middleware/roleAuth.js';
import { getModulesByCourse } from "../controllers/ModuleController.js";

const router = express.Router();

router.post("/",  authenticate,
  authorize("admin", "faculty"), createBatch);
router.get("/",  authenticate,
  authorize("admin", "faculty"), getAllBatches);
router.get("/:id",  authenticate,
  authorize("admin", "faculty"), getBatchById);
router.put("/:id",  authenticate,
  authorize("admin", "faculty"), updateBatch);
router.delete("/:batchId",  authenticate,
  authorize("admin", "faculty"), deleteBatch);
router.post(
  "/:batchId/generate",
  authenticate,
  authorize("admin", "faculty"),
  generateBatch
);
router.get("/:batchId/structure", authenticate, authorize("admin", "faculty"), getBatchStructure);
router.patch("/:id/publish",authenticate, authorize("admin"), setBatchPublishStatus);
router.patch("/:batchId/modules/:moduleId/status", authenticate, authorize("admin", "faculty"), updateBatchModuleStatus);
router.get("/module/ongoing", authenticate, authorize("admin", "faculty"), getOngoingModule);
router.get("/module/:moduleId/contents", authenticate, authorize("admin", "faculty"), getContentsByModule);
router.patch("/:id/toggle-status", authenticate, authorize("admin"), toggleBatchStatus);
router.post("/:batchId/live-assessment", authenticate, authorize("admin", "faculty"), createLiveAssessment);
router.get(  "/module/:batchModuleId/assessments",  authenticate,  getBatchModuleAssessments);
router.get("/assessment/:assessmentId/submissions", authenticate, authorize("admin", "faculty"), getAssessmentWithSubmissions);

export default router;

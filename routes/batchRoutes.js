import express from "express";
import {
  createBatch,
  getAllBatches,
  getBatchById,
  updateBatch,
  deleteBatch,
  generateBatch,
  getBatchStructure
} from "../controllers/batchController.js";
import { authenticate, authorize } from '../middleware/roleAuth.js';

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

export default router;

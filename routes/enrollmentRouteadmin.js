import {toggleModuleAvailability,getEnrollmentsByBatch} from "../controllers/EnrollmentControllerAdmin.js";
import express from "express";
import { authenticate, authorize } from "../middleware/roleAuth.js";    
const router = express.Router();

// routes/enrollment.js

router.get("/by-batch/:batchId", authenticate, authorize("admin"), getEnrollmentsByBatch);
router.post("/toggle-availability", authenticate, authorize("admin"), toggleModuleAvailability);

export default router;
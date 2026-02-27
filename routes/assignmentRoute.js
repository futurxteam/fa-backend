import express from "express";
import { createAssignment } from "../controllers/AssignmentController.js";
import { authenticate,authorize  } from "../middleware/roleAuth.js";
const router = express.Router();
router.post("/create", authenticate, authorize("faculty","admin"), createAssignment);
export default router;
import express from "express";
import {
  addBatchContent,
  toggleUnlockBatchContent,
  setTemplateVisibility,
  updateBatchContentStatus
} from "../controllers/batchController.js";

import { authenticate, authorize } from "../middleware/roleAuth.js";
import videoUpload from "../middleware/videoUpload.js";

const router = express.Router();

/* ================= ADD EXTRA CONTENT ================= */
/*
Faculty/Admin can add batch content
Supports video/pdf upload like Content
*/
router.post(
  "/",
  authenticate,
  authorize("faculty", "admin"),
  videoUpload.single("file"), // keep "file" to match frontend FormData
  addBatchContent
);

/* ================= UNLOCK / LOCK ================= */
router.patch(
  "/:id/unlock",
  authenticate,
  authorize("faculty", "admin"),
  toggleUnlockBatchContent
);

/* ================= HIDE TEMPLATE ================= */
router.patch(
  "/:id/hide-template",
  authenticate,
  authorize("faculty", "admin"),
  setTemplateVisibility
);

router.patch("/:id/template-visibility", setTemplateVisibility);


/* ================= UPDATE STATUS ================= */
router.patch(
  "/:id/status",
  authenticate,
  authorize("faculty", "admin"),
  updateBatchContentStatus
);

export default router;

import express from "express";
import { createMeetFromContent,getNextMeet,getSignature,getMeetById,updateMeet } from "../controllers/meetController.js";
import { authenticate ,authorize} from "../middleware/roleAuth.js";
const router = express.Router();

router.post("/create", authenticate, authorize("admin"), createMeetFromContent);
router.put("/:meetId", authenticate, authorize("admin"), updateMeet);
router.get("/next/:batchId", authenticate, getNextMeet);
router.get("/byId/:meetId", authenticate, getMeetById);
router.post("/signature", getSignature);
export default router;
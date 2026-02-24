import express from "express";
import {getNextMeet,getSignature,getMeetById,createOrUpdateMeet,getMeetByBatch
    
 } from "../controllers/meetController.js";
import { authenticate ,authorize} from "../middleware/roleAuth.js";
const router = express.Router();

router.post("/createOrUpdate", authenticate, authorize("admin"), createOrUpdateMeet);
router.get("/bybatchId/:batchId", authenticate, getMeetByBatch);
router.get("/next/:batchId", authenticate, getNextMeet);
router.get("/byId/:meetId", authenticate, getMeetById);
router.post("/signature", getSignature);
export default router;
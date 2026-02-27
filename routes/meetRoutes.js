import express from "express";
import {getNextMeet,getSignature,getMeetById,createOrUpdateMeet,getMeetByBatch,markMeetJoin,markMeetLeave,getMeetAttendance,getStudentMeetAttendance}from "../controllers/meetController.js";
import { authenticate ,authorize} from "../middleware/roleAuth.js";
const router = express.Router();

router.post("/createOrUpdate", authenticate, authorize("admin"), createOrUpdateMeet);
router.get("/bybatchId/:batchId", authenticate, getMeetByBatch);
router.get("/next/:batchId", authenticate, getNextMeet);
router.get("/byId/:meetId", authenticate, getMeetById);
router.post("/signature", getSignature);

/* ⭐ STUDENT — JOIN */
router.post("/join", authenticate, authorize("student"), markMeetJoin);

/* ⭐ STUDENT — LEAVE */
router.post("/leave", authenticate, authorize("student"), markMeetLeave);

/* ⭐ ADMIN / FACULTY — VIEW MEET ATTENDANCE */
router.get(
  "/meet/:meetId",
  authenticate,
  authorize("admin", "faculty"),
  getMeetAttendance
);

/* ⭐ STUDENT — OWN ATTENDANCE */
router.get(
  "/my/:meetId",
  authenticate,
  authorize("student,admin,faculty"),
  getStudentMeetAttendance
);
export default router;





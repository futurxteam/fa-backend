import Meet from "../models/meet.js";
import BatchContent from "../models/BatchContent.js";
import crypto from "crypto";
import dotenv from "dotenv";
import Enrollment from "../models/Enrollment.js";
import MeetAttendance from "../models/MeetAttendance.js";

dotenv.config();

export const getNextMeet = async (req, res) => {
  try {
    const { batchId } = req.params;

    const meet = await Meet.findOne({
      batch: batchId,
      status: { $in: ["scheduled", "live"] }
    }).sort({ scheduledAt: 1 });

    res.json(meet);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

export const getSignature = (req, res) => {
  const { meetingNumber, role } = req.body;

  const sdkKey = process.env.ZOOM_SDK_KEY;
  const sdkSecret = process.env.ZOOM_SDK_SECRET;

  const iat = Math.floor(Date.now() / 1000) - 30;
  const exp = iat + 60 * 60 * 2;

  const payload = {
    sdkKey,
    appKey: sdkKey,
    mn: meetingNumber,
    role,
    iat,
    exp,
    tokenExp: exp
  };

  const header = { alg: "HS256", typ: "JWT" };

  const base64Header = Buffer.from(JSON.stringify(header)).toString("base64url");
  const base64Payload = Buffer.from(JSON.stringify(payload)).toString("base64url");

  const signaturePart = crypto
    .createHmac("sha256", sdkSecret)
    .update(`${base64Header}.${base64Payload}`)
    .digest("base64url");

  const signature = `${base64Header}.${base64Payload}.${signaturePart}`;

  res.json({ signature, sdkKey });
};

export const getMeetById = async (req, res) => {
  try {
    const meet = await Meet.findById(req.params.meetId)
      .populate("batch", "batchName")
      .populate({
        path: "batchModule",
        populate: {
          path: "templateModule",
          select: "title"
        }
      })
      .populate("batchContent", "title");

    if (!meet) {
      return res.status(404).json({ message: "Meet not found" });
    }

    res.json(meet);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};
export const createOrUpdateMeet = async (req, res) => {
  try {
    const { batchId, moduleId, contentId, meetingNumber, password, startTime, endTime, duration } = req.body;

    let meet = await Meet.findOne({ batch: batchId });

    if (!meet) {
      meet = new Meet({ batch: batchId });
    }

    if (moduleId !== undefined) meet.batchModule = moduleId;
    if (contentId !== undefined) meet.batchContent = contentId;

    if (meetingNumber !== undefined)
      meet.meetingNumber = meetingNumber.replace(/\s/g, "");

    if (password !== undefined) meet.password = password;
    if (startTime !== undefined) meet.startTime = startTime;
    if (endTime !== undefined) meet.endTime = endTime;
    if (duration !== undefined) meet.duration = duration;

    await meet.save();

    res.json(meet);

  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};


import mongoose from "mongoose";

export const getMeetByBatch = async (req, res) => {
  try {
    const { batchId } = req.params;

    // ⭐ role from auth middleware
    const userId = req.user.id;
    const role = req.user.role; // admin | instructor | student

    /* ⭐ If student → check enrollment */
    if (role === "student") {
      const enrollment = await Enrollment.findOne({
        student: userId,
        batch: batchId
      });

      if (!enrollment) {
        return res.json(null);
      }
    }

    /* ⭐ Admin / instructor skip check */
    const meet = await Meet.findOne({
      batch: new mongoose.Types.ObjectId(batchId)
    })
      .populate("batch", "batchName")
      .populate({
        path: "batchModule",
        populate: {
          path: "templateModule",
          select: "title"
        }
      })
      .populate("batchContent", "title");

    res.json(meet);

  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};
export const meetJoin = async (req, res) => {
  const { meetId } = req.body;
  const studentId = req.user.id;

  let record = await MeetAttendance.findOne({
    meet: meetId,
    student: studentId
  });

  if (!record) {
    record = await MeetAttendance.create({
      meet: meetId,
      batch: req.body.batchId,
      student: studentId,
      sessions: []
    });
  }

  record.sessions.push({ joinTime: new Date() });
  await record.save();

  res.json(record);
};
export const meetLeave = async (req, res) => {
  const { meetId } = req.body;
  const studentId = req.user.id;

  const record = await MeetAttendance.findOne({
    meet: meetId,
    student: studentId
  });

  if (!record) return res.json(null);

  const last = record.sessions[record.sessions.length - 1];

  if (last && !last.leaveTime) {
    last.leaveTime = new Date();
    last.duration = Math.floor((last.leaveTime - last.joinTime) / 1000);
    record.totalDuration += last.duration;
  }

  await record.save();
  res.json(record);
};


export const markMeetJoin = async (req, res) => {
  try {
    const { meetId, batchId, batchModuleId, batchContentId } = req.body; // ⭐ FIX
    const studentId = req.user.id;

    let record = await MeetAttendance.findOne({
      meet: meetId,
      student: studentId
    });

    /* ================= CREATE ================= */
    if (!record) {
      record = await MeetAttendance.create({
        meet: meetId,
        batch: batchId,
        student: studentId,
        batchModule: batchModuleId,     // ⭐ SAVE
        batchContent: batchContentId,   // ⭐ SAVE
        sessions: [{ joinTime: new Date() }]
      });

      return res.json({ message: "Join recorded" });
    }

    /* ================= PREVENT DUP JOIN ================= */
    const lastSession = record.sessions[record.sessions.length - 1];
    if (lastSession && !lastSession.leaveTime) {
      return res.json({ message: "Already joined" });
    }

    /* ================= BACKFILL (important) ================= */
    if (!record.batchContent && batchContentId) {
      record.batchContent = batchContentId;
    }

    if (!record.batchModule && batchModuleId) {
      record.batchModule = batchModuleId;
    }

    record.sessions.push({ joinTime: new Date() });
    await record.save();

    res.json({ message: "Join recorded" });

  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

export const markMeetLeave = async (req, res) => {
  try {
    const { meetId } = req.body;
    const studentId = req.user.id;

    const record = await MeetAttendance.findOne({
      meet: meetId,
      student: studentId
    });

    if (!record || record.sessions.length === 0)
      return res.json({ message: "No join record" });

    const lastSession = record.sessions[record.sessions.length - 1];

    if (!lastSession.leaveTime) {
      lastSession.leaveTime = new Date();

      const duration = Math.floor(
        (lastSession.leaveTime - lastSession.joinTime) / 1000
      );

      lastSession.duration = duration;

      record.totalDuration += duration;
    }

    await record.save();

    res.json({ message: "Leave recorded" });

  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

/* ================= ADMIN VIEW ================= */
export const getMeetAttendance = async (req, res) => {
  try {
    const list = await MeetAttendance.find({
      meet: req.params.meetId
    })
      .populate("student", "name email")
      .sort({ joinTime: 1 });

    res.json(list);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

/* ================= STUDENT VIEW ================= */
export const getStudentMeetAttendance = async (req, res) => {
  try {
    const record = await MeetAttendance.findOne({
      meet: req.params.meetId,
      student: req.user.id
    });

    res.json(record);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};
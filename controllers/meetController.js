import Meet from "../models/meet.js";
import BatchContent from "../models/BatchContent.js";
import crypto from "crypto";
import dotenv from "dotenv";
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
export const getMeetByBatch = async (req, res) => {
  try {
    const { batchId } = req.params;

    const meet = await Meet.findOne({ batch: batchId })
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
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
    const meet = await Meet.findById(req.params.meetId);

    if (!meet) {
      return res.status(404).json({ message: "Meet not found" });
    }

    res.json(meet);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

export const updateMeet = async (req, res) => {
try {
const { meetId } = req.params;
const data = req.body;

const meet = await Meet.findById(meetId);
if (!meet) return res.status(404).json({ message: "Meet not found" });

if (data.meetingNumber !== undefined)
meet.meetingNumber = data.meetingNumber.replace(/\s/g, "");

if (data.password !== undefined) meet.password = data.password;
if (data.startTime !== undefined) meet.startTime = data.startTime;
if (data.endTime !== undefined) meet.endTime = data.endTime;
if (data.topic !== undefined) meet.topic = data.topic;
if (data.status !== undefined) meet.status = data.status;
if (data.joinUrl !== undefined) meet.joinUrl = data.joinUrl;
if (data.startUrl !== undefined) meet.startUrl = data.startUrl;
if (data.duration !== undefined) meet.duration = data.duration;

await meet.save();

res.json(meet);

} catch (e) {
res.status(500).json({ message: e.message });
}
};


export const createMeetFromContent = async (req, res) => {
try {
const { contentId, meetingNumber, password, startTime, endTime, duration } = req.body;

const content = await BatchContent.findById(contentId)
.populate({
path: "batchModule",
populate: { path: "templateModule", select: "title" }
});

if (!content) {
return res.status(404).json({ message: "BatchContent not found" });
}

/* ⭐ topic auto */
const moduleTitle = content.batchModule?.templateModule?.title || "";
const topic = moduleTitle
? `${moduleTitle} - ${content.title}`
: content.title;

/* prevent duplicate meet per content */
const exists = await Meet.findOne({ batchContent: contentId });
if (exists) {
return res.status(400).json({ message: "Meet already exists for this content" });
}

const meet = await Meet.create({
batch: content.batch,
batchModule: content.batchModule,
batchContent: content._id,

topic,

meetingNumber: meetingNumber?.replace(/\s/g, ""), // ⭐ remove spaces
password,

startTime,
endTime,
duration
});

res.json(meet);

} catch (e) {
console.error(e);
res.status(500).json({ message: e.message });
}
};



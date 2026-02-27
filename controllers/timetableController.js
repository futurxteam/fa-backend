import Timetable from "../models/Timetable.js";
import BatchContent from "../models/BatchContent.js";
import Attendance from "../models/Attendance.js";

/* ─────────────────────────────────────────────
   CREATE OR UPDATE a timetable entry (date)
   Body: { batchId, date, sessions: [{ sessionNo, batchContentId, description }] }
───────────────────────────────────────────── */
export const createOrUpdateTimetable = async (req, res) => {
    try {
        const { batchId, date, sessions } = req.body;

        const normDate = new Date(date);
        normDate.setUTCHours(0, 0, 0, 0);

        let timetable = await Timetable.findOne({ batch: batchId, date: normDate });

        const newSessions = (sessions || []).map((s, idx) => ({
            sessionNo: s.sessionNo ?? idx + 1,
            batchContent: s.batchContentId || null,
            description: s.description || "",
            attendance: null
        }));

        if (!timetable) {
            timetable = await Timetable.create({
                batch: batchId,
                date: normDate,
                sessions: newSessions
            });
        } else {
            /* ⭐ EXTEND instead of replace */
            timetable.sessions.push(...newSessions);

            /* optional: re-number */
            timetable.sessions = timetable.sessions.map((s, i) => ({
                ...s.toObject(),
                sessionNo: i + 1
            }));

            await timetable.save();
        }

        await timetable.populate("sessions.batchContent", "title");

        res.json({ success: true, data: timetable });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
/* ─────────────────────────────────────────────
   GET all timetable entries for a batch
   Includes each session's content title + attendance (with students[])
───────────────────────────────────────────── */
export const getTimetableByBatch = async (req, res) => {
    try {
        const { batchId } = req.params;

        const timetables = await Timetable.find({ batch: batchId })
            .populate("sessions.batchContent", "title contentStatus batchModule")
            .populate({
                path: "sessions.attendance",
                populate: { path: "students.student", select: "name email" }
            })
            .sort({ date: -1 }); // newest first

        res.json({ success: true, data: timetables });
    } catch (err) {
        console.error("getTimetableByBatch:", err);
        res.status(500).json({ message: err.message });
    }
};

/* ─────────────────────────────────────────────
   TOGGLE ATTENDANCE for a student on a session
   Body: { batchId, date, batchModuleId, batchContentId, sessionNo, studentId, source, status }
   - If student already in attendance.students → update status
   - If not → push them
───────────────────────────────────────────── */
export const toggleAttendance = async (req, res) => {
    try {
        const {
            batchId,
            date,
            batchModuleId,
            batchContentId,
            sessionNo,
            studentId,
            source,               // "live" | "recorded" | "manual"
            status,               // "present" | "partial" | "absent"
            watchTimeSeconds,     // ⭐ recorded evidence
            liveDurationSeconds   // ⭐ live evidence
        } = req.body;

        if (!batchId || !date || !batchContentId || !studentId) {
            return res.status(400).json({ message: "batchId, date, batchContentId, studentId required" });
        }

        const normDate = new Date(date);
        normDate.setUTCHours(0, 0, 0, 0);

        // Upsert the Attendance document (one per batch+date+content)
        let attendance = await Attendance.findOneAndUpdate(
            { batch: batchId, date: normDate, batchContent: batchContentId },
            {
                $setOnInsert: {
                    batch: batchId,
                    date: normDate,
                    batchModule: batchModuleId,
                    batchContent: batchContentId,
                    sessionNo: sessionNo || 1,
                    students: []
                }
            },
            { upsert: true, new: true }
        );

        // Check if student already in the array
        const idx = attendance.students.findIndex(
            s => s.student?.toString() === studentId.toString()
        );

        const studentEntry = {
            status: status || "present",
            source: source || "manual",
            watchTimeSeconds: watchTimeSeconds || 0,
            liveDurationSeconds: liveDurationSeconds || 0
        };

        if (idx >= 0) {
            // Update existing entry — preserve any fields not being overwritten
            attendance.students[idx].status = studentEntry.status;
            attendance.students[idx].source = studentEntry.source;
            if (watchTimeSeconds != null) attendance.students[idx].watchTimeSeconds = watchTimeSeconds;
            if (liveDurationSeconds != null) attendance.students[idx].liveDurationSeconds = liveDurationSeconds;
        } else {
            // Push new entry
            attendance.students.push({ student: studentId, ...studentEntry });
        }

        await attendance.save();

        // Link attendance back to timetable session
        await Timetable.updateOne(
            { batch: batchId, date: normDate, "sessions.batchContent": batchContentId },
            { $set: { "sessions.$.attendance": attendance._id } }
        );

        res.json({ success: true, data: attendance });
    } catch (err) {
        console.error("toggleAttendance:", err);
        res.status(500).json({ message: err.message });
    }
};



/* ─────────────────────────────────────────────
   REMOVE a student from attendance (mark absent)
   POST /api/timetable/attendance/remove
───────────────────────────────────────────── */
export const removeStudentAttendance = async (req, res) => {
    try {
        const { batchId, date, batchContentId, studentId } = req.body;

        const normDate = new Date(date);
        normDate.setUTCHours(0, 0, 0, 0);

        const attendance = await Attendance.findOneAndUpdate(
            { batch: batchId, date: normDate, batchContent: batchContentId },
            { $pull: { students: { student: studentId } } },
            { new: true }
        );

        res.json({ success: true, data: attendance });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

/* ─────────────────────────────────────────────
   GET Attendance for a specific student in a batch
   (for the View tab in student panel)
───────────────────────────────────────────── */
export const getStudentAttendanceSummary = async (req, res) => {
    try {
        const { batchId, studentId } = req.params;

        // Get all attendance docs for this batch that include this student
        const docs = await Attendance.find({ batch: batchId })
            .populate("batchContent", "title")
            .sort({ date: -1 });

        // Filter to records where this student appears
        const result = docs
            .map(doc => {
                const entry = doc.students.find(
                    s => s.student?.toString() === studentId.toString()
                );
                if (!entry) return null;
                return {
                    date: doc.date,
                    batchContent: doc.batchContent,
                    sessionNo: doc.sessionNo,
                    status: entry.status,
                    source: entry.source,
                    watchTimeSeconds: entry.watchTimeSeconds || 0,
                    liveDurationSeconds: entry.liveDurationSeconds || 0
                };
            })
            .filter(Boolean);

        res.json({ success: true, data: result });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

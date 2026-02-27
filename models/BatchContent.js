import mongoose from "mongoose";

const BatchContentSchema = new mongoose.Schema({

  batch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Batch",
    required: true
  },

  batchModule: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "BatchModule",
    required: true
  },

  // optional template reference
  templateContent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Content",
    default: null
  },

  /* REAL MATERIAL */
  title: String,
  materials: [
    {
      title: String,
      type: {
        type: String,
        enum: ["video", "pdf", "link", "notes"]
      },
      url: String,
      duration: Number,
      isPrimary: { type: Boolean, default: false }
    }
  ]
  ,

  contentUrl: String,
  duration: Number,

  attachments: [
    { name: String, url: String, fileType: String }
  ],

  unlocked: { type: Boolean, default: false },

  contentStatus: {
    type: String,
    enum: ["scheduled", "live", "completed", "cancelled"],
    default: "scheduled"
  },

  recordingUrl: String,

  isFromTemplate: { type: Boolean, default: false },
  isTemplateHidden: {
    type: Boolean,
    default: false
  }

}, { timestamps: true });

export default mongoose.model("BatchContent", BatchContentSchema);

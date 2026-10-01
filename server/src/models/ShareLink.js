import mongoose from 'mongoose';

const shareLinkSchema = new mongoose.Schema(
  {
    token: { type: String, required: true, unique: true },
    tmId: { type: String, required: true, index: true },  // Ticketmaster event id
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

// One link per (user, event) — generating again returns the existing one
shareLinkSchema.index({ createdBy: 1, tmId: 1 }, { unique: true });

const ShareLink = mongoose.model('ShareLink', shareLinkSchema);
export default ShareLink;

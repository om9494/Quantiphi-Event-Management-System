import mongoose from 'mongoose';

const linkClickSchema = new mongoose.Schema(
  {
    shareLink: { type: mongoose.Schema.Types.ObjectId, ref: 'ShareLink', required: true },
    tmId: { type: String, required: true, index: true },  // denormalised for fast aggregation
    clickerUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    // Hash of IP + user-agent used to deduplicate anonymous visitors.
    // We never store raw IP; only a one-way hash.
    visitorHash: { type: String, required: true },
  },
  { timestamps: true }
);

// One click per unique visitor per share link — prevents click inflation
linkClickSchema.index({ shareLink: 1, visitorHash: 1 }, { unique: true });

const LinkClick = mongoose.model('LinkClick', linkClickSchema);
export default LinkClick;

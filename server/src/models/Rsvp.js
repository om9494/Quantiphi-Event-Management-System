import mongoose from 'mongoose';

// Minimal RSVP model needed now so the events endpoint can check isRsvped.
// Full RSVP endpoints are added in commit 6.
const rsvpSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    // We store tmId directly (not ObjectId ref) because events are sourced from
    // Ticketmaster and may not yet exist in our Event collection at RSVP time.
    tmId: { type: String, required: true },
    status: { type: String, enum: ['going'], default: 'going' },
  },
  { timestamps: true }
);

// Prevent a user from RSVPing to the same event twice
rsvpSchema.index({ user: 1, tmId: 1 }, { unique: true });

const Rsvp = mongoose.model('Rsvp', rsvpSchema);
export default Rsvp;

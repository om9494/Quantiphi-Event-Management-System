import mongoose from 'mongoose';

// Allowed reminder intervals (minutes before the event).
// Validated in the route; kept here as the single source of truth.
export const ALLOWED_REMIND_BEFORE = [30, 60, 1440, 2880, 10080]; // 30m, 1h, 1d, 2d, 1w

const reminderSettingSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    // We use tmId (not ObjectId) for the same reason as Rsvp — event may come from TM
    tmId: { type: String, required: true },
    remindBefore: {
      type: Number,
      enum: ALLOWED_REMIND_BEFORE,
      required: true,
    },
    channel: {
      type: String,
      enum: ['in-app', 'email'],
      default: 'in-app',
    },
    enabled: { type: Boolean, default: true },
    // Flipped to true by the cron job once the notification is dispatched
    sent: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// One reminder setting per (user, event) — updating replaces the previous choice
reminderSettingSchema.index({ user: 1, tmId: 1 }, { unique: true });

// Index for the cron job: find unsent, enabled reminders quickly
reminderSettingSchema.index({ sent: 1, enabled: 1 });

const ReminderSetting = mongoose.model('ReminderSetting', reminderSettingSchema);
export default ReminderSetting;

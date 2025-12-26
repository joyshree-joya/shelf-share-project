import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema(
  {
    // Keep a stable string id for the front-end.
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, required: true },
    avatar: { type: String, default: '' },
    donorPoints: { type: Number, default: 0 },
    badge: { type: String, enum: ['none', 'bronze', 'silver', 'gold'], default: 'none' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

UserSchema.pre('save', function preSave(next) {
  this.updatedAt = new Date();
  next();
});

UserSchema.pre('findOneAndUpdate', function preUpdate(next) {
  this.set({ updatedAt: new Date() });
  next();
});

export const User = mongoose.models.User || mongoose.model('User', UserSchema);

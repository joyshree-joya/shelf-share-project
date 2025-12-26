import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema(
  {
    senderId: { type: String, required: true },
    senderName: { type: String, required: true },
    text: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false, versionKey: false }
);

const DonationRequestSchema = new mongoose.Schema(
  {
    // Keep a string id for the frontend.
    id: { type: String, required: true, unique: true, index: true },

    itemId: { type: String, required: true, index: true },
    itemTitle: { type: String, default: '' },
    itemImage: { type: String, default: '' },

    ownerId: { type: String, required: true, index: true },
    ownerName: { type: String, default: '' },
    ownerEmail: { type: String, default: '' },

    requesterId: { type: String, required: true, index: true },
    requesterName: { type: String, default: '' },
    requesterEmail: { type: String, default: '' },

    // pending -> waiting for owner approval
    // accepted -> owner accepted, communication open
    // denied -> owner rejected
    // completed -> item handed over
    status: { type: String, default: 'pending', index: true },

    messages: { type: [MessageSchema], default: [] },

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    respondedAt: { type: Date },
    completedAt: { type: Date },
  },
  { versionKey: false }
);

DonationRequestSchema.pre('save', function preSave(next) {
  this.updatedAt = new Date();
  next();
});

DonationRequestSchema.pre('findOneAndUpdate', function preUpdate(next) {
  this.set({ updatedAt: new Date() });
  next();
});

export const DonationRequest =
  mongoose.models.DonationRequest ||
  mongoose.model('DonationRequest', DonationRequestSchema);

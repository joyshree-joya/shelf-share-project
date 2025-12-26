import mongoose from 'mongoose';

const ExchangeRequestSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },

    itemId: { type: String, required: true, index: true },
    itemTitle: { type: String, default: '' },

    ownerId: { type: String, required: true, index: true },
    ownerName: { type: String, default: '' },

    requesterId: { type: String, required: true, index: true },
    requesterName: { type: String, default: '' },

    offeredItemId: { type: String, required: true, index: true },
    offeredItemTitle: { type: String, default: '' },

    message: { type: String, default: '' },
    status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    respondedAt: { type: Date },
  },
  { versionKey: false }
);

ExchangeRequestSchema.pre('save', function preSave(next) {
  this.updatedAt = new Date();
  next();
});

ExchangeRequestSchema.pre('findOneAndUpdate', function preUpdate(next) {
  this.set({ updatedAt: new Date() });
  next();
});

export const ExchangeRequest =
  mongoose.models.ExchangeRequest || mongoose.model('ExchangeRequest', ExchangeRequestSchema);

import mongoose from 'mongoose';

const ItemSchema = new mongoose.Schema(
  {
    // We keep a separate `id` field so the front-end can keep using the same shape.
    // (Mongo's `_id` stays as ObjectId.)
    id: { type: String, required: true, unique: true, index: true },

    title: { type: String, required: true },
    description: { type: String, default: '' },
    category: { type: String, required: true },

    tags: { type: [String], default: [] },
    condition: { type: String, default: 'used' },
    rating: { type: Number, default: 5 },
    images: { type: [String], default: [] },
    type: { type: String, default: 'donation' },
    // available -> visible and requestable
    // hold      -> donation requested; waiting/ongoing communication
    // pending   -> used by exchange requests in the existing code
    // taken     -> completed
    status: { type: String, default: 'available' },

    ownerId: { type: String, default: '' },
    ownerName: { type: String, default: '' },
    ownerEmail: { type: String, default: '' },
    ownerAvatar: { type: String, default: '' },

    claimedBy: { type: String, default: '' },
    claimedByName: { type: String, default: '' },
    claimedAt: { type: Date },

    // Donation hold/request state (used when a donation is requested)
    holdBy: { type: String, default: '' },
    holdByName: { type: String, default: '' },
    holdRequestId: { type: String, default: '' },
    holdAt: { type: Date },

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

ItemSchema.pre('save', function preSave(next) {
  this.updatedAt = new Date();
  next();
});

ItemSchema.pre('findOneAndUpdate', function preUpdate(next) {
  this.set({ updatedAt: new Date() });
  next();
});

export const Item = mongoose.models.Item || mongoose.model('Item', ItemSchema);

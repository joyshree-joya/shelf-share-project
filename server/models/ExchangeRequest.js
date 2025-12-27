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

const OfferedItemSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    title: { type: String, default: '' },
    image: { type: String, default: '' },
    category: { type: String, default: '' },
    type: { type: String, default: '' },
  },
  { _id: false, versionKey: false }
);

const ExchangeRequestSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },

    // The item being requested (owned by ownerId)
    itemId: { type: String, required: true, index: true },
    itemTitle: { type: String, default: '' },
    itemImage: { type: String, default: '' },

    ownerId: { type: String, required: true, index: true },
    ownerName: { type: String, default: '' },
    ownerEmail: { type: String, default: '' },

    requesterId: { type: String, required: true, index: true },
    requesterName: { type: String, default: '' },
    requesterEmail: { type: String, default: '' },

    // Up to 4 items offered by requester (snapshot for UI)
    offeredItemIds: { type: [String], default: [], index: true },
    offeredItems: { type: [OfferedItemSchema], default: [] },

    // Owner selects exactly one of the offered items when accepting
    selectedOfferedItemId: { type: String, default: '' },
    selectedOfferedItemTitle: { type: String, default: '' },
    selectedOfferedItemImage: { type: String, default: '' },

    // Optional short note from requester (shown even before chat opens)
    note: { type: String, default: '' },

    // pending -> waiting for owner decision
    // accepted -> owner selected an offer and accepted, chat open
    // denied -> owner denied
    // completed -> exchange done
    status: { type: String, default: 'pending', index: true },

    messages: { type: [MessageSchema], default: [] },

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    respondedAt: { type: Date },
    completedAt: { type: Date },
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
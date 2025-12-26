import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { Item } from './models/Item.js';
import { User } from './models/User.js';
import { DonationRequest } from './models/DonationRequest.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/shelfshare';

async function main() {
  await mongoose.connect(MONGODB_URI);
  // eslint-disable-next-line no-console
  console.log('[migrate] Connected to MongoDB');

  // 1) Update demo/primary user
  const oldName = 'Sudipto Shawon';
  const newName = 'Shreyashi Mukharjee';
  const newEmail = 'shreyashi.mukharjee@shelfshare.com';

  await User.updateMany(
    { $or: [{ id: '1' }, { name: oldName }] },
    { $set: { name: newName, email: newEmail } }
  );

  // 2) Build id->email map
  const users = await User.find({}, { id: 1, email: 1, name: 1 }).lean();
  const emailById = new Map(users.map((u) => [u.id, u.email]));
  const nameById = new Map(users.map((u) => [u.id, u.name]));

  // 3) Update items: ownerName + ownerEmail
  const allItems = await Item.find({}, { id: 1, ownerId: 1, ownerName: 1, ownerEmail: 1 }).lean();
  let updatedItems = 0;
  for (const it of allItems) {
    const email = emailById.get(it.ownerId) || it.ownerEmail || '';
    const name = nameById.get(it.ownerId) || it.ownerName || '';
    const needsName = it.ownerName === oldName || (it.ownerId === '1' && it.ownerName !== newName);
    const needsEmail = !it.ownerEmail || (it.ownerId === '1' && it.ownerEmail !== newEmail);
    if (needsName || needsEmail) {
      await Item.updateOne(
        { id: it.id },
        { $set: { ownerName: needsName ? newName : name, ownerEmail: needsEmail ? (it.ownerId === '1' ? newEmail : email) : email } }
      );
      updatedItems += 1;
    }
  }

  // 4) Update donation requests (for display/communication)
  await DonationRequest.updateMany(
    { ownerName: oldName },
    { $set: { ownerName: newName, ownerEmail: newEmail } }
  );

  // eslint-disable-next-line no-console
  console.log(`[migrate] Updated ${updatedItems} items. Done.`);
  await mongoose.disconnect();
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('[migrate] Failed', err);
  process.exit(1);
});

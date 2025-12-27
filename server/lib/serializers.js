export function toISO(value) {
  if (!value) return new Date().toISOString();
  try {
    return new Date(value).toISOString();
  } catch (_err) {
    return new Date().toISOString();
  }
}

export function toClientUser(doc) {
  const u = doc && doc.toObject ? doc.toObject() : doc;
  if (!u) return null;
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    avatar: u.avatar || undefined,
    donorPoints: u.donorPoints || 0,
    badge: u.badge || 'none',
    createdAt: toISO(u.createdAt),
  };
}

export function toClientItem(doc) {
  const obj = doc && doc.toObject ? doc.toObject() : doc;
  return {
    ...obj,
    createdAt: toISO(obj.createdAt),
    updatedAt: toISO(obj.updatedAt),
    claimedAt: obj.claimedAt ? toISO(obj.claimedAt) : undefined,
  };
}

export function toClientExchange(doc) {
  const obj = doc && doc.toObject ? doc.toObject() : doc;
  return {
    ...obj,
    createdAt: toISO(obj.createdAt),
    updatedAt: toISO(obj.updatedAt),
    respondedAt: obj.respondedAt ? toISO(obj.respondedAt) : undefined,
    completedAt: obj.completedAt ? toISO(obj.completedAt) : undefined,
  };
}
